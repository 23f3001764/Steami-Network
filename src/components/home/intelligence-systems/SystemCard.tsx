import { useState } from 'react';
import { motion } from 'framer-motion';
import { useThemeStore } from '@/stores/theme-store';
import { GraphPreview } from './GraphPreview';
import { useSteamiHover } from '@/hooks/use-steami-hover';
import { cn } from '@/lib/utils';

interface SystemCardProps {
  title: string;
  explanation: string;
  image: string;
  color: 'steami-cyan' | 'steami-gold';
  index: number;
}

export const SystemCard = ({ title, explanation, image, color, index }: SystemCardProps) => {
  const [isHovered, setIsHovered] = useState(false);
  const isLight = useThemeStore((s) => s.theme === 'light');
  const hoverRef = useSteamiHover({ tilt: true, mouseGlow: true });

  const colorHex = color === 'steami-cyan' ? 'var(--steami-cyan-hex)' : 'var(--steami-gold-hex)';

  return (
    <motion.div
      ref={hoverRef}
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.15, duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      data-tilt="true"
      data-hover-depth="strong"
      className={cn(
        "group relative flex flex-col h-full rounded-2xl glass-card steami-hover-card transition-all duration-500",
        isLight ? "bg-white/40 border-zinc-200/50" : ""
      )}
    >
      <div className="steami-mouse-glow" />
      {/* TOP: Large graph/map preview */}
      <div className="relative h-[280px] w-full overflow-hidden border-b border-white/5">
        <GraphPreview image={image} isHovered={isHovered} color={color} />
      </div>

      {/* Content Area */}
      <div className={`flex flex-col flex-1 p-8 ${isLight ? 'bg-white/60' : 'bg-white/[0.03]'}`}>
        {/* MIDDLE: System title */}
        <div className="flex items-center gap-3 mb-4">
          <div 
            className="w-1.5 h-6 rounded-full" 
            style={{ 
              backgroundColor: colorHex,
              boxShadow: isHovered ? `0 0 10px ${colorHex}` : 'none',
              transition: 'all 0.4s'
            }} 
          />
          <h3 className={`font-serif text-2xl font-bold tracking-tight transition-colors duration-400 ${isLight ? 'text-zinc-900' : 'text-white'}`}>
            {title}
          </h3>
        </div>

        {/* BOTTOM: Short explanation */}
        <p className={`text-[15px] leading-relaxed mb-8 flex-1 transition-colors duration-400 ${isLight ? 'text-zinc-700' : 'text-white/70'}`}>
          {explanation}
        </p>

        {/* CTA: View System */}
        <div className="mt-auto">
          <motion.button
            animate={{ x: isHovered ? 5 : 0 }}
            className={`flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.2em] font-bold transition-all duration-400`}
            style={{ color: isHovered ? colorHex : (isLight ? 'hsl(var(--zinc-500))' : 'rgba(255,255,255,0.6)') }}
          >
            View System <span className="text-[14px]">→</span>
          </motion.button>
        </div>
      </div>

      {/* Hover Ambient Glow (External) */}
      {isHovered && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="absolute -inset-1 z-[-1] blur-2xl opacity-20 pointer-events-none"
          style={{ background: colorHex }}
        />
      )}
    </motion.div>
  );
};
