import torch
import torch.optim as optim
from torch.utils.data import DataLoader, Dataset
import os
import glob
import sys
import random
from pathlib import Path

# Add project root to sys.path
sys.path.append(str(Path(__file__).resolve().parent.parent))

from app.services.model import Model, DEVICE
from app.services.preprocessing import preprocess_audio

class ICBHIDataset(Dataset):
    """
    Dataset for supervised fine-tuning on labeled ICBHI data.
    """
    def __init__(self, data_dir, labels_map):
        wav_files = glob.glob(os.path.join(data_dir, "**/*.wav"), recursive=True)
        mp3_files = glob.glob(os.path.join(data_dir, "**/*.mp3"), recursive=True)
        # Filter out tiny/corrupt files (< 4 KB)
        self.files = [f for f in wav_files + mp3_files if os.path.getsize(f) >= 4096]
        self.labels_map = labels_map # Dict: filename -> label_index

    def __len__(self):
        return len(self.files)

    def __getitem__(self, idx):
        try:
            file_path = self.files[idx]
            filename = os.path.basename(file_path)
            
            # Default to 0 (Normal) if not in map
            label = self.labels_map.get(filename, 0)
            
            with open(file_path, "rb") as f:
                content = f.read()
            
            spectrogram, _ = preprocess_audio(content)
            return spectrogram, torch.tensor(label, dtype=torch.long)
        except Exception as e:
            # Skip corrupted/unsupported files and pick another random file
            new_idx = random.randint(0, len(self.files) - 1)
            return self.__getitem__(new_idx)

def train_supervised(data_dir, labels_map, ssl_path=None, epochs=15, batch_size=8):
    print(f"🚀 Starting Supervised Fine-tuning on {data_dir}")
    dataset = ICBHIDataset(data_dir, labels_map)
    loader = DataLoader(dataset, batch_size=batch_size, shuffle=True)
    
    model = Model().to(DEVICE)
    
    # Load SSL Pre-trained weights if available
    if ssl_path and os.path.exists(ssl_path):
        print(f"📦 Loading SSL Backbone from {ssl_path}")
        # Use strict=False to ignore the missing classifier keys
        model.backbone.load_state_dict(
            torch.load(ssl_path, map_location=DEVICE, weights_only=True), strict=False
        )
    
    criterion = torch.nn.CrossEntropyLoss()
    optimizer = optim.Adam(model.parameters(), lr=1e-5) # Lower LR for fine-tuning
    
    for epoch in range(epochs):
        model.train()
        total_loss = 0
        correct = 0
        total = 0
        
        for X, y in loader:
            X, y = X.to(DEVICE), y.to(DEVICE)
            
            optimizer.zero_grad()
            out = model(X)
            loss = criterion(out, y)
            loss.backward()
            optimizer.step()
            
            total_loss += loss.item()
            _, predicted = torch.max(out.data, 1)
            total += y.size(0)
            correct += (predicted == y).sum().item()
        
        acc = 100 * correct / total
        print(f"Epoch {epoch+1}/{epochs} | Loss: {total_loss/len(loader):.4f} | Acc: {acc:.2f}%")
    
    # Save final model
    save_path = Path("model/model.pth")
    save_path.parent.mkdir(exist_ok=True)
    torch.save(model.state_dict(), save_path)
    print(f"✅ Final Diagnostic Model saved to {save_path}")

if __name__ == "__main__":
    DATA_PATH = "data/icbhi"
    UPLOADS_PATH = "app/uploads"
    SSL_WEIGHTS = "model/ssl_encoder.pth"
    
    # Automated labeling for demo based on ICBHI filename patterns
    def get_demo_labels(path):
        files = glob.glob(os.path.join(path, "*.wav")) + glob.glob(os.path.join(path, "*.mp3"))
        mock_map = {}
        for f in files:
            name = os.path.basename(f)
            # ICBHI files often have patterns; we'll mock them for the demo
            if "wheeze" in name.lower() or "172" in name: mock_map[name] = 2 # Wheeze
            elif "crackle" in name.lower() or "177" in name: mock_map[name] = 1 # Crackle
            elif "mixed" in name.lower(): mock_map[name] = 3 # Mixed
            else: mock_map[name] = 0 # Normal
        return mock_map

    if os.path.exists(DATA_PATH) and len(glob.glob(os.path.join(DATA_PATH, "**/*.wav"))) > 0:
        train_supervised(DATA_PATH, {}, ssl_path=SSL_WEIGHTS)
    elif os.path.exists(UPLOADS_PATH):
        print(f"⚠️ ICBHI data not found. Using {UPLOADS_PATH} for Supervised Fine-tuning demo...")
        labels = get_demo_labels(UPLOADS_PATH)
        train_supervised(UPLOADS_PATH, labels, ssl_path=SSL_WEIGHTS, epochs=5)
    else:
        print(f"❌ No audio data found for supervised training.")
