from typing import List
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, joinedload

import models
from database import get_db
from schemas.returns import ReturnRequest, ReturnDecision, AdminReview
from services.agent_harness import run_return_harness
from services.policy_engine import evaluate_policy
from services.risk_engine import RISK_REVIEW_THRESHOLD
from services.ai_evidence import evidence_is_valid
from routers.auth_router import require_admin, require_customer

router = APIRouter(prefix="/returns", tags=["Returns"])

def customer_outcome(decision: str, desired_resolution: str, reasons: list[str]) -> tuple[str, str]:
    action = "refund" if desired_resolution == "refund" else "replacement"
    if decision == "AUTO_REFUND":
        return "Your refund request is approved.", "This demo records the approval but does not issue a payment."
    if decision == "AUTO_REPLACE":
        return "Your replacement request is approved.", "This demo records the approval but does not create a shipment."
    if decision == "WARRANTY_SERVICE":
        return f"Your {action} request needs a warranty check.", "A support reviewer will check the warranty and confirm the next step with you."
    if decision == "MANUAL_REVIEW":
        return f"Your {action} request has been sent for review.", "We’ll update this order after a support reviewer checks the details."
    reason = next((reason for reason in reasons if reason in {
        "Order has not been delivered yet",
        "A return request already exists for this item",
        "Product policy does not allow returns",
    } or reason.startswith("Request is outside the ")), None)
    if reason and reason.startswith("Request is outside the "):
        reason = "The return window for this item has ended."
    return "We can’t approve this return request.", reason or "This item does not meet the return policy."


def review_payload(ret):
    item = ret.order_item
    order = item.order
    return AdminReview(
        id=str(ret.id), order_id=f"ORD-{order.id:03d}", product_name=item.product.name,
        price=f"₹{item.unit_price:,.0f}", reason=ret.reason, desired_resolution=ret.desired_resolution,
        description=ret.description,
        evidence=ret.evidence or [], risk_score=ret.risk_score, confidence=ret.confidence,
        risk_level="HIGH" if ret.risk_score >= RISK_REVIEW_THRESHOLD else "LOW",
        risk_threshold=RISK_REVIEW_THRESHOLD, risk_factors=ret.risk_factors or [],
        ai_analysis=ret.ai_analysis or {},
        agent_audit=ret.agent_audit or {},
        status=ret.status.value.upper(), decision=ret.decision, reasons=ret.reasons or [],
        policy_checks=[],
    )


@router.get("/orders")
def list_orders(principal: dict = Depends(require_customer), db: Session = Depends(get_db)):
    """List only the signed-in customer's orders."""
    user_id = principal["user"].id
    orders = db.query(models.Order).options(joinedload(models.Order.items).joinedload(models.OrderItem.product), joinedload(models.Order.items).joinedload(models.OrderItem.item_return)).filter(models.Order.user_id == user_id).order_by(models.Order.id).all()
    return [
        {"orderId": f"ORD-{order.id:03d}", "productName": item.product.name,
         "price": f"₹{item.unit_price:,.0f}", "purchaseDate": order.created_at.isoformat() if order.created_at else None,
         "deliveryDate": None, "status": order.status.value.upper(),
         "returnStatus": item.item_return.status.value.upper() if item.item_return else None,
         "returnDecision": item.item_return.decision if item.item_return else None,
         "desiredResolution": item.item_return.desired_resolution if item.item_return else None}
        for order in orders for item in order.items
    ]


@router.post("/orders/demo")
def create_demo_order(payload: dict, principal: dict = Depends(require_customer), db: Session = Depends(get_db)):
    """Create a completed sample order from the storefront for the local demo."""
    name = str(payload.get("product_name", "")).strip()
    try:
        price = float(payload.get("price"))
    except (TypeError, ValueError):
        raise HTTPException(status_code=422, detail="A valid product price is required")
    if not name or price <= 0:
        raise HTTPException(status_code=422, detail="Product name and positive price are required")
    user = principal["user"]
    product = db.query(models.Product).filter(models.Product.name == name).first()
    if not product:
        product = models.Product(name=name, price=price, stock_quantity=1)
        db.add(product)
        db.flush()
    order = models.Order(user_id=user.id, total_amount=price, status=models.OrderStatus.COMPLETED)
    db.add(order)
    db.flush()
    item = models.OrderItem(order_id=order.id, product_id=product.id, quantity=1, unit_price=price)
    db.add(item)
    db.commit()
    return {"orderId": f"ORD-{order.id:03d}", "productName": name, "price": f"₹{price:,.0f}",
            "purchaseDate": order.created_at.isoformat() if order.created_at else None,
            "deliveryDate": None, "status": "COMPLETED", "returnStatus": None}


