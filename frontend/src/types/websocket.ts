export type RiskLevel = 'ALLOW' | 'CHALLENGE' | 'BLOCK' | 'LOW_CONFIDENCE';
export type MitigationAction = 'ALLOW' | 'CHALLENGE' | 'BLOCK' | 'MONITOR';

export interface SessionStartedEvent {
  type: 'session_started';
  session_id: string;
  using_model_fallback: boolean;
}

export interface RiskUpdateEvent {
  type: 'risk_update';
  risk_score: number;
  composite_ema: number;
  composite_raw: number;
  risk_level: RiskLevel;
  p_identity: number;
  speaker_similarity: number;
  packet_loss_ratio: number;
  processing_latency_ms: number;
  mitigation_action: MitigationAction;
  decision_pending: boolean;
  spectral_risk?: number;
  prosody_risk?: number;
}

export interface MitigationVerdictEvent {
  type: 'mitigation_verdict';
  mitigation_action: MitigationAction;
  risk_score: number;
  risk_level: RiskLevel;
}

export interface LivenessChallengeEvent {
  type: 'liveness_challenge';
  challenge_id: string;
  prompt_text: string;
  expires_in_ms: number;
}

export interface EnforcementActionEvent {
  type: 'enforcement_action';
  action: 'SEVER_SESSION';
  reason: string;
  risk_score: number;
}

export type WSEvent =
  | SessionStartedEvent
  | RiskUpdateEvent
  | MitigationVerdictEvent
  | LivenessChallengeEvent
  | EnforcementActionEvent;

export type ConnectionStatus = 'disconnected' | 'connecting' | 'connected' | 'error' | 'severed' | 'auth_failed';

export interface TelemetryEntry {
  id: string;
  timestamp: Date;
  risk_score: number;
  risk_level: RiskLevel;
  processing_latency_ms: number;
  packet_loss_ratio: number;
  mitigation_action: MitigationAction;
}

export interface VerdictEntry {
  id: string;
  timestamp: Date;
  mitigation_action: MitigationAction;
  risk_score: number;
  risk_level: RiskLevel;
}

export interface SessionState {
  sessionId: string | null;
  usingModelFallback: boolean;
  riskScore: number;
  riskLevel: RiskLevel;
  spectralRisk: number;
  prosodyRisk: number;
  pIdentity: number;
  speakerSimilarity: number;
  packetLossRatio: number;
  latencyMs: number;
  mitigationAction: MitigationAction;
  decisionPending: boolean;
  telemetry: TelemetryEntry[];
  verdicts: VerdictEntry[];
  livenessChallenge: LivenessChallengeEvent | null;
  enforcement: EnforcementActionEvent | null;
  strideCount: number;
  totalStrides: number;
  closeReason?: string | null;
}
