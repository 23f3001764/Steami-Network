/**
 * HeroSingularity — assembles all singularity visual layers.
 *
 * Layer order (z-index):
 *   0  – Warm ambient corona glow (blurred radial, behind everything)
 *   1  – AccretionDiskBackground  (dark shadow masses + far-side lensing arcs)
 *   6  – WaveField                (expanding distortion ripple rings)
 *  10  – EventHorizon             (dark core with amber/cyan rim)
 *  15  – AccretionDiskForeground  (main wave band + near arcs + particles)
 *
 * Sizing:
 *   Event horizon: clamp(260px, 34vw, 380px)
 *   SVG canvas:    700 × 480px (disk tails extend beyond)
 *   Outer shell:   100% width × 520px height
 *
 * Behavior (wave emission, text fluctuation) lives in
 * HeroElementDistortionProvider — NOT touched here.
 */
import React from 'react';

import { InteractiveSingularity } from './InteractiveSingularity';

export const HeroSingularity = () => {
  return (
    <div
      className="relative flex items-center justify-center w-full"
      style={{ 
        height: '100%', 
        minHeight: '400px', 
        maxHeight: '760px', 
      }}
    >
      <InteractiveSingularity />
    </div>
  );
};
