import requests, time, json

print("Waiting for both model and preprocessing to be ready...")
t0 = time.time()
for i in range(40):
    try:
        r = requests.get("https://respiratory-ai-backend.onrender.com/api/health", timeout=15)
        elapsed = int(time.time() - t0)
        if r.status_code == 200:
            data = r.json()
            mr = data.get("model_ready")
            pr = data.get("preprocessing_ready")
            print(f"[{elapsed}s] model={mr} preproc={pr}")
            if mr and pr:
                print("\n=== FULLY READY ===")
                exit(0)
        else:
            print(f"[{int(time.time()-t0)}s] HTTP {r.status_code}")
    except Exception as e:
        print(f"[{int(time.time()-t0)}s] {e}")
    time.sleep(10)

print("Timed out waiting for readiness")
