import { motion, AnimatePresence } from 'framer-motion';
import { ShieldX, X } from 'lucide-react';
import type { EnforcementActionEvent } from '../types/websocket';

interface Props {
  event: EnforcementActionEvent | null;
  onDismiss: () => void;
}

export default function EnforcementBanner({ event, onDismiss }: Props) {
  return (
    <AnimatePresence>
      {event && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-6"
          style={{ background: 'rgba(0,0,0,0.88)', backdropFilter: 'blur(10px)' }}
        >
          <motion.div
            initial={{ scale: 0.88, y: 24 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.88, y: 24 }}
            transition={{ type: 'spring', stiffness: 300, damping: 22 }}
            className="shake pulse-ring relative w-full max-w-md rounded-3xl p-8 text-center"
            style={{
              background: 'linear-gradient(135deg,rgba(239,68,68,0.12),rgba(10,10,11,0.97))',
              border: '2px solid rgba(239,68,68,0.55)',
            }}
          >
            <button
              onClick={onDismiss}
              className="absolute top-4 right-4 p-2 rounded-lg transition-colors hover:bg-white/5"
              style={{ color: '#FCA5A5' }}
            >
              <X size={16} />
            </button>

            <motion.div
              animate={{ scale: [1, 1.06, 1] }}
              transition={{ duration: 1.4, repeat: Infinity }}
              className="w-18 h-18 rounded-full mx-auto mb-5 flex items-center justify-center"
              style={{
                width: 72, height: 72,
                background: 'rgba(239,68,68,0.15)',
                border: '2px solid rgba(239,68,68,0.45)',
              }}
            >
              <ShieldX size={32} style={{ color: '#EF4444' }} />
            </motion.div>

            <div className="text-xs font-mono uppercase tracking-widest mb-2" style={{ color: '#EF4444' }}>
              Enforcement Action
            </div>
            <h2 className="text-xl font-bold text-white mb-1">VOICE CLONING DETECTED</h2>
            <p className="font-mono text-sm mb-1" style={{ color: '#FCA5A5' }}>SESSION SEVERED</p>
            <p className="text-sm mb-6" style={{ color: '#8E8E99' }}>{event.reason}</p>

            <div className="flex gap-3 justify-center text-xs font-mono mb-5">
              <div className="px-3 py-1.5 rounded-lg" style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)' }}>
                <span style={{ color: '#8E8E99' }}>Risk </span>
                <span style={{ color: '#FCA5A5' }}>{(event.risk_score * 100).toFixed(1)}%</span>
              </div>
              <div className="px-3 py-1.5 rounded-lg" style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)' }}>
                <span style={{ color: '#8E8E99' }}>Action </span>
                <span style={{ color: '#FCA5A5' }}>{event.action}</span>
              </div>
            </div>

            <button
              onClick={onDismiss}
              className="px-6 py-2.5 rounded-xl font-mono text-sm font-medium transition-all hover:scale-105 active:scale-95"
              style={{ background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.35)', color: '#FCA5A5' }}
            >
              Acknowledge & Continue
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
