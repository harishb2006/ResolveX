from sqlalchemy import Column, Integer, String, Float, Text, DateTime, Boolean
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from database import Base

class Product(Base):
    __tablename__ = "products"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True, nullable=False)
    description = Column(Text, nullable=True)
    price = Column(Float, nullable=False)
    stock_quantity = Column(Integer, default=0)
    returnable = Column(Boolean, nullable=False, default=True)
    return_window_days = Column(Integer, nullable=False, default=30)
    warranty_days = Column(Integer, nullable=False, default=365)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    order_items = relationship("OrderItem", back_populates="product")
