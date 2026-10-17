import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Waves, Mic2, Fingerprint } from 'lucide-react';
import RiskGauge from '../components/RiskGauge';
import FusionTrace from '../components/FusionTrace';
import SignalCard from '../components/SignalCard';
import TelemetryFeed from '../components/TelemetryFeed';
import LivenessChallenge from '../components/LivenessChallenge';
import EnforcementBanner from '../components/EnforcementBanner';
import SidePanel from '../components/SidePanel';
import SessionSource from './SessionSource';
import LiquidGlass from '../components/LiquidGlass';
import { useDemoSession, type Scenario } from '../hooks/useDemoSession';
import { useWebSocket } from '../hooks/useWebSocket';

interface Props { dark: boolean }

type Stage = 'source' | 'live';

// Telemetry + verdicts side-by-side panel
function TelemetryVerdicts({ session }: { session: ReturnType<typeof useDemoSession>['session'] }) {
  return (
    <div className="grid gap-3 flex-1 min-h-0" style={{ gridTemplateColumns: '1fr 1fr' }}>
      <TelemetryFeed entries={session.telemetry} />
      <VerdictsPanel verdicts={session.verdicts} />
    </div>
  );
}

function VerdictsPanel({ verdicts }: { verdicts: ReturnType<typeof useDemoSession>['session']['verdicts'] }) {
  return (
    <div className="liquid-glass flex flex-col h-full overflow-hidden" style={{ borderRadius: '1rem' }}>
      <div
        className="px-4 py-2.5 flex items-center justify-between shrink-0 border-b"
        style={{ borderColor: 'var(--border)' }}
      >
        <span className="text-xs font-mono uppercase tracking-widest" style={{ color: 'var(--fg-3)' }}>
          Mitigation Verdicts
        </span>
        <span className="text-xs font-mono" style={{ color: 'var(--fg-3)' }}>{verdicts.length}</span>
      </div>
      <div className="overflow-y-auto flex-1">
        {verdicts.length === 0 && (
          <div className="flex items-center justify-center h-20 text-xs font-mono" style={{ color: 'var(--fg-3)' }}>
            Awaiting first window…
          </div>
        )}
        {verdicts.map((v, i) => {
          const color =
            v.mitigation_action === 'ALLOW' ? 'var(--allow)'
            : v.mitigation_action === 'CHALLENGE' ? 'var(--challenge)'
            : v.mitigation_action === 'BLOCK' ? 'var(--block)'
            : 'var(--fg-3)';
          return (
            <motion.div
              key={v.id}
              initial={{ opacity: 0, x: 6 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.2 }}
              className="px-4 py-2.5 border-b flex items-center gap-2"
              style={{ borderColor: 'var(--border)' }}
            >
              <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: color }} />
              <span className="font-mono text-xs font-semibold" style={{ color }}>{v.mitigation_action}</span>
              <span className="font-mono text-xs ml-auto tabular-nums" style={{ color: 'var(--fg-3)' }}>
                {(v.risk_score * 100).toFixed(1)}%
              </span>
              <span className="font-mono text-xs tabular-nums" style={{ color: 'var(--fg-3)' }}>
                w{verdicts.length - i}
              </span>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

export default function DashboardPage({ dark }: Props) {
  const [stage, setStage] = useState<Stage>('source');
  const [scenario, setScenario] = useState<Scenario>('clone');
  const [mode, setMode] = useState<'demo' | 'live'>('demo');

  const { session: demoSession, severed: demoSevered, reset: demoReset, markLivenessSpoken } =
    useDemoSession(scenario, stage === 'live' && mode === 'demo');

  const {
    status: liveStatus,
    session: liveSession,
    connect,
    disconnect,
    reset: liveReset,
    streamAudioFile,
    isStreaming,
    streamProgress,
  } = useWebSocket();

  const session = mode === 'demo' ? demoSession : liveSession;
  const sparkline = (session as any)._sparkline ?? [];

  function handleStartDemo(s: Scenario) {
    setScenario(s);
    setMode('demo');
    setStage('live');
  }

  function handleStartLive(url: string, token: string) {
    setMode('live');
    connect(url, token);
    if (liveStatus === 'connected') setStage('live');
  }

  function handleStartLiveFile(file: File, url: string, token: string) {
    setMode('live');
    streamAudioFile(file, url, token);
    setStage('live');
  }

  // Transition to live once WS connects
  if (mode === 'live' && liveStatus === 'connected' && stage === 'source') {
    setStage('live');
  }

  function handleDisconnect() {
    if (mode === 'live') disconnect();
    else demoReset();
    setStage('source');
  }

  function handleEnforcementReturn() {
    if (mode === 'demo') demoReset();
    else liveReset();
    setStage('source');
  }

  return (
    <div className="h-screen flex flex-col overflow-hidden" style={{ background: 'var(--bg)' }}>
      {/* Session top bar — shown only when live */}
      <AnimatePresence>
        {stage === 'live' && (
          <motion.header
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="shrink-0 px-5 h-11 flex items-center justify-between border-b"
            style={{
              background: dark ? 'rgba(12,12,12,0.9)' : 'rgba(245,242,234,0.9)',
              borderColor: 'var(--border)',
              backdropFilter: 'blur(14px)',
              zIndex: 10,
            }}
          >
            <div className="flex items-center gap-3 text-xs font-mono">
              {/* Demo/Live badge */}
              <span
                className="px-2 py-0.5 rounded-full"
                style={{
                  background: mode === 'demo' ? 'rgba(245,158,11,0.1)' : 'rgba(34,197,94,0.1)',
                  color: mode === 'demo' ? 'var(--challenge)' : 'var(--allow)',
                  border: `1px solid ${mode === 'demo' ? 'rgba(245,158,11,0.2)' : 'rgba(34,197,94,0.2)'}`,
                }}
              >
                {mode === 'demo' ? `Demo · ${scenario}` : 'Live'}
              </span>

              <span className="h-3 w-px" style={{ background: 'var(--border-2)' }} />

              {/* Session ID */}
              <span style={{ color: 'var(--fg-3)' }}>
                {(session.sessionId ?? '—').slice(0, 18)}…
              </span>

              <span className="h-3 w-px" style={{ background: 'var(--border-2)' }} />

              {/* Latency */}
              <span style={{ color: session.latencyMs > 500 ? 'var(--challenge)' : 'var(--fg-3)' }}>
                {session.latencyMs.toFixed(0)}ms
              </span>

              {/* PLR */}
              {session.packetLossRatio > 0 && (
                <>
                  <span className="h-3 w-px" style={{ background: 'var(--border-2)' }} />
                  <span style={{ color: session.packetLossRatio > 0.35 ? 'var(--challenge)' : 'var(--fg-3)' }}>
                    PLR {(session.packetLossRatio * 100).toFixed(1)}%
                  </span>
                </>
              )}
            </div>

            <button
              onClick={handleDisconnect}
              className="text-xs font-mono transition-opacity hover:opacity-60"
              style={{ color: 'var(--fg-3)' }}
            >
              Disconnect
            </button>
          </motion.header>
        )}
      </AnimatePresence>

      {/* Main content */}
      <AnimatePresence mode="wait">
        {stage === 'source' ? (
          <motion.div
            key="source"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="flex-1 overflow-y-auto"
          >
            <SessionSource
              dark={dark}
              onStartDemo={handleStartDemo}
              onStartLive={handleStartLive}
              onStartLiveFile={handleStartLiveFile}
              liveStatus={liveStatus}
              isStreaming={isStreaming}
              streamProgress={streamProgress}
            />
          </motion.div>
        ) : (
          <motion.div
            key="live"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="flex-1 overflow-hidden grid gap-3 p-3"
            style={{ gridTemplateColumns: '1fr 280px' }}
          >
            {/* Main column */}
            <div className="flex flex-col gap-3 overflow-hidden min-h-0">
              {/* Gauge row: gauge + fusion trace */}
              <div className="shrink-0 grid gap-3" style={{ gridTemplateColumns: 'auto 1fr' }}>
                {/* Gauge */}
                <LiquidGlass className="p-5 flex items-center justify-center" rounded="1.25rem">
                  <RiskGauge
                    score={session.riskScore * 100}
                    level={session.riskLevel}
                    pending={session.decisionPending}
                  />
                </LiquidGlass>

                {/* Right of gauge: fusion trace + signal cards */}
                <div className="flex flex-col gap-3">
                  {/* Fusion trace */}
                  <LiquidGlass className="p-4" rounded="1rem">
                    <FusionTrace
                      ema={session.riskScore}
                      raw={session.riskScore + (Math.random() - 0.5) * 0.04}
                      history={sparkline}
                    />
                  </LiquidGlass>

                  {/* Signal cards */}
                  <div className="flex flex-col gap-2 flex-1">
                    <SignalCard label="Spectral" value={session.spectralRisk} icon={<Waves size={11} />} index={0} />
                    <SignalCard label="Prosody" value={session.prosodyRisk} icon={<Mic2 size={11} />} index={1} />
                    <SignalCard
                      label="Identity"
                      value={1 - session.speakerSimilarity}
                      subLabel="p(identity)"
                      subValue={session.pIdentity.toFixed(3)}
                      icon={<Fingerprint size={11} />}
                      index={2}
                    />
                  </div>
                </div>
              </div>

              {/* Liveness challenge */}
              <LivenessChallenge
                challenge={session.livenessChallenge}
                onMarkSpoken={markLivenessSpoken}
              />

              {/* Telemetry + verdicts */}
              <div className="flex-1 min-h-0 grid gap-3" style={{ gridTemplateColumns: '1fr 1fr' }}>
                <TelemetryFeed entries={session.telemetry} />
                <VerdictsPanel verdicts={session.verdicts} />
              </div>
            </div>

            {/* Side panel */}
            <div className="overflow-hidden">
              <SidePanel session={session} onDisconnect={handleDisconnect} onReset={handleDisconnect} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Enforcement overlay */}
      <EnforcementBanner
        event={session.enforcement}
        onDismiss={handleEnforcementReturn}
      />
    </div>
  );
}
