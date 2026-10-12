from datetime import datetime, timedelta, timezone
import hashlib
import hmac
import re
import secrets
from uuid import uuid4

import jwt
from fastapi import APIRouter, Depends, HTTPException
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session

import models
from database import get_db
from schemas.auth import AdminLogin, AuthSessionResponse, AuthUser, CustomerOtpLogin, CustomerOtpRequest
from services.auth import (
    ADMIN_PASSWORD,
    ADMIN_USERNAME,
    DEMO_USER_MOBILE,
    DEMO_USER_OTP,
    JWT_ISSUER,
    JWT_SECRET_KEY,
JWT_SESSION_HOURS,
)

router = APIRouter(prefix="/auth", tags=["Authentication"])
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/admin/login", auto_error=False)


def _normalize_mobile(value: str) -> str:
    return "".join(re.findall(r"\d", value))


def _otp_hash(challenge_id: str, otp: str) -> str:
    message = f"{challenge_id}:{otp}".encode()
    return hmac.new(JWT_SECRET_KEY.encode(), message, hashlib.sha256).hexdigest()


def _issue_session(db: Session, user: models.User | None, role: str, display_name: str, mobile: str | None = None):
    now = datetime.now(timezone.utc)
    expires_at = now + timedelta(hours=JWT_SESSION_HOURS)
    session_id = str(uuid4())
    auth_session = models.AuthSession(
        id=session_id,
        user_id=user.id if user else None,
        role=role,
        expires_at=expires_at,
    )
    db.add(auth_session)
    db.commit()

    token = jwt.encode(
        {
            "iss": JWT_ISSUER,
            "sub": str(user.id) if user else "admin",
            "user_id": user.id if user else None,
            "role": role,
            "sid": session_id,
            "iat": now,
            "exp": expires_at,
        },
        JWT_SECRET_KEY,
        algorithm="HS256",
    )
    return AuthSessionResponse(
        access_token=token,
        expires_in=JWT_SESSION_HOURS * 60 * 60,
        user=AuthUser(
            id=user.id if user else None,
            name=display_name,
            role=role,
            mobile=mobile,
        ),
    )


@router.post("/customer/request-otp")
def request_customer_otp(payload: CustomerOtpRequest, db: Session = Depends(get_db)):
    mobile = _normalize_mobile(payload.mobile)
    configured_mobile = _normalize_mobile(DEMO_USER_MOBILE)
    now = datetime.now(timezone.utc)
    recent_requests = db.query(models.OtpChallenge).filter(
        models.OtpChallenge.mobile == mobile,
        models.OtpChallenge.created_at >= now - timedelta(minutes=10),
    ).count()
    if recent_requests >= 5:
        raise HTTPException(status_code=429, detail="Too many OTP requests. Try again in a few minutes.")

    old_challenges = db.query(models.OtpChallenge).filter(
        models.OtpChallenge.mobile == mobile,
        models.OtpChallenge.consumed_at.is_(None),
    ).all()
    for old_challenge in old_challenges:
        old_challenge.consumed_at = now

    challenge_id = str(uuid4())
    otp = DEMO_USER_OTP if hmac.compare_digest(mobile, configured_mobile) else f"{secrets.randbelow(1_000_000):06d}"
    challenge = models.OtpChallenge(
        id=challenge_id,
        mobile=mobile,
        code_hash=_otp_hash(challenge_id, otp),
        attempts=0,
        expires_at=now + timedelta(minutes=5),
    )
    db.add(challenge)
    db.commit()
    # This project is explicitly in local-demo OTP mode: expose the generated
    # code to this demo UI instead of pretending an SMS was delivered.
    return {"challenge_id": challenge_id, "demo_otp": otp, "expires_in": 300}


