"""
numpy_lcnn.py
=============
Pure-NumPy forward pass of the Track A LCNN (see train_track_a.py::build_model),
for hosts with no onnxruntime wheel (e.g. IBM Z / s390x). Loads the per-tensor
.npy weight files exported from best.pt (a directory, e.g. track_a_npz/).

Same contract as the ONNX model: input (batch, 98, 20) float32 LFCC,
output (batch, 2) raw logits [bonafide, spoof]. Dropout is inference-off.

Byte order: .npy headers declare '<f4'; every tensor is converted to native
float32 on load, so this is correct on big-endian hosts too.
"""
from __future__ import annotations

import os

import numpy as np
from numpy.lib.stride_tricks import sliding_window_view

_BN_EPS = 1e-5


def _conv2d(x: np.ndarray, w: np.ndarray, b: np.ndarray, pad: int) -> np.ndarray:
    # x: (B, C, H, W)  w: (O, C, k, k)  -> (B, O, H, W)   ("same" padding, stride 1)
    xp = np.pad(x, ((0, 0), (0, 0), (pad, pad), (pad, pad)))
    k = w.shape[-1]
    win = sliding_window_view(xp, (k, k), axis=(2, 3))          # (B, C, H, W, k, k)
    out = np.tensordot(win, w, axes=([1, 4, 5], [1, 2, 3]))     # (B, H, W, O)
    return (out.transpose(0, 3, 1, 2) + b[None, :, None, None]).astype(np.float32)


def _mfm(x: np.ndarray) -> np.ndarray:
    c = x.shape[1] // 2
    return np.maximum(x[:, :c], x[:, c:])


def _maxpool2(x: np.ndarray) -> np.ndarray:
    h, w = x.shape[2] // 2 * 2, x.shape[3] // 2 * 2
    x = x[:, :, :h, :w]
    return x.reshape(x.shape[0], x.shape[1], h // 2, 2, w // 2, 2).max(axis=(3, 5))


def _bn(x: np.ndarray, p: dict, name: str) -> np.ndarray:
    g, b = p[f"{name}.weight"], p[f"{name}.bias"]
    m, v = p[f"{name}.running_mean"], p[f"{name}.running_var"]
    s = (g / np.sqrt(v + _BN_EPS))[None, :, None, None]
    return ((x - m[None, :, None, None]) * s + b[None, :, None, None]).astype(np.float32)


class NumpyLCNN:
    backend_name = "numpy-lcnn"

    def __init__(self, weights_dir: str):
        need = ["net.0", "net.3", "net.7", "net.11", "head.2", "head.4"]
        self.p: dict[str, np.ndarray] = {}
        for f in os.listdir(weights_dir):
            if f.endswith(".npy"):
                self.p[f[:-4]] = np.load(os.path.join(weights_dir, f)).astype(np.float32)
        missing = [n for n in need if f"{n}.weight" not in self.p]
        if missing:
            raise FileNotFoundError(f"{weights_dir}: missing weights for {missing}")

    def logits(self, lfcc: np.ndarray) -> np.ndarray:
        p = self.p
        x = np.asarray(lfcc, dtype=np.float32)[:, None, :, :]          # (B,1,98,20)
        x = _maxpool2(_mfm(_conv2d(x, p["net.0.weight"], p["net.0.bias"], 2)))
        x = _maxpool2(_bn(_mfm(_conv2d(x, p["net.3.weight"], p["net.3.bias"], 1)), p, "net.5"))
        x = _maxpool2(_bn(_mfm(_conv2d(x, p["net.7.weight"], p["net.7.bias"], 1)), p, "net.9"))
        x = _mfm(_conv2d(x, p["net.11.weight"], p["net.11.bias"], 1))
        x = x.mean(axis=(2, 3))                                         # (B, 32)
        x = np.maximum(x @ p["head.2.weight"].T + p["head.2.bias"], 0.0)
        return (x @ p["head.4.weight"].T + p["head.4.bias"]).astype(np.float32)
