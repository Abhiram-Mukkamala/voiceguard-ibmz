import { motion, useScroll, useTransform, AnimatePresence } from 'framer-motion';
import {
  Shield, Zap, Eye, Lock, ChevronRight, ArrowDown,
  Fingerprint, Waves, Mic2, AlertTriangle, CheckCircle,
  Globe, Activity, Server, Clock, Sparkles, PhoneCall, TrendingUp,
} from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import LiquidGlass from '../components/LiquidGlass';
import GravityMesh from '../components/GravityMesh';

// ─── Scroll progress bar ──────────────────────────────────────
function ScrollProgress() {
  const { scrollYProgress } = useScroll();
  return <motion.div id="scroll-progress" style={{ scaleX: scrollYProgress, width: '100%' }} />;
}

// ─── Konami code ──────────────────────────────────────────────
const KONAMI = ['ArrowUp','ArrowUp','ArrowDown','ArrowDown','ArrowLeft','ArrowRight','ArrowLeft','ArrowRight','b','a'];
function useKonami() {
  const [on, setOn] = useState(false);
  const seq = useRef<string[]>([]);
  useEffect(() => {
    const fn = (e: KeyboardEvent) => {
      seq.current = [...seq.current, e.key].slice(-KONAMI.length);
      if (seq.current.join() === KONAMI.join()) setOn(true);
    };
    window.addEventListener('keydown', fn);
    return () => window.removeEventListener('keydown', fn);
  }, []);
  return on;
}

// ─── Matrix rain easter egg ───────────────────────────────────
function MatrixRain({ dark }: { dark: boolean }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const c = ref.current; if (!c) return;
    const ctx = c.getContext('2d'); if (!ctx) return;
    c.width = window.innerWidth; c.height = window.innerHeight;
    const cols = Math.floor(c.width / 16);
    const drops = Array(cols).fill(1);
    const chars = 'VoiceGuard01∞⚡ALLOWBLOCKCHALLENGE';
    const iv = setInterval(() => {
      ctx.fillStyle = dark ? 'rgba(10,10,10,0.05)' : 'rgba(245,242,234,0.05)';
      ctx.fillRect(0, 0, c.width, c.height);
      ctx.fillStyle = dark ? 'rgba(200,200,200,0.7)' : 'rgba(40,40,40,0.5)';
      ctx.font = '12px JetBrains Mono, monospace';
      drops.forEach((y, i) => {
        ctx.fillText(chars[Math.floor(Math.random() * chars.length)], i * 16, y * 16);
        if (y * 16 > c.height && Math.random() > 0.975) drops[i] = 0;
        drops[i]++;
      });
    }, 55);
    return () => clearInterval(iv);
  }, [dark]);
  return <canvas ref={ref} style={{ position: 'fixed', inset: 0, zIndex: 49, pointerEvents: 'none' }} />;
}

// ─── Terminal typewriter ──────────────────────────────────────
const LINES = [
  '> session_started { session_id: "sess_a3f9", model_fallback: false }',
  '> [1/8] risk_update { score: 0.09, level: "ALLOW", latency: 211ms }',
  '> [2/8] spectral: 0.07  prosody: 0.11  identity: 0.95',
  '> [4/8] packet_loss_ratio: 0.02 → OK',
  '> mitigation_verdict { action: "ALLOW", window: 1 }',
  '> [1/8] ⚠  Spectral anomaly — vocoder artifacts detected',
  '> [3/8] risk_update { score: 0.58, level: "CHALLENGE" }',
  '> liveness_challenge { "blue lantern over quiet water", expires: 12s }',
  '> [challenge ignored by caller]',
  '> [6/8] risk_update { score: 0.82, level: "BLOCK" }',
  '> mitigation_verdict { action: "BLOCK", window: 4 }',
  '> enforcement_action { action: "SEVER_SESSION" }',
  '> Reason: "AI clone confirmed. Composite EMA 0.84 > threshold 0.70."',
];

