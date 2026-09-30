import subprocess
import time
import requests

print("Starting backend with subprocess-based warmup...")
process = subprocess.Popen(
    ["python", "-m", "uvicorn", "app.main:app", "--host", "127.0.0.1", "--port", "8008"],
    cwd=r"C:\Users\Bhukya Jhansi\OneDrive\文件\DL\AI_Powered_Respiratory_Screening\backend",
    stdout=subprocess.PIPE,
    stderr=subprocess.PIPE,
    text=True
)

time.sleep(2)  # wait for uvicorn to bind

print("\n--- Pinging /api/health during warmup (should NOT block) ---")
for i in range(30):
    t0 = time.time()
    try:
        r = requests.get("http://127.0.0.1:8008/api/health", timeout=2)
        data = r.json()
        elapsed = time.time() - t0
        model_ready = data.get("model_ready", "?")
        preproc_ready = data.get("preprocessing_ready", "?")
        print(f"[{i*1.0:.0f}s] [{elapsed:.2f}s] 200 | model={model_ready} preproc={preproc_ready}")
        if model_ready and preproc_ready:
            print("\n=== BOTH READY! ===")
            break
    except Exception as e:
        elapsed = time.time() - t0
        print(f"[{i*1.0:.0f}s] [{elapsed:.2f}s] TIMEOUT/ERROR")
    time.sleep(1)

# Now test prediction
r_signup = requests.post("http://127.0.0.1:8008/api/signup", json={"email": "test3@test.com", "password": "password"})
r_login = requests.post("http://127.0.0.1:8008/api/login", json={"email": "test3@test.com", "password": "password"})
token = r_login.json().get("access_token")

if token:
    headers = {"Authorization": f"Bearer {token}"}
    file_path = r"C:\Users\Bhukya Jhansi\OneDrive\文件\DL\AI_Powered_Respiratory_Screening\backend\app\uploads\08d9acbe-7bc0-4a3b-9cb7-61f17f359d1a_larger_silent.wav"
    
    print("\nSending Prediction Request...")
    t0 = time.time()
    with open(file_path, "rb") as f:
        files = {"file": ("test.wav", f, "audio/wav")}
        r_pred = requests.post("http://127.0.0.1:8008/api/predict", headers=headers, files=files)
    print(f"Prediction: {r_pred.status_code} in {time.time()-t0:.2f}s")
    if r_pred.status_code == 200:
        print(f"Result: {r_pred.json().get('prediction')}")

process.terminate()
