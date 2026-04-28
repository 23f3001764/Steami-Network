import { useEffect, useRef } from 'react';
import { useThemeStore } from '@/stores/theme-store';

/* ── Wind ribbon config ─────────────────────────────────────── */
interface Ribbon {
  /** y offset ratio (0-1) */
  y: number;
  amplitude: number;
  wavelength: number;
  speed: number;
  opacity: number;
  width: number;
  color: [number, number, number];
  phase: number;
}

function createRibbons(count: number): Ribbon[] {
  const colors: [number, number, number][] = [
    [120, 180, 255],
    [160, 210, 250],
    [100, 165, 240],
    [180, 215, 255],
    [140, 195, 245],
    [90, 155, 230],
  ];
  return Array.from({ length: count }, (_, i) => ({
    y: 0.1 + (i / count) * 0.8 + (Math.random() - 0.5) * 0.08,
    amplitude: 18 + Math.random() * 28,
    wavelength: 400 + Math.random() * 300,
    speed: 0.15 + Math.random() * 0.25,
    opacity: 0.04 + Math.random() * 0.07,
    width: 1 + Math.random() * 1.5,
    color: colors[i % colors.length],
    phase: Math.random() * Math.PI * 2,
  }));
}

export function StarBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const theme = useThemeStore((s) => s.theme);
  const mouseRef = useRef({ x: 0.5, y: 0.5, targetX: 0.5, targetY: 0.5 });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    const isLight = theme === 'light';

    /* ── Resize ─────────────────────────────────────────────── */
    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    /* ── Mouse tracking (light only) ────────────────────────── */
    const onMouse = (e: MouseEvent) => {
      mouseRef.current.targetX = e.clientX / window.innerWidth;
      mouseRef.current.targetY = e.clientY / window.innerHeight;
    };
    if (isLight) window.addEventListener('mousemove', onMouse, { passive: true });

    if (isLight) {
      /* ═══════════════════════════════════════════════════════
         LIGHT THEME — Wind ribbons
         ═══════════════════════════════════════════════════════ */
      const ribbons = createRibbons(5);

      const draw = () => {
        const { width: W, height: H } = canvas;
        ctx.clearRect(0, 0, W, H);

        // Smooth mouse interpolation
        const m = mouseRef.current;
        m.x += (m.targetX - m.x) * 0.03;
        m.y += (m.targetY - m.y) * 0.03;
        const mouseOffsetX = (m.x - 0.5) * 16;
        const mouseOffsetY = (m.y - 0.5) * 10;

        const time = Date.now() * 0.001;

        ribbons.forEach((r) => {
          const baseY = r.y * H;
          const steps = Math.ceil(W / 6);
          const stepW = W / steps;

          ctx.beginPath();
          for (let i = 0; i <= steps; i++) {
            const x = i * stepW;
            const progress = x / W;
            // Composite sine for organic motion
            const wave =
              Math.sin((x / r.wavelength) + time * r.speed + r.phase) * r.amplitude +
              Math.sin((x / (r.wavelength * 0.6)) + time * r.speed * 1.3 + r.phase * 2) * (r.amplitude * 0.35);
            // Mouse influence fades with distance from cursor
            const mouseDist = 1 - Math.abs(progress - m.x) * 1.5;
            const mouseInfluence = Math.max(0, mouseDist);
            const y = baseY + wave + mouseOffsetY * mouseInfluence * 3 + mouseOffsetX * mouseInfluence * 1.5;

            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
          }

          const [cr, cg, cb] = r.color;
          ctx.strokeStyle = `rgba(${cr}, ${cg}, ${cb}, ${r.opacity})`;
          ctx.lineWidth = r.width;
          ctx.stroke();
        });

        animId = requestAnimationFrame(draw);
      };

      draw();
    } else {
      /* ═══════════════════════════════════════════════════════
         DARK THEME — Stars (original)
         ═══════════════════════════════════════════════════════ */
      const particles: { x: number; y: number; r: number; speed: number; opacity: number }[] = [];

      const init = () => {
        particles.length = 0;
        const count = Math.floor((canvas.width * canvas.height) / 4000);
        for (let i = 0; i < count; i++) {
          particles.push({
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height,
            r: Math.random() * 1.5 + 0.3,
            speed: Math.random() * 0.3 + 0.05,
            opacity: Math.random() * 0.8 + 0.2,
          });
        }
      };

      init();

      const draw = () => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        const time = Date.now() * 0.001;

        particles.forEach((s) => {
          const flicker = Math.sin(time * s.speed * 3 + s.x) * 0.3 + 0.7;
          ctx.beginPath();
          ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(180, 210, 255, ${s.opacity * flicker})`;
          ctx.fill();
        });

        // Occasional shooting star
        if (Math.random() < 0.002) {
          const sx = Math.random() * canvas.width;
          const sy = Math.random() * canvas.height * 0.5;
          ctx.beginPath();
          ctx.moveTo(sx, sy);
          ctx.lineTo(sx + 80, sy + 30);
          ctx.strokeStyle = 'rgba(99, 179, 237, 0.6)';
          ctx.lineWidth = 1;
          ctx.stroke();
        }

        animId = requestAnimationFrame(draw);
      };

      draw();
    }

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', resize);
      window.removeEventListener('mousemove', onMouse);
    };
  }, [theme]);

  return (
    <canvas
      ref={canvasRef}
      id="star-canvas"
      className="fixed top-0 left-0 w-screen h-screen -z-10 pointer-events-none"
    />
  );
}
