import os
from pathlib import Path
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base

# Use backend directory for database
BASE_DIR = Path(__file__).resolve().parent.parent.parent
# 🔹 Production Fix: On some PaaS, the app root isn't writable. /tmp always is.
# But for now, let's try to ensure it's in the current working directory.
DEFAULT_DATABASE_PATH = Path(os.getcwd()) / "test.db"

# Prioritize environment variable (for Render/Production)
DATABASE_URL = os.getenv("DATABASE_URL")
if DATABASE_URL and DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)

if not DATABASE_URL:
    DATABASE_URL = f"sqlite:///{DEFAULT_DATABASE_PATH}"
    print(f"📦 Using SQLite at: {DATABASE_URL}")

engine = create_engine(
    DATABASE_URL,
    connect_args={"check_same_thread": False} if "sqlite" in DATABASE_URL else {}
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()