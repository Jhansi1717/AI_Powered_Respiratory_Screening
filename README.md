# 🫁 Respiratory AI — AI-Powered Respiratory Sound Screening

> **AI-assisted screening tool for lung sounds.** An EfficientNet-B0 classifier analyses short respiratory audio recordings and flags patterns consistent with normal breathing, wheezes, crackles, or both. It is a **screening aid only** and does not provide a medical diagnosis.

---

## 📋 Overview

Respiratory AI is a web application (React frontend + FastAPI backend) for uploading or recording respiratory sounds and receiving an AI screening result. The model is trained with a two-stage pipeline: optional SimCLR-style self-supervised pre-training of the encoder, followed by supervised fine-tuning on labelled respiratory recordings (ICBHI 2017 format).

### 🌟 Key Capabilities
- **4-Class Screening**: Classifies audio as `normal`, `crackle`, `wheeze`, or `mixed`, with per-class probabilities.
- **Bounded Preprocessing**: Only the first 5 seconds of audio are decoded (16 kHz mono), keeping memory use predictable on small instances.
- **Signal Processing**: Butterworth high-pass filter and a log-scaled Mel-spectrogram visualisation of the analysed sound.
- **Rule-Based Interpretation**: Maps model output to a severity level and plain-language guidance in the UI.
- **Localization**: English, Spanish, Hindi, and Telugu.
- **Downloadable Report**: Client-side PDF screening report generated in the browser (jsPDF).
- **History**: Per-user screening history persisted in PostgreSQL.

---

## ✨ Features & Architecture

| Feature | Technical Implementation | Purpose |
|---------|-------------------------|---------|
| **4-Class Classifier** | EfficientNet-B0 (timm) + linear head, CrossEntropy | Normal, Crackle, Wheeze, or Mixed. |
| **Mel-Spectrograms** | PyTorch STFT + librosa Mel filterbank (Numba-free), dB scale | Model input and on-screen visualisation. |
| **Insight Engine** | Severity mapping & urgency logic (frontend) | Translates model output into readable screening guidance. |
| **Live Oscilloscope** | Web Audio API AnalyserNode | Real-time feedback during audio recording. |
| **Persistence** | SQLAlchemy + PostgreSQL (SQLite fallback for local dev) | Users and screening history. |
| **Auth** | JWT (python-jose) + PBKDF2-SHA256 password hashing (passlib) | Per-user data isolation and admin role. |

### 🔊 Inference Pipeline
1. Upload validated (`.wav`, `.mp3`, `.flac`, `.webm`, max 10 MB).
2. First 5 seconds decoded and resampled to 16 kHz mono (`soundfile` fast path for WAV/FLAC, `librosa` otherwise), padded if shorter.
3. 100 Hz Butterworth high-pass filter.
4. 128-band Mel-spectrogram → dB → normalised → resized to 128×128.
5. EfficientNet-B0 inference → softmax over 4 classes.

---

## 🚀 Quick Start

### Prerequisites
- **Python 3.10+**
- **Node.js 18+**
- **FFmpeg** (Optional, for advanced audio format conversion)

### 1. Clone & Initialize
```bash
git clone <repo-url>
cd respiratory-ai
```

### 2. Backend Setup (FastAPI)
```bash
cd backend
python -m venv venv
# Windows: venv\Scripts\activate | Unix: source venv/bin/activate
pip install -r requirements.txt
```

### 3. Frontend Setup (React)
```bash
cd frontend
npm install
npm start
```

### 4. Running the Project
- **Backend**: `uvicorn app.main:app --reload --port 8000`
- **Frontend**: `http://localhost:3000`

---

## ⚙️ Deployment Notes

- Deployed on Render (`render.yaml`): `respiratory-ai-backend` (FastAPI), `respiratory-ai-frontend` (static React build), and the `respiratory-ai-db` PostgreSQL database.
- `DATABASE_URL` is provided by Render; without it the backend falls back to a local SQLite file for development.
- `SECRET_KEY` is **required** on Render (the backend refuses to start without it). A development-only fallback is used locally.
- Uploaded audio is written to a temporary file under `/tmp/uploads` for processing and deleted after each request; only the original filename and result are stored.
- Torch runs single-threaded on Render and Numba JIT is disabled to stay within the free-tier memory limit.

