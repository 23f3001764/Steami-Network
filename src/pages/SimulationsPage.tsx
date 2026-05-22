import { useEffect, useRef, useState, Suspense } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { SteamiLayout } from '@/components/SteamiLayout';
import { QuantumBlochSphere } from '@/components/simulations/QuantumBlochSphere';
import { ThreeBodySim } from '@/components/simulations/ThreeBodySim';
import { staggerContainer, cardVariants, cardHover, cardTap, overlayVariants, modalVariants, fadeInUp } from '@/lib/motion';
import { Lightbulb, ChevronDown, X, BookMarked } from 'lucide-react';
import { ShareMenu } from '@/components/ShareMenu';
import { TextSelectionPopover } from '@/components/TextSelectionPopover';
import { PopupLinkPill } from '@/components/PopupLinkPill';
import { api } from '@/lib/api';

// ── React Three Fiber + Drei ──────────────────────────────────────────────────
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Sphere, Box, Torus, Line, Trail, Stars, Text, Grid } from '@react-three/drei';
import * as THREE from 'three';

// ─── Types ───────────────────────────────────────────────────────────────────

interface SimulationRecord {
  id:              string;
  title:           string;
  field:           string;
  fieldColor:      string;
  description:     string;
  caption:         string;
  readTime:        string;
  simulation_type: string;
  component_id:    string;
  insights:        string[];
  snapshot_url:    string;
  glb_url:         string;
  tags:            string[];
  references:      any[];   // {title, url?, author?, type?}[]
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

import { logPopupOpen, logPopupOpenSync, logPopupClose, NO_SESSION, type PopupSession } from '@/lib/popup-telemetry';

// ══════════════════════════════════════════════════════════════════════════════
// INLINE 3D SCENE COMPONENTS — self-contained, no external deps
// These mirror the scenes in ModerationPage so the same animation plays
// in both the builder preview AND the public SimulationsPage modal.
// ══════════════════════════════════════════════════════════════════════════════

// ─── Types for inline scene props ───────────────────────────────────────────
type ShapeId = 'sphere'|'cube'|'octahedron'|'tetrahedron'|'torus'|'dodecahedron'|'icosahedron'|'cone'|'cylinder';

function makeGeoInline(shape: ShapeId, size = 0.45): THREE.BufferGeometry {
  switch (shape) {
    case 'sphere':       return new THREE.SphereGeometry(size, 16, 12);
    case 'cube':         return new THREE.BoxGeometry(size*1.8, size*1.8, size*1.8);
    case 'octahedron':   return new THREE.OctahedronGeometry(size * 1.4);
    case 'tetrahedron':  return new THREE.TetrahedronGeometry(size * 1.5);
    case 'torus':        return new THREE.TorusGeometry(size * 0.9, size * 0.35, 10, 28);
    case 'dodecahedron': return new THREE.DodecahedronGeometry(size * 1.2);
    case 'icosahedron':  return new THREE.IcosahedronGeometry(size * 1.2);
    case 'cone':         return new THREE.ConeGeometry(size, size * 2, 14);
    case 'cylinder':     return new THREE.CylinderGeometry(size * 0.7, size * 0.7, size * 1.8, 14);
    default:             return new THREE.SphereGeometry(size, 16, 12);
  }
}

interface BlochProps { autoMode: boolean; theta: number; phi: number; bitShape: ShapeId; }

function BlochSceneInline({ autoMode, theta, phi, bitShape }: BlochProps) {
  const vecRef     = useRef<THREE.Mesh>(null!);
  const haloRef    = useRef<THREE.Mesh>(null!);
  const lineGeoRef = useRef(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(), new THREE.Vector3(0,1.5,0)]));

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    let x: number, y: number, z: number;

    if (autoMode) {
      const th = Math.PI / 2 + Math.sin(t * 0.8) * 0.5;
      const ph = t * 0.7;
      x = Math.sin(th) * Math.cos(ph) * 1.5;
      y = Math.cos(th) * 1.5;
      z = Math.sin(th) * Math.sin(ph) * 1.5;
    } else {
      const tRad = theta * Math.PI / 180;
      const pRad = phi   * Math.PI / 180;
      x = Math.sin(tRad) * Math.cos(pRad) * 1.5;
      y = Math.cos(tRad) * 1.5;
      z = Math.sin(tRad) * Math.sin(pRad) * 1.5;
    }

    vecRef.current?.position.set(x, y, z);
    if (haloRef.current) {
      haloRef.current.position.set(x, y, z);
      haloRef.current.scale.setScalar(1 + 0.1 * Math.sin(t * 2));
    }
    lineGeoRef.current.setFromPoints([new THREE.Vector3(0,0,0), new THREE.Vector3(x,y,z)]);
  });

  const axisPairs: [THREE.Vector3, THREE.Vector3][] = [
    [new THREE.Vector3(0,0,0), new THREE.Vector3(0, 2,0)],
    [new THREE.Vector3(0,0,0), new THREE.Vector3(0,-2,0)],
    [new THREE.Vector3(0,0,0), new THREE.Vector3( 2,0,0)],
    [new THREE.Vector3(0,0,0), new THREE.Vector3(-2,0,0)],
  ];
  const axisColors = ['#26de81','#fc5c65','#63b3ed','#a78bfa'];

  return (
    <group>
      <Sphere args={[1.5, 32, 24]}>
        <meshBasicMaterial color="#0d2040" transparent opacity={0.45} side={THREE.DoubleSide} />
      </Sphere>
      <Torus args={[1.5, 0.012, 6, 64]} rotation={[Math.PI/2, 0, 0]}>
        <meshBasicMaterial color="#1a3a70" transparent opacity={0.5} />
      </Torus>
      <Torus args={[1.5, 0.012, 6, 64]}>
        <meshBasicMaterial color="#1a3a70" transparent opacity={0.5} />
      </Torus>
      {axisPairs.map((pts, i) => (
        <Line key={i} points={pts} color={axisColors[i]} lineWidth={1.5} transparent opacity={0.5} />
      ))}
      {/* State vector line */}
      <primitive object={new THREE.Line(lineGeoRef.current, new THREE.LineBasicMaterial({ color: '#f5d07a', linewidth: 2 }))} />
      <mesh ref={vecRef}>
        <sphereGeometry args={[0.1, 10, 10]} />
        <meshBasicMaterial color="#f5d07a" />
      </mesh>
      <mesh ref={haloRef}>
        <sphereGeometry args={[0.18, 10, 10]} />
        <meshBasicMaterial color="#f5d07a" transparent opacity={0.18} />
      </mesh>
      <Text position={[0, 1.85, 0]} fontSize={0.18} color="#26de81" anchorX="center">|0⟩</Text>
      <Text position={[0,-1.85, 0]} fontSize={0.18} color="#fc5c65" anchorX="center">|1⟩</Text>
      {/* Classical bit */}
      <group position={[3.2, 0, 0]}>
        <mesh key={bitShape}>
          <primitive object={makeGeoInline(bitShape, 0.38)} attach="geometry" />
          <meshStandardMaterial color="#fc5c65" emissive="#fc5c65" emissiveIntensity={0.2} />
        </mesh>
        <Text position={[0,-0.7,0]} fontSize={0.14} color="#fc5c65" anchorX="center">BIT</Text>
      </group>
    </group>
  );
}

