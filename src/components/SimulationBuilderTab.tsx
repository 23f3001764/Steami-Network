/**
 * SimulationBuilderTab.tsx
 *
 * Self-contained 3-D simulation builder used inside ModerationPage.
 * Mirrors the pattern of NewsletterTab — all Three.js / R3F logic lives here,
 * ModerationPage only imports and mounts it.
 */

import { useEffect, useRef, useState, useCallback, Suspense } from 'react';
import { api } from '@/lib/api';

// ── React Three Fiber + Drei ─────────────────────────────────────────────────
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import {
  OrbitControls, Sphere, Box, Torus, Line,
  Trail, Stars, Text, Grid,
} from '@react-three/drei';
import * as THREE from 'three';
import { GLTFExporter } from 'three/examples/jsm/exporters/GLTFExporter';
import { GLTFLoader }   from 'three/examples/jsm/loaders/GLTFLoader';

// ═════════════════════════════════════════════════════════════════════════════
// TYPES
// ═════════════════════════════════════════════════════════════════════════════

type SimPreset = 'bloch' | 'threebody' | 'orbits' | 'wave' | 'blank';
type ShapeId   = 'sphere' | 'cube' | 'octahedron' | 'tetrahedron' | 'torus' | 'dodecahedron' | 'icosahedron' | 'cone' | 'cylinder';

interface BuilderConfig {
  preset:      SimPreset;
  bgColor:     string;
  showGrid:    boolean;
  showStars:   boolean;
  showAxes:    boolean;
  speed:       number;
  autoMode:    boolean;
  // Bloch sphere
  blochColor:  string;
  vectorColor: string;
  bitShape:    ShapeId;
  blochTheta:  number;
  blochPhi:    number;
  // Three-body
  mass1: number; mass2: number; mass3: number;
  body1Shape: ShapeId; body2Shape: ShapeId; body3Shape: ShapeId;
  // Wave
  waveAmp:   number;
  waveFreq:  number;
  waveColor: string;
  waveMode:  'ripple' | 'standing' | 'interference' | 'gaussian';
  // Orbits
  orbitSpeed: number;
}

const defaultConfig: BuilderConfig = {
  preset: 'bloch', bgColor: '#03060f', showGrid: true, showStars: true, showAxes: true,
  speed: 1, autoMode: true,
  blochColor: '#0d2040', vectorColor: '#f5d07a', bitShape: 'cube',
  blochTheta: 45, blochPhi: 0,
  mass1: 1, mass2: 1, mass3: 1.5,
  body1Shape: 'sphere', body2Shape: 'sphere', body3Shape: 'sphere',
  waveAmp: 1, waveFreq: 2, waveColor: '#63b3ed', waveMode: 'ripple',
  orbitSpeed: 1,
};

// ── Shape catalogue ──────────────────────────────────────────────────────────
const SHAPES: { id: ShapeId; label: string; icon: string }[] = [
  { id: 'sphere',       label: 'Sphere',       icon: '○' },
  { id: 'cube',         label: 'Cube',         icon: '□' },
  { id: 'octahedron',   label: 'Octahedron',   icon: '◇' },
  { id: 'tetrahedron',  label: 'Tetrahedron',  icon: '△' },
  { id: 'torus',        label: 'Torus',        icon: '⊙' },
  { id: 'dodecahedron', label: 'Dodecahedron', icon: '⬡' },
  { id: 'icosahedron',  label: 'Icosahedron',  icon: '◈' },
  { id: 'cone',         label: 'Cone',         icon: '▽' },
  { id: 'cylinder',     label: 'Cylinder',     icon: '⊏' },
];

const PRESETS: { id: SimPreset; icon: string; label: string; desc: string }[] = [
  { id: 'bloch',     icon: '⚛',  label: 'Bloch Sphere',   desc: 'Qubit superposition on the Bloch sphere' },
  { id: 'threebody', icon: '🌌', label: 'Three Body',     desc: 'Chaotic gravitational 3-body problem'     },
  { id: 'orbits',    icon: '🪐', label: 'Orbital System', desc: 'Solar system orbital mechanics'           },
  { id: 'wave',      icon: '〜', label: 'Wave Function',  desc: 'Quantum wave function propagation'        },
  { id: 'blank',     icon: '◻',  label: 'Blank Canvas',   desc: 'Load your own GLB/GLTF file'             },
];

// ═════════════════════════════════════════════════════════════════════════════
// SHARED UI
// ═════════════════════════════════════════════════════════════════════════════

