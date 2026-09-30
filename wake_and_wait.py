import requests, time, json

print("Waking Render service and waiting for full readiness...")
t_start = time.time()

for attempt in range(40):
    elapsed = int(time.time() - t_start)
    try:
        r = requests.get("https://respiratory-ai-backend.onrender.com/api/health", timeout=30)
        print(f"[{elapsed}s] {r.status_code}", end="")
        
        if r.status_code == 200:
            try:
                data = r.json()
                mr = data.get("model_ready", "?")
                pr = data.get("preprocessing_ready", "?")
                print(f" | model={mr} preproc={pr}")
                if mr and pr:
                    print("\n=== SERVICE FULLY READY ===")
                    # Verify root and openapi too
                    r2 = requests.get("https://respiratory-ai-backend.onrender.com/", timeout=10)
                    print(f"GET / -> {r2.status_code}")
                    r3 = requests.get("https://respiratory-ai-backend.onrender.com/openapi.json", timeout=10)
                    print(f"GET /openapi.json -> {r3.status_code}")
                    exit(0)
            except:
                print(f" | body: {r.text[:100]}")
        elif r.status_code == 503:
            hdr = r.headers.get("x-render-routing", "")
            print(f" | routing: {hdr}")
        else:
            print(f" | headers: {dict(r.headers)}")
    except requests.exceptions.Timeout:
        print(f"[{elapsed}s] TIMEOUT (30s)")
    except Exception as e:
        print(f"[{elapsed}s] ERROR: {e}")
    
    time.sleep(15)

print("\nGave up after 10 minutes")
