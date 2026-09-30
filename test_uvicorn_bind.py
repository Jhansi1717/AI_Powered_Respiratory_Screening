from fastapi import FastAPI
import time
import sys

print("Global scope started...")
time.sleep(5)  # Simulate 5s JIT compile
print("Global scope finished!")

app = FastAPI()

@app.get("/")
def root():
    return {"status": "ok"}
