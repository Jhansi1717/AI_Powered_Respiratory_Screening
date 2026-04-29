from fastapi import APIRouter, Depends, File, HTTPException, UploadFile
from sqlalchemy.orm import Session
import os
import uuid
import time

from app.api.deps import get_current_user_id, get_db
from app.models.record import Record
from app.services.model import predict_tensor
from app.services.preprocessing import preprocess_audio

router = APIRouter()

# 🔹 Production Fix: Use /tmp/uploads for Render compatibility
UPLOAD_DIR = "/tmp/uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)


@router.post("/predict")
async def predict(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    user_id: int = Depends(get_current_user_id),
):
    t_total = time.time()
    contents = await file.read()

    try:
        if not file.filename:
            raise HTTPException(status_code=400, detail="Missing file name")
        if not file.filename.lower().endswith((".wav", ".mp3", ".flac", ".webm")):
            raise HTTPException(status_code=400, detail="Invalid audio format")

        unique_name = f"{uuid.uuid4()}_{file.filename}"
        file_path = os.path.join(UPLOAD_DIR, unique_name)

        t0 = time.time()
        with open(file_path, "wb") as buffer:
            buffer.write(contents)
        print(f"📁 File saved in {time.time()-t0:.3f}s ({len(contents)} bytes)")

        file_ext = os.path.splitext(file.filename)[1].lower() if file.filename else ".wav"
        
        t0 = time.time()
        spectrogram, viz_data = preprocess_audio(file_path=file_path, file_ext=file_ext)
        print(f"🎵 Preprocessing done in {time.time()-t0:.3f}s")
        
        spectrogram = spectrogram.unsqueeze(0)
        
        t0 = time.time()
        prediction, confidence, probabilities = predict_tensor(spectrogram)
        print(f"🧠 Prediction done in {time.time()-t0:.3f}s")

        record = Record(
            user_id=user_id,
            file_url=file_path,
            prediction=prediction,
            confidence=confidence,
        )
        db.add(record)
        db.commit()
        db.refresh(record)
        
        print(f"✅ Total /predict request: {time.time()-t_total:.3f}s → {prediction} ({confidence})")
        
    except HTTPException:
        raise
    except Exception as exc:
        db.rollback()
        print(f"❌ Predict error after {time.time()-t_total:.3f}s: {exc}")
        raise HTTPException(status_code=500, detail=str(exc))

    return {
        "filename": file.filename,
        "file_path": file_path,
        "prediction": prediction,
        "confidence": confidence,
        "spectrogram": viz_data,
        "probabilities": probabilities
    }
