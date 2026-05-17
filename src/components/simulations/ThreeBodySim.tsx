import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';

type BodyShape = 'sphere' | 'cube' | 'octahedron' | 'tetrahedron' | 'torus' | 'dodecahedron';

const BODY_SHAPES: { id: BodyShape; label: string }[] = [
  { id: 'sphere',       label: 'Sphere'       },
  { id: 'cube',         label: 'Cube'         },
  { id: 'octahedron',   label: 'Octahedron'   },
  { id: 'tetrahedron',  label: 'Tetrahedron'  },
  { id: 'torus',        label: 'Torus'        },
  { id: 'dodecahedron', label: 'Dodecahedron' },
];

const PRESETS = [
  {
    label: 'Figure-8',
    bodies: [
      { pos: [-1.2, 0, 0], vel: [0.347, 0.532, 0],   mass: 1 },
      { pos: [ 1.2, 0, 0], vel: [0.347, 0.532, 0],   mass: 1 },
      { pos: [  0,  0, 0], vel: [-0.694, -1.064, 0], mass: 1 },
    ],
  },
  {
    label: 'Lagrange',
    bodies: [
      { pos: [-1.0,  0.57, 0], vel: [0.5, -0.28, 0],  mass: 1 },
      { pos: [ 1.0,  0.57, 0], vel: [-0.5, -0.28, 0], mass: 1 },
      { pos: [  0, -1.14, 0], vel: [0, 0.56, 0],      mass: 1 },
    ],
  },
  {
    label: 'Chaotic',
    bodies: [
      { pos: [-1.5, 0.3, 0], vel: [0.2, 0.8, 0.1],  mass: 0.8 },
      { pos: [ 1.0,-0.5, 0], vel: [-0.5, 0.2, 0],   mass: 1.2 },
      { pos: [ 0.2, 1.2, 0], vel: [0.3,-1.0,-0.1],  mass: 1.5 },
    ],
  },
];

const COLORS = ['#63b3ed', '#f5d07a', '#fb923c'];

function makeBodyGeo(shape: BodyShape): THREE.BufferGeometry {
  const s = 0.2;
  switch (shape) {
    case 'sphere':       return new THREE.SphereGeometry(s, 14, 10);
    case 'cube':         return new THREE.BoxGeometry(s*1.6, s*1.6, s*1.6);
    case 'octahedron':   return new THREE.OctahedronGeometry(s * 1.2);
    case 'tetrahedron':  return new THREE.TetrahedronGeometry(s * 1.4);
    case 'torus':        return new THREE.TorusGeometry(s * 0.9, s * 0.35, 8, 20);
    case 'dodecahedron': return new THREE.DodecahedronGeometry(s * 1.1);
    default:             return new THREE.SphereGeometry(s, 14, 10);
  }
}

