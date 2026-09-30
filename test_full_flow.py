import requests, json, time, os

base_url = 'https://respiratory-ai-backend.onrender.com'
print("Checking health...")
try:
    r = requests.get(f'{base_url}/api/health', timeout=15)
    print("Status:", r.status_code)
    try:
        data = r.json()
        print(json.dumps(data, indent=2))
        mr = data.get('model_ready')
        pr = data.get('preprocessing_ready')
        if mr and pr:
            print("Both ready!")
        else:
            print(f"Not ready: model={mr}, preproc={pr}")
    except:
        print("Raw response:", r.text[:300])
except Exception as e:
    print("Error:", e)

print("\nAttempting login...")
try:
    r_login = requests.post(f"{base_url}/api/login", json={"email": "test3@test.com", "password": "password"}, timeout=15)
    print("Login status:", r_login.status_code)
    token = r_login.json().get("access_token")
    if token:
        print("Got token!")
        headers = {"Authorization": f"Bearer {token}"}
        file_path = r"C:\Users\Bhukya Jhansi\OneDrive\文件\DL\AI_Powered_Respiratory_Screening\backend\app\uploads\08d9acbe-7bc0-4a3b-9cb7-61f17f359d1a_larger_silent.wav"
        if os.path.exists(file_path):
            print("Found WAV file, uploading...")
            t0 = time.time()
            with open(file_path, "rb") as f:
                files = {"file": ("test.wav", f, "audio/wav")}
                r_pred = requests.post(f"{base_url}/api/predict", headers=headers, files=files, timeout=60)
            print(f"Prediction status: {r_pred.status_code} in {time.time()-t0:.2f}s")
            try:
                print(json.dumps(r_pred.json(), indent=2))
            except:
                print(r_pred.text[:500])
        else:
            print("WAV file not found locally to test upload.")
    else:
        print("Login failed, no token:", r_login.text[:300])
except Exception as e:
    print("Error during login/predict:", e)
