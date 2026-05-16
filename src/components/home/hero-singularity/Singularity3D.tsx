import React, { useRef, useMemo, useEffect } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { useGLTF, useAnimations } from '@react-three/drei';
import * as THREE from 'three';
import { useSingularity } from './HeroElementDistortionProvider';
import { useThemeStore } from '@/stores/theme-store';

const BlackHoleModel = () => {
  const group = useRef<THREE.Group>(null);
  const { scene, animations } = useGLTF('/models/black-hole/scene.gltf');
  const { actions } = useAnimations(animations, group);
  const { isEmitting } = useSingularity();

  useEffect(() => {
    if (actions && actions['Take 001']) {
      actions['Take 001'].play();
    }
  }, [actions]);

  useFrame((state) => {
    // Pulse emission with the singularity wave effect
    const targetIntensity = isEmitting ? 2.5 : 1.0;
    scene.traverse((child: THREE.Object3D) => {
      if ((child as THREE.Mesh).isMesh) {
        const mesh = child as THREE.Mesh;
        if (mesh.material) {
          const material = mesh.material as THREE.MeshStandardMaterial;
          if (material.emissiveIntensity !== undefined) {
            material.emissiveIntensity = THREE.MathUtils.lerp(
              material.emissiveIntensity,
              targetIntensity,
              0.1
            );
          }
          // Fix for rectangular edges: ensure transparency is enabled
          material.transparent = true;
          material.alphaTest = 0.05;
          material.depthWrite = false;
        }
      }
    });
  });

  // Scale of 1.2 fits well within the 6-unit camera distance for a cinematic feel
  return (
    <group ref={group} dispose={null} rotation={[0.2, -0.2, 0]}>
      <primitive object={scene} scale={1.2} />
    </group>
  );
};

const Scene = () => {
  const groupRef = useRef<THREE.Group>(null);
  const { viewport } = useThree();

  useFrame((state) => {
    if (groupRef.current) {
      // Premium Parallax Tilt
      const targetX = (state.mouse.y * Math.PI) / 10;
      const targetY = (state.mouse.x * Math.PI) / 10;
      groupRef.current.rotation.x = THREE.MathUtils.lerp(groupRef.current.rotation.x, targetX, 0.04);
      groupRef.current.rotation.y = THREE.MathUtils.lerp(groupRef.current.rotation.y, targetY, 0.04);

      // Gentle floating motion
      groupRef.current.position.y = Math.sin(state.clock.elapsedTime * 0.5) * 0.05;
    }
  });

  // Calculate a stable scale based on viewport width (Three.js units)
  // On mobile/narrow viewports, we scale down slightly to prevent clipping.
  const responsiveScale = useMemo(() => {
    if (viewport.width <= 0) return 1;
    return viewport.width < 4.8 ? 0.82 : 1;
  }, [viewport.width]);

  return (
    <group ref={groupRef} scale={responsiveScale}>
      <BlackHoleModel />
    </group>
  );
};

export const Singularity3D = () => {
  return (
    <div className="w-full h-full pointer-events-none relative">
      <Canvas
        camera={{ position: [0, 0, 6], fov: 42 }}
        dpr={[1, 2]}
        gl={{ antialias: true, alpha: true }}
        style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }}
        resize={{ debounce: 0 }}
      >
        <Scene />
      </Canvas>
    </div>
  );
};

useGLTF.preload('/models/black-hole/scene.gltf');
