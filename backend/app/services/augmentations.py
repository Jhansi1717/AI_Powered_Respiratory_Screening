import numpy as np
import torch
import torch.nn as nn
import random

class SSLTransform(nn.Module):
    """
    Applies dual-view transformations for contrastive self-supervised learning.
    """
    def __init__(self, target_shape=(128, 128)):
        super().__init__()
        self.target_shape = target_shape

    def add_gaussian_noise(self, x, level=0.01):
        noise = torch.randn_like(x) * level
        return x + noise

    def time_shift(self, x, max_shift=20):
        shift = random.randint(-max_shift, max_shift)
        return torch.roll(x, shifts=shift, dims=-1)

    def freq_mask(self, x, mask_width=10):
        _, h, w = x.shape
        y_start = random.randint(0, h - mask_width)
        x[:, y_start:y_start + mask_width, :] = 0
        return x

    def forward(self, x):
        # View 1
        v1 = x.clone()
        v1 = self.add_gaussian_noise(v1)
        v1 = self.time_shift(v1)
        
        # View 2
        v2 = x.clone()
        v2 = self.freq_mask(v2)
        v2 = self.add_gaussian_noise(v2, level=0.02)
        
        return v1, v2
