import { motion } from 'framer-motion';
import { ReactNode, useState, useRef, useEffect } from 'react';
import { useThemeStore } from '@/stores/theme-store';

interface AnimatedCardWrapperProps {
  children: ReactNode;
  index: number;
}

export const AnimatedCardWrapper = ({ children, index }: AnimatedCardWrapperProps) => {
  const isLight = useThemeStore((s) => s.theme === 'light');
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [isHovered, setIsHovered] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);
  
  // Safe mobile/touch pointer detection
  const [supportsHover, setSupportsHover] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const mediaQuery = window.matchMedia('(hover: hover) and (pointer: fine)');
    setSupportsHover(mediaQuery.matches);
    
    const handler = (e: MediaQueryListEvent) => setSupportsHover(e.matches);
    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, []);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current || !supportsHover) return;
    const rect = cardRef.current.getBoundingClientRect();
    setMousePos({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    });
  };

  const isActive = (isHovered || isFocused) && supportsHover;

  return (
    <motion.div
      ref={cardRef}
      initial={{ opacity: 0, y: 40, scale: 0.97, filter: "blur(4px)" }}
      whileInView={{ opacity: 1, y: 0, scale: 1, filter: "blur(0px)" }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{
        duration: 0.5,
        delay: Math.min(index * 0.08, 0.35), // Cap delay for smoother entry
        ease: [0.25, 1, 0.5, 1], // easeOutQuart
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onMouseMove={handleMouseMove}
      onFocusCapture={() => setIsFocused(true)}
      onBlurCapture={() => setIsFocused(false)}
      className="relative group h-full shrink-0 snap-start py-4 px-2 select-none"
      style={{
        zIndex: isActive ? 30 : 10,
        transition: 'z-index 0.15s ease',
      }}
    >
      {/* Interaction Layer: Scoped CSS for nested cards */}
      <style>{`
        .eco-card-inner .glass-card {
          transition: border-color 0.3s ease, box-shadow 0.3s ease, background-color 0.3s ease !important;
          transform: none !important;
          box-shadow: none !important;
        }
        .eco-card-inner .glass-card:hover {
          transform: none !important;
          box-shadow: none !important;
        }
        @media (prefers-reduced-motion: reduce) {
          .eco-card-inner, .eco-card-glow, .eco-card-border {
            animation: none !important;
            transition-duration: 0.01ms !important;
            transform: none !important;
          }
        }
      `}</style>

      {/* Interaction Layer: Ambient Glow (behind the card) */}
      {isActive && (
        <motion.div
          className="eco-card-glow absolute inset-[-8px] pointer-events-none rounded-[24px] z-0"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          style={{
            background: isLight
              ? `radial-gradient(300px circle at ${mousePos.x}px ${mousePos.y}px, rgba(147, 197, 253, 0.12), transparent 70%)`
              : `radial-gradient(300px circle at ${mousePos.x}px ${mousePos.y}px, rgba(111, 168, 255, 0.08), transparent 70%)`,
          }}
        />
      )}

      {/* Border Lighting Effect */}
      {isActive && (
        <motion.div
          className="eco-card-border absolute inset-2 z-10 pointer-events-none rounded-[16px]"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          style={{
            border: isLight ? "1px solid rgba(147, 197, 253, 0.3)" : "1px solid rgba(111, 168, 255, 0.2)",
            boxShadow: isLight 
              ? "0 10px 30px rgba(0, 40, 100, 0.06), 0 1px 3px rgba(0, 0, 0, 0.02)" 
              : "0 12px 35px rgba(0, 0, 0, 0.4), 0 0 20px rgba(111, 168, 255, 0.05)",
          }}
        />
      )}

      {/* Main Content Scaling & Lift */}
      <motion.div
        animate={{ 
          scale: isActive ? 1.025 : 1,
          y: isActive ? -4 : 0,
        }}
        transition={{ 
          duration: 0.3, 
          ease: [0.25, 1, 0.5, 1], // easeOutQuart
        }}
        className="relative z-20 h-full eco-card-inner"
      >
        {children}
      </motion.div>
    </motion.div>
  );
};
