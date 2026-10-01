# Respiratory AI — AI-Powered Respiratory Sound Screening

> A web application for AI-assisted respiratory sound screening. Users can upload an audio recording or capture one from a browser microphone, then receive a four-class model output with probabilities, a spectrogram visualization, screening-oriented interpretation, and per-user history. This software is a screening aid, not a medical diagnostic device.

## Live Application

- **Frontend:** https://respiratory-ai-frontend.onrender.com
- **Backend API:** https://respiratory-ai-backend.onrender.com
- **Interactive API docs:** https://respiratory-ai-backend.onrender.com/docs
- **Health check:** https://respiratory-ai-backend.onrender.com/api/health

The deployed stack uses Render for the React static site, FastAPI service, and PostgreSQL database.

## What the application actually does

1. A signed-in user uploads audio or records audio in the browser.
2. The backend accepts `.wav`, `.mp3`, `.flac`, and `.webm` files up to 10 MB.
3. Processing is bounded to the first 5 seconds of audio and converted to mono at 16 kHz.
4. A 100 Hz, fifth-order Butterworth high-pass filter is applied.
5. A 128-band Mel spectrogram is generated with PyTorch STFT and a librosa Mel filterbank, converted to dB, normalized, and resized to 128×128.
6. EfficientNet-B0 produces one of four model classes: `normal`, `crackle`, `wheeze`, or `mixed`.
7. The result includes a confidence value and a probability for each class.
8. The result and confidence are stored in PostgreSQL for the authenticated user.
9. The frontend displays the result, spectrogram, confidence information, analytics, and history.

## Current technical stack

| Layer | Technology |
|---|---|
| Frontend | React 18, React Router, Axios, Framer Motion, Lucide React, Tailwind CSS, jsPDF |
| Backend | FastAPI, Uvicorn, SQLAlchemy, Pydantic |
| ML | PyTorch, timm, EfficientNet-B0 |
| Audio | SoundFile, librosa, SoXR, SciPy |
| Database | PostgreSQL in deployment, SQLite fallback for local development |
| Authentication | JWT (python-jose), PBKDF2-SHA256 password hashing (Passlib) |
| Deployment | Render |
| Runtime hardening | Bounded 5-second preprocessing, single Torch thread on Render, Numba JIT disabled, request-level cleanup |

## Inference pipeline

```text
Audio upload / browser recording
        ↓
Extension + 10 MB validation
        ↓
First 5 seconds decoded
        ↓
Mono conversion + 16 kHz target
        ↓
SoXR resampling when needed
        ↓
100 Hz Butterworth high-pass filter
        ↓
128-band Mel spectrogram
        ↓
dB conversion + Z-score normalization
        ↓
Resize to 128 × 128
        ↓
EfficientNet-B0 + Linear(1280, 4)
        ↓
Softmax probabilities
        ↓
Prediction + confidence + spectrogram data
        ↓
PostgreSQL history record
```

## Audio handling

Current production preprocessing uses:

- **WAV/FLAC:** SoundFile fast path, with SoXR resampling when the source rate is not 16 kHz.
- **MP3/WebM:** Librosa decoding for the current implementation.
- **5-second bound:** Only the first 5 seconds are processed.
- **Temporary upload path:** Backend writes the request to a UUID-generated file under `/tmp/uploads` and removes it after processing.

The repository explicitly includes the `soxr` dependency because it is used by the production resampling paths.

## Model

The deployed model is an **EfficientNet-B0** backbone with a four-class linear classifier.

Classes:

```text
0 → normal
1 → crackle
2 → wheeze
3 → mixed
```

The inference service loads:

```text
backend/model/model.pth
```

The current inference code creates the EfficientNet-B0 architecture with one input channel, loads the saved state dictionary, switches the model to evaluation mode, and performs inference with `torch.inference_mode()`.

### Training code in the repository

The repository contains optional training scripts:

- `backend/ml/train_ssl.py` — SimCLR-style self-supervised pre-training.
- `backend/ml/train_supervised.py` — supervised fine-tuning of the four-class model.

The current production inference service does **not** load `ssl_encoder.pth`; it loads `model.pth`.

## Authentication and authorization

