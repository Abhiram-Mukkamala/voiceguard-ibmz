import { motion, AnimatePresence } from 'framer-motion';
import { Shield, Eye, EyeOff, ArrowLeft, Zap, Lock, Globe } from 'lucide-react';
import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import LiquidGlass from '../components/LiquidGlass';

interface Props {
  dark: boolean;
  onLogin: (email: string) => void;
}

// Demo credentials — shown openly on the left panel per spec
const DEMO_EMAIL = 'analyst@voiceguard.io';
const DEMO_PASS  = 'scamengers';

const QUOTES = [
  {
    text: '"VoiceGuard blocked a $2.3M wire transfer fraud attempt in real time. The attacker had a perfect voice clone."',
    author: 'CISO, Tier-1 European Bank',
    initials: 'KB',
  },
  {
    text: '"We went from a 3-day manual review process to 250ms automated detection. Game changing."',
    author: 'Head of Fraud, Fintech Scale-up',
    initials: 'MR',
  },
  {
    text: '"The liveness challenge alone eliminated 94% of our synthetic voice incidents."',
    author: 'VP Security, US Credit Union',
    initials: 'AJ',
  },
];

export default function Auth({ dark, onLogin }: Props) {
  const [params] = useSearchParams();
  const [tab, setTab] = useState<'login' | 'signup'>(params.get('tab') === 'signup' ? 'signup' : 'login');
  const [email, setEmail] = useState('');
  const [pass, setPass] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [quoteIdx, setQuoteIdx] = useState(0);
  const navigate = useNavigate();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    setTimeout(() => {
      if (email === DEMO_EMAIL && pass === DEMO_PASS) {
        onLogin(email);
        navigate('/dashboard');
      } else if (tab === 'signup' && email && pass.length >= 6) {
        onLogin(email);
        navigate('/dashboard');
      } else if (tab === 'login' && email && pass.length >= 6) {
        onLogin(email);
        navigate('/dashboard');
      } else {
        setError(
          tab === 'login'
            ? `Demo: ${DEMO_EMAIL} / ${DEMO_PASS}`
            : 'Enter a valid email and a password of at least 6 characters.'
        );
      }
      setLoading(false);
    }, 700);
  }

  function fillDemo() {
    setEmail(DEMO_EMAIL);
    setPass(DEMO_PASS);
    setTab('login');
    setError('');
  }

  const quote = QUOTES[quoteIdx];

  return (
    <div className="min-h-screen flex" style={{ background: 'var(--bg)' }}>
      {/* ─── Left panel: product story + demo creds ─── */}
      <div
        className="hidden lg:flex flex-col justify-between p-12 w-[52%] relative overflow-hidden"
        style={{ background: dark ? '#0D0D0D' : '#EDE9DF' }}
      >
        {/* Subtle grid */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage: `
              linear-gradient(var(--border) 1px, transparent 1px),
              linear-gradient(90deg, var(--border) 1px, transparent 1px)
            `,
            backgroundSize: '40px 40px',
          }}
        />

        {/* Logo */}
        <Link to="/" className="flex items-center gap-2.5 relative z-10">
          <Shield size={20} style={{ color: 'var(--fg)' }} />
          <span className="font-bold text-lg tracking-tight" style={{ color: 'var(--fg)' }}>
            Voice<span style={{ opacity: 0.5 }}>Guard</span>
          </span>
        </Link>

        {/* Center */}
        <div className="relative z-10 my-auto space-y-8">
          <div>
            <div className="text-xs font-mono uppercase tracking-widest mb-4" style={{ color: 'var(--fg-3)' }}>
              Operator console
            </div>
            <h2 className="text-4xl font-bold leading-tight mb-4" style={{ color: 'var(--fg)' }}>
              Real-time defence against AI voice fraud.
            </h2>
          </div>

          {/* Demo credentials — shown in the open per spec */}
          <LiquidGlass className="p-5" rounded="1rem">
            <div className="text-xs font-mono uppercase tracking-widest mb-3" style={{ color: 'var(--fg-3)' }}>
              Demo credentials
            </div>
            <div className="space-y-2 font-mono text-sm">
              <div className="flex items-center justify-between">
                <span style={{ color: 'var(--fg-3)' }}>Email</span>
                <span style={{ color: 'var(--fg)' }}>{DEMO_EMAIL}</span>
              </div>
              <div className="flex items-center justify-between">
                <span style={{ color: 'var(--fg-3)' }}>Password</span>
                <span style={{ color: 'var(--fg)' }}>{DEMO_PASS}</span>
              </div>
            </div>
            <button
              onClick={fillDemo}
              className="mt-3 w-full text-xs font-mono py-2 rounded-lg transition-all hover:opacity-80"
              style={{
                background: 'var(--surface-3)',
                color: 'var(--fg-2)',
                border: '1px solid var(--border-2)',
              }}
            >
              Fill form →
            </button>
          </LiquidGlass>

          {/* Live metrics */}
          <div className="grid grid-cols-3 gap-2">
            {[
              { icon: Zap, label: '<250ms', sub: 'detection' },
              { icon: Lock, label: '99.2%', sub: 'accuracy' },
              { icon: Globe, label: '14K+', sub: 'blocked' },
            ].map((m) => (
              <LiquidGlass key={m.label} className="p-3 text-center" rounded="0.75rem">
                <m.icon size={13} style={{ color: 'var(--fg-3)', margin: '0 auto 4px' }} />
                <div className="text-base font-bold font-mono" style={{ color: 'var(--fg)' }}>{m.label}</div>
                <div className="text-xs font-mono" style={{ color: 'var(--fg-3)' }}>{m.sub}</div>
              </LiquidGlass>
            ))}
          </div>

          {/* Testimonial */}
          <div
            className="rounded-xl p-4"
            style={{
              background: dark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.03)',
              border: '1px solid var(--border)',
            }}
          >
            <AnimatePresence mode="wait">
              <motion.div
                key={quoteIdx}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.25 }}
              >
                <p className="text-sm leading-relaxed mb-3" style={{ color: 'var(--fg-2)' }}>{quote.text}</p>
                <div className="flex items-center gap-2">
                  <div
                    className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-mono font-bold"
                    style={{ background: 'var(--surface-2)', color: 'var(--fg)', border: '1px solid var(--border-2)' }}
                  >
                    {quote.initials}
                  </div>
                  <span className="text-xs font-mono" style={{ color: 'var(--fg-3)' }}>{quote.author}</span>
                </div>
              </motion.div>
            </AnimatePresence>
            <div className="flex gap-1.5 mt-3">
              {QUOTES.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setQuoteIdx(i)}
                  className="w-5 h-0.5 rounded-full transition-all"
                  style={{ background: i === quoteIdx ? 'var(--fg-2)' : 'var(--border-2)' }}
                />
              ))}
            </div>
          </div>
        </div>

        <div className="relative z-10 text-xs font-mono" style={{ color: 'var(--fg-3)' }}>
          Zero data retention · RAM-only processing
        </div>
      </div>

      {/* ─── Right panel: form ─── */}
      <div className="flex-1 flex flex-col items-center justify-center p-8">
        {/* Mobile logo */}
        <div className="lg:hidden mb-8 flex items-center gap-2">
          <Shield size={18} style={{ color: 'var(--fg)' }} />
          <span className="font-bold" style={{ color: 'var(--fg)' }}>VoiceGuard</span>
        </div>

        <div className="w-full max-w-sm">
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 text-xs font-mono mb-8 transition-opacity hover:opacity-60"
            style={{ color: 'var(--fg-3)' }}
          >
            <ArrowLeft size={11} />
            Back to site
          </Link>

          {/* Tab switch */}
          <div className="flex rounded-xl p-0.5 mb-8" style={{ background: 'var(--surface)' }}>
            {(['login', 'signup'] as const).map((t) => (
              <button
                key={t}
                onClick={() => { setTab(t); setError(''); }}
                className="flex-1 py-2 rounded-[10px] text-sm font-medium transition-all duration-200"
                style={{
                  background: tab === t ? 'var(--surface-2)' : 'transparent',
                  color: tab === t ? 'var(--fg)' : 'var(--fg-3)',
                  boxShadow: tab === t ? '0 1px 4px rgba(0,0,0,0.2)' : 'none',
                }}
              >
                {t === 'login' ? 'Sign in' : 'Sign up'}
              </button>
            ))}
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={tab}
              initial={{ opacity: 0, x: tab === 'login' ? -10 : 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.18 }}
            >
              <div className="mb-6">
                <h1 className="text-2xl font-bold mb-1" style={{ color: 'var(--fg)' }}>
                  {tab === 'login' ? 'Welcome back' : 'Create account'}
                </h1>
                <p className="text-sm" style={{ color: 'var(--fg-3)' }}>
                  {tab === 'login' ? 'Sign in to your analyst console' : 'Start protecting your call center'}
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                {tab === 'signup' && (
                  <div>
                    <label className="block text-xs font-mono mb-1.5 uppercase tracking-widest" style={{ color: 'var(--fg-3)' }}>Name</label>
                    <input
                      type="text"
                      placeholder="Jane Smith"
                      className="w-full px-4 py-3 rounded-xl text-sm outline-none transition-all"
                      style={{ background: 'var(--surface)', border: '1px solid var(--border-2)', color: 'var(--fg)' }}
                      onFocus={(e) => (e.currentTarget.style.borderColor = 'var(--fg-2)')}
                      onBlur={(e) => (e.currentTarget.style.borderColor = 'var(--border-2)')}
                    />
                  </div>
                )}
                <div>
                  <label className="block text-xs font-mono mb-1.5 uppercase tracking-widest" style={{ color: 'var(--fg-3)' }}>Email</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder={tab === 'login' ? DEMO_EMAIL : 'you@company.com'}
                    required
                    className="w-full px-4 py-3 rounded-xl text-sm font-mono outline-none transition-all"
                    style={{ background: 'var(--surface)', border: '1px solid var(--border-2)', color: 'var(--fg)' }}
                    onFocus={(e) => (e.currentTarget.style.borderColor = 'var(--fg-2)')}
                    onBlur={(e) => (e.currentTarget.style.borderColor = 'var(--border-2)')}
                  />
                </div>
                <div>
                  <label className="block text-xs font-mono mb-1.5 uppercase tracking-widest" style={{ color: 'var(--fg-3)' }}>Password</label>
                  <div className="relative">
                    <input
                      type={showPass ? 'text' : 'password'}
                      value={pass}
                      onChange={(e) => setPass(e.target.value)}
                      placeholder="••••••••"
                      required
                      className="w-full px-4 py-3 rounded-xl text-sm font-mono outline-none transition-all pr-10"
                      style={{ background: 'var(--surface)', border: '1px solid var(--border-2)', color: 'var(--fg)' }}
                      onFocus={(e) => (e.currentTarget.style.borderColor = 'var(--fg-2)')}
                      onBlur={(e) => (e.currentTarget.style.borderColor = 'var(--border-2)')}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPass((s) => !s)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 transition-opacity hover:opacity-60"
                      style={{ color: 'var(--fg-3)' }}
                    >
                      {showPass ? <EyeOff size={14} /> : <Eye size={14} />}
                    </button>
                  </div>
                </div>

                {error && (
                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-xs font-mono"
                    style={{ color: 'var(--block)' }}
                  >
                    {error}
                  </motion.p>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 rounded-xl font-mono font-semibold text-sm transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-60 disabled:scale-100 flex items-center justify-center gap-2"
                  style={{ background: 'var(--fg)', color: 'var(--bg)' }}
                >
                  {loading ? (
                    <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                  ) : tab === 'login' ? 'Sign in' : 'Create account'}
                </button>
              </form>

              {tab === 'login' && (
                <p className="mt-4 text-center text-xs font-mono" style={{ color: 'var(--fg-3)' }}>
                  Demo:{' '}
                  <button onClick={fillDemo} className="underline underline-offset-2 hover:opacity-70 transition-opacity" style={{ color: 'var(--fg-2)' }}>
                    fill credentials
                  </button>
                </p>
              )}

              <div className="mt-8 pt-5 border-t text-center" style={{ borderColor: 'var(--border)' }}>
                <p className="text-xs" style={{ color: 'var(--fg-3)' }}>
                  {tab === 'login' ? "No account? " : 'Have an account? '}
                  <button
                    onClick={() => { setTab(tab === 'login' ? 'signup' : 'login'); setError(''); }}
                    className="underline underline-offset-2 hover:opacity-70"
                    style={{ color: 'var(--fg-2)' }}
                  >
                    {tab === 'login' ? 'Sign up free' : 'Sign in'}
                  </button>
                </p>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
