import { useCallback, useEffect, useRef, useState } from 'react';
import type {
  SessionState, TelemetryEntry, VerdictEntry, RiskLevel, MitigationAction,
  LivenessChallengeEvent, EnforcementActionEvent,
} from '../types/websocket';

export type Scenario = 'clean' | 'suspicious' | 'clone';

const TOTAL_STRIDES = 8;

function makeInitial(scenario: Scenario): SessionState {
  return {
    sessionId: `demo_${scenario}_${Math.random().toString(36).slice(2, 9)}`,
    usingModelFallback: Math.random() < 0.25,
    riskScore: 0.08,
    riskLevel: 'ALLOW',
    spectralRisk: 0.07,
    prosodyRisk: 0.09,
    pIdentity: 0.97,
    speakerSimilarity: 0.96,
    packetLossRatio: 0,
    latencyMs: 0,
    mitigationAction: 'ALLOW',
    decisionPending: false,
    telemetry: [],
    verdicts: [],
    livenessChallenge: null,
    enforcement: null,
    strideCount: 0,
    totalStrides: TOTAL_STRIDES,
  };
}

function riskLevel(s: number): RiskLevel {
  if (s < 0.35) return 'ALLOW';
  if (s < 0.70) return 'CHALLENGE';
  return 'BLOCK';
}
function mitigationFor(l: RiskLevel): MitigationAction {
  if (l === 'ALLOW') return 'ALLOW';
  if (l === 'CHALLENGE') return 'CHALLENGE';
  return 'BLOCK';
}

// ─── Scenario tick engines ──────────────────────────────────────

class CleanEngine {
  private base = 0.10;
  tick(t: number) {
    this.base += (Math.random() - 0.5) * 0.015;
    this.base = Math.max(0.06, Math.min(0.22, this.base));
    const score = this.base + (Math.random() - 0.5) * 0.02;
    return Math.max(0.04, Math.min(0.24, score));
  }
}

class SuspiciousEngine {
  private base = 0.10;
  private phase: 'rise' | 'hold' | 'fall' = 'rise';
  private holdT = 0;
  private livenessEmitted = false;
  tick(t: number, livenessSpoken: boolean): { score: number; emitLiveness: boolean } {
    let emitLiveness = false;
    if (livenessSpoken && this.phase !== 'fall') {
      this.phase = 'fall';
    }
    if (this.phase === 'rise') {
      this.base += 0.018 + Math.random() * 0.012;
      if (this.base >= 0.52) {
        this.phase = 'hold';
        if (!this.livenessEmitted) { emitLiveness = true; this.livenessEmitted = true; }
      }
    } else if (this.phase === 'hold') {
      this.holdT++;
      this.base += (Math.random() - 0.5) * 0.025;
      this.base = Math.max(0.38, Math.min(0.68, this.base));
      if (this.holdT === 6 && !this.livenessEmitted) { emitLiveness = true; this.livenessEmitted = true; }
    } else {
      this.base -= 0.022 + Math.random() * 0.010;
      this.base = Math.max(0.08, this.base);
    }
    const score = this.base + (Math.random() - 0.5) * 0.02;
    return { score: Math.max(0.04, Math.min(0.72, score)), emitLiveness };
  }
}

class CloneEngine {
  private base = 0.10;
  private livenessEmitted = false;
  private postLiveness = false;
  tick(t: number, livenessSpoken: boolean): { score: number; emitLiveness: boolean; sever: boolean } {
    let emitLiveness = false;
    let sever = false;
    // Steady climb
    this.base += 0.022 + Math.random() * 0.015;
    this.base = Math.min(0.96, this.base);
    if (!this.livenessEmitted && this.base >= 0.50) {
      emitLiveness = true;
      this.livenessEmitted = true;
    }
    // Sever after ~28 strides of high risk (or ~20 if no liveness spoken)
    const threshold = livenessSpoken ? 34 : 24;
    if (t >= threshold && this.base >= 0.72) sever = true;
    const score = this.base + (Math.random() - 0.5) * 0.02;
    return { score: Math.max(0.04, Math.min(0.98, score)), emitLiveness, sever };
  }
}

// ─── Hook ──────────────────────────────────────────────────────

