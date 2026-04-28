import React, { useEffect, useRef } from 'react';
import { useThemeStore } from '@/stores/theme-store';

class Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  size: number;
  color: string;
  glowColor: string;
  isLight: boolean;

  constructor(x: number, y: number, isLight: boolean) {
    this.x = x;
    this.y = y;
    this.isLight = isLight;
    
    // Slight randomness in velocity
    this.vx = (Math.random() - 0.5) * 1.5;
    this.vy = (Math.random() - 0.5) * 1.5;
    
    // Life determines how long it stays and its opacity
    this.maxLife = Math.random() * 30 + 40; // 40-70 frames
    this.life = this.maxLife;
    
    // Size based on theme
    this.size = isLight ? Math.random() * 2 + 1 : Math.random() * 1.5 + 0.5;

    // Colors
    if (isLight) {
      // Light Mode: Soft pastel blue/purple
      const hues = [210, 240, 260];
      const hue = hues[Math.floor(Math.random() * hues.length)];
      this.color = `hsl(${hue}, 80%, 70%)`;
      this.glowColor = `hsla(${hue}, 80%, 70%, 0.4)`;
    } else {
      // Dark Mode: Soft white to subtle gold/yellow
      const isGold = Math.random() > 0.7;
      if (isGold) {
        this.color = '#FDE047'; // yellow-300
        this.glowColor = 'rgba(253, 224, 71, 0.4)';
      } else {
        this.color = '#FFFFFF';
        this.glowColor = 'rgba(255, 255, 255, 0.3)';
      }
    }
  }

  update() {
    this.x += this.vx;
    this.y += this.vy;
    this.life -= 1;
    
    // Add slight upward drift
    this.vy -= 0.02;
  }

  draw(ctx: CanvasRenderingContext2D) {
    const progress = this.life / this.maxLife;
    const opacity = progress;
    
    ctx.globalAlpha = opacity;
    
    // Draw glow (halo)
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.size * 3, 0, Math.PI * 2);
    ctx.fillStyle = this.glowColor;
    ctx.fill();
    
    // Draw core particle
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
    ctx.fillStyle = this.color;
    ctx.fill();
    
    ctx.globalAlpha = 1; // Reset
  }
}

export function CursorEffect() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const theme = useThemeStore((s) => s.theme);
  const isLight = theme === 'light';
  
  const particles = useRef<Particle[]>([]);
  const mousePos = useRef({ x: -100, y: -100 });
  const isMoving = useRef(false);
  const animationFrameId = useRef<number>();

  useEffect(() => {
    // Disable on touch devices
    const isTouchDevice = 
      'ontouchstart' in window || 
      navigator.maxTouchPoints > 0 || 
      window.matchMedia('(hover: none) and (pointer: coarse)').matches;
      
    if (isTouchDevice) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) return;

    // Handle resizing
    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', resizeCanvas);
    resizeCanvas();

    // Mouse events
    let throttleTimeout: any = null;
    const handleMouseMove = (e: MouseEvent) => {
      mousePos.current = { x: e.clientX, y: e.clientY };
      isMoving.current = true;
      
      // Throttle adding particles to avoid overwhelming the canvas
      if (!throttleTimeout) {
        throttleTimeout = setTimeout(() => {
          if (particles.current.length < 100) { // Limit particle count
            particles.current.push(new Particle(mousePos.current.x, mousePos.current.y, isLight));
          }
          throttleTimeout = null;
        }, 16); // roughly 60fps addition rate
      }
    };
    
    window.addEventListener('mousemove', handleMouseMove);

    // Animation Loop
    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // Update and draw particles
      particles.current = particles.current.filter((p) => {
        p.update();
        p.draw(ctx);
        return p.life > 0;
      });
      
      animationFrameId.current = requestAnimationFrame(render);
    };
    
    render();

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      window.removeEventListener('mousemove', handleMouseMove);
      if (throttleTimeout) clearTimeout(throttleTimeout);
      if (animationFrameId.current) cancelAnimationFrame(animationFrameId.current);
    };
  }, [isLight]);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-[9999]"
      style={{
        width: '100vw',
        height: '100vh',
      }}
      aria-hidden="true"
    />
  );
}
