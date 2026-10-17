"""
tests/test_numpy_lcnn.py
========================
Unit tests for the pure-NumPy LCNN forward pass:
(a) Golden logits for zeros and ramp inputs match within 1e-3.
(b) NumPy vs ONNX agreement within 1e-4 on 20 random inputs (when onnxruntime is available).
(c) Weights saved in big-endian ('>f4') byte order load to identical results.
(d) Output shape contract (batch, 2) for batch sizes 1 and 8.
"""

from __future__ import annotations

import os
import sys
import tempfile
import pytest
import numpy as np

# Add project root and voiceguard to sys.path
PROJECT_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
sys.path.insert(0, os.path.join(PROJECT_ROOT, "voiceguard"))
sys.path.insert(0, os.path.join(PROJECT_ROOT, "gateway"))

from numpy_lcnn import NumpyLCNN

WEIGHTS_DIR = os.path.join(PROJECT_ROOT, "voiceguard", "model", "track_a_npz")
ONNX_PATH = os.path.join(PROJECT_ROOT, "voiceguard", "model", "track_a.onnx")


@pytest.fixture(scope="module")
def lcnn_model():
    if not os.path.isdir(WEIGHTS_DIR):
        pytest.skip(f"Weights directory not found: {WEIGHTS_DIR}")
    return NumpyLCNN(WEIGHTS_DIR)


def test_golden_logits_zeros_and_ramp(lcnn_model):
    """Verify golden logits for zeros and ramp inputs to 1e-3 precision."""
    zeros_in = np.zeros((1, 98, 20), dtype=np.float32)
    expected_zeros = np.array([[-28.1055, 19.7470]], dtype=np.float32)
    actual_zeros = lcnn_model.logits(zeros_in)
    np.testing.assert_allclose(actual_zeros, expected_zeros, atol=1e-3)

    ramp_in = (np.arange(98 * 20, dtype=np.float32).reshape(1, 98, 20) / (98 * 20) - 0.5)
    expected_ramp = np.array([[-19.9592, 14.1075]], dtype=np.float32)
    actual_ramp = lcnn_model.logits(ramp_in)
    np.testing.assert_allclose(actual_ramp, expected_ramp, atol=1e-3)


def test_numpy_vs_onnx_agreement(lcnn_model):
    """If onnxruntime is importable, verify NumPy vs ONNX within 1e-4 on 20 random inputs."""
    try:
        import onnxruntime as ort
    except ImportError:
        pytest.skip("onnxruntime not installed on this host (expected on s390x)")

    if not os.path.isfile(ONNX_PATH):
        pytest.skip(f"ONNX model file not found: {ONNX_PATH}")

    session = ort.InferenceSession(ONNX_PATH, providers=["CPUExecutionProvider"])
    input_name = session.get_inputs()[0].name

    rng = np.random.default_rng(42)
    for _ in range(20):
        sample = rng.standard_normal((1, 98, 20)).astype(np.float32)
        numpy_out = lcnn_model.logits(sample)
        onnx_out = session.run(None, {input_name: sample})[0]
        np.testing.assert_allclose(numpy_out, onnx_out, atol=1e-4)


def test_big_endian_weight_loading(lcnn_model):
    """Verify weights saved with big-endian '>f4' headers produce identical inference results."""
    with tempfile.TemporaryDirectory() as tmp_dir:
        # Convert and write all weights as explicit big-endian (>f4)
        for name, arr in lcnn_model.p.items():
            be_arr = arr.astype(">f4")
            np.save(os.path.join(tmp_dir, f"{name}.npy"), be_arr)

        be_model = NumpyLCNN(tmp_dir)
        ramp_in = (np.arange(98 * 20, dtype=np.float32).reshape(1, 98, 20) / (98 * 20) - 0.5)

        orig_logits = lcnn_model.logits(ramp_in)
        be_logits = be_model.logits(ramp_in)
        np.testing.assert_allclose(be_logits, orig_logits, atol=1e-5)


def test_output_shapes_batch_1_and_8(lcnn_model):
    """Verify output shape contract is (batch, 2) for batch sizes 1 and 8."""
    batch_1 = np.zeros((1, 98, 20), dtype=np.float32)
    out_1 = lcnn_model.logits(batch_1)
    assert out_1.shape == (1, 2)
    assert out_1.dtype == np.float32

    batch_8 = np.zeros((8, 98, 20), dtype=np.float32)
    out_8 = lcnn_model.logits(batch_8)
    assert out_8.shape == (8, 2)
    assert out_8.dtype == np.float32
