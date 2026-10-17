#!/usr/bin/env bash
# ==============================================================================
# scripts/vm_setup.sh - Idempotent environment setup for IBM LinuxONE (s390x)
# ==============================================================================
set -euo pipefail

echo "=== [1/4] Installing system dependencies via apt ==="
sudo apt-get update -y
sudo apt-get install -y --no-install-recommends \
    python3-numpy \
    python3-scipy \
    python3-venv \
    python3-pip \
    unzip \
    nginx \
    docker.io \
    curl \
    ca-certificates

echo "=== [2/4] Setting up Python virtual environment ==="
# Notice: --system-site-packages is essential so the venv uses apt-provided
# NumPy and SciPy, since SciPy has no prebuilt wheel on s390x.
VENV_DIR="${HOME}/.venv"
if [ ! -d "${VENV_DIR}" ]; then
    python3 -m venv --system-site-packages "${VENV_DIR}"
    echo "Created virtual environment at ${VENV_DIR}"
fi

# Activate venv
# shellcheck source=/dev/null
source "${VENV_DIR}/bin/activate"

echo "=== [3/4] Installing Python application dependencies ==="
pip install --upgrade pip setuptools wheel

# Note: do NOT attempt to pip install onnxruntime (no s390x wheel exists).
# Pure-NumPy implementation (voiceguard/numpy_lcnn.py) handles model inference.
pip install \
    "fastapi>=0.110.0" \
    "uvicorn>=0.30.0" \
    "pyjwt>=2.7.0" \
    "websockets>=12.0" \
    "pytest>=8.0.0" \
    "pytest-asyncio>=0.23.0" \
    "httpx>=0.27.0" \
    "soundfile>=0.12.0"

echo "=== [4/4] Verifying setup ==="
python3 -c "import numpy, scipy, fastapi, uvicorn, jwt; print('All core Python modules loaded successfully on s390x!')"

echo "=== Setup complete! ==="
