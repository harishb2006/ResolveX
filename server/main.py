from fastapi import FastAPI, Depends
from sqlalchemy.orm import Session
import models
from database import engine, get_db

models.Base.metadata.create_all(bind=engine)

app = FastAPI()

@app.get("/")
def read_root():
    return {"message": "Hello from FastAPI with PostgreSQL!"}

@app.get("/db-test")
def test_db_connection(db: Session = Depends(get_db)):
    # Simple query to test DB connection
    items = db.query(models.Item).all()
    return {"status": "success", "items_count": len(items)}
