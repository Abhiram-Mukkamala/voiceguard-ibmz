import { useEffect, useRef } from 'react';

interface Ball {
  x: number;
  y: number;
  vx: number;
  vy: number;
  r: number;
  mass: number;
}

const COUNT   = 72;
const GRAVITY = 0.018;        // gentle downward pull
const ATTRACT = 0.055;        // cursor attraction strength
const ATTRACT_RADIUS = 260;   // pixels of cursor influence
const DAMPEN  = 0.978;        // velocity damping per frame
const BOUNCE  = 0.42;         // wall bounce coefficient

export default function GravityMesh({ dark }: { dark: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mouseRef  = useRef({ x: -9999, y: -9999, active: false });
  const ballsRef  = useRef<Ball[]>([]);
  const rafRef    = useRef(0);

  useEffect(() => {
    const c = canvasRef.current;
    if (!c) return;
    const ctx = c.getContext('2d');
    if (!ctx) return;

    function resize() {
      if (!c) return;
      c.width  = window.innerWidth;
      c.height = window.innerHeight;
    }
    resize();

    // Scatter balls randomly, mostly in upper half
    ballsRef.current = Array.from({ length: COUNT }, () => ({
      x:    Math.random() * window.innerWidth,
      y:    Math.random() * window.innerHeight * 0.8,
      vx:   (Math.random() - 0.5) * 0.6,
      vy:   (Math.random() - 0.5) * 0.6,
      r:    Math.random() * 1.6 + 0.5,
      mass: Math.random() * 0.6 + 0.7,
    }));

    function tick() {
      if (!c || !ctx) return;
      ctx.clearRect(0, 0, c.width, c.height);

      const dotColor = dark ? '210,210,210' : '30,30,30';
      const mx = mouseRef.current.x;
      const my = mouseRef.current.y;
      const active = mouseRef.current.active;

      for (const b of ballsRef.current) {
        // Gravity
        b.vy += GRAVITY * b.mass;

        // Cursor attraction (only when cursor is on page)
        if (active) {
          const dx = mx - b.x;
          const dy = my - b.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < ATTRACT_RADIUS && dist > 1) {
            const force = (ATTRACT_RADIUS - dist) / ATTRACT_RADIUS;
            b.vx += (dx / dist) * force * ATTRACT * (1 / b.mass);
            b.vy += (dy / dist) * force * ATTRACT * (1 / b.mass);
          }
        }

        // Damping
        b.vx *= DAMPEN;
        b.vy *= DAMPEN;

        // Speed cap
        const spd = Math.sqrt(b.vx * b.vx + b.vy * b.vy);
        if (spd > 5) { b.vx = (b.vx / spd) * 5; b.vy = (b.vy / spd) * 5; }

        b.x += b.vx;
        b.y += b.vy;

        // Bounce off walls
        if (b.x < b.r)          { b.x = b.r;              b.vx = Math.abs(b.vx) * BOUNCE; }
        if (b.x > c.width - b.r){ b.x = c.width - b.r;    b.vx = -Math.abs(b.vx) * BOUNCE; }
        if (b.y < b.r)          { b.y = b.r;              b.vy = Math.abs(b.vy) * BOUNCE; }
        if (b.y > c.height - b.r){ b.y = c.height - b.r;  b.vy = -Math.abs(b.vy) * BOUNCE; }

        // Draw dot
        ctx.beginPath();
        ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${dotColor},0.55)`;
        ctx.fill();
      }

      // Draw connections
      const bs = ballsRef.current;
      const CONN = 130;
      for (let i = 0; i < bs.length; i++) {
        for (let j = i + 1; j < bs.length; j++) {
          const dx = bs[i].x - bs[j].x;
          const dy = bs[i].y - bs[j].y;
          const d  = Math.sqrt(dx * dx + dy * dy);
          if (d < CONN) {
            const a = (1 - d / CONN) * 0.15;
            ctx.beginPath();
            ctx.moveTo(bs[i].x, bs[i].y);
            ctx.lineTo(bs[j].x, bs[j].y);
            ctx.strokeStyle = `rgba(${dotColor},${a})`;
            ctx.lineWidth = 0.55;
            ctx.stroke();
          }
        }
      }

      // Cursor halo
      if (active && mx > 0) {
        const grad = ctx.createRadialGradient(mx, my, 0, mx, my, ATTRACT_RADIUS * 0.6);
        grad.addColorStop(0, `rgba(${dotColor},0.06)`);
        grad.addColorStop(1, `rgba(${dotColor},0)`);
        ctx.beginPath();
        ctx.arc(mx, my, ATTRACT_RADIUS * 0.6, 0, Math.PI * 2);
        ctx.fillStyle = grad;
        ctx.fill();
      }

      rafRef.current = requestAnimationFrame(tick);
    }
    tick();

    const onMove  = (e: MouseEvent) => { mouseRef.current = { x: e.clientX, y: e.clientY, active: true }; };
    const onLeave = ()               => { mouseRef.current.active = false; };
    const onTouch = (e: TouchEvent) => {
      const t = e.touches[0];
      if (t) mouseRef.current = { x: t.clientX, y: t.clientY, active: true };
    };

    window.addEventListener('mousemove', onMove,  { passive: true });
    window.addEventListener('mouseleave', onLeave);
    window.addEventListener('touchmove', onTouch, { passive: true });
    window.addEventListener('resize', resize);

    return () => {
      cancelAnimationFrame(rafRef.current);
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseleave', onLeave);
      window.removeEventListener('touchmove', onTouch);
      window.removeEventListener('resize', resize);
    };
  }, [dark]);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      style={{
        position: 'fixed',
        inset: 0,
        pointerEvents: 'none',
        zIndex: 0,
        opacity: 0.5,
        mixBlendMode: dark ? 'screen' : 'multiply',
      }}
    />
  );
}