function ShapePicker({ value, onChange }: { value: ShapeId; onChange: (s: ShapeId) => void }) {
  return (
    <div className="flex flex-wrap gap-1 mt-1">
      {SHAPES.map((s) => (
        <button key={s.id} onClick={() => onChange(s.id)} title={s.label}
          className={`font-mono text-[10px] px-2 py-1 rounded border transition-all ${
            value === s.id
              ? 'border-steami-cyan/70 bg-steami-cyan/10 text-steami-cyan'
              : 'border-white/10 hover:border-white/20 text-muted-foreground'
          }`}>
          {s.icon} {s.label}
        </button>
      ))}
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
// GEOMETRY FACTORY
// ═════════════════════════════════════════════════════════════════════════════

function makeGeo(shape: ShapeId, size = 0.45): THREE.BufferGeometry {
  switch (shape) {
    case 'sphere':       return new THREE.SphereGeometry(size, 16, 12);
    case 'cube':         return new THREE.BoxGeometry(size * 1.8, size * 1.8, size * 1.8);
    case 'octahedron':   return new THREE.OctahedronGeometry(size * 1.4);
    case 'tetrahedron':  return new THREE.TetrahedronGeometry(size * 1.5);
    case 'torus':        return new THREE.TorusGeometry(size * 0.9, size * 0.35, 10, 28);
    case 'dodecahedron': return new THREE.DodecahedronGeometry(size * 1.2);
    case 'icosahedron':  return new THREE.IcosahedronGeometry(size * 1.2);
    case 'cone':         return new THREE.ConeGeometry(size, size * 2, 14);
    case 'cylinder':     return new THREE.CylinderGeometry(size * 0.7, size * 0.7, size * 1.8, 14);
    default:             return new THREE.BoxGeometry(size * 1.8, size * 1.8, size * 1.8);
  }
}

function ShapeMesh({ shape, color, size = 0.45, wireframe = false }: {
  shape: ShapeId; color: string; size?: number; wireframe?: boolean;
}) {
  return (
    <mesh key={`${shape}-${size}`}>
      <primitive object={makeGeo(shape, size)} attach="geometry" />
      <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.25} wireframe={wireframe} />
    </mesh>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
// 3D SCENE COMPONENTS
// ═════════════════════════════════════════════════════════════════════════════

function BlochScene({ cfg }: { cfg: BuilderConfig }) {
  const vecRef     = useRef<THREE.Mesh>(null!);
  const haloRef    = useRef<THREE.Mesh>(null!);
  const lineGeoRef = useRef(
    new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(), new THREE.Vector3(0, 1.5, 0)])
  );

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime() * cfg.speed;
    let x: number, y: number, z: number;
    if (cfg.autoMode) {
      const th = Math.PI / 2 + Math.sin(t * 0.8) * 0.5;
      const ph = t * 0.7;
      x = Math.sin(th) * Math.cos(ph) * 1.5;
      y = Math.cos(th) * 1.5;
      z = Math.sin(th) * Math.sin(ph) * 1.5;
    } else {
      const tRad = cfg.blochTheta * Math.PI / 180;
      const pRad = cfg.blochPhi   * Math.PI / 180;
      x = Math.sin(tRad) * Math.cos(pRad) * 1.5;
      y = Math.cos(tRad) * 1.5;
      z = Math.sin(tRad) * Math.sin(pRad) * 1.5;
    }
    vecRef.current?.position.set(x, y, z);
    if (haloRef.current) {
      haloRef.current.position.set(x, y, z);
      haloRef.current.scale.setScalar(1 + 0.1 * Math.sin(t * 2));
    }
    lineGeoRef.current.setFromPoints([new THREE.Vector3(0, 0, 0), new THREE.Vector3(x, y, z)]);
  });

  const axisPairs: [THREE.Vector3, THREE.Vector3][] = [
    [new THREE.Vector3(0, 0, 0), new THREE.Vector3(0,  2, 0)],
    [new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, -2, 0)],
    [new THREE.Vector3(0, 0, 0), new THREE.Vector3( 2, 0, 0)],
    [new THREE.Vector3(0, 0, 0), new THREE.Vector3(-2, 0, 0)],
  ];
  const axisColors = ['#26de81', '#fc5c65', '#63b3ed', '#a78bfa'];

  return (
    <group>
      <Sphere args={[1.5, 32, 24]}>
        <meshBasicMaterial color={cfg.blochColor} transparent opacity={0.45} side={THREE.DoubleSide} />
      </Sphere>
      <Torus args={[1.5, 0.012, 6, 64]} rotation={[Math.PI / 2, 0, 0]}>
        <meshBasicMaterial color="#1a3a70" transparent opacity={0.5} />
      </Torus>
      <Torus args={[1.5, 0.012, 6, 64]}>
        <meshBasicMaterial color="#1a3a70" transparent opacity={0.5} />
      </Torus>
      {cfg.showAxes && axisPairs.map((pts, i) => (
        <Line key={i} points={pts} color={axisColors[i]} lineWidth={1.5} transparent opacity={0.5} />
      ))}
      <primitive object={new THREE.Line(lineGeoRef.current, new THREE.LineBasicMaterial({ color: cfg.vectorColor, linewidth: 2 }))} />
      <mesh ref={vecRef}>
        <sphereGeometry args={[0.1, 10, 10]} />
        <meshBasicMaterial color={cfg.vectorColor} />
      </mesh>
      <mesh ref={haloRef}>
        <sphereGeometry args={[0.18, 10, 10]} />
        <meshBasicMaterial color={cfg.vectorColor} transparent opacity={0.18} />
      </mesh>
      <Text position={[0,  1.85, 0]} fontSize={0.18} color="#26de81" anchorX="center">|0⟩</Text>
      <Text position={[0, -1.85, 0]} fontSize={0.18} color="#fc5c65" anchorX="center">|1⟩</Text>
      <Text position={[ 1.85, 0, 0]} fontSize={0.14} color="#63b3ed" anchorX="center">|+⟩</Text>
      <Text position={[-1.85, 0, 0]} fontSize={0.14} color="#a78bfa" anchorX="center">|−⟩</Text>
      <group position={[3.2, 0, 0]}>
        <ShapeMesh shape={cfg.bitShape} color="#fc5c65" size={0.38} />
        <Text position={[0,  0.8, 0]} fontSize={0.16} color="#fc5c65" anchorX="center">BIT</Text>
        <Text position={[0, -0.8, 0]} fontSize={0.12} color="#fc5c65" anchorX="center">|0⟩ or |1⟩</Text>
      </group>
    </group>
  );
}

