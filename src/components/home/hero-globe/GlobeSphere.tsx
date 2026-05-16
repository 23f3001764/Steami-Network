import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { Sphere } from '@react-three/drei';

interface GlobeSphereProps {
  isLight: boolean;
}

export const GlobeSphere: React.FC<GlobeSphereProps> = ({ isLight }) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const glowRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.y += 0.001;
    }
  });

  return (
    <group>
      {/* Main Sphere Body - Atmospheric Translucent Glass */}
      <Sphere ref={meshRef} args={[2.5, 64, 64]}>
        <meshStandardMaterial
          color={isLight ? "#f0f9ff" : "#1e1b4b"} // Light: Sky blue, Dark: Deep indigo
          emissive={isLight ? "#7dd3fc" : "#312e81"}
          emissiveIntensity={isLight ? 0.4 : 1.2}
          roughness={0.4}
          metalness={0.1}
          transparent
          opacity={0.6}
          envMapIntensity={0.5}
        />
      </Sphere>

      {/* Atmospheric Rim Glow - Improved Dimensionality */}
      <Sphere args={[2.55, 64, 64]}>
        <meshBasicMaterial
          color={isLight ? "#00e0ff" : "#0ea5e9"}
          transparent
          opacity={isLight ? 0.2 : 0.3}
          side={THREE.BackSide}
          blending={THREE.AdditiveBlending}
        />
      </Sphere>

      {/* Neural Topology Layer - Internal Architecture */}
      <mesh rotation={[Math.PI / 4, 0.5, 0]}>
        <sphereGeometry args={[2.45, 48, 48]} />
        <meshBasicMaterial
          color={isLight ? "#0284c7" : "#60a5fa"}
          wireframe
          transparent
          opacity={isLight ? 0.1 : 0.15}
          blending={THREE.AdditiveBlending}
        />
      </mesh>
    </group>
  );
};
