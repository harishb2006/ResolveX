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
    description = Column(Text, nullable=False, default="")
    evidence = Column(JSON, nullable=False, default=list)
    decision = Column(String, nullable=False, default="MANUAL_REVIEW")
    confidence = Column(Float, nullable=False, default=0.0)
    risk_score = Column(Float, nullable=False, default=0.0)
    risk_factors = Column(JSON, nullable=False, default=list)
    ai_analysis = Column(JSON, nullable=False, default=dict)
    reasons = Column(JSON, nullable=False, default=list)
    status = Column(Enum(ReturnStatus), default=ReturnStatus.REQUESTED)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    order_item = relationship("OrderItem", back_populates="item_return")
