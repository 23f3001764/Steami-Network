import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';

// ── Shape options for the "classical bit" comparison object ───────────────────
type BitShape = 'cube' | 'sphere' | 'cylinder' | 'cone' | 'torus' | 'octahedron' | 'tetrahedron' | 'dodecahedron';

const BIT_SHAPES: { id: BitShape; label: string; icon: string }[] = [
  { id: 'cube',        label: 'Cube',        icon: '⬛' },
  { id: 'sphere',      label: 'Sphere',      icon: '🔵' },
  { id: 'cylinder',    label: 'Cylinder',    icon: '🥫' },
  { id: 'cone',        label: 'Cone',        icon: '🔺' },
  { id: 'torus',       label: 'Torus',       icon: '⭕' },
  { id: 'octahedron',  label: 'Octahedron',  icon: '💠' },
  { id: 'tetrahedron', label: 'Tetrahedron', icon: '🔷' },
  { id: 'dodecahedron',label: 'Dodecahedron',icon: '⬡'  },
];

function makeBitGeometry(shape: BitShape): THREE.BufferGeometry {
  switch (shape) {
    case 'cube':         return new THREE.BoxGeometry(0.8, 0.8, 0.8);
    case 'sphere':       return new THREE.SphereGeometry(0.45, 16, 12);
    case 'cylinder':     return new THREE.CylinderGeometry(0.3, 0.3, 0.8, 16);
    case 'cone':         return new THREE.ConeGeometry(0.4, 0.85, 16);
    case 'torus':        return new THREE.TorusGeometry(0.3, 0.12, 12, 32);
    case 'octahedron':   return new THREE.OctahedronGeometry(0.5);
    case 'tetrahedron':  return new THREE.TetrahedronGeometry(0.52);
    case 'dodecahedron': return new THREE.DodecahedronGeometry(0.42);
    default:             return new THREE.BoxGeometry(0.8, 0.8, 0.8);
  }
}

// ─────────────────────────────────────────────────────────────────────────────

