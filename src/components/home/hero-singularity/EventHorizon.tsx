/**
 * EventHorizon — redesigned to match the Interstellar reference:
 *
 *  • Deep black / blue-black central body
 *  • Warm amber/orange luminous rim on the bright (disk) side
 *  • Faint cool cyan rim on the shadow side
 *  • Thick orange photon-sphere corona glow
 *  • Subtle inner depth shadow
 *  • Feels embedded inside the accretion wave, not floating above it
 *
 * Size is set entirely by the parent wrapper in HeroSingularity.
 */
import { motion } from 'framer-motion';
import { useThemeStore } from '@/stores/theme-store';

export const EventHorizon = () => {
  const isLight = useThemeStore((s) => s.theme === 'light');

  return (
    <div
      className="relative flex items-center justify-center flex-shrink-0"
      style={{ width: '100%', height: '100%' }}
    >
      {/* ── Outer diffuse corona glow — warm amber/orange matching the disk ── */}
      <motion.div
        className="absolute rounded-full pointer-events-none"
        style={{
          inset: '-35% -45%',
          background: isLight
            ? 'radial-gradient(ellipse at center, rgba(255,140,20,0.22) 0%, rgba(220,80,10,0.08) 45%, transparent 75%)'
            : 'radial-gradient(ellipse at center, rgba(255,160,30,0.32) 0%, rgba(210,60,10,0.12) 45%, transparent 75%)',
          filter: 'blur(30px)',
        }}
        animate={{ scale: [1, 1.05, 1], opacity: [0.7, 1, 0.7] }}
        transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
      />

      {/* ── Photon sphere ring — warm orange/gold on bright side, muted on shadow ── */}
      <div
        className="absolute rounded-full pointer-events-none"
        style={{
          inset: '-5% -4%',
          border: isLight
            ? '2px solid rgba(255,165,40,0.55)'
            : '2px solid rgba(255,180,50,0.50)',
          boxShadow: isLight
            ? '0 0 40px 12px rgba(255,140,20,0.25), 0 0 80px 30px rgba(220,80,0,0.12), inset 0 0 20px rgba(255,120,0,0.12)'
            : '0 0 48px 14px rgba(255,150,30,0.30), 0 0 90px 36px rgba(200,60,0,0.14), inset 0 0 24px rgba(255,120,0,0.10)',
        }}
      />

      {/* ── Conic-gradient luminous rim — amber on bottom/equator, faint cyan top ── */}
      <div
        className="absolute rounded-full pointer-events-none"
        style={{
          inset: '-1px',
          padding: '1.2px',
          background: isLight
            ? 'conic-gradient(from 270deg, rgba(255,200,60,0.85) 0%, rgba(255,120,20,0.75) 25%, rgba(0,160,220,0.15) 55%, rgba(60,80,120,0.08) 75%, rgba(255,200,60,0.85) 100%)'
            : 'conic-gradient(from 270deg, rgba(255,210,60,0.90) 0%, rgba(255,130,20,0.80) 25%, rgba(40,180,255,0.15) 55%, rgba(20,40,80,0.06) 75%, rgba(255,210,60,0.90) 100%)',
          opacity: 0.95,
        }}
      >
        {/* This inner div = the actual black core */}
        <div
          style={{
            width: '100%',
            height: '100%',
            borderRadius: 'inherit',
            background: isLight
              ? 'radial-gradient(ellipse at 42% 42%, #0e1422 0%, #080c18 50%, #030508 100%)'
              : 'radial-gradient(ellipse at 42% 42%, #0a1018 0%, #050810 50%, #010206 100%)',
          }}
        />
      </div>

      {/* ── Main event horizon body ── */}
      <motion.div
        className="absolute rounded-full"
        style={{
          inset: 0,
          background: isLight
            ? 'radial-gradient(ellipse at 40% 38%, #111926 0%, #080c18 50%, #020407 100%)'
            : 'radial-gradient(ellipse at 40% 38%, #0c1320 0%, #060910 50%, #010205 100%)',
          boxShadow: isLight
            ? '0 0 32px 8px rgba(0,0,0,0.80), inset 0 0 30px rgba(255,120,0,0.06)'
            : '0 0 40px 12px rgba(0,0,0,0.95), inset 0 0 40px rgba(255,100,0,0.08)',
        }}
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 1.8, ease: 'circOut' }}
      >
        {/* Inner heat shimmer — very faint orange warm center */}
        <motion.div
          className="absolute"
          style={{
            inset: '20% 25%',
            borderRadius: '50%',
            background: isLight
              ? 'radial-gradient(ellipse, rgba(255,140,40,0.05) 0%, transparent 70%)'
              : 'radial-gradient(ellipse, rgba(255,120,30,0.07) 0%, transparent 70%)',
          }}
          animate={{ opacity: [0.3, 0.6, 0.3] }}
          transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
        />
      </motion.div>
    </div>
  );
};
