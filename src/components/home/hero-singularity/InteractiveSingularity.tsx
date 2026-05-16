import React, { useEffect, useRef, useState, useMemo } from 'react';
import { useThemeStore } from '@/stores/theme-store';
import { useSingularity } from './HeroElementDistortionProvider';

/**
 * Particle Class
 * Represents a single orbital mass with physics and theme-awareness.
 */
class Particle {
  angle: number;
  radius: number;
  baseRadius: number;
  size: number;
  rotation: number;
  rotationSpeed: number;
  jitterFreq: number;
  jitterAmount: number;
  opacity: number;
  baseOpacity: number;

  constructor(radius: number, index: number) {
    this.angle = Math.random() * Math.PI * 2;
    this.baseRadius = radius;
    this.radius = radius * (0.95 + Math.random() * 0.1); // Slight eccentricity
    this.size = 1 + Math.random() * 2.5;
    this.rotation = Math.random() * Math.PI * 2;
    this.rotationSpeed = (Math.random() - 0.5) * 0.05;
    this.jitterFreq = 0.001 + Math.random() * 0.002;
    this.jitterAmount = 1 + Math.random() * 3;
    
    // Opacity based on ring depth
    const ringDepth = Math.min(index / 4, 1);
    this.baseOpacity = 0.3 + (1 - ringDepth) * 0.4;
    this.opacity = this.baseOpacity;
  }

  update(deltaTime: number, velocity: number, isWaveActive: boolean) {
    this.angle += velocity * (deltaTime / 16);
    this.rotation += this.rotationSpeed * (deltaTime / 16);
    
    // Animate opacity during wave impact
    const targetOpacity = isWaveActive ? Math.min(this.baseOpacity + 0.3, 1) : this.baseOpacity;
    this.opacity += (targetOpacity - this.opacity) * 0.1;
  }

  draw(ctx: CanvasRenderingContext2D, centerX: number, centerY: number, isLight: boolean, isWaveActive: boolean) {
    const time = Date.now();
    const x = centerX + Math.cos(this.angle) * this.radius + Math.sin(time * this.jitterFreq) * this.jitterAmount;
    const y = centerY + Math.sin(this.angle) * this.radius + Math.cos(time * this.jitterFreq) * this.jitterAmount;
    
    const scale = isWaveActive ? 1.2 : 1;
    const finalSize = this.size * scale;

    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(this.rotation);
    
    if (isLight) {
      // Black Hole Mode: Dark Charcoal particles
      ctx.fillStyle = `rgba(40, 40, 40, ${this.opacity})`;
      ctx.shadowBlur = 2;
      ctx.shadowColor = 'rgba(0,0,0,0.1)';
    } else {
      // White Hole Mode: Cream/White particles with golden glow
      ctx.fillStyle = `rgba(255, 255, 240, ${this.opacity})`;
      ctx.shadowBlur = 4;
      ctx.shadowColor = 'rgba(255, 215, 0, 0.3)';
    }
    
    ctx.fillRect(-finalSize / 2, -finalSize / 2, finalSize, finalSize);
    ctx.restore();
  }
}

class Ring {
  particles: Particle[] = [];
  velocity: number;

  constructor(radius: number, count: number, index: number) {
    // Keplerian-inspired velocity: Inner rings move faster (v ∝ 1/√r)
    const baseRadius = 120;
    const baseVelocity = 0.015;
    this.velocity = baseVelocity / Math.sqrt(radius / baseRadius);
    
    for (let i = 0; i < count; i++) {
      this.particles.push(new Particle(radius, index));
    }
  }

  update(deltaTime: number, isWaveActive: boolean) {
    this.particles.forEach(p => p.update(deltaTime, this.velocity, isWaveActive));
  }

  draw(ctx: CanvasRenderingContext2D, centerX: number, centerY: number, isLight: boolean, isWaveActive: boolean) {
    this.particles.forEach(p => p.draw(ctx, centerX, centerY, isLight, isWaveActive));
  }
}

