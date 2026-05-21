import React from 'react';
import { motion } from 'framer-motion';
import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TickerItemProps {
  icon: LucideIcon;
  label: string;
  trend?: {
    value:     string;
    isUp:      boolean;
    symbol?:   string;  // custom direction symbol from node (↑↓→← etc.)
    color?:    string;  // custom hex color from node
    emoji?:    string;  // optional emoji prefix
  };
  className?: string;
}

export const TickerItem: React.FC<TickerItemProps> = ({
  icon: Icon,
  label,
  trend,
  className,
}) => {
  // Use the custom symbol if provided, otherwise fall back to ↑ / ↓
  const symbol     = trend?.symbol ?? (trend?.isUp ? '↑' : '↓');
  const customColor = trend?.color;   // e.g. "#00d9ff" or undefined

  return (
    <motion.div
      whileHover={{ scale: 1.02, y: -2 }}
      className={cn(
        'flex items-center gap-4 px-6 py-3 mx-4 whitespace-nowrap rounded-full transition-all duration-300 group',
        'bg-white/80 border border-slate-200 shadow-sm hover:shadow-md hover:border-cyan-500/30',
        'dark:bg-white/5 dark:border-white/10 dark:shadow-lg dark:hover:shadow-cyan-500/10 dark:hover:border-cyan-500/50',
        'backdrop-blur-md',
        className,
      )}
    >
      {/* Left: Icon + pulse ring */}
      <div className="relative flex items-center justify-center w-4 h-4 shrink-0">
        <div className="absolute inset-0 bg-cyan-500/20 rounded-full animate-pulse group-hover:bg-cyan-500/40" />
        <Icon className="w-4 h-4 text-cyan-500 dark:text-cyan-400 relative z-10" />
      </div>

      {/* Center: Label */}
      <span className="text-sm font-medium tracking-wide text-slate-700 dark:text-slate-200 group-hover:text-cyan-600 dark:group-hover:text-cyan-300 transition-colors">
        {trend?.emoji && <span className="mr-1">{trend.emoji}</span>}
        {label}
      </span>

      {/* Right: Trend badge — custom colour if provided, else green/red */}
      {trend && (
        <div
          className={cn(
            'flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-md shrink-0',
            !customColor && (trend.isUp ? 'text-emerald-500 bg-emerald-500/10' : 'text-rose-500 bg-rose-500/10'),
          )}
          style={customColor ? {
            color:      customColor,
            background: `${customColor}18`,
          } : undefined}
        >
          <span>{symbol}</span>
          {trend.value && <span>{trend.value}</span>}
        </div>
      )}
    </motion.div>
  );
};
