import { motion, useScroll, useTransform } from 'framer-motion';
import { useRef, useEffect, useState } from 'react';
import { useThemeStore } from '@/stores/theme-store';

export const IntelligenceVisual = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const isLight = useThemeStore((s) => s.theme === 'light');
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      setMousePos({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      });
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  const nodes = Array.from({ length: 15 }).map((_, i) => ({
    id: i,
    size: Math.random() * 4 + 2,
    x: Math.random() * 100,
    y: Math.random() * 100,
    duration: Math.random() * 10 + 10,
    delay: Math.random() * 5,
  }));

  return (
    <div ref={containerRef} className="relative w-full h-full min-h-[400px] md:min-h-[600px] flex items-center justify-center overflow-visible">
      {/* Background Glow - Refined for light mode depth */}
      <motion.div 
        className={`absolute w-[400px] h-[400px] blur-[100px] rounded-full transition-colors duration-1000 ${isLight ? 'bg-steami-cyan/25' : 'bg-steami-cyan/20'}`}
        animate={{
          x: (mousePos.x - 150) / 15,
          y: (mousePos.y - 150) / 15,
        }}
      />
      
      {/* Central Neural Core */}
      <div className="relative z-10 w-64 h-64 md:w-80 md:h-80 flex items-center justify-center">
        <motion.div
          className={`absolute inset-0 border-2 rounded-full transition-colors duration-700 ${isLight ? 'border-steami-cyan/30 shadow-[inset_0_0_20px_rgba(0,92,194,0.1)]' : 'border-steami-cyan/30'}`}
          animate={{ rotate: 360, scale: [1, 1.05, 1] }}
          transition={{ rotate: { duration: 20, repeat: Infinity, ease: "linear" }, scale: { duration: 4, repeat: Infinity } }}
        />
        <motion.div
          className={`absolute inset-4 border rounded-full transition-colors duration-700 ${isLight ? 'border-steami-gold/40' : 'border-steami-gold/20'}`}
          animate={{ rotate: -360 }}
          transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
        />
        
        {/* Core Nucleus - Enhanced with elevation and depth */}
        <div className={`w-16 h-16 bg-gradient-to-br from-steami-cyan to-steami-gold rounded-full blur-[0.5px] flex items-center justify-center transition-all duration-700 ${isLight ? 'shadow-[0_0_40px_rgba(0,92,194,0.4),_0_0_15px_rgba(0,92,194,0.2)] border border-white/40' : 'shadow-[0_0_30px_rgba(111,168,255,0.5)]'}`}>
          <motion.div 
            className={`w-12 h-12 rounded-full shadow-inner transition-colors duration-700 ${isLight ? 'bg-white/95' : 'bg-black'}`}
            animate={{ scale: [1, 0.9, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
          />
        </div>

        {/* Orbiting Nodes - Sharper edge definition for light mode */}
        {nodes.map((node, i) => (
          <motion.div
            key={i}
            className={`absolute rounded-full transition-all duration-700 ${isLight ? 'bg-steami-cyan shadow-[0_0_12px_rgba(0,92,194,0.5)] border border-white/30' : 'bg-steami-cyan shadow-[0_0_10px_rgba(111,168,255,0.8)]'}`}
            style={{
              width: node.size,
              height: node.size,
              left: `${node.x}%`,
              top: `${node.y}%`,
            }}
            animate={{
              x: [0, Math.random() * 40 - 20, 0],
              y: [0, Math.random() * 40 - 20, 0],
              opacity: isLight ? [0.6, 1, 0.6] : [0.3, 0.8, 0.3],
            }}
            transition={{
              duration: node.duration,
              repeat: Infinity,
              ease: "easeInOut",
              delay: node.delay,
            }}
          />
        ))}

        {/* Data Streams (SVG paths) - Better contrast in light mode */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none overflow-visible">
          <defs>
            <linearGradient id="streamGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="hsl(var(--steami-cyan))" stopOpacity="0" />
              <stop offset="50%" stopColor="hsl(var(--steami-cyan))" stopOpacity={isLight ? 0.7 : 0.5} />
              <stop offset="100%" stopColor="hsl(var(--steami-cyan))" stopOpacity="0" />
            </linearGradient>
          </defs>
          {Array.from({ length: 5 }).map((_, i) => (
            <motion.path
              key={i}
              d={`M ${Math.random() * 100} 0 Q ${Math.random() * 100} 50 ${Math.random() * 100} 100`}
              stroke="url(#streamGradient)"
              strokeWidth={isLight ? "1.5" : "1"}
              fill="none"
              initial={{ pathLength: 0, opacity: 0 }}
              animate={{ pathLength: 1, opacity: isLight ? [0, 0.5, 0] : [0, 0.3, 0] }}
              transition={{ duration: 3 + i, repeat: Infinity, ease: "linear", delay: i }}
            />
          ))}
        </svg>
      </div>

      {/* Floating Particles - Refined for "Scientific" clarity in light mode */}
      {Array.from({ length: 30 }).map((_, i) => (
        <motion.div
          key={`part-${i}`}
          className={`absolute w-1 h-1 rounded-full transition-colors duration-700 ${isLight ? 'bg-steami-cyan/40 shadow-[0_0_4px_rgba(0,92,194,0.2)]' : 'bg-white/20'}`}
          style={{
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
          }}
          animate={{
            y: [-20, 20],
            opacity: isLight ? [0, 0.4, 0] : [0, 0.5, 0],
          }}
          transition={{
            duration: Math.random() * 5 + 5,
            repeat: Infinity,
            ease: "easeInOut",
            delay: Math.random() * 5,
          }}
        />
      ))}
    </div>
  );
};
