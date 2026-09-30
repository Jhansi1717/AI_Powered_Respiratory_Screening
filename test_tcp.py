import socket
import time
import subprocess

print("Starting server...")
process = subprocess.Popen(
    ["python", "-m", "uvicorn", "app.main:app", "--host", "127.0.0.1", "--port", "8004"],
    cwd=r"C:\Users\Bhukya Jhansi\OneDrive\文件\DL\AI_Powered_Respiratory_Screening\backend",
)

time.sleep(1) # wait for bind

print("Pinging TCP rapidly...")
for i in range(20):
    t0 = time.time()
    try:
        s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        s.settimeout(1.0)
        s.connect(("127.0.0.1", 8004))
        s.close()
        print(f"[{time.time()-t0:.2f}s] TCP Connected!")
    except Exception as e:
        print(f"[{time.time()-t0:.2f}s] TCP Error: {e}")
    time.sleep(0.5)

process.terminate()
