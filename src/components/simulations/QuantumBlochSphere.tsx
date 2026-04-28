import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';

export function QuantumBlochSphere() {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const frameRef = useRef<number>(0);
  const [loading, setLoading] = useState(true);
  const [theta, setTheta] = useState(45);
  const [phi, setPhi] = useState(0);
  const [superposMode, setSuperposMode] = useState(true);
  const stateRef = useRef({ rotX: 0.3, rotY: 0.5, theta: 0, phi: 0, superposMode: true });

  useEffect(() => {
    if (!canvasRef.current || !containerRef.current) return;
    const canvas = canvasRef.current;
    const wrap = containerRef.current;
    const W = wrap.clientWidth;
    const H = 320;

    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(W, H);
    renderer.setClearColor(0x03060f, 1);
    rendererRef.current = renderer;

    const scene = new THREE.Scene();
    const cam = new THREE.PerspectiveCamera(55, W / H, 0.01, 1000);
    cam.position.set(0, 1.5, 4.5);
    cam.lookAt(0, 0, 0);

    // Grid floor
    const grid = new THREE.GridHelper(6, 12, 0x0a1428, 0x0a1428);
    grid.position.y = -2;
    scene.add(grid);

    // Bloch Sphere
    const sGeo = new THREE.SphereGeometry(1.5, 32, 24);
    const sMat = new THREE.MeshBasicMaterial({ color: 0x0d2040, transparent: true, opacity: 0.5 });
    scene.add(new THREE.Mesh(sGeo, sMat));

    // Rings
    [0, Math.PI / 2, Math.PI / 4].forEach((rot, i) => {
      const rGeo = new THREE.RingGeometry(1.49, 1.51, 64);
      const rMat = new THREE.MeshBasicMaterial({ color: 0x1a3a70, side: THREE.DoubleSide, transparent: true, opacity: 0.35 });
      const ring = new THREE.Mesh(rGeo, rMat);
      if (i === 0) ring.rotation.x = Math.PI / 2;
      if (i === 2) { ring.rotation.x = Math.PI / 4; ring.rotation.z = Math.PI / 4; }
      scene.add(ring);
    });

    // Axes
    const axes = [
      { dir: [0, 1, 0], color: 0x26de81 },
      { dir: [0, -1, 0], color: 0xfc5c65 },
      { dir: [1, 0, 0], color: 0x63b3ed },
      { dir: [-1, 0, 0], color: 0xa78bfa },
    ];
    axes.forEach(a => {
      const geo = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(0, 0, 0),
        new THREE.Vector3(...(a.dir as [number, number, number])).multiplyScalar(2)
      ]);
      scene.add(new THREE.Line(geo, new THREE.LineBasicMaterial({ color: a.color, transparent: true, opacity: 0.4 })));
      const tip = new THREE.Mesh(new THREE.SphereGeometry(0.06, 8, 8), new THREE.MeshBasicMaterial({ color: a.color }));
      tip.position.set(...(a.dir as [number, number, number])).multiplyScalar(1.55);
      scene.add(tip);
    });

    // State vector
    const arrowGeo = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, 1.5, 0)
    ]);
    const stateVec = new THREE.Line(arrowGeo, new THREE.LineBasicMaterial({ color: 0xf5d07a, linewidth: 2 }));
    scene.add(stateVec);

    const arrowHead = new THREE.Mesh(new THREE.ConeGeometry(0.08, 0.25, 8), new THREE.MeshBasicMaterial({ color: 0xf5d07a }));
    arrowHead.position.set(0, 1.62, 0);
    scene.add(arrowHead);

    const statePoint = new THREE.Mesh(new THREE.SphereGeometry(0.1, 10, 10), new THREE.MeshBasicMaterial({ color: 0xf5d07a }));
    statePoint.position.set(0, 1.5, 0);
    scene.add(statePoint);

    const halo = new THREE.Mesh(new THREE.SphereGeometry(0.18, 10, 10), new THREE.MeshBasicMaterial({ color: 0xf5d07a, transparent: true, opacity: 0.15 }));
    halo.position.copy(statePoint.position);
    scene.add(halo);

    // Classical bit
    const bitGroup = new THREE.Group();
    bitGroup.position.set(3, 0, 0);
    const bitBox = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.8, 0.8), new THREE.MeshBasicMaterial({ color: 0x0d1f3c, transparent: true, opacity: 0.8 }));
    const bitEdge = new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.BoxGeometry(0.8, 0.8, 0.8)), new THREE.LineBasicMaterial({ color: 0xfc5c65, transparent: true, opacity: 0.7 }));
    bitGroup.add(bitBox, bitEdge);
    scene.add(bitGroup);

    scene.add(new THREE.AmbientLight(0x0a1428, 1));

    // Drag
    let dragging = false, px = 0, py = 0;
    const onDown = (e: MouseEvent) => { dragging = true; px = e.clientX; py = e.clientY; };
    const onUp = () => { dragging = false; };
    const onMove = (e: MouseEvent) => {
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
      scene.rotation.y = s.rotY;
      scene.rotation.x = s.rotX * 0.3;

      halo.material.opacity = 0.1 + 0.1 * Math.sin(Date.now() * 0.003);
      halo.scale.setScalar(1 + 0.1 * Math.sin(Date.now() * 0.002));

      if (s.superposMode) {
        const t = Date.now() * 0.0008;
        const autoTheta = Math.PI / 2 + Math.sin(t) * 0.5;
        const autoPhi = t * 0.7;
        const x = Math.sin(autoTheta) * Math.cos(autoPhi) * 1.5;
        const y = Math.cos(autoTheta) * 1.5;
        const z = Math.sin(autoTheta) * Math.sin(autoPhi) * 1.5;
        stateVec.geometry.setFromPoints([new THREE.Vector3(0, 0, 0), new THREE.Vector3(x, y, z)]);
        statePoint.position.set(x, y, z);
        halo.position.set(x, y, z);
        arrowHead.position.set(x * 1.08, y * 1.08, z * 1.08);
      } else {
        const thetaRad = s.theta * Math.PI / 180;
        const phiRad = s.phi * Math.PI / 180;
        const x = Math.sin(thetaRad) * Math.cos(phiRad) * 1.5;
        const y = Math.cos(thetaRad) * 1.5;
        const z = Math.sin(thetaRad) * Math.sin(phiRad) * 1.5;
        stateVec.geometry.setFromPoints([new THREE.Vector3(0, 0, 0), new THREE.Vector3(x, y, z)]);
        statePoint.position.set(x, y, z);
        halo.position.set(x, y, z);
        arrowHead.position.set(x * 1.08, y * 1.08, z * 1.08);
        arrowHead.lookAt(0, 0, 0);
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
  useEffect(() => {
    stateRef.current.theta = theta;
    stateRef.current.phi = phi;
    stateRef.current.superposMode = superposMode;
  }, [theta, phi, superposMode]);

  return (
    <div className="relative">
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center z-10">
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 rounded-full bg-steami-cyan animate-pulse" />
            <span className="font-mono text-[11px] text-muted-foreground tracking-wider">INITIALIZING BLOCH SPHERE…</span>
          </div>
        </div>
      )}
      <div ref={containerRef} className="w-full rounded-xl overflow-hidden relative cursor-grab active:cursor-grabbing" style={{ boxShadow: '0 4px 24px rgba(0,0,0,0.4)' }}>
        <canvas ref={canvasRef} className="w-full block" style={{ height: 320 }} />
      </div>

      {/* Controls */}
      <div className="mt-4 flex flex-wrap gap-3 items-center">
        <button
          onClick={() => setSuperposMode(!superposMode)}
          className={`steami-btn text-[16px] ${superposMode ? 'steami-btn-gold' : ''}`}
        >
          {superposMode ? '⟳ AUTO SUPERPOSITION' : '⊙ MANUAL MODE'}
        </button>

        {!superposMode && (
          <>
            <div className="flex items-center gap-2">
              <span className="font-mono text-[11px] text-muted-foreground">θ</span>
              <input type="range" min="0" max="180" value={theta}
                onChange={e => setTheta(Number(e.target.value))}
                className="w-20 accent-[hsl(var(--steami-gold))]" />
              <span className="font-mono text-[11px] text-muted-foreground">{theta}°</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-[11px] text-muted-foreground">φ</span>
              <input type="range" min="0" max="360" value={phi}
                onChange={e => setPhi(Number(e.target.value))}
                className="w-20 accent-[hsl(var(--steami-cyan))]" />
              <span className="font-mono text-[11px] text-muted-foreground">{phi}°</span>
            </div>
          </>
        )}
      </div>

      <p className="mt-3 font-mono text-[11px] text-muted-foreground tracking-wide leading-relaxed">
        ◆ DRAG to rotate the Bloch sphere. The gold vector represents the qubit state |ψ⟩ = cos(θ/2)|0⟩ + e^(iφ)sin(θ/2)|1⟩. 
        The classical bit (red cube, right) can only be |0⟩ or |1⟩ — the qubit can be anywhere on the sphere.
      </p>
    </div>
  );
}
