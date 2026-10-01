# Self-Supervised Learning Pipeline

## Status

The repository contains an **optional** SimCLR-style self-supervised learning stage. It is part of the training codebase, not a required step for running the deployed API.

The deployed inference service loads `backend/model/model.pth`.

## Stage 1 — Self-supervised pre-training

The SSL model is implemented by `SSLAudioEncoder` in `backend/app/services/model.py` and trained by `backend/ml/train_ssl.py`.

The encoder uses:

- EfficientNet-B0
- one input channel for spectrograms
- a projection head:
  - Linear(1280, 512)
  - ReLU
  - Linear(512, 128)

The intended training objective is an NT-Xent contrastive loss.

The training code creates two augmented views of an input spectrogram and optimizes the representation so corresponding views are closer than unrelated examples.

## Augmentations

The repository's SSL transform includes:

- Gaussian noise
- time shifting
- frequency masking

The exact augmentation implementation should be treated as the source of truth for experiments.

## Stage 2 — Supervised fine-tuning

`backend/ml/train_supervised.py` trains the four-class diagnostic model.

Current architecture:

```text
Input spectrogram
      ↓
EfficientNet-B0
      ↓
Global average pooling
      ↓
Linear(1280, 4)
      ↓
normal / crackle / wheeze / mixed
```

When an SSL checkpoint is supplied to the training function, the backbone can be initialized from it with non-strict loading so classifier keys can differ.

The resulting diagnostic model is saved as:

```text
backend/model/model.pth
```

## Important distinction: training vs inference

The live FastAPI service does not run training when a user uploads audio.

Runtime flow:

```text
Existing model.pth
      ↓
load once at startup
      ↓
wait for model_ready
      ↓
predict requests
```

## Dataset claims

The training scripts reference ICBHI-style supervised data and an optional unlabeled SSL data directory. The current repository does not contain a complete, independently evaluated training experiment suitable for a published accuracy claim.

Do not convert example/demo training outputs into a claim of clinical or generalization performance.

## Reproducible evaluation

For a defensible model report, document:

- exact dataset version
- patient-level or recording-level split policy
- training/validation/test counts
- class balance
- random seeds
- preprocessing version
- checkpoint SHA/version
- accuracy, precision, recall, F1, sensitivity, specificity where appropriate
- confusion matrix
- external/held-out test results
- calibration analysis

This repository currently describes the training pipeline, but it does not by itself establish clinical validity.
