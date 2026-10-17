#!/usr/bin/env bash
# ==============================================================================
# scripts/run_api.sh - Start VoiceGuard API gateway daemon on LinuxONE VM
# ==============================================================================
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_DIR="$(cd "${SCRIPT_DIR}/.." && pwd)"

# Activate virtual environment if available
if [ -f "${HOME}/.venv/bin/activate" ]; then
    # shellcheck source=/dev/null
    source "${HOME}/.venv/bin/activate"
elif [ -f "${REPO_DIR}/.venv/bin/activate" ]; then
    # shellcheck source=/dev/null
    source "${REPO_DIR}/.venv/bin/activate"
fi

# AUTH_SECRET validation (Security requirement)
if [ -z "${AUTH_SECRET:-}" ]; then
    echo "WARNING: AUTH_SECRET is not set. Generating a random 32-byte secret for this session." >&2
    AUTH_SECRET="$(openssl rand -hex 32)"
    export AUTH_SECRET
fi

# Set model path to pure-NumPy weights directory
export TRACK_A_MODEL="${REPO_DIR}/voiceguard/model/track_a_npz"

# ENABLE_DEV_TOKEN is disabled by default for security.
# To enable development JWT minting: ENABLE_DEV_TOKEN=1 ./scripts/run_api.sh
if [ "${ENABLE_DEV_TOKEN:-0}" == "1" ]; then
    echo "NOTICE: ENABLE_DEV_TOKEN is active. /dev/token will be accessible."
    export ENABLE_DEV_TOKEN=1
else
    unset ENABLE_DEV_TOKEN 2>/dev/null || true
fi

LOG_FILE="${HOME}/api.log"

echo "Starting VoiceGuard API daemon on 127.0.0.1:8000..."
echo "  TRACK_A_MODEL: ${TRACK_A_MODEL}"
echo "  Logging to:    ${LOG_FILE}"

nohup uvicorn server:app \
    --app-dir "${REPO_DIR}/gateway" \
    --host 127.0.0.1 \
    --port 8000 \
    >> "${LOG_FILE}" 2>&1 &

PID=$!
echo "VoiceGuard gateway started with PID ${PID}."
echo "Check status: curl -s http://127.0.0.1:8000/healthz"
