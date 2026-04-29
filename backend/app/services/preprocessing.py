import librosa
import numpy as np
import torch
import torch.nn.functional as F
import tempfile
import os
import io
import time
import soundfile as sf
from scipy.signal import butter, lfilter

TARGET_SR = 16000
DURATION = 5
SAMPLES = TARGET_SR * DURATION
N_MELS = 128

def highpass_filter(data, cutoff=100, fs=16000, order=5):
    nyq = 0.5 * fs
    normal_cutoff = cutoff / nyq
    b, a = butter(order, normal_cutoff, btype='high', analog=False)
    y = lfilter(b, a, data)
    return y


MIN_AUDIO_BYTES = 4096  # Skip files smaller than 4 KB (likely corrupt/stubs)

def preprocess_audio(file_path=None, file_bytes=None, file_ext=None):
    t_start = time.time()
    
    if file_path:
        t0 = time.time()
        ext = os.path.splitext(file_path)[1].lower()
        
        # 🔹 FAST PATH: Use soundfile for WAV/FLAC (10x faster than librosa)
        if ext in ('.wav', '.flac'):
            try:
                y, sr = sf.read(file_path, dtype='float32')
                if y.ndim > 1:
                    y = y.mean(axis=1)  # Convert to mono
                if sr != TARGET_SR:
                    y = librosa.resample(y, orig_sr=sr, target_sr=TARGET_SR)
                print(f"  ⚡ Audio loaded via soundfile in {time.time()-t0:.3f}s")
            except Exception:
                # Fallback to librosa
                y, sr = librosa.load(file_path, sr=TARGET_SR, mono=True)
                print(f"  ⚡ Audio loaded via librosa fallback in {time.time()-t0:.3f}s")
        else:
            # MP3 and other formats: use librosa (which uses ffmpeg/audioread)
            try:
                y, sr = librosa.load(file_path, sr=TARGET_SR, mono=True)
                print(f"  ⚡ Audio loaded via librosa in {time.time()-t0:.3f}s")
            except Exception as e:
                print(f"❌ Audio Loading Error: {e}")
                raise e
    elif file_bytes:
        if len(file_bytes) < MIN_AUDIO_BYTES:
            raise ValueError(f"Audio too small ({len(file_bytes)} bytes) — likely corrupt or a test stub.")
            
        suffix = file_ext if file_ext and file_ext.startswith(".") else ".wav"
        
        try:
            t0 = time.time()
            # Try soundfile first for WAV/FLAC bytes
            if suffix in ('.wav', '.flac'):
                try:
                    y, sr = sf.read(io.BytesIO(file_bytes), dtype='float32')
                    if y.ndim > 1:
                        y = y.mean(axis=1)
                    if sr != TARGET_SR:
                        y = librosa.resample(y, orig_sr=sr, target_sr=TARGET_SR)
                    print(f"  ⚡ Audio bytes loaded via soundfile in {time.time()-t0:.3f}s")
                except Exception:
                    # Fallback: write to temp file
                    with tempfile.NamedTemporaryFile(suffix=suffix, delete=False) as tmp:
                        tmp.write(file_bytes)
                        tmp_path = tmp.name
                    y, sr = librosa.load(tmp_path, sr=TARGET_SR, mono=True)
                    os.unlink(tmp_path)
                    print(f"  ⚡ Audio bytes loaded via librosa fallback in {time.time()-t0:.3f}s")
            else:
                with tempfile.NamedTemporaryFile(suffix=suffix, delete=False) as tmp:
                    tmp.write(file_bytes)
                    tmp_path = tmp.name
                y, sr = librosa.load(tmp_path, sr=TARGET_SR, mono=True)
                os.unlink(tmp_path)
                print(f"  ⚡ Audio bytes loaded via librosa in {time.time()-t0:.3f}s")
        except Exception as e2:
            try:
                os.unlink(tmp_path)
            except Exception:
                pass
            print(f"❌ Audio Loading Error: {e2}")
            raise e2
    else:
        raise ValueError("Either file_path or file_bytes must be provided")

    t0 = time.time()
    
    # Apply High-Pass Filter (remove low-freq hum)
    y = highpass_filter(y, cutoff=100, fs=TARGET_SR)

    # Fix length
    if len(y) < SAMPLES:
        y = np.pad(y, (0, SAMPLES - len(y)))
    else:
        y = y[:SAMPLES]

    # Mel spectrogram
    mel = librosa.feature.melspectrogram(
        y=y,
        sr=TARGET_SR,
        n_mels=N_MELS
    )

    # dB scale
    mel_db = librosa.power_to_db(mel, ref=np.max)
    print(f"  ⚡ Spectrogram computed in {time.time()-t0:.3f}s")

    # 🔹 FAST: Prepare simplified visualization (downsampled to reduce serialization cost)
    t0 = time.time()
    viz_scaled = ((mel_db - mel_db.min()) / (mel_db.max() - mel_db.min() + 1e-6) * 255).astype(np.uint8)
    # Downsample viz to max 64x64 to speed up JSON serialization
    step_freq = max(1, viz_scaled.shape[0] // 64)
    step_time = max(1, viz_scaled.shape[1] // 64)
    viz_small = viz_scaled[::step_freq, ::step_time]
    viz_data = viz_small.tolist()
    print(f"  ⚡ Viz data prepared in {time.time()-t0:.3f}s (shape: {viz_small.shape})")

    # Normalize for model
    mel_norm = (mel_db - mel_db.mean()) / (mel_db.std() + 1e-6)
    
    # Convert to tensor and resize to fixed shape (128x128)
    mel_tensor = torch.tensor(mel_norm, dtype=torch.float32).unsqueeze(0).unsqueeze(0) # (1, 1, H, W)
    mel_resized = F.interpolate(mel_tensor, size=(128, 128), mode='bilinear', align_corners=False)
    
    print(f"  ✅ Total preprocessing: {time.time()-t_start:.3f}s")
    return mel_resized.squeeze(0), viz_data