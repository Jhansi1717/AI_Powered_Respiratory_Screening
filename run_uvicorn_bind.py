import subprocess
import time
import socket

print("Starting Uvicorn...")
p = subprocess.Popen(["python", "-m", "uvicorn", "test_uvicorn_bind:app", "--host", "127.0.0.1", "--port", "8005"])

for i in range(20):
    time.sleep(0.5)
    try:
        s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        s.settimeout(0.5)
        s.connect(("127.0.0.1", 8005))
        s.close()
        print(f"[{i*0.5:.1f}s] Port is OPEN")
    except Exception:
        print(f"[{i*0.5:.1f}s] Port is closed")

p.terminate()
