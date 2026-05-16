import React from 'react';
import { useThemeStore } from '@/stores/theme-store';
import './heroBlackholeRing.css';

export const HeroBlackholeRingOverlay = () => {
  const isLight = useThemeStore((s) => s.theme === 'light');

  return (
    <div
      className={`hero-bh-ring-overlay ${isLight ? "is-light" : "is-dark"}`}
      aria-hidden="true"
    >
      {/* Back Layer: Behind the 3D Singularity */}
      <div className="hero-bh-ring hero-bh-ring-back" />
      
      {/* Core Layer: Main accretion ring body */}
      <div className="hero-bh-ring hero-bh-ring-core" />
      
      {/* Front Layer: Top highlight to simulate lensing/depth */}
      <div className="hero-bh-ring hero-bh-ring-front" />
      
      {/* Particle sparks for extra energy texture */}
      <div className="hero-bh-ring-particles" />
    </div>
  );
};
