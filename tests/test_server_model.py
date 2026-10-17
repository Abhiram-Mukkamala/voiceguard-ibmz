"""
tests/test_server_model.py
==========================
Tests for server model loading and development token gating:
- With TRACK_A_MODEL pointing at voiceguard/model/track_a_npz,
  /healthz reports using_model_fallback == False.
- /dev/token returns 404 by default (when ENABLE_DEV_TOKEN is not set to 1).
- /dev/token returns 200 with JWT token when ENABLE_DEV_TOKEN=1.
"""

from __future__ import annotations

import os
import sys
import pytest
from starlette.testclient import TestClient

PROJECT_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
WEIGHTS_DIR = os.path.join(PROJECT_ROOT, "voiceguard", "model", "track_a_npz")

sys.path.insert(0, os.path.join(PROJECT_ROOT, "gateway"))
sys.path.insert(0, os.path.join(PROJECT_ROOT, "voiceguard"))


def test_healthz_using_model_fallback_false(monkeypatch):
    """When TRACK_A_MODEL points to track_a_npz, /healthz reports using_model_fallback == false."""
    monkeypatch.setenv("TRACK_A_MODEL", WEIGHTS_DIR)

    import acoustic_model as am
    import server

    # Re-initialize acoustic model with the configured weights directory
    server.acoustic_model = am.AcousticModel(model_path=WEIGHTS_DIR)
    assert server.acoustic_model.using_fallback is False

    client = TestClient(server.app)
    response = client.get("/healthz")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ok"
    assert data["using_model_fallback"] is False


def test_dev_token_404_by_default(monkeypatch):
    """By default (ENABLE_DEV_TOKEN unset or != 1), /dev/token must return 404 Not Found."""
    monkeypatch.delenv("ENABLE_DEV_TOKEN", raising=False)

    import server
    client = TestClient(server.app)

    get_resp = client.get("/dev/token")
    assert get_resp.status_code == 404

    post_resp = client.post("/dev/token")
    assert post_resp.status_code == 404


def test_dev_token_200_when_enabled(monkeypatch):
    """When ENABLE_DEV_TOKEN=1, /dev/token mints a valid JWT token."""
    monkeypatch.setenv("ENABLE_DEV_TOKEN", "1")

    import server
    client = TestClient(server.app)

    post_resp = client.post("/dev/token?sub=alice")
    assert post_resp.status_code == 200
    body = post_resp.json()
    assert "token" in body
    assert body["sub"] == "alice"