function ThreeBodySceneInline({
  autoMode = true, speed = 1,
  mass1 = 1, mass2 = 1, mass3 = 1.5,
  body1Shape = 'sphere' as ShapeId,
  body2Shape = 'sphere' as ShapeId,
  body3Shape = 'sphere' as ShapeId,
}: {
  autoMode?: boolean; speed?: number;
  mass1?: number; mass2?: number; mass3?: number;
  body1Shape?: ShapeId; body2Shape?: ShapeId; body3Shape?: ShapeId;
}) {
  const G = 0.8;
  const bodiesRef = useRef([
    { pos: new THREE.Vector3(-1.2,0,0), vel: new THREE.Vector3(0.347, 0.532,0),  mass: mass1 },
    { pos: new THREE.Vector3( 1.2,0,0), vel: new THREE.Vector3(0.347, 0.532,0),  mass: mass2 },
    { pos: new THREE.Vector3( 0,  0,0), vel: new THREE.Vector3(-0.694,-1.064,0), mass: mass3 },
  ]);
  const m0 = useRef<THREE.Mesh>(null!);
  const m1 = useRef<THREE.Mesh>(null!);
  const m2 = useRef<THREE.Mesh>(null!);
  const meshRefs = [m0, m1, m2];
  const COLORS   = ['#63b3ed','#f5d07a','#fb923c'];
  const shapes   = [body1Shape, body2Shape, body3Shape];

  useFrame(() => {
    if (!autoMode) return;
    const bs = bodiesRef.current;
    const dt = 0.006 * speed;
    const forces = bs.map(() => new THREE.Vector3());
    for (let i = 0; i < 3; i++) {
      for (let j = i+1; j < 3; j++) {
        const diff = new THREE.Vector3().subVectors(bs[j].pos, bs[i].pos);
        const dist = Math.max(diff.length(), 0.3);
        const fd   = diff.normalize().multiplyScalar(G * bs[i].mass * bs[j].mass / (dist*dist));
        forces[i].add(fd); forces[j].sub(fd);
      }
    }
    bs.forEach((b,i) => {
      b.vel.addScaledVector(forces[i], dt/b.mass);
      b.pos.addScaledVector(b.vel, dt);
      meshRefs[i].current?.position.copy(b.pos);
    });
  });

  return (
    <group>
      <pointLight position={[0,0,4]} intensity={1.5} />
      {COLORS.map((color, i) => (
        <Trail key={i} width={0.8} length={40} color={color} attenuation={(t)=>t*t}>
          <mesh ref={meshRefs[i]} key={shapes[i]}>
            <primitive object={makeGeoInline(shapes[i], 0.18)} attach="geometry" />
            <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.4} />
          </mesh>
        </Trail>
      ))}
    </group>
  );
}

interface WaveProps { autoMode: boolean; waveMode: 'ripple'|'standing'|'interference'|'gaussian'; amplitude: number; frequency: number; }

function WaveSceneInline({ autoMode, waveMode, amplitude, frequency }: WaveProps) {
  const meshRef = useRef<THREE.Mesh>(null!);
  const geoRef  = useRef(new THREE.PlaneGeometry(8, 8, 60, 60));

  useFrame(({ clock }) => {
    if (!autoMode) return;
    const t   = clock.getElapsedTime();
    const pos = meshRef.current?.geometry.attributes.position;
    if (!pos) return;
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i), y = pos.getY(i);
      const r = Math.sqrt(x*x + y*y);
      let z = 0;
      switch (waveMode) {
        case 'ripple':
          z = amplitude * Math.sin(r * frequency - t * 3) * Math.exp(-r * 0.25); break;
        case 'standing':
          z = amplitude * Math.sin(x * frequency) * Math.cos(t * 3); break;
        case 'interference': {
          const d1 = Math.sqrt((x-1.5)*(x-1.5)+y*y);
          const d2 = Math.sqrt((x+1.5)*(x+1.5)+y*y);
          z = amplitude * 0.5 * (Math.sin(d1*frequency-t*3)+Math.sin(d2*frequency-t*3)); break;
        }
        case 'gaussian': {
          const sigma = 1.5;
          z = amplitude * Math.exp(-(x*x+y*y)/(2*sigma*sigma)) * Math.cos(frequency*x - t*2); break;
        }
      }
      pos.setZ(i, z);
    }
    pos.needsUpdate = true;
    meshRef.current.geometry.computeVertexNormals();
  });

  return (
    <group rotation={[-Math.PI/3,0,0]}>
      <mesh ref={meshRef} geometry={geoRef.current}>
        <meshStandardMaterial color="#63b3ed" wireframe transparent opacity={0.7} />
      </mesh>
      <pointLight position={[0,4,4]} intensity={2} color="#63b3ed" />
    </group>
  );
}

