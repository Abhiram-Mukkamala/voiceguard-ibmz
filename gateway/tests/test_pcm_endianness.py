"""
Byte-order contract for the wire format (PCM16 little-endian).

Passes on every host. On big-endian hosts (IBM Z / LinuxONE, s390x) it fails
if samples are decoded with the native np.int16 instead of an explicit "<i2".
Run it first on the LinuxONE VM:  python -m pytest gateway/tests/test_pcm_endianness.py -v
"""
import os
import sys

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

import numpy as np

import server


def _le_bytes(samples):
    # Explicit LE regardless of host byte order -- this is what a phone/SBC/browser sends.
    return np.asarray(samples, dtype="<i2").tobytes()


def test_pcm16le_decode_16k_is_host_independent():
    samples = [0, 1, -1, 256, -256, 12345, -12345, 32767, -32768]
    out = server.pcm16_bytes_to_float32(_le_bytes(samples), 16000)
    expected = np.array(samples, dtype=np.float32) / 32768.0
    np.testing.assert_allclose(out, expected, atol=0)


def test_pcm16le_decode_8k_resample_is_host_independent():
    t = np.arange(8000) / 8000.0
    tone = (0.5 * 32767 * np.sin(2 * np.pi * 440 * t)).astype("<i2")
    out = server.pcm16_bytes_to_float32(tone.tobytes(), 8000)
    assert out.dtype == np.float32
    assert abs(len(out) - 16000) <= 2
    # A 440 Hz tone must stay a 440 Hz tone (byte-swapped samples would be broadband noise).
    spectrum = np.abs(np.fft.rfft(out))
    peak_hz = np.argmax(spectrum) * 16000 / len(out)
    assert abs(peak_hz - 440) < 5


def test_enrollment_roundtrip_bytes_are_le():
    native = np.array([1, -2, 300, -400], dtype=np.int16)
    out = server.pcm16_bytes_to_float32(native.astype(server._PCM16LE).tobytes(), 16000)
    np.testing.assert_allclose(out, native.astype(np.float32) / 32768.0, atol=0)
