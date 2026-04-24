import torch
import os
import sys
from pathlib import Path

# Add app to path
sys.path.append(str(Path(__file__).resolve().parent.parent))

from app.services.model import load_model, predict_tensor
from app.services.preprocessing import preprocess_audio

UPLOAD_DIR = Path(__file__).resolve().parent.parent / "app" / "uploads"

def validate():
    print("🚀 Starting Multi-Category Validation Test...")
    load_model()
    
    files = list(UPLOAD_DIR.glob("*.wav")) + list(UPLOAD_DIR.glob("*.mp3"))
    results = []

    for f in files[:15]:  # Test first 15 samples
        try:
            with open(f, "rb") as audio:
                content = audio.read()
                
            tensor, _ = preprocess_audio(content)
            # Add batch and channel dims if needed (preprocess returns 1, 128, 128)
            # predict_tensor expects (1, 1, 128, 128)
            prediction, confidence, probabilities = predict_tensor(tensor.unsqueeze(0))
            
            print(f"File: {f.name[:30]}... -> Prediction: {prediction} ({confidence*100}%)")
            results.append({
                "file": f.name,
                "pred": prediction,
                "conf": confidence,
                "probs": probabilities
            })
        except Exception as e:
            print(f"Error processing {f.name}: {e}")

    print("\n✅ Validation Summary:")
    counts = {}
    for r in results:
        counts[r['pred']] = counts.get(r['pred'], 0) + 1
    
    for cls, count in counts.items():
        print(f"- {cls}: {count} files")

if __name__ == "__main__":
    validate()