export function ThreeBodySim() {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef    = useRef<HTMLCanvasElement>(null);
  const frameRef     = useRef<number>(0);
  const meshRefsRef  = useRef<THREE.Mesh[]>([]);
  const trailsRef    = useRef<{ pts: THREE.Vector3[]; line: THREE.Line }[]>([]);
  const bodiesRef    = useRef<{ pos: THREE.Vector3; vel: THREE.Vector3; mass: number }[]>([]);
  const sceneRef     = useRef<THREE.Scene | null>(null);

  const [loading,    setLoading]    = useState(true);
  const [autoMode,   setAutoMode]   = useState(true);
  const [preset,     setPreset]     = useState(0);
  const [shapes,     setShapes]     = useState<BodyShape[]>(['sphere','sphere','sphere']);
  const [speed,      setSpeed]      = useState(1.0);
  const [masses,     setMasses]     = useState([1, 1, 1.5]);
  const [trailLen,   setTrailLen]   = useState(120);
  const [paused,     setPaused]     = useState(false);

  const stateRef = useRef({ autoMode: true, paused: false, speed: 1.0, rotY: 0, rotX: 0.2 });

  useEffect(() => {
    if (!canvasRef.current || !containerRef.current) return;
    const canvas = canvasRef.current;
    const wrap   = containerRef.current;
    const W = wrap.clientWidth || 600;
    const H = 380;

    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(W, H);
    renderer.setClearColor(0x03060f, 1);

    const scene = new THREE.Scene();
    sceneRef.current = scene;
    const cam = new THREE.PerspectiveCamera(55, W / H, 0.01, 1000);
    cam.position.set(0, 2, 6);
    cam.lookAt(0, 0, 0);

    // Stars
    const starGeo = new THREE.BufferGeometry();
    const sp: number[] = [];
    for (let i = 0; i < 800; i++) sp.push((Math.random()-0.5)*50,(Math.random()-0.5)*50,(Math.random()-0.5)*50);
    starGeo.setAttribute('position', new THREE.Float32BufferAttribute(sp, 3));
    scene.add(new THREE.Points(starGeo, new THREE.PointsMaterial({ color: 0x3a5a8a, size: 0.05 })));

    const grid = new THREE.GridHelper(10, 16, 0x0a1428, 0x0a1428);
    grid.position.y = -3;
    scene.add(grid);

    scene.add(new THREE.AmbientLight(0xffffff, 0.3));
    scene.add(Object.assign(new THREE.PointLight(0xffffff, 1.5), { position: { x: 4, y: 4, z: 4 } }));

    const p = PRESETS[0];
    bodiesRef.current = p.bodies.map(b => ({
      pos:  new THREE.Vector3(...(b.pos as [number,number,number])),
      vel:  new THREE.Vector3(...(b.vel as [number,number,number])),
      mass: b.mass,
    }));

    // Create meshes
    meshRefsRef.current = COLORS.map((color, i) => {
      const m = new THREE.Mesh(
        makeBodyGeo('sphere'),
        new THREE.MeshStandardMaterial({ color, emissive: color, emissiveIntensity: 0.35 })
      );
      m.position.copy(bodiesRef.current[i].pos);
      scene.add(m);
      return m;
    });

    // Trails
    trailsRef.current = COLORS.map(color => {
      const geo = new THREE.BufferGeometry();
      const pos = new Float32Array(200 * 3);
      geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
      const line = new THREE.Line(geo, new THREE.LineBasicMaterial({ color, transparent: true, opacity: 0.5 }));
      scene.add(line);
      return { pts: [] as THREE.Vector3[], line };
    });

    // Point lights on bodies
    const bodyLights = COLORS.map((color, i) => {
      const l = new THREE.PointLight(color, 0.8, 4);
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

    const G = 0.8;

    function integrate() {
      const bs = bodiesRef.current;
      const dt = 0.006 * stateRef.current.speed;
      const forces = bs.map(() => new THREE.Vector3());
      for (let i = 0; i < 3; i++) {
        for (let j = i+1; j < 3; j++) {
          const diff = new THREE.Vector3().subVectors(bs[j].pos, bs[i].pos);
          const dist = Math.max(diff.length(), 0.25);
          const f = G * bs[i].mass * bs[j].mass / (dist * dist);
          const fd = diff.normalize().multiplyScalar(f);
          forces[i].add(fd);
          forces[j].sub(fd);
        }
      }
      bs.forEach((b, i) => {
        b.vel.addScaledVector(forces[i], dt / b.mass);
        b.pos.addScaledVector(b.vel, dt);
        meshRefsRef.current[i].position.copy(b.pos);
        bodyLights[i].position.copy(b.pos);
      });
    }

    function updateTrails(maxLen: number) {
      bodiesRef.current.forEach((b, i) => {
        const t = trailsRef.current[i];
        t.pts.push(b.pos.clone());
        if (t.pts.length > maxLen) t.pts.shift();
        const pos = new Float32Array(t.pts.length * 3);
        t.pts.forEach((p, k) => { pos[k*3]=p.x; pos[k*3+1]=p.y; pos[k*3+2]=p.z; });
        t.line.geometry.setAttribute('position', new THREE.BufferAttribute(pos, 3));
        t.line.geometry.setDrawRange(0, t.pts.length);
      });
    }

    function animate() {
      frameRef.current = requestAnimationFrame(animate);
      const s = stateRef.current;

      scene.rotation.y = s.rotY;
      scene.rotation.x = s.rotX;

      if (!s.paused) {
        integrate();
        updateTrails(trailLen);
        // Spin meshes
        meshRefsRef.current.forEach(m => { m.rotation.x += 0.02; m.rotation.y += 0.015; });
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

  // Sync state
  useEffect(() => { stateRef.current.autoMode = autoMode; }, [autoMode]);
  useEffect(() => { stateRef.current.paused   = paused;   }, [paused]);
  useEffect(() => { stateRef.current.speed    = speed;    }, [speed]);

  // Apply preset
  const applyPreset = (idx: number) => {
    setPreset(idx);
    const p = PRESETS[idx];
    const ms = masses;
    bodiesRef.current = p.bodies.map((b, i) => ({
      pos:  new THREE.Vector3(...(b.pos as [number,number,number])),
      vel:  new THREE.Vector3(...(b.vel as [number,number,number])),
      mass: ms[i],
    }));
    trailsRef.current.forEach(t => { t.pts = []; });
  };

  // Apply shape change
  const applyShape = (bodyIdx: number, shape: BodyShape) => {
    const newShapes = [...shapes];
    newShapes[bodyIdx] = shape;
    setShapes(newShapes);
    const m = meshRefsRef.current[bodyIdx];
    if (!m) return;
    m.geometry.dispose();
    m.geometry = makeBodyGeo(shape);
  };

  // Apply mass change
  const applyMass = (bodyIdx: number, val: number) => {
    const newMasses = [...masses];
    newMasses[bodyIdx] = val;
    setMasses(newMasses);
    if (bodiesRef.current[bodyIdx]) bodiesRef.current[bodyIdx].mass = val;
  };

  return (
    <div className="relative space-y-4">
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center z-10 bg-[#03060f]/80 rounded-xl">
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 rounded-full bg-steami-cyan animate-pulse" />
            <span className="font-mono text-[11px] text-muted-foreground tracking-wider">INITIALIZING 3-BODY SYSTEM…</span>
          </div>
        </div>
      )}

      {/* Canvas */}
      <div
        ref={containerRef}
        className="w-full rounded-xl overflow-hidden relative cursor-grab active:cursor-grabbing"
        style={{ boxShadow: '0 4px 32px rgba(0,0,0,0.5)' }}
      >
        <canvas ref={canvasRef} className="w-full block" style={{ height: 380 }} />

        {/* Overlay labels */}
        <div className="absolute top-3 left-3 font-mono text-[9px] text-white/20 tracking-wider pointer-events-none">
          DRAG · ROTATE
        </div>
        <div className="absolute bottom-3 left-3 flex items-center gap-1.5 px-2 py-1 rounded"
          style={{ background: 'rgba(3,6,15,0.75)', border: '1px solid rgba(99,179,237,0.2)' }}>
          <span className={`w-1.5 h-1.5 rounded-full ${paused ? 'bg-steami-red' : 'bg-steami-green animate-pulse'}`} />
          <span className="font-mono text-[9px] text-muted-foreground tracking-wider">{paused ? 'PAUSED' : 'RUNNING'}</span>
        </div>
      </div>

      {/* ── Control bar ── */}
      <div className="flex flex-wrap gap-3 items-center">
        <button onClick={() => setPaused(!paused)} className="steami-btn text-[11px] px-3 py-1.5">
          {paused ? '▶ RESUME' : '⏸ PAUSE'}
        </button>
        <button onClick={() => applyPreset(preset)} className="steami-btn text-[11px] px-3 py-1.5">
          ↺ RESET
        </button>

        {/* Preset picker */}
        <div className="flex gap-1.5">
          {PRESETS.map((p, i) => (
            <button key={i} onClick={() => applyPreset(i)}
              className={`steami-btn text-[10px] px-2.5 py-1 ${preset === i ? 'border-steami-cyan/60' : ''}`}>
              {p.label}
            </button>
          ))}
        </div>

        {/* Speed */}
        <div className="flex items-center gap-2">
          <span className="font-mono text-[10px] text-muted-foreground">Speed</span>
          <input type="range" min="0.1" max="4" step="0.1" value={speed}
            onChange={e => setSpeed(+e.target.value)}
            className="w-20 accent-[hsl(var(--steami-cyan))]" />
          <span className="font-mono text-[10px] text-steami-cyan">{speed.toFixed(1)}×</span>
        </div>

        {/* Trail length */}
        <div className="flex items-center gap-2">
          <span className="font-mono text-[10px] text-muted-foreground">Trail</span>
          <input type="range" min="20" max="300" step="10" value={trailLen}
            onChange={e => setTrailLen(+e.target.value)}
            className="w-20 accent-[hsl(var(--steami-violet))]" />
        </div>
      </div>

      {/* ── Per-body controls ── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {COLORS.map((color, i) => (
          <div key={i} className="rounded-xl p-3 space-y-2"
            style={{ background: 'rgba(6,16,38,0.6)', border: `1px solid ${color}28` }}>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full" style={{ background: color }} />
              <span className="font-mono text-[10px] tracking-wider" style={{ color }}>BODY {i+1}</span>
            </div>

            {/* Shape */}
            <div className="flex flex-wrap gap-1">
              {BODY_SHAPES.map(s => (
                <button key={s.id} onClick={() => applyShape(i, s.id)}
                  className={`font-mono text-[9px] px-1.5 py-0.5 rounded border transition-all ${
                    shapes[i] === s.id
                      ? 'border-current bg-current/10'
                      : 'border-white/10 text-muted-foreground hover:border-white/20'
                  }`}
                  style={shapes[i] === s.id ? { color, borderColor: color + '80' } : {}}>
                  {s.label}
                </button>
              ))}
            </div>

            {/* Mass */}
            <div className="flex items-center gap-2">
              <span className="font-mono text-[9px] text-muted-foreground">Mass</span>
              <input type="range" min="0.2" max="5" step="0.1" value={masses[i]}
                onChange={e => applyMass(i, +e.target.value)}
                className="flex-1"
                style={{ accentColor: color }} />
              <span className="font-mono text-[9px]" style={{ color }}>{masses[i].toFixed(1)}</span>
            </div>
          </div>
        ))}
      </div>

      <p className="font-mono text-[11px] text-muted-foreground tracking-wide leading-relaxed">
        ◆ Three gravitationally interacting bodies — deterministic yet chaotic. Tiny changes in initial conditions diverge exponentially.
        DRAG to rotate. Switch presets to see stable figure-8, Lagrange equilibrium, and fully chaotic orbits.
      </p>
    </div>
  );
}
