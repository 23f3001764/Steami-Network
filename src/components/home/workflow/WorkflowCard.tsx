import { motion } from 'framer-motion';
import { LucideIcon } from 'lucide-react';
import { useThemeStore } from '@/stores/theme-store';
import { useSteamiHover } from '@/hooks/use-steami-hover';
import { cn } from '@/lib/utils';

interface WorkflowCardProps {
  step: string;
  title: string;
  description: string;
  icon: LucideIcon;
  index: number;
  color: string;
}

export const WorkflowCard = ({ step, title, description, icon: Icon, index, color }: WorkflowCardProps) => {
  const isLight = useThemeStore((s) => s.theme === 'light');
  const hoverRef = useSteamiHover({ mouseGlow: true });

  return (
    <motion.div
      initial={{ opacity: 0, y: 30, scale: 0.95 }}
      whileInView={{ opacity: 1, y: 0, scale: 1 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ 
        duration: 0.6, 
        delay: index * 0.1, 
        ease: [0.21, 0.47, 0.32, 0.98] 
      }}
      className="group relative"
    >
      <div 
        ref={hoverRef}
        className={cn(
          "relative z-10 h-full p-8 rounded-2xl border transition-all duration-500 glass-card steami-hover-card",
          isLight ? 'bg-white/40 border-zinc-200/50 shadow-sm' : 'bg-white/[0.03] border-white/5 shadow-2xl'
        )}
      >
        <div className="steami-mouse-glow" />
        {/* Step Indicator */}
        <div className="flex items-center justify-between mb-6">
          <div className={`
            w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-500 group-hover:scale-110
            ${isLight 
              ? `bg-${color}/5 border-${color}/20 text-${color}` 
              : `bg-${color}/10 border-${color}/20 text-${color} shadow-[0_0_15px_rgba(var(--${color}-rgb),0.1)]`
            }
            border
          `}>
            <Icon className="w-6 h-6" />
          </div>
          <span className={`font-mono text-[10px] tracking-[0.3em] uppercase ${isLight ? 'text-zinc-400' : 'text-muted-foreground/40'}`}>
            STEP {step}
          </span>
        </div>

        {/* Content */}
        <h3 className={`font-serif text-xl font-bold mb-3 transition-colors duration-300 ${isLight ? 'text-zinc-900' : 'text-white group-hover:text-steami-cyan'}`}>
          {title}
        </h3>
        <p className={`text-sm leading-relaxed transition-colors duration-300 ${isLight ? 'text-zinc-600' : 'text-muted-foreground group-hover:text-white/70'}`}>
          {description}
        </p>

        {/* Subtle Decorative Element */}
        <div className={`absolute bottom-4 right-4 w-1 h-1 rounded-full transition-all duration-500 opacity-0 group-hover:opacity-100 group-hover:scale-[8] ${isLight ? `bg-${color}/20` : `bg-${color}/40`}`} />
      </div>

    </motion.div>
  );
};
