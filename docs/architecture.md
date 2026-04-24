# Respiratory AI — System Architecture

## Overview

This project is a professional-grade clinical AI system designed to screen for respiratory conditions using deep learning. It features a **React-based diagnostic dashboard**, a **high-performance FastAPI backend**, a **PyTorch inference engine** (EfficientNet-B0), and a **dual-stage Self-Supervised Learning (SSL) training pipeline**.

---

## System Components

### 1. Frontend (React & Framer Motion)
- **Diagnostic Dashboard**: Elite vertical-stack UI with broadened interaction cards for a focused clinical workflow.
- **Real-time Waveform Acquisition**: Web Audio API `AnalyserNode` oscilloscope rendering during live recording.
- **Specialist Locator Module**: Interactive geolocation-aware panel that detects user location and finds the recommended specialist on Google Maps.
- **Acoustic Visualizer**: Broadened (h-48) canvas-based Mel-spectrogram rendering with Blue → Purple → Orange → Yellow colormap and high-frequency legend.
- **AI Explainability Panel**: Dedicated report section providing technical rationales ("Why this result?") and clinical action cues.
- **Reporting Engine**: Client-side logic for generating hospital-standard PDF reports via `jsPDF`, including Patient Verification signatures.
- **Advanced Data Management**: History module with classification filtering, full-text file search, and chronological sorting.
- **Analytics Module**: Zero-dependency SVG charts with clinical glow effects and high-fidelity tooltips for confidence trends.
- **Localization Layer**: Centralized translation system supporting English, Spanish, Hindi, and Telugu.

### 2. Backend (FastAPI)
- **Prediction API** (`/api/predict`): Orchestrates the diagnostic flow — audio receiving → format validation → preprocessing → model inference → database persistence → response with clinical data.
- **Preprocessing Pipeline**: Dual-strategy audio loading (SoundFile → Librosa fallback) with high-pass filtering, resampling, and Mel-spectrogram extraction.
- **RBAC Security**: JWT-based authentication (Python-JOSE) with Argon2 password hashing and distinct User/Admin permission levels.
- **Admin Services**: Endpoints for system monitoring, user management, and global analytics.
- **History API**: Paginated analysis history with server-side search capabilities.

### 3. Clinical Intelligence Layer
- **Inference Engine**: EfficientNet-B0 backbone (via `timm`) with 1280-dim feature extraction and 4-class linear classifier.
- **AI Explainability Engine**: Maps raw predictions to technical clinical signatures:
  - `normal`: "Stable respiratory rhythm; no dominant pathological acoustic transients."
  - `wheeze`: "High-frequency continuous patterns detected, suggesting airway constriction."
  - `crackle`: "Irregular waveform spikes identified, consistent with fluid/mucus interaction."
  - `mixed`: "Multiple abnormal acoustic markers detected; overlapping pathological signatures."

- **Doctor Recommendation Engine**: Context-aware specialist suggestions with urgency levels:
  - Normal → General Physician (Routine)
  - Wheeze (mild) → Pulmonologist / Allergist (3-5 days)
  - Wheeze (severe) → Chest Specialist (Urgent, 24-48h)
  - Crackle (mild) → General Physician (2-3 days)
  - Crackle (severe) → Pulmonologist / Infectious Disease (Immediate)
  - Mixed → Senior Pulmonologist (Immediate)

- **History Management Module**: State-derived filtering logic:
  - `filteredHistory`: Filters by prediction type (Normal/Abnormal) and search query.
  - `sortedHistory`: Chronological sorting (Newest/Oldest) using ISO-8601 timestamp comparison.

- **Severity Scoring**: Numerical scoring algorithm (1-10) with visual alert banners (Low/Moderate/High).

---

## Self-Supervised Learning (SSL) Pipeline

The system implements a **dual-stage training workflow** to maximize accuracy, particularly useful when labeled respiratory data is scarce.

### Stage 1: Contrastive Pre-training

```
Unlabeled Audio (.wav/.mp3)
      ↓
  Load → Mono → Resample (16kHz) → High-Pass Filter → Mel-Spectrogram (128×128)
      ↓
  SSLTransform: Generate 2 augmented views
      ├── View 1: Gaussian Noise (σ=0.01) + Time Shift (±20 frames)
      └── View 2: Frequency Mask (10-band) + Gaussian Noise (σ=0.02)
      ↓
  EfficientNet-B0 Backbone → Projection Head (1280 → 512 → 128)
      ↓
  NT-Xent Loss (Normalized Temperature-scaled Cross-Entropy, τ=0.1)
      ↓
  Output: model/ssl_encoder.pth (backbone state_dict only)
```

