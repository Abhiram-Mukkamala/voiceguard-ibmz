import { motion } from 'framer-motion';

interface Props {
  ema: number;       // composite_ema — smoothed
  raw: number;       // composite_raw — noisy
  history: number[]; // recent risk_score values for sparkline
}

function policyColor(v: number) {
  if (v < 0.35) return 'var(--allow)';
  if (v < 0.70) return 'var(--challenge)';
  return 'var(--block)';
}

function Sparkline({ values }: { values: number[] }) {
  if (values.length < 2) return null;
  const W = 120, H = 40;
  const max = Math.max(...values, 0.1);
  const min = 0;
  const pts = values.map((v, i) => {
    const x = (i / (values.length - 1)) * W;
    const y = H - ((v - min) / (max - min || 1)) * H;
    return `${x},${y}`;
  });
  const last = values[values.length - 1];
  const color = policyColor(last);

  return (
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} aria-label="Risk sparkline">
      {/* Fill */}
      <defs>
        <linearGradient id="spark-fill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.25" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <polyline
        points={[...pts, `${W},${H}`, `0,${H}`].join(' ')}
        fill="url(#spark-fill)"
        stroke="none"
      />
      {/* Line */}
      <polyline
        points={pts.join(' ')}
        fill="none"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity={0.85}
      />
      {/* Dot at latest */}
      <circle
        cx={W}
        cy={H - ((last - min) / (max - min || 1)) * H}
        r="2.5"
        fill={color}
      />
    </svg>
  );
}

export default function FusionTrace({ ema, raw, history }: Props) {
  return (
    <div className="flex flex-col gap-2.5 min-w-[140px]">
      <div className="text-xs font-mono uppercase tracking-widest" style={{ color: 'var(--fg-3)' }}>
        Fusion Trace
      </div>

      {/* EMA */}
      <div className="flex items-center justify-between gap-3">
        <span className="text-xs font-mono" style={{ color: 'var(--fg-3)' }}>EMA</span>
        <motion.span
          className="text-sm font-mono font-semibold tabular-nums"
          style={{ color: policyColor(ema) }}
          animate={{ opacity: 1 }}
          key={Math.round(ema * 100)}
        >
          {(ema * 100).toFixed(1)}%
        </motion.span>
      </div>

      {/* EMA bar */}
      <div className="h-1 rounded-full overflow-hidden" style={{ background: 'var(--surface-3)' }}>
        <motion.div
          className="h-full rounded-full"
          style={{ background: policyColor(ema) }}
          animate={{ width: `${ema * 100}%` }}
          transition={{ type: 'spring', stiffness: 60, damping: 18 }}
        />
      </div>

      {/* RAW */}
      <div className="flex items-center justify-between gap-3">
        <span className="text-xs font-mono" style={{ color: 'var(--fg-3)' }}>Raw</span>
        <span className="text-xs font-mono tabular-nums" style={{ color: 'var(--fg-2)' }}>
          {(raw * 100).toFixed(1)}%
        </span>
      </div>

      {/* Raw bar (thinner, dimmer) */}
      <div className="h-0.5 rounded-full overflow-hidden" style={{ background: 'var(--surface-3)' }}>
        <motion.div
          className="h-full rounded-full"
          style={{ background: policyColor(raw), opacity: 0.5 }}
          animate={{ width: `${raw * 100}%` }}
          transition={{ type: 'spring', stiffness: 120, damping: 20 }}
        />
      </div>

      {/* Sparkline */}
      <div className="pt-1">
        <Sparkline values={history} />
      </div>
    </div>
  );
}
