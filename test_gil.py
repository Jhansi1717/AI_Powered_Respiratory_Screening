import requests
import time
import subprocess
import sys

print("Starting server...")
process = subprocess.Popen(
    ["python", "-m", "uvicorn", "app.main:app", "--host", "127.0.0.1", "--port", "8003"],
    cwd=r"C:\Users\Bhukya Jhansi\OneDrive\文件\DL\AI_Powered_Respiratory_Screening\backend",
)

time.sleep(1) # wait for uvicorn to bind

print("Pinging GET / rapidly...")
for i in range(20):
    t0 = time.time()
    try:
        r = requests.get("http://127.0.0.1:8003/", timeout=2)
        print(f"[{time.time()-t0:.2f}s] {r.status_code}")
    except Exception as e:
        print(f"[{time.time()-t0:.2f}s] Timeout/Error!")
    time.sleep(0.5)

process.terminate()