export function useDemoSession(scenario: Scenario, active: boolean) {
  const [session, setSession] = useState<SessionState>(() => makeInitial(scenario));
  const [severed, setSevered] = useState(false);
  const engineRef = useRef<CleanEngine | SuspiciousEngine | CloneEngine | null>(null);
  const tickRef = useRef(0);
  const livenessSpokenRef = useRef(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const reset = useCallback(() => {
    engineRef.current = null;
    tickRef.current = 0;
    livenessSpokenRef.current = false;
    setSevered(false);
    setSession(makeInitial(scenario));
  }, [scenario]);

  const markLivenessSpoken = useCallback(() => {
    livenessSpokenRef.current = true;
    setSession((prev) => ({ ...prev, livenessChallenge: null }));
  }, []);

  useEffect(() => {
    reset();
  }, [scenario, reset]);

  useEffect(() => {
    if (!active || severed) {
      if (intervalRef.current) clearInterval(intervalRef.current);
      return;
    }

    // Init engine
    if (!engineRef.current) {
      engineRef.current =
        scenario === 'clean' ? new CleanEngine()
        : scenario === 'suspicious' ? new SuspiciousEngine()
        : new CloneEngine();
    }

    intervalRef.current = setInterval(() => {
      const t = tickRef.current++;
      const eng = engineRef.current!;
      const spoken = livenessSpokenRef.current;

      let rawScore: number;
      let emitLiveness = false;
      let sever = false;

      if (eng instanceof CleanEngine) {
        rawScore = eng.tick(t);
      } else if (eng instanceof SuspiciousEngine) {
        const r = eng.tick(t, spoken);
        rawScore = r.score;
        emitLiveness = r.emitLiveness;
      } else {
        const r = (eng as CloneEngine).tick(t, spoken);
        rawScore = r.score;
        emitLiveness = r.emitLiveness;
        sever = r.sever;
      }

      const level = riskLevel(rawScore);
      const packetLoss = Math.random() < 0.08 ? 0.12 + Math.random() * 0.30 : Math.random() * 0.04;
      const latency = 180 + Math.random() * 120;
      const spectral = Math.max(0, rawScore * 0.92 + (Math.random() - 0.5) * 0.08);
      const prosody = Math.max(0, rawScore * 0.88 + (Math.random() - 0.5) * 0.10);
      const similarity = Math.max(0.05, 1 - rawScore * 0.75 + (Math.random() - 0.5) * 0.05);

      const entry: TelemetryEntry = {
        id: crypto.randomUUID(),
        timestamp: new Date(),
        risk_score: rawScore,
        risk_level: level,
        processing_latency_ms: latency,
        packet_loss_ratio: packetLoss,
        mitigation_action: mitigationFor(level),
      };

      setSession((prev) => {
        const newStride = (prev.strideCount + 1) % TOTAL_STRIDES;
        const addVerdict = newStride === 0;
        const verdict: VerdictEntry | null = addVerdict ? {
          id: crypto.randomUUID(),
          timestamp: new Date(),
          mitigation_action: mitigationFor(level),
          risk_score: rawScore,
          risk_level: level,
        } : null;

        const liveness: LivenessChallengeEvent | null = emitLiveness && !prev.livenessChallenge ? {
          type: 'liveness_challenge',
          challenge_id: `ch_${crypto.randomUUID().slice(0, 8)}`,
          prompt_text: 'Please say the phrase: blue lantern over quiet water.',
          expires_in_ms: 12000,
        } : prev.livenessChallenge;

        const enforcement: EnforcementActionEvent | null = sever ? {
          type: 'enforcement_action',
          action: 'SEVER_SESSION',
          reason: 'Composite risk exceeded BLOCK threshold. Vocoder artifacts confirmed.',
          risk_score: rawScore,
        } : prev.enforcement;

        if (sever) {
          setSevered(true);
          if (intervalRef.current) clearInterval(intervalRef.current);
        }

        // Keep history of raw scores for sparkline
        const sparkline = [...(prev as any)._sparkline ?? [], rawScore].slice(-24);

        return {
          ...prev,
          riskScore: rawScore,
          riskLevel: level,
          spectralRisk: spectral,
          prosodyRisk: prosody,
          speakerSimilarity: similarity,
          pIdentity: Math.max(0.02, 1 - rawScore * 0.65),
          packetLossRatio: packetLoss,
          latencyMs: latency,
          mitigationAction: mitigationFor(level),
          decisionPending: newStride > 5,
          strideCount: newStride,
          telemetry: [entry, ...prev.telemetry].slice(0, 120),
          verdicts: verdict ? [verdict, ...prev.verdicts].slice(0, 24) : prev.verdicts,
          livenessChallenge: liveness,
          enforcement,
          _sparkline: sparkline,
        } as SessionState & { _sparkline: number[] };
      });
    }, 250);

    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [active, scenario, severed]);

  return { session, severed, reset, markLivenessSpoken };
}