*   **Dataset**: Unlabeled audio samples from the Coswara dataset (or user uploads as fallback).
*   **Method**: SimCLR-style contrastive learning with NT-Xent loss.
*   **Pretext Task**: The model learns to identify similar acoustic patterns across different augmentations of the same audio clip.
*   **Architecture**: `SSLAudioEncoder` — EfficientNet-B0 (in_chans=1, num_classes=0, global_pool=avg) + Projection Head (Linear → ReLU → Linear).
*   **Script**: `backend/ml/train_ssl.py`
*   **Output**: `model/ssl_encoder.pth` (Backbone weights only, without classifier)

### Stage 2: Supervised Fine-tuning

```
Labeled Audio (.wav/.mp3)  +  Labels (Normal/Crackle/Wheeze/Mixed)
      ↓
  Preprocessing Pipeline → Mel-Spectrogram (128×128)
      ↓
  Model (backbone initialized from ssl_encoder.pth, strict=False)
      ↓
  EfficientNet-B0 (forward_features) → Global Avg Pool → Linear(1280, 4)
      ↓
  CrossEntropyLoss + Adam optimizer (lr=1e-5)
      ↓
  Output: model/model.pth (full model state_dict)
```

*   **Dataset**: Labeled ICBHI 2017 respiratory database (or user uploads with pattern-based auto-labeling for demos).
*   **Method**: Supervised classification with cross-entropy loss.
*   **Integration**: The SSL pre-trained backbone is loaded with `strict=False` (ignoring missing classifier keys), and a 4-class classification head is attached.
*   **Script**: `backend/ml/train_supervised.py`
*   **Output**: `model/model.pth` (Full diagnostic model)

---

## Audio Preprocessing Pipeline

The preprocessing pipeline handles multiple audio formats with a robust three-tier loading strategy:

```
Raw Audio Bytes / Browser Recording
      ↓
  ┌─ Frontend: Web Audio API (WebM → 16-bit PCM WAV conversion) ─┐
  │                                                               │
  ├─ Backend Strategy 1: SoundFile (fast, WAV/FLAC/OGG)           │
  │     ↓ (on failure)                                            │
  └─ Backend Strategy 2: Librosa + FFmpeg Fallback (MP3/WebM)     │
      ↓
  Mono Conversion (stereo → mean / librosa.to_mono)
      ↓
  Resampling → 16,000 Hz (librosa.resample)
      ↓
  High-Pass Filter → Butterworth 5th-order, 100 Hz cutoff
      ↓
  Length Normalization → 5 seconds (80,000 samples, pad or truncate)
      ↓
  Mel-Spectrogram → 128 Mel bands (librosa.feature.melspectrogram)
      ↓
  dB Scale → librosa.power_to_db (ref=max)
      ↓
  ┌── Visualization: Normalize to 0-255 uint8 (for Canvas heatmap)
  └── Model Input: Z-score normalize → Resize to 128×128 (bilinear)
```

### Specialist Locator & Geolocation
1. **Trigger**: After a prediction is made, the user clicks "Find Specialists Nearby".
2. **Detection**: The module uses `navigator.geolocation` to request the user's current coordinates.
3. **Map Integration**: It dynamically generates a Google Maps embed URL based on the `specialist` type and coordinates.
4. **Instant-On UI**: Shows a general search immediately if geolocation is pending or denied, ensuring the feature is always functional.
5. **Direction Engine**: Provides a direct link to Google Maps directions from the user's current origin to the recommended specialist.

---

## Deployment Instructions

### 1. SSL Pre-training
Place unlabeled `.wav` or `.mp3` audio files in `backend/data/coswara/` and run:
```bash
cd backend
python ml/train_ssl.py
```
Falls back to `app/uploads/` automatically if Coswara data is not found.

### 2. Supervised Fine-tuning
Place labeled `.wav` or `.mp3` files in `backend/data/icbhi/` and run:
```bash
python ml/train_supervised.py
```
Falls back to `app/uploads/` with auto-labeling based on ICBHI filename patterns.

### 3. Start Backend
```bash
uvicorn app.main:app --reload --port 8000
```

### 4. Start Frontend
```bash
cd frontend
npm install && npm start
```

