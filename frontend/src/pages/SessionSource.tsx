import { motion, AnimatePresence } from 'framer-motion';
import { Shield, AlertCircle, Loader2, Wifi, Upload, FileAudio, CheckCircle2, Mic } from 'lucide-react';
import { useState, useRef } from 'react';
import LiquidGlass from '../components/LiquidGlass';
import type { Scenario } from '../hooks/useDemoSession';
import type { ConnectionStatus } from '../types/websocket';

interface Props {
  dark: boolean;
  onStartDemo: (scenario: Scenario) => void;
  onStartLive: (url: string, token: string) => void;
  onStartLiveFile?: (file: File, url: string, token: string) => void;
  liveStatus: ConnectionStatus;
  isStreaming?: boolean;
  streamProgress?: { current: number; total: number };
}

const SCENARIOS: { id: Scenario; label: string; color: string; desc: string }[] = [
  {
    id: 'clean',
    label: 'Clean call',
    color: 'var(--allow)',
    desc: 'Risk stays ALLOW (~0.08–0.22). No challenge, no sever.',
  },
  {
    id: 'suspicious',
    label: 'Suspicious',
    color: 'var(--challenge)',
    desc: 'Risk climbs to CHALLENGE. One liveness prompt. If spoken, drops back to ALLOW.',
  },
  {
    id: 'clone',
    label: 'Confirmed clone',
    color: 'var(--block)',
    desc: 'Risk climbs to BLOCK. After enough strides, SEVER_SESSION fires.',
  },
];

function getDefaultWsUrl(): string {
  if (typeof window !== 'undefined' && window.location) {
    const isSecure = window.location.protocol === 'https:';
    const host = window.location.hostname || '127.0.0.1';
    return `${isSecure ? 'wss:' : 'ws:'}//${host}:8000/ws/stream`;
  }
  return 'ws://127.0.0.1:8000/ws/stream';
}

