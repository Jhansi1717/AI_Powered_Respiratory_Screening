import time
import numpy as np
import torch
import librosa

TARGET_SR = 16000
N_MELS = 128
SAMPLES = 80000
N_FFT = 2048
HOP_LENGTH = 512

print("Generating dummy audio...")
dummy = np.zeros(SAMPLES, dtype=np.float32)

t0 = time.time()

# 1. Get mel basis from librosa (very fast, no Numba JIT)
mel_basis = librosa.filters.mel(sr=TARGET_SR, n_fft=N_FFT, n_mels=N_MELS, fmax=8000)
mel_basis_tensor = torch.from_numpy(mel_basis)

# 2. Compute STFT using PyTorch
audio_tensor = torch.from_numpy(dummy)
window = torch.hann_window(N_FFT)

# PyTorch STFT
stft = torch.stft(
    audio_tensor,
    n_fft=N_FFT,
    hop_length=HOP_LENGTH,
    win_length=N_FFT,
    window=window,
    center=True,
    pad_mode="reflect",
    normalized=False,
    onesided=True,
    return_complex=True
)

# 3. Compute power spectrogram
power_spec = torch.abs(stft) ** 2

# 4. Apply Mel filterbank
mel_spec = torch.matmul(mel_basis_tensor, power_spec)

# 5. Convert to DB using librosa (power_to_db doesn't use Numba!)
mel_spec_db = librosa.power_to_db(mel_spec.numpy(), ref=np.max)

print(f"Total time (PyTorch STFT): {time.time()-t0:.4f}s")
print(f"Output shape: {mel_spec_db.shape}")

# Compare with librosa
t1 = time.time()
mel_spec_librosa = librosa.feature.melspectrogram(y=dummy, sr=TARGET_SR, n_mels=N_MELS, fmax=8000)
mel_spec_librosa_db = librosa.power_to_db(mel_spec_librosa, ref=np.max)
print(f"Total time (Librosa): {time.time()-t1:.4f}s")
print(f"Max diff: {np.max(np.abs(mel_spec_db - mel_spec_librosa_db))}")
