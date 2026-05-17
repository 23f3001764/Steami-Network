import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';

type PlanetShape = 'sphere' | 'cube' | 'octahedron' | 'torus' | 'icosahedron' | 'dodecahedron';

const PLANET_SHAPES: { id: PlanetShape; label: string }[] = [
  { id: 'sphere',       label: 'Sphere'       },
  { id: 'cube',         label: 'Cube'         },
  { id: 'octahedron',   label: 'Octahedron'   },
  { id: 'torus',        label: 'Torus'        },
  { id: 'icosahedron',  label: 'Icosahedron'  },
  { id: 'dodecahedron', label: 'Dodecahedron' },
];

function makePlanetGeo(shape: PlanetShape, r: number): THREE.BufferGeometry {
  switch (shape) {
    case 'sphere':       return new THREE.SphereGeometry(r, 14, 10);
    case 'cube':         return new THREE.BoxGeometry(r*2, r*2, r*2);
    case 'octahedron':   return new THREE.OctahedronGeometry(r * 1.3);
    case 'torus':        return new THREE.TorusGeometry(r, r*0.4, 8, 20);
    case 'icosahedron':  return new THREE.IcosahedronGeometry(r * 1.1);
    case 'dodecahedron': return new THREE.DodecahedronGeometry(r * 1.1);
    default:             return new THREE.SphereGeometry(r, 14, 10);
  }
}

const PLANETS_DEF = [
  { name: 'Mercury', radius: 1.8,  speed: 1.50,  size: 0.10, color: '#a0a0a0', emissive: '#404040' },
  { name: 'Venus',   radius: 2.6,  speed: 1.00,  size: 0.16, color: '#e8c87a', emissive: '#6b5020' },
  { name: 'Earth',   radius: 3.5,  speed: 0.70,  size: 0.17, color: '#4a90d9', emissive: '#1a3060' },
  { name: 'Mars',    radius: 4.5,  speed: 0.50,  size: 0.13, color: '#c1440e', emissive: '#6b2006' },
  { name: 'Jupiter', radius: 6.0,  speed: 0.30,  size: 0.35, color: '#c88b3a', emissive: '#5a3a10' },
  { name: 'Saturn',  radius: 7.8,  speed: 0.20,  size: 0.28, color: '#e0c878', emissive: '#6b5830' },
];

