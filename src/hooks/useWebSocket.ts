import { useCallback, useEffect, useRef, useState } from 'react';
import type {
  WSEvent,
  ConnectionStatus,
  SessionState,
  TelemetryEntry,
  VerdictEntry,
  RiskLevel,
  MitigationAction,
} from '../types/websocket';

const INITIAL_STATE: SessionState = {
  sessionId: null,
  usingModelFallback: false,
  riskScore: 0,
  riskLevel: 'ALLOW',
  spectralRisk: 0,
  prosodyRisk: 0,
  pIdentity: 1,
  speakerSimilarity: 1,
  packetLossRatio: 0,
  latencyMs: 0,
  mitigationAction: 'ALLOW',
  decisionPending: false,
  telemetry: [],
  verdicts: [],
  livenessChallenge: null,
  enforcement: null,
  strideCount: 0,
  totalStrides: 8,
  closeReason: null,
};

/**
 * Normalizes backend risk level representations into UI levels:
 * SAFE -> ALLOW, WARNING -> CHALLENGE, CRITICAL -> BLOCK, LOW_CONFIDENCE -> LOW_CONFIDENCE
 */
export function normalizeRiskLevel(raw: unknown): RiskLevel {
  if (!raw) return 'ALLOW';
  const str = String(raw).toUpperCase().trim();
  if (str === 'SAFE' || str === 'ALLOW') return 'ALLOW';
  if (str === 'WARNING' || str === 'CHALLENGE') return 'CHALLENGE';
  if (str === 'CRITICAL' || str === 'BLOCK') return 'BLOCK';
  if (str === 'LOW_CONFIDENCE') return 'LOW_CONFIDENCE';
  return 'ALLOW';
}

/**
 * Normalizes backend mitigation actions:
 * ANALYZING -> MONITOR
 */
export function normalizeMitigationAction(raw: unknown): MitigationAction {
  if (!raw) return 'MONITOR';
  const str = String(raw).toUpperCase().trim();
  if (str === 'ANALYZING' || str === 'MONITOR') return 'MONITOR';
  if (str === 'ALLOW') return 'ALLOW';
  if (str === 'CHALLENGE') return 'CHALLENGE';
  if (str === 'BLOCK') return 'BLOCK';
  return 'MONITOR';
}

