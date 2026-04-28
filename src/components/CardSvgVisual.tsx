import { memo, useRef, useEffect, useState } from 'react';

interface CardSvgVisualProps {
  field: string;
  /** 'mini' for grid cards, 'featured' for carousel hero, 'modal' for modal header */
  variant?: 'mini' | 'featured' | 'modal';
  className?: string;
}

// ── Quantum Physics — orbital rings + electrons ──
function QuantumSvg({ size }: { size: number }) {
  const cx = size / 2, cy = size / 2, r = size * 0.32;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} fill="none">
      <ellipse cx={cx} cy={cy} rx={r} ry={r * 0.4}
        stroke="hsl(var(--steami-cyan))" strokeWidth="0.8" opacity="0.3"
        style={{ animation: 'svg-rotate 12s linear infinite', transformOrigin: `${cx}px ${cy}px` }} />
      <ellipse cx={cx} cy={cy} rx={r * 0.4} ry={r}
        stroke="hsl(var(--steami-cyan))" strokeWidth="0.8" opacity="0.25"
        style={{ animation: 'svg-rotate 18s linear infinite reverse', transformOrigin: `${cx}px ${cy}px` }} />
      <ellipse cx={cx} cy={cy} rx={r} ry={r * 0.7}
        stroke="hsl(var(--steami-cyan))" strokeWidth="0.5" opacity="0.15"
        transform={`rotate(45 ${cx} ${cy})`}
        style={{ animation: 'svg-rotate 22s linear infinite', transformOrigin: `${cx}px ${cy}px` }} />
      <circle cx={cx} cy={cy} r={3} fill="hsl(var(--steami-cyan))"
        style={{ animation: 'svg-pulse 3s ease-in-out infinite' }} />
      <g style={{ animation: 'svg-orbit 6s linear infinite', transformOrigin: `${cx}px ${cy}px` }}>
        <circle cx={cx + r} cy={cy} r={1.8} fill="hsl(var(--steami-cyan))" opacity="0.8" />
      </g>
      <g style={{ animation: 'svg-orbit 9s linear infinite reverse', transformOrigin: `${cx}px ${cy}px` }}>
        <circle cx={cx} cy={cy - r * 0.7} r={1.5} fill="hsl(var(--steami-cyan))" opacity="0.6" />
      </g>
    </svg>
  );
}

// ── Physics — wave + particles ──
function PhysicsSvg({ size }: { size: number }) {
  const cx = size / 2, cy = size / 2;
  const waveY = cy;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} fill="none">
      {/* Standing wave */}
      <path
        d={`M${size * 0.08} ${waveY} Q${size * 0.2} ${waveY - size * 0.18} ${size * 0.35} ${waveY} T${size * 0.62} ${waveY} T${size * 0.92} ${waveY}`}
        stroke="hsl(var(--steami-cyan))" strokeWidth="1" opacity="0.35"
        strokeDasharray="60" strokeDashoffset="60"
        style={{ animation: 'svg-dash 3s linear infinite' }} />
      <path
        d={`M${size * 0.08} ${waveY} Q${size * 0.2} ${waveY + size * 0.18} ${size * 0.35} ${waveY} T${size * 0.62} ${waveY} T${size * 0.92} ${waveY}`}
        stroke="hsl(var(--steami-cyan))" strokeWidth="0.7" opacity="0.2"
        strokeDasharray="60" strokeDashoffset="60"
        style={{ animation: 'svg-dash 4s linear infinite' }} />
      {/* Particles along wave */}
      {[0.2, 0.35, 0.5, 0.65, 0.8].map((f, i) => (
        <circle key={i} cx={size * f} cy={waveY} r={1.5} fill="hsl(var(--steami-cyan))"
          style={{ animation: `svg-pulse ${2 + i * 0.5}s ease-in-out infinite` }} />
      ))}
      {/* Measurement lines */}
      <line x1={cx} y1={size * 0.15} x2={cx} y2={size * 0.85}
        stroke="hsl(var(--steami-cyan))" strokeWidth="0.4" opacity="0.1" strokeDasharray="2 4" />
    </svg>
  );
}

