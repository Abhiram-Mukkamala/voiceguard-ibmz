# VoiceGuard: Known Limitations & Boundary Conditions

VoiceGuard was developed as an entry in the **IBM Z Datathon 2026** ("AI Secured: Innovation Without Exposure"). To maintain complete scientific integrity, this document details the architectural boundaries, dataset constraints, and operational limitations of the system.

## 1. Dataset & Training Constraints
- **Trained on ASVspoof 2019 Logical Access (LA) Only:**
  - The acoustic model (Track A LCNN) was trained exclusively on the ASVspoof 2019 LA partition.
  - The dataset comprises clean, studio-quality English speech sampled at 16 kHz.
  - Non-English languages, regional dialects (including Indian languages and code-switching), and spontaneous conversational speech were not present in the training set and remain unmeasured.
- **Known Dataset Shortcuts:**
  - Academic literature has documented that the ASVspoof 2019 LA dataset contains acoustic shortcuts (such as synthetic concatenation boundaries, start/end silence anomalies, and fixed high-frequency cutoff characteristics) which deep convolutional networks may exploit.
  - While our sliding 1.0 s windowing mitigates boundary reliance, cross-dataset generalization across commercial generative models (ElevenLabs, Cartesia, OpenAI Voice, CosyVoice, etc.) is unmeasured.

## 2. Audio Quality & Telephony Codecs
- **Wideband Expectation:**
  - The feature front-end computes 20 LFCCs across 40 linear filterbank channels spanning 0–8,000 Hz.
  - Narrowband telephony audio (G.711 A-law / mu-law, AMR-NB, PSTN legacy 8 kHz lines) lacks frequencies above 3,400 Hz.
  - While `voice_scoring.py` detects this spectral cliff and penalizes `audio_confidence` down to ~0.45, acoustic classification accuracy degrades on band-limited or heavily compressed audio.
- **Noise & Transcoding:**
  - Performance under packet loss burstiness, jitter buffer distortion, and lossy Opus transcoding has not been calibrated on live telco traffic.

## 3. Classification Head & Attribution
- **Binary Output Contract:**
  - The current model architecture outputs two logits: `[bonafide, spoof]`.
  - It does **not** discriminate between Text-to-Speech (TTS) and Voice Conversion (VC). Both attacks map to `P(synthetic)`.
  - Distinguishing specific synthesis algorithms would require multi-class training using the attack system IDs (`A01`–`A19`), which is not implemented in the current weights checkpoint.

## 4. Score Calibration
- **Uncalibrated Model Scores:**
  - The output probabilities represent raw softmax logits from a network trained with a 9:1 class weight penalty (matching the ~90% spoof prevalence in ASVspoof 2019).
  - Therefore, a returned `synthetic_probability` of 0.88 does **not** signify that 88% of identical calls in the wild are fraudulent.
  - Production deployments must calibrate raw outputs (e.g., via Platt scaling or isotonic regression) using labelled recordings from the deployment environment before setting operational fraud thresholds.

## 5. Speaker Verification Baseline
- **Track C Voiceprint Enrollment:**
  - On platforms where pre-trained ECAPA-TDNN neural checkpoints are unmounted, Track C defaults to a deterministic pure-FFT spectral profile embedding (192 dimensions).
  - The fallback embedding effectively detects large timbre and pitch shifts, but lacks the deep speaker discrimination of heavy neural embeddings.