export function OrbitalMechanicsSim() {
  const containerRef    = useRef<HTMLDivElement>(null);
  const canvasRef       = useRef<HTMLCanvasElement>(null);
  const frameRef        = useRef<number>(0);
  const planetMeshesRef = useRef<THREE.Mesh[]>([]);
  const ringMeshesRef   = useRef<THREE.Mesh | null>(null);
  const anglesRef       = useRef<number[]>(PLANETS_DEF.map((_, i) => (i / PLANETS_DEF.length) * Math.PI * 2));

  const [loading,      setLoading]      = useState(true);
  const [autoMode,     setAutoMode]     = useState(true);
  const [shapes,       setShapes]       = useState<PlanetShape[]>(PLANETS_DEF.map(() => 'sphere'));
  const [speed,        setSpeed]        = useState(1.0);
  const [showRings,    setShowRings]    = useState(true);
  const [showTrails,   setShowTrails]   = useState(true);
  const [focusPlanet,  setFocusPlanet]  = useState<number | null>(null);
  const [paused,       setPaused]       = useState(false);
  const [manualAngles, setManualAngles] = useState<number[]>(PLANETS_DEF.map(() => 0));

  const stateRef = useRef({
    autoMode: true, speed: 1.0, paused: false,
    manualAngles: PLANETS_DEF.map(() => 0),
    rotY: 0, rotX: -0.5,
  });

  useEffect(() => {
    if (!canvasRef.current || !containerRef.current) return;
    const canvas = canvasRef.current;
    const wrap   = containerRef.current;
    const W = wrap.clientWidth || 600;
    const H = 400;

    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(W, H);
    renderer.setClearColor(0x020710, 1);

    const scene = new THREE.Scene();
    const cam = new THREE.PerspectiveCamera(50, W/H, 0.01, 1000);
    cam.position.set(0, 8, 16);
    cam.lookAt(0, 0, 0);

    // Stars background
    const sp: number[] = [];
    for (let i = 0; i < 1200; i++) sp.push((Math.random()-0.5)*80,(Math.random()-0.5)*80,(Math.random()-0.5)*80);
    const starGeo = new THREE.BufferGeometry();
    starGeo.setAttribute('position', new THREE.Float32BufferAttribute(sp, 3));
    scene.add(new THREE.Points(starGeo, new THREE.PointsMaterial({ color: 0x8090c0, size: 0.06 })));

    // Sun
    const sunGeo = new THREE.SphereGeometry(0.6, 24, 18);
    const sunMat = new THREE.MeshStandardMaterial({ color: 0xfde68a, emissive: 0xfbbf24, emissiveIntensity: 1.4 });
    const sun = new THREE.Mesh(sunGeo, sunMat);
    scene.add(sun);

    // Sun glow
    const glowGeo = new THREE.SphereGeometry(0.9, 16, 12);
    const glowMat = new THREE.MeshBasicMaterial({ color: 0xfde68a, transparent: true, opacity: 0.06 });
    scene.add(new THREE.Mesh(glowGeo, glowMat));

    // Sun light
    const sunLight = new THREE.PointLight(0xfff8e0, 2.5, 30);
    scene.add(sunLight);
    scene.add(new THREE.AmbientLight(0x0a1428, 0.6));

    // Orbit rings
    PLANETS_DEF.forEach(p => {
      const pts: THREE.Vector3[] = [];
      for (let i = 0; i <= 128; i++) {
        const a = (i / 128) * Math.PI * 2;
        pts.push(new THREE.Vector3(Math.cos(a)*p.radius, 0, Math.sin(a)*p.radius));
      }
      const ringGeo = new THREE.BufferGeometry().setFromPoints(pts);
      const ring = new THREE.Line(ringGeo, new THREE.LineBasicMaterial({ color: 0x1a3060, transparent: true, opacity: 0.3 }));
      scene.add(ring);
    });

    // Saturn ring
    const saturnRingGeo = new THREE.RingGeometry(0.35, 0.55, 32);
    const saturnRingMat = new THREE.MeshBasicMaterial({ color: 0xd4b896, side: THREE.DoubleSide, transparent: true, opacity: 0.6 });
    const saturnRing = new THREE.Mesh(saturnRingGeo, saturnRingMat);
    saturnRing.rotation.x = Math.PI / 3;
    ringMeshesRef.current = saturnRing;
    scene.add(saturnRing);

    // Planet meshes + trail lines
    const trailPts: THREE.Vector3[][] = PLANETS_DEF.map(() => []);
    const trailLines: THREE.Line[] = PLANETS_DEF.map((p, i) => {
      const geo = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3()]);
      const line = new THREE.Line(geo, new THREE.LineBasicMaterial({
        color: p.color, transparent: true, opacity: 0.35,
      }));
      scene.add(line);
      return line;
    });

    const pMeshes = PLANETS_DEF.map((p, i) => {
      const geo = new THREE.SphereGeometry(p.size, 14, 10);
      const mat = new THREE.MeshStandardMaterial({ color: p.color, emissive: p.emissive, emissiveIntensity: 0.4 });
      const m = new THREE.Mesh(geo, mat);
      scene.add(m);
      return m;
    });
    planetMeshesRef.current = pMeshes;

    // Planet lights
    const pLights = PLANETS_DEF.map(p => {
      const l = new THREE.PointLight(p.color, 0.3, 2.5);
      scene.add(l);
      return l;
    });

    // Drag
    let dragging = false, px = 0, py = 0;
    const onDown = (e: MouseEvent) => { dragging = true; px = e.clientX; py = e.clientY; };
    const onUp   = ()              => { dragging = false; };
    const onMove = (e: MouseEvent) => {
      if (!dragging) return;
      stateRef.current.rotY += (e.clientX - px) * 0.01;
      stateRef.current.rotX += (e.clientY - py) * 0.005;
      px = e.clientX; py = e.clientY;
    };
    wrap.addEventListener('mousedown', onDown);
    window.addEventListener('mouseup', onUp);
    window.addEventListener('mousemove', onMove);

    setLoading(false);

    const MAX_TRAIL = 100;

    function animate() {
      frameRef.current = requestAnimationFrame(animate);
      const s = stateRef.current;
      const t = performance.now() * 0.001;

      scene.rotation.y = s.rotY;
      scene.rotation.x = Math.max(-0.9, Math.min(0.2, s.rotX));

      // Sun pulse
      sun.scale.setScalar(1 + 0.02 * Math.sin(t * 2));
      (sun.material as THREE.MeshStandardMaterial).emissiveIntensity = 1.2 + 0.3 * Math.sin(t * 1.3);

      if (!s.paused) {
        PLANETS_DEF.forEach((p, i) => {
          const angle = s.autoMode
            ? (anglesRef.current[i] += p.speed * 0.01 * s.speed)
            : s.manualAngles[i] * Math.PI / 180;

          const x = Math.cos(angle) * p.radius;
          const z = Math.sin(angle) * p.radius;

          pMeshes[i].position.set(x, 0, z);
          pMeshes[i].rotation.y += 0.02;
          pLights[i].position.set(x, 0, z);

          // Saturn ring follows Saturn
          if (i === 5 && saturnRing) {
            saturnRing.position.set(x, 0, z);
          }

          // Trail
          trailPts[i].push(new THREE.Vector3(x, 0, z));
          if (trailPts[i].length > MAX_TRAIL) trailPts[i].shift();
          trailLines[i].geometry.setFromPoints(trailPts[i]);
        });
      }

      renderer.render(scene, cam);
    }
    animate();

    return () => {
      cancelAnimationFrame(frameRef.current);
      wrap.removeEventListener('mousedown', onDown);
      window.removeEventListener('mouseup', onUp);
      window.removeEventListener('mousemove', onMove);
      renderer.dispose();
    };
  }, []);

  useEffect(() => { stateRef.current.autoMode = autoMode;     }, [autoMode]);
  useEffect(() => { stateRef.current.speed    = speed;        }, [speed]);
  useEffect(() => { stateRef.current.paused   = paused;       }, [paused]);
  useEffect(() => { stateRef.current.manualAngles = manualAngles; }, [manualAngles]);

  const applyShape = (planetIdx: number, shape: PlanetShape) => {
    const newShapes = [...shapes];
    newShapes[planetIdx] = shape;
    setShapes(newShapes);
    const m = planetMeshesRef.current[planetIdx];
    if (!m) return;
    m.geometry.dispose();
    m.geometry = makePlanetGeo(shape, PLANETS_DEF[planetIdx].size);
  };

  return (
    <div className="relative space-y-4">
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center z-10 bg-[#020710]/80 rounded-xl">
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 rounded-full bg-steami-gold animate-pulse" />
            <span className="font-mono text-[11px] text-muted-foreground tracking-wider">INITIALIZING SOLAR SYSTEM…</span>
          </div>
        </div>
      )}

      <div
        ref={containerRef}
        className="w-full rounded-xl overflow-hidden relative cursor-grab active:cursor-grabbing"
        style={{ boxShadow: '0 4px 32px rgba(0,0,0,0.6)' }}
      >
        <canvas ref={canvasRef} className="w-full block" style={{ height: 400 }} />
        <div className="absolute top-3 left-3 font-mono text-[9px] text-white/20 tracking-wider pointer-events-none">
          DRAG · ROTATE
        </div>
        <div className="absolute bottom-3 left-3 flex items-center gap-1.5 px-2 py-1 rounded"
          style={{ background: 'rgba(2,7,16,0.8)', border: '1px solid rgba(253,230,138,0.2)' }}>
          <span className={`w-1.5 h-1.5 rounded-full ${autoMode ? 'bg-steami-gold animate-pulse' : 'bg-steami-cyan'}`} />
          <span className="font-mono text-[9px] text-muted-foreground tracking-wider">
            {autoMode ? 'AUTO ORBIT' : 'MANUAL ANGLES'}
          </span>
        </div>
      </div>

      {/* Control bar */}
      <div className="flex flex-wrap gap-3 items-center">
        <button onClick={() => setAutoMode(!autoMode)}
          className={`steami-btn text-[11px] px-3 py-1.5 flex items-center gap-2`}>
          <span className={`w-1.5 h-1.5 rounded-full ${autoMode ? 'bg-steami-gold animate-pulse' : 'bg-steami-cyan'}`} />
          {autoMode ? '⟳ AUTO ORBIT' : '⊙ MANUAL ANGLES'}
        </button>
        <button onClick={() => setPaused(!paused)} className="steami-btn text-[11px] px-3 py-1.5">
          {paused ? '▶ RESUME' : '⏸ PAUSE'}
        </button>
        {autoMode && (
          <div className="flex items-center gap-2">
            <span className="font-mono text-[10px] text-muted-foreground">Speed</span>
            <input type="range" min="0.1" max="8" step="0.1" value={speed}
              onChange={e => setSpeed(+e.target.value)}
              className="w-24 accent-[hsl(var(--steami-gold))]" />
            <span className="font-mono text-[10px] text-steami-gold">{speed.toFixed(1)}×</span>
          </div>
        )}
      </div>

      {/* Manual angle sliders */}
      {!autoMode && (
        <div className="rounded-xl p-4 space-y-3"
          style={{ background: 'rgba(6,16,38,0.6)', border: '1px solid rgba(99,179,237,0.15)' }}>
          <p className="font-mono text-[10px] text-muted-foreground tracking-wider uppercase">Planet Angles</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {PLANETS_DEF.map((p, i) => (
              <div key={i} className="flex items-center gap-2">
                <span className="font-mono text-[10px] w-14" style={{ color: p.color }}>{p.name}</span>
                <input type="range" min="0" max="360" value={manualAngles[i]}
                  onChange={e => {
                    const na = [...manualAngles];
                    na[i] = +e.target.value;
                    setManualAngles(na);
                  }}
                  className="flex-1"
                  style={{ accentColor: p.color }} />
                <span className="font-mono text-[9px] text-muted-foreground w-8 text-right">{manualAngles[i]}°</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Planet shape pickers */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {PLANETS_DEF.map((p, i) => (
          <div key={i} className="rounded-xl p-3 space-y-2"
            style={{ background: 'rgba(6,16,38,0.6)', border: `1px solid ${p.color}22` }}>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full" style={{ background: p.color }} />
              <span className="font-mono text-[10px]" style={{ color: p.color }}>{p.name}</span>
            </div>
            <div className="flex flex-wrap gap-1">
              {PLANET_SHAPES.map(s => (
                <button key={s.id} onClick={() => applyShape(i, s.id)}
                  className={`font-mono text-[8px] px-1.5 py-0.5 rounded border transition-all ${
                    shapes[i] === s.id ? 'border-current bg-current/10' : 'border-white/10 text-muted-foreground hover:border-white/20'
                  }`}
                  style={shapes[i] === s.id ? { color: p.color, borderColor: p.color + '80' } : {}}>
                  {s.label}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      <p className="font-mono text-[11px] text-muted-foreground tracking-wide leading-relaxed">
        ◆ Simplified solar system — Kepler's third law: T² ∝ a³. Inner planets complete orbits faster.
        AUTO mode runs real-time animation. MANUAL mode lets you position each planet precisely. DRAG to rotate view.
      </p>
    </div>
  );
}
