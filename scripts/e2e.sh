#!/usr/bin/env bash
# ==============================================================================
# scripts/e2e.sh - End-to-end WebSocket test for VoiceGuard Gateway
# ==============================================================================
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_DIR="$(cd "${SCRIPT_DIR}/.." && pwd)"

HOST="${GATEWAY_HOST:-127.0.0.1}"
PORT="${GATEWAY_PORT:-8000}"

# 1. Check if server is running
if ! curl -sf "http://${HOST}:${PORT}/healthz" > /dev/null 2>&1; then
    echo "ERROR: Gateway is not responding at http://${HOST}:${PORT}/healthz" >&2
    echo "Please start the gateway first: ./scripts/run_api.sh" >&2
    exit 1
fi

echo "=== [1/3] Minting test JWT token ==="
# Try /dev/token if available, otherwise generate locally using auth.py
TOKEN=""
if TOKEN_RESP=$(curl -sf -X POST "http://${HOST}:${PORT}/dev/token?sub=e2e-test-user" 2>/dev/null); then
    TOKEN=$(python3 -c "import json, sys; print(json.loads('''${TOKEN_RESP}''').get('token', ''))")
fi

if [ -z "${TOKEN}" ]; then
    echo "Note: /dev/token is disabled (404). Generating local token via gateway/auth.py..."
    TOKEN=$(python3 -c "
import sys
sys.path.insert(0, '${REPO_DIR}/gateway')
from auth import create_token
print(create_token('e2e-test-user'))
")
fi

if [ -z "${TOKEN}" ]; then
    echo "ERROR: Failed to obtain a valid JWT token." >&2
    exit 1
fi
echo "Obtained token: ${TOKEN:0:16}..."

echo "=== [2/3] Generating speech-like test audio (native int16) ==="
TEST_WAV=$(mktemp --suffix=.wav)
python3 -c "
import wave, numpy as np
sr = 16000
t = np.arange(int(sr * 4.0)) / sr
f0 = 130 + 30 * np.sin(2 * np.pi * 0.8 * t)
phase = 2 * np.pi * np.cumsum(f0) / sr
harmonics = sum(np.sin(k * phase) / (k ** 0.8) for k in range(1, 25) if k * 140 < sr / 2)
env = np.convolve((np.sin(2 * np.pi * 1.5 * t) > -0.2).astype(float), np.ones(400)/400, mode='same')
sig = (0.4 * harmonics / np.max(np.abs(harmonics)) * env).astype(np.float32)
pcm_native = (np.clip(sig, -1.0, 1.0) * 32767).astype(np.int16)

with wave.open('${TEST_WAV}', 'wb') as w:
    w.setnchannels(1)
    w.setsampwidth(2)
    w.setframerate(sr)
    w.writeframes(pcm_native.tobytes())
"

echo "=== [3/3] Streaming audio through WebSocket ==="
OUTPUT=$(python3 "${REPO_DIR}/gateway/client_simulator.py" \
    "${TEST_WAV}" \
    --host "${HOST}" \
    --port "${PORT}" \
    --token "${TOKEN}" \
    --loss 0.05 2>&1)

echo "${OUTPUT}"
rm -f "${TEST_WAV}"

# Verify that risk_update was received from the server
if echo "${OUTPUT}" | grep -q "risk_update"; then
    echo -e "\n=== E2E TEST RESULT: PASS (risk_update received from gateway) ==="
    exit 0
else
    echo -e "\n=== E2E TEST RESULT: FAIL (no risk_update event found in output) ===" >&2
    exit 1
fi
