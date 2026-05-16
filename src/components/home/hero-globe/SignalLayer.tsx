import React, { useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface SignalLayerProps {
  isLight: boolean;
}

export const SignalLayer: React.FC<SignalLayerProps> = ({ isLight }) => {
  const lineCount = 15;
  
  const arcs = useMemo(() => {
    const tempArcs = [];
    for (let i = 0; i < lineCount; i++) {
      // Random points on sphere
      const start = new THREE.Vector3().setFromSphericalCoords(2.52, Math.random() * Math.PI, Math.random() * 2 * Math.PI);
      const end = new THREE.Vector3().setFromSphericalCoords(2.52, Math.random() * Math.PI, Math.random() * 2 * Math.PI);
      
      // Control point for quadratic bezier
      const mid = start.clone().lerp(end, 0.5).normalize().multiplyScalar(3.0);
      
      const curve = new THREE.QuadraticBezierCurve3(start, mid, end);
      const points = curve.getPoints(50);
      const geometry = new THREE.BufferGeometry().setFromPoints(points);
      
      tempArcs.push(geometry);
    }
    return tempArcs;
  }, []);

  const groupRef = React.useRef<THREE.Group>(null);

  useFrame(() => {
    if (groupRef.current) {
      groupRef.current.rotation.y += 0.001;
    }
  });

  return (
    <group ref={groupRef}>
      {arcs.map((geo, i) => (
        <primitive key={i} object={new THREE.Line(geo)}>
          <lineBasicMaterial
            color={isLight ? "#38bdf8" : "#60a5fa"}
            transparent
            opacity={isLight ? 0.3 : 0.25}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
          />
        </primitive>
      ))}
      
      {/* Moving Signal Particles */}
      {Array.from({ length: 10 }).map((_, i) => (
        <SignalPulse key={i} isLight={isLight} color={i % 4 === 0 ? "#fbbf24" : "#00f0ff"} />
      ))}
    </group>
  );
};

const SignalPulse: React.FC<{ isLight: boolean, color: string }> = ({ isLight, color }) => {
  const meshRef = React.useRef<THREE.Mesh>(null);
  const [curve, speed] = useMemo(() => {
    const start = new THREE.Vector3().setFromSphericalCoords(2.52, Math.random() * Math.PI, Math.random() * 2 * Math.PI);
    const end = new THREE.Vector3().setFromSphericalCoords(2.52, Math.random() * Math.PI, Math.random() * 2 * Math.PI);
    const mid = start.clone().lerp(end, 0.5).normalize().multiplyScalar(3.2);
    return [new THREE.QuadraticBezierCurve3(start, mid, end), 0.1 + Math.random() * 0.15];
  }, []);

  useFrame((state) => {
    if (meshRef.current) {
      const t = (state.clock.elapsedTime * speed) % 1;
      const pos = curve.getPoint(t);
      meshRef.current.position.copy(pos);
      meshRef.current.scale.setScalar(1 + Math.sin(state.clock.elapsedTime * 4) * 0.3);
    }
  });

  return (
    <mesh ref={meshRef}>
      <sphereGeometry args={[0.035, 8, 8]} />
      <meshBasicMaterial 
        color={color} 
        transparent
        opacity={0.8}
        blending={THREE.AdditiveBlending}
      />
    </mesh>
  );
};