export default function SessionSource({
  dark,
  onStartDemo,
  onStartLive,
  onStartLiveFile,
  liveStatus,
  isStreaming,
  streamProgress,
}: Props) {
  const [mode, setMode] = useState<'demo' | 'live'>('demo');
  const [scenario, setScenario] = useState<Scenario>('clone');
  const [wsUrl, setWsUrl] = useState(getDefaultWsUrl);
  const [wsToken, setWsToken] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [started, setStarted] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isConnecting = liveStatus === 'connecting';
  const isError = liveStatus === 'error';
  const isAuthFailed = liveStatus === 'auth_failed';
  const isSevered = liveStatus === 'severed';

  function handleStart() {
    setStarted(true);
    if (mode === 'demo') {
      onStartDemo(scenario);
    } else {
      if (selectedFile && onStartLiveFile) {
        onStartLiveFile(selectedFile, wsUrl, wsToken);
      } else {
        onStartLive(wsUrl, wsToken);
      }
    }
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
    }
  }

  const STATUS_LABEL: Record<ConnectionStatus, string> = {
    disconnected: 'disconnected',
    connecting: 'connecting…',
    connected: 'connected',
    error: 'connection failed',
    severed: 'session severed (code 1008)',
    auth_failed: 'authentication failed (code 4401)',
  };

  const STATUS_COLOR: Record<ConnectionStatus, string> = {
    disconnected: 'var(--fg-3)',
    connecting: 'var(--challenge)',
    connected: 'var(--allow)',
    error: 'var(--block)',
    severed: 'var(--block)',
    auth_failed: 'var(--block)',
  };

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-6 py-24 relative"
      style={{ zIndex: 1 }}
    >
      {/* Grid overlay */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: `
            linear-gradient(var(--border) 1px, transparent 1px),
            linear-gradient(90deg, var(--border) 1px, transparent 1px)
          `,
          backgroundSize: '48px 48px',
          opacity: 0.6,
        }}
      />

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 200, damping: 24 }}
        className="w-full max-w-md relative z-10"
      >
        {/* Header */}
        <div className="flex flex-col items-center mb-8">
          <div
            className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4"
            style={{ background: 'var(--surface-2)', border: '1px solid var(--border-2)' }}
          >
            <Shield size={26} style={{ color: 'var(--fg)' }} />
          </div>
          <h1 className="text-2xl font-bold tracking-tight mb-1" style={{ color: 'var(--fg)' }}>
            Start a risk session
          </h1>
          <p className="text-sm text-center" style={{ color: 'var(--fg-3)' }}>
            Choose your VoiceGuard IBM Z audio risk source
          </p>
        </div>

        <LiquidGlass className="p-6" rounded="1.25rem" strong>
          {/* Demo / Live toggle */}
          <div className="mb-6">
            <div
              className="flex rounded-xl p-0.5"
              style={{ background: 'var(--surface-3)' }}
            >
              {(['demo', 'live'] as const).map((m) => (
                <button
                  key={m}
                  onClick={() => setMode(m)}
                  className="flex-1 py-2 rounded-[10px] text-sm font-mono font-medium transition-all duration-200"
                  style={{
                    background: mode === m ? 'var(--surface-2)' : 'transparent',
                    color: mode === m ? 'var(--fg)' : 'var(--fg-3)',
                    boxShadow: mode === m ? '0 1px 4px rgba(0,0,0,0.3)' : 'none',
                  }}
                >
                  {m === 'demo' ? 'Demo' : 'Live Gateway'}
                </button>
              ))}
            </div>
          </div>

          <AnimatePresence mode="wait">
            {mode === 'demo' ? (
              <motion.div
                key="demo"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                transition={{ duration: 0.18 }}
                className="space-y-3"
              >
                <div className="text-xs font-mono uppercase tracking-widest mb-3" style={{ color: 'var(--fg-3)' }}>
                  Scenario
                </div>
                {SCENARIOS.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => setScenario(s.id)}
                    className="w-full flex items-start gap-3 p-3.5 rounded-xl text-left transition-all duration-150"
                    style={{
                      background: scenario === s.id ? 'var(--surface-3)' : 'transparent',
                      border: `1px solid ${scenario === s.id ? 'var(--border-2)' : 'var(--border)'}`,
                    }}
                    onMouseEnter={(e) => {
                      if (scenario !== s.id) e.currentTarget.style.background = 'var(--surface-2)';
                    }}
                    onMouseLeave={(e) => {
                      if (scenario !== s.id) e.currentTarget.style.background = 'transparent';
                    }}
                  >
                    <span
                      className="w-2 h-2 rounded-full shrink-0 mt-1"
                      style={{ background: s.color, boxShadow: `0 0 6px ${s.color}` }}
                    />
                    <div>
                      <div className="text-sm font-medium mb-0.5" style={{ color: 'var(--fg)' }}>
                        {s.label}
                        {s.id === 'clone' && (
                          <span className="ml-2 text-xs font-mono" style={{ color: 'var(--fg-3)' }}>(default)</span>
                        )}
                      </div>
                      <div className="text-xs leading-relaxed" style={{ color: 'var(--fg-3)' }}>{s.desc}</div>
                    </div>
                  </button>
                ))}
              </motion.div>
            ) : (
              <motion.div
                key="live"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.18 }}
                className="space-y-4"
              >
                <div>
                  <label className="block text-xs font-mono uppercase tracking-widest mb-2" style={{ color: 'var(--fg-3)' }}>
                    WebSocket URL
                  </label>
                  <input
                    type="text"
                    value={wsUrl}
                    onChange={(e) => setWsUrl(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl text-sm font-mono outline-none transition-all"
                    style={{
                      background: 'var(--surface-3)',
                      border: '1px solid var(--border-2)',
                      color: 'var(--fg)',
                    }}
                    onFocus={(e) => (e.currentTarget.style.borderColor = 'var(--fg-2)')}
                    onBlur={(e) => (e.currentTarget.style.borderColor = 'var(--border-2)')}
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono uppercase tracking-widest mb-2" style={{ color: 'var(--fg-3)' }}>
                    JWT Token <span className="normal-case" style={{ color: 'var(--fg-4)' }}>(Bearer)</span>
                  </label>
                  <input
                    type="password"
                    value={wsToken}
                    onChange={(e) => setWsToken(e.target.value)}
                    placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9…"
                    className="w-full px-3.5 py-2.5 rounded-xl text-sm font-mono outline-none transition-all"
                    style={{
                      background: 'var(--surface-3)',
                      border: '1px solid var(--border-2)',
                      color: 'var(--fg)',
                    }}
                    onFocus={(e) => (e.currentTarget.style.borderColor = 'var(--fg-2)')}
                    onBlur={(e) => (e.currentTarget.style.borderColor = 'var(--border-2)')}
                  />
                </div>

                {/* Upload audio and stream in Live Mode */}
                <div>
                  <label className="block text-xs font-mono uppercase tracking-widest mb-2" style={{ color: 'var(--fg-3)' }}>
                    Upload Audio & Stream (WAV / MP3)
                  </label>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".wav,.mp3,audio/*"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full p-3.5 rounded-xl border border-dashed cursor-pointer transition-all flex items-center justify-between gap-3"
                    style={{
                      background: selectedFile ? 'rgba(34,197,94,0.06)' : 'var(--surface-3)',
                      borderColor: selectedFile ? 'var(--allow)' : 'var(--border-2)',
                    }}
                  >
                    <div className="flex items-center gap-2.5 overflow-hidden">
                      {selectedFile ? (
                        <FileAudio size={18} className="shrink-0" style={{ color: 'var(--allow)' }} />
                      ) : (
                        <Upload size={18} className="shrink-0" style={{ color: 'var(--fg-3)' }} />
                      )}
                      <div className="text-left overflow-hidden">
                        <div className="text-xs font-mono truncate" style={{ color: 'var(--fg)' }}>
                          {selectedFile ? selectedFile.name : 'Choose audio file to stream…'}
                        </div>
                        <div className="text-[10px] font-mono" style={{ color: 'var(--fg-3)' }}>
                          {selectedFile
                            ? `${(selectedFile.size / 1024).toFixed(1)} KB · 16 kHz resampled`
                            : 'WAV or MP3 · 250ms chunks'}
                        </div>
                      </div>
                    </div>
                    {selectedFile ? (
                      <CheckCircle2 size={16} className="shrink-0" style={{ color: 'var(--allow)' }} />
                    ) : (
                      <span className="text-[11px] font-mono px-2 py-0.5 rounded border" style={{ borderColor: 'var(--border-2)', color: 'var(--fg-3)' }}>
                        Browse
                      </span>
                    )}
                  </div>
                </div>

                {isAuthFailed && (
                  <div className="flex items-start gap-2 text-xs font-mono p-3 rounded-lg" style={{ background: 'rgba(239,68,68,0.08)', color: 'var(--block)' }}>
                    <AlertCircle size={13} className="shrink-0 mt-0.5" />
                    Authentication failed (code 4401). Please supply a valid JWT token.
                  </div>
                )}

                {isSevered && (
                  <div className="flex items-start gap-2 text-xs font-mono p-3 rounded-lg" style={{ background: 'rgba(239,68,68,0.08)', color: 'var(--block)' }}>
                    <AlertCircle size={13} className="shrink-0 mt-0.5" />
                    Session severed by VoiceGuard Gateway (code 1008: Policy Violation).
                  </div>
                )}

                {isError && (
                  <div className="flex items-start gap-2 text-xs font-mono p-3 rounded-lg" style={{ background: 'rgba(239,68,68,0.08)', color: 'var(--block)' }}>
                    <AlertCircle size={13} className="shrink-0 mt-0.5" />
                    Connection failed. Verify gateway is running on {wsUrl}.
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Primary action */}
          <div className="mt-6 space-y-3">
            <button
              onClick={handleStart}
              disabled={isConnecting}
              className={`w-full py-3 rounded-xl font-mono font-semibold text-sm transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:scale-100 flex items-center justify-center gap-2${started ? ' session-active-border' : ''}`}
              style={{
                background: 'var(--fg)',
                color: 'var(--bg)',
              }}
            >
              {isConnecting ? (
                <>
                  <Loader2 size={14} className="animate-spin" />
                  Connecting…
                </>
              ) : (
                <>
                  {mode === 'live' && <Wifi size={14} />}
                  {mode === 'live' && selectedFile ? 'Stream Audio to Gateway' : 'Start risk session'}
                </>
              )}
            </button>

            {/* Radio indicator + status */}
            <div className="flex items-center justify-center gap-2">
              <div className="relative flex items-center justify-center w-3 h-3">
                <span
                  className="w-2 h-2 rounded-full block"
                  style={{ background: STATUS_COLOR[liveStatus] }}
                />
                {liveStatus === 'connecting' && (
                  <span
                    className="absolute inset-0 rounded-full"
                    style={{
                      background: STATUS_COLOR[liveStatus],
                      animation: 'radio-ping 1s ease-out infinite',
                    }}
                  />
                )}
              </div>
              <span className="text-xs font-mono" style={{ color: STATUS_COLOR[liveStatus] }}>
                {STATUS_LABEL[liveStatus]}
              </span>
            </div>
          </div>
        </LiquidGlass>

        <p className="text-center text-xs font-mono mt-6" style={{ color: 'var(--fg-4)' }}>
          IBM LinuxONE (s390x) Security · RAM-only In-Memory Processing
        </p>
      </motion.div>
    </div>
  );
}
