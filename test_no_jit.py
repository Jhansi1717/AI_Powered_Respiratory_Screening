import os
import time

os.environ["NUMBA_DISABLE_JIT"] = "1"

t0 = time.time()
import librosa
import numpy as np

TARGET_SR = 16000
N_MELS = 128
SAMPLES = 80000

dummy = np.zeros(SAMPLES, dtype=np.float32)

t1 = time.time()
librosa.feature.melspectrogram(y=dummy, sr=TARGET_SR, n_mels=N_MELS)
print(f"Pure Python execution time: {time.time()-t1:.2f}s")
