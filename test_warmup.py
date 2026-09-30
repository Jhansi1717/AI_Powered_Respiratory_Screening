import os
import time

print("Starting synchronous Numba warmup...")
t0 = time.time()
import numpy as np
import librosa
librosa.feature.melspectrogram(y=np.zeros(16000*5, dtype=np.float32), sr=16000, n_mels=128)
print(f"Synchronous Numba warmup finished in {time.time()-t0:.2f}s")
