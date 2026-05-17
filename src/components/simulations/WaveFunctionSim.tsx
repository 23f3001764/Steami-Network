import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';

type WaveMode = 'ripple' | 'standing' | 'interference' | 'gaussian' | 'soliton';

const WAVE_MODES: { id: WaveMode; label: string; desc: string }[] = [
  { id: 'ripple',       label: 'Ripple',        desc: 'Radial wave from centre' },
  { id: 'standing',     label: 'Standing',       desc: 'Superposition of two counter-propagating waves' },
  { id: 'interference', label: 'Interference',   desc: 'Two-source interference pattern' },
  { id: 'gaussian',     label: 'Gaussian Packet', desc: 'Localised quantum wavepacket' },
  { id: 'soliton',      label: 'Soliton',        desc: 'Self-reinforcing solitary wave' },
];

const GRID_W = 70;
const GRID_H = 70;

export function WaveFunctionSim() {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef    = useRef<HTMLCanvasElement>(null);
  const frameRef     = useRef<number>(0);
  const meshRef      = useRef<THREE.Mesh | null>(null);

  const [loading,    setLoading]    = useState(true);
  const [autoMode,   setAutoMode]   = useState(true);
  const [waveMode,   setWaveMode]   = useState<WaveMode>('ripple');
  const [amplitude,  setAmplitude]  = useState(1.0);
  const [frequency,  setFrequency]  = useState(2.0);
  const [speed,      setSpeed]      = useState(1.0);
  const [colorMode,  setColorMode]  = useState<'cyan'|'violet'|'gold'|'rainbow'>('cyan');
  const [wireframe,  setWireframe]  = useState(true);
  const [showPlane,  setShowPlane]  = useState(true);

  const stateRef = useRef({
    autoMode: true, waveMode: 'ripple' as WaveMode,
    amplitude: 1.0, frequency: 2.0, speed: 1.0,
    rotY: 0, rotX: -0.4,
  });

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
    const cam   = new THREE.PerspectiveCamera(50, W/H, 0.01, 1000);
    cam.position.set(0, 5, 9);
    cam.lookAt(0, 0, 0);

    // Stars
    const sp: number[] = [];
    for (let i = 0; i < 600; i++) sp.push((Math.random()-0.5)*60,(Math.random()-0.5)*60,(Math.random()-0.5)*60);
    const starGeo = new THREE.BufferGeometry();
    starGeo.setAttribute('position', new THREE.Float32BufferAttribute(sp, 3));
    scene.add(new THREE.Points(starGeo, new THREE.PointsMaterial({ color: 0x3a5a8a, size: 0.05 })));

    // Base plane
    const planeGeo = new THREE.PlaneGeometry(10, 10);
    const planeMat = new THREE.MeshBasicMaterial({ color: 0x050e20, transparent: true, opacity: 0.4, side: THREE.DoubleSide });
    const plane = new THREE.Mesh(planeGeo, planeMat);
    plane.rotation.x = -Math.PI/2;
    scene.add(plane);

    // Wave mesh
    const waveGeo = new THREE.PlaneGeometry(10, 10, GRID_W, GRID_H);
    const waveMat = new THREE.MeshStandardMaterial({
      color: 0x63b3ed, wireframe: true, transparent: true, opacity: 0.75,
    });
    const waveMesh = new THREE.Mesh(waveGeo, waveMat);
    waveMesh.rotation.x = -Math.PI/2;
    scene.add(waveMesh);
    meshRef.current = waveMesh;

    // Solid shaded underneath
    const solidMat = new THREE.MeshStandardMaterial({
      color: 0x0d2d50, transparent: true, opacity: 0.2, side: THREE.DoubleSide,
    });
    const solidMesh = new THREE.Mesh(waveGeo, solidMat);
    solidMesh.rotation.x = -Math.PI/2;
    solidMesh.position.y = -0.01;
    scene.add(solidMesh);

    scene.add(new THREE.AmbientLight(0x4080c0, 0.8));
    const ptLight = new THREE.PointLight(0x63b3ed, 2, 12);
    ptLight.position.set(0, 4, 0);
    scene.add(ptLight);

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

    function getZ(x: number, y: number, t: number, s: typeof stateRef.current): number {
      const A = s.amplitude;
      const f = s.frequency;
      const r = Math.sqrt(x*x + y*y);
      switch (s.waveMode) {
        case 'ripple':
          return A * Math.sin(r * f - t * 3) * Math.exp(-r * 0.22);
        case 'standing':
          return A * Math.sin(x * f) * Math.cos(t * 3) * Math.exp(-Math.abs(x) * 0.1);
        case 'interference': {
          const d1 = Math.sqrt((x-1.5)*(x-1.5) + y*y);
          const d2 = Math.sqrt((x+1.5)*(x+1.5) + y*y);
          return A * 0.5 * (Math.sin(d1*f - t*3) + Math.sin(d2*f - t*3)) * Math.exp(-r * 0.1);
        }
        case 'gaussian': {
          const sigma = 1.5;
          const k = f;
          const envelope = Math.exp(-(x*x + y*y)/(2*sigma*sigma));
          return A * envelope * Math.cos(k*x - t * 2);
        }
        case 'soliton': {
          const v = 1.5;
          const xc = ((x + 5) % 10) - 5;
          const pos = (xc - v * t * 0.3 + 5) % 10 - 5;
          const sech = 1 / Math.cosh(pos * f * 0.5);
          return A * sech * sech * Math.cos(f * pos - t * 2);
        }
        default: return 0;
      }
    }

    function animate() {
      frameRef.current = requestAnimationFrame(animate);
      const s = stateRef.current;
      const t = performance.now() * 0.001 * s.speed;

      scene.rotation.y = s.rotY;

      // Update wave vertices
      const pos = waveMesh.geometry.attributes.position;
      for (let i = 0; i < pos.count; i++) {
        // PlaneGeometry when rotated: original x→x, y→y, z→height
        const ox = pos.getX(i);
        const oy = pos.getY(i);
        pos.setZ(i, getZ(ox, oy, t, s));
      }
      pos.needsUpdate = true;
      waveMesh.geometry.computeVertexNormals();

      // Light follows peak
      ptLight.position.y = 2 + Math.sin(t) * 1;
      ptLight.intensity   = 1.5 + Math.sin(t * 1.3) * 0.5;

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

  // Sync all state to ref
  useEffect(() => {
    stateRef.current.autoMode  = autoMode;
    stateRef.current.waveMode  = waveMode;
    stateRef.current.amplitude = amplitude;
    stateRef.current.frequency = frequency;
    stateRef.current.speed     = speed;
  }, [autoMode, waveMode, amplitude, frequency, speed]);

  // Apply wireframe / color changes live
  useEffect(() => {
    if (!meshRef.current) return;
    (meshRef.current.material as THREE.MeshStandardMaterial).wireframe = wireframe;
  }, [wireframe]);

  useEffect(() => {
    if (!meshRef.current) return;
    const colors: Record<string, number> = {
      cyan: 0x63b3ed, violet: 0xa78bfa, gold: 0xf5d07a, rainbow: 0x63b3ed,
    };
    (meshRef.current.material as THREE.MeshStandardMaterial).color.setHex(colors[colorMode]);
  }, [colorMode]);

  return (
    <div className="relative space-y-4">
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center z-10 bg-[#03060f]/80 rounded-xl">
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 rounded-full bg-steami-cyan animate-pulse" />
            <span className="font-mono text-[11px] text-muted-foreground tracking-wider">INITIALIZING WAVE FUNCTION…</span>
          </div>
        </div>
      )}

      <div
        ref={containerRef}
        className="w-full rounded-xl overflow-hidden relative cursor-grab active:cursor-grabbing"
        style={{ boxShadow: '0 4px 32px rgba(0,0,0,0.5)' }}
      >
        <canvas ref={canvasRef} className="w-full block" style={{ height: 380 }} />
        <div className="absolute top-3 left-3 font-mono text-[9px] text-white/20 tracking-wider pointer-events-none">
          DRAG · ROTATE
        </div>
        <div className="absolute top-3 right-3 px-2.5 py-1 rounded pointer-events-none"
          style={{ background: 'rgba(3,6,15,0.75)', border: '1px solid rgba(99,179,237,0.2)' }}>
          <span className="font-mono text-[9px] text-steami-cyan">
            {WAVE_MODES.find(m => m.id === waveMode)?.label ?? waveMode}
          </span>
        </div>
        <div className="absolute bottom-3 left-3 flex items-center gap-1.5 px-2 py-1 rounded"
          style={{ background: 'rgba(3,6,15,0.75)', border: '1px solid rgba(99,179,237,0.2)' }}>
          <span className="w-1.5 h-1.5 rounded-full bg-steami-green animate-pulse" />
          <span className="font-mono text-[9px] text-muted-foreground tracking-wider">LIVE</span>
        </div>
      </div>

      {/* Wave type selector */}
      <div className="flex flex-wrap gap-2">
        {WAVE_MODES.map(m => (
          <button
            key={m.id}
            onClick={() => setWaveMode(m.id)}
            className={`steami-btn text-[10px] px-2.5 py-1 ${waveMode === m.id ? 'border-steami-cyan/60 bg-steami-cyan/10 text-steami-cyan' : ''}`}
            title={m.desc}
          >
            {m.label}
          </button>
        ))}
      </div>

      {/* Parameter controls */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="rounded-xl p-4 space-y-3"
          style={{ background: 'rgba(6,16,38,0.6)', border: '1px solid rgba(99,179,237,0.15)' }}>
          <p className="font-mono text-[10px] text-muted-foreground tracking-wider uppercase">Wave Parameters</p>

          <div className="flex items-center gap-2">
            <span className="font-mono text-[10px] text-muted-foreground w-20">Amplitude</span>
            <input type="range" min="0.1" max="3" step="0.05" value={amplitude}
              onChange={e => setAmplitude(+e.target.value)}
              className="flex-1 accent-[hsl(var(--steami-cyan))]" />
            <span className="font-mono text-[10px] text-steami-cyan w-8 text-right">{amplitude.toFixed(2)}</span>
          </div>

          <div className="flex items-center gap-2">
            <span className="font-mono text-[10px] text-muted-foreground w-20">Frequency</span>
            <input type="range" min="0.3" max="6" step="0.1" value={frequency}
              onChange={e => setFrequency(+e.target.value)}
              className="flex-1 accent-[hsl(var(--steami-violet))]" />
            <span className="font-mono text-[10px] text-steami-cyan w-8 text-right">{frequency.toFixed(1)}</span>
          </div>

          <div className="flex items-center gap-2">
            <span className="font-mono text-[10px] text-muted-foreground w-20">Speed</span>
            <input type="range" min="0.1" max="5" step="0.1" value={speed}
              onChange={e => setSpeed(+e.target.value)}
              className="flex-1 accent-[hsl(var(--steami-gold))]" />
            <span className="font-mono text-[10px] text-steami-cyan w-8 text-right">{speed.toFixed(1)}×</span>
          </div>
        </div>

        <div className="rounded-xl p-4 space-y-3"
          style={{ background: 'rgba(6,16,38,0.6)', border: '1px solid rgba(99,179,237,0.15)' }}>
          <p className="font-mono text-[10px] text-muted-foreground tracking-wider uppercase">Appearance</p>

          <div className="flex items-center justify-between">
            <span className="font-mono text-[10px] text-muted-foreground">Wireframe</span>
            <button onClick={() => setWireframe(!wireframe)}
              className={`relative w-9 h-5 rounded-full transition-colors ${wireframe ? 'bg-steami-cyan' : 'bg-white/10'}`}>
              <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all ${wireframe ? 'left-4' : 'left-0.5'}`} />
            </button>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-mono text-[10px] text-muted-foreground">Color</span>
            {(['cyan','violet','gold'] as const).map(c => (
              <button key={c} onClick={() => setColorMode(c)}
                className={`w-5 h-5 rounded-full border-2 transition-all ${colorMode===c ? 'border-white scale-110' : 'border-transparent'}`}
                style={{ background: c==='cyan'?'#63b3ed':c==='violet'?'#a78bfa':'#f5d07a' }} />
            ))}
          </div>
        </div>
      </div>

      <p className="font-mono text-[11px] text-muted-foreground tracking-wide leading-relaxed">
        ◆ The wave function |ψ(x,t)|² gives the probability density of finding a particle at position x.
        Switch between ripple, standing wave, two-source interference, Gaussian wavepacket, and soliton modes.
        DRAG to rotate.
      </p>
    </div>
  );
}
