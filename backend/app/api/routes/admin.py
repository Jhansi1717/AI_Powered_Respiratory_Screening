from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List

from app.api.deps import get_db, get_current_admin
from app.models.user import User
from app.schemas.auth import UserResponse

router = APIRouter()

@router.get("/users", response_model=List[UserResponse])
def get_all_users(
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin)
):
    """Admin only: Get list of all registered users"""
    users = db.query(User).all()
    return users
