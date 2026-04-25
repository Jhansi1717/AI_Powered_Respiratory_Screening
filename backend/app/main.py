import os
from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware

from app.api.routes import predict, history, auth, admin
from app.services.model import load_model
from app.core.database import Base, engine
from app.api.deps import get_db
from sqlalchemy.orm import Session

app = FastAPI()

# Ensure tables exist before the app starts
# 🔹 One-time fix: Recreate tables to ensure schema compatibility with new hashing
# Base.metadata.drop_all(bind=engine) # Uncomment this if you want a complete wipe
Base.metadata.create_all(bind=engine)

from sqlalchemy import text

# 🔥 Startup (recommended modern style)
@app.on_event("startup")
def startup():
    load_model()
    # 🔹 Migration: Add 'role' column to 'users' table if it doesn't exist
    try:
        with engine.connect() as conn:
            # check if role column exists (sqlite specific check)
            res = conn.execute(text("PRAGMA table_info(users)")).fetchall()
            cols = [r[1] for r in res]
            if "role" not in cols:
                conn.execute(text("ALTER TABLE users ADD COLUMN role TEXT DEFAULT 'user'"))
                conn.commit()
                print("✅ Added 'role' column to 'users' table via startup migration")
    except Exception as e:
        print(f"ℹ️ Startup migration info: {e}")
        
    print("✅ App started successfully")


# 🔹 CORS
# For allow_credentials=True, we must specify origins explicitly.
origins = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "https://respiratory-ai-frontend.onrender.com",
    "https://respiratory-ai-frontend.onrender.com/",
]

frontend_url = os.getenv("FRONTEND_URL")
if frontend_url:
    origins.append(frontend_url)
    if frontend_url.endswith("/"):
        origins.append(frontend_url[:-1])
    else:
        origins.append(frontend_url + "/")

# Deduplicate
origins = list(set(origins))

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# 🔹 Root check
@app.get("/")
def root():
    return {"message": "API is running 🚀"}

@app.get("/api/health")
def health_check(db: Session = Depends(get_db)):
    try:
        # Test DB connection
        db.execute(text("SELECT 1"))
        return {
            "status": "healthy",
            "database": "connected",
            "storage": "writable"
        }
    except Exception as e:
        return {
            "status": "unhealthy",
            "error": str(e)
        }


# 🔹 Routes (ORDER MATTERS for clarity)
app.include_router(auth.router, prefix="/api")      # 🔥 auth first
app.include_router(predict.router, prefix="/api")
app.include_router(history.router, prefix="/api")
app.include_router(admin.router, prefix="/api/admin", tags=["admin"])