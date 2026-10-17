import { motion, AnimatePresence } from 'framer-motion';
import { Mic, CheckCircle } from 'lucide-react';
import { useEffect, useState } from 'react';
import LiquidGlass from './LiquidGlass';
import type { LivenessChallengeEvent } from '../types/websocket';

interface Props {
  challenge: LivenessChallengeEvent | null;
  onMarkSpoken: () => void;
}

export default function LivenessChallenge({ challenge, onMarkSpoken }: Props) {
  const [remaining, setRemaining] = useState(0);
  const [spoken, setSpoken] = useState(false);

  useEffect(() => {
    if (!challenge) { setSpoken(false); return; }
    setRemaining(challenge.expires_in_ms);
    setSpoken(false);
    const iv = setInterval(() => {
      setRemaining((r) => { if (r <= 100) { clearInterval(iv); return 0; } return r - 100; });
    }, 100);
    return () => clearInterval(iv);
  }, [challenge?.challenge_id]);

  const progress = challenge ? remaining / challenge.expires_in_ms : 0;

  function handleSpoken() {
    setSpoken(true);
    setTimeout(() => onMarkSpoken(), 600);
  }

  return (
    <AnimatePresence>
      {challenge && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          transition={{ type: 'spring', stiffness: 260, damping: 26 }}
          className="overflow-hidden"
        >
          <LiquidGlass
            className="p-5"
            rounded="1rem"
            style={{ border: '1px solid rgba(245,158,11,0.22)' }}
          >
            <div className="flex items-center gap-2.5 mb-3">
              <div
                className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
                style={{ background: 'rgba(245,158,11,0.10)', border: '1px solid rgba(245,158,11,0.2)' }}
              >
                <Mic size={14} style={{ color: 'var(--challenge)' }} />
              </div>
              <div>
                <div className="text-xs font-mono uppercase tracking-widest" style={{ color: 'var(--challenge)' }}>
                  Liveness challenge
                </div>
                <div className="text-xs font-mono" style={{ color: 'var(--fg-3)' }}>
                  ID: {challenge.challenge_id}
                </div>
              </div>
            </div>

            <p className="text-lg font-semibold mb-4 leading-snug" style={{ color: 'var(--fg)' }}>
              {challenge.prompt_text}
            </p>

            {/* Countdown */}
            <div className="space-y-1.5 mb-4">
              <div className="flex justify-between text-xs font-mono">
                <span style={{ color: 'var(--fg-3)' }}>Time remaining</span>
                <span style={{ color: progress > 0.35 ? 'var(--challenge)' : 'var(--block)' }}>
                  {(remaining / 1000).toFixed(1)}s
                </span>
              </div>
              <div className="h-1 rounded-full overflow-hidden" style={{ background: 'var(--surface-3)' }}>
                <motion.div
                  className="h-full rounded-full"
                  style={{ background: progress > 0.35 ? 'var(--challenge)' : 'var(--block)' }}
                  animate={{ width: `${progress * 100}%` }}
                  transition={{ duration: 0.1, ease: 'linear' }}
                />
              </div>
            </div>

            {/* Waveform */}
            <div className="flex items-center gap-0.5 h-8 mb-4">
              {[...Array(18)].map((_, i) => (
                <motion.div
                  key={i}
                  className="flex-1 rounded-full"
                  style={{ background: 'var(--challenge)', opacity: 0.7 }}
                  animate={{ scaleY: spoken ? 0.2 : [0.2, 0.5 + Math.random() * 0.5, 0.2] }}
                  transition={{ duration: 0.3 + i * 0.04, repeat: Infinity, ease: 'easeInOut' }}
                />
              ))}
            </div>

            {/* Mark as spoken */}
            <AnimatePresence mode="wait">
              {!spoken ? (
                <motion.button
                  key="btn"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onClick={handleSpoken}
                  className="w-full py-2.5 rounded-xl font-mono text-sm font-semibold transition-all hover:scale-[1.02] active:scale-[0.98]"
                  style={{
                    background: 'rgba(245,158,11,0.12)',
                    border: '1px solid rgba(245,158,11,0.25)',
                    color: 'var(--challenge)',
                  }}
                >
                  Mark as spoken
                </motion.button>
              ) : (
                <motion.div
                  key="ok"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="flex items-center justify-center gap-2 py-2 text-sm font-mono"
                  style={{ color: 'var(--allow)' }}
                >
                  <CheckCircle size={15} />
                  Liveness passed — risk receding
                </motion.div>
              )}
            </AnimatePresence>
          </LiquidGlass>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
