#!/usr/bin/env python3
"""
scripts/smoke_test.py
=====================
Smoke test for VoiceGuard LCNN on pure NumPy (s390x / IBM LinuxONE & x86_64).
Evaluates golden zeros and ramp inputs and verifies against reference logits:
- Zeros input (1, 98, 20) -> [-28.1055, 19.7470]
- Ramp input  (1, 98, 20) -> [-19.9592, 14.1075]

Exit 0 on PASS, 1 on FAIL.
"""

from __future__ import annotations

import os
import sys
import numpy as np

# Resolve project root
ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
sys.path.insert(0, os.path.join(ROOT, "voiceguard"))
sys.path.insert(0, os.path.join(ROOT, "gateway"))

from numpy_lcnn import NumpyLCNN

EXPECTED_ZEROS = np.array([-28.1055, 19.7470], dtype=np.float32)
EXPECTED_RAMP = np.array([-19.9592, 14.1075], dtype=np.float32)
TOLERANCE = 1e-3


def main() -> int:
    weights_dir = os.environ.get("TRACK_A_MODEL") or os.path.join(ROOT, "voiceguard", "model", "track_a_npz")
    print(f"Loading weights from: {weights_dir}")

    if not os.path.isdir(weights_dir):
        print(f"FAIL: Weights directory does not exist: {weights_dir}", file=sys.stderr)
        return 1

    try:
        model = NumpyLCNN(weights_dir)
    except Exception as exc:
        print(f"FAIL: Could not instantiate NumpyLCNN: {exc}", file=sys.stderr)
        return 1

    # Test 1: All Zeros
    zeros_in = np.zeros((1, 98, 20), dtype=np.float32)
    zeros_out = model.logits(zeros_in).squeeze()
    zeros_diff = np.max(np.abs(zeros_out - EXPECTED_ZEROS))

    print(f"Zeros logits: [{zeros_out[0]:.4f}, {zeros_out[1]:.4f}] (expected: [{EXPECTED_ZEROS[0]:.4f}, {EXPECTED_ZEROS[1]:.4f}])")
    print(f"Zeros max diff: {zeros_diff:.6f}")

    # Test 2: Linear Ramp
    ramp_in = (np.arange(98 * 20, dtype=np.float32).reshape(1, 98, 20) / (98 * 20) - 0.5)
    ramp_out = model.logits(ramp_in).squeeze()
    ramp_diff = np.max(np.abs(ramp_out - EXPECTED_RAMP))

    print(f"Ramp logits:  [{ramp_out[0]:.4f}, {ramp_out[1]:.4f}] (expected: [{EXPECTED_RAMP[0]:.4f}, {EXPECTED_RAMP[1]:.4f}])")
    print(f"Ramp max diff:  {ramp_diff:.6f}")

    if zeros_diff < TOLERANCE and ramp_diff < TOLERANCE:
        print("\nSMOKE TEST RESULT: PASS (All logits within 1e-3 tolerance)")
        return 0
    else:
        print("\nSMOKE TEST RESULT: FAIL (Logits exceeded tolerance)", file=sys.stderr)
        return 1


if __name__ == "__main__":
    sys.exit(main())