// ── Chemistry — molecular bonds ──
function ChemistrySvg({ size }: { size: number }) {
  const cx = size / 2, cy = size / 2;
  const nodes = [
    { x: cx, y: cy, r: 3.5 },
    { x: cx - size * 0.25, y: cy - size * 0.15, r: 2.5 },
    { x: cx + size * 0.25, y: cy - size * 0.18, r: 2.5 },
    { x: cx - size * 0.2, y: cy + size * 0.22, r: 2 },
    { x: cx + size * 0.22, y: cy + size * 0.2, r: 2 },
    { x: cx + size * 0.38, y: cy + size * 0.05, r: 1.8 },
  ];
  const bonds: [number, number][] = [[0,1],[0,2],[0,3],[0,4],[2,5]];
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} fill="none">
      {bonds.map(([a, b], i) => (
        <line key={i} x1={nodes[a].x} y1={nodes[a].y} x2={nodes[b].x} y2={nodes[b].y}
          stroke="hsl(var(--steami-orange))" strokeWidth="0.8" opacity="0.25"
          strokeDasharray="3 2"
          style={{ animation: `svg-dash 3.5s linear infinite`, strokeDashoffset: 5 }} />
      ))}
      {nodes.map((n, i) => (
        <circle key={i} cx={n.x} cy={n.y} r={n.r}
          fill={i === 0 ? 'hsl(var(--steami-orange))' : 'hsl(var(--steami-gold))'}
          opacity={i === 0 ? 0.7 : 0.5}
          style={{ animation: `svg-pulse ${2.5 + i * 0.3}s ease-in-out infinite` }} />
      ))}
      {/* Electron cloud */}
      <circle cx={cx} cy={cy} r={size * 0.12}
        stroke="hsl(var(--steami-orange))" strokeWidth="0.5" opacity="0.12"
        style={{ animation: 'svg-pulse 4s ease-in-out infinite' }} />
    </svg>
  );
}

// ── Biology — DNA helix ──
function BiologySvg({ size }: { size: number }) {
  const h = size, w = size, points = 8;
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} fill="none">
      {Array.from({ length: points }).map((_, i) => {
        const y = (h / (points + 1)) * (i + 1);
        const offset = Math.sin((i / points) * Math.PI * 2) * w * 0.22;
        const x1 = w / 2 + offset, x2 = w / 2 - offset;
        return (
          <g key={i}>
            <line x1={x1} y1={y} x2={x2} y2={y}
              stroke="hsl(var(--steami-green))" strokeWidth="0.6" opacity="0.2" />
            <circle cx={x1} cy={y} r={1.8} fill="hsl(var(--steami-green))"
              style={{ animation: `svg-pulse ${2 + i * 0.3}s ease-in-out infinite` }} />
            <circle cx={x2} cy={y} r={1.8} fill="hsl(var(--steami-green))" opacity="0.5"
              style={{ animation: `svg-pulse ${2.5 + i * 0.3}s ease-in-out infinite` }} />
          </g>
        );
      })}
    </svg>
  );
}

// ── Medicine — heartbeat / pulse monitor ──
function MedicineSvg({ size }: { size: number }) {
  const cy = size / 2;
  const pulse = `M${size * 0.05} ${cy} L${size * 0.25} ${cy} L${size * 0.32} ${cy - size * 0.25} L${size * 0.4} ${cy + size * 0.18} L${size * 0.48} ${cy - size * 0.12} L${size * 0.55} ${cy} L${size * 0.95} ${cy}`;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} fill="none">
      {/* Background grid */}
      {[0.25, 0.5, 0.75].map((f, i) => (
        <line key={`h${i}`} x1={0} y1={size * f} x2={size} y2={size * f}
          stroke="hsl(var(--steami-red))" strokeWidth="0.3" opacity="0.08" />
      ))}
      {[0.25, 0.5, 0.75].map((f, i) => (
        <line key={`v${i}`} x1={size * f} y1={0} x2={size * f} y2={size}
          stroke="hsl(var(--steami-red))" strokeWidth="0.3" opacity="0.08" />
      ))}
      {/* Pulse line */}
      <path d={pulse} stroke="hsl(var(--steami-red))" strokeWidth="1.2" opacity="0.6"
        strokeLinecap="round" strokeLinejoin="round"
        strokeDasharray="120" strokeDashoffset="120"
        style={{ animation: 'svg-dash 2.5s ease-in-out infinite' }} />
      {/* Glow dot at peak */}
      <circle cx={size * 0.32} cy={cy - size * 0.25} r={2} fill="hsl(var(--steami-red))"
        style={{ animation: 'svg-pulse 2.5s ease-in-out infinite' }} />
    </svg>
  );
}

