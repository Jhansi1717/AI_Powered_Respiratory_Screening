import time

t0 = time.time()
import librosa
import numpy as np
t1 = time.time()
print(f"Import time: {t1-t0:.2f}s")

TARGET_SR = 16000
N_MELS = 128
SAMPLES = 80000

t2 = time.time()
dummy = np.zeros(SAMPLES, dtype=np.float32)
librosa.feature.melspectrogram(y=dummy, sr=TARGET_SR, n_mels=N_MELS)
print(f"JIT compile time: {time.time()-t2:.2f}s")
