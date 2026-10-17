import { motion, useSpring, useTransform } from 'framer-motion';
import { useEffect } from 'react';
import type { RiskLevel } from '../types/websocket';

interface Props {
  score: number;   // 0–100
  level: RiskLevel;
  pending: boolean;
}

const LEVEL_CFG: Record<RiskLevel, { color: string; label: string }> = {
  ALLOW:          { color: 'var(--allow)',     label: 'ALLOW'          },
  CHALLENGE:      { color: 'var(--challenge)', label: 'CHALLENGE'      },
  BLOCK:          { color: 'var(--block)',     label: 'BLOCK'          },
  LOW_CONFIDENCE: { color: 'var(--fg-3)',      label: 'LOW CONFIDENCE' },
};

const SIZE = 240;
const SW = 12;
const R = (SIZE - SW) / 2;
const CIRC = 2 * Math.PI * R;
const ARC = CIRC * 0.75;

export default function RiskGauge({ score, level, pending }: Props) {
  const cfg = LEVEL_CFG[level];
  const spring = useSpring(score, { stiffness: 65, damping: 17 });
  useEffect(() => { spring.set(score); }, [score, spring]);
  const dashOffset = useTransform(spring, (v) => ARC - (v / 100) * ARC);

  const cx = SIZE / 2, cy = SIZE / 2;

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="relative" style={{ width: SIZE, height: SIZE }}>
        <svg width={SIZE} height={SIZE} style={{ transform: 'rotate(135deg)' }}>
          <circle cx={cx} cy={cy} r={R} fill="none"
            stroke="rgba(128,128,128,0.08)" strokeWidth={SW}
            strokeDasharray={`${ARC} ${CIRC - ARC}`} strokeLinecap="round"
          />
          <motion.circle cx={cx} cy={cy} r={R} fill="none"
            stroke={cfg.color} strokeWidth={SW}
            strokeDasharray={`${ARC} ${CIRC - ARC}`}
            strokeDashoffset={dashOffset}
            strokeLinecap="round"
            style={{ transition: 'stroke 0.45s ease' }}
          />
        </svg>

        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <motion.div
            className="text-5xl font-bold font-mono tabular-nums"
            style={{ color: cfg.color }}
            animate={{ opacity: 1 }}
          >
            {Math.round(score)}
          </motion.div>
          <div className="text-xs font-mono mt-0.5 uppercase tracking-widest" style={{ color: 'var(--fg-3)' }}>
            risk score
          </div>
          {pending && (
            <div className="text-xs font-mono mt-1 animate-pulse" style={{ color: 'var(--challenge)' }}>
              computing…
            </div>
          )}
        </div>
      </div>

      {/* Level badge */}
      <motion.div
        key={level}
        initial={{ opacity: 0, y: 4 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 220, damping: 22 }}
        className="flex items-center gap-2 px-4 py-1.5 rounded-full font-mono font-semibold text-xs tracking-widest"
        style={{
          background: 'var(--surface-3)',
          border: `1px solid var(--border-2)`,
          color: cfg.color,
        }}
      >
        <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: cfg.color }} />
        {cfg.label}
      </motion.div>
    </div>
  );
}
