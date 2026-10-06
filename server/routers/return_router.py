from datetime import datetime, timezone
from typing import List

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, joinedload

import models
from database import get_db
from schemas.returns import ReturnRequest, ReturnDecision, AdminReview

router = APIRouter(prefix="/returns", tags=["Returns"])

HIGH_VALUE_REVIEW_THRESHOLD = 100000
EVIDENCE_REQUIRED_REASONS = {"Product is defective", "Product arrived damaged", "Wrong product received"}


def evaluate_policy(order, item, request: ReturnRequest, ignore_existing_return=False):
    checks = []
    now = datetime.now(timezone.utc)
    purchased = order.created_at
    if purchased and purchased.tzinfo is None:
        purchased = purchased.replace(tzinfo=timezone.utc)
    return_window_days = item.product.return_window_days or 30
    age_days = max(0, (now - purchased).days) if purchased else return_window_days + 1
    within_window = age_days <= return_window_days
    checks.append({"key": "within_return_window", "label": f"Within {return_window_days}-day return window", "passed": within_window, "detail": f"Order is {age_days} days old"})

    delivered = order.status == models.OrderStatus.COMPLETED
    checks.append({"key": "order_delivered", "label": "Order has been delivered", "passed": delivered, "detail": f"Current order status: {order.status.value}"})

    no_prior_return = item.item_return is None or ignore_existing_return
    product_returnable = item.product.returnable
    checks.append({"key": "product_returnable", "label": "Product is return eligible", "passed": product_returnable, "detail": "Product policy allows returns" if product_returnable else "Product policy marks this item non-returnable"})
    checks.append({"key": "not_previously_returned", "label": "Item has no existing return request", "passed": no_prior_return, "detail": "Item already has a return request" if not no_prior_return else "No previous return found"})

    evidence_required = request.reason in EVIDENCE_REQUIRED_REASONS
    evidence_ok = bool(request.evidence) if evidence_required else True
    checks.append({"key": "evidence", "label": "Evidence provided when required", "passed": evidence_ok, "detail": "Photo evidence is required for this reason" if evidence_required and not evidence_ok else ("Evidence attached" if request.evidence else "Evidence not required for this reason")})

    warranty_applicable = request.reason == "Product is defective" and age_days <= (item.product.warranty_days or 365)
    checks.append({"key": "warranty", "label": "Defect covered by product warranty", "passed": warranty_applicable, "detail": f"Warranty period: {item.product.warranty_days or 365} days"})

    reasons = []
    if not within_window:
        reasons.append(f"Request is outside the {return_window_days}-day return window")
    if not delivered:
        reasons.append("Order has not been delivered yet")
    if not no_prior_return:
        reasons.append("A return request already exists for this item")
    if not product_returnable:
        reasons.append("Product policy does not allow returns")
    if not evidence_ok:
        reasons.append("Photo evidence is required for the selected reason")

    if not delivered or not no_prior_return:
        decision, confidence, risk = "REJECT", 0.95, 0.75
    elif not within_window and warranty_applicable:
        if evidence_ok:
            decision, confidence, risk = "WARRANTY_SERVICE", 0.86, 0.12
            reasons.append("Return window has passed, but the reported defect is within the product warranty")
        else:
            decision, confidence, risk = "MANUAL_REVIEW", 0.55, 0.5
    elif not within_window or not product_returnable:
        decision, confidence, risk = "REJECT", 0.95, 0.75
    elif not evidence_ok:
        decision, confidence, risk = "MANUAL_REVIEW", 0.55, 0.5
    elif item.unit_price >= HIGH_VALUE_REVIEW_THRESHOLD:
        decision, confidence, risk = "MANUAL_REVIEW", 0.72, 0.62
        reasons.append("High-value item requires human review")
    else:
        decision, confidence, risk = "AUTO_REFUND", 0.92, 0.08
        reasons.append("Order is within the return window and the item is eligible")
        if evidence_required:
            reasons.append("Required evidence was provided")
    return decision, confidence, risk, reasons, checks


def review_payload(ret):
    item = ret.order_item
    order = item.order
    return AdminReview(
        id=str(ret.id), order_id=f"ORD-{order.id:03d}", product_name=item.product.name,
        price=f"₹{item.unit_price:,.0f}", reason=ret.reason, description=ret.description,
        evidence=ret.evidence or [], risk_score=ret.risk_score, confidence=ret.confidence,
        status=ret.status.value.upper(), decision=ret.decision, reasons=ret.reasons or [],
        policy_checks=[],
    )


