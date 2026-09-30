import requests
import time

url_base = "https://respiratory-ai-backend.onrender.com"
file_path = r"C:\Users\Bhukya Jhansi\OneDrive\文件\DL\AI_Powered_Respiratory_Screening\backend\app\uploads\08d9acbe-7bc0-4a3b-9cb7-61f17f359d1a_larger_silent.wav"

# Login (use existing test account from previous session)
try:
    r_login = requests.post(f"{url_base}/api/login", json={"email": "test@test.com", "password": "password"}, timeout=30)
    print("Login status:", r_login.status_code)
    
    token = r_login.json().get("access_token")
    if not token:
        # Register then login
        requests.post(f"{url_base}/api/signup", json={"email": "test@test.com", "password": "password"}, timeout=30)
        r_login = requests.post(f"{url_base}/api/login", json={"email": "test@test.com", "password": "password"}, timeout=30)
        token = r_login.json().get("access_token")
        print("Re-login status:", r_login.status_code)

    if not token:
        print("ERROR: No token obtained. Response:", r_login.text)
        exit(1)

    print("Token obtained. Sending POST /api/predict ...")
    t0 = time.time()
    headers = {"Authorization": f"Bearer {token}"}
    with open(file_path, "rb") as f:
        files = {"file": ("test.wav", f, "audio/wav")}
        r = requests.post(f"{url_base}/api/predict", headers=headers, files=files, timeout=120)
    elapsed = time.time() - t0

    print(f"\n--- PRODUCTION RESPONSE (elapsed: {elapsed:.2f}s) ---")
    print("HTTP Status:", r.status_code)
    print("Response headers:", dict(r.headers))
    if r.status_code == 200:
        import json
        body = r.json()
        print("filename:", body.get("filename"))
        print("prediction:", body.get("prediction"))
        print("confidence:", body.get("confidence"))
        print("probabilities:", body.get("probabilities"))
        print("spectrogram shape: rows=", len(body.get("spectrogram", [])))
    else:
        print("Body:", r.text[:500])

except Exception as e:
    print("Exception:", str(e))
