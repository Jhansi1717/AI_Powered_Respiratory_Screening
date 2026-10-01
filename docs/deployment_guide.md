# Respiratory AI — Deployment Guide

## Current deployment

The repository is deployed with a Render Blueprint defined in `render.yaml`.

Services:

| Resource | Render name | Purpose |
|---|---|---|
| Backend | `respiratory-ai-backend` | FastAPI API + inference |
| Frontend | `respiratory-ai-frontend` | React static site |
| Database | `respiratory-ai-db` | PostgreSQL |

## Live URLs

- Frontend: https://respiratory-ai-frontend.onrender.com
- Backend: https://respiratory-ai-backend.onrender.com
- Swagger: https://respiratory-ai-backend.onrender.com/docs
- Health: https://respiratory-ai-backend.onrender.com/api/health

## Blueprint configuration

### Backend

- Runtime: Python
- Root directory: `backend`
- Build: `pip install -r requirements.txt`
- Start: `python -m uvicorn app.main:app --host 0.0.0.0 --port $PORT`
- Health check: `/api/health`

### Frontend

- Runtime: Static site
- Root directory: `frontend`
- Build: `npm install && npm run build`
- Publish directory: `build`

The static site uses a catch-all rewrite:

```yaml
routes:
  - type: rewrite
    source: /*
    destination: /index.html
```

This allows React Router paths such as `/dashboard` to load on direct navigation or browser refresh.

### Database

The Blueprint provisions a Render PostgreSQL database named `respiratory-ai-db` and injects its connection string into the backend through `DATABASE_URL`.

## Production environment variables

Backend:

- `DATABASE_URL`
- `SECRET_KEY`
- `PYTHON_VERSION`

The Blueprint generates `SECRET_KEY`. Do not commit a production secret to Git.

Frontend:

- `REACT_APP_API_URL` is present in the Blueprint. The application currently chooses its production API host in `frontend/src/services/api.js`.

## Health verification

After a backend deployment:

```bash
curl -i https://respiratory-ai-backend.onrender.com/api/health
```

Expected shape:

```json
{
  "status": "healthy",
  "database": "connected",
  "storage": "writable",
  "model_ready": true
}
```

## Production smoke test

1. Open the frontend.
2. Create or use a test account.
3. Log in.
4. Upload a valid `.wav` file.
5. Run analysis.
6. Confirm the result appears.
7. Run several consecutive predictions to check memory stability.
8. Open history and confirm the prediction is persisted.
9. Refresh `/dashboard` and confirm the React Router rewrite works.
10. Check Render logs for exceptions or process restarts.

## Known operational limits

The inference service has been optimized for bounded memory use, but shared/free hosting does not provide deterministic latency. Treat the current deployment as a portfolio/demo deployment until resource sizing, monitoring, backups, and security requirements have been formally reviewed.

## Troubleshooting

### Dashboard refresh returns 404

Check the frontend static-site rewrite to `/index.html`.

### Health is healthy but prediction returns 401

The JWT may be expired or invalid. Log in again and obtain a new token.

### Prediction returns 500

Check the backend Render logs at the same timestamp and inspect preprocessing/model exceptions.

### Prediction becomes slow or the service restarts

Check Render memory/CPU metrics and process logs before changing model or preprocessing code.
