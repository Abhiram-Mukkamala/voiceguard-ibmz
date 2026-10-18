# Project History & Provenance: Gateway Foundation

Origin: Modular voice clone detection gateway foundation imported in commit `6dcb253` (September 2026).

This foundation provides:
- Core WebSocket ingestion gateway and PCM16 streaming loop (`server.py`)
- Linear Frequency Cepstral Coefficients (LFCC) audio DSP extraction (`dsp_pipeline.py`)
- Acoustic baseline scoring interface (`acoustic_model.py`)
- Multi-track temporal fusion and risk engine (`fusion_engine.py`)
- Speaker verification and voiceprint enrollment interface (`speaker_encoder.py`, `speaker_verification.py`)
- Authentication token verification (`auth.py`)
- Test harness and audio synthesis simulator (`client_simulator.py`, `make_test_audio.py`, `tests/`)