// ── AI — neural network ──
function AiSvg({ size }: { size: number }) {
  const cx = size / 2, cy = size / 2;
  const layers = [
    [{ x: cx - size * 0.3, y: cy - size * 0.2 }, { x: cx - size * 0.3, y: cy + size * 0.2 }],
    [{ x: cx, y: cy - size * 0.25 }, { x: cx, y: cy }, { x: cx, y: cy + size * 0.25 }],
    [{ x: cx + size * 0.3, y: cy - size * 0.15 }, { x: cx + size * 0.3, y: cy + size * 0.15 }],
  ];
  const connections: [number, number, number, number][] = [];
  for (let l = 0; l < layers.length - 1; l++)
    for (const a of layers[l]) for (const b of layers[l + 1]) connections.push([a.x, a.y, b.x, b.y]);
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} fill="none">
      {connections.map(([x1, y1, x2, y2], i) => (
        <line key={i} x1={x1} y1={y1} x2={x2} y2={y2}
          stroke="hsl(var(--steami-violet))" strokeWidth="0.6" opacity="0.2"
          strokeDasharray="4 3" style={{ animation: 'svg-dash 3s linear infinite', strokeDashoffset: 7 }} />
      ))}
      {layers.flat().map((n, i) => (
        <circle key={i} cx={n.x} cy={n.y} r={2.5} fill="hsl(var(--steami-violet))"
          style={{ animation: `svg-pulse ${2.5 + i * 0.4}s ease-in-out infinite` }} />
      ))}
    </svg>
  );
}

// ── Earth & Space — radar / signal rings ──
function SpaceSvg({ size }: { size: number }) {
  const cx = size / 2, cy = size / 2;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} fill="none">
      {[0.15, 0.25, 0.36].map((r, i) => (
        <circle key={i} cx={cx} cy={cy} r={size * r}
          stroke="hsl(var(--steami-violet))" strokeWidth="0.7" opacity={0.15 + i * 0.05}
          style={{ animation: `svg-pulse ${3 + i}s ease-in-out infinite` }} />
      ))}
      <line x1={cx} y1={cy} x2={cx + size * 0.35} y2={cy - size * 0.1}
        stroke="hsl(var(--steami-violet))" strokeWidth="1" opacity="0.4"
        style={{ animation: 'svg-rotate 8s linear infinite', transformOrigin: `${cx}px ${cy}px` }} />
      <circle cx={cx} cy={cy} r={2} fill="hsl(var(--steami-violet))" opacity="0.8" />
      {[{ x: cx - size * 0.3, y: cy - size * 0.28 }, { x: cx + size * 0.22, y: cy + size * 0.3 }, { x: cx + size * 0.35, y: cy - size * 0.32 }].map((s, i) => (
        <circle key={i} cx={s.x} cy={s.y} r={1} fill="hsl(var(--steami-violet))"
          style={{ animation: `svg-pulse ${2 + i * 0.8}s ease-in-out infinite` }} />
      ))}
    </svg>
  );
}

// ── Robotics — mechanical arm / joints ──
function RoboticsSvg({ size }: { size: number }) {
  const cx = size / 2, cy = size / 2;
  const joints = [
    { x: cx - size * 0.2, y: cy + size * 0.2 },
    { x: cx - size * 0.05, y: cy - size * 0.05 },
    { x: cx + size * 0.15, y: cy - size * 0.2 },
    { x: cx + size * 0.3, y: cy - size * 0.1 },
  ];
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} fill="none">
      {/* Arm segments */}
      {joints.slice(0, -1).map((j, i) => (
        <line key={i} x1={j.x} y1={j.y} x2={joints[i + 1].x} y2={joints[i + 1].y}
          stroke="hsl(var(--steami-orange))" strokeWidth="1.5" opacity="0.3"
          strokeLinecap="round" />
      ))}
      {/* Joints */}
      {joints.map((j, i) => (
        <g key={i}>
          <circle cx={j.x} cy={j.y} r={i === 0 ? 4 : 2.5}
            fill="hsl(var(--steami-orange))" opacity={0.6 - i * 0.1}
            style={{ animation: `svg-pulse ${3 + i * 0.4}s ease-in-out infinite` }} />
          <circle cx={j.x} cy={j.y} r={i === 0 ? 7 : 5}
            stroke="hsl(var(--steami-orange))" strokeWidth="0.5" opacity="0.15"
            style={{ animation: `svg-pulse ${3.5 + i * 0.3}s ease-in-out infinite` }} />
        </g>
      ))}
      {/* End effector */}
      <circle cx={joints[3].x + size * 0.06} cy={joints[3].y} r={1.5}
        fill="hsl(var(--steami-orange))" style={{ animation: 'svg-pulse 2s ease-in-out infinite' }} />
      <circle cx={joints[3].x + size * 0.06} cy={joints[3].y - 4} r={1.2}
        fill="hsl(var(--steami-orange))" opacity="0.5" style={{ animation: 'svg-pulse 2.3s ease-in-out infinite' }} />
    </svg>
  );
}

