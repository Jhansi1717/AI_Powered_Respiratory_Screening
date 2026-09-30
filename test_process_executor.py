from fastapi import FastAPI
import time
import subprocess
import os

app = FastAPI()

import concurrent.futures
executor = concurrent.futures.ProcessPoolExecutor(max_workers=1)

def heavy_numba():
    import librosa
    import numpy as np
    dummy = np.zeros(80000, dtype=np.float32)
    librosa.feature.melspectrogram(y=dummy, sr=16000, n_mels=128)
    return True

@app.get("/")
def root():
    return {"status": "ok"}

@app.get("/stft")
async def run_stft():
    print("Running heavy numba in executor...")
    import asyncio
    loop = asyncio.get_running_loop()
    await loop.run_in_executor(executor, heavy_numba)
    return {"status": "done"}
