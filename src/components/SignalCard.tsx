import { motion } from 'framer-motion';

interface Props {
  label: string;
  value: number;   // 0–1, higher = more risk
  subLabel?: string;
  subValue?: string;
  icon: React.ReactNode;
  index: number;
}

function riskColor(v: number) {
  if (v < 0.35) return 'var(--allow)';
  if (v < 0.70) return 'var(--challenge)';
  return 'var(--block)';
}

export default function SignalCard({ label, value, subLabel, subValue, icon, index }: Props) {
  const color = riskColor(value);
  const pct = Math.round(value * 100);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.06, type: 'spring', stiffness: 220, damping: 22 }}
      className="liquid-glass flex gap-3 items-center px-4 py-3"
      style={{ borderRadius: '0.875rem' }}
    >
      {/* Icon */}
      <div style={{ color: 'var(--fg-3)', flexShrink: 0 }}>{icon}</div>

      {/* Label + bar */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-xs font-mono uppercase tracking-widest" style={{ color: 'var(--fg-3)' }}>
            {label}
          </span>
          <span className="text-xs font-mono tabular-nums font-semibold" style={{ color }}>{pct}%</span>
        </div>
        <div className="h-1 rounded-full overflow-hidden" style={{ background: 'var(--surface-3)' }}>
          <motion.div
            className="h-full rounded-full"
            style={{ background: color }}
            animate={{ width: `${pct}%` }}
            transition={{ type: 'spring', stiffness: 70, damping: 18 }}
          />
        </div>
      </div>

      {/* Sub value */}
      {subLabel && subValue && (
        <div className="text-right shrink-0 ml-2">
          <div className="text-xs font-mono" style={{ color: 'var(--fg-3)' }}>{subLabel}</div>
          <div className="text-sm font-mono tabular-nums font-semibold" style={{ color: 'var(--fg-2)' }}>{subValue}</div>
        </div>
      )}
    </motion.div>
  );
}