function OrbitsSceneInline({ autoMode = true, orbitSpeed = 1 }: { autoMode?: boolean; orbitSpeed?: number }) {
  const planets = [
    { r:1.8, speed:1.5, size:0.12, color:'#63b3ed' },
    { r:2.8, speed:0.9, size:0.18, color:'#f5d07a' },
    { r:3.8, speed:0.6, size:0.14, color:'#fb923c' },
    { r:4.8, speed:0.4, size:0.22, color:'#a78bfa' },
  ];
  const p0=useRef<THREE.Mesh>(null!), p1=useRef<THREE.Mesh>(null!);
  const p2=useRef<THREE.Mesh>(null!), p3=useRef<THREE.Mesh>(null!);
  const pRefs = [p0,p1,p2,p3];

  useFrame(({ clock }) => {
    if (!autoMode) return;
    const t = clock.getElapsedTime() * orbitSpeed;
    planets.forEach((p,i) => {
      pRefs[i].current?.position.set(Math.cos(t*p.speed)*p.r, 0, Math.sin(t*p.speed)*p.r);
    });
  });

  const ring = (r: number) =>
    Array.from({length:65},(_,i)=>{const a=(i/64)*Math.PI*2; return new THREE.Vector3(Math.cos(a)*r,0,Math.sin(a)*r);});

  return (
    <group>
      <Sphere args={[0.5,20,20]}>
        <meshStandardMaterial color="#f5d07a" emissive="#f5a623" emissiveIntensity={1.2} />
      </Sphere>
      <pointLight position={[0,0,0]} intensity={3} color="#fff5c0" distance={12} />
      {planets.map((p,i) => (
        <group key={i}>
          <Line points={ring(p.r)} color={p.color} lineWidth={0.5} transparent opacity={0.2} />
          <Trail width={0.5} length={20} color={p.color} attenuation={(t)=>t}>
            <mesh ref={pRefs[i]}>
              <sphereGeometry args={[p.size,10,10]} />
              <meshStandardMaterial color={p.color} emissive={p.color} emissiveIntensity={0.3} />
            </mesh>
          </Trail>
        </group>
      ))}
    </group>
  );
}

const SHAPES_LIST: { id: ShapeId; label: string; icon: string }[] = [
  { id:'sphere',       label:'Sphere',       icon:'○' },
  { id:'cube',         label:'Cube',         icon:'□' },
  { id:'octahedron',   label:'Octahedron',   icon:'◇' },
  { id:'tetrahedron',  label:'Tetrahedron',  icon:'△' },
  { id:'torus',        label:'Torus',        icon:'⊙' },
  { id:'dodecahedron', label:'Dodecahedron', icon:'⬡' },
  { id:'icosahedron',  label:'Icosahedron',  icon:'◈' },
  { id:'cone',         label:'Cone',         icon:'▽' },
  { id:'cylinder',     label:'Cylinder',     icon:'⊏' },
];

/**
 * Full interactive wrapper for any known simulation preset.
 * Renders a live R3F Canvas + auto/manual toggle + per-preset controls.
 */
