import enum
from sqlalchemy import Column, Integer, Text, ForeignKey, DateTime, Enum, JSON, Float, String
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from database import Base

class ReturnStatus(str, enum.Enum):
    REQUESTED = "requested"
    APPROVED = "approved"
    REJECTED = "rejected"
    REFUNDED = "refunded"

class Return(Base):
    __tablename__ = "returns"

    id = Column(Integer, primary_key=True, index=True)
    order_item_id = Column(Integer, ForeignKey("order_items.id"), nullable=False, unique=True)
    reason = Column(Text, nullable=False)
    desired_resolution = Column(String, nullable=False, default="refund", server_default="refund")
    description = Column(Text, nullable=False, default="")
    evidence = Column(JSON, nullable=False, default=list)
    decision = Column(String, nullable=False, default="MANUAL_REVIEW")
    confidence = Column(Float, nullable=False, default=0.0)
    risk_score = Column(Float, nullable=False, default=0.0)
    risk_factors = Column(JSON, nullable=False, default=list)
    ai_analysis = Column(JSON, nullable=False, default=dict)
    agent_audit = Column(JSON, nullable=False, default=dict)
    reasons = Column(JSON, nullable=False, default=list)
    refund_status = Column(String, nullable=False, default="not_requested", server_default="not_requested")
    refund_amount = Column(Float, nullable=True)
    refund_idempotency_key = Column(String, nullable=True)
    refund_reference = Column(String, nullable=True)
    refund_updated_at = Column(DateTime(timezone=True), nullable=True)
    status = Column(Enum(ReturnStatus), default=ReturnStatus.REQUESTED)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    order_item = relationship("OrderItem", back_populates="item_return")
