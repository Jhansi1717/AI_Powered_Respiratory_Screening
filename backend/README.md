# Respiratory AI Backend

FastAPI service for authentication, respiratory-audio preprocessing, EfficientNet-B0 inference, and per-user screening history.

## Runtime

- Python 3.10
- FastAPI + Uvicorn
- SQLAlchemy
- PostgreSQL in Render production
- SQLite fallback for local development
- PyTorch + timm
- librosa + SoundFile + SoXR + SciPy

## Run locally

```bash
cd backend
python -m venv venv

# Windows
venv\Scripts\activate

# macOS/Linux
source venv/bin/activate

pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

Interactive docs:

- http://localhost:8000/docs
- http://localhost:8000/redoc

## Endpoints

| Method | Path | Auth | Purpose |
|---|---|---|---|
| GET | `/api/health` | No | Database, storage, and model readiness |
| POST | `/api/signup` | No | Create a user |
| POST | `/api/login` | No | Return a JWT |
| POST | `/api/token` | No | OAuth2-compatible token endpoint for Swagger |
| POST | `/api/predict` | JWT | Analyze audio |
| GET | `/api/history` | JWT | Current user's analysis history |
| GET | `/api/admin/users` | Admin JWT | List registered users |

## Prediction pipeline

```text
Upload
  ↓
Extension + 10 MB limit
  ↓
First 5 seconds
  ↓
Mono / 16 kHz
  ↓
SoXR resampling where required
  ↓
100 Hz Butterworth high-pass filter
  ↓
128-band Mel spectrogram
  ↓
dB + normalization + 128×128 resize
  ↓
EfficientNet-B0
  ↓
4-class softmax
```

The four classes are `normal`, `crackle`, `wheeze`, and `mixed`.

## Memory-conscious runtime behavior

When the `RENDER` environment variable is set, the application limits Torch to one CPU thread. Numba JIT is disabled before the audio stack is imported. The inference path also releases temporary tensors after requests.

The model is loaded once in a guarded global instance and exposed to requests only after the model-ready event is set.

## Upload behavior

Accepted extensions:

```text
.wav
.mp3
.flac
.webm
```

Maximum request payload for the audio file: 10 MB.

The service writes an internally generated filename under `/tmp/uploads` and removes the temporary file in a `finally` block.

## Authentication

Password hashes use PBKDF2-SHA256 via Passlib. JWTs are generated with Python-JOSE and use HS256 by default. Access tokens default to 24 hours.

Protected routes use the bearer token to identify the current user. Admin routes additionally require the `admin` role.

## Production configuration

The deployment uses environment variables for `DATABASE_URL` and `SECRET_KEY`. The Render Blueprint generates the production secret and injects the PostgreSQL connection string.

Production should not use the local development secret fallback or SQLite as a persistent data store.

## Training scripts

The repository includes optional training code in `backend/ml/`. These scripts should not be confused with the deployed inference process. The deployed API loads the tracked `backend/model/model.pth`.