function LiveSimWrapper({ componentId }: { componentId: string }) {
  const [autoMode,    setAutoMode]    = useState(true);
  // Bloch
  const [theta,       setTheta]       = useState(45);
  const [phi,         setPhi]         = useState(0);
  const [bitShape,    setBitShape]    = useState<ShapeId>('cube');
  // Wave
  const [waveMode,    setWaveMode]    = useState<'ripple'|'standing'|'interference'|'gaussian'>('ripple');
  const [waveAmp,     setWaveAmp]     = useState(1.0);
  const [waveFreq,    setWaveFreq]    = useState(2.0);
  // Three-body
  const [tbSpeed,     setTbSpeed]     = useState(1.0);
  const [tbMass1,     setTbMass1]     = useState(1.0);
  const [tbMass2,     setTbMass2]     = useState(1.0);
  const [tbMass3,     setTbMass3]     = useState(1.5);
  const [tbShape1,    setTbShape1]    = useState<ShapeId>('sphere');
  const [tbShape2,    setTbShape2]    = useState<ShapeId>('sphere');
  const [tbShape3,    setTbShape3]    = useState<ShapeId>('sphere');
  // Orbits
  const [orbitSpeed,  setOrbitSpeed]  = useState(1.0);

  const canvasH = 420;
  const bgStyle: React.CSSProperties = {
    height: canvasH, background: '#03060f',
    border: '1px solid rgba(99,179,237,0.14)',
  };

  const scene = (() => {
    switch (componentId) {
      case 'bloch':
      case 'quantum':
        return (
          <BlochSceneInline
            autoMode={autoMode} theta={theta} phi={phi} bitShape={bitShape}
          />
        );
      case 'threebody':
        return <ThreeBodySceneInline autoMode={autoMode} speed={tbSpeed}
          mass1={tbMass1} mass2={tbMass2} mass3={tbMass3}
          body1Shape={tbShape1} body2Shape={tbShape2} body3Shape={tbShape3} />;
      case 'wave':
        return <WaveSceneInline autoMode={autoMode} waveMode={waveMode} amplitude={waveAmp} frequency={waveFreq} />;
      case 'orbits':
        return <OrbitsSceneInline autoMode={autoMode} orbitSpeed={orbitSpeed} />;
      default:
        return null;
    }
  })();

  if (!scene) return null;

  return (
    <div className="space-y-4">
      {/* Canvas */}
      <div className="w-full rounded-xl overflow-hidden relative" style={bgStyle}>
        <Canvas camera={{ position:[0,2,6], fov:55 }} style={{ width:'100%', height:'100%' }}>
          <Suspense fallback={null}>
            <Stars radius={30} depth={10} count={600} factor={3} fade />
            <Grid args={[12,12]} position={[0,-2.5,0]} cellColor="#0a1428" sectionColor="#0d2040" />
            <ambientLight intensity={0.4} />
            <pointLight position={[5,5,5]} intensity={1.5} />
            {scene}
            <OrbitControls enablePan enableZoom enableRotate />
          </Suspense>
        </Canvas>
        {/* Mode badge */}
        <div className="absolute bottom-3 left-3 flex items-center gap-1.5 px-2 py-1 rounded"
          style={{ background:'rgba(3,6,15,0.8)', border:'1px solid rgba(99,179,237,0.2)' }}>
          <span className={`w-1.5 h-1.5 rounded-full ${autoMode ? 'bg-green-400 animate-pulse' : 'bg-yellow-400'}`} />
          <span className="font-mono text-[9px] text-muted-foreground tracking-wider">
            {autoMode ? 'AUTO' : 'MANUAL'}
          </span>
        </div>
        <div className="absolute top-3 left-3 font-mono text-[9px] text-white/20 pointer-events-none">
          DRAG · SCROLL · ROTATE
        </div>
      </div>

      {/* ── Controls row ── */}
      <div className="rounded-xl p-4 space-y-4"
        style={{ background:'rgba(6,16,38,0.6)', border:'1px solid rgba(99,179,237,0.12)' }}>

        {/* Auto / Manual toggle */}
        <div className="flex gap-2">
          <button onClick={() => setAutoMode(true)}
            className={`flex-1 flex items-center justify-center gap-2 rounded-lg border py-2 text-[11px] font-mono transition-all ${
              autoMode
                ? 'border-green-500/50 bg-green-500/10 text-green-400'
                : 'border-white/10 text-muted-foreground hover:border-white/20'
            }`}>
            <span className={`w-1.5 h-1.5 rounded-full ${autoMode ? 'bg-green-400 animate-pulse' : 'bg-white/20'}`} />
            ⟳ AUTO
          </button>
          <button onClick={() => setAutoMode(false)}
            className={`flex-1 flex items-center justify-center gap-2 rounded-lg border py-2 text-[11px] font-mono transition-all ${
              !autoMode
                ? 'border-yellow-500/50 bg-yellow-500/10 text-yellow-400'
                : 'border-white/10 text-muted-foreground hover:border-white/20'
            }`}>
            <span className={`w-1.5 h-1.5 rounded-full ${!autoMode ? 'bg-yellow-400' : 'bg-white/20'}`} />
            ⊙ MANUAL
          </button>
        </div>

        {/* Bloch-specific manual controls */}
        {(componentId === 'bloch' || componentId === 'quantum') && !autoMode && (
          <div className="space-y-2 pt-1 border-t border-white/5">
            <p className="font-mono text-[10px] text-muted-foreground tracking-wider uppercase">State Vector Angles</p>
            <div className="flex items-center gap-3">
              <span className="font-mono text-[11px] text-muted-foreground w-16">θ (polar)</span>
              <input type="range" min="0" max="180" value={theta}
                onChange={e => setTheta(+e.target.value)}
                className="flex-1 accent-yellow-400" />
              <span className="font-mono text-[11px] text-yellow-400 w-10 text-right">{theta}°</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="font-mono text-[11px] text-muted-foreground w-16">φ (azimuth)</span>
              <input type="range" min="0" max="360" value={phi}
                onChange={e => setPhi(+e.target.value)}
                className="flex-1 accent-[#63b3ed]" />
              <span className="font-mono text-[11px] text-steami-cyan w-10 text-right">{phi}°</span>
            </div>
          </div>
        )}

        {/* Bloch classical bit shape picker */}
        {(componentId === 'bloch' || componentId === 'quantum') && (
          <div className="pt-1 border-t border-white/5">
            <p className="font-mono text-[10px] text-muted-foreground tracking-wider uppercase mb-2">Classical Bit Shape</p>
            <div className="flex flex-wrap gap-1.5">
              {SHAPES_LIST.map(s => (
                <button key={s.id} onClick={() => setBitShape(s.id)}
                  className={`font-mono text-[10px] px-2 py-1 rounded border transition-all ${
                    bitShape === s.id
                      ? 'border-red-400/60 bg-red-400/10 text-red-400'
                      : 'border-white/10 text-muted-foreground hover:border-white/20'
                  }`}>
                  {s.icon} {s.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Wave-specific controls */}
        {componentId === 'wave' && (
          <div className="space-y-3 pt-1 border-t border-white/5">
            <p className="font-mono text-[10px] text-muted-foreground tracking-wider uppercase">Wave Parameters</p>
            <div className="flex flex-wrap gap-1.5 mb-2">
              {(['ripple','standing','interference','gaussian'] as const).map(m => (
                <button key={m} onClick={() => setWaveMode(m)}
                  className={`font-mono text-[10px] px-2.5 py-1 rounded border transition-all capitalize ${
                    waveMode === m
                      ? 'border-steami-cyan/60 bg-steami-cyan/10 text-steami-cyan'
                      : 'border-white/10 text-muted-foreground hover:border-white/20'
                  }`}>{m}</button>
              ))}
            </div>
            <div className="flex items-center gap-3">
              <span className="font-mono text-[10px] text-muted-foreground w-20">Amplitude</span>
              <input type="range" min="0.1" max="3" step="0.05" value={waveAmp}
                onChange={e => setWaveAmp(+e.target.value)}
                className="flex-1 accent-[#63b3ed]" />
              <span className="font-mono text-[10px] text-steami-cyan w-8 text-right">{waveAmp.toFixed(2)}</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="font-mono text-[10px] text-muted-foreground w-20">Frequency</span>
              <input type="range" min="0.3" max="6" step="0.1" value={waveFreq}
                onChange={e => setWaveFreq(+e.target.value)}
                className="flex-1 accent-[#a78bfa]" />
              <span className="font-mono text-[10px] text-steami-cyan w-8 text-right">{waveFreq.toFixed(1)}</span>
            </div>
          </div>
        )}

        {/* Three-body controls */}
        {componentId === 'threebody' && (
          <div className="space-y-3 pt-1 border-t border-white/5">
            <p className="font-mono text-[10px] text-muted-foreground tracking-wider uppercase">Three-Body Parameters</p>
            <div className="flex items-center gap-3">
              <span className="font-mono text-[10px] text-muted-foreground w-14">Speed</span>
              <input type="range" min="0.1" max="4" step="0.1" value={tbSpeed}
                onChange={e => setTbSpeed(+e.target.value)}
                className="flex-1 accent-[#63b3ed]" />
              <span className="font-mono text-[10px] text-steami-cyan w-10 text-right">{tbSpeed.toFixed(1)}×</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="font-mono text-[10px] text-muted-foreground w-14">Mass 1</span>
              <input type="range" min="0.5" max="4" step="0.1" value={tbMass1}
                onChange={e => setTbMass1(+e.target.value)}
                className="flex-1 accent-[#63b3ed]" />
              <span className="font-mono text-[10px] text-[#63b3ed] w-10 text-right">{tbMass1.toFixed(1)}</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="font-mono text-[10px] text-muted-foreground w-14">Mass 2</span>
              <input type="range" min="0.5" max="4" step="0.1" value={tbMass2}
                onChange={e => setTbMass2(+e.target.value)}
                className="flex-1 accent-[#f5d07a]" />
              <span className="font-mono text-[10px] text-[#f5d07a] w-10 text-right">{tbMass2.toFixed(1)}</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="font-mono text-[10px] text-muted-foreground w-14">Mass 3</span>
              <input type="range" min="0.5" max="4" step="0.1" value={tbMass3}
                onChange={e => setTbMass3(+e.target.value)}
                className="flex-1 accent-[#fb923c]" />
              <span className="font-mono text-[10px] text-[#fb923c] w-10 text-right">{tbMass3.toFixed(1)}</span>
            </div>
            <div>
              <p className="font-mono text-[10px] text-muted-foreground uppercase mb-1">Body 1 Shape</p>
              <div className="flex flex-wrap gap-1">
                {SHAPES_LIST.map(s => (
                  <button key={s.id} onClick={() => setTbShape1(s.id)}
                    className={`font-mono text-[10px] px-2 py-0.5 rounded border transition-all ${tbShape1===s.id ? 'border-[#63b3ed]/60 bg-[#63b3ed]/10 text-[#63b3ed]' : 'border-white/10 text-muted-foreground hover:border-white/20'}`}>
                    {s.icon}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <p className="font-mono text-[10px] text-muted-foreground uppercase mb-1">Body 2 Shape</p>
              <div className="flex flex-wrap gap-1">
                {SHAPES_LIST.map(s => (
                  <button key={s.id} onClick={() => setTbShape2(s.id)}
                    className={`font-mono text-[10px] px-2 py-0.5 rounded border transition-all ${tbShape2===s.id ? 'border-[#f5d07a]/60 bg-[#f5d07a]/10 text-[#f5d07a]' : 'border-white/10 text-muted-foreground hover:border-white/20'}`}>
                    {s.icon}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <p className="font-mono text-[10px] text-muted-foreground uppercase mb-1">Body 3 Shape</p>
              <div className="flex flex-wrap gap-1">
                {SHAPES_LIST.map(s => (
                  <button key={s.id} onClick={() => setTbShape3(s.id)}
                    className={`font-mono text-[10px] px-2 py-0.5 rounded border transition-all ${tbShape3===s.id ? 'border-[#fb923c]/60 bg-[#fb923c]/10 text-[#fb923c]' : 'border-white/10 text-muted-foreground hover:border-white/20'}`}>
                    {s.icon}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Orbits controls */}
        {componentId === 'orbits' && (
          <div className="space-y-3 pt-1 border-t border-white/5">
            <p className="font-mono text-[10px] text-muted-foreground tracking-wider uppercase">Orbital Parameters</p>
            <div className="flex items-center gap-3">
              <span className="font-mono text-[10px] text-muted-foreground w-20">Orbit Speed</span>
              <input type="range" min="0.1" max="5" step="0.1" value={orbitSpeed}
                onChange={e => setOrbitSpeed(+e.target.value)}
                className="flex-1 accent-[#a78bfa]" />
              <span className="font-mono text-[10px] text-[#a78bfa] w-10 text-right">{orbitSpeed.toFixed(1)}×</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Map a component_id → live animated scene or fallback.
 */
function SimulationRenderer({ componentId, glbUrl }: { componentId: string; glbUrl?: string }) {
  // 1. Dedicated standalone legacy components
  switch (componentId) {
    case 'quantum':
      return <QuantumBlochSphere />;
    case 'threebody_standalone':
      return <ThreeBodySim />;
  }

  // 2. Builder presets — live animated inline scenes with controls
  const livePresets = ['bloch', 'wave', 'orbits', 'threebody'];
  if (livePresets.includes(componentId)) {
    return <LiveSimWrapper componentId={componentId} />;
  }

  // 3. GLB fallback (static)
  if (glbUrl) {
    return (
      <div className="w-full rounded-xl overflow-hidden" style={{ height: 420 }}>
        {/* @ts-ignore */}
        <model-viewer src={glbUrl} alt={componentId} auto-rotate camera-controls
          style={{ width:'100%', height:'100%', background:'rgba(6,16,38,0.5)' }} />
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center rounded-xl py-16 gap-3"
      style={{ background:'rgba(6,16,38,0.5)', border:'1px solid rgba(99,179,237,0.14)' }}>
      <span className="text-3xl">🔬</span>
      <p className="font-mono text-[11px] text-muted-foreground tracking-wider">
        COMPONENT <span className="text-steami-cyan">"{componentId}"</span> NOT YET REGISTERED
      </p>
    </div>
  );
}

// ─── Skeleton card shown while loading ───────────────────────────────────────

function SimulationSkeleton() {
  return (
    <div className="glass-card relative overflow-hidden animate-pulse">
      <div className="absolute top-0 left-0 right-0 h-[2px] bg-white/10" />
      <div className="p-7 space-y-3">
        <div className="h-5 w-24 rounded bg-white/10" />
        <div className="h-6 w-3/4 rounded bg-white/10" />
        <div className="h-4 w-full rounded bg-white/10" />
        <div className="h-4 w-5/6 rounded bg-white/10" />
        <div className="flex justify-between items-center pt-2">
          <div className="h-4 w-24 rounded bg-white/10" />
          <div className="h-8 w-32 rounded bg-white/10" />
        </div>
      </div>
    </div>
  );
}

// ─── Live mini-preview on each card ─────────────────────────────────────────
// Shows a tiny animated canvas instead of a static snapshot thumbnail.

function CardLivePreview({ componentId }: { componentId: string }) {
  const knownPresets = ['bloch', 'wave', 'orbits', 'quantum', 'threebody'];
  if (!knownPresets.includes(componentId)) return null;

  const scene = (() => {
    switch (componentId) {
      case 'bloch':     case 'quantum':    return <BlochSceneInline autoMode theta={45} phi={0} bitShape="cube" />;
      case 'threebody':                    return <ThreeBodySceneInline autoMode />;
      case 'wave':                         return <WaveSceneInline autoMode waveMode="ripple" amplitude={1} frequency={2} />;
      case 'orbits':                       return <OrbitsSceneInline autoMode />;
      default:                             return null;
    }
  })();
  if (!scene) return null;

  return (
    <div className="relative overflow-hidden" style={{ height: 140 }}>
      <Canvas
        camera={{ position:[0,1.5,5], fov:50 }}
        style={{ width:'100%', height:'100%', background:'#03060f' }}
        gl={{ antialias: true }}
      >
        <Suspense fallback={null}>
          <ambientLight intensity={0.5} />
          <pointLight position={[5,5,5]} intensity={1.5} />
          {scene}
        </Suspense>
      </Canvas>
      {/* gradient fade into card body */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{ background: 'linear-gradient(to bottom, transparent 40%, var(--steami-card-bg, #07111f) 100%)' }}
      />
      {/* "LIVE" badge */}
      <div className="absolute top-2 right-2 flex items-center gap-1 px-1.5 py-0.5 rounded"
        style={{ background: 'rgba(3,6,15,0.7)', border: '1px solid rgba(99,179,237,0.25)' }}>
        <span className="inline-block w-1.5 h-1.5 rounded-full bg-steami-green animate-pulse" />
        <span className="font-mono text-[9px] text-steami-green tracking-wider">LIVE</span>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function SimulationsPage() {
  const [simulations,       setSimulations]       = useState<SimulationRecord[]>([]);
  const [loadingList,       setLoadingList]       = useState(true);
  const [listError,         setListError]         = useState('');
  const [openSim,           setOpenSim]           = useState<string | null>(null);
  const popupSession = useRef<PopupSession>(NO_SESSION);
  // Stores a freshly-fetched copy of the opened simulation so glb_url /
  // snapshot_url are always up-to-date (list may have been fetched before upload)
  const [openedSimFresh,    setOpenedSimFresh]    = useState<SimulationRecord | null>(null);
  const [expandedInsights,  setExpandedInsights]  = useState<Record<string, boolean>>({});
  const contentRef = useRef<HTMLDivElement>(null);

  // Inject the Google model-viewer web component once (needed for GLB fallback)
  useEffect(() => {
    if (document.querySelector('script[data-model-viewer]')) return;
    const s = document.createElement('script');
    s.type = 'module';
    s.src  = 'https://ajax.googleapis.com/ajax/libs/model-viewer/3.5.0/model-viewer.min.js';
    s.setAttribute('data-model-viewer', '1');
    document.head.appendChild(s);
  }, []);

  // ── Fetch simulations from backend ─────────────────────────────────────────
  useEffect(() => {
    let cancelled = false;
    setLoadingList(true);
    setListError('');
    api.simulations.list()
      .then((data: any) => {
        if (cancelled) return;
        const list: SimulationRecord[] = Array.isArray(data)
          ? data
          : data?.simulations ?? [];
        setSimulations(list);
      })
      .catch((err: any) => {
        if (!cancelled) setListError(err?.message || 'Failed to load simulations');
      })
      .finally(() => { if (!cancelled) setLoadingList(false); });
    return () => { cancelled = true; };
  }, []);

  // ── Fresh-fetch whenever the modal opens ───────────────────────────────────
  useEffect(() => {
    if (!openSim) { setOpenedSimFresh(null); return; }
    api.simulations.get(openSim)
      .then((data: any) => setOpenedSimFresh(data as SimulationRecord))
      .catch(() => {
        setOpenedSimFresh(simulations.find((s) => s.id === openSim) ?? null);
      });
  }, [openSim]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Auto-open via URL param ?simulation=quantum ────────────────────────────
  useEffect(() => {
    if (loadingList) return;
    const params = new URLSearchParams(window.location.search);
    const simId  = params.get('simulation') ?? params.get('open');
    if (simId && simulations.some((s) => s.id === simId)) {
      setOpenSim(simId);
      const sim = simulations.find((s) => s.id === simId);
      if (sim) logPopupOpenSync('simulation', sim.id, sim.title, (s) => { popupSession.current = s; });
      params.delete('simulation');
      params.delete('open');
      window.history.replaceState(
        {},
        '',
        `${window.location.pathname}${params.toString() ? `?${params}` : ''}${window.location.hash}`
      );
    }
  }, [loadingList, simulations]);

  const toggleInsights = (id: string) =>
    setExpandedInsights((prev) => ({ ...prev, [id]: !prev[id] }));

  const openedSim = openedSimFresh ?? simulations.find((s) => s.id === openSim);

  const accentColor = (sim: SimulationRecord) =>
    sim.simulation_type === 'bloch_sphere' || sim.component_id === 'quantum' || sim.component_id === 'bloch'
      ? 'hsl(var(--steami-violet))'
      : sim.simulation_type === 'three_body' || sim.component_id === 'threebody'
      ? 'hsl(var(--steami-cyan))'
      : 'hsl(var(--steami-gold))';

  // Whether this sim has a live animated component (vs static/unknown)
  const hasLivePreview = (sim: SimulationRecord) =>
    ['quantum','threebody','bloch','wave','orbits'].includes(sim.component_id);

  return (
    <SteamiLayout>
      {/* Page header */}
      <motion.div className="mb-8" variants={fadeInUp} initial="hidden" animate="visible">
        <div className="steami-section-label">◆ INTERACTIVE SIMULATIONS</div>
        <h1 className="steami-heading text-2xl md:text-3xl mt-2">
          3D Simulations Lab
        </h1>
        <p className="text-[18px] font-medium text-muted-foreground mt-3 max-w-[560px] leading-relaxed">
          Hands-on, interactive 3D visualisations that bring abstract scientific concepts to life.
          Drag, adjust, and explore — learning through direct manipulation.
        </p>
      </motion.div>

      {/* ── Error state ── */}
      {listError && (
        <div className="glass-card p-6 text-center mb-6">
          <p className="font-mono text-[12px] text-steami-red">{listError}</p>
          <button
            className="steami-btn text-[11px] mt-3"
            onClick={() => window.location.reload()}
          >
            ↺ Retry
          </button>
        </div>
      )}

      {/* ── Simulation cards ── */}
      {loadingList ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <SimulationSkeleton />
          <SimulationSkeleton />
        </div>
      ) : (
        <motion.div
          className="grid grid-cols-1 md:grid-cols-2 gap-4"
          variants={staggerContainer}
          initial="hidden"
          animate="visible"
        >
          {simulations.map((sim, idx) => (
            <motion.div
              key={sim.id}
              custom={idx}
              variants={cardVariants}
              layoutId={`sim-card-${sim.id}`}
              className="glass-card relative overflow-hidden"
            >
              {/* Accent bar */}
              <motion.div
                className="absolute top-0 left-0 right-0 h-[2px]"
                style={{ background: accentColor(sim) }}
                initial={{ scaleX: 0 }}
                animate={{ scaleX: 1 }}
                transition={{ delay: 0.3 + idx * 0.1, duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
              />

              {/* Live animated preview — shown for known presets */}
              {hasLivePreview(sim) ? (
                <CardLivePreview componentId={sim.component_id} />
              ) : sim.snapshot_url ? (
                /* Fall back to static snapshot for unknown component_ids */
                <div className="relative overflow-hidden" style={{ height: 140 }}>
                  <img
                    src={sim.snapshot_url}
                    alt={sim.title}
                    className="w-full h-full object-cover"
                    style={{ filter: 'brightness(0.75) saturate(1.2)' }}
                  />
                  <div
                    className="absolute inset-0"
                    style={{ background: 'linear-gradient(to bottom, transparent 40%, var(--steami-card-bg, #07111f) 100%)' }}
                  />
                </div>
              ) : null}

              <div className="p-7">
                <span className={`steami-badge ${sim.fieldColor || 'steami-badge-cyan'} mb-3 inline-block`}>
                  {sim.field}
                </span>
                <h2 className="steami-heading text-lg mb-3">{sim.title}</h2>
                <p className="text-[14px] font-medium text-muted-foreground leading-relaxed mb-4">
                  {sim.description}
                </p>

                {/* Key Insights collapsible */}
                {sim.insights?.length > 0 && (
                  <div className="mb-4">
                    <motion.button
                      onClick={() => toggleInsights(sim.id)}
                      className="flex items-center gap-2 font-mono text-[11px] tracking-wider uppercase text-steami-cyan mb-2 w-full"
                      whileHover={{ x: 2 }}
                    >
                      <Lightbulb className="w-3 h-3" />
                      KEY INSIGHTS
                      <motion.span
                        animate={{ rotate: expandedInsights[sim.id] ? 180 : 0 }}
                        transition={{ duration: 0.2 }}
                      >
                        <ChevronDown className="w-3 h-3" />
                      </motion.span>
                    </motion.button>
                    <AnimatePresence>
                      {expandedInsights[sim.id] && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
                          className="overflow-hidden"
                        >
                          <div
                            className="rounded-lg p-3"
                            style={{ background: 'rgba(6,16,38,0.5)', border: '1px solid rgba(99,179,237,0.14)' }}
                          >
                            {sim.insights.map((insight, i) => (
                              <div
                                key={i}
                                className="flex items-start gap-2 py-1.5 border-b border-steami-cyan/5 last:border-0"
                              >
                                <span className="text-steami-cyan text-xs mt-0.5">◆</span>
                                <span className="font-mono text-[11px] text-muted-foreground leading-relaxed">{insight}</span>
                              </div>
                            ))}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                )}

                <div className="flex items-center justify-between">
                  <span className="font-mono text-[11px] text-muted-foreground tracking-wider">
                    {sim.readTime}
                  </span>
                  <div className="flex items-center gap-2">
                    <ShareMenu title={sim.title} popupType="simulation" popupId={sim.id} compact />
                    <motion.button
                      whileHover={cardHover}
                      whileTap={cardTap}
                      onClick={() => {
                        setOpenSim(sim.id);
                        logPopupOpenSync('simulation', sim.id, sim.title, (s) => { popupSession.current = s; });
                      }}
                      className="steami-btn text-[11px]"
                    >
                      LAUNCH SIMULATION
                    </motion.button>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}

          {/* Empty state */}
          {!loadingList && simulations.length === 0 && !listError && (
            <div className="md:col-span-2 glass-card p-12 text-center">
              <p className="font-mono text-[12px] text-muted-foreground tracking-wider">
                NO SIMULATIONS AVAILABLE YET
              </p>
              <p className="font-mono text-[10px] text-muted-foreground/50 mt-2">
                Admin / mod users can add simulations via the Content Operations page.
              </p>
            </div>
          )}
        </motion.div>
      )}

      {/* ── Modal overlay ── */}
      <AnimatePresence>
        {openSim && openedSim && (
          <motion.div
            className="fixed inset-0 z-[200] flex items-center justify-center p-4"
            variants={overlayVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            style={{ background: 'rgba(2,8,18,0.82)', backdropFilter: 'blur(8px)' }}
            onClick={() => {
              logPopupClose(popupSession.current);
              popupSession.current = NO_SESSION;
              setOpenSim(null);
            }}
          >
            <motion.div
              className="w-full max-w-[800px] max-h-[90vh] overflow-y-auto rounded-xl"
              variants={modalVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              style={{
                background: 'var(--steami-modal-bg)',
                backdropFilter: 'blur(24px) saturate(160%)',
                border: '1px solid rgba(255,255,255,0.07)',
                boxShadow: '0 25px 50px -12px rgba(0,0,0,0.6), 0 0 40px rgba(99,179,237,0.1)',
              }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal header */}
              <div
                className="flex items-center justify-between px-6 py-4 border-b border-white/[0.06] sticky top-0 z-10"
                style={{ background: 'rgba(5,14,32,0.92)', backdropFilter: 'blur(20px)' }}
              >
                <div className="flex items-center gap-3">
                  <span className={`steami-badge ${openedSim.fieldColor || 'steami-badge-cyan'}`}>
                    {openedSim.field}
                  </span>
                  <span className="font-mono text-[11px] text-muted-foreground">
                    {openedSim.readTime}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <PopupLinkPill type="simulation" id={openSim} />
                  <ShareMenu
                    title={openedSim.title}
                    popupType="simulation"
                    popupId={openSim}
                    compact
                  />
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => {
                      logPopupClose(popupSession.current);
                      popupSession.current = NO_SESSION;
                      setOpenSim(null);
                    }}
                    className="w-7 h-7 rounded-md flex items-center justify-center text-muted-foreground hover:text-destructive transition-colors"
                    style={{ border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(10,25,55,0.4)' }}
                  >
                    <X className="w-4 h-4" />
                  </motion.button>
                </div>
              </div>

              {/* Modal body */}
              <div ref={contentRef} className="p-6 md:p-8">
                <TextSelectionPopover
                  containerRef={contentRef as React.RefObject<HTMLDivElement>}
                  source={openedSim.title}
                  sourceType="simulation"
                  field={openedSim.field}
                  sourceId={openSim}
                />

                <motion.h2
                  className="steami-heading text-xl md:text-2xl mb-4"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.15 }}
                >
                  {openedSim.title}
                </motion.h2>

                <motion.p
                  className="text-[18px] font-medium italic leading-relaxed mb-6"
                  style={{ color: '#8aacca', borderLeft: '2px solid hsl(var(--steami-gold))', paddingLeft: 18 }}
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2 }}
                >
                  {openedSim.description}
                </motion.p>

                {/* 3D Simulation — live animated via component_id */}
                <motion.div
                  className="mb-4"
                  initial={{ opacity: 0, scale: 0.96 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.25, duration: 0.4 }}
                >
                  <SimulationRenderer componentId={openedSim.component_id} glbUrl={openedSim.glb_url} />
                </motion.div>

                {/* Caption */}
                {openedSim.caption && (
                  <motion.div
                    className="mt-4 p-3 rounded-lg"
                    style={{ background: 'rgba(6,16,38,0.5)', border: '1px solid rgba(99,179,237,0.14)' }}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.35 }}
                  >
                    <p className="font-mono text-[11px] text-muted-foreground tracking-wider leading-relaxed">
                      ◆ {openedSim.caption}
                    </p>
                  </motion.div>
                )}

                {/* GLB download link — shown if a 3-D file was uploaded */}
                {openedSim.glb_url && (
                  <motion.div
                    className="mt-3 flex items-center gap-2"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.4 }}
                  >
                    <a
                      href={openedSim.glb_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-mono text-[11px] text-steami-cyan hover:underline"
                    >
                      ↗ Download 3D model (.glb)
                    </a>
                  </motion.div>
                )}

                {/* Tags */}
                {openedSim.tags?.length > 0 && (
                  <motion.div
                    className="mt-4 flex flex-wrap gap-2"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.45 }}
                  >
                    {openedSim.tags.map((tag) => (
                      <span
                        key={tag}
                        className="font-mono text-[10px] px-2 py-0.5 rounded"
                        style={{ background: 'rgba(99,179,237,0.08)', border: '1px solid rgba(99,179,237,0.2)', color: '#63b3ed' }}
                      >
                        {tag}
                      </span>
                    ))}
                  </motion.div>
                )}

                {/* ── References ───────────────────────────────────── */}
                {openedSim.references?.length > 0 && (
                  <SimReferencesSection references={openedSim.references} accentColor={accentColor(openedSim)} />
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </SteamiLayout>
  );
}

/* ══════════════════════════════════════════════════════════════════
   SIMULATION REFERENCES SECTION
   ══════════════════════════════════════════════════════════════════ */
const SIM_REF_TYPE_COLORS: Record<string, string> = {
  paper:   'rgba(167,139,250,0.15)', article: 'rgba(99,179,237,0.12)',
  book:    'rgba(52,211,153,0.12)',  website: 'rgba(251,191,36,0.10)',
  dataset: 'rgba(248,113,113,0.10)',
};
const SIM_REF_TYPE_TEXT: Record<string, string> = {
  paper: '#a78bfa', article: '#63b3ed', book: '#34d399', website: '#fbbf24', dataset: '#f87171',
};

function SimReferencesSection({ references, accentColor }: { references: any[]; accentColor: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.5 }}
      className="mt-8 pt-6 border-t"
      style={{ borderColor: 'rgba(255,255,255,0.07)' }}
    >
      <div
        className="font-mono text-[11px] tracking-wider uppercase mb-4 flex items-center gap-2"
        style={{ color: accentColor }}
      >
        <BookMarked className="w-3.5 h-3.5" /> REFERENCES
      </div>
      <ol className="space-y-2">
        {references.map((ref: any, i: number) => {
          const title  = typeof ref === 'string' ? ref : ref.title;
          const url    = typeof ref === 'string' ? undefined : ref.url;
          const author = typeof ref === 'string' ? undefined : ref.author;
          const type   = typeof ref === 'string' ? undefined : ref.type;
          return (
            <motion.li
              key={i}
              initial={{ opacity: 0, x: -6 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.52 + i * 0.03 }}
              className="flex gap-3 items-start text-[13px] leading-relaxed"
            >
              <span className="shrink-0 font-mono text-[10px] text-muted-foreground/40 mt-0.5 w-5 text-right">
                {i + 1}.
              </span>
              <div className="min-w-0 flex flex-col gap-0.5">
                {type && (
                  <span
                    className="self-start font-mono text-[9px] uppercase tracking-wider px-1.5 py-0.5 rounded-sm mb-0.5"
                    style={{
                      background: SIM_REF_TYPE_COLORS[type] ?? 'rgba(255,255,255,0.06)',
                      color:      SIM_REF_TYPE_TEXT[type]   ?? '#94a3b8',
                    }}
                  >
                    {type}
                  </span>
                )}
                <div>
                  {url ? (
                    <a href={url} target="_blank" rel="noopener noreferrer"
                      className="font-medium hover:underline break-all text-steami-cyan">
                      {title}
                    </a>
                  ) : (
                    <span className="text-foreground/80 font-medium">{title}</span>
                  )}
                  {author && <span className="text-muted-foreground/60 text-[12px] ml-2">— {author}</span>}
                </div>
                {url && <span className="font-mono text-[10px] text-muted-foreground/40 break-all">{url}</span>}
              </div>
            </motion.li>
          );
        })}
      </ol>
    </motion.div>
  );
}
