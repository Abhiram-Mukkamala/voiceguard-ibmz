import { AnimatePresence, motion } from 'framer-motion';
import type { TelemetryEntry, RiskLevel } from '../types/websocket';

interface Props {
  entries: TelemetryEntry[];
}

const LEVEL_COLORS: Record<RiskLevel, string> = {
  ALLOW: '#10B981',
  CHALLENGE: '#F59E0B',
  BLOCK: '#EF4444',
};

function fmt(d: Date) {
  return `${d.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })}.${String(d.getMilliseconds()).padStart(3, '0')}`;
}

export default function TelemetryFeed({ entries }: Props) {
  return (
    <div className="liquid-glass flex flex-col h-full overflow-hidden" style={{ borderRadius: '1rem' }}>
      <div
        className="px-4 py-2.5 flex items-center justify-between shrink-0 border-b"
        style={{ borderColor: 'var(--border)' }}
      >
        <span className="text-xs font-mono uppercase tracking-widest" style={{ color: 'var(--fg-3)' }}>Live Telemetry</span>
        <span className="text-xs font-mono" style={{ color: 'var(--fg-3)' }}>{entries.length} events</span>
      </div>
      <div className="overflow-y-auto flex-1 divide-y" style={{ borderColor: 'var(--border)' }}>
        {entries.length === 0 && (
          <div className="flex items-center justify-center h-24 text-sm font-mono" style={{ color: 'var(--fg-3)' }}>
            Awaiting events…
          </div>
        )}
        <AnimatePresence initial={false}>
          {entries.map((e) => (
            <motion.div
              key={e.id}
              initial={{ opacity: 0, y: -6, backgroundColor: 'rgba(34,211,238,0.05)' }}
              animate={{ opacity: 1, y: 0, backgroundColor: 'rgba(0,0,0,0)' }}
              transition={{ duration: 0.25 }}
              className="px-4 py-2 grid gap-2 hover:opacity-80 transition-opacity"
              style={{ gridTemplateColumns: 'auto 1fr auto auto auto', borderColor: 'var(--border)' }}
            >
              <span className="font-mono text-xs tabular-nums" style={{ color: 'var(--fg-3)' }}>{fmt(e.timestamp)}</span>
              <span
                className="text-xs font-mono font-semibold px-1.5 py-0.5 rounded-md self-center justify-self-start"
                style={{
                  color: LEVEL_COLORS[e.risk_level],
                  background: `${LEVEL_COLORS[e.risk_level]}15`,
                }}
              >
                {e.risk_level}
              </span>
              <span className="font-mono text-xs tabular-nums self-center" style={{ color: 'var(--fg-2)' }}>
                {(e.risk_score * 100).toFixed(1)}%
              </span>
              <span className="font-mono text-xs tabular-nums self-center" style={{ color: 'var(--fg-3)' }}>
                {e.processing_latency_ms.toFixed(0)}ms
              </span>
              <span
                className="font-mono text-xs tabular-nums self-center"
                style={{ color: e.packet_loss_ratio > 0.35 ? '#F59E0B' : 'var(--fg-3)' }}
              >
                PLR {(e.packet_loss_ratio * 100).toFixed(1)}%
              </span>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}
