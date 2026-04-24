from fastapi import APIRouter, Depends, HTTPException
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
from jose import jwt
import logging

from app.api.deps import get_db
from app.core.config import ACCESS_TOKEN_EXPIRE_HOURS, ALGORITHM, SECRET_KEY
from app.models.user import User
from app.core.security import hash_password, verify_password
from app.schemas.auth import UserCreate, Token, UserResponse

logger = logging.getLogger(__name__)

router = APIRouter()


def authenticate_user(email: str, password: str, db: Session) -> User:
    """Validate user credentials and return the matching user."""
    logger.info(f"Login attempt for email: {email}")

    user = db.query(User).filter(User.email == email).first()
    logger.info(f"User found: {user}")

    if not user:
        logger.warning(f"No user found with email: {email}")
        raise HTTPException(status_code=401, detail="Invalid email or password")

    password_valid = verify_password(password, user.password_hash)
    logger.info(f"Password valid: {password_valid}")

    if not password_valid:
        raise HTTPException(status_code=401, detail="Invalid email or password")

    return user


def create_access_token(user_id: int, role: str) -> str:
    """Generate a JWT access token for a user."""
    payload = {
        "sub": str(user_id),
        "role": role,
        "exp": datetime.utcnow() + timedelta(hours=ACCESS_TOKEN_EXPIRE_HOURS)
    }
    return jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)


# 🔹 SIGNUP
@router.post("/signup", response_model=UserResponse)
def signup(data: UserCreate, db: Session = Depends(get_db)):
    """Create a new user account"""
    # Check if user already exists
    existing_user = db.query(User).filter(User.email == data.email).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")

    try:
        # Create new user
        new_user = User(
            email=data.email,
            password_hash=hash_password(data.password)
        )

        db.add(new_user)
        db.commit()
        db.refresh(new_user)

        return new_user

    except Exception as e:
        db.rollback()
        logger.error(f"Signup error: {str(e)}")
        raise HTTPException(status_code=500, detail="Signup failed")


# 🔹 LOGIN
@router.post("/login", response_model=Token)
def login(data: UserCreate, db: Session = Depends(get_db)):
    """Authenticate user and return JWT token"""
    try:
        user = authenticate_user(data.email, data.password, db)
        token = create_access_token(user.id, user.role)
        logger.info(f"Token generated for user ID: {user.id}")

        return {
            "access_token": token,
            "token_type": "bearer"
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Token generation error: {str(e)}")
        raise HTTPException(status_code=500, detail="Token generation failed")


@router.post("/token", response_model=Token)
def login_for_docs(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db)
):
    """OAuth2-compatible token endpoint for Swagger Authorize."""
    try:
        user = authenticate_user(form_data.username, form_data.password, db)
        token = create_access_token(user.id, user.role)
        return {
            "access_token": token,
            "token_type": "bearer"
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Token endpoint error: {str(e)}")
        raise HTTPException(status_code=500, detail="Token generation failed")
