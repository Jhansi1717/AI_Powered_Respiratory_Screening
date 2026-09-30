import requests

try:
    print("Checking GET /api/health")
    r = requests.get("https://respiratory-ai-backend.onrender.com/api/health", timeout=10)
    print("GET /api/health ->", r.status_code, r.text)
except Exception as e:
    print("Failed:", e)
