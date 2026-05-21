/**
 * HomePage.tsx  (updated)
 * ─────────────────────────────────────────────────────────────────────────────
 * Changes from original:
 *   1. Blackhole 3D section — loads scene.gltf from the local extracted folder
 *      (C:\Users\Sakshi\Downloads\Steami-Frontend\black-hole\source\extracted)
 *      Assumes your Vite/CRA dev-server serves that folder at /black-hole/
 *      i.e. copy or symlink the `extracted` folder to public/black-hole/
 *      Then the gltf path is: /black-hole/scene.gltf
 *
 *   2. Explorer Section — data fetched from GET /api/explainers (backend API)
 *      instead of the local `explainers` data file.
 *      Supports: field filter, search, paginated "Load More", and a
 *      "View All" link to /explore.
 *
 *   3. SteamiNav is kept — it no longer shows HOME in the desktop nav links
 *      (handled in SteamiNav.tsx) but the full nav renders here as before.
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * REQUIRED PACKAGES (already in most Three.js setups):
 *   npm install @react-three/fiber @react-three/drei three
 *
 * PUBLIC FOLDER SETUP:
 *   Copy/symlink  C:\…\extracted\  →  <project>/public/black-hole/
 *   So that /black-hole/scene.gltf, /black-hole/scene.bin,
 *   and /black-hole/textures/* are all reachable.
 */

import { Suspense, useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Canvas, useFrame } from '@react-three/fiber';
import { useGLTF, OrbitControls, Stars, Environment } from '@react-three/drei';
import { Link, useNavigate } from 'react-router-dom';
import * as THREE from 'three';
import { useAuthStore } from '@/stores/auth-store';

import { LandingHero }        from '@/components/landing/LandingHero';
import { EcosystemSection }   from '@/components/home/intelligence-ecosystem/EcosystemSection';
import { IntelligenceSystems } from '@/components/home/intelligence-systems/IntelligenceSystems';
import { FeatureShowcase }    from '@/components/landing/FeatureShowcase';
import { WorkflowSection }    from '@/components/home/workflow/WorkflowSection';
import { BrandSection }       from '@/components/landing/BrandSection';
import { FinalCTA }           from '@/components/landing/FinalCTA';
import { PopupLinkPill }      from '@/components/PopupLinkPill';
import { SteamiNav }          from '@/components/SteamiNav';
import { Footer }             from '@/components/Footer';
import { StarBackground }     from '@/components/StarBackground';
import { SteamiSidePanel }   from '@/components/SteamiSidePanel';
import { NewsPopup }          from '@/components/NewsPopup';
import { IntelligenceTicker } from '@/components/home/intelligence-ticker/IntelligenceTicker';
import { useThemeStore }      from '@/stores/theme-store';
import { api }                from '@/lib/api';
import {
  Search, Layers, ArrowRight, ChevronDown,
  BookOpen, Loader2, Lock, LogIn, RefreshCw,
  Sparkles, Brain, Atom, Network, Zap, Dna, Cpu,
  Microscope, FlaskConical, Orbit, Waves, BrainCircuit, LineChart,
} from 'lucide-react';

// ─────────────────────────────────────────────────────────────────────────────
// Types — matches GET /api/insights response
// ─────────────────────────────────────────────────────────────────────────────

interface AiInsight {
  summary?:          string;
  key_points?:       string[];
  sentiment?:        string;
  sentiment_label?:  'good_news' | 'bad_news' | 'neutral_news';
  emoji?:            string;
  confidence?:       number;
  tags?:             string[];
  domain?:           string;
  reading_time_min?: number;
  article_url?:      string;
}