---

## 🔌 API Documentation

| Method | Endpoint | Auth | Description |
|--------|---------|------|-------------|
| `POST` | `/api/signup` | ❌ | Create new user account |
| `POST` | `/api/login` | ❌ | Authenticate and receive JWT token |
| `POST` | `/api/predict` | ✅ | Upload audio file for AI analysis |
| `GET` | `/api/history` | ✅ | Retrieve user's analysis history |
| `GET` | `/api/admin/users` | ✅ Admin | List all registered users |

---

## 📊 Sample Outputs

Example predictions on ICBHI samples and varied audio formats. These are illustrative outputs, **not a clinical validation study**:

| Audio Type | Prediction | Mapping | Severity | Confidence |
|-----------|-----------|-----------------|----------|------------|
| Crackle WAV | `crackle` | Fluid or Mucus Presence | Moderate | 28.0% |
| Normal WAV | `normal` | Normal Respiratory Pattern | Low | 26.4% |
| Mixed WAV | `mixed` | Complex Respiratory Condition | High | 30.2% |
| Wheeze MP3 | `wheeze` | Mild Airway Obstruction | Moderate | ~28% |

---

## 🤖 Deep Learning Pipeline

### Stage 1: Self-Supervised Pre-training (optional)
`backend/ml/train_ssl.py` — SimCLR-style contrastive learning on unlabelled audio.
- **Backbone**: EfficientNet-B0
- **Pretext Task**: NT-Xent contrastive loss with noise injection and frequency masking augmentations
- **Output**: `model/ssl_encoder.pth`

### Stage 2: Supervised Fine-tuning
`backend/ml/train_supervised.py` — initialises the backbone from `ssl_encoder.pth` when present, then trains the 4-class head.
- **Classes**: Normal, Crackle, Wheeze, Mixed
- **Optimizer**: Adam (lr=1e-5)
- **Output**: `model/model.pth` (the only weights loaded at inference time)

---

## 📁 Project Structure

```text
respiratory-ai/
├── backend/
│   ├── app/
│   │   ├── api/          # Auth, Predict, History endpoints
│   │   ├── services/     # Model inference & Audio preprocessing
│   │   └── models/       # Database entities
│   ├── ml/               # SSL & Supervised training scripts
│   └── model/            # Pre-trained weights (.pth)
├── frontend/
│   ├── src/
│   │   ├── pages/        # Dashboard, Login, Signup
│   │   └── services/     # API integration layer
└── docs/                 # Documentation & Walkthroughs
```

---

## 🛡️ Security & Privacy
- **JWT Protection**: Screening history is isolated per user; the frontend discards expired or malformed tokens.
- **Password Hashing**: PBKDF2-SHA256 via passlib.
- **Upload Hardening**: Extension allow-list, 10 MB size limit, server-generated temporary filenames, and generic error messages.
- **CORS Policy**: Restricted to the local dev and production frontend origins.
- **Logging**: Passwords, password-check results, and user records are not logged.

This project has not been audited for HIPAA or any other regulatory compliance and should not be used to store real patient data.

---

## 🚧 Future Roadmap
- [ ] **Full ICBHI Training**: Train on the complete dataset and publish evaluation metrics.
- [ ] **Object Storage**: AWS S3 for audio storage.
- [ ] **EHR Integration**: HL7/FHIR standards for electronic health record connectivity
- [ ] **Model Explainability**: Grad-CAM visualization for spectrogram heatmaps
- [ ] **Batch Processing**: Multi-sample upload and analysis
- [x] **PostgreSQL Persistence**
- [x] **Multi-Format Audio**: Support for WAV, MP3, FLAC, WebM
- [x] **Multi-Language**: English, Spanish, Hindi, Telugu support

---

## ⚕️ Clinical Safety Disclaimer

> **IMPORTANT**: This system is intended for **screening support only**. It is not a medical device, has not been clinically validated, and does not provide a diagnosis. Results must be reviewed by a licensed medical professional and are not a substitute for clinical judgment.

---

## 👤 Author

**Bhukya Jhansi**