---

## Data Flow / Workflow

1. **Input Capture**: User uploads an audio file (WAV/MP3/FLAC/WebM) or performs a live recording via browser microphone.
2. **Format Validation**: Backend validates file extension and minimum size (4 KB threshold).
3. **Audio Storage**: File is saved to `app/uploads/` with UUID-prefixed filename.
4. **Preprocessing**: Audio is loaded (SoundFile → Librosa fallback), filtered, resampled, and converted to a Mel-spectrogram tensor (1×128×128).
5. **AI Inference**: The PyTorch model (`EfficientNet-B0 + Linear`) classifies into one of 4 classes with softmax probabilities.
6. **Clinical Interpretation**: The Insight Engine maps prediction + confidence to severity scores, symptoms, conditions, and specialist recommendations.
7. **Database Persistence**: Prediction result and confidence are stored in the user's history record.
8. **Response**: Backend returns prediction, confidence, probability distribution, and raw spectrogram visualization data.
9. **Frontend Rendering**: Dashboard displays clinical insight cards, spectrogram heatmap, confidence analysis bar, and AI observations.
10. **Reporting**: User can generate a signed PDF report containing all clinical findings, severity scores, and verification signatures.

---

## Project Structure

### Backend
| Path | Purpose |
|------|---------|
| `api/routes/auth.py` | Signup, Login (JWT) |
| `api/routes/predict.py` | Audio upload & inference |
| `api/routes/history.py` | User analysis history |
| `api/routes/admin.py` | Admin user management |
| `services/model.py` | SSLAudioEncoder, Model, Inference |
| `services/preprocessing.py` | Audio → Spectrogram pipeline |
| `services/augmentations.py` | SSL transform (noise, mask, shift) |
| `models/` | SQLAlchemy entities (User, Record) |
| `core/` | Security config, DB session management |

### Frontend
| Path | Purpose |
|------|---------|
| `pages/Dashboard.js` | Main diagnostic interface (upload, results, history, analytics, admin) |
| `pages/Login.js` | Authentication (Login/Signup with validation) |
| `pages/Home.js` | Landing page |
| `services/api.js` | Axios API integration (JWT headers, error handling) |
| `utils/translations.js` | Multi-language translations (EN, ES, HI, TE) |
| `utils/auth.js` | Authentication helpers |
| `utils/token.js` | JWT decode & RBAC role extraction |

### ML Training
| Path | Purpose |
|------|---------|
| `ml/train_ssl.py` | Stage 1: SimCLR contrastive pre-training |
| `ml/train_supervised.py` | Stage 2: Supervised fine-tuning with SSL transfer |

---

## Security Model

- **Authentication**: JWT with configurable expiration via Python-JOSE.
- **Password Security**: Argon2 hashing (memory-hard, GPU-resistant) via Passlib.
- **Authorization**: Role-based access control. Admin users can access `/api/admin/*` routes.
- **Data Privacy**: User history is isolated per-user. CORS configured with origin restrictions.
- **Startup Migration**: Auto-adds `role` column to existing `users` table on first startup.

---

## Deployment Architecture

| Tier | Technology | Purpose |
|------|-----------|---------|
| **Web Tier** | Vercel / Nginx | Static frontend assets |
| **App Tier** | Dockerized FastAPI (EC2 / Cloud Run) | API server & inference |
| **Data Tier** | SQLite (dev) / PostgreSQL (prod) | Relational data storage |
| **Storage** | AWS S3 (Planned) | Persistent audio & spectrogram storage |

---

## Validated Prediction Results

| Audio Input | Model Output | Clinical Mapping | Severity Score |
|------------|-------------|-----------------|---------------|
| ICBHI Crackle WAV | `crackle` (28% conf) | Fluid or Mucus Presence | Moderate (5/10) |
| Clean Breathing WAV | `normal` (26.4% conf) | Normal Respiratory Pattern | Low (2/10) |
| Mixed Abnormal WAV | `mixed` (30.2% conf) | Complex Respiratory Condition | High (9/10) |

> Confidence values reflect demo training (33 files, 5 epochs). Full ICBHI training typically achieves 75-90% confidence.

---

## Clinical Safety Disclaimer

The system is designed for **screening and screening support only**. All reports include mandatory disclaimers emphasizing that results are non-diagnostic and require verification by a licensed medical professional. This tool is not a substitute for clinical judgment.