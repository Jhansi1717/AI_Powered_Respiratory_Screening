from fastapi import APIRouter, Depends, File, HTTPException, UploadFile
from sqlalchemy.orm import Session
import os
import uuid
import time

from app.api.deps import get_current_user_id, get_db
from app.models.record import Record
from app.services.model import predict_tensor, _model_ready, log_memory
from app.services.preprocessing import preprocess_audio

router = APIRouter()

# Production Fix: Use /tmp/uploads for Render compatibility
UPLOAD_DIR = "/tmp/uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)

ALLOWED_EXTENSIONS = (".wav", ".mp3", ".flac", ".webm")
MAX_UPLOAD_BYTES = 10 * 1024 * 1024  # 10 MB


@router.post("/predict")
async def predict(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    user_id: int = Depends(get_current_user_id),
):
    if not _model_ready.is_set():
        raise HTTPException(
            status_code=503,
            detail="Inference service is warming up. Please retry in a few seconds.",
        )

    if not file.filename:
        raise HTTPException(status_code=400, detail="Missing file name")
    original_name = os.path.basename(file.filename.replace("\\", "/"))
    file_ext = os.path.splitext(original_name)[1].lower()
    if file_ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(status_code=400, detail="Invalid audio format")

    t_total = time.time()
    contents = await file.read(MAX_UPLOAD_BYTES + 1)
    if len(contents) > MAX_UPLOAD_BYTES:
        raise HTTPException(
            status_code=413,
            detail=f"File too large. Maximum upload size is {MAX_UPLOAD_BYTES // (1024 * 1024)} MB.",
        )

    unique_name = f"{uuid.uuid4()}{file_ext}"
    file_path = os.path.join(UPLOAD_DIR, unique_name)

    try:
        t0 = time.time()
        with open(file_path, "wb") as buffer:
            buffer.write(contents)
        print(f"File saved in {time.time()-t0:.3f}s ({len(contents)} bytes)")

        t0 = time.time()
        spectrogram, viz_data = preprocess_audio(file_path=file_path, file_ext=file_ext)
        print(f"Preprocessing done in {time.time()-t0:.3f}s")
        log_memory("After preprocessing")

        spectrogram = spectrogram.unsqueeze(0)

        t0 = time.time()
        prediction, confidence, probabilities = predict_tensor(spectrogram)
        print(f"Prediction done in {time.time()-t0:.3f}s")
        log_memory("After inference")

        record = Record(
            user_id=user_id,
            file_url=file.filename,  # Store original filename, not ephemeral /tmp path
            prediction=prediction,
            confidence=confidence,
        )
        db.add(record)
        db.commit()
        db.refresh(record)

        print(f"Total /predict request: {time.time()-t_total:.3f}s -> {prediction} ({confidence})")

    except HTTPException:
        raise
    except Exception as exc:
        db.rollback()
        print(f"Predict error after {time.time()-t_total:.3f}s: {type(exc).__name__}: {exc}")
        raise HTTPException(
            status_code=500,
            detail="Audio analysis failed. Please upload a valid respiratory audio recording.",
        )
    finally:
        try:
            os.remove(file_path)
        except FileNotFoundError:
            pass
        except OSError as cleanup_exc:
            print(f"Failed to remove temp upload: {cleanup_exc}")

    return {
        "filename": file.filename,
        "file_path": file_path,
        "prediction": prediction,
        "confidence": confidence,
        "spectrogram": viz_data,
        "probabilities": probabilities
    }
