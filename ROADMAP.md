# VoiceGuard Project Roadmap

1. **Retrain and Recalibrate Detector on ASVspoof 2019 LA:**
   - Retrain or recalibrate the Track A LCNN checkpoint to resolve the baseline behavior where all clips currently score ~1.0 synthetic.
2. **Held-Out Evaluation with EER:**
   - Benchmark with formal evaluation metrics (Equal Error Rate, min t-DCF) on a held-out test split.
3. **Calibrated Operational Thresholds:**
   - Implement score calibration (e.g., Platt scaling or isotonic regression) to map raw logits to calibrated probabilities for production fraud gating.
4. **Fix Weights-in-LFS Setup for `.onnx`:**
   - Resolve Git LFS tracking for `.onnx` model checkpoints so clones without git-lfs can access models or download via external release assets.
5. **Browser-Tested Dashboard:**
   - Validate live audio streaming and WebRTC / WebSocket fallback interactions across desktop and mobile browsers.
