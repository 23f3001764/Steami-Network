import { motion } from 'framer-motion';
import { useThemeStore } from '@/stores/theme-store';

interface CardMediaProps {
  src: string;
  alt: string;
  /** Field badge color name for accent styling */
  badgeColor?: string;
  /** Aspect ratio height — defaults to 200 */
  height?: number;
  /** Children overlay (badges, share buttons) */
  children?: React.ReactNode;
  className?: string;
}

/**
 * Reusable image window container for explainer cards.
 * Provides hover-zoom, inner shadow, gradient fade, and glow border.
 */
export function CardMedia({
  src,
  alt,
  height = 200,
  children,
  className = '',
}: CardMediaProps) {
  const isLight = useThemeStore((s) => s.theme === 'light');

  return (
    <div className={`relative overflow-hidden ${className}`} style={{ height }}>
      <motion.div
        className="w-full h-full"
        whileHover={{ scale: 1.06 }}
        transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
      >
        <img
          src={src}
          alt={alt}
          loading="lazy"
          width={768}
          height={512}
          className="w-full h-full object-cover"
        />
      </motion.div>
      {/* Inner shadow + fade overlay */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          boxShadow: isLight
            ? 'inset 0 -24px 30px -10px rgba(15,40,80,0.12), inset 0 1px 2px rgba(0,0,0,0.04)'
            : 'inset 0 -30px 40px -10px rgba(2,8,23,0.85), inset 0 1px 2px rgba(99,179,237,0.15)',
        }}
      />
      {children}
    </div>
  );
}