interface ApiInsightItem {
  id:           string;
  article_id:   string;
  title:        string;
  topic?:       string;
  source?:      string;
  article_url?: string;
  matched_domains?: string[];
  ai_insight?:  AiInsight;
  created_at?:  string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Blackhole 3-D model — loaded from public/black-hole/scene.gltf
// ─────────────────────────────────────────────────────────────────────────────

const BLACKHOLE_GLTF_PATH = '/black-hole/scene.gltf';

function BlackholeModel() {
  const { scene } = useGLTF(BLACKHOLE_GLTF_PATH);
  const ref        = useRef<THREE.Group>(null!);

  // Slow rotation + gentle bob
  useFrame(({ clock }) => {
    if (!ref.current) return;
    ref.current.rotation.y  = clock.getElapsedTime() * 0.12;
    ref.current.position.y  = Math.sin(clock.getElapsedTime() * 0.4) * 0.08;
  });

  return (
    <primitive
      ref={ref}
      object={scene}
      scale={1.8}
      position={[0, 0, 0]}
    />
  );
}

// Pre-load so it streams in before the canvas mounts
useGLTF.preload(BLACKHOLE_GLTF_PATH);

function BlackholeFallback() {
  return (
    <div className="flex items-center justify-center w-full h-full">
      <Loader2 className="w-8 h-8 animate-spin text-steami-cyan opacity-40" />
    </div>
  );
}

// The full Three.js canvas section
function BlackholeSection({ isLight }: { isLight: boolean }) {
  return (
    <section className="relative w-full" style={{ height: '520px' }}>
      {/* Gradient fade top */}
      <div
        className="absolute inset-x-0 top-0 h-24 z-10 pointer-events-none"
        style={{
          background: isLight
            ? 'linear-gradient(to bottom, rgba(255,255,255,1) 0%, transparent 100%)'
            : 'linear-gradient(to bottom, rgba(3,8,20,1) 0%, transparent 100%)',
        }}
      />
      {/* Gradient fade bottom */}
      <div
        className="absolute inset-x-0 bottom-0 h-24 z-10 pointer-events-none"
        style={{
          background: isLight
            ? 'linear-gradient(to top, rgba(255,255,255,1) 0%, transparent 100%)'
            : 'linear-gradient(to top, rgba(3,8,20,1) 0%, transparent 100%)',
        }}
      />

      {/* Label */}
      <div className="absolute top-6 left-1/2 -translate-x-1/2 z-20 text-center">
        <p className="font-mono text-[10px] tracking-[0.3em] uppercase text-steami-cyan/60">
          ◆ Gravitational Singularity
        </p>
      </div>

      {/* Canvas */}
      <Canvas
        camera={{ position: [0, 0, 5], fov: 45 }}
        gl={{ antialias: true, alpha: true }}
        style={{ background: 'transparent' }}
      >
        <ambientLight intensity={0.3} />
        <pointLight position={[4, 4, 4]} intensity={1.2} color="#00d9ff" />
        <pointLight position={[-4, -2, -4]} intensity={0.6} color="#ff4ef0" />

        <Stars
          radius={60}
          depth={30}
          count={1800}
          factor={3}
          saturation={0}
          fade
          speed={0.4}
        />

        <Suspense fallback={null}>
          <BlackholeModel />
          <OrbitControls
            enableZoom={false}
            enablePan={false}
            autoRotate={false}
            maxPolarAngle={Math.PI * 0.75}
            minPolarAngle={Math.PI * 0.25}
            rotateSpeed={0.35}
          />
        </Suspense>
      </Canvas>

      {/* CC attribution (required by the CC-BY-4.0 license in license.txt) */}
      <p className="absolute bottom-2 right-3 z-20 font-mono text-[9px] text-muted-foreground/30">
        "Blackhole" by{' '}
        <a
          href="https://sketchfab.com/rubykamen"
          target="_blank"
          rel="noopener noreferrer"
          className="underline hover:text-muted-foreground/60 transition-colors"
        >
          rubykamen
        </a>{' '}
        — CC-BY-4.0
      </p>
    </section>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Sentiment config
// ─────────────────────────────────────────────────────────────────────────────

const SENTIMENT_CONFIG = {
  good_news:    { label: 'Good News', bg: 'rgba(16,185,129,0.15)', text: '#6ee7b7', dot: '#10b981' },
  bad_news:     { label: 'Bad News',  bg: 'rgba(239,68,68,0.15)',  text: '#fca5a5', dot: '#ef4444' },
  neutral_news: { label: 'Neutral',   bg: 'rgba(99,102,241,0.15)', text: '#a5b4fc', dot: '#6366f1' },
} as const;

// Icon pool for cards
const ICON_POOL_HOME = [Brain, Atom, Network, LineChart, Zap, Dna, Cpu, Microscope, FlaskConical, Orbit, Waves, BrainCircuit];
const getCardIcon = (idx: number) => ICON_POOL_HOME[idx % ICON_POOL_HOME.length];

// ─────────────────────────────────────────────────────────────────────────────
// Auth Gate — shown when user is not logged in
// ─────────────────────────────────────────────────────────────────────────────

function InsightsAuthGate({ isLight }: { isLight: boolean }) {
  // Ghost card previews (blurred behind the gate)
  const ghostCards = [
    { label: 'Quantum Breakthrough in Error Correction', domain: 'PHYSICS',    sent: 'good_news'    as const, emoji: '⚛️' },
    { label: 'CRISPR Expands to New Genetic Targets',    domain: 'BIOLOGY',    sent: 'good_news'    as const, emoji: '🧬' },
    { label: 'Neural Scaling Laws Face New Challenge',   domain: 'AI',         sent: 'neutral_news' as const, emoji: '🤖' },
    { label: 'Battery Energy Density Record Broken',     domain: 'ENERGY',     sent: 'good_news'    as const, emoji: '⚡' },
  ];

  return (
    <div className="relative">
      {/* Blurred ghost cards */}
      <div
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 select-none pointer-events-none"
        style={{ filter: 'blur(4px)', opacity: 0.35 }}
      >
        {ghostCards.map((g, i) => {
          const cfg = SENTIMENT_CONFIG[g.sent];
          return (
            <div key={i} className="flex flex-col rounded-xl overflow-hidden"
              style={{
                background: isLight ? 'rgba(255,255,255,0.85)' : 'rgba(8,16,38,0.82)',
                border: isLight ? '1px solid rgba(147,197,253,0.25)' : `1px solid ${cfg.dot}22`,
              }}>
              <div className="h-[2px]" style={{ background: `linear-gradient(90deg, ${cfg.dot} 0%, transparent 100%)` }} />
              <div className="flex items-center justify-center py-6"
                style={{ background: cfg.bg, height: 90 }}>
                <span style={{ fontSize: 36 }}>{g.emoji}</span>
              </div>
              <div className="p-4 flex flex-col gap-2">
                <span className="font-mono text-[9px] tracking-widest uppercase px-2 py-0.5 rounded-full w-fit"
                  style={{ background: `${cfg.dot}18`, color: cfg.text }}>{g.domain}</span>
                <div className="h-4 rounded" style={{ background: isLight ? 'rgba(226,232,240,0.8)' : 'rgba(30,41,59,0.6)', width: '85%' }} />
                <div className="h-3 rounded" style={{ background: isLight ? 'rgba(226,232,240,0.5)' : 'rgba(30,41,59,0.4)', width: '100%' }} />
                <div className="h-3 rounded" style={{ background: isLight ? 'rgba(226,232,240,0.5)' : 'rgba(30,41,59,0.4)', width: '70%' }} />
              </div>
            </div>
          );
        })}
      </div>

      {/* Frosted lock gate */}
      <div className="absolute inset-0 flex items-center justify-center px-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 12 }}
          whileInView={{ opacity: 1, scale: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.55, ease: [0.25, 0.1, 0.25, 1] }}
          className="flex flex-col items-center gap-5 px-8 py-8 rounded-2xl text-center max-w-md w-full"
          style={{
            background: isLight
              ? 'rgba(255,255,255,0.92)'
              : 'rgba(3,8,20,0.88)',
            border: isLight
              ? '1px solid rgba(37,99,235,0.2)'
              : '1px solid rgba(0,217,255,0.18)',
            backdropFilter: 'blur(24px)',
            boxShadow: isLight
              ? '0 20px 60px rgba(37,99,235,0.08), 0 4px 20px rgba(0,0,0,0.06)'
              : '0 0 80px rgba(0,217,255,0.06), 0 20px 60px rgba(0,0,0,0.5)',
          }}
        >
          {/* Pulsing lock icon */}
          <div className="relative">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center"
              style={{
                background: isLight ? 'rgba(37,99,235,0.08)' : 'rgba(0,217,255,0.08)',
                border: isLight ? '1px solid rgba(37,99,235,0.2)' : '1px solid rgba(0,217,255,0.25)',
              }}>
              <Lock className="w-6 h-6" style={{ color: isLight ? '#2563eb' : '#00d9ff' }} />
            </div>
            <span className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full animate-ping"
              style={{ background: isLight ? '#2563eb' : '#00d9ff', opacity: 0.6 }} />
            <span className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full"
              style={{ background: isLight ? '#2563eb' : '#00d9ff' }} />
          </div>

          {/* Text */}
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.3em] mb-2"
              style={{ color: isLight ? '#2563eb' : '#00d9ff', opacity: 0.7 }}>
              ◆ Live Intelligence Feed
            </p>
            <h3 className="font-serif text-[20px] font-bold mb-2"
              style={{ color: isLight ? '#0f172a' : '#f1f5f9' }}>
              Sign in to unlock AI Insights
            </h3>
            <p className="text-[13px] leading-relaxed"
              style={{ color: isLight ? '#475569' : '#94a3b8' }}>
              Access real-time AI-generated insights from the latest STEM news — curated, analysed and updated continuously.
            </p>
          </div>

          {/* Feature pills */}
          <div className="flex flex-wrap gap-2 justify-center">
            {['AI Summaries', 'Key Points', 'Sentiment Analysis', 'Domain Filters'].map(f => (
              <span key={f}
                className="font-mono text-[10px] tracking-wider px-3 py-1 rounded-full"
                style={{
                  background: isLight ? 'rgba(37,99,235,0.07)' : 'rgba(0,217,255,0.07)',
                  border: isLight ? '1px solid rgba(37,99,235,0.15)' : '1px solid rgba(0,217,255,0.15)',
                  color: isLight ? '#2563eb' : '#00d9ff',
                }}>
                <Sparkles className="w-2.5 h-2.5 inline mr-1 opacity-70" />
                {f}
              </span>
            ))}
          </div>

          {/* CTA buttons */}
          <div className="flex gap-3 w-full">
            <Link to="/login" className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-mono text-[12px] uppercase tracking-widest transition-all duration-200 hover:scale-[1.02] hover:shadow-lg"
              style={{
                background: isLight ? '#2563eb' : 'rgba(0,217,255,0.12)',
                border: isLight ? 'none' : '1px solid rgba(0,217,255,0.35)',
                color: isLight ? '#fff' : '#00d9ff',
                boxShadow: isLight ? '0 4px 20px rgba(37,99,235,0.25)' : '0 0 24px rgba(0,217,255,0.1)',
              }}>
              <LogIn className="w-3.5 h-3.5" />
              Sign In
            </Link>
            <Link to="/signup" className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-mono text-[12px] uppercase tracking-widest transition-all duration-200 hover:opacity-80"
              style={{
                background: isLight ? 'rgba(15,23,42,0.05)' : 'rgba(255,255,255,0.05)',
                border: isLight ? '1px solid rgba(15,23,42,0.12)' : '1px solid rgba(255,255,255,0.1)',
                color: isLight ? '#475569' : 'rgba(255,255,255,0.55)',
              }}>
              Register
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Intelligence Archive Section — GET /api/insights (auth required)
// ─────────────────────────────────────────────────────────────────────────────

const PAGE_SIZE = 8;

function IntelligenceArchiveSection({ isLight }: { isLight: boolean }) {
  const navigate  = useNavigate();
  const user      = useAuthStore(s => s.user);
  const isAuthed  = !!user;

  const [allItems,     setAllItems]     = useState<ApiInsightItem[]>([]);
  const [domains,      setDomains]      = useState<string[]>(['ALL']);
  const [activeDomain, setActiveDomain] = useState('ALL');
  const [search,       setSearch]       = useState('');
  const [page,         setPage]         = useState(1);
  const [loading,      setLoading]      = useState(false);
  const [loadingMore,  setLoadingMore]  = useState(false);
  const [error,        setError]        = useState<string | null>(null);

  const searchTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [debouncedSearch, setDebouncedSearch] = useState('');

  useEffect(() => {
    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    searchTimeout.current = setTimeout(() => setDebouncedSearch(search), 320);
    return () => { if (searchTimeout.current) clearTimeout(searchTimeout.current); };
  }, [search]);

  // Only fetch when authed
  useEffect(() => {
    if (!isAuthed) return;
    setLoading(true);
    setError(null);
    api.insights
      .list()
      .then((data: any) => {
        const list: ApiInsightItem[] = Array.isArray(data?.insights) ? data.insights
          : Array.isArray(data) ? data : [];
        setAllItems(list);
        const domainSet = new Set<string>();
        list.forEach((item) => {
          const d = item.ai_insight?.domain || item.topic;
          if (d) domainSet.add(d);
        });
        setDomains(['ALL', ...Array.from(domainSet).sort()]);
      })
      .catch((err: any) => setError(err?.message ?? 'Failed to load insights.'))
      .finally(() => setLoading(false));
  }, [isAuthed]);

  const filtered = useMemo(() => {
    let list = allItems;
    if (activeDomain !== 'ALL') {
      list = list.filter(item =>
        item.ai_insight?.domain === activeDomain || item.topic === activeDomain
      );
    }
    if (debouncedSearch.trim()) {
      const q = debouncedSearch.toLowerCase();
      list = list.filter(item =>
        item.title.toLowerCase().includes(q) ||
        item.source?.toLowerCase().includes(q) ||
        item.ai_insight?.summary?.toLowerCase().includes(q)
      );
    }
    return list;
  }, [allItems, activeDomain, debouncedSearch]);

  useEffect(() => { setPage(1); }, [activeDomain, debouncedSearch]);

  const displayed = filtered.slice(0, page * PAGE_SIZE);

  const handleLoadMore = () => {
    setLoadingMore(true);
    setTimeout(() => { setPage(p => p + 1); setLoadingMore(false); }, 200);
  };

  return (
    <section className="relative py-20 px-4 md:px-8 max-w-screen-xl mx-auto">
      {/* Section header */}
      <motion.div className="mb-10"
        initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }} transition={{ duration: 0.6 }}>
        <div className="steami-section-label mb-3">◆ LIVE INTELLIGENCE NETWORK</div>
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
          <div>
            <h2 className="steami-heading text-3xl md:text-4xl mb-2 flex items-center gap-3">
              <Layers className="w-7 h-7 opacity-60" />
              Intelligence Feed
            </h2>
            <p className="text-[16px] font-medium text-muted-foreground max-w-xl leading-relaxed">
              {isAuthed
                ? <>AI-generated insights from the latest STEM news — updated in real-time.{filtered.length > 0 && <span className="ml-2 font-mono text-steami-cyan text-[13px]">{filtered.length} insights</span>}</>
                : 'Real-time AI insights from the STEM intelligence network. Sign in to access the full feed.'}
            </p>
          </div>
          {isAuthed && (
            <Link to="/insights"
              className="hidden sm:flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-widest text-steami-cyan hover:text-steami-cyan/80 transition-colors shrink-0">
              View All <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          )}
        </div>
      </motion.div>

      {/* ── NOT AUTHED — show gate ─────────────────────────────────────────── */}
      {!isAuthed && <InsightsAuthGate isLight={isLight} />}

      {/* ── AUTHED — show full feed ────────────────────────────────────────── */}
      {isAuthed && (
        <>
          {/* Filters */}
          <motion.div className="flex flex-col sm:flex-row gap-4 mb-8"
            initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }} transition={{ duration: 0.5, delay: 0.1 }}>
            {/* Search */}
            <div className="relative w-full sm:max-w-sm">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-steami-cyan" />
              <input value={search} onChange={e => setSearch(e.target.value)}
                placeholder="Search insights…"
                className="w-full min-h-11 pl-10 pr-4 py-2.5 rounded-lg text-[14px] font-medium text-foreground placeholder:text-muted-foreground/70 outline-none transition focus:ring-2 focus:ring-steami-cyan/40"
                style={{
                  background: isLight ? 'rgba(255,255,255,0.96)' : 'rgba(8,18,42,0.96)',
                  border: isLight ? '1px solid rgba(37,99,235,0.35)' : '1px solid rgba(111,168,255,0.28)',
                  boxShadow: '0 4px 20px rgba(0,0,0,0.12)',
                }} />
            </div>
            {/* Domain pills */}
            <div className="flex flex-wrap gap-1.5">
              {domains.map(d => (
                <button key={d} onClick={() => setActiveDomain(d)}
                  className="px-3 py-1.5 rounded-md text-[13px] font-mono tracking-wider uppercase transition-all duration-200"
                  style={{
                    background: activeDomain === d
                      ? (isLight ? 'rgba(59,130,246,0.1)' : 'rgba(99,179,237,0.12)')
                      : (isLight ? 'rgba(255,255,255,0.5)' : 'rgba(255,255,255,0.03)'),
                    border: `1px solid ${activeDomain === d
                      ? (isLight ? 'rgba(59,130,246,0.3)' : 'rgba(99,179,237,0.25)')
                      : (isLight ? 'rgba(96,165,250,0.2)' : 'rgba(255,255,255,0.06)')}`,
                    color: activeDomain === d ? 'hsl(var(--steami-cyan))' : 'hsl(var(--muted-foreground))',
                  }}>
                  {d}
                </button>
              ))}
            </div>
          </motion.div>

          {/* Error */}
          {error && (
            <div className="flex flex-col items-center justify-center py-16 gap-4">
              <p className="font-mono text-[13px] text-red-400">{error}</p>
              <button onClick={() => window.location.reload()}
                className="font-mono text-[11px] uppercase tracking-wider px-4 py-2 rounded-lg border border-steami-cyan/30 text-steami-cyan hover:bg-steami-cyan/10 transition-colors">
                Retry
              </button>
            </div>
          )}

          {/* Skeleton */}
          {loading && !error && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {Array.from({ length: PAGE_SIZE }).map((_, i) => (
                <InsightCardSkeleton key={i} isLight={isLight} />
              ))}
            </div>
          )}

          {/* Cards */}
          {!loading && !error && (
            <>
              {displayed.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 gap-3 text-muted-foreground">
                  <BookOpen className="w-10 h-10 opacity-20" />
                  <p className="font-mono text-[13px] tracking-wider">No insights found</p>
                </div>
              ) : (
                <motion.div
                  className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
                  initial="hidden" whileInView="visible"
                  viewport={{ once: true, margin: '-60px' }}
                  variants={{ hidden: {}, visible: { transition: { staggerChildren: 0.07 } } }}>
                  {displayed.map((item, idx) => (
                    <InsightCard key={item.article_id} item={item} idx={idx} isLight={isLight}
                      onClick={() => navigate(`/?insight=${item.article_id}`)} />
                  ))}
                </motion.div>
              )}

              {/* Load More / View All */}
              <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
                {displayed.length < filtered.length && (
                  <button onClick={handleLoadMore} disabled={loadingMore}
                    className="flex items-center gap-2 font-mono text-[12px] uppercase tracking-widest px-6 py-3 rounded-xl transition-all duration-200 disabled:opacity-50"
                    style={{
                      border: isLight ? '1px solid rgba(59,130,246,0.35)' : '1px solid rgba(99,179,237,0.22)',
                      background: isLight ? 'rgba(255,255,255,0.7)' : 'rgba(8,18,42,0.6)',
                      color: 'hsl(var(--muted-foreground))',
                    }}>
                    {loadingMore
                      ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Loading…</>
                      : <><ChevronDown className="w-3.5 h-3.5" /> Load More</>}
                  </button>
                )}
                <Link to="/insights"
                  className="flex items-center gap-2 font-mono text-[12px] uppercase tracking-widest px-6 py-3 rounded-xl transition-all duration-200"
                  style={{
                    border: isLight ? '1px solid rgba(0,217,255,0.35)' : '1px solid rgba(0,217,255,0.2)',
                    background: isLight ? 'rgba(0,217,255,0.06)' : 'rgba(0,217,255,0.08)',
                    color: 'hsl(var(--steami-cyan))',
                  }}>
                  View Full Archive <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </>
          )}
        </>
      )}
    </section>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Insight Card
