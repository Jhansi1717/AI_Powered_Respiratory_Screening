from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.api.deps import get_db, get_current_user_id
from app.models.record import Record

router = APIRouter()

@router.get("/history")
def get_history(
    db: Session = Depends(get_db),
    user_id: int = Depends(get_current_user_id)
):
    # Only return records for the authenticated user
    records = db.query(Record).filter(Record.user_id == user_id).order_by(Record.created_at.desc()).all()

    return [
        {
            "file": r.file_url,
            "prediction": r.prediction,
            "confidence": r.confidence,
            "time": r.created_at
        }
        for r in records
    ]