// ── Engineering — gear system ──
function EngineeringSvg({ size }: { size: number }) {
  const cx = size / 2, cy = size / 2;
  const teeth = 10;
  const gearPath = (gcx: number, gcy: number, inner: number, outer: number) => {
    let d = '';
    for (let i = 0; i < teeth; i++) {
      const a1 = (i / teeth) * Math.PI * 2;
      const a2 = ((i + 0.3) / teeth) * Math.PI * 2;
      const a3 = ((i + 0.5) / teeth) * Math.PI * 2;
      const a4 = ((i + 0.8) / teeth) * Math.PI * 2;
      d += `${i === 0 ? 'M' : 'L'}${gcx + Math.cos(a1) * inner} ${gcy + Math.sin(a1) * inner} `;
      d += `L${gcx + Math.cos(a2) * outer} ${gcy + Math.sin(a2) * outer} `;
      d += `L${gcx + Math.cos(a3) * outer} ${gcy + Math.sin(a3) * outer} `;
      d += `L${gcx + Math.cos(a4) * inner} ${gcy + Math.sin(a4) * inner} `;
    }
    return d + 'Z';
  };
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} fill="none">
      <path d={gearPath(cx - size * 0.1, cy, size * 0.12, size * 0.18)}
        stroke="hsl(var(--steami-gold))" strokeWidth="0.7" opacity="0.3"
        style={{ animation: 'svg-rotate 10s linear infinite', transformOrigin: `${cx - size * 0.1}px ${cy}px` }} />
      <path d={gearPath(cx + size * 0.18, cy - size * 0.05, size * 0.08, size * 0.13)}
        stroke="hsl(var(--steami-gold))" strokeWidth="0.6" opacity="0.25"
        style={{ animation: 'svg-rotate 8s linear infinite reverse', transformOrigin: `${cx + size * 0.18}px ${cy - size * 0.05}px` }} />
      <circle cx={cx - size * 0.1} cy={cy} r={2} fill="hsl(var(--steami-gold))" opacity="0.6" />
      <circle cx={cx + size * 0.18} cy={cy - size * 0.05} r={1.5} fill="hsl(var(--steami-gold))" opacity="0.5" />
    </svg>
  );
}

// ── Mathematics & Data — flowing data grid ──
function MathDataSvg({ size }: { size: number }) {
  const cx = size / 2, cy = size / 2;
  const cols = 5, rows = 4;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} fill="none">
      {/* Grid dots */}
      {Array.from({ length: rows }).map((_, r) =>
        Array.from({ length: cols }).map((_, c) => {
          const x = size * 0.15 + (c / (cols - 1)) * size * 0.7;
          const y = size * 0.2 + (r / (rows - 1)) * size * 0.6;
          return (
            <circle key={`${r}-${c}`} cx={x} cy={y} r={1.2}
              fill="hsl(var(--steami-cyan))" opacity="0.25"
              style={{ animation: `svg-pulse ${2 + (r + c) * 0.3}s ease-in-out infinite` }} />
          );
        })
      )}
      {/* Data flow line */}
      <path d={`M${size * 0.15} ${size * 0.7} Q${cx} ${size * 0.3} ${size * 0.85} ${size * 0.45}`}
        stroke="hsl(var(--steami-cyan))" strokeWidth="0.8" opacity="0.3"
        strokeDasharray="50" strokeDashoffset="50"
        style={{ animation: 'svg-dash 4s linear infinite' }} />
      {/* Sigma symbol hint */}
      <text x={cx} y={cy} textAnchor="middle" dominantBaseline="central"
        fill="hsl(var(--steami-cyan))" fontSize={size * 0.18} opacity="0.12"
        fontFamily="serif">Σ</text>
    </svg>
  );
}

