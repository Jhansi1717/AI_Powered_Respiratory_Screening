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

from app.services.model import SSLAudioEncoder, DEVICE
from app.services.preprocessing import preprocess_audio
from app.services.augmentations import SSLTransform

class CoswaraDataset(Dataset):
    def __init__(self, data_dir):
        wav_files = glob.glob(os.path.join(data_dir, "**/*.wav"), recursive=True)
        mp3_files = glob.glob(os.path.join(data_dir, "**/*.mp3"), recursive=True)
        # Filter out tiny/corrupt files (< 4 KB)
        self.files = [f for f in wav_files + mp3_files if os.path.getsize(f) >= 4096]
        self.transform = SSLTransform()

    def __len__(self):
        return len(self.files)

    def __getitem__(self, idx):
        try:
            file_path = self.files[idx]
            with open(file_path, "rb") as f:
                content = f.read()
            
            # Get spectrogram (standard preprocess)
            spectrogram, _ = preprocess_audio(content)
            
            # Generate two augmented views
            v1, v2 = self.transform(spectrogram)
            return v1, v2
        except Exception as e:
            # Skip corrupted/unsupported files and pick another random file
            new_idx = random.randint(0, len(self.files) - 1)
            return self.__getitem__(new_idx)

def contrastive_loss(v1, v2, temperature=0.1):
    """
    NT-Xent Loss (Normalized Temperature-scaled Cross Entropy)
    v1, v2: [Batch, Dim] - Projected features
    """
    batch_size = v1.shape[0]
    
    # L2 Normalize
    v1 = torch.nn.functional.normalize(v1, dim=1)
    v2 = torch.nn.functional.normalize(v2, dim=1)
    
    # Concatenate and compute similarity matrix
    out = torch.cat([v1, v2], dim=0) # [2*B, D]
    sim_matrix = torch.mm(out, out.t().contiguous()) / temperature # [2*B, 2*B]
    
    # Select positive samples
    # The similarity of (v1[i], v2[i]) and (v2[i], v1[i])
    positives = torch.cat([torch.diag(sim_matrix, batch_size), torch.diag(sim_matrix, -batch_size)], dim=0)
    
    # Denominator (all except diagonal similarity to itself)
    # We use a mask to ignore diagonal entries
    mask = ~torch.eye(2 * batch_size, dtype=torch.bool, device=DEVICE)
    exp_sim = torch.exp(sim_matrix) * mask
    
    # Final Loss
    loss = -torch.log(torch.exp(positives) / exp_sim.sum(dim=1)).mean()
    return loss

def train_ssl(data_dir, epochs=10, batch_size=16):
    print(f"🚀 Starting SSL Pre-training on {data_dir}")
    dataset = CoswaraDataset(data_dir)
    loader = DataLoader(dataset, batch_size=batch_size, shuffle=True)
    
    encoder = SSLAudioEncoder().to(DEVICE)
    optimizer = optim.Adam(encoder.parameters(), lr=1e-4)
    
    for epoch in range(epochs):
        encoder.train()
        total_loss = 0
        for v1, v2 in loader:
            v1, v2 = v1.to(DEVICE), v2.to(DEVICE)
            
            optimizer.zero_grad()
            z1 = encoder(v1)
            z2 = encoder(v2)
            
            loss = contrastive_loss(z1, z2)
            loss.backward()
            optimizer.step()
            
            total_loss += loss.item()
        
        print(f"Epoch {epoch+1}/{epochs} | Loss: {total_loss/len(loader):.4f}")
    
    # Save the encoder (backbone only)
    save_path = Path("model/ssl_encoder.pth")
    save_path.parent.mkdir(exist_ok=True)
    torch.save(encoder.backbone.state_dict(), save_path)
    print(f"✅ SSL Encoder saved to {save_path}")

if __name__ == "__main__":
    COSWARA_PATH = "data/coswara"
    UPLOADS_PATH = "app/uploads"
    
    if os.path.exists(COSWARA_PATH) and len(glob.glob(os.path.join(COSWARA_PATH, "**/*.wav"), recursive=True)) > 0:
        train_ssl(COSWARA_PATH)
    elif os.path.exists(UPLOADS_PATH):
        print(f"⚠️ Coswara data not found. Falling back to {UPLOADS_PATH} for SSL demo...")
        train_ssl(UPLOADS_PATH, epochs=5) # Run 5 epochs for demo
    else:
        print(f"❌ No audio data found for SSL training at {COSWARA_PATH} or {UPLOADS_PATH}")
