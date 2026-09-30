import requests
import time

print("Waiting for Render to deploy new commit 5d37d65...")

deployed = False
timeout = time.time() + 300  # 5 minutes max wait
while time.time() < timeout:
    try:
        r = requests.get("https://respiratory-ai-backend.onrender.com/api/health", timeout=5)
        if r.status_code == 200:
            data = r.json()
            # If the new keys exist, the new code is deployed!
            if "model_ready" in data and "preprocessing_ready" in data:
                if data["model_ready"] and data["preprocessing_ready"]:
                    print("\n[SUCCESS] New commit is live and warmup is COMPLETE!")
                    print("Health check response:", data)
                    deployed = True
                    break
                else:
                    print(f"Deploy detected, but warming up... {data}")
            else:
                print(".", end="", flush=True)  # Still running old code
        else:
            print(f"\nStatus {r.status_code}")
    except requests.exceptions.RequestException as e:
        print(f"\nRequest failed: {e}")
        
    time.sleep(10)

if not deployed:
    print("\nTimeout waiting for deployment.")
    exit(1)

# Now check the other endpoints as requested
try:
    print("\nChecking GET /")
    r1 = requests.get("https://respiratory-ai-backend.onrender.com/", timeout=5)
    print("GET / ->", r1.status_code, r1.text)
    
    print("\nChecking GET /openapi.json")
    r2 = requests.get("https://respiratory-ai-backend.onrender.com/openapi.json", timeout=5)
    print("GET /openapi.json ->", r2.status_code)
except Exception as e:
    print("Failed checking other endpoints:", e)
