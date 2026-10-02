from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session
from typing import List, Optional

import schemas, models
from database import get_db
from controllers import return_controller

router = APIRouter(
    prefix="/returns",
    tags=["Returns"]
)

@router.post("/", response_model=schemas.ReturnResponse, status_code=status.HTTP_201_CREATED)
def create_return(return_in: schemas.ReturnCreate, db: Session = Depends(get_db)):
    return return_controller.create_return(db=db, return_in=return_in)

@router.get("/", response_model=List[schemas.ReturnResponse])
def get_returns(status: Optional[models.ReturnStatus] = None, skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    return return_controller.get_returns(db=db, status=status, skip=skip, limit=limit)

@router.get("/{return_id}", response_model=schemas.ReturnResponse)
def get_return(return_id: int, db: Session = Depends(get_db)):
    return return_controller.get_return(db=db, return_id=return_id)

@router.patch("/{return_id}/status", response_model=schemas.ReturnResponse)
def update_return_status(return_id: int, return_update: schemas.ReturnUpdate, db: Session = Depends(get_db)):
    return return_controller.update_return_status(db=db, return_id=return_id, return_update=return_update)

@router.delete("/{return_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_return(return_id: int, db: Session = Depends(get_db)):
    return return_controller.delete_return(db=db, return_id=return_id)
