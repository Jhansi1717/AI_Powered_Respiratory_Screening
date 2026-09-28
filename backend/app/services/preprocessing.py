import librosa
import numpy as np
import torch
import torch.nn.functional as F
import tempfile
import os
import io
import time
import threading
import soundfile as sf
from scipy.signal import butter, lfilter

TARGET_SR = 16000
DURATION = 5
SAMPLES = TARGET_SR * DURATION
N_MELS = 128

# Readiness flag: set only after Numba JIT compilation succeeds
_preprocessing_ready = threading.Event()


def is_preprocessing_ready() -> bool:
    """Non-blocking check. Safe to call from health endpoints."""
    return _preprocessing_ready.is_set()


def warmup_preprocessing():
    """Pre-compile Numba JIT kernels used by librosa.
    librosa.feature.melspectrogram uses Numba internally; the first call
    triggers JIT compilation. This is fast locally but can take much longer
    on heavily CPU-throttled environments (hypothesis: this contributed to
    the observed 44s+ request times on Render's 0.1 CPU free tier).
    Dummy input uses exactly the same parameters as real inference:
      TARGET_SR=16000, N_MELS=128, SAMPLES=80000 (5s at 16kHz).
    The readiness flag is set ONLY on success, so /api/predict returns 503
    until warmup is confirmed complete.
    """
    try:
        t0 = time.time()
        # Exactly matches real inference: 5s of silence at 16 kHz, 128 mel bins
        dummy = np.zeros(SAMPLES, dtype=np.float32)
        librosa.feature.melspectrogram(y=dummy, sr=TARGET_SR, n_mels=N_MELS)
        print(f"Preprocessing warmup done in {time.time()-t0:.2f}s (Numba JIT compiled)")
        _preprocessing_ready.set()  # Signal: safe to serve inference requests
    except Exception as e:
        # Do NOT set the event -- readiness stays False so /predict returns 503
        print(f"Preprocessing warmup FAILED: {e}")

def highpass_filter(data, cutoff=100, fs=16000, order=5):
    nyq = 0.5 * fs
    normal_cutoff = cutoff / nyq
    b, a = butter(order, normal_cutoff, btype='high', analog=False)
    y = lfilter(b, a, data)
    return y


MIN_AUDIO_BYTES = 4096  # Skip files smaller than 4 KB (likely corrupt/stubs)