- `POST /api/signup` creates an account.
- `POST /api/login` returns a JWT bearer token.
- Protected analysis and history requests require a bearer token.
- User history is filtered by the authenticated `user_id`.
- Admin-only routes use role-based authorization.
- Access tokens default to a 24-hour lifetime.
- Production `SECRET_KEY` is supplied through the Render environment.

## API

| Method | Endpoint | Authentication | Purpose |
|---|---|---|---|
| GET | `/api/health` | No | Check DB, storage, and model readiness |
| POST | `/api/signup` | No | Create account |
| POST | `/api/login` | No | Obtain JWT |
| POST | `/api/token` | No | OAuth2-compatible token endpoint for API docs |
| POST | `/api/predict` | Bearer JWT | Analyze audio |
| GET | `/api/history` | Bearer JWT | Get current user's screening history |
| GET | `/api/admin/users` | Admin JWT | List users |

Interactive Swagger documentation is available at the live `/docs` URL above.

## Local development

### Requirements

- Python 3.10+
- Node.js
- npm
- Python build tools required by the installed packages

### Backend

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

### Frontend

```bash
cd frontend
npm install
npm start
```

The local frontend runs on `http://localhost:3000` and the local backend on `http://localhost:8000`.

## Render deployment

The repository contains a `render.yaml` Blueprint defining:

- `respiratory-ai-backend` — Python/FastAPI web service
- `respiratory-ai-frontend` — React static site
- `respiratory-ai-db` — PostgreSQL database

The frontend static site includes a catch-all rewrite to `/index.html` so React Router direct navigation such as `/dashboard` works after refresh.

### Production environment

The backend expects:

- `DATABASE_URL`
- `SECRET_KEY`

The Render Blueprint generates `SECRET_KEY` and connects the backend to the Render PostgreSQL database.

## Security and data handling

Current code includes:

- JWT authentication for protected routes
- PBKDF2-SHA256 password hashing
- Role-based access control for admin endpoints
- Extension allow-list
- 10 MB request size limit
- Server-generated temporary filenames
- Temporary upload deletion after each request
- Restricted CORS origins
- Generic error messages for unexpected server errors
- No password values written to logs

This project has **not** been independently audited for HIPAA, medical-device compliance, or other regulatory requirements. Do not use it to store real patient data without an appropriate compliance and security review.

## Performance and deployment limitations

The backend has been optimized to reduce memory pressure during repeated predictions:

- Torch uses one CPU thread on Render.
- Numba JIT is disabled.
- Audio processing is bounded to five seconds.
- Mel-spectrogram filterbanks and the Hann window are cached.
- Per-request tensors and temporary objects are explicitly released.
- Temporary audio files are deleted after each request.

These changes reduce avoidable memory retention, but they do **not** guarantee a fixed response time on shared/free hosting. The current Render deployment should be treated as a demonstration/portfolio deployment unless the hosting tier and operational requirements have been reviewed separately.

## Model evaluation status

Do **not** interpret the sample predictions shown by the app as clinical accuracy metrics.

The repository contains training/demo scripts and sample outputs, but it does not currently publish a statistically valid independent test-set evaluation, calibration study, or clinical validation study. Claims about accuracy should therefore not be inferred from individual live predictions.

For academic evaluation, report held-out test results with the dataset split, number of recordings, class distribution, metrics, and evaluation protocol.

## Project structure

```text
AI_Powered_Respiratory_Screening/
├── backend/
│   ├── app/
│   │   ├── api/routes/       # auth, prediction, history, admin
│   │   ├── core/             # DB, security, configuration
│   │   ├── models/           # SQLAlchemy models
│   │   ├── schemas/          # Pydantic schemas
│   │   └── services/         # preprocessing and inference
│   ├── ml/                   # optional training scripts
│   ├── model/                # model weights
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── services/
│   │   └── utils/
│   └── package.json
├── docs/
└── render.yaml
```

## Author

**Bhukya Jhansi**

## Clinical safety notice

> This software is intended for research, demonstration, and screening-support workflows. It is not a substitute for professional medical evaluation and does not provide a medical diagnosis. Do not make clinical decisions solely from its output.
