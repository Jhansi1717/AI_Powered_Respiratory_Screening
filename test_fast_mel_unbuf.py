import os
import time
import sys

os.environ["NUMBA_DISABLE_JIT"] = "1"
import numpy as np
import librosa
import torch

def my_melspectrogram(y, sr, n_fft, hop_length, n_mels):
    # Get mel filterbank (does not use numba)
    mel_basis = librosa.filters.mel(sr=sr, n_fft=n_fft, n_mels=n_mels)
    mel_basis = torch.from_numpy(mel_basis)
    
    # torch STFT
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
    # Power spectrogram
    power_spec = torch.abs(stft)**2
    # Mel spectrogram
    mel_spec = torch.matmul(mel_basis, power_spec)
    return mel_spec.numpy()

print("Testing Torch STFT + Librosa filters without JIT...")
t0 = time.time()
dummy = np.zeros(16000*5, dtype=np.float32)
spec = my_melspectrogram(dummy, 16000, 2048, 512, 128)
print(f"Done in {time.time()-t0:.3f}s. Spec shape: {spec.shape}")

print("Comparing with librosa...")
import warnings
warnings.filterwarnings('ignore')
spec_librosa = librosa.feature.melspectrogram(y=dummy, sr=16000, n_fft=2048, hop_length=512, n_mels=128)
diff = np.abs(spec - spec_librosa).max()
print(f"Max difference: {diff}")