def preprocess_audio(file_path=None, file_bytes=None, file_ext=None):
    t_start = time.time()
    
    t_read_start = time.time()
    y, sr = None, TARGET_SR
    
    if file_path:
        ext = os.path.splitext(file_path)[1].lower()
        
        # FAST PATH: Use soundfile for WAV/FLAC
        if ext in ('.wav', '.flac'):
            try:
                info = sf.info(file_path)
                frames_to_read = int(info.samplerate * DURATION)
                y, orig_sr = sf.read(file_path, frames=frames_to_read, dtype='float32')
                if y.ndim > 1:
                    y = y.mean(axis=1)  # Convert to mono
                
                read_time = time.time() - t_read_start
                print(f"  Audio read: {read_time:.3f}s (soundfile)")
                
                t_resample_start = time.time()
                if orig_sr != TARGET_SR:
                    y = librosa.resample(y, orig_sr=orig_sr, target_sr=TARGET_SR)
                resample_time = time.time() - t_resample_start
                print(f"  Resampling: {resample_time:.3f}s")
            except Exception:
                # Fallback to librosa
                t_read_start = time.time()
                y, orig_sr = librosa.load(file_path, sr=TARGET_SR, mono=True, duration=DURATION)
                read_time = time.time() - t_read_start
                print(f"  Audio read: {read_time:.3f}s (librosa fallback)")
                print(f"  Resampling: 0.000s (handled by librosa)")
        else:
            # MP3 and other formats: use librosa
            try:
                y, orig_sr = librosa.load(file_path, sr=TARGET_SR, mono=True, duration=DURATION)
                read_time = time.time() - t_read_start
                print(f"  Audio read: {read_time:.3f}s (librosa)")
                print(f"  Resampling: 0.000s (handled by librosa)")
            except Exception as e:
                print(f"Audio Loading Error: {e}")
                raise e
    elif file_bytes:
        if len(file_bytes) < MIN_AUDIO_BYTES:
            raise ValueError(f"Audio too small ({len(file_bytes)} bytes) — likely corrupt or a test stub.")
            
        suffix = file_ext if file_ext and file_ext.startswith(".") else ".wav"
        
        try:
            # Try soundfile first for WAV/FLAC bytes
            if suffix in ('.wav', '.flac'):
                try:
                    f_io = io.BytesIO(file_bytes)
                    info = sf.info(f_io)
                    frames_to_read = int(info.samplerate * DURATION)
                    f_io.seek(0)
                    y, orig_sr = sf.read(f_io, frames=frames_to_read, dtype='float32')
                    if y.ndim > 1:
                        y = y.mean(axis=1)
                        
                    read_time = time.time() - t_read_start
                    print(f"  Audio read: {read_time:.3f}s (soundfile bytes)")
                    
                    t_resample_start = time.time()
                    if orig_sr != TARGET_SR:
                        y = librosa.resample(y, orig_sr=orig_sr, target_sr=TARGET_SR)
                    resample_time = time.time() - t_resample_start
                    print(f"  Resampling: {resample_time:.3f}s")
                except Exception:
                    # Fallback: write to temp file
                    with tempfile.NamedTemporaryFile(suffix=suffix, delete=False) as tmp:
                        tmp.write(file_bytes)
                        tmp_path = tmp.name
                    t_read_start = time.time()
                    y, orig_sr = librosa.load(tmp_path, sr=TARGET_SR, mono=True, duration=DURATION)
                    os.unlink(tmp_path)
                    read_time = time.time() - t_read_start
                    print(f"  Audio read: {read_time:.3f}s (librosa fallback bytes)")
                    print(f"  Resampling: 0.000s (handled by librosa)")
            else:
                with tempfile.NamedTemporaryFile(suffix=suffix, delete=False) as tmp:
                    tmp.write(file_bytes)
                    tmp_path = tmp.name
                t_read_start = time.time()
                y, orig_sr = librosa.load(tmp_path, sr=TARGET_SR, mono=True, duration=DURATION)
                os.unlink(tmp_path)
                read_time = time.time() - t_read_start
                print(f"  Audio read: {read_time:.3f}s (librosa bytes)")
                print(f"  Resampling: 0.000s (handled by librosa)")
        except Exception as e2:
            try:
                os.unlink(tmp_path)
            except Exception:
                pass
            print(f"Audio Loading Error: {e2}")
            raise e2
    else:
        raise ValueError("Either file_path or file_bytes must be provided")

    t_filter_start = time.time()
    # Apply High-Pass Filter (remove low-freq hum)
    y = highpass_filter(y, cutoff=100, fs=TARGET_SR)
    filter_time = time.time() - t_filter_start
    print(f"  High-pass filter: {filter_time:.3f}s")

    # Fix length
    if len(y) < SAMPLES:
        y = np.pad(y, (0, SAMPLES - len(y)))
    else:
        y = y[:SAMPLES]

    t_mel_start = time.time()
    # Mel spectrogram
    mel = librosa.feature.melspectrogram(
        y=y,
        sr=TARGET_SR,
        n_mels=N_MELS
    )

    # dB scale
    mel_db = librosa.power_to_db(mel, ref=np.max)
    mel_time = time.time() - t_mel_start
    print(f"  Mel spectrogram: {mel_time:.3f}s")

    # FAST: Prepare simplified visualization (downsampled to reduce serialization cost)
    viz_scaled = ((mel_db - mel_db.min()) / (mel_db.max() - mel_db.min() + 1e-6) * 255).astype(np.uint8)
    # Downsample viz to max 64x64 to speed up JSON serialization
    step_freq = max(1, viz_scaled.shape[0] // 64)
    step_time = max(1, viz_scaled.shape[1] // 64)
    viz_small = viz_scaled[::step_freq, ::step_time]
    viz_data = viz_small.tolist()

    # Normalize for model
    mel_norm = (mel_db - mel_db.mean()) / (mel_db.std() + 1e-6)
    
    # Convert to tensor and resize to fixed shape (128x128)
    mel_tensor = torch.tensor(mel_norm, dtype=torch.float32).unsqueeze(0).unsqueeze(0) # (1, 1, H, W)
    mel_resized = F.interpolate(mel_tensor, size=(128, 128), mode='bilinear', align_corners=False)
    
    print(f"  Total preprocessing: {time.time()-t_start:.3f}s")
    return mel_resized.squeeze(0), viz_data