// ─────────────────────────────────────────────────────────────────────────────

function InsightCard({
  item, idx, isLight, onClick,
}: {
  item: ApiInsightItem; idx: number; isLight: boolean; onClick: () => void;
}) {
  const cardVariants = {
    hidden:  { opacity: 0, y: 24 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.45, ease: [0.25, 0.1, 0.25, 1] as [number, number, number, number] } },
  };

  const insight = item.ai_insight;
  const sentKey = insight?.sentiment_label ?? 'neutral_news';
  const sentCfg = SENTIMENT_CONFIG[sentKey] ?? SENTIMENT_CONFIG.neutral_news;
  const domain  = insight?.domain || item.topic || (item.matched_domains?.[0] ?? '');
  const emoji   = insight?.emoji ?? '';
  const Icon    = getCardIcon(idx);

  return (
    <motion.div
      variants={cardVariants}
      whileHover={{ y: -4 }}
      whileTap={{ scale: 0.975 }}
      onClick={onClick}
      className="relative cursor-pointer overflow-hidden group flex flex-col rounded-2xl transition-all duration-300 hover:shadow-[0_12px_48px_rgba(0,0,0,0.28)]"
      style={{
        background: isLight ? 'rgba(255,255,255,0.88)' : 'rgba(8,16,38,0.84)',
        border: `1px solid ${sentCfg.dot}22`,
        backdropFilter: 'blur(12px)',
      }}>
      {/* Top accent bar */}
      <div className="h-[2px] w-full shrink-0"
        style={{ background: `linear-gradient(90deg, ${sentCfg.dot} 0%, transparent 100%)` }} />

      {/* Hero */}
      <div className="flex items-center justify-center relative overflow-hidden"
        style={{ height: 96, background: sentCfg.bg }}>
        {/* Subtle grid pattern */}
        <div className="absolute inset-0 opacity-[0.06]"
          style={{ backgroundImage: 'radial-gradient(circle, currentColor 1px, transparent 1px)', backgroundSize: '16px 16px', color: sentCfg.dot }} />
        {emoji
          ? <span style={{ fontSize: 40, filter: `drop-shadow(0 0 12px ${sentCfg.dot}66)` }} role="img">{emoji}</span>
          : (
            <div className="w-11 h-11 rounded-xl flex items-center justify-center"
              style={{ background: `${sentCfg.dot}20`, border: `1px solid ${sentCfg.dot}40` }}>
              <Icon className="w-5 h-5" style={{ color: sentCfg.text }} />
            </div>
          )
        }
      </div>

      {/* Divider */}
      <div className="h-px mx-5"
        style={{ background: `linear-gradient(90deg, transparent, ${sentCfg.dot}33, transparent)` }} />

      {/* Content */}
      <div className="p-5 pt-4 flex-1 flex flex-col">
        {/* Domain + sentiment badge */}
        <div className="flex items-center gap-2 mb-3 flex-wrap">
          {domain && (
            <span className="font-mono text-[9px] tracking-widest uppercase px-2 py-0.5 rounded-full"
              style={{ background: `${sentCfg.dot}18`, color: sentCfg.text }}>
              {domain}
            </span>
          )}
          <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 font-mono text-[9px] font-bold"
            style={{ background: sentCfg.bg, color: sentCfg.text }}>
            <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: sentCfg.dot }} />
            {sentCfg.label}
          </span>
        </div>

        <h3 className="font-serif text-[15px] font-extrabold mb-1.5 leading-snug text-foreground line-clamp-2">
          {item.title}
        </h3>

        {insight?.summary && (
          <p className="text-[12px] font-medium text-muted-foreground leading-relaxed line-clamp-3 mb-3 flex-1">
            {insight.summary}
          </p>
        )}

        {/* Key points */}
        {insight?.key_points && insight.key_points.length > 0 && (
          <ul className="space-y-1 mb-3">
            {insight.key_points.slice(0, 2).map((pt, i) => (
              <li key={i} className="flex items-start gap-1.5 text-[11px] text-muted-foreground">
                <span className="shrink-0 mt-0.5" style={{ color: sentCfg.text }}>›</span>
                <span className="line-clamp-1">{pt}</span>
              </li>
            ))}
          </ul>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between pt-3 mt-auto"
          style={{ borderTop: `1px solid ${sentCfg.dot}15` }}>
          <div className="flex items-center gap-2">
            {item.source && (
              <span className="font-mono text-[10px] text-muted-foreground/55 tracking-wider truncate max-w-[90px]">
                {item.source}
              </span>
            )}
            {insight?.reading_time_min && (
              <span className="font-mono text-[10px] text-muted-foreground/40">
                {insight.reading_time_min}m
              </span>
            )}
          </div>
          <div className="flex items-center gap-2" onClick={e => e.stopPropagation()}>
            <PopupLinkPill type="insight" id={item.article_id} title={item.title} />
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Skeleton card shown while loading
// ─────────────────────────────────────────────────────────────────────────────

function InsightCardSkeleton({ isLight }: { isLight: boolean }) {
  return (
    <div className="rounded-2xl overflow-hidden animate-pulse flex flex-col"
      style={{
        background: isLight ? 'rgba(241,245,249,0.9)' : 'rgba(15,23,42,0.7)',
        border: isLight ? '1px solid rgba(147,197,253,0.15)' : '1px solid rgba(111,168,255,0.07)',
        height: 300,
      }}>
      <div className="h-[2px] w-full" style={{ background: isLight ? 'rgba(147,197,253,0.3)' : 'rgba(99,179,237,0.12)' }} />
      <div className="w-full" style={{ height: 96, background: isLight ? 'rgba(226,232,240,0.8)' : 'rgba(30,41,59,0.6)' }} />
      <div className="p-5 flex flex-col gap-3">
        <div className="h-3 w-16 rounded-full" style={{ background: isLight ? 'rgba(147,197,253,0.4)' : 'rgba(99,179,237,0.15)' }} />
        <div className="h-4 w-4/5 rounded" style={{ background: isLight ? 'rgba(226,232,240,0.8)' : 'rgba(30,41,59,0.6)' }} />
        <div className="h-3 w-full rounded" style={{ background: isLight ? 'rgba(226,232,240,0.5)' : 'rgba(30,41,59,0.4)' }} />
        <div className="h-3 w-2/3 rounded" style={{ background: isLight ? 'rgba(226,232,240,0.5)' : 'rgba(30,41,59,0.4)' }} />
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// HomePage
// ─────────────────────────────────────────────────────────────────────────────
// ─────────────────────────────────────────────────────────────────────────────
// HomePage
// ─────────────────────────────────────────────────────────────────────────────

const HomePage = () => {
  const isLight = useThemeStore((s) => s.theme === 'light');

  return (
    <div className="relative min-h-screen transition-colors duration-500 home-page-scope">
      {/* Background Star System */}
      <StarBackground />

      {/* Global Navigation */}
      <SteamiNav />

      {/* Main Content Sections */}
      <main className="relative z-10">
        <AnimatePresence mode="wait">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1 }}
          >
            {/* 1. HERO SECTION */}
            <LandingHero />

            {/* 2. INTELLIGENCE TICKER */}
            <IntelligenceTicker />

            {/* 3. BLACKHOLE 3D ANIMATION */}
            {/* 
              Loads from public/black-hole/scene.gltf
              See setup instructions at the top of this file.
              If you haven't copied the extracted folder yet, this section
              will gracefully fall back to a loading spinner.
            */}
            <Suspense fallback={null}>
              <BlackholeSection isLight={isLight} />
            </Suspense>

            {/* 4. CONTENT ECOSYSTEM SECTION */}
            <EcosystemSection />

            {/* 5. INTELLIGENCE MAPS SECTION */}
            <IntelligenceSystems />

            {/* 6. INTELLIGENCE ARCHIVE — AI Insights API */}
            <IntelligenceArchiveSection isLight={isLight} />

            {/* 7. FEATURE SHOWCASE SECTION */}
            <FeatureShowcase />

            {/* 8. HOW STEAMI WORKS SECTION */}
            <WorkflowSection />

            {/* 9. EMOTIONAL BRAND SECTION */}
            <BrandSection />

            {/* 10. FINAL CTA SECTION */}
            <FinalCTA />
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Global Footer */}
      <Footer />

      {/* Side Panel — News & Feed drawer */}
      <SteamiSidePanel />

      {/* Live News ticker popup */}
      <NewsPopup />

      <style dangerouslySetInnerHTML={{ __html: `
        body { overflow-x: hidden; }
        .steami-heading { font-family: 'VT323', monospace; }
      `}} />
    </div>
  );
};

export default HomePage;