export function useWebSocket() {
  const [status, setStatus] = useState<ConnectionStatus>('disconnected');
  const [session, setSession] = useState<SessionState>(INITIAL_STATE);
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamProgress, setStreamProgress] = useState<{ current: number; total: number }>({ current: 0, total: 0 });

  const wsRef = useRef<WebSocket | null>(null);
  const streamTimerRef = useRef<number | null>(null);

  const stopStreaming = useCallback(() => {
    if (streamTimerRef.current !== null) {
      window.clearInterval(streamTimerRef.current);
      streamTimerRef.current = null;
    }
    setIsStreaming(false);
  }, []);

  const disconnect = useCallback(() => {
    stopStreaming();
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    setStatus('disconnected');
    setSession(INITIAL_STATE);
  }, [stopStreaming]);

  const connect = useCallback((url: string, token: string, onOpenCallback?: (ws: WebSocket) => void) => {
    if (wsRef.current && (wsRef.current.readyState === WebSocket.OPEN || wsRef.current.readyState === WebSocket.CONNECTING)) {
      return wsRef.current;
    }
    setStatus('connecting');

    const wsUrl = token ? `${url}${url.includes('?') ? '&' : '?'}token=${encodeURIComponent(token)}` : url;
    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      setStatus('connected');
      if (onOpenCallback) {
        onOpenCallback(ws);
      }
    };

    ws.onmessage = (e) => {
      let event: WSEvent;
      try {
        const raw = JSON.parse(e.data);
        // Normalize event type: server -> client protocol uses key "event"
        event = { ...raw, type: raw.type ?? raw.event } as WSEvent;
      } catch {
        return;
      }

      setSession((prev) => {
        switch (event.type) {
          case 'session_started':
            return {
              ...INITIAL_STATE,
              sessionId: event.session_id,
              usingModelFallback: event.using_model_fallback,
            };

          case 'risk_update': {
            const riskLvl = normalizeRiskLevel(event.risk_level);
            const mitAction = normalizeMitigationAction(event.mitigation_action);

            const entry: TelemetryEntry = {
              id: crypto.randomUUID(),
              timestamp: new Date(),
              risk_score: event.risk_score,
              risk_level: riskLvl,
              processing_latency_ms: event.processing_latency_ms,
              packet_loss_ratio: event.packet_loss_ratio,
              mitigation_action: mitAction,
            };

            return {
              ...prev,
              riskScore: event.risk_score,
              riskLevel: riskLvl,
              spectralRisk: event.spectral_risk ?? prev.spectralRisk,
              prosodyRisk: event.prosody_risk ?? prev.prosodyRisk,
              pIdentity: event.p_identity,
              speakerSimilarity: event.speaker_similarity,
              packetLossRatio: event.packet_loss_ratio,
              latencyMs: event.processing_latency_ms,
              mitigationAction: mitAction,
              decisionPending: event.decision_pending,
              strideCount: (prev.strideCount + 1) % prev.totalStrides,
              telemetry: [entry, ...prev.telemetry].slice(0, 100),
            };
          }

          case 'mitigation_verdict': {
            const riskLvl = normalizeRiskLevel(event.risk_level);
            const mitAction = normalizeMitigationAction(event.mitigation_action);

            const verdict: VerdictEntry = {
              id: crypto.randomUUID(),
              timestamp: new Date(),
              mitigation_action: mitAction,
              risk_score: event.risk_score,
              risk_level: riskLvl,
            };
            return {
              ...prev,
              verdicts: [verdict, ...prev.verdicts].slice(0, 20),
            };
          }

          case 'liveness_challenge':
            return { ...prev, livenessChallenge: event };

          case 'enforcement_action':
            return {
              ...prev,
              enforcement: {
                ...event,
                reason: event.reason || 'Voice cloning detected — session severed by VoiceGuard policy',
              },
            };

          default:
            return prev;
        }
      });
    };

    ws.onerror = () => {
      setStatus('error');
    };

    ws.onclose = (e: CloseEvent) => {
      wsRef.current = null;
      stopStreaming();

      // Normal outcome after enforcement_action
      if (e.code === 1008) {
        setStatus('severed');
        setSession((prev) => ({
          ...prev,
          enforcement: prev.enforcement ?? {
            type: 'enforcement_action',
            action: 'SEVER_SESSION',
            reason: 'Session severed by VoiceGuard Gateway (code 1008: Policy Violation)',
            risk_score: prev.riskScore || 0.88,
          },
          closeReason: 'Session severed by VoiceGuard Gateway (code 1008: Policy Violation)',
        }));
      } else if (e.code === 4401) {
        setStatus('auth_failed');
        setSession((prev) => ({
          ...prev,
          closeReason: 'Authentication failed (code 4401: Unauthorized JWT token)',
        }));
      } else {
        setStatus('disconnected');
      }
    };

    return ws;
  }, [stopStreaming]);

  /**
   * Decodes an audio file (WAV/MP3), downmixes to mono, resamples to 16 kHz using
   * an OfflineAudioContext, converts to little-endian Int16, and streams 4000-sample
   * (250 ms) chunks paced in real-time over the WebSocket.
   */
  const streamAudioFile = useCallback(
    async (file: File, url: string, token: string, userId = 'live-file-caller') => {
      try {
        setIsStreaming(true);

        const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        const audioCtx = new AudioContextClass();

        const fileBuffer = await file.arrayBuffer();
        const decodedBuffer = await audioCtx.decodeAudioData(fileBuffer);
        const durationSec = decodedBuffer.duration;

        // Resample to 16,000 Hz mono using OfflineAudioContext
        const targetSampleRate = 16000;
        const totalTargetSamples = Math.ceil(durationSec * targetSampleRate);
        const offlineCtx = new OfflineAudioContext(1, totalTargetSamples, targetSampleRate);

        const bufferSource = offlineCtx.createBufferSource();
        bufferSource.buffer = decodedBuffer;
        bufferSource.connect(offlineCtx.destination);
        bufferSource.start(0);

        const renderedBuffer = await offlineCtx.startRendering();
        const floatSamples = renderedBuffer.getChannelData(0);

        // Convert to explicit little-endian PCM16 ArrayBuffer
        const pcmBuffer = new ArrayBuffer(floatSamples.length * 2);
        const dataView = new DataView(pcmBuffer);
        for (let i = 0; i < floatSamples.length; i++) {
          const sample = Math.max(-1.0, Math.min(1.0, floatSamples[i]));
          const int16 = sample < 0 ? sample * 0x8000 : sample * 0x7fff;
          dataView.setInt16(i * 2, int16, true); // true = little-endian
        }

        // Connect WS if not already connected
        let activeWs = wsRef.current;
        if (!activeWs || activeWs.readyState !== WebSocket.OPEN) {
          activeWs = connect(url, token, (openedWs) => {
            // Handshake message: text frame
            openedWs.send(
              JSON.stringify({
                type: 'handshake',
                sample_rate: 16000,
                user_id: userId,
              })
            );
          });
        } else {
          activeWs.send(
            JSON.stringify({
              type: 'handshake',
              sample_rate: 16000,
              user_id: userId,
            })
          );
        }

        const CHUNK_SAMPLES = 4000; // 250ms @ 16kHz
        const CHUNK_BYTES = CHUNK_SAMPLES * 2; // 8000 bytes
        const totalBytes = pcmBuffer.byteLength;
        let offset = 0;

        setStreamProgress({ current: 0, total: durationSec });

        if (streamTimerRef.current !== null) {
          window.clearInterval(streamTimerRef.current);
        }

        streamTimerRef.current = window.setInterval(() => {
          if (!activeWs || activeWs.readyState !== WebSocket.OPEN) {
            stopStreaming();
            return;
          }

          if (offset >= totalBytes) {
            stopStreaming();
            return;
          }

          const end = Math.min(offset + CHUNK_BYTES, totalBytes);
          const chunk = pcmBuffer.slice(offset, end);
          activeWs.send(chunk);

          offset = end;
          const currentSec = Math.min(durationSec, (offset / 2) / 16000);
          setStreamProgress({ current: currentSec, total: durationSec });
        }, 250);
      } catch (err) {
        console.error('Audio streaming failed:', err);
        stopStreaming();
        setStatus('error');
      }
    },
    [connect, stopStreaming]
  );

  const reset = useCallback(() => {
    stopStreaming();
    setSession(INITIAL_STATE);
  }, [stopStreaming]);

  useEffect(() => {
    return () => {
      stopStreaming();
      wsRef.current?.close();
    };
  }, [stopStreaming]);

  return {
    status,
    session,
    connect,
    disconnect,
    reset,
    streamAudioFile,
    isStreaming,
    streamProgress,
    stopStreaming,
  };
}
