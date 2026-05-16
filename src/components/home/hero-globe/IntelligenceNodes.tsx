import React, { useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface IntelligenceNodesProps {
  isLight: boolean;
}

export const IntelligenceNodes: React.FC<IntelligenceNodesProps> = ({ isLight }) => {
  const count = 120;
  
  const [positions, scales] = useMemo(() => {
    const pos = new Float32Array(count * 3);
    const sc = new Float32Array(count);
    for (let i = 0; i < count; i++) {
      // Fibonacci sphere for even distribution
      const phi = Math.acos(-1 + (2 * i) / count);
      const theta = Math.sqrt(count * Math.PI) * phi;
      
      const radius = 2.52;
      pos[i * 3] = radius * Math.cos(theta) * Math.sin(phi);
      pos[i * 3 + 1] = radius * Math.sin(theta) * Math.sin(phi);
      pos[i * 3 + 2] = radius * Math.cos(phi);
      
      sc[i] = Math.random();
    }
    return [pos, sc];
  }, []);

  const pointsRef = React.useRef<THREE.Points>(null);

  useFrame((state) => {
    if (pointsRef.current) {
      pointsRef.current.rotation.y += 0.001;
      const time = state.clock.getElapsedTime();
      // Subtle pulse effect
      pointsRef.current.scale.setScalar(1 + Math.sin(time * 0.5) * 0.01);
    }
  });

  return (
    <group>
      <points ref={pointsRef}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            count={count}
            array={positions}
            itemSize={3}
          />
        </bufferGeometry>
        <pointsMaterial
          size={isLight ? 0.05 : 0.07}
          color={isLight ? "#0ea5e9" : "#38bdf8"}
          transparent
          opacity={0.9}
          sizeAttenuation
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </points>
      
      {/* Active Signal Highlights - Brighter Pulse Layer */}
      <points rotation={pointsRef.current?.rotation}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            count={count / 2}
            array={positions.slice(0, (count / 2) * 3)}
            itemSize={3}
          />
        </bufferGeometry>
        <pointsMaterial
          size={isLight ? 0.08 : 0.1}
          color={isLight ? "#00f0ff" : "#ffffff"}
          transparent
          opacity={0.4}
          sizeAttenuation
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </points>
    </group>
  );
};