export const InteractiveSingularity = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const isLight = useThemeStore((s) => s.theme === 'light');
  const { waveCount, isEmitting } = useSingularity();
  const [waveIds, setWaveIds] = useState<number[]>([]);
  
  const ringsRef = useRef<Ring[]>([]);
  const requestRef = useRef<number>();
  const lastTimeRef = useRef<number>(0);

  // Initialize Rings based on viewport
  useEffect(() => {
    const handleResize = () => {
      if (!containerRef.current || !canvasRef.current) return;
      
      const width = containerRef.current.clientWidth;
      const height = containerRef.current.clientHeight;
      canvasRef.current.width = width * window.devicePixelRatio;
      canvasRef.current.height = height * window.devicePixelRatio;
      canvasRef.current.style.width = `${width}px`;
      canvasRef.current.style.height = `${height}px`;

      // Responsive configuration
      let ringRadii = [120, 200, 280, 360];
      let particleMultiplier = 1;
      
      if (width < 480) {
        ringRadii = [80, 140];
        particleMultiplier = 0.5;
      } else if (width < 768) {
        ringRadii = [100, 170, 240];
        particleMultiplier = 0.8;
      }

      ringsRef.current = ringRadii.map((radius, i) => 
        new Ring(radius, Math.floor(100 * particleMultiplier), i)
      );
    };

    window.addEventListener('resize', handleResize);
    handleResize();

    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Animation Loop
  useEffect(() => {
    const animate = (time: number) => {
      if (!canvasRef.current) return;
      const ctx = canvasRef.current.getContext('2d');
      if (!ctx) return;

      const deltaTime = time - lastTimeRef.current;
      lastTimeRef.current = time;

      // Clear Canvas
      ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
      ctx.save();
      ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
      
      const centerX = canvasRef.current.width / (2 * window.devicePixelRatio);
      const centerY = canvasRef.current.height / (2 * window.devicePixelRatio);

      // Update and Draw Rings
      ringsRef.current.forEach(ring => {
        ring.update(deltaTime, isEmitting);
        ring.draw(ctx, centerX, centerY, isLight, isEmitting);
      });

      ctx.restore();
      requestRef.current = requestAnimationFrame(animate);
    };

    requestRef.current = requestAnimationFrame(animate);
    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, [isLight, isEmitting]);

  // Sync SVG waves with context
  useEffect(() => {
    if (waveCount > 0) {
      setWaveIds(prev => [...prev.slice(-4), Date.now()]);
    }
  }, [waveCount]);

  return (
    <div ref={containerRef} className="relative w-full h-full flex items-center justify-center select-none pointer-events-none overflow-visible">
      {/* ── Layer 1: Ambient Depth Glow ── */}
      <div 
        className={`absolute inset-0 rounded-full blur-[120px] transition-all duration-1000 opacity-30 ${
          isLight ? 'bg-steami-cyan/40 scale-110' : 'bg-steami-gold/30 scale-125'
        }`} 
      />

      {/* ── Layer 2: Particle Ring Canvas ── */}
      <canvas 
        ref={canvasRef}
        className="absolute inset-0 z-10 will-change-transform opacity-80"
        style={{ transform: 'translateZ(0)' }}
      />

      {/* ── Layer 3: Static Concentric Rotation Rings (Background) ── */}
      <div className="absolute inset-0 flex items-center justify-center overflow-visible z-0">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className={`absolute rounded-full border border-dashed transition-all duration-1000 ${
              isLight ? 'border-steami-cyan/5' : 'border-white/5'
            }`}
            style={{
              width: `clamp(${120 + i * 120}px, ${20 + i * 20}vw, ${400 + i * 150}px)`,
              height: `clamp(${120 + i * 120}px, ${20 + i * 20}vw, ${400 + i * 150}px)`,
              animation: `spin ${30 + i * 15}s linear infinite ${i % 2 === 0 ? '' : 'reverse'}`,
            }}
          />
        ))}
      </div>

      {/* ── Layer 4: Radial Wave Propagation (SVG) ── */}
      <svg className="absolute inset-0 w-full h-full overflow-visible z-20" viewBox="0 0 100 100">
        {waveIds.map(id => (
          <circle
            key={id}
            cx="50"
            cy="50"
            r="0"
            fill="none"
            stroke={isLight ? 'rgba(111,168,255,0.4)' : 'rgba(255,255,255,0.3)'}
            strokeWidth="0.2"
            className="animate-celestial-ripple"
          />
        ))}
      </svg>

      {/* ── Layer 5: Core Celestial Body ── */}
      <div className="relative flex items-center justify-center group z-30">
        <div 
          className={`relative w-40 h-40 md:w-52 md:h-52 rounded-full transition-all duration-1000 ${
            isLight 
              ? 'bg-zinc-950 shadow-[0_0_80px_rgba(0,0,0,0.9),inset_0_0_40px_rgba(111,168,255,0.1)]' 
              : 'bg-white shadow-[0_0_100px_rgba(255,255,255,0.95),0_0_160px_rgba(232,184,75,0.4)]'
          }`}
        >
          <div className={`absolute inset-0 rounded-full blur-[4px] opacity-30 animate-pulse ${
            isLight ? 'bg-steami-cyan' : 'bg-steami-gold'
          }`} />
          <div className={`absolute inset-[2%] rounded-full ${
            isLight ? 'bg-zinc-950' : 'bg-white'
          }`} />
        </div>

        <div 
          className={`absolute w-[150%] h-[1px] md:h-[2px] transition-all duration-1000 blur-[1px] rotate-[25deg] ${
            isLight ? 'bg-gradient-to-r from-transparent via-steami-gold to-transparent' : 'bg-gradient-to-r from-transparent via-steami-cyan to-transparent'
          }`}
          style={{ opacity: 0.6 }}
        />
        
        <div 
          className={`absolute w-[110%] h-[110%] rounded-full border transition-all duration-1000 blur-[2px] animate-pulse ${
            isLight ? 'border-steami-gold/20' : 'border-steami-cyan/20'
          }`} 
        />
      </div>

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .animate-celestial-ripple {
          animation: celestial-ripple 6s cubic-bezier(0, 0.2, 0.8, 1) forwards;
        }
        @keyframes celestial-ripple {
          0% { r: 0; opacity: 0.8; stroke-width: 1; }
          100% { r: 120; opacity: 0; stroke-width: 0.1; }
        }
        @media (prefers-reduced-motion: reduce) {
          .animate-celestial-ripple, [style*="animation: spin"] {
            animation: none !important;
          }
        }
      `}</style>
    </div>
  );
};

