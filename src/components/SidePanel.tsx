import { motion } from 'framer-motion';
import { AlertTriangle, Cpu, Power, RotateCcw, UserPlus } from 'lucide-react';
import LiquidGlass from './LiquidGlass';
import type { SessionState } from '../types/websocket';

interface Props {
  session: SessionState;
  onDisconnect: () => void;
  onReset: () => void;
}

function MetricRow({ label, value, warn }: { label: string; value: string; warn?: boolean }) {
  return (
    <div className="flex items-center justify-between py-2 border-b last:border-0" style={{ borderColor: 'var(--border)' }}>
      <span className="text-xs font-mono" style={{ color: 'var(--fg-3)' }}>{label}</span>
      <span className="text-xs font-mono font-medium" style={{ color: warn ? '#F59E0B' : 'var(--fg-2)' }}>{value}</span>
    </div>
  );
}

export default function SidePanel({ session, onDisconnect, onReset }: Props) {
  const plrWarn = session.packetLossRatio > 0.35;

  return (
    <div className="flex flex-col gap-3 h-full overflow-y-auto">
      {/* Session info */}
      <LiquidGlass className="p-4" rounded="1rem">
        <div className="text-xs font-mono uppercase tracking-widest mb-2" style={{ color: 'var(--fg-3)' }}>Session</div>
        <div className="font-mono text-xs mb-3 truncate" style={{ color: 'var(--accent)' }}>{session.sessionId ?? '—'}</div>
        <MetricRow label="Latency" value={`${session.latencyMs.toFixed(0)}ms`} />
        <MetricRow label="Packet Loss" value={`${(session.packetLossRatio * 100).toFixed(1)}%`} warn={plrWarn} />
        {plrWarn && (
          <div className="mt-2 flex items-center gap-1.5 text-xs font-mono" style={{ color: '#F59E0B' }}>
            <AlertTriangle size={11} />High packet loss
          </div>
        )}
        {session.usingModelFallback && (
          <div className="mt-2 flex items-center gap-1.5 text-xs font-mono" style={{ color: '#F59E0B' }}>
            <Cpu size={11} />Model fallback active
          </div>
        )}
      </LiquidGlass>

      {/* Decision window */}
      <LiquidGlass className="p-4" rounded="1rem">
        <div className="flex items-center justify-between mb-2">
          <div className="text-xs font-mono uppercase tracking-widest" style={{ color: 'var(--fg-3)' }}>Decision Window</div>
          <div className="text-xs font-mono" style={{ color: 'var(--fg-3)' }}>
            {session.strideCount + 1}/{session.totalStrides}
          </div>
        </div>
        <div className="flex gap-1">
          {Array.from({ length: session.totalStrides }).map((_, i) => (
            <motion.div
              key={i}
              className="flex-1 h-1.5 rounded-full"
              style={{
                background: i <= session.strideCount ? 'var(--accent)' : 'var(--surface-2)',
                opacity: i <= session.strideCount ? 0.8 : 0.3,
              }}
              animate={{ opacity: i === session.strideCount ? [0.4, 0.9, 0.4] : undefined }}
              transition={{ duration: 0.8, repeat: Infinity }}
            />
          ))}
        </div>
        {session.decisionPending && (
          <div className="mt-2 text-xs font-mono animate-pulse" style={{ color: 'var(--accent)' }}>
            Computing decision…
          </div>
        )}
      </LiquidGlass>

      {/* Verdict history */}
      <LiquidGlass className="p-4 flex-1 overflow-hidden flex flex-col" rounded="1rem">
        <div className="text-xs font-mono uppercase tracking-widest mb-2 shrink-0" style={{ color: 'var(--fg-3)' }}>
          Verdicts
        </div>
        <div className="overflow-y-auto flex-1 space-y-1.5">
          {session.verdicts.length === 0 && (
            <div className="text-xs font-mono" style={{ color: 'var(--fg-3)' }}>No verdicts yet</div>
          )}
          {session.verdicts.map((v) => {
            const color = { ALLOW: '#10B981', CHALLENGE: '#F59E0B', BLOCK: '#EF4444', MONITOR: '#8E8E99' }[v.mitigation_action];
            return (
              <div key={v.id} className="flex items-center gap-2 py-1 border-b last:border-0" style={{ borderColor: 'var(--border)' }}>
                <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: color }} />
                <span className="text-xs font-mono" style={{ color }}>{v.mitigation_action}</span>
                <span className="text-xs font-mono ml-auto" style={{ color: 'var(--fg-3)' }}>
                  {(v.risk_score * 100).toFixed(0)}%
                </span>
              </div>
            );
          })}
        </div>
      </LiquidGlass>

      {/* Controls */}
      <LiquidGlass className="p-3 space-y-1" rounded="1rem">
        <button
          onClick={onReset}
          className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-mono transition-all hover:opacity-80"
          style={{ color: 'var(--fg-2)' }}
          onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--surface-2)')}
          onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
        >
          <RotateCcw size={12} />Reset
        </button>
        <button disabled className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-mono opacity-30 cursor-not-allowed" style={{ color: 'var(--fg-3)' }}>
          <UserPlus size={12} />Enroll Voiceprint
        </button>
        <button
          onClick={onDisconnect}
          className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-mono transition-all hover:opacity-80"
          style={{ color: '#EF4444' }}
          onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(239,68,68,0.08)')}
          onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
        >
          <Power size={12} />Disconnect
        </button>
        <div className="pt-2 border-t text-center text-xs font-mono" style={{ borderColor: 'var(--border)', color: 'var(--fg-3)', opacity: 0.5 }}>
          Zero data retention
        </div>
      </LiquidGlass>
    </div>
  );
}
