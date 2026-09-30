import requests
import time

print("Monitoring Render deployment of b00fb4f...")
print("Waiting for new code to deploy (looking for model_ready/preprocessing_ready keys)...\n")

timeout = time.time() + 600  # 10 min max
phase = "waiting_for_deploy"

while time.time() < timeout:
    try:
        r = requests.get("https://respiratory-ai-backend.onrender.com/api/health", timeout=10)
        if r.status_code == 200:
            data = r.json()
            if "model_ready" in data and "preprocessing_ready" in data:
                mr = data["model_ready"]
                pr = data["preprocessing_ready"]
                elapsed = int(time.time() - timeout + 600)
                if mr and pr:
                    print(f"\n[{elapsed}s] BOTH READY! {data}")
                    
                    # Quick verification of other endpoints
                    r1 = requests.get("https://respiratory-ai-backend.onrender.com/", timeout=5)
                    print(f"GET / -> {r1.status_code}")
                    r2 = requests.get("https://respiratory-ai-backend.onrender.com/openapi.json", timeout=5)
                    print(f"GET /openapi.json -> {r2.status_code}")
                    exit(0)
                else:
                    print(f"[{elapsed}s] Warming up: model={mr} preproc={pr}")
            else:
                print(".", end="", flush=True)
        elif r.status_code == 503:
            print("5", end="", flush=True)
        else:
            print(f"[{r.status_code}]", end="", flush=True)
    except requests.exceptions.RequestException:
        print("x", end="", flush=True)
    
    time.sleep(15)

print("\nTimeout.")
exit(1)
