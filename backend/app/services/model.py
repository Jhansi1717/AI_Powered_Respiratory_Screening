import torch
import torch.nn as nn
import timm
from pathlib import Path

DEVICE = "cuda" if torch.cuda.is_available() else "cpu"
ROOT_DIR = Path(__file__).resolve().parent.parent.parent
MODEL_PATH = ROOT_DIR / "model" / "model.pth"

# 🔹 SSL Encoder for Pre-training
class SSLAudioEncoder(nn.Module):
    def __init__(self):
        super().__init__()
        self.backbone = timm.create_model(
            "efficientnet_b0",
            pretrained=True, # Start with ImageNet then refine via SSL
            in_chans=1,
            num_classes=0,
            global_pool="avg"
        )
        # Projection Head for SimCLR
        self.projection_head = nn.Sequential(
            nn.Linear(1280, 512),
            nn.ReLU(),
            nn.Linear(512, 128)
        )

    def forward(self, x):
        features = self.backbone(x)
        projected = self.projection_head(features)
        return projected

# 🔹 Standard Diagnostic Model
class Model(nn.Module):
    def __init__(self, encoder=None):
        super().__init__()
        if encoder:
            self.backbone = encoder.backbone
        else:
            self.backbone = timm.create_model(
                "efficientnet_b0",
                pretrained=False,
                in_chans=1
            )
        
        # Classification Head (Fixed to 4 classes for ICBHI)
        self.classifier = nn.Linear(1280, 4)

    def forward(self, x):
        # Extract features (EfficientNet-B0 has 1280 features before pooling)
        features = self.backbone.forward_features(x)
        features = torch.mean(features, dim=(2, 3)) # Global Avg Pooling
        return self.classifier(features)


# 🔹 Global model instance
model = None


# 🔹 Load model once
def load_model():
    global model

    model = Model().to(DEVICE)

    try:
        # Load the weights
        state_dict = torch.load(MODEL_PATH, map_location=DEVICE, weights_only=True)
        
        # Check if weights are from the old model (using backbone.classifier) 
        # or the new model (using classifier)
        new_state_dict = {}
        for k, v in state_dict.items():
            if k.startswith("backbone.classifier"):
                # Map old classifier weights to the new classifier head
                new_key = k.replace("backbone.classifier", "classifier")
                new_state_dict[new_key] = v
            else:
                new_state_dict[k] = v
        
        # Load with partial matching
        model.load_state_dict(new_state_dict, strict=False)
        model.eval()
        print("✅ Model loaded successfully (Adaptive Mode)")

    except Exception as e:
        print("❌ Model loading failed:", str(e))


# 🔹 Prediction function
def predict_tensor(x):
    global model

    if model is None:
        raise Exception("Model not loaded")

    x = x.to(DEVICE)

    with torch.no_grad():
        out = model(x)
        probs = torch.softmax(out, dim=1)

    conf, pred = torch.max(probs, dim=1)

    confidence = float(conf.item())
    confidence = max(0.0, min(confidence, 1.0))  # safety clamp

    classes = ["normal", "crackle", "wheeze", "mixed"]
    
    # Create a probability map for all classes
    all_probs = {
        classes[i]: round(float(probs[0][i].item()), 4)
        for i in range(len(classes))
    }

    return classes[pred.item()], round(confidence, 3), all_probs