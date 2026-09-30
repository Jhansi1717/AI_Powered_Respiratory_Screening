# 🫁 Respiratory AI — AI-Powered Respiratory Sound Screening

> **AI-assisted screening of lung/breathing sounds.** An EfficientNet-B0 classifier analyzes a short respiratory audio recording and flags patterns consistent with wheezes, crackles, both, or a normal breathing sound. **Screening support only — not a diagnostic device.**

---

## 📋 Overview

Respiratory AI is a full-stack web application (FastAPI + React) that lets authenticated users upload or record respiratory sounds and receive a 4-class screening result with per-class probabilities and a Mel-spectrogram visualization.

### 🌟 Key Capabilities
- **4-Class Screening**: `normal`, `crackle`, `wheeze`, `mixed` (crackle + wheeze).
- **EfficientNet-B0 Backbone**: Single-channel Mel-spectrogram input with a 4-way linear classification head.
- **Bounded Preprocessing**: Only the first 5 seconds of audio are decoded and analyzed, keeping memory and latency predictable on small instances.
- **Explainable Output**: Class probabilities, confidence, severity/urgency mapping and a downsampled spectrogram heatmap.
- **Screening Reports**: Downloadable PDF screening summary generated client-side in the browser.
- **Localization**: English, Spanish, Hindi, and Telugu.

---

## ✨ Architecture

### Inference Pipeline
1. **Upload validation** — accepted formats: WAV, MP3, FLAC, WebM; maximum upload size 10 MB (larger uploads are rejected with HTTP 413).
2. **Decoding (5-second bound)** — WAV/FLAC via `soundfile` (reads at most 5 s of frames), other formats via `librosa.load(..., duration=5)`; converted to mono and resampled to 16 kHz.
3. **Filtering** — 5th-order Butterworth high-pass filter at 100 Hz to remove low-frequency hum.
4. **Length normalization** — pad or truncate to exactly 5 s (80,000 samples).
5. **Mel-spectrogram** — memory-efficient PyTorch STFT + NumPy implementation (128 Mel bands, `n_fft=2048`, `hop_length=512`), converted to dB, standardized and resized to 128×128. Numba JIT is disabled to avoid its memory and startup overhead.
6. **Inference** — EfficientNet-B0 (`timm`) → global average pooling → `Linear(1280, 4)` → softmax.
7. **Persistence** — the result (original filename, prediction, confidence, timestamp) is stored per user. Temporary upload files are always deleted after processing.

### 🤖 Training Pipeline
- **Self-supervised pretraining (optional)** — `backend/ml/train_ssl.py` implements SimCLR-style contrastive pretraining (NT-Xent loss, noise injection and frequency-masking augmentations) of the EfficientNet-B0 encoder and saves `model/ssl_encoder.pth`.
- **Supervised fine-tuning** — `backend/ml/train_supervised.py` initializes the backbone from `ssl_encoder.pth` when it is present, then trains the 4-class classifier with cross-entropy loss (Adam, `lr=1e-5`) and saves `model/model.pth`.

The production API loads only `backend/model/model.pth`.

### 🗄️ Persistence
- **Production**: PostgreSQL (Render managed database), configured via `DATABASE_URL`.
- **Local development**: falls back to SQLite at `/tmp/test.db` when `DATABASE_URL` is not set.

---

## 🚀 Quick Start

### Prerequisites
- **Python 3.10+**
- **Node.js 18+**
- **FFmpeg** (optional, for MP3/WebM decoding)

### 1. Backend (FastAPI)
```bash
cd backend
python -m venv venv
# Windows: venv\Scripts\activate | Unix: source venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

### 2. Frontend (React)
```bash
cd frontend
npm install
npm start   # http://localhost:3000
```

### Environment Variables (backend)
| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | Production | PostgreSQL connection string. SQLite fallback is used locally if unset. |
| `SECRET_KEY` | Production | JWT signing key. Required on Render (startup fails if missing); a development-only fallback is used locally. |
| `JWT_ALGORITHM` | No | Defaults to `HS256`. |
| `ACCESS_TOKEN_EXPIRE_HOURS` | No | Defaults to `24`. |

---

## 🔌 API

| Method | Endpoint | Auth | Description |
|--------|---------|------|-------------|
| `POST` | `/api/signup` | ❌ | Create a new user account |
| `POST` | `/api/login` | ❌ | Authenticate and receive a JWT |
| `POST` | `/api/token` | ❌ | OAuth2 form login (Swagger "Authorize") |
| `POST` | `/api/predict` | ✅ | Upload an audio file (≤10 MB) for screening |
| `GET` | `/api/history` | ✅ | Retrieve the user's screening history |
| `GET` | `/api/admin/users` | ✅ Admin | List registered users |
| `GET` | `/api/health` | ❌ | Health check (DB, storage, model readiness) |

---

## 📁 Project Structure

```text
├── backend/
│   ├── app/
│   │   ├── api/          # Auth, Predict, History, Admin routes
│   │   ├── core/         # Config, DB engine, password hashing
│   │   ├── models/       # SQLAlchemy entities
│   │   └── services/     # Model inference & audio preprocessing
│   ├── ml/               # SSL pretraining & supervised fine-tuning scripts
│   └── model/            # Trained weights (model.pth)
├── frontend/
│   └── src/
│       ├── pages/        # Dashboard, Login, Signup
│       └── services/     # API client
├── docs/                 # Architecture & deployment docs
└── render.yaml           # Render blueprint (backend, frontend, PostgreSQL)
```

---

## 🛡️ Security
- **Authentication**: JWT (HS256) with configurable expiry; the frontend discards expired or malformed tokens and redirects to login.
- **Password hashing**: PBKDF2-SHA256 (salted) via `passlib`.
- **Secrets**: `SECRET_KEY` must be provided in production (Render).
- **Upload limits**: extension whitelist and 10 MB size cap; temporary files are removed after every request.
- **Data isolation**: history is scoped to the authenticated user; admin routes require the `admin` role.
- **CORS**: restricted to the local dev origin and the deployed frontend.

---

## 🚧 Roadmap
- [ ] Full ICBHI 2017 training and published evaluation metrics
- [ ] AWS S3 audio storage
- [ ] Grad-CAM explanations for spectrogram heatmaps
- [ ] Batch upload and analysis
- [x] PostgreSQL persistence in production
- [x] Multi-format audio (WAV, MP3, FLAC, WebM)
- [x] Multi-language UI (English, Spanish, Hindi, Telugu)

---

## ⚕️ Clinical Disclaimer

> **IMPORTANT**: This software is a **screening-support tool only**. It is **not** a medical device, has **not** been clinically validated or approved by any regulatory body, and must **not** be used to diagnose, treat, or rule out any condition. All results must be reviewed by a licensed healthcare professional. It is not a substitute for clinical examination or judgment.

---

## 👤 Author

**Bhukya Jhansi**
