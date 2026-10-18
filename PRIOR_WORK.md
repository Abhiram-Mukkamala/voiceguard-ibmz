# Project History & Provenance

## Provenance Statement

The gateway foundation (server, fusion engine, DSP, speaker verification baseline, and initial dashboard shell) was developed in September 2026 as an earlier modular voice gateway foundation and imported into this repository in commit `6dcb253`. Everything under `voiceguard/`, `patches/`, `scripts/`, `tests/`, the trained LCNN model (`track_a.onnx` / `track_a_npz`), the s390x big-endian architecture port, file scoring API, and frontend live-streaming dashboard enhancements was created on 17–18 October 2026.

---

## Detailed File Provenance Table

| File / Component | Origin | First Commit Date | Notes |
| --- | --- | --- | --- |
| `gateway/server.py` | Prior foundation / Modified 17–18 Oct | 2026-09-06 / 2026-10-17 | Base WebSocket streaming loop and ring buffer imported from `143704d`. Modified on 17 Oct for explicit little-endian PCM16 (`<i2`), `TRACK_A_MODEL` env var, and `/dev/token` security gate. |
| `gateway/auth.py` | Prior foundation / Modified 17–18 Oct | 2026-09-06 / 2026-10-17 | HS256 JWT creation and validation. Updated on 17 Oct with production `AUTH_SECRET` enforcement and security defaults. |
| `gateway/dsp_pipeline.py` | Prior foundation | 2026-09-02 | Pure NumPy/SciPy audio feature extraction (LFCC filterbank, spectral flatness, zero-crossing rate). |
| `gateway/fusion_engine.py` | Prior foundation | 2026-09-06 | Multi-track temporal fusion engine with exponential moving average (EMA) and packet-loss freezing. |
| `gateway/speaker_encoder.py` | Prior foundation | 2026-09-06 | Baseline identity track embedding interface and cosine similarity logic. |
| `gateway/speaker_verification.py`| Prior foundation | 2026-09-06 | In-memory voiceprint store and 192-d spectral embedding fallback. |
| `gateway/client_simulator.py` | Prior foundation | 2026-09-06 | Real-time WebSocket audio streaming test harness. |
| `gateway/make_test_audio.py` | Prior foundation | 2026-09-02 | Harmonic test audio synthesizer. |
| `gateway/static/index.html` | Prior foundation / Modified 17–18 Oct | 2026-09-02 / 2026-10-17 | Static fallback console; rebranded to VoiceGuard IBM Z. |
| `gateway/tests/test_*.py` | Prior foundation | 2026-09-02 | Baseline unit tests for DSP, fusion engine, and speaker verification (baseline tests (not re-run in this repo)). |
| `gateway/tests/test_pcm_endianness.py` | 17–18 Oct 2026 | 2026-10-17 11:13 | Byte-order contract test ensuring host-independent little-endian PCM decoding on s390x. |
| `voiceguard/train_track_a.py` | 17–18 Oct 2026 | 2026-10-17 11:13 | Max-Feature-Map CNN (LCNN) trainer for ASVspoof 2019 LA; exports ONNX and NumPy weights. |
| `voiceguard/voice_scoring.py` | 17–18 Oct 2026 | 2026-10-17 20:13 | File-level voice authenticity API (`analyze_voice`) returning 4-key JSON verdict with heuristic `audio_confidence`. |
| `voiceguard/numpy_lcnn.py` | 17–18 Oct 2026 | 2026-10-17 22:30 | Pure-NumPy forward pass of LCNN running on s390x big-endian without requiring `onnxruntime`. |
| `voiceguard/model/track_a.onnx` | 17–18 Oct 2026 | 2026-10-17 | Trained LCNN checkpoint exported to ONNX (opset 17). |
| `voiceguard/model/track_a_npz/` | 17–18 Oct 2026 | 2026-10-17 | 20 per-tensor float32 weights exported for native LinuxONE execution. |
| `voiceguard/model/MODEL_CARD.md` | 17–18 Oct 2026 | 2026-10-17 | Model card detailing LCNN architecture, training parameters, and s390x port. |
| `patches/*.patch` | 17–18 Oct 2026 | 2026-10-17 | Git patches showing exact diffs applied to the prior foundation files. |
| `frontend/` (React + Vite) | 17–18 Oct 2026 | 2026-10-17 | Figma Make export updated with event normalization, `LOW_CONFIDENCE` risk gauge state, close code 1008 handling, and Live audio upload streaming. |
| `scripts/vm_setup.sh` | 17–18 Oct 2026 | 2026-10-17 | Idempotent s390x setup script for Ubuntu 24.04 on IBM LinuxONE. |
| `scripts/run_api.sh` | 17–18 Oct 2026 | 2026-10-17 | Daemon runner with `AUTH_SECRET` enforcement and `TRACK_A_MODEL` binding. |
| `scripts/smoke_test.py` | 17–18 Oct 2026 | 2026-10-17 | Golden logit vector verification test for LinuxONE s390x deployment. |
| `scripts/e2e.sh` | 17–18 Oct 2026 | 2026-10-17 | End-to-end WebSocket integration test validating `risk_update` emission. |
| `tests/test_numpy_lcnn.py` | 17–18 Oct 2026 | 2026-10-17 | Golden logits, ONNX parity, and big-endian weight loading tests. |
| `tests/test_voice_scoring.py` | 17–18 Oct 2026 | 2026-10-17 | Schema validation, probability summation, and signal condition error tests. |
| `tests/test_server_model.py` | 17–18 Oct 2026 | 2026-10-17 | Healthz model fallback flag and dev token gating security tests. |
| `docs/architecture.mmd` | 17–18 Oct 2026 | 2026-10-17 | Architecture diagram showing data flow and LinuxONE security boundary. |
| `docs/LIMITS.md` | 17–18 Oct 2026 | 2026-10-17 | Scientific limitations and boundary condition analysis. |
| `docs/screenshots/README.md` | 17–18 Oct 2026 | 2026-10-17 | Checklist of architecture and verification captures on the s390x VM. |
| `notebooks/voiceguard_demo.ipynb`| 17–18 Oct 2026 | 2026-10-17 | Interactive demonstration notebook scoring audio and visualizing LFCCs on LinuxONE. |
