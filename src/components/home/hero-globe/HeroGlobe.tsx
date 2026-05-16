import React, { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera, Environment, Float } from '@react-three/drei';
import { GlobeSphere } from './GlobeSphere';
import { IntelligenceNodes } from './IntelligenceNodes';
import { SignalLayer } from './SignalLayer';
import { OrbitingText } from './OrbitingText';
import { useThemeStore } from '@/stores/theme-store';

export const HeroGlobe: React.FC = () => {
  const isLight = useThemeStore((s) => s.theme === 'light');

  return (
    <div className="w-full h-[500px] md:h-[700px] relative">
      <Canvas
        dpr={[1, 2]}
        gl={{ 
          antialias: true, 
          alpha: true,
          powerPreference: "high-performance" 
        }}
      >
        <PerspectiveCamera makeDefault position={[0, 0, 8]} fov={45} />
        <ambientLight intensity={isLight ? 2 : 1.2} />
        <pointLight position={[10, 10, 10]} intensity={isLight ? 2.5 : 1.5} />
        <pointLight position={[-10, -10, -10]} color="#0ea5e9" intensity={isLight ? 0.5 : 1} />
        
        <Suspense fallback={null}>
          <Float
            speed={1.5}
            rotationIntensity={0.5}
            floatIntensity={0.5}
          >
            <group rotation={[0.4, 0, 0]}>
              <GlobeSphere isLight={isLight} />
              <IntelligenceNodes isLight={isLight} />
              <SignalLayer isLight={isLight} />
              <OrbitingText isLight={isLight} text="STEAMI" />
            </group>
          </Float>
          
          <Environment preset="city" />
        </Suspense>

        {/* Restrained parallax/interaction */}
        <OrbitControls 
          enableZoom={false} 
          enablePan={false}
          autoRotate
          autoRotateSpeed={0.5}
          rotateSpeed={0.5}
        />
      </Canvas>
      
      {/* Cinematic Overlays */}
      <div className="absolute inset-0 pointer-events-none bg-gradient-to-r from-transparent via-transparent to-transparent z-20" />
      
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] opacity-20 dark:opacity-10 pointer-events-none">
        <div className="w-full h-full rounded-full border border-cyan-500/20 animate-pulse" />
      </div>
    </div>
  );
};
