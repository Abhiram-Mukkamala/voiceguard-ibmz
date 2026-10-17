# Pre-Submission Checklist: VoiceGuard IBM Z Datathon 2026

Every item below marked with `[TO FILL]` represents measured numbers, verifiable credentials, or external communications that must be completed by the team prior to final submission. **Do not invent any numbers, dates, or statistics.**

---

## 1. Provenance & Official Communication
- [ ] **Judges / Organizers Prior Work Disclosure:**
  - File: `PRIOR_WORK.md` and `README.md`
  - Item: `[TO FILL: when, how, link to the written confirmation]`
  - Action: Record the exact date and communication channel (e.g., Discord ticket, email) where the prior modular gateway foundation was disclosed to the IBM Z Datathon organizers.
- [ ] **Frontend Authorship:**
  - File: `README.md` and `PRIOR_WORK.md`
  - Item: `[TO FILL: who built it and when]`
  - Action: Document the team member(s) who designed and exported the Figma Make frontend on 17 October 2026.

---

## 2. Model Training Metrics (ASVspoof 2019 LA)
- [ ] **Dataset Size:**
  - Files: `README.md`, `voiceguard/model/MODEL_CARD.md`
  - Item: `[TO FILL: dataset size and utterance counts]`
  - Action: Insert exact utterance counts for ASVspoof 2019 LA Train and Dev subsets (from protocol files `ASVspoof2019.LA.cm.train.trn.txt` and `ASVspoof2019.LA.cm.dev.trl.txt`).
- [ ] **Training Run Parameters & Dev EER:**
  - Files: `README.md`, `voiceguard/model/MODEL_CARD.md`
  - Item: `[TO FILL: training date, epochs, best dev EER from the training log]`
  - Action: Extract from the training log output of `train_track_a.py`:
    - Training date and wall-clock duration
    - Number of epochs completed
    - Best validation Equal Error Rate (EER %) on the development set
- [ ] **Real-Voice Evaluation Set:**
  - File: `README.md` (Section 8: Results)
  - Item: `[TO FILL: what was tested]`
  - Action: List the specific validation audio samples or out-of-domain calls tested on the s390x VM.

---

## 3. Fraud Statistics & Problem Citations
- [ ] **Citations for Voice Cloning & Impersonation Fraud:**
  - File: `README.md` (Section 3: Problem)
  - Item: `[TO FILL: 2-3 cited statistics with links; do not invent any.]`
  - Action: Add 2–3 cited statistics with direct URLs from authoritative sources, such as:
    - FTC Consumer Sentinel Network Data Book / Impersonation Fraud reports
    - FBI Internet Crime Complaint Center (IC3) Annual Report
    - UK Finance Annual Fraud Report on Authorized Push Payment (APP) scams

---

## 4. Evidence Screenshots on IBM LinuxONE (s390x) VM
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

---

## 5. Repository License & Team Roster
- [ ] **License Confirmation:**
  - File: `LICENSE`
  - Action: Confirm MIT License and verify copyright holder name(s).
- [ ] **Team Members & Roster:**
  - File: `README.md`
  - Item: `[TO FILL: team member names and roles]`
  - Action: Fill in team members representing team **[Scamengers]**.
