# 🚀 Respiratory AI — Perfect Deployment Guide

This guide provides step-by-step instructions for deploying the **Respiratory AI** platform to a professional cloud environment using **Render.com**.

---

## 🏗️ Architecture Overview

The platform is deployed as a **Dual-Service Stack**:
1.  **Backend**: FastAPI running on Python 3.10+ (Web Service).
2.  **Frontend**: React 18 SPA (Static Site).

---

## 🛠️ Automated Deployment (Recommended)

The repository includes a `render.yaml` file that automates the entire provisioning process.

1.  Log in to [Render.com](https://render.com).
2.  Click **New +** → **Blueprint**.
3.  Connect your GitHub repository: `Jhansi1717/AI_Powered_Respiratory_Screening`.
4.  Render will automatically detect the services:
    *   `respiratory-ai-backend` (FastAPI)
    *   `respiratory-ai-frontend` (React)
5.  Click **Apply**.

---

## ⚙️ Manual Configuration

If you prefer to set up services manually:

### 1. Backend (FastAPI)
-   **Service Type**: Web Service
-   **Runtime**: Python 3
-   **Root Directory**: `backend`
-   **Build Command**: `pip install -r requirements.txt`
-   **Start Command**: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
-   **Environment Variables**:
    *   `PORT`: `10000` (or leave empty)
    *   `DATABASE_URL`: `sqlite:///./test.db` (For production, add a **Render Disk** or use **PostgreSQL**).

### 2. Frontend (React)
-   **Service Type**: Static Site
-   **Build Command**: `npm install && npm run build`
-   **Publish Directory**: `build`
-   **Root Directory**: `frontend`
-   **Environment Variables**:
    *   `REACT_APP_API_URL`: Your backend service URL (e.g., `https://respiratory-ai-backend.onrender.com`).

---

## 🔒 Production Hardening

For a truly "Perfect" deployment, follow these final steps:

### 1. Persistence
SQLite files are ephemeral on Render. For production data retention:
-   **Option A**: Add a **Render Disk** mounted at `/backend/app/` to keep `test.db` persistent.
-   **Option B**: Update the `DATABASE_URL` to a **Render PostgreSQL** instance.

### 2. Security
-   Update `backend/app/main.py` to restrict `allow_origins` to your frontend domain only:
    ```python
    app.add_middleware(
        CORSMiddleware,
        allow_origins=["https://your-frontend-domain.com"],
        # ...
    )
    ```

### 3. Model Storage
Ensure `backend/model/model.pth` and `backend/model/ssl_encoder.pth` are included in your repository. If the files are too large (>100MB), use **Git LFS** or upload them to **AWS S3**.

---

## ✅ Deployment Checklist
- [ ] Backend is accessible at `/docs` (Swagger UI).
- [ ] Frontend successfully communicates with the Backend (Check Browser Console).
- [ ] Multi-language support loads correctly.
- [ ] PDF generation is functional in the cloud environment.
- [ ] Audio recording works (Requires HTTPS, which Render provides by default).

---

## 👤 Support
For technical assistance during deployment, refer to the [System Architecture](./architecture.md) documentation.
