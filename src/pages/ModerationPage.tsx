import { useEffect, useRef, useState, useCallback, Suspense } from 'react';
import { SteamiLayout } from '@/components/SteamiLayout';
import { ApiStatePanel, ObjectList } from '@/components/ApiStatePanel';
import { api } from '@/lib/api';
import { useAuthStore } from '@/stores/auth-store';
import { ShieldCheck } from 'lucide-react';
import { NewsletterTab } from '@/components/NewsletterTab';

// ── React Three Fiber + Drei ───────────────────────────────────────────────────
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import {
  OrbitControls, Sphere, Box, Torus, Line,
  Trail, Stars, Text, Grid,
} from '@react-three/drei';
import * as THREE from 'three';
import { GLTFExporter } from 'three/examples/jsm/exporters/GLTFExporter';

// ══════════════════════════════════════════════════════════════════════════════
// TYPES
// ══════════════════════════════════════════════════════════════════════════════

type SimPreset = 'bloch' | 'threebody' | 'orbits' | 'wave' | 'blank';
type ShapeId   = 'sphere' | 'cube' | 'octahedron' | 'tetrahedron' | 'torus' | 'dodecahedron' | 'icosahedron' | 'cone' | 'cylinder';

interface BuilderConfig {
  preset:      SimPreset;
  bgColor:     string;
  showGrid:    boolean;
  showStars:   boolean;
  showAxes:    boolean;
  speed:       number;
  autoMode:    boolean;    // ← NEW: auto (animated) vs manual (sliders)
  // Bloch sphere
  blochColor:  string;
  vectorColor: string;
  bitShape:    ShapeId;   // ← NEW: shape of the classical bit comparison object
  blochTheta:  number;    // ← NEW: manual θ
  blochPhi:    number;    // ← NEW: manual φ
  // Three-body
  mass1: number; mass2: number; mass3: number;
  body1Shape: ShapeId; body2Shape: ShapeId; body3Shape: ShapeId;  // ← NEW
  // Wave
  waveAmp:   number;
  waveFreq:  number;
  waveColor: string;
  waveMode:  'ripple'|'standing'|'interference'|'gaussian';       // ← NEW
  // Orbits
  orbitSpeed: number;     // ← NEW: per-scene speed multiplier shown separately
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

// ── Shape catalogue shown in builder UI ──────────────────────────────────────
const SHAPES: { id: ShapeId; label: string; icon: string }[] = [
  { id:'sphere',       label:'Sphere',        icon:'○' },
  { id:'cube',         label:'Cube',          icon:'□' },
  { id:'octahedron',   label:'Octahedron',    icon:'◇' },
  { id:'tetrahedron',  label:'Tetrahedron',   icon:'△' },
  { id:'torus',        label:'Torus',         icon:'⊙' },
  { id:'dodecahedron', label:'Dodecahedron',  icon:'⬡' },
  { id:'icosahedron',  label:'Icosahedron',   icon:'◈' },
  { id:'cone',         label:'Cone',          icon:'▽' },
  { id:'cylinder',     label:'Cylinder',      icon:'⊏' },
];

function ShapePicker({ value, onChange }: { value: ShapeId; onChange:(s:ShapeId)=>void }) {
  return (
    <div className="flex flex-wrap gap-1 mt-1">
      {SHAPES.map(s => (
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

// ══════════════════════════════════════════════════════════════════════════════
// 3D SCENE COMPONENTS (all self-contained)
// ══════════════════════════════════════════════════════════════════════════════

// ── Geometry factory shared across scenes ─────────────────────────────────────
function makeGeo(shape: ShapeId, size = 0.45): THREE.BufferGeometry {
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
    default:             return new THREE.BoxGeometry(size*1.8, size*1.8, size*1.8);
  }
}

// ── R3F geometry component that swaps when shape changes ─────────────────────
function ShapeMesh({ shape, color, size = 0.45, wireframe = false }: {
  shape: ShapeId; color: string; size?: number; wireframe?: boolean;
}) {
  const geoKey = `${shape}-${size}`;
  return (
    <mesh key={geoKey}>
      <primitive object={makeGeo(shape, size)} attach="geometry" />
      <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.25} wireframe={wireframe} />
    </mesh>
  );
}

function BlochScene({ cfg }: { cfg: BuilderConfig }) {
  const vecRef  = useRef<THREE.Mesh>(null!);
  const haloRef = useRef<THREE.Mesh>(null!);
  const lineRef = useRef<THREE.Line>(null!);
  const lineGeoRef = useRef(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(), new THREE.Vector3(0,1.5,0)]));

  useFrame(({ clock }) => {
    const t  = clock.getElapsedTime() * cfg.speed;
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
    // Update state vector line
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
      {/* Bloch sphere shell */}
      <Sphere args={[1.5, 32, 24]}>
        <meshBasicMaterial color={cfg.blochColor} transparent opacity={0.45} side={THREE.DoubleSide} />
      </Sphere>
      {/* Equatorial + meridian rings */}
      <Torus args={[1.5, 0.012, 6, 64]} rotation={[Math.PI/2, 0, 0]}>
        <meshBasicMaterial color="#1a3a70" transparent opacity={0.5} />
      </Torus>
      <Torus args={[1.5, 0.012, 6, 64]}>
        <meshBasicMaterial color="#1a3a70" transparent opacity={0.5} />
      </Torus>
      {/* Axes */}
      {cfg.showAxes && axisPairs.map((pts, i) => (
        <Line key={i} points={pts} color={axisColors[i]} lineWidth={1.5} transparent opacity={0.5} />
      ))}
      {/* State vector LINE (origin → tip) */}
      <primitive object={new THREE.Line(lineGeoRef.current, new THREE.LineBasicMaterial({ color: cfg.vectorColor, linewidth: 2 }))} />
      {/* State point */}
      <mesh ref={vecRef}>
        <sphereGeometry args={[0.1, 10, 10]} />
        <meshBasicMaterial color={cfg.vectorColor} />
      </mesh>
      {/* Halo glow */}
      <mesh ref={haloRef}>
        <sphereGeometry args={[0.18, 10, 10]} />
        <meshBasicMaterial color={cfg.vectorColor} transparent opacity={0.18} />
      </mesh>
      {/* Labels */}
      <Text position={[0, 1.85, 0]} fontSize={0.18} color="#26de81" anchorX="center">|0⟩</Text>
      <Text position={[0,-1.85, 0]} fontSize={0.18} color="#fc5c65" anchorX="center">|1⟩</Text>
      <Text position={[ 1.85, 0, 0]} fontSize={0.14} color="#63b3ed" anchorX="center">|+⟩</Text>
      <Text position={[-1.85, 0, 0]} fontSize={0.14} color="#a78bfa" anchorX="center">|−⟩</Text>
      {/* Classical bit — swappable shape (right side) */}
      <group position={[3.2, 0, 0]}>
        <ShapeMesh shape={cfg.bitShape} color="#fc5c65" size={0.38} />
        <Text position={[0, 0.8, 0]} fontSize={0.16} color="#fc5c65" anchorX="center">BIT</Text>
        <Text position={[0,-0.8, 0]} fontSize={0.12} color="#fc5c65" anchorX="center">|0⟩ or |1⟩</Text>
      </group>
    </group>
  );
}

function ThreeBodyScene({ cfg }: { cfg: BuilderConfig }) {
  const G = 0.8;
  const bodiesRef = useRef([
    { pos: new THREE.Vector3(-1.2,0,0), vel: new THREE.Vector3(0.347, 0.532,0),  mass: cfg.mass1 },
    { pos: new THREE.Vector3( 1.2,0,0), vel: new THREE.Vector3(0.347, 0.532,0),  mass: cfg.mass2 },
    { pos: new THREE.Vector3( 0,  0,0), vel: new THREE.Vector3(-0.694,-1.064,0), mass: cfg.mass3 },
  ]);
  const m0 = useRef<THREE.Mesh>(null!);
  const m1 = useRef<THREE.Mesh>(null!);
  const m2 = useRef<THREE.Mesh>(null!);
  const meshRefs = [m0, m1, m2];
  const bodyShapes: ShapeId[] = [cfg.body1Shape, cfg.body2Shape, cfg.body3Shape];
  const COLORS = ['#63b3ed','#f5d07a','#fb923c'];

  useFrame(() => {
    if (!cfg.autoMode) return;           // freeze in manual mode
    const bs = bodiesRef.current;
    const dt = 0.006 * cfg.speed;
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
      meshRefs[i].current && (meshRefs[i].current.rotation.y += 0.02);
    });
  });

  return (
    <group>
      <pointLight position={[0,0,4]} intensity={1.5} />
      {COLORS.map((color, i) => (
        <Trail key={`${i}-${bodyShapes[i]}`} width={0.8} length={40} color={color} attenuation={(t)=>t*t}>
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
      const r = Math.sqrt(x*x + y*y);
      let z = 0;
      switch (cfg.waveMode) {
        case 'ripple':
          z = cfg.waveAmp * Math.sin(r * cfg.waveFreq - t * 3) * Math.exp(-r * 0.25);
          break;
        case 'standing':
          z = cfg.waveAmp * Math.sin(x * cfg.waveFreq) * Math.cos(t * 3);
          break;
        case 'interference': {
          const d1 = Math.sqrt((x-1.5)*(x-1.5) + y*y);
          const d2 = Math.sqrt((x+1.5)*(x+1.5) + y*y);
          z = cfg.waveAmp * 0.5 * (Math.sin(d1 * cfg.waveFreq - t*3) + Math.sin(d2 * cfg.waveFreq - t*3));
          break;
        }
        case 'gaussian': {
          const sigma = 1.5;
          z = cfg.waveAmp * Math.exp(-(x*x + y*y)/(2*sigma*sigma)) * Math.cos(cfg.waveFreq * x - t * 2);
          break;
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
        <meshStandardMaterial color={cfg.waveColor} wireframe transparent opacity={0.7} />
      </mesh>
      {/* Solid underlay */}
      <mesh geometry={geoRef.current} position={[0,0,-0.02]}>
        <meshStandardMaterial color={cfg.waveColor} transparent opacity={0.08} side={THREE.DoubleSide}/>
      </mesh>
      <pointLight position={[0,4,4]} intensity={2} color={cfg.waveColor} />
    </group>
  );
}

function OrbitsScene({ cfg }: { cfg: BuilderConfig }) {
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
    if (!cfg.autoMode) return;
    const t = clock.getElapsedTime() * cfg.speed;
    planets.forEach((p,i) => {
      const m = pRefs[i].current;
      if (!m) return;
      m.position.set(Math.cos(t*p.speed)*p.r, 0, Math.sin(t*p.speed)*p.r);
      m.rotation.y += 0.02;
    });
  });

  const ring = (r: number) =>
    Array.from({length:65},(_,i)=>{const a=(i/64)*Math.PI*2; return new THREE.Vector3(Math.cos(a)*r,0,Math.sin(a)*r);});

  return (
    <group>
      {/* Sun */}
      <Sphere args={[0.5,20,20]}>
        <meshStandardMaterial color="#f5d07a" emissive="#f5a623" emissiveIntensity={1.2} />
      </Sphere>
      <pointLight position={[0,0,0]} intensity={3} color="#fff5c0" distance={12} />
      {planets.map((p,i) => (
        <group key={i}>
          {cfg.showAxes && <Line points={ring(p.r)} color={p.color} lineWidth={0.5} transparent opacity={0.2} />}
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

function BlankScene() {
  return (
    <group>
      <Box args={[1,1,1]}><meshStandardMaterial color="#1a3a70" wireframe /></Box>
      <pointLight position={[3,3,3]} intensity={2} />
    </group>
  );
}

// ── Dispatcher ────────────────────────────────────────────────────────────────
// simGroupRef wraps ONLY the simulation geometry so GLBExporter can export
// just the sim object without Stars / Grid / OrbitControls contaminating the file.
function SceneContent({ cfg, simGroupRef }: {
  cfg:          BuilderConfig;
  simGroupRef:  React.RefObject<THREE.Group>;
}) {
  return (
    <>
      {cfg.showStars && <Stars radius={30} depth={10} count={800} factor={3} fade />}
      {cfg.showGrid  && <Grid args={[12,12]} position={[0,-2.5,0]} cellColor="#0a1428" sectionColor="#0d2040" />}
      <ambientLight intensity={0.4} />
      {/* Only geometry inside this group gets exported to GLB */}
      <group ref={simGroupRef}>
        <pointLight position={[5, 5, 5]} intensity={1.5} />
        {cfg.preset==='bloch'     && <BlochScene     cfg={cfg} />}
        {cfg.preset==='threebody' && <ThreeBodyScene cfg={cfg} />}
        {cfg.preset==='wave'      && <WaveScene      cfg={cfg} />}
        {cfg.preset==='orbits'    && <OrbitsScene    cfg={cfg} />}
        {cfg.preset==='blank'     && <BlankScene />}
      </group>
      <OrbitControls makeDefault enablePan enableZoom enableRotate />
    </>
  );
}

// ── GLBExporter — must be inside Canvas to access gl/scene ───────────────────
// Exports only targetRef (the simulation group) so Stars/Grid/lights are excluded.
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
        target,   // export only the simulation group, not the full scene
        (gltf) => onExportRef.current(new Blob([gltf as ArrayBuffer], { type: 'model/gltf-binary' })),
        (err)  => console.error('GLB export error', err),
        { binary: true, onlyVisible: true }
      );
    };
    (window as any).__r3fSnapshot = () => {
      return gl.domElement.toDataURL('image/png');
    };
    return () => {
      delete (window as any).__r3fExportGLB;
      delete (window as any).__r3fSnapshot;
    };
  }, [gl, targetRef]);

  return null;
}

// ══════════════════════════════════════════════════════════════════════════════
// 3D BUILDER TAB
// ══════════════════════════════════════════════════════════════════════════════

const PRESETS: { id: SimPreset; icon: string; label: string; desc: string }[] = [
  { id:'bloch',     icon:'⚛',  label:'Bloch Sphere',   desc:'Qubit superposition on the Bloch sphere' },
  { id:'threebody', icon:'🌌', label:'Three Body',     desc:'Chaotic gravitational 3-body problem'     },
  { id:'orbits',    icon:'🪐', label:'Orbital System', desc:'Solar system orbital mechanics'           },
  { id:'wave',      icon:'〜', label:'Wave Function',  desc:'Quantum wave function propagation'        },
  { id:'blank',     icon:'◻',  label:'Blank Canvas',   desc:'Start from scratch'                      },
];

function SimulationBuilderTab({ isAdmin, canModerate }: { isAdmin:boolean; canModerate:boolean }) {
  const [cfg,         setCfg]         = useState<BuilderConfig>(defaultConfig);
  const [simId,       setSimId]       = useState('');
  const [simTitle,    setSimTitle]    = useState('');
  const [simField,    setSimField]    = useState('');
  const [simDesc,     setSimDesc]     = useState('');
  const [simCaption,  setSimCaption]  = useState('');
  const [simInsights, setSimInsights] = useState('');
  const [simTags,     setSimTags]     = useState('');
  const [status,      setStatus]      = useState('');
  const [error,       setError]       = useState('');
  const [exporting,   setExporting]   = useState(false);
  const [uploading,   setUploading]   = useState(false);
  const [glbBlob,     setGlbBlob]     = useState<Blob | null>(null);
  const [snapshotB64, setSnapshotB64] = useState('');
  const simGroupRef = useRef<THREE.Group>(null!);

  const set = <K extends keyof BuilderConfig>(k: K, v: BuilderConfig[K]) =>
    setCfg((c) => ({ ...c, [k]: v }));

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
    const a = Object.assign(document.createElement('a'), { href: url, download: `${simId||'sim'}.glb` });
    a.click(); URL.revokeObjectURL(url);
  };

  const uploadToBackend = async () => {
    if (!simId)    { setError('Simulation ID is required.'); return; }
    if (!simTitle) { setError('Title is required.'); return; }
    setUploading(true); setStatus(''); setError('');
    try {
      await api.simulations.create({
        id: simId, title: simTitle, field: simField, fieldColor: 'steami-badge-cyan',
        description: simDesc, caption: simCaption, readTime: '10 min interactive',
        simulation_type: cfg.preset, component_id: cfg.preset,
        insights: simInsights.split('\n').map(l=>l.trim()).filter(Boolean),
        tags:     simTags.split(',').map(l=>l.trim()).filter(Boolean),
      }).catch(() => {});   // ignore duplicate — may already exist

      if (snapshotB64) await api.simulations.uploadSnapshot(simId, snapshotB64);

      if (glbBlob) {
        const file = new File([glbBlob], `${simId}.glb`, { type:'model/gltf-binary' });
        await api.simulations.uploadGlb(simId, file);
      }

      setStatus('✓ Saved & uploaded to Cloudinary!');
    } catch (err:any) {
      setError(err?.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const inp = 'w-full rounded-md border border-white/10 bg-transparent px-3 py-2 text-[13px] outline-none focus:border-steami-cyan/40';
  const lbl = 'block text-[10px] text-muted-foreground mb-1 uppercase tracking-wider';

  return (
    <div className="lg:col-span-2 space-y-5">

      {/* Header */}
      <div className="glass-card p-5">
        <div className="steami-section-label mb-1">🔬 3D SIMULATION BUILDER</div>
        <p className="text-[13px] text-muted-foreground">
          Build a live Three.js simulation using React Three Fiber, customise it with the controls,
          then export as GLB + capture a PNG snapshot — both saved to Cloudinary automatically.
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
                <button key={p.id}
                  onClick={() => set('preset', p.id)}
                  className={`rounded-lg border p-3 text-left transition-all ${cfg.preset===p.id
                    ? 'border-steami-cyan/60 bg-steami-cyan/10'
                    : 'border-white/10 hover:border-white/20'}`}
                >
                  <div className="text-xl mb-1">{p.icon}</div>
                  <div className="font-mono text-[11px] text-steami-cyan leading-tight">{p.label}</div>
                  <div className="font-mono text-[10px] text-muted-foreground mt-0.5 leading-tight hidden sm:block">{p.desc}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Canvas */}
          <div className="glass-card overflow-hidden relative" style={{ height:420 }}>
            <Canvas
              gl={{ preserveDrawingBuffer:true, antialias:true }}
              camera={{ position:[0,2,6], fov:55 }}
              style={{ background:cfg.bgColor, width:'100%', height:'100%' }}
            >
              <Suspense fallback={null}>
                <SceneContent cfg={cfg} simGroupRef={simGroupRef} />
                <GLBExporter onExport={handleGLBReady} targetRef={simGroupRef} />
              </Suspense>
            </Canvas>
            <div className="absolute top-3 left-3 font-mono text-[10px] text-white/25 pointer-events-none select-none">
              DRAG · SCROLL · RIGHT-CLICK PAN
            </div>
            <div className="absolute bottom-3 right-3 flex gap-2">
              <button onClick={captureSnapshot} className="steami-btn text-[10px] px-3 py-1.5">
                📷 SNAPSHOT
              </button>
              <button onClick={exportGLB} disabled={exporting} className="steami-btn text-[10px] px-3 py-1.5 disabled:opacity-50">
                {exporting ? '⏳ EXPORTING…' : '📦 EXPORT GLB'}
              </button>
            </div>
          </div>

          {/* Snapshot preview */}
          {snapshotB64 && (
            <div className="glass-card p-3 space-y-2">
              <p className={lbl}>Captured Snapshot</p>
              <img src={snapshotB64} alt="Snapshot" className="w-full rounded-lg object-cover" style={{ maxHeight:160 }} />
            </div>
          )}

          {/* GLB ready */}
          {glbBlob && (
            <div className="glass-card p-3 flex items-center justify-between gap-3">
              <div>
                <p className="font-mono text-[11px] text-steami-green">✓ GLB ready — {(glbBlob.size/1024).toFixed(1)} KB</p>
                <p className="font-mono text-[10px] text-muted-foreground">Uploaded to Cloudinary on Save</p>
              </div>
              <button onClick={downloadGLB} className="steami-btn text-[10px] px-3 py-1.5 flex-shrink-0">↓ Download</button>
            </div>
          )}
        </div>

        {/* ── RIGHT: controls + metadata ── */}
        <div className="space-y-4">

          {/* ── AUTO / MANUAL MODE TOGGLE ── */}
          <div className="glass-card p-4">
            <p className={lbl}>Animation Mode</p>
            <div className="flex gap-2 mt-2">
              <button
                onClick={() => set('autoMode', true)}
                className={`flex-1 flex items-center justify-center gap-2 rounded-lg border py-2 text-[11px] font-mono transition-all ${
                  cfg.autoMode
                    ? 'border-steami-green/60 bg-steami-green/10 text-steami-green'
                    : 'border-white/10 text-muted-foreground hover:border-white/20'
                }`}
              >
                <span className={`w-1.5 h-1.5 rounded-full ${cfg.autoMode ? 'bg-steami-green animate-pulse' : 'bg-white/20'}`} />
                ⟳ AUTO
              </button>
              <button
                onClick={() => set('autoMode', false)}
                className={`flex-1 flex items-center justify-center gap-2 rounded-lg border py-2 text-[11px] font-mono transition-all ${
                  !cfg.autoMode
                    ? 'border-steami-gold/60 bg-steami-gold/10 text-steami-gold'
                    : 'border-white/10 text-muted-foreground hover:border-white/20'
                }`}
              >
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
              <input type="color" value={cfg.bgColor} onChange={(e)=>set('bgColor',e.target.value)}
                className="w-10 h-7 rounded cursor-pointer border border-white/10" />
            </div>

            <div className="flex items-center justify-between gap-2">
              <span className="font-mono text-[11px] text-muted-foreground">Speed</span>
              <input type="range" min="0.1" max="4" step="0.1" value={cfg.speed}
                onChange={(e)=>set('speed',+e.target.value)}
                className="w-24 accent-[hsl(var(--steami-cyan))]" />
              <span className="font-mono text-[10px] w-8">{cfg.speed.toFixed(1)}×</span>
            </div>

            {(['showGrid','showStars','showAxes'] as const).map((k) => (
              <div key={k} className="flex items-center justify-between">
                <span className="font-mono text-[11px] text-muted-foreground capitalize">{k.replace('show','')}</span>
                <button onClick={()=>set(k,!cfg[k])}
                  className={`relative w-10 h-5 rounded-full transition-colors ${cfg[k] ? 'bg-steami-cyan' : 'bg-white/10'}`}>
                  <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all ${cfg[k] ? 'left-5' : 'left-0.5'}`} />
                </button>
              </div>
            ))}
          </div>

          {/* ── Bloch controls ── */}
          {cfg.preset==='bloch' && (
            <div className="glass-card p-4 space-y-3">
              <p className={lbl}>Bloch Sphere</p>
              {([['blochColor','Sphere Color'],['vectorColor','Vector Color']] as const).map(([k,label])=>(
                <div key={k} className="flex items-center justify-between">
                  <span className="font-mono text-[11px] text-muted-foreground">{label}</span>
                  <input type="color" value={cfg[k]} onChange={(e)=>set(k,e.target.value)}
                    className="w-10 h-7 rounded cursor-pointer border border-white/10" />
                </div>
              ))}

              {/* Manual angle sliders */}
              {!cfg.autoMode && (
                <div className="space-y-2 pt-1 border-t border-white/5">
                  <p className="font-mono text-[10px] text-muted-foreground">State Vector Angles</p>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[10px] text-muted-foreground w-14">θ (polar)</span>
                    <input type="range" min="0" max="180" value={cfg.blochTheta}
                      onChange={e=>set('blochTheta',+e.target.value)}
                      className="flex-1 accent-[hsl(var(--steami-gold))]" />
                    <span className="font-mono text-[10px] text-steami-gold w-10 text-right">{cfg.blochTheta}°</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[10px] text-muted-foreground w-14">φ (azimuth)</span>
                    <input type="range" min="0" max="360" value={cfg.blochPhi}
                      onChange={e=>set('blochPhi',+e.target.value)}
                      className="flex-1 accent-[hsl(var(--steami-cyan))]" />
                    <span className="font-mono text-[10px] text-steami-cyan w-10 text-right">{cfg.blochPhi}°</span>
                  </div>
                </div>
              )}

              {/* Classical bit shape picker */}
              <div className="pt-1 border-t border-white/5">
                <p className="font-mono text-[10px] text-muted-foreground mb-1">Classical Bit Shape</p>
                <ShapePicker value={cfg.bitShape} onChange={s=>set('bitShape',s)} />
              </div>
            </div>
          )}

          {/* ── Three-body controls ── */}
          {cfg.preset==='threebody' && (
            <div className="glass-card p-4 space-y-3">
              <p className={lbl}>Three-Body System</p>
              {(['mass1','mass2','mass3'] as const).map((k,i)=>(
                <div key={k} className="flex items-center gap-2">
                  <span className="font-mono text-[11px] text-muted-foreground w-12">Body {i+1}</span>
                  <input type="range" min="0.2" max="5" step="0.1" value={cfg[k]}
                    onChange={(e)=>set(k,+e.target.value)}
                    className="flex-1 accent-[hsl(var(--steami-orange))]" />
                  <span className="font-mono text-[10px] w-8 text-right">{cfg[k].toFixed(1)}</span>
                </div>
              ))}
              <div className="pt-1 border-t border-white/5 space-y-2">
                <p className="font-mono text-[10px] text-muted-foreground">Body Shapes</p>
                {(['body1Shape','body2Shape','body3Shape'] as const).map((k,i)=>(
                  <div key={k}>
                    <p className="font-mono text-[9px] text-muted-foreground/60 mb-1">Body {i+1}</p>
                    <ShapePicker value={cfg[k]} onChange={s=>set(k,s)} />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── Wave controls ── */}
          {cfg.preset==='wave' && (
            <div className="glass-card p-4 space-y-3">
              <p className={lbl}>Wave Function</p>

              {/* Wave mode selector */}
              <div>
                <p className="font-mono text-[10px] text-muted-foreground mb-1">Wave Type</p>
                <div className="grid grid-cols-2 gap-1">
                  {(['ripple','standing','interference','gaussian'] as const).map(m=>(
                    <button key={m} onClick={()=>set('waveMode',m)}
                      className={`font-mono text-[10px] px-2 py-1 rounded border transition-all capitalize ${
                        cfg.waveMode===m
                          ? 'border-steami-cyan/60 bg-steami-cyan/10 text-steami-cyan'
                          : 'border-white/10 text-muted-foreground hover:border-white/20'
                      }`}>{m}</button>
                  ))}
                </div>
              </div>

              {([['waveAmp','Amplitude',0.2,3],['waveFreq','Frequency',0.5,6]] as const).map(([k,label,min,max])=>(
                <div key={k} className="flex items-center gap-2">
                  <span className="font-mono text-[11px] text-muted-foreground w-20">{label}</span>
                  <input type="range" min={min} max={max} step="0.1" value={cfg[k as 'waveAmp'|'waveFreq']}
                    onChange={(e)=>set(k as any,+e.target.value)}
                    className="flex-1 accent-[hsl(var(--steami-cyan))]" />
                  <span className="font-mono text-[10px] w-8 text-right">{(cfg[k as 'waveAmp'|'waveFreq']).toFixed(1)}</span>
                </div>
              ))}
              <div className="flex items-center justify-between">
                <span className="font-mono text-[11px] text-muted-foreground">Color</span>
                <input type="color" value={cfg.waveColor} onChange={(e)=>set('waveColor',e.target.value)}
                  className="w-10 h-7 rounded cursor-pointer border border-white/10" />
              </div>
            </div>
          )}

          {/* ── Orbits controls ── */}
          {cfg.preset==='orbits' && !cfg.autoMode && (
            <div className="glass-card p-4 space-y-2">
              <p className={lbl}>Manual Mode — Orbits</p>
              <p className="font-mono text-[10px] text-muted-foreground/60 leading-relaxed">
                In MANUAL mode, orbital animation is paused. Toggle AUTO to resume live orbits.
                Speed control still applies on AUTO.
              </p>
            </div>
          )}

          {/* Metadata + upload */}
          <div className="glass-card p-4 space-y-3">
            <p className={lbl}>Save to Backend</p>
            <div><label className={lbl}>ID (slug) <span className="text-steami-red">*</span></label>
              <input className={inp} value={simId} onChange={(e)=>setSimId(e.target.value)} placeholder="e.g. wave-function" /></div>
            <div><label className={lbl}>Title <span className="text-steami-red">*</span></label>
              <input className={inp} value={simTitle} onChange={(e)=>setSimTitle(e.target.value)} placeholder="e.g. Wave Function Collapse" /></div>
            <div><label className={lbl}>Field</label>
              <input className={inp} value={simField} onChange={(e)=>setSimField(e.target.value)} placeholder="e.g. QUANTUM PHYSICS" /></div>
            <div><label className={lbl}>Description</label>
              <textarea className={inp} rows={2} value={simDesc} onChange={(e)=>setSimDesc(e.target.value)} placeholder="Short description for the card…" /></div>
            <div><label className={lbl}>Caption (below canvas)</label>
              <input className={inp} value={simCaption} onChange={(e)=>setSimCaption(e.target.value)} placeholder="Drag to rotate…" /></div>
            <div><label className={lbl}>Key Insights (one per line)</label>
              <textarea className={inp} rows={3} value={simInsights} onChange={(e)=>setSimInsights(e.target.value)} placeholder={'Insight one\nInsight two'} /></div>
            <div><label className={lbl}>Tags (comma-separated)</label>
              <input className={inp} value={simTags} onChange={(e)=>setSimTags(e.target.value)} placeholder="quantum, physics, interactive" /></div>

            {status && <p className="font-mono text-[11px] text-steami-green">{status}</p>}
            {error  && <p className="font-mono text-[11px] text-steami-red">{error}</p>}

            <div className="flex gap-2 pt-1">
              <button onClick={uploadToBackend} disabled={uploading||!canModerate}
                className="steami-btn text-[11px] flex-1 disabled:opacity-40">
                {uploading ? '⏳ SAVING…' : '⬆ SAVE & UPLOAD'}
              </button>
              {isAdmin && (
                <button onClick={async()=>{
                  setStatus('');setError('');
                  try{const r=await api.simulations.seed();setStatus(`Seeded ${r?.seeded??'?'}.`);}
                  catch(e:any){setError(e.message);}
                }} className="steami-btn text-[11px]" title="Seed defaults (admin)">↻ Seed</button>
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

// ══════════════════════════════════════════════════════════════════════════════
// SHARED FORM STATE + HELPERS
// ══════════════════════════════════════════════════════════════════════════════

const emptyExplainer = {
  id:'',title:'',subtitle:'',field:'',badgeColor:'',readTime:'',author:'',
  content:'',keyInsights:'',context:'',technicalDetail:'',impact:'',references:'',
};
const emptyResearch = {
  id:'',title:'',field:'',abstract:'',author:'',date:'',readTime:'',
  content:'',quotes:'',keyFindings:'',relatedTopics:'',
};
const emptyBlog = {
  id:'',title:'',subtitle:'',description:'',field:'',badgeColor:'',
  coverImage:'',tags:'',keyInsights:'',type:'article',simulationUrl:'',
  content:'',publishDate:'',readingTime:'',
  authorName:'',authorRole:'',authorAvatar:'',authorBio:'',
};
const emptySimulation = {
  id:'',title:'',field:'',fieldColor:'steami-badge-cyan',
  description:'',caption:'',readTime:'10 min interactive',
  simulation_type:'custom',component_id:'',insights:'',tags:'',
};

const lines = (s:string) => s.split('\n').map(l=>l.trim()).filter(Boolean);
const csv   = (s:string) => s.split(',').map(l=>l.trim()).filter(Boolean);
const parseRefs = (s:string) => s.split('\n').map(l=>l.trim()).filter(Boolean).map(l=>{
  try{return JSON.parse(l);}catch{return{title:l};}
});

function Field({label,value,onChange,placeholder='',required=false,disabled=false}:{
  label:string;value:string;onChange:(v:string)=>void;placeholder?:string;required?:boolean;disabled?:boolean;
}) {
  return (
    <div>
      <label className="block text-[11px] text-muted-foreground mb-1">
        {label}{required&&<span className="text-steami-red ml-1">*</span>}
      </label>
      <input value={value} onChange={e=>onChange(e.target.value)} placeholder={placeholder||label}
        required={required} disabled={disabled}
        className="w-full rounded-md border border-white/10 bg-transparent px-3 py-2 text-[14px] disabled:opacity-40" />
    </div>
  );
}
function TextArea({label,value,onChange,rows=4,hint=''}:{
  label:string;value:string;onChange:(v:string)=>void;rows?:number;hint?:string;
}) {
  return (
    <div>
      <label className="block text-[11px] text-muted-foreground mb-1">{label}</label>
      {hint&&<p className="text-[10px] text-muted-foreground/60 mb-1">{hint}</p>}
      <textarea value={value} onChange={e=>onChange(e.target.value)} placeholder={label} rows={rows}
        className="w-full rounded-md border border-white/10 bg-transparent px-3 py-2 text-[14px]" />
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// MAIN PAGE
// ══════════════════════════════════════════════════════════════════════════════

export default function ModerationPage() {
  const user        = useAuthStore(s=>s.user);
  const isAdmin     = user?.role==='admin';
  const canModerate = isAdmin||user?.role==='mod';

  const [tab,setTab] = useState<'explainer'|'research'|'blog'|'simulation'|'builder'|'newsletter'>('explainer');

  const [explainerForm, setExplainerForm] = useState(emptyExplainer);
  const [researchForm,  setResearchForm]  = useState(emptyResearch);
  const [blogForm,      setBlogForm]      = useState(emptyBlog);
  const [simForm,       setSimForm]       = useState(emptySimulation);

  const [editingId,   setEditingId]   = useState('');
  const [imageFile,   setImageFile]   = useState<File|null>(null);
  const [glbFile,     setGlbFile]     = useState<File|null>(null);
  const [snapshotB64, setSnapshotB64] = useState('');
  const [items,       setItems]       = useState<any[]>([]);
  const [status,      setStatus]      = useState('');
  const [error,       setError]       = useState('');

  const ef = (k:keyof typeof emptyExplainer) => (v:string) => setExplainerForm(f=>({...f,[k]:v}));
  const rf = (k:keyof typeof emptyResearch)  => (v:string) => setResearchForm(f=>({...f,[k]:v}));
  const bf = (k:keyof typeof emptyBlog)      => (v:string) => setBlogForm(f=>({...f,[k]:v}));
  const sf = (k:keyof typeof emptySimulation)=> (v:string) => setSimForm(f=>({...f,[k]:v}));

  const resetAll = () => {
    setExplainerForm(emptyExplainer); setResearchForm(emptyResearch);
    setBlogForm(emptyBlog);           setSimForm(emptySimulation);
    setEditingId(''); setImageFile(null); setGlbFile(null); setSnapshotB64('');
  };

  const loadItems = async () => {
    setError('');
    try {
      let data:any;
      if      (tab==='explainer')  data = await api.content.cmsExplainers();
      else if (tab==='research')   data = await api.content.cmsResearch();
      else if (tab==='simulation') data = await api.simulations.cmsList();
      else if (tab==='blog')       data = await api.content.cmsBlog();
      else return;
      setItems(Array.isArray(data)?data:data?.simulations??data?.items??data?.articles??data?.explainers??data?.posts??[]);
    } catch(err:any){setError(err.message||'Unable to load items');}
  };

  useEffect(()=>{if(canModerate&&tab!=='newsletter'&&tab!=='builder')loadItems();},[canModerate,tab]);

  const submit = async (e:React.FormEvent) => {
    e.preventDefault(); setStatus(''); setError('');
    try {
      if (tab==='explainer') {
        if (editingId) {
          await api.content.updateExplainer(editingId,{
            title:explainerForm.title||undefined,subtitle:explainerForm.subtitle||undefined,
            field:explainerForm.field||undefined,badgeColor:explainerForm.badgeColor||undefined,
            readTime:explainerForm.readTime||undefined,author:explainerForm.author||undefined,
            content:lines(explainerForm.content),keyInsights:lines(explainerForm.keyInsights),
            context:explainerForm.context||undefined,technicalDetail:explainerForm.technicalDetail||undefined,
            impact:explainerForm.impact||undefined,references:parseRefs(explainerForm.references),
          });
          if(imageFile)await api.content.uploadExplainerImage(editingId,imageFile);
        } else {
          if(!imageFile){setError('Image required.');return;}
          await api.content.createExplainerWithImage({
            id:explainerForm.id,title:explainerForm.title,subtitle:explainerForm.subtitle,
            field:explainerForm.field,badgeColor:explainerForm.badgeColor,readTime:explainerForm.readTime,
            author:explainerForm.author,context:explainerForm.context,technicalDetail:explainerForm.technicalDetail,
            impact:explainerForm.impact,content:JSON.stringify(lines(explainerForm.content)),
            keyInsights:JSON.stringify(lines(explainerForm.keyInsights)),
            references:JSON.stringify(parseRefs(explainerForm.references)),
          },imageFile);
        }
      } else if (tab==='research') {
        if (editingId) {
          await api.content.updateResearch(editingId,{
            title:researchForm.title||undefined,field:researchForm.field||undefined,
            abstract:researchForm.abstract||undefined,author:researchForm.author||undefined,
            date:researchForm.date||undefined,readTime:researchForm.readTime||undefined,
            content:lines(researchForm.content),quotes:lines(researchForm.quotes),
            keyFindings:lines(researchForm.keyFindings),relatedTopics:lines(researchForm.relatedTopics),
          });
          if(imageFile)await api.content.uploadResearchImage(editingId,imageFile);
        } else {
          if(!imageFile){setError('Image required.');return;}
          await api.content.createResearchWithImage({
            id:researchForm.id,title:researchForm.title,field:researchForm.field,
            abstract:researchForm.abstract,author:researchForm.author,date:researchForm.date,
            readTime:researchForm.readTime,content:JSON.stringify(lines(researchForm.content)),
            quotes:JSON.stringify(lines(researchForm.quotes)),
            keyFindings:JSON.stringify(lines(researchForm.keyFindings)),
            relatedTopics:JSON.stringify(lines(researchForm.relatedTopics)),
          },imageFile);
        }
      } else if (tab==='blog') {
        const b={
          id:blogForm.id,title:blogForm.title,subtitle:blogForm.subtitle,description:blogForm.description,
          field:blogForm.field,badgeColor:blogForm.badgeColor||'cyan',coverImage:blogForm.coverImage,
          tags:csv(blogForm.tags),keyInsights:lines(blogForm.keyInsights),type:blogForm.type||'article',
          simulationUrl:blogForm.simulationUrl,content:blogForm.content,
          publishDate:blogForm.publishDate||new Date().toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'}),
          readingTime:blogForm.readingTime||`${Math.max(1,Math.ceil(blogForm.content.length/1000))} MIN READ`,
          author:{name:blogForm.authorName||user?.fullName||'',role:blogForm.authorRole||user?.role||'',avatar:blogForm.authorAvatar||'',bio:blogForm.authorBio||''},
        };
        if(editingId)await api.content.updateBlogPost(editingId,b);
        else await api.content.createBlogPost(b);
        if(imageFile)await api.content.uploadBlogCover(editingId||blogForm.id,imageFile);
      } else if (tab==='simulation') {
        const s={
          id:simForm.id,title:simForm.title,field:simForm.field,fieldColor:simForm.fieldColor||'steami-badge-cyan',
          description:simForm.description,caption:simForm.caption,readTime:simForm.readTime||'10 min interactive',
          simulation_type:simForm.simulation_type||'custom',component_id:simForm.component_id,
          insights:lines(simForm.insights),tags:csv(simForm.tags),
        };
        if(editingId)await api.simulations.update(editingId,s);
        else{if(!simForm.id||!simForm.title){setError('ID and Title required.');return;}await api.simulations.create(s);}
        const tid=editingId||simForm.id;
        if(snapshotB64)await api.simulations.uploadSnapshot(tid,snapshotB64);
        if(glbFile)await api.simulations.uploadGlb(tid,glbFile);
      }
      setStatus('Saved successfully.'); resetAll(); loadItems();
    } catch(err:any){setError(err.message||'Save failed');}
  };

  const editItem = async (item:any) => {
    const id=item.id??item.uid??item.post_id??item.article_id; if(!id)return;
    setStatus('Loading…');setError('');
    let full=item;
    try{
      if(tab==='explainer') full=await api.content.explainer(id);
      if(tab==='research')  full=await api.content.researchArticle(id);
      if(tab==='blog')      full=await api.content.blogPost(id);
      if(tab==='simulation')full=await api.simulations.cmsGet(id);
    }catch(err:any){setError(err.message||'Could not load');setStatus('');return;}
    setEditingId(id);setImageFile(null);setGlbFile(null);setSnapshotB64('');
    if(tab==='explainer')setExplainerForm({
      id:full.id??id,title:full.title??'',subtitle:full.subtitle??'',field:full.field??'',
      badgeColor:full.badgeColor??'',readTime:full.readTime??'',author:full.author??'',
      content:Array.isArray(full.content)?full.content.join('\n'):full.content??'',
      keyInsights:Array.isArray(full.keyInsights)?full.keyInsights.join('\n'):'',
      context:full.context??'',technicalDetail:full.technicalDetail??'',impact:full.impact??'',
      references:Array.isArray(full.references)?full.references.map((r:any)=>JSON.stringify(r)).join('\n'):'',
    });
    else if(tab==='research')setResearchForm({
      id:full.id??id,title:full.title??'',field:full.field??'',abstract:full.abstract??'',
      author:full.author??'',date:full.date??'',readTime:full.readTime??'',
      content:Array.isArray(full.content)?full.content.join('\n'):full.content??'',
      quotes:Array.isArray(full.quotes)?full.quotes.join('\n'):'',
      keyFindings:Array.isArray(full.keyFindings)?full.keyFindings.join('\n'):'',
      relatedTopics:Array.isArray(full.relatedTopics)?full.relatedTopics.join('\n'):'',
    });
    else if(tab==='blog'){const a=full.author??{};setBlogForm({
      id:full.id??id,title:full.title??'',subtitle:full.subtitle??'',description:full.description??'',
      field:full.field??'',badgeColor:full.badgeColor??'',coverImage:full.coverImage??'',
      tags:Array.isArray(full.tags)?full.tags.join(', '):'',
      keyInsights:Array.isArray(full.keyInsights)?full.keyInsights.join('\n'):'',
      type:full.type??'article',simulationUrl:full.simulationUrl??'',content:full.content??'',
      publishDate:full.publishDate??'',readingTime:full.readingTime??'',
      authorName:a.name??'',authorRole:a.role??'',authorAvatar:a.avatar??'',authorBio:a.bio??'',
    });}
    else if(tab==='simulation')setSimForm({
      id:full.id??id,title:full.title??'',field:full.field??'',fieldColor:full.fieldColor??'steami-badge-cyan',
      description:full.description??'',caption:full.caption??'',readTime:full.readTime??'10 min interactive',
      simulation_type:full.simulation_type??'custom',component_id:full.component_id??'',
      insights:Array.isArray(full.insights)?full.insights.join('\n'):'',
      tags:Array.isArray(full.tags)?full.tags.join(', '):'',
    });
    setStatus('Loaded for editing.');
  };

  const deleteItem = async (item:any) => {
    const id=item.id??item.uid??item.post_id??item.article_id; if(!id)return;
    if(tab==='explainer') await api.content.deleteExplainer(id);
    if(tab==='research')  await api.content.deleteResearch(id);
    if(tab==='blog')      await api.content.deleteBlogPost(id);
    if(tab==='simulation')await api.simulations.delete(id);
    setStatus('Deleted.'); loadItems();
  };

  if(!canModerate)return(
    <SteamiLayout>
      <div className="glass-card p-8 text-center">
        <ShieldCheck className="w-8 h-8 text-steami-gold mx-auto mb-3" />
        <h1 className="steami-heading text-2xl mb-2">Moderator Access Required</h1>
        <p className="text-muted-foreground text-[14px]">Admin and mod users can create and manage content here.</p>
      </div>
    </SteamiLayout>
  );

  const imageRequired=!editingId&&(tab==='explainer'||tab==='research');

  return (
    <SteamiLayout>
      <div className="mb-8">
        <h1 className="steami-heading text-3xl md:text-4xl mb-3">Content Operations</h1>
        <p className="text-[15px] text-muted-foreground max-w-2xl">
          Create and manage explainers, research articles, blog posts, 3D simulations, and more.
        </p>
      </div>

      {/* Tab bar */}
      <div className="flex flex-wrap gap-2 mb-6">
        {(['explainer','research','blog','simulation','builder','newsletter'] as const).map(t=>(
          <button key={t}
            onClick={()=>{setTab(t);resetAll();setStatus('');setError('');}}
            className={`steami-btn text-[11px] ${tab===t?'steami-btn-gold':''}`}
          >
            {t==='newsletter'?'📰 Newsletter':t==='blog'?'Intelligence':t==='simulation'?'🧊 Simulation':t==='builder'?'🔬 3D Builder':t}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

        {tab==='newsletter'&&<div className="lg:col-span-2"><NewsletterTab /></div>}

        {tab==='builder'&&<SimulationBuilderTab isAdmin={isAdmin} canModerate={canModerate} />}

        {tab!=='newsletter'&&tab!=='builder'&&(<>
          {/* Form */}
          <section className="glass-card p-5">
            <h2 className="steami-section-label mb-4">{editingId?`Update ${tab}`:`Create ${tab}`}</h2>
            <form onSubmit={submit} className="space-y-3">

              {tab==='explainer'&&<>
                <Field label="ID" value={explainerForm.id} onChange={ef('id')} required disabled={!!editingId} placeholder="e.g. quantum-dog"/>
                <Field label="Title" value={explainerForm.title} onChange={ef('title')} required/>
                <Field label="Subtitle" value={explainerForm.subtitle} onChange={ef('subtitle')}/>
                <Field label="Field (e.g. QUANTUM PHYSICS)" value={explainerForm.field} onChange={ef('field')}/>
                <Field label="Badge Color" value={explainerForm.badgeColor} onChange={ef('badgeColor')} placeholder="cyan/green/violet/gold"/>
                <Field label="Read Time" value={explainerForm.readTime} onChange={ef('readTime')} placeholder="8 MIN READ"/>
                <Field label="Author" value={explainerForm.author} onChange={ef('author')}/>
                <TextArea label="Content" value={explainerForm.content} onChange={ef('content')} rows={6} hint="One paragraph per line."/>
                <TextArea label="Key Insights" value={explainerForm.keyInsights} onChange={ef('keyInsights')} rows={3} hint="One per line."/>
                <TextArea label="Context" value={explainerForm.context} onChange={ef('context')} rows={3}/>
                <TextArea label="Technical Detail" value={explainerForm.technicalDetail} onChange={ef('technicalDetail')} rows={3}/>
                <TextArea label="Impact" value={explainerForm.impact} onChange={ef('impact')} rows={3}/>
                <TextArea label="References" value={explainerForm.references} onChange={ef('references')} rows={4}
                  hint='One per line as JSON: {"title":"...","url":"...","author":"...","type":"paper"}'/>
              </>}

              {tab==='research'&&<>
                <Field label="ID" value={researchForm.id} onChange={rf('id')} required disabled={!!editingId} placeholder="e.g. topological-qubits"/>
                <Field label="Title" value={researchForm.title} onChange={rf('title')} required/>
                <Field label="Field" value={researchForm.field} onChange={rf('field')} required/>
                <Field label="Abstract" value={researchForm.abstract} onChange={rf('abstract')}/>
                <Field label="Author" value={researchForm.author} onChange={rf('author')}/>
                <Field label="Date (YYYY-MM-DD)" value={researchForm.date} onChange={rf('date')} placeholder="2026-04-30"/>
                <Field label="Read Time" value={researchForm.readTime} onChange={rf('readTime')}/>
                <TextArea label="Content" value={researchForm.content} onChange={rf('content')} rows={6} hint="One paragraph per line."/>
                <TextArea label="Quotes" value={researchForm.quotes} onChange={rf('quotes')} rows={3} hint="One per line."/>
                <TextArea label="Key Findings" value={researchForm.keyFindings} onChange={rf('keyFindings')} rows={3} hint="One per line."/>
                <TextArea label="Related Topics" value={researchForm.relatedTopics} onChange={rf('relatedTopics')} rows={2} hint="One per line."/>
              </>}

              {tab==='blog'&&<>
                <Field label="ID" value={blogForm.id} onChange={bf('id')} required disabled={!!editingId} placeholder="e.g. future-of-quantum"/>
                <Field label="Title" value={blogForm.title} onChange={bf('title')} required/>
                <Field label="Subtitle" value={blogForm.subtitle} onChange={bf('subtitle')}/>
                <Field label="Description" value={blogForm.description} onChange={bf('description')}/>
                <Field label="Field / Category" value={blogForm.field} onChange={bf('field')}/>
                <Field label="Badge Color" value={blogForm.badgeColor} onChange={bf('badgeColor')}/>
                <Field label="Type (article/simulation)" value={blogForm.type} onChange={bf('type')}/>
                <Field label="Cover Image URL" value={blogForm.coverImage} onChange={bf('coverImage')}/>
                <Field label="Tags (comma-separated)" value={blogForm.tags} onChange={bf('tags')}/>
                <Field label="Publish Date" value={blogForm.publishDate} onChange={bf('publishDate')}/>
                <Field label="Reading Time" value={blogForm.readingTime} onChange={bf('readingTime')}/>
                <Field label="Simulation URL" value={blogForm.simulationUrl} onChange={bf('simulationUrl')}/>
                <TextArea label="Key Insights" value={blogForm.keyInsights} onChange={bf('keyInsights')} rows={3} hint="One per line."/>
                <TextArea label="Content" value={blogForm.content} onChange={bf('content')} rows={8}/>
                <div className="rounded-md border border-white/10 bg-white/[0.02] p-3 space-y-3">
                  <p className="text-[11px] text-muted-foreground uppercase tracking-wider">Author</p>
                  <Field label="Name" value={blogForm.authorName} onChange={bf('authorName')} placeholder={user?.fullName||'Dr. Jane Smith'}/>
                  <Field label="Role" value={blogForm.authorRole} onChange={bf('authorRole')}/>
                  <Field label="Avatar URL" value={blogForm.authorAvatar} onChange={bf('authorAvatar')}/>
                  <Field label="Bio" value={blogForm.authorBio} onChange={bf('authorBio')}/>
                </div>
              </>}

              {tab==='simulation'&&<>
                <Field label="ID" value={simForm.id} onChange={sf('id')} required disabled={!!editingId} placeholder="e.g. wave-function"/>
                <Field label="Title" value={simForm.title} onChange={sf('title')} required/>
                <Field label="Field" value={simForm.field} onChange={sf('field')}/>
                <Field label="Badge Color class" value={simForm.fieldColor} onChange={sf('fieldColor')} placeholder="steami-badge-cyan"/>
                <TextArea label="Description" value={simForm.description} onChange={sf('description')} rows={3}/>
                <Field label="Caption" value={simForm.caption} onChange={sf('caption')}/>
                <Field label="Read Time" value={simForm.readTime} onChange={sf('readTime')}/>
                <Field label="Simulation Type" value={simForm.simulation_type} onChange={sf('simulation_type')} placeholder="bloch_sphere|three_body|custom"/>
                <Field label="Component ID" value={simForm.component_id} onChange={sf('component_id')} placeholder="quantum|threebody|your-key"/>
                <TextArea label="Key Insights" value={simForm.insights} onChange={sf('insights')} rows={4} hint="One per line."/>
                <Field label="Tags (comma-separated)" value={simForm.tags} onChange={sf('tags')}/>
                <div className="rounded-md border border-white/10 bg-white/[0.02] p-3 space-y-2">
                  <p className="text-[11px] text-muted-foreground uppercase tracking-wider">Preview Snapshot</p>
                  <input type="file" accept="image/png,image/jpeg,image/webp"
                    onChange={e=>{const f=e.target.files?.[0];if(!f)return;const r=new FileReader();r.onload=()=>{if(typeof r.result==='string')setSnapshotB64(r.result);};r.readAsDataURL(f);}}
                    className="w-full rounded-md border border-white/10 bg-transparent px-3 py-2 text-[14px]"/>
                  {snapshotB64&&<img src={snapshotB64} alt="Preview" className="w-full rounded-md object-cover" style={{maxHeight:120}}/>}
                </div>
                <div className="rounded-md border border-white/10 bg-white/[0.02] p-3 space-y-2">
                  <p className="text-[11px] text-muted-foreground uppercase tracking-wider">3-D File (.glb/.gltf)</p>
                  <input type="file" accept=".glb,.gltf,.obj,.fbx,.stl" onChange={e=>setGlbFile(e.target.files?.[0]??null)}
                    className="w-full rounded-md border border-white/10 bg-transparent px-3 py-2 text-[14px]"/>
                  {glbFile&&<p className="text-[11px] text-steami-green">Selected: {glbFile.name}</p>}
                </div>
              </>}

              {(tab==='explainer'||tab==='research'||tab==='blog')&&(
                <div>
                  <label className="block text-[11px] text-muted-foreground mb-1">
                    {tab==='blog'?'Cover Image (optional)':editingId?'Replace Image (optional)':<span>Image File <span className="text-steami-red">*</span></span>}
                  </label>
                  <input type="file" accept="image/*" required={imageRequired} onChange={e=>setImageFile(e.target.files?.[0]??null)}
                    className="w-full rounded-md border border-white/10 bg-transparent px-3 py-2 text-[14px]"/>
                  {imageFile&&<p className="text-[11px] text-steami-green mt-1">Selected: {imageFile.name}</p>}
                </div>
              )}

              {status&&<p className="text-[12px] text-steami-green">{status}</p>}
              {error &&<p className="text-[12px] text-steami-red">{error}</p>}

              <div className="flex gap-2 pt-1">
                <button className="steami-btn text-[11px]" type="submit">{editingId?'Update':'Create'}</button>
                {tab==='simulation'&&isAdmin&&!editingId&&(
                  <button type="button" className="steami-btn text-[11px]"
                    onClick={async()=>{setStatus('');setError('');try{const r=await api.simulations.seed();setStatus(`Seeded ${r?.seeded??'?'}.`);loadItems();}catch(e:any){setError(e.message);}}}>
                    ↻ Seed Defaults
                  </button>
                )}
                {editingId&&<button type="button" className="steami-btn text-[11px]" onClick={()=>{resetAll();setStatus('');setError('');}}>New</button>}
              </div>
            </form>
          </section>

          {/* List */}
          <ApiStatePanel title={`Backend ${tab}s`} error={error} onRefresh={loadItems}>
            <div className="space-y-2">
              {items.map((item,idx)=>(
                <div key={item.id??item.uid??idx} className="rounded-lg border border-white/10 bg-white/[0.03] p-3">
                  <div className="flex flex-wrap items-start gap-3">
                    {/* Simulation preview: live 3D canvas for known presets, snapshot fallback otherwise */}
                    {tab==='simulation'&&(()=>{
                      const livePresets = ['bloch','wave','orbits','quantum','threebody'];
                      const cid = item.component_id as string;
                      if (livePresets.includes(cid)) {
                        const scene = (() => {
                          switch(cid) {
                            case 'bloch': case 'quantum': return <BlochScene cfg={{...defaultConfig, speed:0.8}} />;
                            case 'threebody': return <ThreeBodyScene cfg={defaultConfig} />;
                            case 'wave': return <WaveScene cfg={defaultConfig} />;
                            case 'orbits': return <OrbitsScene cfg={defaultConfig} />;
                            default: return null;
                          }
                        })();
                        return scene ? (
                          <div className="w-20 h-14 rounded overflow-hidden flex-shrink-0 relative border border-white/10">
                            <Canvas camera={{ position:[0,1.5,5], fov:55 }} style={{ width:'100%', height:'100%', background:'#03060f' }} gl={{ antialias:true }}>
                              <Suspense fallback={null}>
                                <ambientLight intensity={0.5} />
                                <pointLight position={[5,5,5]} intensity={1.5} />
                                {scene}
                              </Suspense>
                            </Canvas>
                            <div className="absolute bottom-0.5 right-0.5 flex items-center gap-0.5 px-1 rounded" style={{background:'rgba(3,6,15,0.8)'}}>
                              <span className="inline-block w-1 h-1 rounded-full bg-green-400 animate-pulse" />
                              <span className="font-mono text-[7px] text-green-400">LIVE</span>
                            </div>
                          </div>
                        ) : null;
                      }
                      // Fallback to static snapshot
                      if (item.snapshot_url) {
                        return <img src={item.snapshot_url} alt={item.title} className="w-20 h-14 rounded object-cover flex-shrink-0 border border-white/10" />;
                      }
                      return null;
                    })()}
                    <div className="min-w-0 flex-1">
                      <div className="font-serif text-[16px] font-bold">{item.title??item.id??`Record ${idx+1}`}</div>
                      <p className="text-[13px] text-muted-foreground line-clamp-2">
                        {item.description??item.subtitle??item.abstract??item.content??''}
                      </p>
                      {tab==='simulation'&&item.component_id&&(
                        <span className="font-mono text-[10px] text-steami-cyan">component_id: {item.component_id}</span>
                      )}
                    </div>
                    <button className="steami-btn text-[11px]" onClick={()=>editItem(item)}>Edit</button>
                    {(tab!=='simulation'||isAdmin)&&(
                      <button className="steami-btn text-[11px]" onClick={()=>deleteItem(item)}>Delete</button>
                    )}
                  </div>
                </div>
              ))}
              {items.length===0&&<ObjectList items={[]}/>}
            </div>
          </ApiStatePanel>
        </>)}
      </div>
    </SteamiLayout>
  );
}
