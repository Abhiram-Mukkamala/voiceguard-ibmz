import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import Navbar from './components/Navbar';
import { LiquidGlassFilter } from './components/LiquidGlass';
import Landing from './pages/Landing';
import Auth from './pages/Auth';
import DashboardPage from './pages/DashboardPage';

function PageWrapper({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={location.pathname}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}

function ProtectedRoute({ authed, children }: { authed: boolean; children: React.ReactNode }) {
  if (!authed) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

function AppInner() {
  const [dark, setDark] = useState(true);
  const [authed, setAuthed] = useState(false);
  const [user, setUser] = useState<string | null>(null);
  const location = useLocation();

  // Persist theme
  useEffect(() => {
    document.documentElement.classList.toggle('light', !dark);
  }, [dark]);

  function handleLogin(email: string) {
    setUser(email);
    setAuthed(true);
  }

  function handleLogout() {
    setUser(null);
    setAuthed(false);
  }

  const hiddenNavRoutes = ['/login'];
  const showNav = !hiddenNavRoutes.includes(location.pathname);

  return (
    <div
      className={dark ? '' : 'light'}
      style={{ minHeight: '100vh', background: 'var(--bg)', color: 'var(--fg)' }}
    >
      {/* Global effects */}
      <LiquidGlassFilter />

      {/* Navbar */}
      {showNav && (
        <Navbar dark={dark} onToggleDark={() => setDark((d) => !d)} authed={authed} onLogout={handleLogout} />
      )}

      <Routes>
        <Route
          path="/"
          element={
            <PageWrapper>
              <Landing dark={dark} />
            </PageWrapper>
          }
        />
        <Route
          path="/login"
          element={
            authed ? <Navigate to="/dashboard" replace /> : (
              <PageWrapper>
                <Auth dark={dark} onLogin={handleLogin} />
              </PageWrapper>
            )
          }
        />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute authed={authed}>
              <PageWrapper>
                <DashboardPage dark={dark} />
              </PageWrapper>
            </ProtectedRoute>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AppInner />
    </BrowserRouter>
  );
}
