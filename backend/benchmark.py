import time
import torch

print(f"Torch threads: {torch.get_num_threads()}")
print(f"CUDA available: {torch.cuda.is_available()}")

t0 = time.time()
from app.services.model import load_model, predict_tensor
print(f"[1] Import model module: {time.time()-t0:.2f}s")

t0 = time.time()
load_model()
print(f"[2] Load model weights: {time.time()-t0:.2f}s")

t0 = time.time()
from app.services.preprocessing import preprocess_audio
print(f"[3] Import preprocessing: {time.time()-t0:.2f}s")

# Try to find an uploaded file to test with
import os
upload_dir = "/tmp/uploads"
if os.path.exists(upload_dir):
    files = [f for f in os.listdir(upload_dir) if f.endswith(('.mp3', '.wav', '.flac'))]
    if files:
        test_file = os.path.join(upload_dir, files[-1])
        print(f"\nTesting with: {files[-1]}")
        
        t0 = time.time()
        spec, viz = preprocess_audio(file_path=test_file)
        print(f"[4] Preprocess audio: {time.time()-t0:.2f}s")
        
        spec = spec.unsqueeze(0)
        t0 = time.time()
        pred, conf, probs = predict_tensor(spec)
        print(f"[5] Model inference: {time.time()-t0:.2f}s")
        
        print(f"\nResult: {pred} ({conf})")
    else:
        print("No audio files found in /tmp/uploads")
else:
    print(f"Upload dir {upload_dir} does not exist")
    # Try Windows path
    if os.path.exists("uploads"):
        files = [f for f in os.listdir("uploads") if f.endswith(('.mp3', '.wav', '.flac'))]
        print(f"Found {len(files)} in ./uploads")

print("\nDone!")
