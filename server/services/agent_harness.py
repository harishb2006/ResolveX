"""Auditable, server-side orchestration for return decision roles.

The resolution proposal is deterministic. Jev is an untrusted advisory role and
never receives tools capable of changing orders, payments, or shipments.
"""

from datetime import datetime, timezone
import hashlib

from services.ai_evidence import analyze_return
from services.policy_engine import HIGH_VALUE_REVIEW_THRESHOLD, evaluate_policy
from services.risk_engine import RISK_REVIEW_THRESHOLD, calculate_risk

LOW_AI_CONFIDENCE_THRESHOLD = 0.55


def _digest(text: str) -> str:
    return hashlib.sha256(text.encode("utf-8")).hexdigest()


def _policy_role(order, item, request, evidence_valid: bool) -> dict:
    decision, confidence, reasons, checks = evaluate_policy(
        order, item, request, evidence_valid=evidence_valid
    )
    return {
        "role": "policy_evaluator",
        "assessed": "Return-window, delivery, product eligibility, prior requests, evidence requirement, and warranty rules.",
        "input": {
            "reason": request.reason,
            "desired_resolution": request.desired_resolution,
            "order_status": order.status.value,
            "item_value": float(item.unit_price or 0),
            "evidence_attached": bool(request.evidence),
            "evidence_valid": evidence_valid,
        },
        "output": {"decision": decision, "confidence": confidence, "reasons": reasons, "checks": checks},
    }


def _risk_role(db, order, item, request) -> dict:
    risk = calculate_risk(db, order, item, request)
    return {
        "role": "risk_evaluator",
        "assessed": "Aggregated return history, item value, evidence completeness, and recent return activity.",
        "input": {"item_value": float(item.unit_price or 0), "evidence_attached": bool(request.evidence)},
        "output": risk,
    }


def _jev_role(reason: str, description: str, evidence: list[str], product_name: str, desired_resolution: str) -> dict:
    analysis = analyze_return(reason, description, evidence, product_name, desired_resolution)
    return {
        "role": "jev_claim_analyst",
        "assessed": "Claim text classification, selected-reason alignment, described severity, and advisory resolution/warranty signals. Image pixels are excluded.",
        "input": {
            "reason": reason,
            "desired_resolution": desired_resolution,
            "product_name": product_name,
            "description_sha256": _digest(description),
            "description_characters": len(description),
            "evidence_attached": bool(evidence),
            "evidence_pixels_sent": False,
        },
        "output": analysis,
        "run_id": analysis.get("run_id"),
        "usage": analysis.get("usage"),
        "billing": analysis.get("billing"),
    }


