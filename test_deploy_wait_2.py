import requests
import time

print("Waiting for Render to deploy...")

timeout = time.time() + 600  # 10 minutes max wait
while time.time() < timeout:
    try:
        r = requests.get("https://respiratory-ai-backend.onrender.com/api/health", timeout=5)
        if r.status_code == 200:
            data = r.json()
            if "model_ready" in data:
                if data["model_ready"] and data["preprocessing_ready"]:
                    print("\n[SUCCESS] New commit is live and warmup is COMPLETE!")
                    exit(0)
                else:
                    print(f"Deploy detected, but warming up... {data}")
            else:
                print(".", end="", flush=True)  # Still running old code
        else:
            print(f"\nStatus {r.status_code}")
    except requests.exceptions.RequestException as e:
        pass
        
    time.sleep(20)

print("\nTimeout waiting for deployment.")
exit(1)
