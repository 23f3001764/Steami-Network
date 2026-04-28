import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';

export function ThreeBodySim() {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const frameRef = useRef<number>(0);
  const [loading, setLoading] = useState(true);
  const [massRatio, setMassRatio] = useState(10);
  const [speed, setSpeed] = useState(2);
  const stateRef = useRef({ rotX: 0, rotY: 0, massRatio: 1.0, timeStep: 0.5 });

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

    const scene = new THREE.Scene();
    const cam = new THREE.PerspectiveCamera(50, W / H, 0.1, 100);
    cam.position.set(0, 0, 8);

    const G = 0.8;
    const TRAIL_LEN = 120;
    const BODY_COLORS = [0x63b3ed, 0xf5d07a, 0xfb923c];

    const bodies: Array<{ pos: THREE.Vector3; vel: THREE.Vector3; mass: number; color: number; mesh: THREE.Mesh; glow: THREE.Mesh }> = [];
    const trails: THREE.Line[] = [];
    let trailPositions: THREE.Vector3[][] = [[], [], []];

    function resetBodies() {
      const s = stateRef.current;
      const newBodies = [
        { pos: new THREE.Vector3(-1.0, 0, 0), vel: new THREE.Vector3(0.347, 0.532, 0), mass: 1.0, color: BODY_COLORS[0] },
        { pos: new THREE.Vector3(1.0, 0, 0), vel: new THREE.Vector3(0.347, 0.532, 0), mass: 1.0, color: BODY_COLORS[1] },
        { pos: new THREE.Vector3(0.0, 0, 0), vel: new THREE.Vector3(-0.694, -1.064, 0), mass: s.massRatio, color: BODY_COLORS[2] },
      ];
      // Add small perturbation
      newBodies[0].pos.x += (Math.random() - 0.5) * 0.1;
      newBodies[0].pos.y += (Math.random() - 0.5) * 0.1;

      if (bodies.length > 0) {
        newBodies.forEach((b, i) => {
          bodies[i].pos.copy(b.pos);
          bodies[i].vel.copy(b.vel);
          bodies[i].mass = b.mass;
          bodies[i].mesh.position.copy(b.pos);
          bodies[i].glow.position.copy(b.pos);
        });
      } else {
        newBodies.forEach(b => {
          const mesh = new THREE.Mesh(new THREE.SphereGeometry(0.18, 12, 12), new THREE.MeshBasicMaterial({ color: b.color }));
          mesh.position.copy(b.pos);
          scene.add(mesh);
          const glow = new THREE.Mesh(new THREE.SphereGeometry(0.3, 8, 8), new THREE.MeshBasicMaterial({ color: b.color, transparent: true, opacity: 0.12 }));
          glow.position.copy(b.pos);
          scene.add(glow);
          bodies.push({ ...b, mesh, glow } as { pos: THREE.Vector3; vel: THREE.Vector3; mass: number; color: number; mesh: THREE.Mesh; glow: THREE.Mesh });
        });

        bodies.forEach(b => {
          const geo = new THREE.BufferGeometry();
          const positions = new Float32Array(TRAIL_LEN * 3);
          geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
          const mat = new THREE.LineBasicMaterial({ color: b.color, transparent: true, opacity: 0.35 });
          const line = new THREE.Line(geo, mat);
          trails.push(line);
          scene.add(line);
        });
      }
      trailPositions = [[], [], []];
    }

    resetBodies();
    (window as Window & { __tbReset?: () => void }).__tbReset = () => {
      stateRef.current.massRatio = 1.0;
      stateRef.current.timeStep = 0.5;
      setMassRatio(10);
      setSpeed(2);
      resetBodies();
    };

    // Drag
    let dragging = false, px = 0, py = 0;
    const onDown = (e: MouseEvent) => { dragging = true; px = e.clientX; py = e.clientY; };
    const onUp = () => { dragging = false; };
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

    function stepPhysics() {
      const s = stateRef.current;
      const dt = 0.006 * s.timeStep;
      const forces = bodies.map(() => new THREE.Vector3());
      for (let i = 0; i < 3; i++) {
        for (let j = i + 1; j < 3; j++) {
          const diff = new THREE.Vector3().subVectors(bodies[j].pos, bodies[i].pos);
          const dist = Math.max(diff.length(), 0.3);
          const f = G * bodies[i].mass * bodies[j].mass / (dist * dist);
          const fd = diff.normalize().multiplyScalar(f);
          forces[i].add(fd);
          forces[j].sub(fd);
        }
      }
      bodies.forEach((b, i) => {
        b.vel.addScaledVector(forces[i], dt / b.mass);
        b.pos.addScaledVector(b.vel, dt);
        b.mesh.position.copy(b.pos);
        b.glow.position.copy(b.pos);
      });

      bodies.forEach((b, i) => {
        trailPositions[i].push(b.pos.clone());
        if (trailPositions[i].length > TRAIL_LEN) trailPositions[i].shift();
        const positions = trails[i].geometry.attributes.position.array as Float32Array;
        for (let k = 0; k < TRAIL_LEN; k++) {
          const pt = trailPositions[i][k] || b.pos;
          positions[k * 3] = pt.x;
          positions[k * 3 + 1] = pt.y;
          positions[k * 3 + 2] = pt.z;
        }
        trails[i].geometry.setDrawRange(0, trailPositions[i].length);
        trails[i].geometry.attributes.position.needsUpdate = true;
        (trails[i].material as THREE.LineBasicMaterial).opacity = 0.3 + 0.05 * (trailPositions[i].length / TRAIL_LEN);
      });
    }

    function animate() {
      frameRef.current = requestAnimationFrame(animate);
      const s = stateRef.current;
      stepPhysics(); stepPhysics(); stepPhysics();
      scene.rotation.y = s.rotY;
      scene.rotation.x = s.rotX * 0.3;
      s.rotY += 0.003;
      renderer.render(scene, cam);
    }
    animate();

    return () => {
      cancelAnimationFrame(frameRef.current);
      wrap.removeEventListener('mousedown', onDown);
      window.removeEventListener('mouseup', onUp);
      window.removeEventListener('mousemove', onMove);
      renderer.dispose();
      delete (window as Window & { __tbReset?: () => void }).__tbReset;
    };
  }, []);

  useEffect(() => {
    stateRef.current.massRatio = massRatio / 10;
    stateRef.current.timeStep = speed / 5;
  }, [massRatio, speed]);

  return (
    <div className="relative">
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center z-10">
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 rounded-full bg-steami-orange animate-pulse" />
            <span className="font-mono text-[11px] text-muted-foreground tracking-wider">COMPUTING ORBITS…</span>
          </div>
        </div>
      )}
      <div ref={containerRef} className="w-full rounded-xl overflow-hidden relative cursor-grab active:cursor-grabbing" style={{ boxShadow: '0 4px 24px rgba(0,0,0,0.4)' }}>
        <canvas ref={canvasRef} className="w-full block" style={{ height: 320 }} />
      </div>

      {/* Controls */}
      <div className="mt-4 flex flex-wrap gap-3 items-center">
        <button onClick={() => (window as Window & { __tbReset?: () => void }).__tbReset?.()} className="steami-btn text-[11px]">
          ↺ RESET
        </button>
        <div className="flex items-center gap-2">
          <span className="font-mono text-[11px] text-muted-foreground">MASS RATIO</span>
          <input type="range" min="5" max="30" value={massRatio}
            onChange={e => setMassRatio(Number(e.target.value))}
            className="w-20 accent-[hsl(var(--steami-orange))]" />
          <span className="font-mono text-[11px] text-muted-foreground">{(massRatio / 10).toFixed(1)}×</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="font-mono text-[11px] text-muted-foreground">SPEED</span>
          <input type="range" min="1" max="10" value={speed}
            onChange={e => setSpeed(Number(e.target.value))}
            className="w-20 accent-[hsl(var(--steami-cyan))]" />
          <span className="font-mono text-[11px] text-muted-foreground">{(speed / 5).toFixed(1)}×</span>
        </div>
      </div>

      <p className="mt-3 font-mono text-[11px] text-muted-foreground tracking-wide leading-relaxed">
        ◆ DRAG to rotate the view. Three bodies interact gravitationally with no closed-form solution — trajectories are chaotic. 
        Adjust mass ratio to break symmetry. Even tiny perturbations lead to dramatically different orbital paths.
      </p>
    </div>
  );
}
