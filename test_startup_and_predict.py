import subprocess
import time
import requests
import sys

def run_tests():
    print("Starting local backend...")
    # Start the backend as a subprocess
    process = subprocess.Popen(
        ["python", "-m", "uvicorn", "app.main:app", "--host", "127.0.0.1", "--port", "8002"],
        cwd=r"C:\Users\Bhukya Jhansi\OneDrive\文件\DL\AI_Powered_Respiratory_Screening\backend",
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        text=True
    )
    
    try:
        t_startup = time.time()
        
        # Wait for the port to be open (basic HTTP response)
        server_up = False
        for _ in range(150):
            try:
                r = requests.get("http://127.0.0.1:8002/api/health", timeout=1)
                server_up = True
                break
            except requests.exceptions.RequestException:
                time.sleep(0.1)
                
        if not server_up:
            print("Server failed to start")
            return
            
        print(f"Server is listening (startup took {time.time() - t_startup:.2f}s).")
        
        # Test 2: Health check during warmup
        r_health_warmup = requests.get("http://127.0.0.1:8002/api/health")
        print("\nHealth Check (During Warmup):")
        print(r_health_warmup.json())
        
        # Wait for warmup to complete
        print("\nWaiting for warmup to complete...")
        t_warmup_start = time.time()
        while True:
            r = requests.get("http://127.0.0.1:8002/api/health")
            data = r.json()
            if data.get("model_ready") and data.get("preprocessing_ready"):
                break
            time.sleep(0.5)
            if time.time() - t_warmup_start > 30:
                print("Warmup timed out!")
                break
                
        warmup_time = time.time() - t_warmup_start
        print(f"Warmup completed in {warmup_time:.2f}s")
        
        # Test 3: Health check after warmup
        r_health_ready = requests.get("http://127.0.0.1:8002/api/health")
        print("\nHealth Check (After Warmup):")
        print(r_health_ready.json())
        
        # We need a token to test /api/predict
        r_signup = requests.post("http://127.0.0.1:8002/api/signup", json={"email": "test2@test.com", "password": "password"})
        r_login = requests.post("http://127.0.0.1:8002/api/login", json={"email": "test2@test.com", "password": "password"})
        token = r_login.json().get("access_token")
        
        if not token:
            print("Failed to get token!")
            return
            
        headers = {"Authorization": f"Bearer {token}"}
        file_path = r"C:\Users\Bhukya Jhansi\OneDrive\文件\DL\AI_Powered_Respiratory_Screening\backend\app\uploads\08d9acbe-7bc0-4a3b-9cb7-61f17f359d1a_larger_silent.wav"
        
        # Test 4: First Prediction
        print("\nSending First Prediction Request...")
        t_pred1_start = time.time()
        with open(file_path, "rb") as f:
            files = {"file": ("test.wav", f, "audio/wav")}
            r_pred1 = requests.post("http://127.0.0.1:8002/api/predict", headers=headers, files=files)
        t_pred1_total = time.time() - t_pred1_start
        
        print(f"First Prediction HTTP Status: {r_pred1.status_code}")
        if r_pred1.status_code == 200:
            print("First Prediction Result:", r_pred1.json().get("prediction"))
        print(f"Total Request Time: {t_pred1_total:.2f}s")
        
        # Test 5: Second Prediction
        print("\nSending Second Prediction Request...")
        t_pred2_start = time.time()
        with open(file_path, "rb") as f:
            files = {"file": ("test.wav", f, "audio/wav")}
            r_pred2 = requests.post("http://127.0.0.1:8002/api/predict", headers=headers, files=files)
        t_pred2_total = time.time() - t_pred2_start
        
        print(f"Second Prediction HTTP Status: {r_pred2.status_code}")
        if r_pred2.status_code == 200:
            print("Second Prediction Result:", r_pred2.json().get("prediction"))
        print(f"Total Request Time: {t_pred2_total:.2f}s")
        
        # Ask server to shutdown or just kill it
        process.terminate()
        
    except Exception as e:
        print(f"Test failed with exception: {e}")
        process.terminate()

run_tests()
