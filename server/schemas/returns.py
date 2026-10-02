from pydantic import BaseModel
from datetime import datetime
from models import ReturnStatus

class ReturnBase(BaseModel):
    order_item_id: int
    reason: str

class ReturnCreate(ReturnBase):
    pass

class ReturnUpdate(BaseModel):
    status: ReturnStatus

class ReturnResponse(ReturnBase):
    id: int
    status: ReturnStatus
    created_at: datetime

    class Config:
        from_attributes = True
