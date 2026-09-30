import os
import psutil
import time

def print_mem(tag):
    process = psutil.Process(os.getpid())
    rss_mb = process.memory_info().rss / 1024 / 1024
    print(f"[{tag}] RSS: {rss_mb:.2f} MB")

print_mem("Start")
os.environ["NUMBA_DISABLE_JIT"] = "1"
import numpy as np
import librosa
import torch
print_mem("After imports (Numba disabled)")

TARGET_SR = 16000
N_MELS = 128
SAMPLES = TARGET_SR * 5

# New approach memory
def my_power_to_db(S, ref=1.0, amin=1e-10, top_db=80.0):
    S = np.asarray(S)
    if callable(ref):
        ref_value = np.abs(ref(S))
    else:
        ref_value = np.abs(ref)
    
    log_spec = 10.0 * np.log10(np.maximum(amin, S))
    log_spec -= 10.0 * np.log10(np.maximum(amin, ref_value))
    
    if top_db is not None:
        log_spec = np.maximum(log_spec, log_spec.max() - top_db)
    return log_spec

def new_preprocessing(y):
    t0 = time.time()
    mel_basis = librosa.filters.mel(sr=TARGET_SR, n_fft=2048, n_mels=N_MELS)
    mel_basis = torch.from_numpy(mel_basis)
    y_tensor = torch.from_numpy(y)
    window = torch.hann_window(2048)
    stft = torch.stft(
        y_tensor,
        n_fft=2048,
        hop_length=512,
        window=window,
        return_complex=True,
        center=True,
        pad_mode='reflect'
    )
    power_spec = torch.abs(stft)**2
    mel_spec = torch.matmul(mel_basis, power_spec)
    mel_spec_np = mel_spec.numpy()
    S_dB = my_power_to_db(mel_spec_np, ref=np.max)
    print(f"New preprocessing time: {time.time()-t0:.3f}s")
    return S_dB

y = np.zeros(SAMPLES, dtype=np.float32)
print_mem("Before New")
new_preprocessing(y)
print_mem("After New (PyTorch based)")

import gc
gc.collect()
print_mem("After GC")