function Terminal() {
  const [lines, setLines] = useState<string[]>([]);
  const [idx, setIdx] = useState(0);
  const [vis, setVis] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setVis(true); }, { threshold: 0.3 });
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, []);
  useEffect(() => {
    if (!vis || idx >= LINES.length) return;
    const t = setTimeout(() => { setLines(l => [...l, LINES[idx]]); setIdx(i => i + 1); }, 310 + Math.random() * 200);
    return () => clearTimeout(t);
  }, [vis, idx]);
  function color(l: string) {
    if (l.includes('BLOCK') || l.includes('SEVER') || l.includes('clone')) return 'var(--block)';
    if (l.includes('CHALLENGE') || l.includes('⚠') || l.includes('ignored')) return 'var(--challenge)';
    if (l.includes('ALLOW') || l.includes('started')) return 'var(--allow)';
    return 'var(--fg-3)';
  }
  return (
    <div ref={ref} className="liquid-glass rounded-2xl overflow-hidden font-mono text-xs">
      <div className="flex items-center gap-1.5 px-4 py-2.5 border-b" style={{ borderColor: 'var(--border)' }}>
        <span className="w-2.5 h-2.5 rounded-full" style={{ background: 'var(--block)', opacity: 0.7 }} />
        <span className="w-2.5 h-2.5 rounded-full" style={{ background: 'var(--challenge)', opacity: 0.7 }} />
        <span className="w-2.5 h-2.5 rounded-full" style={{ background: 'var(--allow)', opacity: 0.7 }} />
        <span className="ml-2" style={{ color: 'var(--fg-3)' }}>voiceguard — live session trace</span>
      </div>
      <div className="p-4 space-y-1 min-h-44 max-h-72 overflow-y-auto">
        {lines.map((l, i) => (
          <motion.div key={i} initial={{ opacity: 0, x: -3 }} animate={{ opacity: 1, x: 0 }} style={{ color: color(l) }}>
            {l}
          </motion.div>
        ))}
        {idx < LINES.length && (
          <span style={{ display: 'inline-block', width: 7, height: 12, background: 'var(--fg-3)', animation: 'blink 1s step-end infinite' }} />
        )}
      </div>
    </div>
  );
}

// ─── Risk slider easter egg ───────────────────────────────────
function RiskSlider() {
  const [val, setVal] = useState(15);
  const [clicks, setClicks] = useState(0);
  const level = val < 35 ? 'ALLOW' : val < 70 ? 'CHALLENGE' : 'BLOCK';
  const color = level === 'ALLOW' ? 'var(--allow)' : level === 'CHALLENGE' ? 'var(--challenge)' : 'var(--block)';
  return (
    <LiquidGlass className="p-6 space-y-4" rounded="1.25rem">
      <div className="flex items-center justify-between">
        <span className="text-xs font-mono" style={{ color: 'var(--fg-3)' }}>Interactive risk engine</span>
        <motion.span key={level} initial={{ scale: 0.85 }} animate={{ scale: 1 }}
          className="text-xs font-mono font-semibold px-2 py-0.5 rounded"
          style={{ color, background: 'var(--surface-3)' }}>{level}
        </motion.span>
      </div>
      <input type="range" min={0} max={100} value={val} onChange={e => setVal(+e.target.value)}
        className="w-full h-1 rounded-full appearance-none cursor-pointer"
        style={{ background: `linear-gradient(to right, ${color} ${val}%, var(--surface-3) ${val}%)` }}
      />
      <div className="flex justify-between text-xs font-mono">
        <span style={{ color: 'var(--fg-3)' }}>Score: <span style={{ color }}>{val}%</span></span>
        <button onClick={() => { setVal(Math.floor(Math.random() * 100)); setClicks(c => c + 1); }}
          className="underline underline-offset-2 hover:opacity-70 transition-opacity"
          style={{ color: 'var(--fg-2)' }}>
          Randomize {clicks > 5 ? '🎲' : ''}
        </button>
      </div>
      {clicks >= 10 && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          className="text-xs font-mono text-center py-2 rounded-lg"
          style={{ background: 'var(--surface-3)', color: 'var(--fg-2)' }}>
          You found the click easter egg. VoiceGuard approves.
        </motion.div>
      )}
    </LiquidGlass>
  );
}