function ThreeBodyScene({ cfg }: { cfg: BuilderConfig }) {
  const G = 0.8;
  const bodiesRef = useRef([
    { pos: new THREE.Vector3(-1.2, 0, 0), vel: new THREE.Vector3( 0.347,  0.532,  0), mass: cfg.mass1 },
    { pos: new THREE.Vector3( 1.2, 0, 0), vel: new THREE.Vector3( 0.347,  0.532,  0), mass: cfg.mass2 },
    { pos: new THREE.Vector3( 0,   0, 0), vel: new THREE.Vector3(-0.694, -1.064,  0), mass: cfg.mass3 },
  ]);
  const m0 = useRef<THREE.Mesh>(null!);
  const m1 = useRef<THREE.Mesh>(null!);
  const m2 = useRef<THREE.Mesh>(null!);
  const meshRefs   = [m0, m1, m2];
  const bodyShapes: ShapeId[] = [cfg.body1Shape, cfg.body2Shape, cfg.body3Shape];
  const COLORS = ['#63b3ed', '#f5d07a', '#fb923c'];

  useFrame(() => {
    if (!cfg.autoMode) return;
    const bs = bodiesRef.current;
    const dt = 0.006 * cfg.speed;
    const forces = bs.map(() => new THREE.Vector3());
    for (let i = 0; i < 3; i++) {
      for (let j = i + 1; j < 3; j++) {
        const diff = new THREE.Vector3().subVectors(bs[j].pos, bs[i].pos);
        const dist = Math.max(diff.length(), 0.3);
        const fd   = diff.normalize().multiplyScalar(G * bs[i].mass * bs[j].mass / (dist * dist));
        forces[i].add(fd); forces[j].sub(fd);
      }
    }
    bs.forEach((b, i) => {
      b.vel.addScaledVector(forces[i], dt / b.mass);
      b.pos.addScaledVector(b.vel, dt);
      meshRefs[i].current?.position.copy(b.pos);
      meshRefs[i].current && (meshRefs[i].current.rotation.y += 0.02);
    });
  });

  return (
    <group>
      <pointLight position={[0, 0, 4]} intensity={1.5} />
      {COLORS.map((color, i) => (
        <Trail key={`${i}-${bodyShapes[i]}`} width={0.8} length={40} color={color} attenuation={(t) => t * t}>
          <mesh ref={meshRefs[i]}>
            <primitive object={makeGeo(bodyShapes[i], 0.2)} attach="geometry" />
            <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.4} />
          </mesh>
        </Trail>
      ))}
    </group>
  );
}

function WaveScene({ cfg }: { cfg: BuilderConfig }) {
  const meshRef = useRef<THREE.Mesh>(null!);
  const geoRef  = useRef(new THREE.PlaneGeometry(8, 8, 60, 60));

  useFrame(({ clock }) => {
    const t   = clock.getElapsedTime() * cfg.speed;
    const pos = meshRef.current?.geometry.attributes.position;
    if (!pos) return;
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i), y = pos.getY(i);
      const r = Math.sqrt(x * x + y * y);
      let z = 0;
      switch (cfg.waveMode) {
        case 'ripple':
          z = cfg.waveAmp * Math.sin(r * cfg.waveFreq - t * 3) * Math.exp(-r * 0.25);
          break;
        case 'standing':
          z = cfg.waveAmp * Math.sin(x * cfg.waveFreq) * Math.cos(t * 3);
          break;
        case 'interference': {
          const d1 = Math.sqrt((x - 1.5) * (x - 1.5) + y * y);
          const d2 = Math.sqrt((x + 1.5) * (x + 1.5) + y * y);
          z = cfg.waveAmp * 0.5 * (Math.sin(d1 * cfg.waveFreq - t * 3) + Math.sin(d2 * cfg.waveFreq - t * 3));
          break;
        }
        case 'gaussian': {
          const sigma = 1.5;
          z = cfg.waveAmp * Math.exp(-(x * x + y * y) / (2 * sigma * sigma)) * Math.cos(cfg.waveFreq * x - t * 2);
          break;
        }
      }
      pos.setZ(i, z);
    }
    pos.needsUpdate = true;
    meshRef.current.geometry.computeVertexNormals();
  });

  return (
    <group rotation={[-Math.PI / 3, 0, 0]}>
      <mesh ref={meshRef} geometry={geoRef.current}>
        <meshStandardMaterial color={cfg.waveColor} wireframe transparent opacity={0.7} />
      </mesh>
      <mesh geometry={geoRef.current} position={[0, 0, -0.02]}>
        <meshStandardMaterial color={cfg.waveColor} transparent opacity={0.08} side={THREE.DoubleSide} />
      </mesh>
      <pointLight position={[0, 4, 4]} intensity={2} color={cfg.waveColor} />
    </group>
  );
}

