import os
import time

os.environ["NUMBA_DISABLE_JIT"] = "1"
import numpy as np
import librosa
import torch

def my_melspectrogram(y, sr, n_fft, hop_length, n_mels):
    mel_basis = librosa.filters.mel(sr=sr, n_fft=n_fft, n_mels=n_mels)
    mel_basis = torch.from_numpy(mel_basis)
    
    y_tensor = torch.from_numpy(y)
    window = torch.hann_window(n_fft)
    stft = torch.stft(
        y_tensor,
        n_fft=n_fft,
        hop_length=hop_length,
        window=window,
        return_complex=True,
        center=True,
        pad_mode='reflect'
    )
    power_spec = torch.abs(stft)**2
    mel_spec = torch.matmul(mel_basis, power_spec)
    return mel_spec.numpy()

def my_power_to_db(S, ref=1.0, amin=1e-10, top_db=80.0):
    # Match librosa.power_to_db exactly
    S = np.asarray(S)
    if callable(ref):
        ref_value = np.abs(ref(S))
    else:
        ref_value = np.abs(ref)
    
    log_spec = 10.0 * np.log10(np.maximum(amin, S))
    log_spec -= 10.0 * np.log10(np.maximum(amin, ref_value))
    
    if top_db is not None:
        if top_db < 0:
            raise ValueError("top_db must be non-negative")
        log_spec = np.maximum(log_spec, log_spec.max() - top_db)
        
    return log_spec

print("Testing Torch STFT + Librosa filters + pure numpy power_to_db...")
t0 = time.time()
dummy = np.zeros(16000*5, dtype=np.float32)

# First run
spec1 = my_melspectrogram(dummy, 16000, 2048, 512, 128)
db1 = my_power_to_db(spec1, ref=np.max)
print(f"First run in {time.time()-t0:.3f}s.")

# Second run
t1 = time.time()
spec2 = my_melspectrogram(dummy, 16000, 2048, 512, 128)
db2 = my_power_to_db(spec2, ref=np.max)
print(f"Second run in {time.time()-t1:.3f}s.")

print("Comparing with librosa...")
import warnings
warnings.filterwarnings('ignore')
spec_librosa = librosa.feature.melspectrogram(y=dummy, sr=16000, n_fft=2048, hop_length=512, n_mels=128)
db_librosa = librosa.power_to_db(spec_librosa, ref=np.max)

diff_spec = np.abs(spec2 - spec_librosa).max()
diff_db = np.abs(db2 - db_librosa).max()
print(f"Max diff spec: {diff_spec}, db: {diff_db}")
