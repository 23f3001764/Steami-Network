import { motion } from 'framer-motion';
import { useThemeStore } from '@/stores/theme-store';

interface GraphPreviewProps {
  image: string;
  isHovered: boolean;
  color: string;
}

export const GraphPreview = ({ image, isHovered, color }: GraphPreviewProps) => {
  const isLight = useThemeStore((s) => s.theme === 'light');

  return (
    <div className={`relative w-full h-full overflow-hidden rounded-t-xl transition-all duration-700 ease-out`}>
      {/* Background Deep Layer */}
      <div className={`absolute inset-0 transition-opacity duration-700 ${isLight ? 'bg-zinc-100' : 'bg-black/60'}`} />

      {/* The Actual Graph Snapshot */}
      <motion.div
        animate={{
          scale: isHovered ? 1.05 : 1,
          filter: isHovered ? 'brightness(1.1) contrast(1.1)' : 'brightness(1) contrast(1)',
        }}
        transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
        className="absolute inset-0 w-full h-full"
      >
        <img
          src={image}
          alt="System Preview"
          className={`w-full h-full object-cover transition-opacity duration-700 ${isHovered ? 'opacity-100' : 'opacity-80'}`}
        />
      </motion.div>

      {/* Atmospheric Overlays */}
      <div 
        className="absolute inset-0 pointer-events-none transition-opacity duration-700"
        style={{
          background: isLight 
            ? `linear-gradient(to bottom, transparent 40%, rgba(255,255,255,0.8) 100%)`
            : `linear-gradient(to bottom, transparent 40%, rgba(0,0,0,0.8) 100%)`,
          opacity: isHovered ? 0.4 : 0.7
        }}
      />

      {/* Intelligence Scanning Lines (Lightweight SVG) */}
      <div className="absolute inset-0 opacity-20 pointer-events-none">
        <svg width="100%" height="100%" className="absolute inset-0">
          <defs>
            <pattern id="grid-intelligence" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="currentColor" strokeWidth="0.5" className={isLight ? 'text-zinc-300' : 'text-white/10'} />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid-intelligence)" />
        </svg>
      </div>

      {/* Ambient Glow */}
      <motion.div
        animate={{
          opacity: isHovered ? 0.3 : 0,
        }}
        className={`absolute inset-0 pointer-events-none blur-[60px]`}
        style={{
          background: `radial-gradient(circle at 50% 50%, ${color === 'steami-cyan' ? 'rgba(111,168,255,0.4)' : 'rgba(212,175,55,0.3)'}, transparent 70%)`
        }}
      />

      {/* Hover Illumination Edge */}
      <motion.div
        animate={{
          opacity: isHovered ? 1 : 0,
          scaleX: isHovered ? 1 : 0.8
        }}
        className="absolute bottom-0 left-0 right-0 h-[1px]"
        style={{
          background: `linear-gradient(90deg, transparent, ${color === 'steami-cyan' ? 'var(--steami-cyan-hex)' : 'var(--steami-gold-hex)'}, transparent)`,
          boxShadow: `0 0 15px ${color === 'steami-cyan' ? 'rgba(111,168,255,0.5)' : 'rgba(212,175,55,0.4)'}`
        }}
      />
    </div>
  );
};
