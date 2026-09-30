import os
# Must be set before any other imports to completely disable Numba JIT globally.
# This prevents a massive 150MB+ memory spike when librosa is used.
os.environ["NUMBA_DISABLE_JIT"] = "1"

from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
import torch

# Production Fix: Limit torch threads to save memory on Render Free tier
# Only apply this if we are running on Render (where the RENDER env var is set)
if os.getenv("RENDER"):
    torch.set_num_threads(1)

from app.api.routes import predict, history, auth, admin
from app.services.model import load_model, _model_ready
from app.core.database import Base, engine
from app.api.deps import get_db
from sqlalchemy.orm import Session

app = FastAPI()

# Ensure tables exist before the app starts
# 🔹 One-time fix: Recreate tables to ensure schema compatibility with new hashing
# Base.metadata.drop_all(bind=engine) # Uncomment this if you want a complete wipe
Base.metadata.create_all(bind=engine)

from sqlalchemy import inspect, text

import threading

# Startup (recommended modern style)
@app.on_event("startup")
def startup():
    # Production Fix: Load model in the BACKGROUND so the server starts instantly
    # and doesn't time out on Render.
    def _startup_tasks():
        load_model()
    threading.Thread(target=_startup_tasks, daemon=True).start()
    
    # Non-destructive migration: add 'role' column to 'users' if it is missing
    try:
        inspector = inspect(engine)
        if inspector.has_table("users"):
            cols = {col["name"] for col in inspector.get_columns("users")}
            if "role" not in cols:
                with engine.begin() as conn:
                    conn.execute(text("ALTER TABLE users ADD COLUMN role VARCHAR(50) DEFAULT 'user'"))
                print("Added 'role' column to 'users' table via startup migration")
    except Exception as e:
        print(f"Startup migration skipped: {type(e).__name__}")
        
    print("App started successfully")


# Configure CORS for security
origins = [
    "http://localhost:3000",
    "https://respiratory-ai-frontend.onrender.com"
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Root check
@app.get("/")
def root():
    return {"message": "API is running"}

@app.get("/api/health")
def health_check(db: Session = Depends(get_db)):
    try:
        # Lightweight DB ping
        db.execute(text("SELECT 1"))
        
        # Check storage
        storage_writable = os.access("/tmp", os.W_OK)
        
        return {
            "status": "healthy",
            "database": "connected",
            "storage": "writable" if storage_writable else "read-only",
            "model_ready": _model_ready.is_set(),
        }
    except Exception as e:
        print(f"Health check failed: {type(e).__name__}")
        return {
            "status": "unhealthy",
            "error": "Health check failed"
        }


# 🔹 Routes (ORDER MATTERS for clarity)
app.include_router(auth.router, prefix="/api")      # 🔥 auth first
app.include_router(predict.router, prefix="/api")
app.include_router(history.router, prefix="/api")
app.include_router(admin.router, prefix="/api/admin", tags=["admin"])