@router.post("/", response_model=ReturnDecision)
def create_return(req: ReturnRequest, principal: dict = Depends(require_customer), db: Session = Depends(get_db)):
    try:
        order_id = int(req.order_id.removeprefix("ORD-").lstrip("0") or "0")
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid order ID")
    order = db.query(models.Order).options(joinedload(models.Order.items).joinedload(models.OrderItem.product), joinedload(models.Order.items).joinedload(models.OrderItem.item_return)).filter(models.Order.id == order_id, models.Order.user_id == principal["user"].id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    item = order.items[0] if order.items else None
    if not item:
        raise HTTPException(status_code=404, detail="Order has no items")

    evidence_valid = evidence_is_valid(req.evidence)
    if req.evidence and not evidence_valid:
        raise HTTPException(status_code=422, detail="Evidence must contain valid JPEG, PNG, or WebP images totaling no more than 2 MB")
    orchestration = run_return_harness(db, order, item, req, evidence_valid)
    decision = orchestration["decision"]
    confidence = orchestration["confidence"]
    reasons = orchestration["reasons"]
    risk = orchestration["risk"]
    ai_analysis = orchestration["ai_analysis"]
    ret = models.Return(order_item_id=item.id, reason=req.reason, desired_resolution=req.desired_resolution, description=req.description,
                        evidence=req.evidence, decision=decision, confidence=confidence,
                        risk_score=risk["score"], risk_factors=risk["factors"], reasons=reasons,
                        ai_analysis=ai_analysis, agent_audit=orchestration["agent_audit"],
                        status=models.ReturnStatus.REQUESTED if decision in {"MANUAL_REVIEW", "WARRANTY_SERVICE"} else (models.ReturnStatus.REJECTED if decision == "REJECT" else models.ReturnStatus.APPROVED))
    db.add(ret)
    try:
        db.commit()
    except Exception:
        db.rollback()
        raise HTTPException(status_code=409, detail="A return request already exists for this item")
    db.refresh(ret)
    message, next_step = customer_outcome(decision, req.desired_resolution, reasons)
    return ReturnDecision(id=str(ret.id), decision=decision, desired_resolution=req.desired_resolution,
                          customer_message=message, next_step=next_step)


@router.get("/admin", response_model=List[AdminReview])
def get_admin_reviews(principal: dict = Depends(require_admin), db: Session = Depends(get_db)):
    cases = db.query(models.Return).options(joinedload(models.Return.order_item).joinedload(models.OrderItem.order), joinedload(models.Return.order_item).joinedload(models.OrderItem.product)).filter(models.Return.status == models.ReturnStatus.REQUESTED).all()
    return [review_payload(case) for case in cases]


@router.get("/admin/{review_id}", response_model=AdminReview)
def get_admin_review(review_id: str, principal: dict = Depends(require_admin), db: Session = Depends(get_db)):
    case = db.query(models.Return).options(joinedload(models.Return.order_item).joinedload(models.OrderItem.order), joinedload(models.Return.order_item).joinedload(models.OrderItem.product)).filter(models.Return.id == int(review_id)).first()
    if not case:
        raise HTTPException(status_code=404, detail="Review not found")
    payload = review_payload(case)
    order = case.order_item.order
    item = case.order_item
    _, _, _, checks = evaluate_policy(order, item, ReturnRequest(order_id=payload.order_id, reason=case.reason, desired_resolution=case.desired_resolution, description=case.description, evidence=case.evidence or []), ignore_existing_return=True)
    payload.policy_checks = checks
    return payload


@router.post("/admin/{review_id}/decision")
def make_admin_decision(review_id: str, decision: dict, principal: dict = Depends(require_admin), db: Session = Depends(get_db)):
    case = db.query(models.Return).filter(models.Return.id == int(review_id)).first()
    if not case:
        raise HTTPException(status_code=404, detail="Review not found")
    status_map = {"APPROVED_REFUND": models.ReturnStatus.APPROVED, "APPROVED_REPLACE": models.ReturnStatus.APPROVED,
                  "WARRANTY_SERVICE": models.ReturnStatus.APPROVED, "REJECTED": models.ReturnStatus.REJECTED}
    choice = decision.get("status")
    if choice not in status_map:
        raise HTTPException(status_code=422, detail="Unsupported review decision")
    case.status = status_map[choice]
    case.decision = choice
    audit = dict(case.agent_audit or {})
    events = list(audit.get("events") or [])
    events.append({
        "event": "admin_decision_recorded",
        "at": datetime.now(timezone.utc).isoformat(),
        "reviewer_user_id": principal["user"].id,
        "decision": choice,
        "execution_performed": False,
    })
    audit["events"] = events
    case.agent_audit = audit
    db.commit()
    return {"message": f"Review {review_id} updated", "status": choice}
