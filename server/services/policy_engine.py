"""Deterministic return eligibility role."""

from datetime import datetime, timezone

import models

HIGH_VALUE_REVIEW_THRESHOLD = 100000
EVIDENCE_REQUIRED_REASONS = {"Product is defective", "Product arrived damaged", "Wrong product received"}


def evaluate_policy(order, item, request, ignore_existing_return=False, evidence_valid=True):
    """Evaluate eligibility from order, catalog, and submitted-evidence facts."""
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
    evidence_ok = (bool(request.evidence) and evidence_valid) if evidence_required else True
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
        decision, confidence = "REJECT", 0.95
    elif not within_window and warranty_applicable:
        if evidence_ok:
            decision, confidence = "WARRANTY_SERVICE", 0.86
            reasons.append("Return window has passed, but the reported defect is within the product warranty")
        else:
            decision, confidence = "MANUAL_REVIEW", 0.55
    elif not within_window or not product_returnable:
        decision, confidence = "REJECT", 0.95
    elif not evidence_ok:
        decision, confidence = "MANUAL_REVIEW", 0.55
    elif item.unit_price >= HIGH_VALUE_REVIEW_THRESHOLD:
        decision, confidence = "MANUAL_REVIEW", 0.72
        reasons.append("High-value item requires human review")
    else:
        decision = "AUTO_REFUND" if request.desired_resolution == "refund" else "AUTO_REPLACE"
        confidence = 0.92
        reasons.append(f"Order is within the return window and the item is eligible for {request.desired_resolution}")
        if evidence_required:
            reasons.append("Required evidence was provided")
    return decision, confidence, reasons, checks
