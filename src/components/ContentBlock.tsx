import { motion } from 'framer-motion';
import { useThemeStore } from '@/stores/theme-store';
import type { ReactNode } from 'react';

interface ContentBlockProps {
  icon: ReactNode;
  label: string;
  /** Semantic token color class, e.g. "text-steami-gold" */
  colorClass: string;
  children: ReactNode;
  delay?: number;
  /** Optional visual variant */
  variant?: 'default' | 'inset';
  className?: string;
}

/**
 * Reusable article section block with icon, label, and themed background.
 */
export function ContentBlock({
  icon,
  label,
  colorClass,
  children,
  delay = 0,
  variant = 'default',
  className = '',
}: ContentBlockProps) {
  const isLight = useThemeStore((s) => s.theme === 'light');

  const insetStyle =
    variant === 'inset'
      ? {
          background: isLight ? 'rgba(224, 242, 254, 0.4)' : 'rgba(99, 179, 237, 0.04)',
          border: isLight ? '1px solid rgba(147, 197, 253, 0.3)' : '1px solid rgba(99, 179, 237, 0.1)',
        }
      : {};

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className={`mb-7 ${variant === 'inset' ? 'rounded-lg p-5' : ''} ${className}`}
      style={insetStyle}
    >
      <div className="flex items-center gap-2 mb-3">
        <span className={colorClass}>{icon}</span>
        <h3 className={`font-mono text-[16px] tracking-wider uppercase ${colorClass}`}>{label}</h3>
      </div>
      <div className="text-[18px] font-medium leading-relaxed text-foreground/80">{children}</div>
    </motion.div>
  );
}
