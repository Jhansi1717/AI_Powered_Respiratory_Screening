from fastapi import APIRouter, Depends, File, HTTPException, UploadFile
from sqlalchemy.orm import Session
import os
import uuid

from app.api.deps import get_current_user_id, get_db
from app.models.record import Record
from app.services.model import predict_tensor
from app.services.preprocessing import preprocess_audio

router = APIRouter()

BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(__file__)))
UPLOAD_DIR = os.path.join(BASE_DIR, "uploads")
os.makedirs(UPLOAD_DIR, exist_ok=True)


@router.post("/predict")
async def predict(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    user_id: int = Depends(get_current_user_id),
):
    contents = await file.read()

    try:
        if not file.filename:
            raise HTTPException(status_code=400, detail="Missing file name")
        if not file.filename.lower().endswith((".wav", ".mp3", ".flac", ".webm")):
            raise HTTPException(status_code=400, detail="Invalid audio format")

        unique_name = f"{uuid.uuid4()}_{file.filename}"
        file_path = os.path.join(UPLOAD_DIR, unique_name)

        with open(file_path, "wb") as buffer:
            buffer.write(contents)

        file_ext = os.path.splitext(file.filename)[1].lower() if file.filename else ".wav"
        spectrogram, viz_data = preprocess_audio(contents, file_ext=file_ext)
        spectrogram = spectrogram.unsqueeze(0)
        prediction, confidence, probabilities = predict_tensor(spectrogram)

        record = Record(
            user_id=user_id,
            file_url=file_path,
            prediction=prediction,
            confidence=confidence,
        )
        db.add(record)
        db.commit()
        db.refresh(record)
    except HTTPException:
        raise
    except Exception as exc:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(exc))

    return {
        "filename": file.filename,
        "file_path": file_path,
        "prediction": prediction,
        "confidence": confidence,
        "spectrogram": viz_data,
        "probabilities": probabilities
    }
