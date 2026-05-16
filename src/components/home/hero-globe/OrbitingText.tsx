import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Text } from '@react-three/drei';
import * as THREE from 'three';

interface OrbitingTextProps {
  isLight: boolean;
  text: string;
}

export const OrbitingText: React.FC<OrbitingTextProps> = ({ isLight, text }) => {
  const groupRef = useRef<THREE.Group>(null);

  useFrame(({ clock }) => {
    if (groupRef.current) {
      const t = clock.getElapsedTime() * 0.4;
      groupRef.current.rotation.y = t;
    }
  });

  return (
    <group ref={groupRef}>
      <group position={[3.2, 0, 0]} rotation={[0, Math.PI / 2, 0]}>
        <Text
          fontSize={0.28}
          color={isLight ? "#0284c7" : "#00f0ff"}
          fillOpacity={0.8}
          font="https://fonts.gstatic.com/s/inter/v12/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuLyeMZhrib2Bg-4.ttf"
          anchorX="center"
          anchorY="middle"
          letterSpacing={0.15}
        >
          {text}
        </Text>
      </group>
      
      {/* Second instance for continuous flow */}
      <group position={[-3.2, 0, 0]} rotation={[0, -Math.PI / 2, 0]}>
        <Text
          fontSize={0.28}
          color={isLight ? "#0284c7" : "#00f0ff"}
          fillOpacity={0.8}
          font="https://fonts.gstatic.com/s/inter/v12/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuLyeMZhrib2Bg-4.ttf"
          anchorX="center"
          anchorY="middle"
          letterSpacing={0.15}
        >
          {text}
        </Text>
      </group>
    </group>
  );
};
