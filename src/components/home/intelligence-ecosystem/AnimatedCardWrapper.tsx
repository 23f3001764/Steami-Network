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
  const cardRef = useRef<HTMLDivElement>(null);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    setMousePos({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    });
  };

  return (
    <motion.div
      ref={cardRef}
      initial={{ opacity: 0, y: 80, scale: 0.94, filter: "blur(10px)" }}
      whileInView={{ opacity: 1, y: 0, scale: 1, filter: "blur(0px)" }}
      viewport={{ once: true, margin: "-100px" }}
      transition={{
        duration: 0.8,
        delay: index * 0.1,
        ease: [0.21, 0.45, 0.32, 0.9],
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onMouseMove={handleMouseMove}
      className="relative group h-full shrink-0 snap-start"
    >
      {/* Interaction Layer: Ambient Glow */}
      <motion.div
        className="absolute inset-[-20px] pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-[30px] z-0"
        style={{
          background: isLight
            ? `radial-gradient(400px circle at ${mousePos.x}px ${mousePos.y}px, rgba(147, 197, 253, 0.15), transparent 70%)`
            : `radial-gradient(400px circle at ${mousePos.x}px ${mousePos.y}px, rgba(111, 168, 255, 0.1), transparent 70%)`,
        }}
      />

      {/* Border Lighting Effect */}
      <motion.div
        className="absolute inset-0 z-10 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-[14px]"
        style={{
          border: isLight ? "1px solid rgba(147, 197, 253, 0.4)" : "1px solid rgba(111, 168, 255, 0.3)",
          boxShadow: isHovered 
            ? (isLight ? "0 0 20px rgba(147, 197, 253, 0.2)" : "0 0 25px rgba(111, 168, 255, 0.15)") 
            : "none",
        }}
      />

      {/* Main Content Scaling */}
      <motion.div
        animate={{ scale: isHovered ? 1.02 : 1 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="relative z-20 h-full"
      >
        {children}
      </motion.div>
    </motion.div>
  );
};
