import { useEffect, useRef } from 'react';

const COUNT = 75;
const CONNECT_D = 125;
const REPEL_D = 110;
const REPEL_F = 0.28;

interface P { x: number; y: number; vx: number; vy: number; r: number; o: number }

export default function InteractiveMesh({ dark = true }: { dark?: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mouseRef = useRef({ x: -9999, y: -9999 });
  const pts = useRef<P[]>([]);
  const raf = useRef(0);

  useEffect(() => {
    const c = canvasRef.current;
    if (!c) return;
    const ctx = c.getContext('2d');
    if (!ctx) return;

    function resize() {
      if (!c) return;
      c.width = window.innerWidth;
      c.height = window.innerHeight;
    }
    resize();

    pts.current = Array.from({ length: COUNT }, () => ({
      x: Math.random() * window.innerWidth,
      y: Math.random() * window.innerHeight,
      vx: (Math.random() - 0.5) * 0.3,
      vy: (Math.random() - 0.5) * 0.3,
      r: Math.random() * 1.2 + 0.3,
      o: Math.random() * 0.4 + 0.15,
    }));

    function draw() {
      if (!c || !ctx) return;
      ctx.clearRect(0, 0, c.width, c.height);

      // Monochrome color: off-white in dark, dark grey in light
      const dotRGB = dark ? '200,200,200' : '40,40,40';

      for (const p of pts.current) {
        const dx = p.x - mouseRef.current.x;
        const dy = p.y - mouseRef.current.y;
        const d = Math.sqrt(dx * dx + dy * dy);
        if (d < REPEL_D && d > 0) {
          const f = (REPEL_D - d) / REPEL_D;
          p.vx += (dx / d) * f * REPEL_F;
          p.vy += (dy / d) * f * REPEL_F;
        }
        p.vx *= 0.987;
        p.vy *= 0.987;
        const sp = Math.sqrt(p.vx * p.vx + p.vy * p.vy);
        if (sp > 1.4) { p.vx = (p.vx / sp) * 1.4; p.vy = (p.vy / sp) * 1.4; }
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < -8) p.x = c.width + 8;
        if (p.x > c.width + 8) p.x = -8;
        if (p.y < -8) p.y = c.height + 8;
        if (p.y > c.height + 8) p.y = -8;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${dotRGB},${p.o})`;
        ctx.fill();
      }

      const arr = pts.current;
      for (let i = 0; i < arr.length; i++) {
        for (let j = i + 1; j < arr.length; j++) {
          const dx = arr[i].x - arr[j].x;
          const dy = arr[i].y - arr[j].y;
          const d = Math.sqrt(dx * dx + dy * dy);
          if (d < CONNECT_D) {
            const a = (1 - d / CONNECT_D) * 0.12;
            ctx.beginPath();
            ctx.moveTo(arr[i].x, arr[i].y);
            ctx.lineTo(arr[j].x, arr[j].y);
            ctx.strokeStyle = `rgba(${dotRGB},${a})`;
            ctx.lineWidth = 0.5;
            ctx.stroke();
          }
        }
      }

      raf.current = requestAnimationFrame(draw);
    }

    draw();

    const onMove = (e: MouseEvent) => { mouseRef.current = { x: e.clientX, y: e.clientY }; };
    const onTouch = (e: TouchEvent) => {
      const t = e.touches[0]; if (t) mouseRef.current = { x: t.clientX, y: t.clientY };
    };
    const onLeave = () => { mouseRef.current = { x: -9999, y: -9999 }; };

    window.addEventListener('mousemove', onMove, { passive: true });
    window.addEventListener('touchmove', onTouch, { passive: true });
    window.addEventListener('mouseleave', onLeave);
    window.addEventListener('resize', resize);

    return () => {
      cancelAnimationFrame(raf.current);
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('touchmove', onTouch);
      window.removeEventListener('mouseleave', onLeave);
      window.removeEventListener('resize', resize);
    };
  }, [dark]);

  return (
    <canvas
      ref={canvasRef}
      id="mesh-canvas"
      aria-hidden="true"
      style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0, opacity: dark ? 0.45 : 0.22 }}
    />
  );
}
