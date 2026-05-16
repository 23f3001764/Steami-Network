import React, { Suspense } from 'react';
import { useThemeStore } from '@/stores/theme-store';
import { Singularity3D } from './Singularity3D';
import { HeroBlackholeRingOverlay } from './HeroBlackholeRingOverlay';

export const HeroBlackholeModel = () => {
  const isLight = useThemeStore((s) => s.theme === 'light');

  return (
    <div
      className="hero-blackhole-model-shell blackhole-edge-mask absolute flex items-center justify-center pointer-events-none"
      style={{
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        zIndex: 5,
      }}
    >
      <HeroBlackholeRingOverlay />

      <Suspense fallback={
        <div className={`w-full h-full rounded-full blur-2xl animate-pulse ${isLight ? 'bg-orange-500/20' : 'bg-orange-600/30'}`} />
      }>
        <div className="relative z-[3] w-full h-full flex items-center justify-center">
          <Singularity3D />
        </div>
      </Suspense>
    </div>
  );
};
