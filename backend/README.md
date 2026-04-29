# 🧠 Respiratory AI — Backend (FastAPI)

The high-performance core of the Respiratory AI platform. This service handles audio preprocessing, AI model inference, and secure user management.

## 🚀 Getting Started

### 1. Virtual Environment
```bash
python -m venv venv
# Windows
venv\Scripts\activate
# Unix
source venv/bin/activate
```

### 2. Install Dependencies
```bash
pip install -r requirements.txt
```

### 3. Start Server
```bash
uvicorn app.main:app --reload --port 8000
```

## 🏗️ Technical Architecture

### 🎙️ Audio Processing Pipeline
1. **Dynamic Decoding**: Uses `soundfile` for high-speed WAV/FLAC processing.
2. **Signal Enhancement**: Applies Butterworth high-pass filtering (100Hz) to isolate lung sounds.
3. **Spectrogram Generation**: Computes DB-scale Mel-spectrograms for AI consumption.

### 🤖 AI Model
- **Architecture**: EfficientNet-B0 with a custom classification head.
- **Training**: Dual-stage SSL (Self-Supervised Learning) pre-training.
- **Inference**: Optimized with multi-threaded Torch and `inference_mode`.

### 🔐 Security Model
- **Auth**: JWT-based authentication with Argon2 password hashing.
- **RBAC**: Role-Based Access Control (Admin/User).
- **Validation**: Strict Pydantic schemas for all request/response bodies.

## 🔌 API Documentation
- **Interactive Docs**: [http://localhost:8000/docs](http://localhost:8000/docs)
- **Alternative (ReDoc)**: [http://localhost:8000/redoc](http://localhost:8000/redoc)

## 📁 Key Directories
- `/app/api`: Endpoint routing logic.
- `/app/services`: Audio engineering and ML inference code.
- `/app/models`: Database schema definitions (SQLAlchemy).
- `/ml`: Model training and evaluation scripts.
