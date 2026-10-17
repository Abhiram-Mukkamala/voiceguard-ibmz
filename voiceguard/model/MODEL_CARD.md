# Model Card: VoiceGuard Track A Acoustic LCNN

## Model Details
- **Model Name:** VoiceGuard Track A LCNN (Max-Feature-Map Convolutional Neural Network)
- **Model Version:** 1.0.0
- **Model Type:** Binary Audio Spoof / Synthetic Speech Classifier
- **Target Platform:** IBM LinuxONE (s390x, big-endian) VM & x86_64 Gateway
- **Artifacts Provided:**
  - `track_a.onnx`: ONNX opset 17 float32 model (`(batch, 98, 20)` -> `(batch, 2)`)
  - `track_a.int8.onnx`: Quantized INT8 ONNX model
  - `track_a_npz/*.npy`: 20 per-tensor NumPy weights files enabling native execution on platforms lacking `onnxruntime` (e.g. s390x)

## Intended Use
- **Primary Use Case:** Real-time deepfake audio and voice-clone detection gateway for inbound enterprise telephony and banking security streams.
- **Out of Scope:** Multi-class attack attribution (TTS vs voice conversion), acoustic emotion recognition, speaker diarization.

## Input Contract
- **Sample Rate:** 16,000 Hz mono PCM16
- **Window Length:** 1.0 second (16,000 samples)
- **Stride:** 250 ms (4,000 samples)
- **Front-End Features:** Linear Frequency Cepstral Coefficients (LFCC) via `dsp_pipeline.compute_lfcc`:
  - `N_FFT = 512`
  - `HOP = 160` (10 ms)
  - `WIN = 400` (25 ms Hamming window)
  - `40` linearly-spaced triangular filters
  - `20` cepstral coefficients (DCT-II)
  - Output tensor shape: `(batch, 98, 20)` float32 (unnormalized)

## Output Contract
- **Logits:** `(batch, 2)` float32 raw logits corresponding to `[bonafide, spoof]` (class 0 = bonafide / genuine, class 1 = spoof / synthetic).
- **Probabilities:** Softmax over output logits. Class index 1 represents `P(synthetic)`.

## Training Data & Procedure
- **Dataset:** ASVspoof 2019 LA (Logical Access)
  - Reference: University of Edinburgh DataShare ([https://datashare.ed.ac.uk/handle/10283/3336](https://datashare.ed.ac.uk/handle/10283/3336))
  - Training / Dev partitions: ASVspoof2019.LA.cm.train.trn.txt / ASVspoof2019.LA.cm.dev.trl.txt
  - Data Sizes: `[TO FILL: dataset size and utterance counts]`
- **Loss Function:** Weighted Cross-Entropy Loss with 9:1 weighting (accounting for the ~90% spoof prevalence in ASVspoof 2019 LA).
- **Training Hyperparameters:**
  - Optimizer: Adam, lr=0.0003
  - Batch size: 64
  - Epochs: `[TO FILL: epochs trained]`
  - Best Dev EER: `[TO FILL: best dev EER from training log]`
  - Training Date: `[TO FILL: training date and duration]`

## Hardware Acceleration & s390x Architecture Port
- **s390x Constraint:** `onnxruntime` has no official or community wheels for Ubuntu 24.04 on s390x (big-endian).
- **Solution:** Pure-NumPy implementation (`voiceguard/numpy_lcnn.py`) that loads 20 weight tensors from `track_a_npz/`.
- **Endianness Safety:**
  - Standard `.npy` headers encode little-endian `<f4`.
  - `NumpyLCNN` converts every loaded array using `.astype(np.float32)`, ensuring correct native byte order representation on both big-endian and little-endian hardware.
- **Reference Smoke Test Outputs (Exact Verification):**
  - All-zeros input `(1, 98, 20)`: `[-28.1055, 19.7470]`
  - Ramp input `np.arange(98*20, dtype=np.float32).reshape(1,98,20)/(98*20) - 0.5`: `[-19.9592, 14.1075]`
  - Maximum absolute discrepancy between ONNX Runtime (x86) and NumPy LCNN: `3.81e-6` (< 7e-6 threshold).
  - Inference Latency: ~1.3 ms per 1.0 s window on x86, measured 12-19 ms total stride processing on s390x VM.

## Limitations & Ethical Considerations
- **Binary Classification:** Does not distinguish Text-to-Speech (TTS) from Voice Conversion (VC).
- **Domain Mismatch:** Trained on clean 16 kHz studio recordings; real telephony codecs (G.711 A-law/mu-law, AMR, Opus) and background ambient noise require empirical calibration.
- **Dataset Artifacts:** ASVspoof 2019 has known silence/concatenation cues; real-world deployment requires voice activity gating (`audio_confidence`).
- **Score Calibration:** Model probabilities are uncalibrated raw softmax scores. Deployments must calibrate thresholds against domain-specific test sets.
