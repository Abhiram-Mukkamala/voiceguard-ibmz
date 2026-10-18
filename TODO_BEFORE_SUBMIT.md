# Pre-Submission Checklist: VoiceGuard IBM Z Datathon 2026

Pre-submission checklist for team credentials, licensing, and target platform evidence captures.

---

## 1. Team Authorship & Credits
- [ ] **Team Members & Roster:**
  - File: `README.md`
  - Action: Confirm team members representing team **[Scamengers]**.
- [ ] **License Confirmation:**
  - File: `LICENSE`
  - Action: Confirm MIT License and verify copyright holder name(s).

---

## 2. Evidence Screenshots on IBM LinuxONE (s390x) VM
Capture the following screenshots directly on the target s390x VM and save them in `docs/screenshots/`:

- [ ] `01_lscpu_s390x.png` — Output of `lscpu` showing `s390x` architecture and `Big Endian` byte order.
- [ ] `02_uname_free.png` — Output of `uname -a` and `free -h` showing Linux kernel on s390x, memory, and zero swap.
- [ ] `03_docker_jupyter.png` — Output of `docker ps` confirming running container `registry.linuxone.cloud.marist.edu/l1cc/jupyterlab-image-s390x`.
- [ ] `04_smoke_test_pass.png` — Output of `python3 scripts/smoke_test.py` demonstrating PASS on golden zeros and ramp logits.
- [ ] `05_healthz_endpoint.png` — Output of `curl -s localhost:8000/healthz` showing `"using_model_fallback": false`.
- [ ] `06_client_simulator_e2e.png` — Output of `python3 gateway/client_simulator.py sample_call.wav` showing `risk_update`, `mitigation_verdict`, and `enforcement_action`.
- [ ] `07_dashboard_live_stream.png` — Screenshot of the React dashboard in Live Mode during an active stream.
- [ ] `08_l1cc_lab1_hybrid_ai.png` — Completed notebook for L1CC Lab 1 (Predictive AI Hybrid AI scenarios).
- [ ] `09_l1cc_lab2_gen_ai.png` — Completed notebook for L1CC Lab 2 (Predictive AI + Generative AI).