def _proposal_role(policy: dict, risk: dict, jev: dict, desired_resolution: str, item_value: float) -> dict:
    policy_output = policy["output"]
    policy_decision = policy_output["decision"]
    risk_output = risk["output"]
    jev_output = jev["output"]
    escalations: list[str] = []
    disagreements: list[dict] = []

    if item_value >= HIGH_VALUE_REVIEW_THRESHOLD:
        escalations.append("high_value_claim_requires_human_review")
    if policy_decision == "MANUAL_REVIEW":
        escalations.append("policy_requires_human_review")
    if policy_decision == "WARRANTY_SERVICE":
        escalations.append("warranty_path_requires_human_confirmation")
    if risk_output["score"] >= RISK_REVIEW_THRESHOLD:
        escalations.append("risk_threshold_reached")
        if policy_decision in {"AUTO_REFUND", "AUTO_REPLACE"}:
            disagreements.append({
                "between": ["policy_evaluator", "risk_evaluator"],
                "detail": "Policy eligibility passed, but the risk score reached the human-review threshold.",
            })

    jev_status = jev_output.get("status")
    if jev_status != "analyzed":
        escalations.append(f"jev_result_{jev_status or 'missing'}_requires_review")
    if jev_output.get("uncertain_outcome"):
        escalations.append("jev_outcome_is_uncertain")
    ai_confidence = jev_output.get("confidence")
    if ai_confidence is None or ai_confidence < LOW_AI_CONFIDENCE_THRESHOLD:
        escalations.append("jev_confidence_is_low_or_missing")
    if jev_output.get("reason_alignment") == "conflict":
        escalations.append("claim_description_conflicts_with_selected_reason")
        disagreements.append({
            "between": ["customer_selected_reason", "jev_claim_analyst"],
            "detail": "Jev reports that the description may conflict with the selected reason; reviewer should inspect the customer text.",
        })
    if jev_output.get("resolution_guidance") == "needs_clarification":
        escalations.append("jev_could_not_assess_resolution_fit")
    jev_resolution = jev_output.get("resolution_guidance")
    if jev_resolution in {"refund", "replacement"} and jev_resolution != desired_resolution:
        disagreements.append({
            "between": ["customer_preference", "jev_claim_analyst"],
            "detail": "Jev's advisory fit signal differs from the customer's chosen outcome; the preference is preserved pending human review.",
        })
        escalations.append("jev_resolution_signal_differs_from_customer_preference")

    if disagreements and policy_decision not in {"REJECT", "MANUAL_REVIEW", "WARRANTY_SERVICE"}:
        escalations.append("decision_roles_disagree")

    if policy_decision == "REJECT":
        proposed_action = "REJECT"
    elif policy_decision == "WARRANTY_SERVICE":
        proposed_action = "WARRANTY_REVIEW"
    elif policy_decision == "MANUAL_REVIEW":
        proposed_action = "HUMAN_REVIEW"
    else:
        proposed_action = "APPROVE_REFUND" if desired_resolution == "refund" else "APPROVE_REPLACEMENT"

    final_recommendation = "HUMAN_REVIEW" if escalations else proposed_action
    return {
        "role": "resolution_proposer",
        "assessed": "Combines policy eligibility, risk threshold, Jev uncertainty, and role disagreements. This role cannot execute a refund or shipment.",
        "input": {
            "policy_decision": policy_decision,
            "risk_score": risk_output["score"],
            "jev_status": jev_status,
            "jev_confidence": ai_confidence,
            "desired_resolution": desired_resolution,
            "item_value": item_value,
        },
        "output": {
            "proposed_action": proposed_action,
            "recommendation": final_recommendation,
            "requires_human_review": bool(escalations),
            "escalations": sorted(set(escalations)),
            "disagreements": disagreements,
        },
    }


def run_return_harness(db, order, item, request, evidence_valid: bool) -> dict:
    """Run the four isolated roles and return a decision plus audit record."""
    policy = _policy_role(order, item, request, evidence_valid)
    risk = _risk_role(db, order, item, request)
    jev = _jev_role(
        request.reason, request.description, request.evidence, item.product.name,
        request.desired_resolution,
    )
    proposal = _proposal_role(
        policy, risk, jev, request.desired_resolution, float(item.unit_price or 0)
    )
    recommendation = proposal["output"]["recommendation"]
    decision_map = {
        "APPROVE_REFUND": "AUTO_REFUND",
        "APPROVE_REPLACEMENT": "AUTO_REPLACE",
        "REJECT": "REJECT",
        "WARRANTY_REVIEW": "WARRANTY_SERVICE",
        "HUMAN_REVIEW": "MANUAL_REVIEW",
    }
    final_decision = decision_map[recommendation]
    confidence = min(policy["output"]["confidence"], jev["output"].get("confidence") or 0.0)
    reasons = list(policy["output"]["reasons"])
    reasons.extend(proposal["output"]["escalations"])

    audit = {
        "version": 1,
        "created_at": datetime.now(timezone.utc).isoformat(),
        "events": [{
            "event": "return_submitted",
            "at": datetime.now(timezone.utc).isoformat(),
            "decision": final_decision,
        }],
        "roles": {
            "policy": policy,
            "risk": risk,
            "jev": jev,
            "proposal": proposal,
        },
        "disagreements": proposal["output"]["disagreements"],
        "escalations": proposal["output"]["escalations"],
        "final_decision": final_decision,
        "execution": {"performed": False, "payment_or_shipment_tools_available": False},
    }
    return {
        "decision": final_decision,
        "confidence": confidence,
        "reasons": reasons,
        "policy_checks": policy["output"]["checks"],
        "risk": risk["output"],
        "ai_analysis": jev["output"],
        "agent_audit": audit,
    }
