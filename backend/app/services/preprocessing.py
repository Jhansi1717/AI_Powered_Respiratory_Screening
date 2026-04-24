import librosa
import numpy as np
import torch
import tempfile
import os
import io
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

def preprocess_audio(file_bytes, file_ext=None):
    if len(file_bytes) < MIN_AUDIO_BYTES:
        raise ValueError(f"Audio too small ({len(file_bytes)} bytes) — likely corrupt or a test stub.")

    # Determine temp file suffix from extension (critical for format detection)
    suffix = file_ext if file_ext and file_ext.startswith(".") else ".wav"

    # Strategy 1: Try soundfile (fast, works for WAV/FLAC/OGG)
    try:
        with io.BytesIO(file_bytes) as audio_file:
            data, sr = sf.read(audio_file)
    except Exception:
        # Strategy 2: Fallback to librosa via temp file (handles MP3/WebM/M4A/etc.)
        try:
            with tempfile.NamedTemporaryFile(suffix=suffix, delete=False) as tmp:
                tmp.write(file_bytes)
                tmp_path = tmp.name
            data, sr = librosa.load(tmp_path, sr=None, mono=False)
            os.unlink(tmp_path)
        except Exception as e2:
            # Clean up temp file if it exists
            try:
                os.unlink(tmp_path)
            except Exception:
                pass
            print(f"❌ Audio Loading Error: {e2}")
            raise e2

    # Convert to mono if stereo
    if len(data.shape) > 1:
        data = np.mean(data, axis=1) if data.ndim == 2 and data.shape[0] > data.shape[1] else librosa.to_mono(data)

    # Resample to TARGET_SR (16000) if necessary
    if sr != TARGET_SR:
        y = librosa.resample(data.astype(np.float32), orig_sr=sr, target_sr=TARGET_SR)
    else:
        y = data.astype(np.float32)

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

    # Also prepare a simplified version for visualization (0-255 scale)
    viz_data = ((mel_db - mel_db.min()) / (mel_db.max() - mel_db.min() + 1e-6) * 255).astype(np.uint8)

    # Normalize for model
    mel_norm = (mel_db - mel_db.mean()) / (mel_db.std() + 1e-6)
    
    # Convert to tensor and resize to fixed shape (128x128)
    import torch.nn.functional as F
    mel_tensor = torch.tensor(mel_norm).float().unsqueeze(0).unsqueeze(0) # (1, 1, H, W)
    mel_resized = F.interpolate(mel_tensor, size=(128, 128), mode='bilinear', align_corners=False)
    
    return mel_resized.squeeze(0), viz_data.tolist()