export function QuantumBlochSphere() {
  const containerRef  = useRef<HTMLDivElement>(null);
  const canvasRef     = useRef<HTMLCanvasElement>(null);
  const rendererRef   = useRef<THREE.WebGLRenderer | null>(null);
  const frameRef      = useRef<number>(0);
  const bitMeshRef    = useRef<THREE.Mesh | null>(null);
  const bitEdgeRef    = useRef<THREE.LineSegments | null>(null);
  const bitGroupRef   = useRef<THREE.Group | null>(null);
  const sceneRef      = useRef<THREE.Scene | null>(null);

  const [loading,      setLoading]      = useState(true);
  const [theta,        setTheta]        = useState(45);
  const [phi,          setPhi]          = useState(0);
  const [autoMode,     setAutoMode]     = useState(true);
  const [bitShape,     setBitShape]     = useState<BitShape>('cube');
  const [showBit,      setShowBit]      = useState(true);

  const stateRef = useRef({
    rotX: 0.3, rotY: 0.5,
    theta: 45, phi: 0,
    autoMode: true,
  });

  // ── Main Three.js setup ────────────────────────────────────────────────────
  useEffect(() => {
    if (!canvasRef.current || !containerRef.current) return;
    const canvas = canvasRef.current;
    const wrap   = containerRef.current;
    const W = wrap.clientWidth || 600;
    const H = 360;

    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(W, H);
    renderer.setClearColor(0x03060f, 1);
    rendererRef.current = renderer;

    const scene = new THREE.Scene();
    sceneRef.current = scene;
    const cam = new THREE.PerspectiveCamera(55, W / H, 0.01, 1000);
    cam.position.set(0, 1.5, 4.5);
    cam.lookAt(0, 0, 0);

    // Grid floor
    const grid = new THREE.GridHelper(8, 14, 0x0a1428, 0x0a1428);
    grid.position.y = -2.2;
    scene.add(grid);

    // Stars
    const starGeo = new THREE.BufferGeometry();
    const starPositions: number[] = [];
    for (let i = 0; i < 600; i++) {
      starPositions.push((Math.random() - 0.5) * 40, (Math.random() - 0.5) * 40, (Math.random() - 0.5) * 40);
    }
    starGeo.setAttribute('position', new THREE.Float32BufferAttribute(starPositions, 3));
    scene.add(new THREE.Points(starGeo, new THREE.PointsMaterial({ color: 0x4a6fa5, size: 0.06 })));

    // Bloch Sphere
    const sGeo = new THREE.SphereGeometry(1.5, 40, 30);
    const sMat = new THREE.MeshBasicMaterial({ color: 0x0d2040, transparent: true, opacity: 0.45, side: THREE.DoubleSide });
    scene.add(new THREE.Mesh(sGeo, sMat));

    // Equatorial ring
    const eqRing = new THREE.Mesh(
      new THREE.RingGeometry(1.49, 1.51, 64),
      new THREE.MeshBasicMaterial({ color: 0x1a3a70, side: THREE.DoubleSide, transparent: true, opacity: 0.5 })
    );
    eqRing.rotation.x = Math.PI / 2;
    scene.add(eqRing);

    // Meridian ring
    const mRing = new THREE.Mesh(
      new THREE.RingGeometry(1.49, 1.51, 64),
      new THREE.MeshBasicMaterial({ color: 0x1a3a70, side: THREE.DoubleSide, transparent: true, opacity: 0.35 })
    );
    scene.add(mRing);

    // Axes — |0⟩ (top green), |1⟩ (bottom red), X (blue), -X (violet)
    const axesDef = [
      { from: [0,0,0], to: [0, 2,0], color: 0x26de81 },
      { from: [0,0,0], to: [0,-2,0], color: 0xfc5c65 },
      { from: [0,0,0], to: [ 2,0,0], color: 0x63b3ed },
      { from: [0,0,0], to: [-2,0,0], color: 0xa78bfa },
      { from: [0,0,0], to: [0,0, 2], color: 0x63b3ed },
      { from: [0,0,0], to: [0,0,-2], color: 0xa78bfa },
    ];
    axesDef.forEach(ax => {
      const geo = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(...(ax.from as [number,number,number])),
        new THREE.Vector3(...(ax.to   as [number,number,number])),
      ]);
      const line = new THREE.Line(geo, new THREE.LineBasicMaterial({ color: ax.color, transparent: true, opacity: 0.4 }));
      scene.add(line);
    });

    // Axis labels (small spheres at tips)
    const labelDefs = [
      { pos: [0, 1.62, 0],  color: 0x26de81 },
      { pos: [0,-1.62, 0],  color: 0xfc5c65 },
      { pos: [ 1.62, 0, 0], color: 0x63b3ed },
      { pos: [-1.62, 0, 0], color: 0xa78bfa },
    ];
    labelDefs.forEach(l => {
      const tip = new THREE.Mesh(
        new THREE.SphereGeometry(0.05, 8, 8),
        new THREE.MeshBasicMaterial({ color: l.color })
      );
      tip.position.set(...(l.pos as [number,number,number]));
      scene.add(tip);
    });

    // State vector LINE (from origin to tip — this is the key element)
    const vecLineGeo = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(0, 1.5, 0),
    ]);
    const stateVec = new THREE.Line(
      vecLineGeo,
      new THREE.LineBasicMaterial({ color: 0xf5d07a, linewidth: 2 })
    );
    scene.add(stateVec);

    // Arrow cone at the tip
    const arrowHead = new THREE.Mesh(
      new THREE.ConeGeometry(0.08, 0.22, 10),
      new THREE.MeshBasicMaterial({ color: 0xf5d07a })
    );
    arrowHead.position.set(0, 1.62, 0);
    scene.add(arrowHead);

    // State point (gold sphere at surface)
    const statePoint = new THREE.Mesh(
      new THREE.SphereGeometry(0.1, 14, 14),
      new THREE.MeshBasicMaterial({ color: 0xf5d07a })
    );
    statePoint.position.set(0, 1.5, 0);
    scene.add(statePoint);

    // Halo glow around state point
    const halo = new THREE.Mesh(
      new THREE.SphereGeometry(0.2, 12, 12),
      new THREE.MeshBasicMaterial({ color: 0xf5d07a, transparent: true, opacity: 0.15 })
    );
    halo.position.copy(statePoint.position);
    scene.add(halo);

    // Classical comparison group (right side)
    const bitGroup = new THREE.Group();
    bitGroup.position.set(3.2, 0, 0);
    bitGroupRef.current = bitGroup;

    const bitMat = new THREE.MeshBasicMaterial({ color: 0x0d1f3c, transparent: true, opacity: 0.85 });
    const initGeo = makeBitGeometry('cube');
    const bitMesh = new THREE.Mesh(initGeo, bitMat);
    const bitEdge = new THREE.LineSegments(
      new THREE.EdgesGeometry(initGeo),
      new THREE.LineBasicMaterial({ color: 0xfc5c65, transparent: true, opacity: 0.75 })
    );
    bitGroup.add(bitMesh, bitEdge);
    bitMeshRef.current = bitMesh;
    bitEdgeRef.current = bitEdge;
    scene.add(bitGroup);

    // Bit state indicator (red dot = |1⟩ fixed)
    const bitDot = new THREE.Mesh(
      new THREE.SphereGeometry(0.06, 8, 8),
      new THREE.MeshBasicMaterial({ color: 0xfc5c65 })
    );
    bitDot.position.set(3.2, 0.6, 0);
    scene.add(bitDot);

    scene.add(new THREE.AmbientLight(0x0a1428, 1));

    // Drag rotation
    let dragging = false, px = 0, py = 0;
    const onDown  = (e: MouseEvent) => { dragging = true;  px = e.clientX; py = e.clientY; };
    const onUp    = ()              => { dragging = false; };
    const onMove  = (e: MouseEvent) => {
      if (!dragging) return;
      stateRef.current.rotY += (e.clientX - px) * 0.01;
      stateRef.current.rotX += (e.clientY - py) * 0.01;
      px = e.clientX; py = e.clientY;
    };
    wrap.addEventListener('mousedown', onDown);
    window.addEventListener('mouseup', onUp);
    window.addEventListener('mousemove', onMove);

    setLoading(false);

    function animate() {
      frameRef.current = requestAnimationFrame(animate);
      const s = stateRef.current;
      const now = Date.now();

      scene.rotation.y = s.rotY;
      scene.rotation.x = s.rotX * 0.3;

      // Halo pulse
      halo.material.opacity = 0.08 + 0.1 * Math.sin(now * 0.003);
      halo.scale.setScalar(1 + 0.08 * Math.sin(now * 0.002));

      // Bit spin
      bitGroup.rotation.y += 0.012;
      bitGroup.rotation.x += 0.007;

      let x: number, y: number, z: number;

      if (s.autoMode) {
        const t = now * 0.0008;
        const autoTheta = Math.PI / 2 + Math.sin(t) * 0.5;
        const autoPhi   = t * 0.7;
        x = Math.sin(autoTheta) * Math.cos(autoPhi) * 1.5;
        y = Math.cos(autoTheta) * 1.5;
        z = Math.sin(autoTheta) * Math.sin(autoPhi) * 1.5;
      } else {
        const tRad = s.theta * Math.PI / 180;
        const pRad = s.phi   * Math.PI / 180;
        x = Math.sin(tRad) * Math.cos(pRad) * 1.5;
        y = Math.cos(tRad) * 1.5;
        z = Math.sin(tRad) * Math.sin(pRad) * 1.5;
      }

      // Update state vector line endpoints
      stateVec.geometry.setFromPoints([
        new THREE.Vector3(0, 0, 0),
        new THREE.Vector3(x, y, z),
      ]);

      statePoint.position.set(x, y, z);
      halo.position.set(x, y, z);

      // Arrow tip + rotation
      const len = Math.sqrt(x*x + y*y + z*z);
      arrowHead.position.set(x * (1 + 0.08/len), y * (1 + 0.08/len), z * (1 + 0.08/len));
      arrowHead.lookAt(0, 0, 0);
      arrowHead.rotateX(Math.PI / 2);

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

  // Sync sliders → stateRef
  useEffect(() => {
    stateRef.current.theta    = theta;
    stateRef.current.phi      = phi;
    stateRef.current.autoMode = autoMode;
  }, [theta, phi, autoMode]);

  // Swap the classical bit geometry when shape changes
  useEffect(() => {
    if (!bitMeshRef.current || !bitEdgeRef.current || !bitGroupRef.current) return;
    const newGeo = makeBitGeometry(bitShape);
    bitMeshRef.current.geometry.dispose();
    bitMeshRef.current.geometry = newGeo;
    bitEdgeRef.current.geometry.dispose();
    bitEdgeRef.current.geometry = new THREE.EdgesGeometry(newGeo);
  }, [bitShape]);

  // Show/hide classical bit
  useEffect(() => {
    if (!bitGroupRef.current) return;
    bitGroupRef.current.visible = showBit;
  }, [showBit]);

  // Qubit state labels
  const thetaRad = theta * Math.PI / 180;
  const alpha = Math.cos(thetaRad / 2).toFixed(3);
  const beta  = Math.sin(thetaRad / 2).toFixed(3);

  return (
    <div className="relative space-y-4">
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center z-10 bg-[#03060f]/80 rounded-xl">
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 rounded-full bg-steami-cyan animate-pulse" />
            <span className="font-mono text-[11px] text-muted-foreground tracking-wider">INITIALIZING BLOCH SPHERE…</span>
          </div>
        </div>
      )}

      {/* Canvas */}
      <div
        ref={containerRef}
        className="w-full rounded-xl overflow-hidden relative cursor-grab active:cursor-grabbing"
        style={{ boxShadow: '0 4px 32px rgba(0,0,0,0.5)' }}
      >
        <canvas ref={canvasRef} className="w-full block" style={{ height: 360 }} />

        {/* Overlay labels */}
        <div className="absolute top-3 left-3 flex flex-col gap-1 pointer-events-none">
          <span className="font-mono text-[9px] text-white/20 tracking-wider">DRAG · ROTATE</span>
        </div>

        {/* State readout */}
        {!autoMode && (
          <div className="absolute top-3 right-3 px-2.5 py-1.5 rounded-lg pointer-events-none"
            style={{ background: 'rgba(3,6,15,0.75)', border: '1px solid rgba(245,208,122,0.25)' }}>
            <p className="font-mono text-[10px] text-[#f5d07a] leading-relaxed">
              |ψ⟩ = {alpha}|0⟩ + {beta}e^(iφ)|1⟩
            </p>
          </div>
        )}

        {/* Mode badge */}
        <div className="absolute bottom-3 left-3 flex items-center gap-1.5 px-2 py-1 rounded"
          style={{ background: 'rgba(3,6,15,0.75)', border: '1px solid rgba(99,179,237,0.2)' }}>
          <span className={`w-1.5 h-1.5 rounded-full ${autoMode ? 'bg-steami-green animate-pulse' : 'bg-steami-gold'}`} />
          <span className="font-mono text-[9px] text-muted-foreground tracking-wider">
            {autoMode ? 'AUTO' : 'MANUAL'}
          </span>
        </div>
      </div>

      {/* ── Controls row ── */}
      <div className="flex flex-wrap gap-3 items-start">

        {/* Mode toggle */}
        <button
          onClick={() => setAutoMode(!autoMode)}
          className={`steami-btn text-[11px] px-3 py-1.5 flex items-center gap-2 ${autoMode ? '' : 'opacity-80'}`}
        >
          <span className={`w-1.5 h-1.5 rounded-full ${autoMode ? 'bg-steami-green animate-pulse' : 'bg-steami-gold'}`} />
          {autoMode ? '⟳ AUTO SUPERPOSITION' : '⊙ MANUAL MODE'}
        </button>

        {/* Show/hide classical bit */}
        <button
          onClick={() => setShowBit(!showBit)}
          className="steami-btn text-[11px] px-3 py-1.5"
        >
          {showBit ? '👁 HIDE BIT' : '👁 SHOW BIT'}
        </button>

        {/* Manual sliders */}
        {!autoMode && (
          <div className="flex flex-wrap gap-3 items-center">
            <div className="flex items-center gap-2">
              <span className="font-mono text-[11px] text-muted-foreground">θ (polar)</span>
              <input type="range" min="0" max="180" value={theta}
                onChange={e => setTheta(Number(e.target.value))}
                className="w-24 accent-[hsl(var(--steami-gold))]" />
              <span className="font-mono text-[11px] text-[#f5d07a]">{theta}°</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-[11px] text-muted-foreground">φ (azimuthal)</span>
              <input type="range" min="0" max="360" value={phi}
                onChange={e => setPhi(Number(e.target.value))}
                className="w-24 accent-[hsl(var(--steami-cyan))]" />
              <span className="font-mono text-[11px] text-steami-cyan">{phi}°</span>
            </div>
          </div>
        )}
      </div>

      {/* ── Classical bit shape picker ── */}
      {showBit && (
        <div className="rounded-xl p-4 space-y-3"
          style={{ background: 'rgba(6,16,38,0.6)', border: '1px solid rgba(252,92,101,0.2)' }}>
          <div className="flex items-center gap-2">
            <span className="font-mono text-[10px] text-muted-foreground tracking-wider uppercase">Classical Bit Shape</span>
            <span className="font-mono text-[9px] text-steami-red opacity-60">← deterministic object (right side)</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {BIT_SHAPES.map(s => (
              <button
                key={s.id}
                onClick={() => setBitShape(s.id)}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-mono transition-all border ${
                  bitShape === s.id
                    ? 'border-steami-red/60 bg-steami-red/10 text-steami-red'
                    : 'border-white/10 hover:border-white/20 text-muted-foreground'
                }`}
              >
                <span>{s.icon}</span>
                <span>{s.label}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Description */}
      <p className="font-mono text-[11px] text-muted-foreground tracking-wide leading-relaxed">
        ◆ DRAG to rotate the Bloch sphere. The gold vector is the qubit state{' '}
        <span className="text-[#f5d07a]">|ψ⟩ = cos(θ/2)|0⟩ + e^(iφ)sin(θ/2)|1⟩</span>.{' '}
        The classical bit (right) is always in a definite state — a qubit exists in superposition across the entire sphere until measured.
      </p>
    </div>
  );
}