// ── Climate & Energy — fusion sun ──
function EnergySvg({ size }: { size: number }) {
  const cx = size / 2, cy = size / 2, rays = 8;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} fill="none">
      <circle cx={cx} cy={cy} r={size * 0.12} fill="hsl(var(--steami-gold))" opacity="0.3"
        style={{ animation: 'svg-pulse 2.5s ease-in-out infinite' }} />
      <circle cx={cx} cy={cy} r={size * 0.07} fill="hsl(var(--steami-gold))" opacity="0.7" />
      {Array.from({ length: rays }).map((_, i) => {
        const angle = (i / rays) * Math.PI * 2;
        return (
          <line key={i}
            x1={cx + Math.cos(angle) * size * 0.16} y1={cy + Math.sin(angle) * size * 0.16}
            x2={cx + Math.cos(angle) * size * 0.3} y2={cy + Math.sin(angle) * size * 0.3}
            stroke="hsl(var(--steami-gold))" strokeWidth="1" opacity="0.25"
            strokeLinecap="round"
            style={{ animation: `svg-pulse ${2 + i * 0.2}s ease-in-out infinite` }} />
        );
      })}
      <circle cx={cx} cy={cy} r={size * 0.35}
        stroke="hsl(var(--steami-gold))" strokeWidth="0.5" opacity="0.15"
        strokeDasharray="3 5" style={{ animation: 'svg-rotate 20s linear infinite', transformOrigin: `${cx}px ${cy}px` }} />
    </svg>
  );
}

// ── Computer Science — circuit board ──
function CompSciSvg({ size }: { size: number }) {
  const cx = size / 2, cy = size / 2;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} fill="none">
      <path d={`M${size * 0.15} ${cy} H${cx - 6} V${cy - size * 0.25} H${size * 0.75}`}
        stroke="hsl(var(--steami-red))" strokeWidth="0.8" opacity="0.25"
        strokeDasharray="4 3" style={{ animation: 'svg-dash 4s linear infinite', strokeDashoffset: 7 }} />
      <path d={`M${size * 0.2} ${cy + size * 0.2} H${cx} V${cy + size * 0.05} H${size * 0.8}`}
        stroke="hsl(var(--steami-red))" strokeWidth="0.8" opacity="0.2"
        strokeDasharray="4 3" style={{ animation: 'svg-dash 5s linear infinite', strokeDashoffset: 7 }} />
      {[
        { x: cx - 6, y: cy }, { x: cx, y: cy + size * 0.05 },
        { x: size * 0.75, y: cy - size * 0.25 }, { x: size * 0.8, y: cy + size * 0.05 },
      ].map((n, i) => (
        <rect key={i} x={n.x - 2.5} y={n.y - 2.5} width={5} height={5} rx={1}
          fill="hsl(var(--steami-red))"
          style={{ animation: `svg-pulse ${2 + i * 0.5}s ease-in-out infinite` }} />
      ))}
    </svg>
  );
}

// ── Fallback — generic pulsing network ──
function GenericSvg({ size }: { size: number }) {
  const cx = size / 2, cy = size / 2;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} fill="none">
      <circle cx={cx} cy={cy} r={size * 0.2}
        stroke="hsl(var(--steami-cyan))" strokeWidth="0.7" opacity="0.2"
        style={{ animation: 'svg-pulse 3s ease-in-out infinite' }} />
      <circle cx={cx} cy={cy} r={size * 0.33}
        stroke="hsl(var(--steami-cyan))" strokeWidth="0.5" opacity="0.12"
        style={{ animation: 'svg-pulse 4s ease-in-out infinite' }} />
      <circle cx={cx} cy={cy} r={2.5} fill="hsl(var(--steami-cyan))" opacity="0.6" />
    </svg>
  );
}

const fieldMap: Record<string, (props: { size: number }) => JSX.Element> = {
  'QUANTUM PHYSICS': QuantumSvg,
  'PHYSICS': PhysicsSvg,
  'CHEMISTRY': ChemistrySvg,
  'BIOLOGY': BiologySvg,
  'MEDICINE': MedicineSvg,
  'AI': AiSvg,
  'EARTH & SPACE': SpaceSvg,
  'ROBOTICS': RoboticsSvg,
  'ENGINEERING': EngineeringSvg,
  'MATHEMATICS & DATA': MathDataSvg,
  'CLIMATE & ENERGY': EnergySvg,
  'COMPUTER SCIENCE': CompSciSvg,
};

function CardSvgVisualInner({ field, variant = 'mini', className = '' }: CardSvgVisualProps) {
  const size = variant === 'mini' ? 56 : variant === 'featured' ? 80 : 64;
  const Component = fieldMap[field] || GenericSvg;
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setVisible(true); obs.disconnect(); } },
      { threshold: 0.3 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={`pointer-events-none select-none flex-shrink-0 ${className}`}
      style={{
        opacity: visible ? 0.85 : 0,
        transform: visible ? 'translateY(0) scale(1)' : 'translateY(8px) scale(0.92)',
        transition: 'opacity 0.5s cubic-bezier(.22,.68,0,1.2), transform 0.5s cubic-bezier(.22,.68,0,1.2)',
      }}
    >
      <Component size={size} />
    </div>
  );
}

export const CardSvgVisual = memo(CardSvgVisualInner);