function OrbitsScene({ cfg }: { cfg: BuilderConfig }) {
  const planets = [
    { r: 1.8, speed: 1.5, size: 0.12, color: '#63b3ed' },
    { r: 2.8, speed: 0.9, size: 0.18, color: '#f5d07a' },
    { r: 3.8, speed: 0.6, size: 0.14, color: '#fb923c' },
    { r: 4.8, speed: 0.4, size: 0.22, color: '#a78bfa' },
  ];
  const p0 = useRef<THREE.Mesh>(null!), p1 = useRef<THREE.Mesh>(null!);
  const p2 = useRef<THREE.Mesh>(null!), p3 = useRef<THREE.Mesh>(null!);
  const pRefs = [p0, p1, p2, p3];

  useFrame(({ clock }) => {
    if (!cfg.autoMode) return;
    const t = clock.getElapsedTime() * cfg.speed;
    planets.forEach((p, i) => {
      const m = pRefs[i].current;
      if (!m) return;
      m.position.set(Math.cos(t * p.speed) * p.r, 0, Math.sin(t * p.speed) * p.r);
      m.rotation.y += 0.02;
    });
  });

  const ring = (r: number) =>
    Array.from({ length: 65 }, (_, i) => {
      const a = (i / 64) * Math.PI * 2;
      return new THREE.Vector3(Math.cos(a) * r, 0, Math.sin(a) * r);
    });

  return (
    <group>
      <Sphere args={[0.5, 20, 20]}>
        <meshStandardMaterial color="#f5d07a" emissive="#f5a623" emissiveIntensity={1.2} />
      </Sphere>
      <pointLight position={[0, 0, 0]} intensity={3} color="#fff5c0" distance={12} />
      {planets.map((p, i) => (
        <group key={i}>
          {cfg.showAxes && <Line points={ring(p.r)} color={p.color} lineWidth={0.5} transparent opacity={0.2} />}
          <Trail width={0.5} length={20} color={p.color} attenuation={(t) => t}>
            <mesh ref={pRefs[i]}>
              <sphereGeometry args={[p.size, 10, 10]} />
              <meshStandardMaterial color={p.color} emissive={p.color} emissiveIntensity={0.3} />
            </mesh>
          </Trail>
        </group>
      ))}
    </group>
  );
}

function BlankScene({ uploadedScene }: { uploadedScene?: THREE.Group | null }) {
  const groupRef = useRef<THREE.Group>(null!);

  useEffect(() => {
    if (!groupRef.current || !uploadedScene) return;
    while (groupRef.current.children.length) groupRef.current.remove(groupRef.current.children[0]);
    groupRef.current.add(uploadedScene);
  }, [uploadedScene]);

  useFrame(({ clock }) => {
    if (groupRef.current && uploadedScene) {
      groupRef.current.rotation.y = clock.getElapsedTime() * 0.4;
    }
  });

  return (
    <group ref={groupRef}>
      {!uploadedScene && (
        <Box args={[1, 1, 1]}><meshStandardMaterial color="#1a3a70" wireframe /></Box>
      )}
      <pointLight position={[3, 3, 3]} intensity={2} />
    </group>
  );
}

// ── Dispatcher ────────────────────────────────────────────────────────────────
// simGroupRef wraps ONLY the simulation geometry — Stars/Grid/lights outside it
// are not included when GLBExporter calls GLTFExporter.parse(simGroupRef.current).
function SceneContent({ cfg, simGroupRef, uploadedScene }: {
  cfg:           BuilderConfig;
  simGroupRef:   React.RefObject<THREE.Group>;
  uploadedScene: THREE.Group | null;
}) {
  return (
    <>
      {cfg.showStars && <Stars radius={30} depth={10} count={800} factor={3} fade />}
      {cfg.showGrid  && <Grid args={[12, 12]} position={[0, -2.5, 0]} cellColor="#0a1428" sectionColor="#0d2040" />}
      <ambientLight intensity={0.4} />
      <group ref={simGroupRef}>
        <pointLight position={[5, 5, 5]} intensity={1.5} />
        {cfg.preset === 'bloch'     && <BlochScene     cfg={cfg} />}
        {cfg.preset === 'threebody' && <ThreeBodyScene cfg={cfg} />}
        {cfg.preset === 'wave'      && <WaveScene      cfg={cfg} />}
        {cfg.preset === 'orbits'    && <OrbitsScene    cfg={cfg} />}
        {cfg.preset === 'blank'     && <BlankScene uploadedScene={uploadedScene} />}
      </group>
      <OrbitControls makeDefault enablePan enableZoom enableRotate />
    </>
  );
}

// ── GLBExporter — must be inside Canvas to access gl ─────────────────────────
// Exports only targetRef.current (the sim group) so Stars/Grid are excluded.
function GLBExporter({ onExport, targetRef }: {
  onExport:  (blob: Blob) => void;
  targetRef: React.RefObject<THREE.Group>;
}) {
  const { gl }      = useThree();
  const onExportRef = useRef(onExport);
  onExportRef.current = onExport;

  useEffect(() => {
    (window as any).__r3fExportGLB = () => {
      const target = targetRef.current;
      if (!target) { console.error('GLB export: simGroupRef not ready'); return; }
      const exporter = new GLTFExporter();
      exporter.parse(
        target,
        (gltf) => onExportRef.current(new Blob([gltf as ArrayBuffer], { type: 'model/gltf-binary' })),
        (err)  => console.error('GLB export error', err),
        { binary: true, onlyVisible: true }
      );
    };
    (window as any).__r3fSnapshot = () => gl.domElement.toDataURL('image/png');
    return () => {
      delete (window as any).__r3fExportGLB;
      delete (window as any).__r3fSnapshot;
    };
  }, [gl, targetRef]);

  return null;
}

// ═════════════════════════════════════════════════════════════════════════════
// MAIN EXPORTED COMPONENT
// ═════════════════════════════════════════════════════════════════════════════

