import os
import psutil
import time

def print_mem(tag):
    process = psutil.Process(os.getpid())
    rss_mb = process.memory_info().rss / 1024 / 1024
    print(f"[{tag}] RSS: {rss_mb:.2f} MB")

print_mem("Start")
os.environ["NUMBA_DISABLE_JIT"] = "1"
os.environ["RENDER"] = "1"
import numpy as np
import librosa
import torch
if os.getenv("RENDER"):
    torch.set_num_threads(1)
import timm
from torchvision import transforms
from PIL import Image

print_mem("After imports (Numba disabled)")

TARGET_SR = 16000
N_MELS = 128
SAMPLES = TARGET_SR * 5

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
    
    # Image creation
    from io import BytesIO
    import matplotlib.pyplot as plt
    fig, ax = plt.subplots(figsize=(10, 4))
    import librosa.display
    img = librosa.display.specshow(S_dB, sr=TARGET_SR, hop_length=512, x_axis='time', y_axis='mel', ax=ax)
    ax.axis('off')
    buf = BytesIO()
    plt.savefig(buf, format='png', bbox_inches='tight', pad_inches=0, transparent=True)
    plt.close(fig)
    
    # Tensor
    log_mel = (S_dB - np.min(S_dB)) / (np.max(S_dB) - np.min(S_dB) + 1e-8)
    img_rgb = Image.fromarray(np.uint8(log_mel * 255)).convert('RGB')
    transform = transforms.Compose([
        transforms.Resize((224, 224)),
        transforms.ToTensor(),
        transforms.Normalize([0.485, 0.456, 0.406], [0.229, 0.224, 0.225])
    ])
    tensor = transform(img_rgb)
    return tensor

print_mem("Before Model Load")
MODEL_PATH = "best_respiratory_model_efficientnet_b0.pth"
model = timm.create_model("efficientnet_b0", pretrained=False, num_classes=4)
model.load_state_dict(torch.load(MODEL_PATH, map_location="cpu", weights_only=True))
model.eval()
print_mem("After Model Load")

y = np.zeros(SAMPLES, dtype=np.float32)

with torch.no_grad():
    tensor = new_preprocessing(y)
    print_mem("After Preprocessing")
    out = model(tensor.unsqueeze(0))
    print_mem("After Prediction")

print("All done!")
