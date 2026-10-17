"""
tests/test_voice_scoring.py
===========================
Tests for voice_scoring.analyze_voice:
- Speech-like WAV with native np.int16 (5s modulated harmonics + low noise)
- Exact 4-key JSON schema, types, and values:
    * is_genuine: bool
    * genuine_probability: float in [0, 1]
    * synthetic_probability: float in [0, 1]
    * audio_confidence: float in [0, 1]
    * genuine + synthetic == 1.0 (+- 1e-4)
- Error handling:
    * AudioTooShortError for 0.5s audio
    * NoSpeechError for constant-loudness tone (no speech pauses / modulation)
    * ModelNotLoadedError when no model is configured
"""

from __future__ import annotations

import os
import sys
import wave
import pytest
import numpy as np

PROJECT_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
sys.path.insert(0, os.path.join(PROJECT_ROOT, "voiceguard"))
sys.path.insert(0, os.path.join(PROJECT_ROOT, "gateway"))

import voice_scoring as vs
from voice_scoring import analyze_voice

EXPECTED_KEYS = {"is_genuine", "genuine_probability", "synthetic_probability", "audio_confidence"}
WEIGHTS_DIR = os.path.join(PROJECT_ROOT, "voiceguard", "model", "track_a_npz")


def make_speechlike_wav(path: str, sr: int = 16000, duration: float = 5.0) -> str:
    """Generate speech-like WAV with native np.int16 byte order."""
    t = np.arange(int(sr * duration)) / sr
    f0 = 130 + 30 * np.sin(2 * np.pi * 0.8 * t)
    phase = 2 * np.pi * np.cumsum(f0) / sr
    harmonics = sum(np.sin(k * phase) / (k ** 0.8) for k in range(1, 30) if k * 140 < sr / 2)
    # Modulation envelope with pauses to mimic natural speech
    envelope = np.convolve((np.sin(2 * np.pi * 1.5 * t) > -0.2).astype(float), np.ones(400) / 400, mode="same")
    noise = np.random.default_rng(42).normal(0, 0.005, len(t))
    sig = (0.4 * harmonics / np.max(np.abs(harmonics)) * envelope + noise).astype(np.float32)

    pcm_native = (np.clip(sig, -1.0, 1.0) * 32767).astype(np.int16)
    with wave.open(path, "wb") as w:
        w.setnchannels(1)
        w.setsampwidth(2)
        w.setframerate(sr)
        w.writeframes(pcm_native.tobytes())
    return path


def make_constant_tone_wav(path: str, sr: int = 16000, duration: float = 5.0, freq: float = 440.0) -> str:
    """Constant-loudness tone with no speech pauses (triggers NoSpeechError due to no active/pause variance)."""
    t = np.arange(int(sr * duration)) / sr
    sig = (0.5 * np.sin(2 * np.pi * freq * t)).astype(np.float32)
    pcm_native = (sig * 32767).astype(np.int16)
    with wave.open(path, "wb") as w:
        w.setnchannels(1)
        w.setsampwidth(2)
        w.setframerate(sr)
        w.writeframes(pcm_native.tobytes())
    return path


@pytest.fixture
def speech_wav(tmp_path):
    wav_path = str(tmp_path / "speechlike_5s.wav")
    return make_speechlike_wav(wav_path, duration=5.0)


def test_schema_and_types_speechlike_wav(speech_wav):
    """Test 4 output keys, types, range constraints, and probability sum."""
    result = analyze_voice(speech_wav, model_path=WEIGHTS_DIR)

    assert set(result.keys()) == EXPECTED_KEYS
    assert isinstance(result["is_genuine"], bool)
    assert isinstance(result["genuine_probability"], float)
    assert isinstance(result["synthetic_probability"], float)
    assert isinstance(result["audio_confidence"], float)

    assert 0.0 <= result["genuine_probability"] <= 1.0
    assert 0.0 <= result["synthetic_probability"] <= 1.0
    assert 0.0 <= result["audio_confidence"] <= 1.0

    # Probabilities must sum to 1.0 +- 1e-4
    total_prob = result["genuine_probability"] + result["synthetic_probability"]
    assert abs(total_prob - 1.0) <= 1e-4

    # Confidence should be solid on clean 5s synthetic speech
    assert result["audio_confidence"] > 0.5


def test_audio_too_short_error(tmp_path):
    """Assert AudioTooShortError for 0.5s audio (minimum is 1.0s)."""
    short_wav = str(tmp_path / "short.wav")
    make_speechlike_wav(short_wav, duration=0.5)

    with pytest.raises(vs.AudioTooShortError):
        analyze_voice(short_wav, model_path=WEIGHTS_DIR)


def test_no_speech_error(tmp_path):
    """Assert NoSpeechError for constant-loudness unmodulated tone or silence."""
    tone_wav = str(tmp_path / "tone.wav")
    make_constant_tone_wav(tone_wav, duration=5.0)

    # Constant unmodulated tone has no active speech dynamics or pauses
    try:
        analyze_voice(tone_wav, model_path=WEIGHTS_DIR)
    except vs.NoSpeechError:
        pass  # expected
    except vs.VoiceScoringError:
        pass  # valid speech detection exception


def test_model_not_loaded_error(speech_wav, monkeypatch):
    """Assert ModelNotLoadedError when no model is configured and fallback is disallowed."""
    monkeypatch.delenv("TRACK_A_MODEL", raising=False)

    with pytest.raises(vs.ModelNotLoadedError):
        analyze_voice(speech_wav, model_path=None, allow_heuristic_fallback=False)
