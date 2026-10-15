"""Sandbox-only, idempotent refund execution with a fail-closed state machine."""

from datetime import datetime, timezone
import os

from fastapi import HTTPException
from sqlalchemy.orm import Session

import models


def _sandbox_provider_refund(idempotency_key: str, amount: float) -> str:
    """Deterministic local provider adapter; it never contacts a payment network."""
    return f"sandbox-refund-{idempotency_key[-12:]}"


def execute_refund(db: Session, case: models.Return):
    case = db.query(models.Return).filter(models.Return.id == case.id).with_for_update().populate_existing().first()
    if os.getenv("PAYMENT_MODE", "sandbox").lower() != "sandbox":
        raise HTTPException(status_code=503, detail="Refund execution is available only in sandbox mode")
    if case.status != models.ReturnStatus.APPROVED or case.decision not in {"AUTO_REFUND", "APPROVED_REFUND"}:
        raise HTTPException(status_code=409, detail="A refund requires an approved refund decision")
    if case.refund_status == "succeeded":
        return case
    if case.refund_status == "reconciliation_required":
        raise HTTPException(status_code=409, detail="Refund outcome requires reconciliation before retry")
    if case.refund_status == "pending":
        raise HTTPException(status_code=409, detail="Refund is pending; reconcile its outcome before retry")

    item = db.query(models.OrderItem).filter(models.OrderItem.id == case.order_item_id).with_for_update().first()
    payment = db.query(models.Payment).filter(models.Payment.order_id == item.order_id).with_for_update().first() if item else None
    if not item or not payment:
        case.refund_status = "failed"
        case.refund_updated_at = datetime.now(timezone.utc)
        db.commit()
        raise HTTPException(status_code=409, detail="No original payment record exists; refund was not sent")
    if payment.status != models.PaymentStatus.SUCCESSFUL:
        raise HTTPException(status_code=409, detail="Original payment is not in a refundable state")
    if abs(float(payment.amount) - float(item.order.total_amount)) > 0.005:
        raise HTTPException(status_code=409, detail="Original payment amount does not match the order total")

    amount = round(float(item.unit_price) * int(item.quantity), 2)
    if amount <= 0 or amount > float(payment.amount) or float(payment.refunded_amount or 0) + amount > float(payment.amount) + 0.005:
        raise HTTPException(status_code=409, detail="Refund amount exceeds the refundable payment balance")

    # Persist a stable key before calling the adapter. In production, an adapter
    # timeout after submission must be reconciled with the provider using this key.
    if not case.refund_idempotency_key:
        case.refund_idempotency_key = f"resolvex-return-{case.id}"
    case.refund_status = "pending"
    case.refund_amount = amount
    case.refund_updated_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(case)

    try:
        reference = _sandbox_provider_refund(case.refund_idempotency_key, amount)
    except TimeoutError:
        case.refund_status = "reconciliation_required"
        case.refund_updated_at = datetime.now(timezone.utc)
        db.commit()
        return case
    except Exception:
        case.refund_status = "failed"
        case.refund_updated_at = datetime.now(timezone.utc)
        db.commit()
        return case

    case.refund_reference = reference
    case.refund_status = "succeeded"
    case.refund_updated_at = datetime.now(timezone.utc)
    payment.refunded_amount = round(float(payment.refunded_amount or 0) + amount, 2)
    if payment.refunded_amount >= payment.amount - 0.005:
        payment.status = models.PaymentStatus.REFUNDED
    case.status = models.ReturnStatus.REFUNDED
    audit = dict(case.agent_audit or {})
    audit["execution"] = {
        "performed": True,
        "mode": "sandbox",
        "provider": "local_sandbox",
        "amount": amount,
        "currency": "INR",
        "idempotency_key": case.refund_idempotency_key,
        "reference": reference,
        "at": case.refund_updated_at.isoformat(),
    }
    events = list(audit.get("events") or [])
    events.append({"event": "sandbox_refund_succeeded", "at": case.refund_updated_at.isoformat(), "amount": amount, "reference": reference})
    audit["events"] = events
    case.agent_audit = audit
    db.commit()
    db.refresh(case)
    return case


def refund_status(case: models.Return) -> dict:
    return {
        "status": case.refund_status,
        "amount": case.refund_amount,
        "reference": case.refund_reference,
        "idempotency_key": case.refund_idempotency_key,
        "updated_at": case.refund_updated_at.isoformat() if case.refund_updated_at else None,
        "mode": "sandbox",
    }


def reconcile_refund(db: Session, case: models.Return):
    case = db.query(models.Return).filter(models.Return.id == case.id).with_for_update().populate_existing().first()
    if os.getenv("PAYMENT_MODE", "sandbox").lower() != "sandbox":
        raise HTTPException(status_code=503, detail="Refund reconciliation is available only in sandbox mode")
    if case.refund_status == "succeeded":
        return case
    if case.refund_status not in {"pending", "reconciliation_required"} or not case.refund_idempotency_key:
        raise HTTPException(status_code=409, detail="There is no uncertain refund to reconcile")
    item = db.query(models.OrderItem).filter(models.OrderItem.id == case.order_item_id).with_for_update().first()
    payment = db.query(models.Payment).filter(models.Payment.order_id == item.order_id).with_for_update().first() if item else None
    if not item or not payment or payment.status not in {models.PaymentStatus.SUCCESSFUL, models.PaymentStatus.REFUNDED}:
        raise HTTPException(status_code=409, detail="Original payment cannot be reconciled")
    amount = float(case.refund_amount or 0)
    if amount <= 0 or amount > float(payment.amount):
        raise HTTPException(status_code=409, detail="Stored refund amount is invalid")
    # The sandbox provider lookup is idempotency-key based. Reissuing this lookup
    # returns the same reference and cannot initiate a second charge/refund.
    reference = _sandbox_provider_refund(case.refund_idempotency_key, amount)
    case.refund_reference = reference
    case.refund_status = "succeeded"
    case.refund_updated_at = datetime.now(timezone.utc)
    if float(payment.refunded_amount or 0) + amount > float(payment.amount) + 0.005:
        raise HTTPException(status_code=409, detail="Reconciled refund exceeds the remaining payment balance")
    payment.refunded_amount = round(float(payment.refunded_amount or 0) + amount, 2)
    if payment.refunded_amount >= payment.amount - 0.005:
        payment.status = models.PaymentStatus.REFUNDED
    case.status = models.ReturnStatus.REFUNDED
    audit = dict(case.agent_audit or {})
    events = list(audit.get("events") or [])
    events.append({"event": "sandbox_refund_reconciled", "at": case.refund_updated_at.isoformat(), "amount": amount, "reference": reference})
    audit["events"] = events
    audit["execution"] = {"performed": True, "mode": "sandbox", "provider": "local_sandbox", "amount": amount, "currency": "INR", "idempotency_key": case.refund_idempotency_key, "reference": reference, "at": case.refund_updated_at.isoformat()}
    case.agent_audit = audit
    db.commit()
    db.refresh(case)
    return case
