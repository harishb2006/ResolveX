from datetime import datetime, timedelta, timezone

from sqlalchemy import func
from sqlalchemy.orm import Session

import models

WEIGHTS = {
    "customer_history": 0.35,
    "item_value": 0.25,
    "evidence": 0.25,
    "recent_activity": 0.15,
}
HIGH_VALUE_REFERENCE = 100_000
RISK_REVIEW_THRESHOLD = 0.60
EVIDENCE_REQUIRED_REASONS = {
    "Product is defective",
    "Product arrived damaged",
    "Wrong product received",
}


def calculate_risk(db: Session, order, item, request) -> dict:
    """Return a normalized, explainable risk score and its signal breakdown."""
    user_id = order.user_id
    order_count = db.query(func.count(models.Order.id)).filter(
        models.Order.user_id == user_id
    ).scalar() or 0

    history_query = db.query(models.Return).join(
        models.OrderItem, models.Return.order_item_id == models.OrderItem.id
    ).join(models.Order, models.OrderItem.order_id == models.Order.id).filter(
        models.Order.user_id == user_id
    )
    return_count = history_query.count()
    rejected_count = history_query.filter(
        models.Return.status == models.ReturnStatus.REJECTED
    ).count()
    recent_cutoff = datetime.now(timezone.utc) - timedelta(days=30)
    recent_count = history_query.filter(models.Return.created_at >= recent_cutoff).count()

    return_rate = return_count / max(order_count, 1)
    rejection_rate = rejected_count / max(return_count, 1)
    customer_score = min(1.0, (min(return_rate / 0.5, 1.0) * 0.65) + (rejection_rate * 0.35))
    customer_detail = (
        f"{return_count} previous returns across {order_count} orders; "
        f"{rejected_count} rejected"
    )

    item_score = min(float(item.unit_price or 0) / HIGH_VALUE_REFERENCE, 1.0)
    item_detail = f"₹{item.unit_price:,.0f} item value; risk reaches 100% at ₹{HIGH_VALUE_REFERENCE:,.0f}"

    evidence_required = request.reason in EVIDENCE_REQUIRED_REASONS
    if evidence_required:
        evidence_score = 0.0 if request.evidence else 1.0
        evidence_detail = "Required photo attached" if request.evidence else "Required photo is missing"
    else:
        evidence_score = 0.10 if request.evidence else 0.15
        evidence_detail = "Photo supplied; evidence content is not automatically verified" if request.evidence else "No photo attached; this reason does not require one"

    activity_score = min(recent_count / 3, 1.0)
    activity_detail = f"{recent_count} return request(s) in the last 30 days"

    signals = [
        ("customer_history", "Customer return history", customer_score, customer_detail),
        ("item_value", "Item value", item_score, item_detail),
        ("evidence", "Evidence completeness", evidence_score, evidence_detail),
        ("recent_activity", "Recent return activity", activity_score, activity_detail),
    ]
    factors = [
        {
            "key": key,
            "label": label,
            "score": round(score, 4),
            "weight": WEIGHTS[key],
            "contribution": round(score * WEIGHTS[key], 4),
            "detail": detail,
        }
        for key, label, score, detail in signals
    ]
    total = round(sum(factor["contribution"] for factor in factors), 4)
    return {
        "score": total,
        "level": "HIGH" if total >= RISK_REVIEW_THRESHOLD else "LOW",
        "threshold": RISK_REVIEW_THRESHOLD,
        "factors": factors,
    }
