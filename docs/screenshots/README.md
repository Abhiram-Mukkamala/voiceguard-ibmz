# Evidence Screenshots for Judges (IBM Z Datathon 2026)

This directory contains visual evidence of deployment and validation on the **IBM LinuxONE (s390x) Virtual Machine** and the **VoiceGuard Dashboard**.

The following screenshots must be captured from the VM environment and stored in this folder prior to final submission:

| File Name | Description & Command | Target Verification |
| --- | --- | --- |
| `01_lscpu_s390x.png` | Run `lscpu` in the VM terminal | Architecture: `s390x`, Byte Order: `Big Endian`, CPU model details. |
| `02_uname_free.png` | Run `uname -a` and `free -h` | Linux kernel on s390x, memory utilization, zero swap. |
| `03_docker_jupyter.png` | Run `docker ps` | Running container `registry.linuxone.cloud.marist.edu/l1cc/jupyterlab-image-s390x`. |
| `04_smoke_test_pass.png` | Run `python3 scripts/smoke_test.py` | Golden logit reproduction: zeros `[-28.1055, 19.7470]` and ramp `[-19.9592, 14.1075]`. |
| `05_healthz_endpoint.png` | Run `curl -s localhost:8000/healthz` | JSON response showing `"status":"ok"` and `"using_model_fallback":false`. |
| `06_client_simulator_e2e.png` | Run `python3 gateway/client_simulator.py sample_call.wav` | Output trace showing `risk_update`, `mitigation_verdict`, and `enforcement_action`. |
| `07_dashboard_live_stream.png` | Screenshot of the React dashboard in **Live Mode** | Real-time gauge, active session telemetry feed, and waveform stream. |
| `08_l1cc_lab1_hybrid_ai.png` | Screenshot of completed Lab 1 in JupyterLab | Mandatory L1CC Lab: Predictive AI Hybrid AI scenarios notebook. |
| `09_l1cc_lab2_gen_ai.png` | Screenshot of completed Lab 2 in JupyterLab | Mandatory L1CC Lab: Predictive AI + Generative AI notebook. |

## Verification Notes
- All VM terminal captures must clearly display the prompt `linux1@<hostname>` or show system architecture evidence.
- Ensure that no private tokens, API keys, or `.ppk` credentials are visible in screenshots.
