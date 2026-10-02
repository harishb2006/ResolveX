import enum
from sqlalchemy import Column, Integer, String, Float, ForeignKey, DateTime, Enum
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from database import Base

class PaymentStatus(str, enum.Enum):
    PENDING = "pending"
    SUCCESSFUL = "successful"
    FAILED = "failed"
    REFUNDED = "refunded"

class Payment(Base):
    __tablename__ = "payments"

    id = Column(Integer, primary_key=True, index=True)
    order_id = Column(Integer, ForeignKey("orders.id"), nullable=False, unique=True)
    amount = Column(Float, nullable=False)
    payment_method = Column(String, nullable=False)
    status = Column(Enum(PaymentStatus), default=PaymentStatus.PENDING)
    transaction_id = Column(String, unique=True, index=True, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    order = relationship("Order", back_populates="payment")
