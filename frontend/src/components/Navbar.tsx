import { motion, AnimatePresence } from 'framer-motion';
import { Shield, Moon, Sun, Menu, X, LogOut } from 'lucide-react';
import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';

interface Props {
  dark: boolean;
  onToggleDark: () => void;
  authed: boolean;
  onLogout: () => void;
}

const NAV_LINKS = [
  { label: 'Product',      href: '/#product'  },
  { label: 'How it works', href: '/#how'       },
  { label: 'Security',     href: '/#security'  },
  { label: 'Pricing',      href: '/#pricing'   },
];

export default function Navbar({ dark, onToggleDark, authed, onLogout }: Props) {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const location = useLocation();
  const isDashboard = location.pathname === '/dashboard';

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 24);
    window.addEventListener('scroll', fn, { passive: true });
    return () => window.removeEventListener('scroll', fn);
  }, []);

  return (
    <header
      className="fixed top-0 inset-x-0 z-50"
      style={{
        padding: scrolled ? '0' : '8px 0',
        transition: 'padding 0.5s cubic-bezier(0.4,0,0.2,1)',
      }}
    >
      <div
        className="mx-auto nav-liquid"
        style={{
          maxWidth:      scrolled ? '100%'  : '1100px',
          margin:        scrolled ? '0'     : '0 auto',
          borderRadius:  scrolled ? '0px'   : '12px',
          background:    dark ? 'rgba(14,14,14,0.86)' : 'rgba(242,240,234,0.86)',
          border:        scrolled ? 'none' : '1px solid var(--border-2)',
          borderBottom:  scrolled ? '1px solid var(--border)' : 'none',
          boxShadow:     scrolled ? 'none' : '0 4px 24px rgba(0,0,0,0.14)',
          transition:    [
            'max-width 0.5s cubic-bezier(0.4,0,0.2,1)',
            'border-radius 0.5s cubic-bezier(0.4,0,0.2,1)',
            'background 0.4s ease',
            'box-shadow 0.5s ease',
          ].join(','),
        }}
      >
        <div className="px-5 flex items-center justify-between" style={{ height: 52 }}>

          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 shrink-0">
            <Shield size={15} style={{ color: 'var(--fg-2)' }} />
            <span className="font-bold text-sm tracking-tight" style={{ color: 'var(--fg)' }}>
              Voice<span style={{ color: 'var(--fg-2)' }}>Guard</span>
            </span>
          </Link>

          {/* Desktop nav links */}
          {!isDashboard && (
            <nav className="hidden md:flex items-center gap-0.5">
              {NAV_LINKS.map((l) => (
                <a
                  key={l.label}
                  href={l.href}
                  className="px-3 py-1.5 rounded-lg text-sm"
                  style={{ color: 'var(--fg-3)', transition: 'color 0.2s, background 0.2s' }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.color = 'var(--fg)';
                    e.currentTarget.style.background = dark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.color = 'var(--fg-3)';
                    e.currentTarget.style.background = 'transparent';
                  }}
                >
                  {l.label}
                </a>
              ))}
            </nav>
          )}

          {/* Right side */}
          <div className="flex items-center gap-1">
            {/* Theme toggle */}
            <button
              onClick={onToggleDark}
              className="p-2 rounded-lg"
              style={{ color: 'var(--fg-3)', transition: 'color 0.2s, background 0.2s' }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.color = 'var(--fg)';
                (e.currentTarget as HTMLElement).style.background = dark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)';
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.color = 'var(--fg-3)';
                (e.currentTarget as HTMLElement).style.background = 'transparent';
              }}
              aria-label="Toggle theme"
            >
              <AnimatePresence mode="wait" initial={false}>
                <motion.span
                  key={dark ? 'sun' : 'moon'}
                  initial={{ opacity: 0, rotate: -25, scale: 0.75 }}
                  animate={{ opacity: 1, rotate: 0,   scale: 1    }}
                  exit  ={{ opacity: 0, rotate:  25, scale: 0.75 }}
                  transition={{ duration: 0.18, ease: 'easeOut' }}
                  style={{ display: 'flex' }}
                >
                  {dark ? <Sun size={14} /> : <Moon size={14} />}
                </motion.span>
              </AnimatePresence>
            </button>

            {authed ? (
              <button
                onClick={onLogout}
                className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono"
                style={{ color: 'var(--fg-3)', transition: 'color 0.2s, background 0.2s' }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLElement).style.color = 'var(--fg)';
                  (e.currentTarget as HTMLElement).style.background = dark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)';
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.color = 'var(--fg-3)';
                  (e.currentTarget as HTMLElement).style.background = 'transparent';
                }}
              >
                <LogOut size={12} /> Sign out
              </button>
            ) : (
              <>
                <Link
                  to="/login"
                  className="hidden md:block px-3 py-1.5 rounded-lg text-sm"
                  style={{ color: 'var(--fg-3)', transition: 'color 0.2s' }}
                  onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--fg)')}
                  onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--fg-3)')}
                >
                  Sign in
                </Link>
                <Link
                  to="/login?tab=signup"
                  className="hidden md:block px-4 py-1.5 rounded-lg text-sm font-medium"
                  style={{
                    background: 'var(--fg)', color: 'var(--bg)',
                    transition: 'transform 0.18s ease, opacity 0.18s ease',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.opacity = '0.88')}
                  onMouseLeave={(e) => (e.currentTarget.style.opacity = '1')}
                >
                  Get Access
                </Link>
              </>
            )}

            {/* Mobile hamburger */}
            <button
              className="md:hidden p-2 rounded-lg"
              onClick={() => setOpen((o) => !o)}
              style={{ color: 'var(--fg-2)' }}
              aria-label="Toggle menu"
            >
              <AnimatePresence mode="wait" initial={false}>
                <motion.span
                  key={open ? 'x' : 'menu'}
                  initial={{ opacity: 0, rotate: -18 }}
                  animate={{ opacity: 1, rotate: 0   }}
                  exit  ={{ opacity: 0, rotate:  18  }}
                  transition={{ duration: 0.15 }}
                  style={{ display: 'flex' }}
                >
                  {open ? <X size={16} /> : <Menu size={16} />}
                </motion.span>
              </AnimatePresence>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile dropdown */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -8, scaleY: 0.95 }}
            animate={{ opacity: 1, y: 0,  scaleY: 1    }}
            exit  ={{ opacity: 0, y: -8, scaleY: 0.95 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            style={{ transformOrigin: 'top' }}
            className="md:hidden mx-4 mt-1 rounded-2xl overflow-hidden"
          >
            <div
              style={{
                background: dark ? 'rgba(18,18,18,0.97)' : 'rgba(250,248,244,0.97)',
                border: '1px solid var(--border-2)',
                backdropFilter: 'blur(24px)',
              }}
              className="rounded-2xl p-3 space-y-0.5"
            >
              {NAV_LINKS.map((l) => (
                <a
                  key={l.label}
                  href={l.href}
                  onClick={() => setOpen(false)}
                  className="block px-3 py-2.5 rounded-xl text-sm"
                  style={{ color: 'var(--fg-2)', transition: 'background 0.15s' }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = dark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)')}
                  onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                >
                  {l.label}
                </a>
              ))}
              <div className="pt-2 border-t" style={{ borderColor: 'var(--border)' }}>
                <Link to="/login" onClick={() => setOpen(false)}
                  className="block px-3 py-2.5 rounded-xl text-sm font-medium"
                  style={{ color: 'var(--fg)' }}
                >
                  Sign In / Get Access
                </Link>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