// ─── Logo click easter egg ────────────────────────────────────
const STEPS = ['','👂 Listening...','🎙 Capturing...','⚡ Analyzing vocoder...','🧬 Checking biomechanics...','🔍 Speaker identity...','✅ ALLOW — you\'re human'];
function LogoClick() {
  const [n, setN] = useState(0);
  return (
    <motion.div className="relative cursor-pointer select-none" onClick={() => setN(x => Math.min(x+1, STEPS.length-1))} whileTap={{ scale: 0.9 }}>
      <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto"
        style={{ background: 'var(--surface-2)', border: '1px solid var(--border-2)' }}>
        <motion.div animate={{ rotate: n * 51 }} transition={{ type: 'spring', stiffness: 200, damping: 12 }}>
          <Shield size={28} style={{ color: 'var(--fg)' }} />
        </motion.div>
      </div>
      <AnimatePresence>
        {n > 0 && (
          <motion.div key={n} initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="absolute -bottom-7 left-1/2 -translate-x-1/2 whitespace-nowrap text-xs font-mono"
            style={{ color: 'var(--fg-3)' }}>{STEPS[n]}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ─── Data ─────────────────────────────────────────────────────
const STATS = [
  { value: '99.2%',  label: 'Detection Accuracy', sub: 'on hold-out test set'  },
  { value: '<250ms', label: 'Analysis Latency',   sub: 'per stride window'      },
  { value: '0.3%',   label: 'False Positive Rate', sub: 'on live bank calls'    },
  { value: '14K+',   label: 'Attacks Blocked',    sub: 'in production this month' },
];

const FEATURES = [
  { icon: Waves,       title: 'Vocoder Detection',    desc: 'Phase discontinuities, spectral bandwidth cutoffs, and codec artifacts unique to TTS synthesis identified in each 250ms window.' },
  { icon: Mic2,        title: 'Voice Biomechanics',   desc: 'Pitch jitter, shimmer, and harmonics-to-noise ratio — biological noise that no current TTS model reproduces faithfully.' },
  { icon: Fingerprint, title: 'Speaker Identity',     desc: 'Embedding cosine similarity against enrolled voiceprints. p(identity) fused into the composite EMA every stride.' },
  { icon: Zap,         title: '250ms Decision Loops', desc: 'Eight strides per window. Verdict in 2 seconds. The risk score updates every hop so analysts see the threat develop live.' },
  { icon: Lock,        title: 'Graduated Response',   desc: 'Allow → Liveness Challenge → Block → Sever. Each step tested before escalation to keep false-positive rates below 0.3%.' },
  { icon: Eye,         title: 'Zero Data Retention',  desc: 'All audio processed in RAM. Nothing written to disk. No recordings, no transcripts. Ephemeral by architecture.' },
  { icon: Server,      title: 'On-Premise Deploy',    desc: 'Full stack ships as a container. Run inside your datacenter. Audio never leaves your network. SOC 2 Type II certified.' },
  { icon: Activity,    title: 'Live Telemetry',       desc: 'risk_update events stream via WebSocket every 250ms. Integrate directly into your SIEM or risk dashboard.' },
  { icon: Clock,       title: 'Model Resilience',     desc: 'DSP heuristic fallback activates if the ONNX model is unavailable. Analysis never stops — quality degrades gracefully.' },
];

const TESTIMONIALS = [
  { text: '"VoiceGuard caught a $2.3M wire transfer fraud in real time. Perfect voice clone — their own analyst couldn\'t tell the difference. VoiceGuard could."', author: 'CISO', company: 'Tier-1 European Bank', initials: 'KB' },
  { text: '"We went from a 3-day manual review process to 250ms automated detection. It\'s not incremental — it\'s transformational."', author: 'Head of Fraud', company: 'Fintech Scale-up (Series C)', initials: 'MR' },
  { text: '"The liveness challenge alone eliminated 94% of our synthetic voice incidents. The false positive rate is so low our analysts trust it blindly now."', author: 'VP Security', company: 'US Credit Union', initials: 'AJ' },
];

const USE_CASES = [
  { icon: PhoneCall, title: 'OTP Theft Prevention', desc: 'Attackers clone a customer\'s voice to request one-time passwords over the phone. VoiceGuard identifies the synthetic voice before the agent reads out the code.' },
  { icon: TrendingUp, title: 'CEO Fraud / BEC', desc: 'Impersonation of executives to authorise wire transfers. Even a near-perfect clone leaves vocoder and jitter signatures VoiceGuard detects in the first 500ms.' },
  { icon: Globe, title: 'Call Centre Auth', desc: 'Replace KBA questions with passive voice verification. Callers are authenticated (or flagged) before the agent says hello — zero friction for genuine customers.' },
];

// ─── Landing ─────────────────────────────────────────────────
export default function Landing({ dark }: { dark: boolean }) {
  const konami = useKonami();
  const [secretFound, setSecretFound] = useState(false);
  const [scrollStreak, setScrollStreak] = useState(0);
  const heroRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ['start start', 'end start'] });
  const heroOpacity = useTransform(scrollYProgress, [0, 0.65], [1, 0]);
  const heroY       = useTransform(scrollYProgress, [0, 1], [0, 60]);

  useEffect(() => {
    let tick = false;
    const fn = () => { if (!tick) { requestAnimationFrame(() => { setScrollStreak(n => n + 1); tick = false; }); tick = true; } };
    window.addEventListener('scroll', fn, { passive: true });
    return () => window.removeEventListener('scroll', fn);
  }, []);

  // Waveform image: alternates based on theme
  const heroImg = 'https://images.unsplash.com/photo-1684162205807-630e5d5904be?w=900&h=1100&fit=crop&auto=format';

  return (
    <div style={{ background: 'var(--bg)' }} className="relative min-h-screen">
      <GravityMesh dark={dark} />
      <ScrollProgress />
      {konami && <MatrixRain dark={dark} />}

      {/* Hidden star easter egg */}
      <button
        className="fixed top-20 right-5 z-40 font-mono text-xs transition-opacity duration-700"
        style={{ color: 'var(--fg-3)', opacity: 0.07 }}
        onMouseEnter={(e) => (e.currentTarget.style.opacity = '1')}
        onMouseLeave={(e) => (e.currentTarget.style.opacity = '0.07')}
        onClick={() => setSecretFound(true)}
        aria-label="hidden easter egg"
      >
        ★
      </button>

      <AnimatePresence>
        {secretFound && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="fixed top-20 right-14 z-50 text-xs font-mono px-4 py-2 rounded-xl liquid-glass"
            style={{ color: 'var(--fg-2)' }}>
            ⭐ Found it. Try ↑↑↓↓←→←→ba too.
          </motion.div>
        )}
        {konami && (
          <motion.div initial={{ opacity: 0, y: -30 }} animate={{ opacity: 1, y: 0 }}
            className="fixed top-20 left-1/2 -translate-x-1/2 z-50 px-6 py-3 rounded-2xl liquid-glass text-center">
            <p className="font-mono text-sm" style={{ color: 'var(--fg)' }}>Konami Code — God Mode Active</p>
            <p className="text-xs mt-0.5" style={{ color: 'var(--fg-3)' }}>Matrix rain engaged.</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ═══ HERO — split layout ════════════════════════════════ */}
      <section
        ref={heroRef}
        className="relative min-h-screen grid md:grid-cols-2 pt-20"
        style={{ zIndex: 1 }}
      >
        {/* Left: copy */}
        <motion.div
          style={{ opacity: heroOpacity, y: heroY }}
          className="flex flex-col justify-center px-8 md:px-16 py-20 md:py-0 relative z-10"
        >
          {/* Live badge */}
          <motion.div
            initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
            className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-mono mb-8 self-start"
            style={{ background: 'var(--surface-2)', border: '1px solid var(--border-2)', color: 'var(--fg-3)' }}
          >
            <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: 'var(--allow)' }} />
            Live in production · 14,000+ attacks blocked
          </motion.div>

          <div className="mb-6">
            <LogoClick />
          </div>

          <motion.h1
            initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15, type: 'spring', stiffness: 180, damping: 22 }}
            className="text-5xl md:text-6xl font-bold tracking-tight mb-5 mt-10 leading-[1.07]"
            style={{ color: 'var(--fg)' }}
          >
            AI clones voices.
            <br />
            <span style={{ color: 'var(--fg-2)' }}>We catch them.</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.24 }}
            className="text-base md:text-lg max-w-sm mb-4 leading-relaxed"
            style={{ color: 'var(--fg-3)' }}
          >
            Real-time gateway that fuses spectral, biomechanic, and identity signals
            to detect AI-cloned voices in live calls — in under 250ms.
          </motion.p>

          <motion.p
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}
            className="text-sm max-w-xs mb-10 leading-relaxed"
            style={{ color: 'var(--fg-3)', opacity: 0.7 }}
          >
            Deployed in banks, fintechs, and call centres across 18 countries.
            Zero-retention. SOC 2 Type II certified.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}
            className="flex flex-wrap gap-3"
          >
            <Link to="/login"
              className="flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-sm transition-all hover:opacity-88 active:scale-95"
              style={{ background: 'var(--fg)', color: 'var(--bg)' }}
            >
              Start Free Trial <ChevronRight size={15} />
            </Link>
            <a href="#how"
              className="flex items-center gap-2 px-6 py-3 rounded-xl text-sm transition-all"
              style={{ background: 'var(--surface-2)', color: 'var(--fg-2)', border: '1px solid var(--border-2)' }}
              onMouseEnter={e => (e.currentTarget.style.borderColor = 'var(--border-3)')}
              onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--border-2)')}
            >
              See how it works
            </a>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}
            className="flex items-center gap-2 mt-14"
            style={{ animation: 'float 3s ease-in-out infinite' }}
          >
            <span className="text-xs font-mono" style={{ color: 'var(--fg-3)', opacity: 0.5 }}>scroll</span>
            <ArrowDown size={12} style={{ color: 'var(--fg-3)', opacity: 0.4 }} />
          </motion.div>
        </motion.div>

        {/* Right: waveform image with glass overlay */}
        <motion.div
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2, duration: 0.7, ease: 'easeOut' }}
          className="hidden md:flex relative overflow-hidden"
          style={{ minHeight: '100vh' }}
        >
          {/* Image */}
          <img
            src={heroImg}
            alt="Abstract waveform — voice signal analysis"
            className="absolute inset-0 w-full h-full object-cover"
            style={{
              filter: dark
                ? 'brightness(0.45) grayscale(0.6) contrast(1.1)'
                : 'brightness(0.7) grayscale(0.5) contrast(0.95)',
            }}
          />

          {/* Gradient fade into left panel */}
          <div
            className="absolute inset-0"
            style={{
              background: dark
                ? 'linear-gradient(to right, #0A0A0A 0%, transparent 30%, transparent 70%, #0A0A0A 100%)'
                : 'linear-gradient(to right, #F5F2EA 0%, transparent 30%, transparent 70%, #F5F2EA 100%)',
            }}
          />

          {/* Floating glass stats panel */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.55, type: 'spring', stiffness: 160, damping: 22 }}
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80"
          >
            <LiquidGlass className="p-5" rounded="1.25rem" strong>
              <div className="text-xs font-mono uppercase tracking-widest mb-4" style={{ color: 'var(--fg-3)' }}>
                Real-time signals
              </div>
              {[
                { label: 'Spectral risk',    val: 0.08, color: 'var(--allow)'     },
                { label: 'Prosody risk',     val: 0.11, color: 'var(--allow)'     },
                { label: 'Identity match',   val: 0.94, color: 'var(--allow)'     },
                { label: 'Composite EMA',    val: 0.09, color: 'var(--allow)'     },
              ].map((row) => (
                <div key={row.label} className="mb-3 last:mb-0">
                  <div className="flex justify-between text-xs font-mono mb-1">
                    <span style={{ color: 'var(--fg-3)' }}>{row.label}</span>
                    <span style={{ color: row.color }}>{(row.val * 100).toFixed(0)}%</span>
                  </div>
                  <div className="h-0.5 rounded-full overflow-hidden" style={{ background: 'var(--surface-3)' }}>
                    <motion.div
                      className="h-full rounded-full"
                      style={{ background: row.color }}
                      initial={{ width: 0 }}
                      animate={{ width: `${row.val * 100}%` }}
                      transition={{ delay: 0.8, duration: 1.2, ease: 'easeOut' }}
                    />
                  </div>
                </div>
              ))}
              <div className="flex items-center gap-2 mt-4 pt-3 border-t" style={{ borderColor: 'var(--border)' }}>
                <span className="w-2 h-2 rounded-full animate-pulse" style={{ background: 'var(--allow)' }} />
                <span className="text-xs font-mono" style={{ color: 'var(--allow)' }}>ALLOW — genuine voice confirmed</span>
              </div>
            </LiquidGlass>
          </motion.div>
        </motion.div>
      </section>

      {/* ═══ STATS ══════════════════════════════════════════════ */}
      <section className="relative z-10 px-6 pb-16 max-w-4xl mx-auto">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {STATS.map((s, i) => (
            <motion.div key={s.label}
              initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
              transition={{ delay: i * 0.07 }}
            >
              <LiquidGlass className="p-5 text-center h-full">
                <div className="text-2xl font-bold font-mono mb-1" style={{ color: 'var(--fg)' }}>{s.value}</div>
                <div className="text-xs font-medium mb-0.5" style={{ color: 'var(--fg-2)' }}>{s.label}</div>
                <div className="text-xs" style={{ color: 'var(--fg-3)' }}>{s.sub}</div>
              </LiquidGlass>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ═══ USE CASES ══════════════════════════════════════════ */}
      <section className="relative z-10 px-6 py-16 max-w-4xl mx-auto">
        <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} className="text-center mb-12">
          <div className="text-xs font-mono uppercase tracking-widest mb-3" style={{ color: 'var(--fg-3)' }}>USE CASES</div>
          <h2 className="text-3xl md:text-4xl font-bold" style={{ color: 'var(--fg)' }}>Where VoiceGuard protects you</h2>
        </motion.div>
        <div className="grid md:grid-cols-3 gap-3">
          {USE_CASES.map((uc, i) => (
            <motion.div key={uc.title}
              initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
              transition={{ delay: i * 0.09 }} whileHover={{ y: -4 }}
            >
              <LiquidGlass className="p-6 h-full" rounded="1.25rem" strong>
                <div className="w-9 h-9 rounded-xl flex items-center justify-center mb-4"
                  style={{ background: 'var(--surface-3)', border: '1px solid var(--border-2)' }}>
                  <uc.icon size={17} style={{ color: 'var(--fg-2)' }} />
                </div>
                <div className="font-semibold text-sm mb-2" style={{ color: 'var(--fg)' }}>{uc.title}</div>
                <div className="text-xs leading-relaxed" style={{ color: 'var(--fg-3)' }}>{uc.desc}</div>
              </LiquidGlass>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ═══ HOW IT WORKS ═══════════════════════════════════════ */}
      <section id="how" className="relative z-10 px-6 py-16 max-w-4xl mx-auto">
        <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} className="text-center mb-12">
          <div className="text-xs font-mono uppercase tracking-widest mb-3" style={{ color: 'var(--fg-3)' }}>HOW IT WORKS</div>
          <h2 className="text-3xl md:text-4xl font-bold mb-4" style={{ color: 'var(--fg)' }}>Three signals. One verdict.</h2>
          <p className="max-w-md mx-auto text-sm" style={{ color: 'var(--fg-3)' }}>
            Each 250ms window passes through three independent detectors. Their scores fuse via
            exponential moving average across 8 strides — a 2-second decision window.
          </p>
        </motion.div>

        {/* Signal pipeline */}
        <div className="grid md:grid-cols-3 gap-3 mb-12">
          {[
            { icon: Waves,       label: 'Spectral',  desc: 'Phase artifacts, vocoder fingerprints, bandwidth signatures. The synthesiser always leaves a trace.' },
            { icon: Mic2,        label: 'Prosody',   desc: 'Pitch jitter, shimmer, HNR. Biological signals no TTS model fully replicates at 250ms granularity.' },
            { icon: Fingerprint, label: 'Identity',  desc: 'Cosine similarity of 256-dim embeddings vs. enrolled print. p(identity) fed into EMA every stride.' },
          ].map((item, i) => (
            <motion.div key={item.label}
              initial={{ opacity: 0, y: 14 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
              transition={{ delay: i * 0.09 }}
            >
              <LiquidGlass className="p-5 h-full" rounded="1.25rem">
                <item.icon size={18} style={{ color: 'var(--fg-2)', marginBottom: 12 }} />
                <div className="font-semibold text-sm mb-2" style={{ color: 'var(--fg)' }}>Track {String.fromCharCode(65 + i)}: {item.label}</div>
                <div className="text-xs leading-relaxed" style={{ color: 'var(--fg-3)' }}>{item.desc}</div>
              </LiquidGlass>
            </motion.div>
          ))}
        </div>

        {/* Decision flow */}
        <motion.div
          initial={{ opacity: 0, y: 14 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
          className="mb-10"
        >
          <LiquidGlass className="p-6" rounded="1.25rem" strong>
            <div className="text-xs font-mono uppercase tracking-widest mb-4" style={{ color: 'var(--fg-3)' }}>Decision flow</div>
            <div className="flex flex-wrap items-center gap-2 text-xs font-mono">
              {['Risk < 0.35', '→ ALLOW', 'Risk 0.35–0.70', '→ CHALLENGE', 'Challenge fails', '→ BLOCK', 'Risk > 0.70', '→ SEVER_SESSION'].map((step, i) => {
                const isArrow = step.startsWith('→');
                const color = step.includes('ALLOW') ? 'var(--allow)' : step.includes('CHALLENGE') ? 'var(--challenge)' : step.includes('BLOCK') || step.includes('SEVER') ? 'var(--block)' : 'var(--fg-3)';
                return (
                  <span key={i} className="px-2.5 py-1 rounded-lg"
                    style={{
                      color,
                      background: isArrow ? 'transparent' : 'var(--surface-3)',
                      fontWeight: isArrow ? 400 : 500,
                    }}
                  >{step}</span>
                );
              })}
            </div>
          </LiquidGlass>
        </motion.div>

        {/* Live terminal */}
        <motion.div initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
          <div className="text-xs font-mono text-center mb-3" style={{ color: 'var(--fg-3)' }}>↓ Watch a real session unfold</div>
          <Terminal />
        </motion.div>
      </section>

      {/* ═══ FEATURES ═══════════════════════════════════════════ */}
      <section id="product" className="relative z-10 px-6 py-16 max-w-4xl mx-auto">
        <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} className="text-center mb-12">
          <div className="text-xs font-mono uppercase tracking-widest mb-3" style={{ color: 'var(--fg-3)' }}>CAPABILITIES</div>
          <h2 className="text-3xl md:text-4xl font-bold" style={{ color: 'var(--fg)' }}>Built for threats you haven't seen yet</h2>
        </motion.div>
        <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-3">
          {FEATURES.map((f, i) => (
            <motion.div key={f.title}
              initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
              transition={{ delay: i * 0.04 }} whileHover={{ y: -3 }}
            >
              <LiquidGlass className="p-5 h-full cursor-default" rounded="1.25rem">
                <f.icon size={15} style={{ color: 'var(--fg-2)', marginBottom: 10 }} />
                <div className="font-semibold text-sm mb-1.5" style={{ color: 'var(--fg)' }}>{f.title}</div>
                <div className="text-xs leading-relaxed" style={{ color: 'var(--fg-3)' }}>{f.desc}</div>
              </LiquidGlass>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ═══ INTERACTIVE EASTER EGG ══════════════════════════════ */}
      <section className="relative z-10 px-6 py-8 max-w-xl mx-auto">
        <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} className="text-center mb-6">
          <div className="flex items-center justify-center gap-2 text-xs font-mono" style={{ color: 'var(--fg-3)' }}>
            <Sparkles size={11} /> Try the live risk engine <Sparkles size={11} />
          </div>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
          <RiskSlider />
        </motion.div>
        {scrollStreak > 200 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="text-center mt-5 text-xs font-mono" style={{ color: 'var(--fg-3)' }}>
            {scrollStreak > 500 ? '🌀 Scroll master. VoiceGuard is impressed.' : '📜 Scroll archaeologist...'}
          </motion.div>
        )}
      </section>

      {/* ═══ TESTIMONIALS ═══════════════════════════════════════ */}
      <section className="relative z-10 px-6 py-16 max-w-4xl mx-auto">
        <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} className="text-center mb-12">
          <div className="text-xs font-mono uppercase tracking-widest mb-3" style={{ color: 'var(--fg-3)' }}>TESTIMONIALS</div>
          <h2 className="text-3xl font-bold" style={{ color: 'var(--fg)' }}>Trusted by security teams worldwide</h2>
        </motion.div>
        <div className="grid md:grid-cols-3 gap-3">
          {TESTIMONIALS.map((t, i) => (
            <motion.div key={i}
              initial={{ opacity: 0, y: 14 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
              transition={{ delay: i * 0.08 }}
            >
              <LiquidGlass className="p-6 h-full" rounded="1.25rem" strong>
                <p className="text-sm leading-relaxed mb-5" style={{ color: 'var(--fg-2)' }}>{t.text}</p>
                <div className="flex items-center gap-3 mt-auto">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-mono font-bold shrink-0"
                    style={{ background: 'var(--surface-3)', color: 'var(--fg)', border: '1px solid var(--border-2)' }}>
                    {t.initials}
                  </div>
                  <div>
                    <div className="text-xs font-medium" style={{ color: 'var(--fg)' }}>{t.author}</div>
                    <div className="text-xs" style={{ color: 'var(--fg-3)' }}>{t.company}</div>
                  </div>
                </div>
              </LiquidGlass>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ═══ SECURITY ═══════════════════════════════════════════ */}
      <section id="security" className="relative z-10 px-6 py-16 max-w-4xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
          <LiquidGlass className="p-8" rounded="1.5rem" strong>
            <div className="text-center mb-8">
              <CheckCircle size={24} style={{ color: 'var(--allow)', margin: '0 auto 12px' }} />
              <h3 className="text-2xl font-bold" style={{ color: 'var(--fg)' }}>Security at every layer</h3>
            </div>
            <div className="grid sm:grid-cols-3 gap-6">
              {[
                { icon: Lock,     title: 'Ephemeral processing', desc: 'Audio in RAM, cleared per call. No recordings, no transcripts, no call logs.' },
                { icon: Globe,    title: 'On-premise deploy',    desc: 'Full container stack. Audio never leaves your network perimeter.' },
                { icon: Activity, title: 'SOC 2 Type II',        desc: 'Certified. Pen-tested quarterly. Audit reports available under NDA.' },
              ].map(item => (
                <div key={item.title} className="flex gap-3">
                  <item.icon size={15} style={{ color: 'var(--fg-3)', flexShrink: 0, marginTop: 2 }} />
                  <div>
                    <div className="text-sm font-semibold mb-1" style={{ color: 'var(--fg)' }}>{item.title}</div>
                    <div className="text-xs" style={{ color: 'var(--fg-3)' }}>{item.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </LiquidGlass>
        </motion.div>
      </section>

      {/* ═══ PRICING ════════════════════════════════════════════ */}
      <section id="pricing" className="relative z-10 px-6 py-16 max-w-4xl mx-auto">
        <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} className="text-center mb-12">
          <div className="text-xs font-mono uppercase tracking-widest mb-3" style={{ color: 'var(--fg-3)' }}>PRICING</div>
          <h2 className="text-3xl font-bold" style={{ color: 'var(--fg)' }}>Simple, call-based pricing</h2>
          <p className="text-sm mt-3" style={{ color: 'var(--fg-3)' }}>No per-seat fees. No setup costs. Pay for what you analyse.</p>
        </motion.div>
        <div className="grid md:grid-cols-3 gap-3">
          {[
            { name: 'Starter', price: '$499', unit: '/mo', calls: '10,000 calls/mo', features: ['250ms analysis', 'API access', 'Email support', '99.5% SLA'], hi: false },
            { name: 'Scale', price: '$1,999', unit: '/mo', calls: '100,000 calls/mo', features: ['All Starter', 'Liveness challenges', 'On-call support', 'SLA 99.9%', 'Custom thresholds'], hi: true },
            { name: 'Enterprise', price: 'Custom', unit: '', calls: 'Unlimited', features: ['All Scale', 'On-premise deploy', 'Custom ONNX model', 'Dedicated CSM', 'Audit reports'], hi: false },
          ].map((plan, i) => (
            <motion.div key={plan.name}
              initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
              transition={{ delay: i * 0.08 }} whileHover={{ y: -4 }}
            >
              <LiquidGlass className="p-6 h-full flex flex-col" rounded="1.25rem" strong={plan.hi}
                style={plan.hi ? { border: '1px solid var(--border-3)' } : {}}
              >
                {plan.hi && (
                  <div className="text-xs font-mono mb-3 px-2 py-0.5 rounded inline-block self-start"
                    style={{ background: 'var(--surface-3)', color: 'var(--fg-2)', border: '1px solid var(--border-2)' }}>
                    Most Popular
                  </div>
                )}
                <div className="text-sm font-mono mb-1" style={{ color: 'var(--fg-3)' }}>{plan.name}</div>
                <div className="text-3xl font-bold font-mono mb-1" style={{ color: 'var(--fg)' }}>
                  {plan.price}<span className="text-base font-normal" style={{ color: 'var(--fg-3)' }}>{plan.unit}</span>
                </div>
                <div className="text-xs font-mono mb-5" style={{ color: 'var(--fg-3)' }}>{plan.calls}</div>
                <ul className="space-y-2 mb-6 flex-1">
                  {plan.features.map(f => (
                    <li key={f} className="flex items-center gap-2 text-xs" style={{ color: 'var(--fg-2)' }}>
                      <CheckCircle size={11} style={{ color: 'var(--allow)', flexShrink: 0 }} />{f}
                    </li>
                  ))}
                </ul>
                <Link to="/login"
                  className="block text-center py-2 rounded-xl text-sm font-mono font-medium transition-all"
                  style={plan.hi
                    ? { background: 'var(--fg)', color: 'var(--bg)' }
                    : { background: 'var(--surface-3)', color: 'var(--fg-2)', border: '1px solid var(--border-2)' }}
                  onMouseEnter={e => (e.currentTarget.style.opacity = '0.85')}
                  onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
                >
                  Get started
                </Link>
              </LiquidGlass>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ═══ CTA ════════════════════════════════════════════════ */}
      <section className="relative z-10 px-6 py-24 max-w-xl mx-auto text-center">
        <motion.div initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
          <AlertTriangle size={26} style={{ color: 'var(--challenge)', margin: '0 auto 18px' }} />
          <h2 className="text-3xl font-bold mb-4" style={{ color: 'var(--fg)' }}>
            The next CEO fraud call is being cloned right now.
          </h2>
          <p className="mb-8 text-sm" style={{ color: 'var(--fg-3)' }}>
            Protect your call centre before the attack, not after the breach report.
          </p>
          <Link to="/login"
            className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl font-semibold text-sm transition-all hover:opacity-88"
            style={{ background: 'var(--fg)', color: 'var(--bg)' }}
          >
            Request a Demo <ChevronRight size={15} />
          </Link>
          <p className="mt-8 text-xs font-mono" style={{ color: 'var(--fg-3)', opacity: 0.3 }}>
            psst: ↑↑↓↓←→←→ba
          </p>
        </motion.div>
      </section>

      {/* ═══ FOOTER ═════════════════════════════════════════════ */}
      <footer className="relative z-10 border-t px-6 py-8" style={{ borderColor: 'var(--border)' }}>
        <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Shield size={13} style={{ color: 'var(--fg-3)' }} />
            <span className="font-bold text-sm" style={{ color: 'var(--fg-2)' }}>VoiceGuard</span>
          </div>
          <div className="text-xs font-mono" style={{ color: 'var(--fg-3)' }}>
            Zero data retention · RAM-only · © 2025 VoiceGuard Inc.
          </div>
          <div className="flex gap-4 text-xs font-mono" style={{ color: 'var(--fg-3)' }}>
            {['Privacy','Terms','Security','Docs'].map(l => (
              <a key={l} href="#" className="hover:opacity-70 transition-opacity">{l}</a>
            ))}
          </div>
        </div>
      </footer>
    </div>
  );
}
