VoiceGuard dashboard — product prompt (step by step)
Build an operator console for VoiceGuard, a real-time AI voice-clone detector. The console is not the public marketing site. Analysts only reach it after demo login. The UI is dark-first (charcoal / black / grey), ivory in light mode, with a quiet interactive mesh in the background. Cards use liquid glass (refraction of whatever is behind them), not generic frosted glass.

Step 0 — Gate (before any dashboard)

Public site explains the product.
Sign in is a split layout:
Left: product story + demo credentials shown in the open.
Right: email + password form.

Demo login only (no real IdP):
Email: analyst@voiceguard.io
Password: scamengers

After a valid login, go to the session console.
Visiting the console unsigned-in must bounce back to sign-in.
Sign out returns to the public site and blocks the console again.


Step 1 — Session source (first console screen)
This is the pre-flight screen, not the live gauges yet.
Copy / intent: “Start a live risk session.” Analyst chooses where audio risk comes from.
1a. Demo / Live switch

A switch labeled Demo (off) and Live (on).
Demo (default): no backend. The UI simulates the frozen WebSocket protocol locally so the product is playable on stage.
Live: connect to a real gateway WebSocket (ws://…/ws/stream-verify) plus optional JWT (?token= or bearer).

1b. If Demo is on — pick a scenario (exactly one)
Three rows, each with a colored status dot:





















ScenarioWhat the sim doesClean callRisk stays in ALLOW (~0.08–0.22). No challenge, no sever.SuspiciousRisk climbs into the CHALLENGE band (~0.35–0.70). One liveness prompt. If the analyst marks it spoken, risk drops back to ALLOW.Confirmed clone (default)Risk climbs toward BLOCK (>0.70). After enough strides, SEVER_SESSION and the red overlay.
1c. If Live is on — connection fields

WebSocket URL (default ws://localhost:8000/ws/stream-verify).
JWT token (optional).
Errors: timeout, failed socket, “use Demo if the gateway is offline.”

1d. Primary action

Large button: Start live session.
While connecting: Connecting + live radio indicator.
Status line under the button: disconnected / connecting / connected / error / severed.


Step 2 — Live dashboard (after the session actually starts)
Layout:

Site navbar (product links, theme, Sign out).
Session top bar: Wordmark, connection badge, Demo/Live badge, truncated session id, latency, packet loss.
Main column: gauge → optional liveness card → three track cards → telemetry + verdicts.
Right column: session details + disconnect.

2a. Composite risk gauge (hero)

Circular gauge 0–100%, spring-smoothed.
Color by policy:
ALLOW < 0.35 → green
CHALLENGE 0.35–0.70 → amber
BLOCK > 0.70 → red

Center: percentage + level word (ALLOW / CHALLENGE / BLOCK).
Beside it: Fusion trace — EMA vs raw scores + a sparkline of recent risk_score.

Updates every 250ms stride (1.0s window, 250ms hop).
2b. Three signal cards (row)
These are the three fusion tracks, not decoration:

Spectral (Track A) — vocoder / phase artifacts. Meter = spectral risk.
Prosody (Track B) — pitch, jitter, shimmer. Meter = prosody risk.
Identity (Track C) — speaker match. Big number = similarity %; caption includes p(identity).

Meters use the same green / amber / red bands as the composite score.
In Demo, the sim synthesizes the three tracks.

In Live, identity comes from p_identity / speaker_similarity; spectral/prosody fall back to composite fields if the gateway does not send separate track scores.
2c. Liveness challenge card (only when fired)
Shown once when risk sits in the ambiguity band (not every stride).

Label: Liveness challenge
Large prompt_text (e.g. “Please say the phrase: blue lantern over quiet water.”)
Countdown from expires_in_ms
Button: Mark as spoken (demo stand-in for real TTS/IVR)
Clears the card, sets liveness passed, pulls risk back toward ALLOW.

If ignored on the clone path, the session can still escalate to BLOCK.

2d. Live telemetry (left of the pair)
Scrollable log of risk_update events, newest on top:

time
risk_score
risk_level
processing_latency_ms
packet loss flag (ok / loss)

2e. Mitigation verdicts (right of the pair)
Every 8 strides = 2.0s decision window the engine emits mitigation_verdict:

action (ALLOW / CHALLENGE / BLOCK)
score
window index and stride count

2f. Session details (side panel)

Decision window n/8 with 8 tick marks.
Latency (ms).
Packet loss %. If > 0.35, warn that EMA is frozen (network noise must not spike risk).
Model: “DSP heuristic fallback” vs ONNX, from using_model_fallback.
Truncated session id.
Enroll voiceprint — visible, disabled (future).
Disconnect — tear down WS/sim and return to Step 1.
Footer note: zero-retention, RAM-only.

2g. Enforcement overlay (terminal state)
When enforcement_action.action = SEVER_SESSION:

Full-screen alert: Voice cloning detected / Session severed
Reason + composite risk
Button: Return to gateway (back to Step 1, session cleared)

This is the clone-demo punchline.

Step 3 — How Demo actually drives the gauges (so the prompt stays honest)
Simulator clock: 250ms.
Each tick emits the frozen server events:

session_started → { session_id, using_model_fallback }
risk_update → score, EMA, raw, level, identity, packet loss, latency, decision_pending
Every 8th stride → mitigation_verdict
Once, if score in 0.35–0.70 and not already passed → liveness_challenge
Clone scenario after enough high-risk strides → enforcement_action + stop the clock

Clean never leaves ALLOW.

Suspicious aims at CHALLENGE + one prompt.

Clone aims at BLOCK + sever unless liveness is marked spoken.
Packet loss is randomly flagged (~8% of ticks) so the freeze behavior is visible.

Step 4 — Live mode (same UI, real socket)
Same dashboard. Same field names (do not rename):

session_started
risk_update
mitigation_verdict
liveness_challenge
enforcement_action

No extra schema. If a frame is malformed, ignore it. If the socket dies before session_started, show an error and stay on Step 1.

UX rules baked into this dashboard

One primary action per screen: Start live session → then watch / challenge / disconnect.
Color is policy, not decoration: green allow, amber challenge, red block.
Numbers are tabular / mono.
Theme toggle (ivory light / charcoal dark) is global, including the console.
Mesh is ambient; the perk in the corner can be plucked; it is not a control for detection.
Easter eggs (scroll bars, harmonic slider, logo clicks) live on the marketing page, not as required operator controls.


One-line operator path (what to say on stage)
Sign in with demo credentials → leave Demo on → pick Clean / Suspicious / Clone → Start live session → watch the gauge and three tracks → (optional) speak the liveness line → either the call stays up or the session is severed.