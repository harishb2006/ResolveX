from fastapi import FastAPI, Depends
from sqlalchemy.orm import Session
from sqlalchemy import text
import models
from database import engine, get_db
from routers import auth_router, return_router

models.Base.metadata.create_all(bind=engine)

# create_all creates new tables but does not add columns to existing tables.
# Keep existing local installations compatible as the return record evolves.
with engine.begin() as connection:
    connection.execute(text("ALTER TABLE products ADD COLUMN IF NOT EXISTS returnable BOOLEAN NOT NULL DEFAULT TRUE"))
    connection.execute(text("ALTER TABLE products ADD COLUMN IF NOT EXISTS return_window_days INTEGER NOT NULL DEFAULT 30"))
    connection.execute(text("ALTER TABLE products ADD COLUMN IF NOT EXISTS warranty_days INTEGER NOT NULL DEFAULT 365"))
    connection.execute(text("ALTER TABLE users ADD COLUMN IF NOT EXISTS phone_number VARCHAR"))
    connection.execute(text("ALTER TABLE users ADD COLUMN IF NOT EXISTS role VARCHAR NOT NULL DEFAULT 'customer'"))
    connection.execute(text("CREATE UNIQUE INDEX IF NOT EXISTS ix_users_phone_number ON users (phone_number) WHERE phone_number IS NOT NULL"))
    connection.execute(text("ALTER TABLE returns ADD COLUMN IF NOT EXISTS description TEXT NOT NULL DEFAULT ''"))
    connection.execute(text("ALTER TABLE returns ADD COLUMN IF NOT EXISTS desired_resolution VARCHAR NOT NULL DEFAULT 'refund'"))
    connection.execute(text("ALTER TABLE returns ADD COLUMN IF NOT EXISTS evidence JSON NOT NULL DEFAULT '[]'::json"))
    connection.execute(text("ALTER TABLE returns ADD COLUMN IF NOT EXISTS decision VARCHAR NOT NULL DEFAULT 'MANUAL_REVIEW'"))
    connection.execute(text("ALTER TABLE returns ADD COLUMN IF NOT EXISTS confidence FLOAT NOT NULL DEFAULT 0"))
    connection.execute(text("ALTER TABLE returns ADD COLUMN IF NOT EXISTS risk_score FLOAT NOT NULL DEFAULT 0"))
    connection.execute(text("ALTER TABLE returns ADD COLUMN IF NOT EXISTS risk_factors JSON NOT NULL DEFAULT '[]'::json"))
    connection.execute(text("ALTER TABLE returns ADD COLUMN IF NOT EXISTS ai_analysis JSON NOT NULL DEFAULT '{}'::json"))
    connection.execute(text("ALTER TABLE returns ADD COLUMN IF NOT EXISTS agent_audit JSON NOT NULL DEFAULT '{}'::json"))
    connection.execute(text("ALTER TABLE returns ADD COLUMN IF NOT EXISTS reasons JSON NOT NULL DEFAULT '[]'::json"))
    connection.execute(text("ALTER TABLE returns ADD COLUMN IF NOT EXISTS refund_status VARCHAR NOT NULL DEFAULT 'not_requested'"))
    connection.execute(text("ALTER TABLE returns ADD COLUMN IF NOT EXISTS refund_amount FLOAT"))
    connection.execute(text("ALTER TABLE returns ADD COLUMN IF NOT EXISTS refund_idempotency_key VARCHAR"))
    connection.execute(text("ALTER TABLE returns ADD COLUMN IF NOT EXISTS refund_reference VARCHAR"))
    connection.execute(text("ALTER TABLE returns ADD COLUMN IF NOT EXISTS refund_updated_at TIMESTAMPTZ"))
    connection.execute(text("CREATE UNIQUE INDEX IF NOT EXISTS ix_returns_refund_idempotency_key ON returns (refund_idempotency_key) WHERE refund_idempotency_key IS NOT NULL"))
    connection.execute(text("ALTER TABLE payments ADD COLUMN IF NOT EXISTS refunded_amount FLOAT NOT NULL DEFAULT 0"))

from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(return_router.router)
app.include_router(auth_router.router)

@app.get("/")
def read_root():
    return {"message": "Hello from FastAPI with PostgreSQL!"}

@app.get("/db-test")
def test_db_connection(db: Session = Depends(get_db)):
    # Simple query to test DB connection
    items = db.query(models.Product).all()
    return {"status": "success", "products_count": len(items)}