export function SimulationBuilderTab({
  isAdmin,
  canModerate,
}: {
  isAdmin:      boolean;
  canModerate:  boolean;
}) {
  const [cfg,             setCfg]             = useState<BuilderConfig>(defaultConfig);
  const [simId,           setSimId]           = useState('');
  const [simTitle,        setSimTitle]        = useState('');
  const [simField,        setSimField]        = useState('');
  const [simDesc,         setSimDesc]         = useState('');
  const [simCaption,      setSimCaption]      = useState('');
  const [simInsights,     setSimInsights]     = useState('');
  const [simTags,         setSimTags]         = useState('');
  const [status,          setStatus]          = useState('');
  const [error,           setError]           = useState('');
  const [exporting,       setExporting]       = useState(false);
  const [uploading,       setUploading]       = useState(false);
  const [glbBlob,         setGlbBlob]         = useState<Blob | null>(null);
  const [snapshotB64,     setSnapshotB64]     = useState('');
  const [uploadedScene,   setUploadedScene]   = useState<THREE.Group | null>(null);
  const [uploadedGlbName, setUploadedGlbName] = useState('');

  const simGroupRef  = useRef<THREE.Group>(null!);
  const glbFileInput = useRef<HTMLInputElement>(null);

  const set = <K extends keyof BuilderConfig>(k: K, v: BuilderConfig[K]) =>
    setCfg((c) => ({ ...c, [k]: v }));

  // ── Load an external GLB into the Blank Canvas ────────────────────────────
  const loadGlbIntoCanvas = (file: File) => {
    const loader = new GLTFLoader();
    const url    = URL.createObjectURL(file);
    loader.load(
      url,
      (gltf) => {
        URL.revokeObjectURL(url);
        setUploadedScene(gltf.scene);
        setUploadedGlbName(file.name);
        // Store the original file as the glbBlob so Save & Upload works immediately
        setGlbBlob(file);
        setStatus('GLB loaded: ' + file.name + ' — ready to snapshot & save.');
      },
      undefined,
      (err: any) => setError('Failed to load GLB: ' + (err?.message ?? String(err)))
    );
  };

  // ── Handlers ─────────────────────────────────────────────────────────────
  const handleGLBReady = useCallback((blob: Blob) => {
    setGlbBlob(blob);
    setExporting(false);
    setStatus('GLB exported — ready to upload.');
  }, []);

  const exportGLB = () => {
    setExporting(true); setStatus(''); setError('');
    (window as any).__r3fExportGLB?.();
  };

  const captureSnapshot = () => {
    const url = (window as any).__r3fSnapshot?.();
    if (url) { setSnapshotB64(url); setStatus('Snapshot captured.'); }
  };

  const downloadGLB = () => {
    if (!glbBlob) return;
    const url = URL.createObjectURL(glbBlob);
    Object.assign(document.createElement('a'), { href: url, download: `${simId || 'sim'}.glb` }).click();
    URL.revokeObjectURL(url);
  };

  const uploadToBackend = async () => {
    if (!simId.trim())    { setError('Simulation ID is required.'); return; }
    if (!simTitle.trim()) { setError('Title is required.'); return; }
    if (!glbBlob && !snapshotB64) {
      setError('Export a GLB and/or capture a snapshot first before saving.'); return;
    }
    setUploading(true); setStatus(''); setError('');
    try {
      setStatus('(1/3) Creating simulation record...');
      const payload = {
        id:              simId.trim(),
        title:           simTitle.trim(),
        field:           simField.trim(),
        fieldColor:      'steami-badge-cyan',
        description:     simDesc.trim(),
        caption:         simCaption.trim(),
        readTime:        '10 min interactive',
        simulation_type: cfg.preset,
        component_id:    cfg.preset,
        insights: simInsights.split('\n').map((l: string) => l.trim()).filter(Boolean),
        tags:     simTags.split(',').map((l: string)    => l.trim()).filter(Boolean),
      };
      try {
        await api.simulations.create(payload);
      } catch (createErr: any) {
        const httpStatus = createErr?.status ?? createErr?.response?.status;
        if (httpStatus === 409 || httpStatus === 422) {
          await api.simulations.update(simId.trim(), payload);
        } else {
          throw createErr;
        }
      }

      if (snapshotB64) {
        setStatus('(2/3) Uploading snapshot to Cloudinary...');
        await api.simulations.uploadSnapshot(simId.trim(), snapshotB64);
      } else {
        setStatus('(2/3) No snapshot captured — skipping...');
      }

      if (glbBlob) {
        setStatus('(3/3) Uploading GLB to Cloudinary...');
        const glbFile = new File([glbBlob], `${simId.trim()}.glb`, { type: 'model/gltf-binary' });
        await api.simulations.uploadGlb(simId.trim(), glbFile);
      } else {
        setStatus('(3/3) No GLB exported — skipping...');
      }

      setStatus('Saved & uploaded to Cloudinary! Check the Simulations page.');
    } catch (err: any) {
      const detail = err?.response?.data?.detail ?? err?.message ?? 'Upload failed';
      setError('Error: ' + detail);
    } finally {
      setUploading(false);
    }
  };

  const inp = 'w-full rounded-md border border-white/10 bg-transparent px-3 py-2 text-[13px] outline-none focus:border-steami-cyan/40';
  const lbl = 'block text-[10px] text-muted-foreground mb-1 uppercase tracking-wider';

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="lg:col-span-2 space-y-5">

      {/* Header */}
      <div className="glass-card p-5">
        <div className="steami-section-label mb-1">🔬 3D SIMULATION BUILDER</div>
        <p className="text-[13px] text-muted-foreground">
          Build a live Three.js simulation, customise it with the controls, then export as GLB +
          capture a PNG snapshot — both saved to Cloudinary automatically.
          On the Blank Canvas tab you can also load your own GLB/GLTF file directly.
        </p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[1fr_380px] gap-5">

        {/* ── LEFT: canvas + preset picker ── */}
        <div className="space-y-4">

          {/* Preset grid */}
          <div className="glass-card p-4">
            <p className={lbl}>Choose Preset</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-5 gap-2 mt-2">
              {PRESETS.map((p) => (
                <button key={p.id} onClick={() => set('preset', p.id)}
                  className={`rounded-lg border p-3 text-left transition-all ${
                    cfg.preset === p.id
                      ? 'border-steami-cyan/60 bg-steami-cyan/10'
                      : 'border-white/10 hover:border-white/20'
                  }`}
                >
                  <div className="text-xl mb-1">{p.icon}</div>
                  <div className="font-mono text-[11px] text-steami-cyan leading-tight">{p.label}</div>
                  <div className="font-mono text-[10px] text-muted-foreground mt-0.5 leading-tight hidden sm:block">{p.desc}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Canvas */}
          <div className="glass-card overflow-hidden relative" style={{ height: 420 }}>
            <Canvas
              gl={{ preserveDrawingBuffer: true, antialias: true }}
              camera={{ position: [0, 2, 6], fov: 55 }}
              style={{ background: cfg.bgColor, width: '100%', height: '100%' }}
            >
              <Suspense fallback={null}>
                <SceneContent cfg={cfg} simGroupRef={simGroupRef} uploadedScene={uploadedScene} />
                <GLBExporter onExport={handleGLBReady} targetRef={simGroupRef} />
              </Suspense>
            </Canvas>
            <div className="absolute top-3 left-3 font-mono text-[10px] text-white/25 pointer-events-none select-none">
              DRAG · SCROLL · RIGHT-CLICK PAN
            </div>
            <div className="absolute bottom-3 right-3 flex gap-2 flex-wrap justify-end">
              <button onClick={captureSnapshot} className="steami-btn text-[10px] px-3 py-1.5">
                📷 SNAPSHOT
              </button>

              {/* Blank-canvas only: load external GLB */}
              {cfg.preset === 'blank' && (
                <>
                  <input
                    ref={glbFileInput}
                    type="file"
                    accept=".glb,.gltf"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) loadGlbIntoCanvas(file);
                      e.target.value = '';
                    }}
                  />
                  <button
                    onClick={() => glbFileInput.current?.click()}
                    title="Load a .glb or .gltf file into the blank canvas"
                    className="steami-btn text-[10px] px-3 py-1.5"
                  >
                    📂 {uploadedGlbName
                      ? (uploadedGlbName.length > 14 ? uploadedGlbName.slice(0, 14) + '…' : uploadedGlbName)
                      : 'LOAD GLB'}
                  </button>
                </>
              )}

              <button onClick={exportGLB} disabled={exporting}
                className="steami-btn text-[10px] px-3 py-1.5 disabled:opacity-50">
                {exporting ? '⏳ EXPORTING…' : '📦 EXPORT GLB'}
              </button>
            </div>
          </div>

          {/* Snapshot preview */}
          {snapshotB64 && (
            <div className="glass-card p-3 space-y-2">
              <p className={lbl}>Captured Snapshot</p>
              <img src={snapshotB64} alt="Snapshot" className="w-full rounded-lg object-cover" style={{ maxHeight: 160 }} />
            </div>
          )}

          {/* GLB ready */}
          {glbBlob && (
            <div className="glass-card p-3 flex items-center justify-between gap-3">
              <div>
                <p className="font-mono text-[11px] text-steami-green">✓ GLB ready — {(glbBlob.size / 1024).toFixed(1)} KB</p>
                <p className="font-mono text-[10px] text-muted-foreground">Will be uploaded to Cloudinary when you click Save & Upload</p>
              </div>
              <button onClick={downloadGLB} className="steami-btn text-[10px] px-3 py-1.5 flex-shrink-0">↓ Download</button>
            </div>
          )}
        </div>

        {/* ── RIGHT: controls + metadata ── */}
        <div className="space-y-4">

          {/* AUTO / MANUAL toggle */}
          <div className="glass-card p-4">
            <p className={lbl}>Animation Mode</p>
            <div className="flex gap-2 mt-2">
              <button onClick={() => set('autoMode', true)}
                className={`flex-1 flex items-center justify-center gap-2 rounded-lg border py-2 text-[11px] font-mono transition-all ${
                  cfg.autoMode
                    ? 'border-steami-green/60 bg-steami-green/10 text-steami-green'
                    : 'border-white/10 text-muted-foreground hover:border-white/20'
                }`}>
                <span className={`w-1.5 h-1.5 rounded-full ${cfg.autoMode ? 'bg-steami-green animate-pulse' : 'bg-white/20'}`} />
                ⟳ AUTO
              </button>
              <button onClick={() => set('autoMode', false)}
                className={`flex-1 flex items-center justify-center gap-2 rounded-lg border py-2 text-[11px] font-mono transition-all ${
                  !cfg.autoMode
                    ? 'border-steami-gold/60 bg-steami-gold/10 text-steami-gold'
                    : 'border-white/10 text-muted-foreground hover:border-white/20'
                }`}>
                <span className={`w-1.5 h-1.5 rounded-full ${!cfg.autoMode ? 'bg-steami-gold' : 'bg-white/20'}`} />
                ⊙ MANUAL
              </button>
            </div>
            {!cfg.autoMode && (
              <p className="font-mono text-[10px] text-steami-gold/70 mt-2 leading-relaxed">
                Manual mode freezes the animation — use per-preset sliders to position objects precisely.
              </p>
            )}
          </div>

          {/* Scene settings */}
          <div className="glass-card p-4 space-y-3">
            <p className={lbl}>Scene Settings</p>
            <div className="flex items-center justify-between">
              <span className="font-mono text-[11px] text-muted-foreground">Background</span>
              <input type="color" value={cfg.bgColor} onChange={(e) => set('bgColor', e.target.value)}
                className="w-10 h-7 rounded cursor-pointer border border-white/10" />
            </div>
            <div className="flex items-center justify-between gap-2">
              <span className="font-mono text-[11px] text-muted-foreground">Speed</span>
              <input type="range" min="0.1" max="4" step="0.1" value={cfg.speed}
                onChange={(e) => set('speed', +e.target.value)}
                className="w-24 accent-[hsl(var(--steami-cyan))]" />
              <span className="font-mono text-[10px] w-8">{cfg.speed.toFixed(1)}×</span>
            </div>
            {(['showGrid', 'showStars', 'showAxes'] as const).map((k) => (
              <div key={k} className="flex items-center justify-between">
                <span className="font-mono text-[11px] text-muted-foreground capitalize">{k.replace('show', '')}</span>
                <button onClick={() => set(k, !cfg[k])}
                  className={`relative w-10 h-5 rounded-full transition-colors ${cfg[k] ? 'bg-steami-cyan' : 'bg-white/10'}`}>
                  <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all ${cfg[k] ? 'left-5' : 'left-0.5'}`} />
                </button>
              </div>
            ))}
          </div>

          {/* ── Bloch controls ── */}
          {cfg.preset === 'bloch' && (
            <div className="glass-card p-4 space-y-3">
              <p className={lbl}>Bloch Sphere</p>
              {([['blochColor', 'Sphere Color'], ['vectorColor', 'Vector Color']] as const).map(([k, label]) => (
                <div key={k} className="flex items-center justify-between">
                  <span className="font-mono text-[11px] text-muted-foreground">{label}</span>
                  <input type="color" value={cfg[k]} onChange={(e) => set(k, e.target.value)}
                    className="w-10 h-7 rounded cursor-pointer border border-white/10" />
                </div>
              ))}
              {!cfg.autoMode && (
                <div className="space-y-2 pt-1 border-t border-white/5">
                  <p className="font-mono text-[10px] text-muted-foreground">State Vector Angles</p>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[10px] text-muted-foreground w-14">θ (polar)</span>
                    <input type="range" min="0" max="180" value={cfg.blochTheta}
                      onChange={(e) => set('blochTheta', +e.target.value)}
                      className="flex-1 accent-[hsl(var(--steami-gold))]" />
                    <span className="font-mono text-[10px] text-steami-gold w-10 text-right">{cfg.blochTheta}°</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[10px] text-muted-foreground w-14">φ (azimuth)</span>
                    <input type="range" min="0" max="360" value={cfg.blochPhi}
                      onChange={(e) => set('blochPhi', +e.target.value)}
                      className="flex-1 accent-[hsl(var(--steami-cyan))]" />
                    <span className="font-mono text-[10px] text-steami-cyan w-10 text-right">{cfg.blochPhi}°</span>
                  </div>
                </div>
              )}
              <div className="pt-1 border-t border-white/5">
                <p className="font-mono text-[10px] text-muted-foreground mb-1">Classical Bit Shape</p>
                <ShapePicker value={cfg.bitShape} onChange={(s) => set('bitShape', s)} />
              </div>
            </div>
          )}

          {/* ── Three-body controls ── */}
          {cfg.preset === 'threebody' && (
            <div className="glass-card p-4 space-y-3">
              <p className={lbl}>Three-Body System</p>
              {(['mass1', 'mass2', 'mass3'] as const).map((k, i) => (
                <div key={k} className="flex items-center gap-2">
                  <span className="font-mono text-[11px] text-muted-foreground w-12">Body {i + 1}</span>
                  <input type="range" min="0.2" max="5" step="0.1" value={cfg[k]}
                    onChange={(e) => set(k, +e.target.value)}
                    className="flex-1 accent-[hsl(var(--steami-orange))]" />
                  <span className="font-mono text-[10px] w-8 text-right">{cfg[k].toFixed(1)}</span>
                </div>
              ))}
              <div className="pt-1 border-t border-white/5 space-y-2">
                <p className="font-mono text-[10px] text-muted-foreground">Body Shapes</p>
                {(['body1Shape', 'body2Shape', 'body3Shape'] as const).map((k, i) => (
                  <div key={k}>
                    <p className="font-mono text-[9px] text-muted-foreground/60 mb-1">Body {i + 1}</p>
                    <ShapePicker value={cfg[k]} onChange={(s) => set(k, s)} />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── Wave controls ── */}
          {cfg.preset === 'wave' && (
            <div className="glass-card p-4 space-y-3">
              <p className={lbl}>Wave Function</p>
              <div>
                <p className="font-mono text-[10px] text-muted-foreground mb-1">Wave Type</p>
                <div className="grid grid-cols-2 gap-1">
                  {(['ripple', 'standing', 'interference', 'gaussian'] as const).map((m) => (
                    <button key={m} onClick={() => set('waveMode', m)}
                      className={`font-mono text-[10px] px-2 py-1 rounded border transition-all capitalize ${
                        cfg.waveMode === m
                          ? 'border-steami-cyan/60 bg-steami-cyan/10 text-steami-cyan'
                          : 'border-white/10 text-muted-foreground hover:border-white/20'
                      }`}>{m}</button>
                  ))}
                </div>
              </div>
              {([['waveAmp', 'Amplitude', 0.2, 3], ['waveFreq', 'Frequency', 0.5, 6]] as const).map(([k, label, min, max]) => (
                <div key={k} className="flex items-center gap-2">
                  <span className="font-mono text-[11px] text-muted-foreground w-20">{label}</span>
                  <input type="range" min={min} max={max} step="0.1" value={cfg[k as 'waveAmp' | 'waveFreq']}
                    onChange={(e) => set(k as any, +e.target.value)}
                    className="flex-1 accent-[hsl(var(--steami-cyan))]" />
                  <span className="font-mono text-[10px] w-8 text-right">{(cfg[k as 'waveAmp' | 'waveFreq']).toFixed(1)}</span>
                </div>
              ))}
              <div className="flex items-center justify-between">
                <span className="font-mono text-[11px] text-muted-foreground">Color</span>
                <input type="color" value={cfg.waveColor} onChange={(e) => set('waveColor', e.target.value)}
                  className="w-10 h-7 rounded cursor-pointer border border-white/10" />
              </div>
            </div>
          )}

          {/* ── Orbits controls ── */}
          {cfg.preset === 'orbits' && !cfg.autoMode && (
            <div className="glass-card p-4 space-y-2">
              <p className={lbl}>Manual Mode — Orbits</p>
              <p className="font-mono text-[10px] text-muted-foreground/60 leading-relaxed">
                In MANUAL mode, orbital animation is paused. Toggle AUTO to resume live orbits.
                Speed control still applies on AUTO.
              </p>
            </div>
          )}

          {/* ── Blank canvas info ── */}
          {cfg.preset === 'blank' && (
            <div className="glass-card p-4 space-y-2">
              <p className={lbl}>Blank Canvas</p>
              {uploadedGlbName ? (
                <p className="font-mono text-[11px] text-steami-green">✓ Loaded: {uploadedGlbName}</p>
              ) : (
                <p className="font-mono text-[10px] text-muted-foreground/70 leading-relaxed">
                  Click <span className="text-steami-cyan">📂 LOAD GLB</span> above the canvas to load
                  a .glb or .gltf file. It will appear in the canvas, auto-rotate, and be exported
                  when you click EXPORT GLB or Save & Upload.
                </p>
              )}
            </div>
          )}

          {/* Metadata + upload */}
          <div className="glass-card p-4 space-y-3">
            <p className={lbl}>Save to Backend</p>
            <div>
              <label className={lbl}>ID (slug) <span className="text-steami-red">*</span></label>
              <input className={inp} value={simId} onChange={(e) => setSimId(e.target.value)} placeholder="e.g. wave-function" />
            </div>
            <div>
              <label className={lbl}>Title <span className="text-steami-red">*</span></label>
              <input className={inp} value={simTitle} onChange={(e) => setSimTitle(e.target.value)} placeholder="e.g. Wave Function Collapse" />
            </div>
            <div>
              <label className={lbl}>Field</label>
              <input className={inp} value={simField} onChange={(e) => setSimField(e.target.value)} placeholder="e.g. QUANTUM PHYSICS" />
            </div>
            <div>
              <label className={lbl}>Description</label>
              <textarea className={inp} rows={2} value={simDesc} onChange={(e) => setSimDesc(e.target.value)} placeholder="Short description for the card…" />
            </div>
            <div>
              <label className={lbl}>Caption (below canvas)</label>
              <input className={inp} value={simCaption} onChange={(e) => setSimCaption(e.target.value)} placeholder="Drag to rotate…" />
            </div>
            <div>
              <label className={lbl}>Key Insights (one per line)</label>
              <textarea className={inp} rows={3} value={simInsights} onChange={(e) => setSimInsights(e.target.value)} placeholder={'Insight one\nInsight two'} />
            </div>
            <div>
              <label className={lbl}>Tags (comma-separated)</label>
              <input className={inp} value={simTags} onChange={(e) => setSimTags(e.target.value)} placeholder="quantum, physics, interactive" />
            </div>

            {status && <p className="font-mono text-[11px] text-steami-green">{status}</p>}
            {error  && <p className="font-mono text-[11px] text-steami-red">{error}</p>}

            <div className="flex gap-2 pt-1">
              <button
                onClick={uploadToBackend}
                disabled={uploading || !canModerate || (!glbBlob && !snapshotB64)}
                className="steami-btn text-[11px] flex-1 disabled:opacity-40"
              >
                {uploading ? '⏳ SAVING…' : '⬆ SAVE & UPLOAD'}
              </button>
              {isAdmin && (
                <button
                  onClick={async () => {
                    setStatus(''); setError('');
                    try { const r = await api.simulations.seed(); setStatus('Seeded ' + (r?.seeded ?? '?') + '.'); }
                    catch (e: any) { setError(e.message); }
                  }}
                  className="steami-btn text-[11px]" title="Seed defaults (admin)"
                >↻ Seed</button>
              )}
            </div>
            <p className="font-mono text-[10px] text-muted-foreground/50 leading-relaxed">
              SAVE & UPLOAD: (1) creates the DB record, (2) uploads snapshot PNG, (3) uploads GLB — all to Cloudinary.
            </p>
          </div>

        </div>
      </div>
    </div>
  );
}
