from sqlalchemy.orm import Session
from fastapi import HTTPException
import models, schemas
from typing import Optional

def create_return(db: Session, return_in: schemas.ReturnCreate):
    order_item = db.query(models.OrderItem).filter(models.OrderItem.id == return_in.order_item_id).first()
    if not order_item:
        raise HTTPException(status_code=404, detail="Order item not found")
        
    existing_return = db.query(models.Return).filter(models.Return.order_item_id == return_in.order_item_id).first()
    if existing_return:
        raise HTTPException(status_code=400, detail="Return already requested for this item")

    new_return = models.Return(
        order_item_id=return_in.order_item_id,
        reason=return_in.reason
    )
    db.add(new_return)
    db.commit()
    db.refresh(new_return)
    return new_return

def get_returns(db: Session, status: Optional[models.ReturnStatus] = None, skip: int = 0, limit: int = 100):
    query = db.query(models.Return)
    if status:
        query = query.filter(models.Return.status == status)
    return query.offset(skip).limit(limit).all()

def get_return(db: Session, return_id: int):
    ret = db.query(models.Return).filter(models.Return.id == return_id).first()
    if not ret:
        raise HTTPException(status_code=404, detail="Return request not found")
    return ret

def update_return_status(db: Session, return_id: int, return_update: schemas.ReturnUpdate):
    ret = db.query(models.Return).filter(models.Return.id == return_id).first()
    if not ret:
        raise HTTPException(status_code=404, detail="Return request not found")
    
    ret.status = return_update.status
    db.commit()
    db.refresh(ret)
    return ret

def delete_return(db: Session, return_id: int):
    ret = db.query(models.Return).filter(models.Return.id == return_id).first()
    if not ret:
        raise HTTPException(status_code=404, detail="Return request not found")
    
    if ret.status != models.ReturnStatus.REQUESTED:
        raise HTTPException(status_code=400, detail="Can only delete returns in requested status")
        
    db.delete(ret)
    db.commit()
    return None
