import os
import psutil
import time
import numpy as np
import warnings
warnings.filterwarnings('ignore')
import sys
import soundfile as sf
# Set up test environment
os.environ["NUMBA_DISABLE_JIT"] = "1"
os.environ["RENDER"] = "1"

# Generate test WAVs
sf.write("short.wav", np.zeros(16000*2, dtype=np.float32), 16000)
sf.write("5sec_16k.wav", np.zeros(16000*5, dtype=np.float32), 16000)
sf.write("15sec_16k.wav", np.zeros(16000*15, dtype=np.float32), 16000)
sf.write("10sec_44k.wav", np.zeros(44100*10, dtype=np.float32), 44100)

from app.services.preprocessing import preprocess_audio

def print_mem(tag):
    process = psutil.Process(os.getpid())
    rss_mb = process.memory_info().rss / 1024 / 1024
    print(f"[{tag}] RSS: {rss_mb:.2f} MB")

files = [
    "short.wav",
    "5sec_16k.wav",
    "15sec_16k.wav",
    "10sec_44k.wav"
]

print_mem("Before Preprocessing Tests")

for f in files:
    print(f"\n--- Testing {f} ---")
    t0 = time.time()
    try:
        tensor, viz = preprocess_audio(file_path=f)
        print(f"Preprocessing time: {time.time()-t0:.3f}s")
        print(f"Final tensor shape: {tensor.shape}")
        print_mem(f"After {f}")
    except Exception as e:
        print(f"Error: {e}")

