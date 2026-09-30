import requests
import time
import subprocess

p = subprocess.Popen(["python", "-m", "uvicorn", "app.stft_test:app", "--host", "127.0.0.1", "--port", "8006"], cwd=r"C:\Users\Bhukya Jhansi\OneDrive\文件\DL\AI_Powered_Respiratory_Screening\backend")

time.sleep(2)

import threading
def call_stft():
    requests.get("http://127.0.0.1:8006/stft")
    
threading.Thread(target=call_stft).start()

time.sleep(0.1)

print("Pinging root...")
for i in range(10):
    t0 = time.time()
    try:
        r = requests.get("http://127.0.0.1:8006/", timeout=0.5)
        print(f"[{time.time()-t0:.2f}s] {r.status_code}")
    except Exception as e:
        print(f"[{time.time()-t0:.2f}s] Timeout")
    time.sleep(0.5)

p.terminate()
