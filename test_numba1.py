import time
import librosa
import numpy as np

TARGET_SR = 16000
N_MELS = 128
SAMPLES = 80000

t0 = time.time()
dummy = np.zeros(SAMPLES, dtype=np.float32)
librosa.feature.melspectrogram(y=dummy, sr=TARGET_SR, n_mels=N_MELS)
print(f"First run in this process: {time.time()-t0:.2f}s")
