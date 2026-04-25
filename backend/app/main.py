import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.routes import predict, history, auth, admin
from app.services.model import load_model
from app.core.database import Base, engine

app = FastAPI()

# Ensure tables exist before the app starts
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
# For allow_credentials=True, we cannot use ["*"]. We must specify origins.
origins = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "https://respiratory-ai-frontend.onrender.com"
]

frontend_url = os.getenv("FRONTEND_URL")
if frontend_url and frontend_url not in origins:
    origins.append(frontend_url)

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


# 🔹 Routes (ORDER MATTERS for clarity)
app.include_router(auth.router, prefix="/api")      # 🔥 auth first
app.include_router(predict.router, prefix="/api")
app.include_router(history.router, prefix="/api")
app.include_router(admin.router, prefix="/api/admin", tags=["admin"])