@router.post("/customer/verify-otp", response_model=AuthSessionResponse)
def login_customer(payload: CustomerOtpLogin, db: Session = Depends(get_db)):
    mobile = _normalize_mobile(payload.mobile)
    now = datetime.now(timezone.utc)
    challenge = db.query(models.OtpChallenge).filter(
        models.OtpChallenge.id == payload.challenge_id,
        models.OtpChallenge.mobile == mobile,
    ).with_for_update().first()
    if not challenge or challenge.consumed_at:
        raise HTTPException(status_code=401, detail="OTP request is invalid or already used")
    expiry = challenge.expires_at
    if expiry.tzinfo is None:
        expiry = expiry.replace(tzinfo=timezone.utc)
    if expiry <= now:
        challenge.consumed_at = now
        db.commit()
        raise HTTPException(status_code=401, detail="OTP expired. Request a new code.")
    if challenge.attempts >= 5:
        challenge.consumed_at = now
        db.commit()
        raise HTTPException(status_code=429, detail="Too many incorrect OTP attempts. Request a new code.")

    challenge.attempts += 1
    if not hmac.compare_digest(challenge.code_hash, _otp_hash(challenge.id, payload.otp)):
        if challenge.attempts >= 5:
            challenge.consumed_at = now
        db.commit()
        raise HTTPException(status_code=401, detail="OTP is incorrect")
    challenge.consumed_at = now
    db.commit()

    user = db.query(models.User).filter(models.User.phone_number == mobile).first()
    if not user:
        # Reuse the old single-customer demo account so existing demo orders
        # stay attached to the same customer identity.
        configured_mobile = _normalize_mobile(DEMO_USER_MOBILE)
        user = db.query(models.User).filter(models.User.email == "demo@resolvex.local").first() if mobile == configured_mobile else None
        if user:
            user.phone_number = mobile
            user.role = "customer"
        else:
            user = models.User(
                email=f"demo+{mobile}@resolvex.local",
                name="Demo Customer",
                phone_number=mobile,
                role="customer",
            )
            db.add(user)
        db.commit()
        db.refresh(user)

    return _issue_session(db, user, "customer", user.name, mobile)


@router.post("/admin/login", response_model=AuthSessionResponse)
def login_admin(payload: AdminLogin, db: Session = Depends(get_db)):
    if not hmac.compare_digest(payload.username, ADMIN_USERNAME) or not hmac.compare_digest(payload.password, ADMIN_PASSWORD):
        raise HTTPException(status_code=401, detail="Username or password is incorrect")
    return _issue_session(db, None, "admin", "ResolveX Admin")


def get_current_principal(token: str | None = Depends(oauth2_scheme), db: Session = Depends(get_db)) -> dict:
    if not token:
        raise HTTPException(status_code=401, detail="Sign in to continue", headers={"WWW-Authenticate": "Bearer"})
    try:
        claims = jwt.decode(token, JWT_SECRET_KEY, algorithms=["HS256"], issuer=JWT_ISSUER)
    except jwt.PyJWTError:
        raise HTTPException(status_code=401, detail="Session is invalid or expired", headers={"WWW-Authenticate": "Bearer"})

    session = db.query(models.AuthSession).filter(models.AuthSession.id == claims.get("sid")).first()
    now = datetime.now(timezone.utc)
    session_expiry = session.expires_at if session else None
    if session_expiry and session_expiry.tzinfo is None:
        session_expiry = session_expiry.replace(tzinfo=timezone.utc)
    if not session or session.revoked_at or not session_expiry or session_expiry <= now:
        raise HTTPException(status_code=401, detail="Session has ended", headers={"WWW-Authenticate": "Bearer"})
    if session.role != claims.get("role") or session.user_id != claims.get("user_id"):
        raise HTTPException(status_code=401, detail="Session does not match its account")

    user = db.query(models.User).filter(models.User.id == session.user_id).first() if session.user_id else None
    if session.role == "customer" and not user:
        raise HTTPException(status_code=401, detail="Customer account is unavailable")
    return {"session": session, "user": user, "role": session.role}


def require_customer(principal: dict = Depends(get_current_principal)) -> dict:
    if principal["role"] != "customer":
        raise HTTPException(status_code=403, detail="Customer access is required")
    return principal


def require_admin(principal: dict = Depends(get_current_principal)) -> dict:
    if principal["role"] != "admin":
        raise HTTPException(status_code=403, detail="Admin access is required")
    return principal


@router.get("/me", response_model=AuthUser)
def get_me(principal: dict = Depends(get_current_principal)):
    user = principal["user"]
    return AuthUser(
        id=user.id if user else None,
        name=user.name if user else "ResolveX Admin",
        role=principal["role"],
        mobile=user.phone_number if user else None,
    )


@router.post("/logout")
def logout(principal: dict = Depends(get_current_principal), db: Session = Depends(get_db)):
    principal["session"].revoked_at = datetime.now(timezone.utc)
    db.commit()
    return {"message": "Signed out"}
