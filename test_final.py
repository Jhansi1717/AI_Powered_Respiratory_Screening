import requests
import time
import os
from fastapi.testclient import TestClient
from backend.app.main import app

client = TestClient(app)

print("Running local verification...")

# A. Backend Checks
print("\n--- A. Backend Checks ---")
res = client.get("/")
print("GET / :", res.status_code, res.json())

res = client.get("/api/health")
print("GET /api/health :", res.status_code, res.json())

res = client.get("/openapi.json")
print("GET /openapi.json :", res.status_code, len(res.content), "bytes")

# B. Auth
print("\n--- B. Auth Checks ---")
email = f"test_{int(time.time())}@example.com"
password = "password123"

res = client.post("/api/signup", json={"email": email, "password": password})
print("Signup :", res.status_code, res.json())

res = client.post("/api/login", json={"email": email, "password": password})
print("Login :", res.status_code)
token = res.json().get("access_token")

res = client.get("/api/history", headers={"Authorization": f"Bearer {token}"})
print("History :", res.status_code, res.json())

# C & D & E. Prediction
print("\n--- C. Prediction Checks ---")
def test_audio(filename):
    path = os.path.join("backend", filename)
    print(f"\nTesting {filename}...")
    
    # Wait for model to be ready
    for _ in range(60):
        h = client.get("/api/health").json()
        if h.get("model_ready"):
            break
        time.sleep(1)
        
    t0 = time.time()
    with open(path, "rb") as f:
        res = client.post(
            "/api/predict",
            headers={"Authorization": f"Bearer {token}"},
            files={"file": (filename, f, "audio/wav")}
        )
    print(f"Result in {time.time()-t0:.2f}s: {res.status_code}")
    if res.status_code == 200:
        data = res.json()
        print(f"Prediction: {data['prediction']} ({data['confidence']})")
    else:
        print("Error:", res.text)

test_audio("5sec_16k.wav")
test_audio("short.wav")
test_audio("15sec_16k.wav")
test_audio("10sec_44k.wav")

print("\n--- Stress Test ---")
test_audio("5sec_16k.wav")
test_audio("5sec_16k.wav")

print("\nAll tests completed.")