@router.get("/orders")
def list_orders(db: Session = Depends(get_db)):
    """List delivered demo orders; real order ownership/authentication is not implemented yet."""
    orders = db.query(models.Order).options(joinedload(models.Order.items).joinedload(models.OrderItem.product), joinedload(models.Order.items).joinedload(models.OrderItem.item_return)).order_by(models.Order.id).all()
    return [
        {"orderId": f"ORD-{order.id:03d}", "productName": item.product.name,
         "price": f"₹{item.unit_price:,.0f}", "purchaseDate": order.created_at.isoformat() if order.created_at else None,
         "deliveryDate": None, "status": order.status.value.upper(),
         "returnStatus": item.item_return.status.value.upper() if item.item_return else None}
        for order in orders for item in order.items
    ]


@router.post("/orders/demo")
def create_demo_order(payload: dict, db: Session = Depends(get_db)):
    """Create a completed sample order from the storefront for the local demo."""
    name = str(payload.get("product_name", "")).strip()
    try:
        price = float(payload.get("price"))
    except (TypeError, ValueError):
        raise HTTPException(status_code=422, detail="A valid product price is required")
    if not name or price <= 0:
        raise HTTPException(status_code=422, detail="Product name and positive price are required")
    user = db.query(models.User).filter(models.User.email == "demo@resolvex.local").first()
    if not user:
        user = models.User(email="demo@resolvex.local", name="Demo Customer")
        db.add(user)
        db.flush()
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
def create_return(req: ReturnRequest, db: Session = Depends(get_db)):
    try:
        order_id = int(req.order_id.removeprefix("ORD-").lstrip("0") or "0")
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid order ID")
    order = db.query(models.Order).options(joinedload(models.Order.items).joinedload(models.OrderItem.product), joinedload(models.Order.items).joinedload(models.OrderItem.item_return)).filter(models.Order.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    item = order.items[0] if order.items else None
    if not item:
        raise HTTPException(status_code=404, detail="Order has no items")

    decision, confidence, risk, reasons, checks = evaluate_policy(order, item, req)
    ret = models.Return(order_item_id=item.id, reason=req.reason, description=req.description,
                        evidence=req.evidence, decision=decision, confidence=confidence,
                        risk_score=risk, reasons=reasons,
                        status=models.ReturnStatus.REQUESTED if decision == "MANUAL_REVIEW" else (models.ReturnStatus.REJECTED if decision == "REJECT" else models.ReturnStatus.APPROVED))
    db.add(ret)
    try:
        db.commit()
    except Exception:
        db.rollback()
        raise HTTPException(status_code=409, detail="A return request already exists for this item")
    db.refresh(ret)
    return ReturnDecision(id=str(ret.id), decision=decision, confidence=confidence, risk_score=risk, reasons=reasons, policy_checks=checks)


@router.get("/admin", response_model=List[AdminReview])
def get_admin_reviews(db: Session = Depends(get_db)):
    cases = db.query(models.Return).options(joinedload(models.Return.order_item).joinedload(models.OrderItem.order), joinedload(models.Return.order_item).joinedload(models.OrderItem.product)).filter(models.Return.status == models.ReturnStatus.REQUESTED).all()
    return [review_payload(case) for case in cases]


@router.get("/admin/{review_id}", response_model=AdminReview)
def get_admin_review(review_id: str, db: Session = Depends(get_db)):
    case = db.query(models.Return).options(joinedload(models.Return.order_item).joinedload(models.OrderItem.order), joinedload(models.Return.order_item).joinedload(models.OrderItem.product)).filter(models.Return.id == int(review_id)).first()
    if not case:
        raise HTTPException(status_code=404, detail="Review not found")
    payload = review_payload(case)
    order = case.order_item.order
    item = case.order_item
    _, _, _, _, checks = evaluate_policy(order, item, ReturnRequest(order_id=payload.order_id, reason=case.reason, description=case.description, evidence=case.evidence or []), ignore_existing_return=True)
    payload.policy_checks = checks
    return payload


@router.post("/admin/{review_id}/decision")
def make_admin_decision(review_id: str, decision: dict, db: Session = Depends(get_db)):
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
    db.commit()
    return {"message": f"Review {review_id} updated", "status": choice}
