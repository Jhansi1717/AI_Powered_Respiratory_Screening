from sqlalchemy.orm import Session
from app.core.database import SessionLocal
from app.core.config import ALGORITHM, SECRET_KEY
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import jwt, JWTError
import logging

logger = logging.getLogger(__name__)

# 🔐 MUST match auth.py
# 🔹 OAuth2 scheme
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/token")


# 🔹 DB dependency
def get_db():
    db = SessionLocal()


# 🔹 DB dependency
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


from app.models.user import User
from app.schemas.auth import TokenData

# 🔹 Auth dependency - Get current user from JWT token
def get_current_user_id(token: str = Depends(oauth2_scheme)) -> int:
    """
    Validate JWT token and return user_id
    """
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id = payload.get("sub")
        if user_id is None:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")
        return int(user_id)
    except (JWTError, ValueError):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")

def get_current_user(
    db: Session = Depends(get_db),
    token: str = Depends(oauth2_scheme)
) -> User:
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: str = payload.get("sub")
        if user_id is None:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")
        token_data = TokenData(user_id=int(user_id), role=payload.get("role"))
    except (JWTError, ValueError):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")
    
    user = db.query(User).filter(User.id == token_data.user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user

def get_current_admin(current_user: User = Depends(get_current_user)) -> User:
    if current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="The user doesn't have enough privileges"
        )
    return current_user
