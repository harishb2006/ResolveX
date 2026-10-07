from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any

class ReturnRequest(BaseModel):
    order_id: str
    reason: str
    description: str = Field(min_length=1, max_length=1200)
    evidence: List[str]

class ReturnDecision(BaseModel):
    id: str
    decision: str
    confidence: float
    risk_score: float
    risk_level: str = "LOW"
    risk_threshold: float = 0.6
    risk_factors: List[Dict[str, Any]] = Field(default_factory=list)
    ai_analysis: Dict[str, Any] = Field(default_factory=dict)
    reasons: List[str]
    policy_checks: List[Dict[str, Any]] = Field(default_factory=list)

class AdminReview(BaseModel):
    id: str
    order_id: str
    product_name: str
    price: str
    reason: str
    description: str
    evidence: List[str]
    risk_score: float
    risk_level: str = "LOW"
    risk_threshold: float = 0.6
    risk_factors: List[Dict[str, Any]] = Field(default_factory=list)
    ai_analysis: Dict[str, Any] = Field(default_factory=dict)
    confidence: float
    status: str # PENDING, APPROVED, REJECTED
    decision: str = "MANUAL_REVIEW"
    reasons: List[str] = Field(default_factory=list)
    policy_checks: List[Dict[str, Any]] = Field(default_factory=list)
