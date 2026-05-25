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
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, Tooltip } from 'recharts';
import { SubjectRadarChart } from '@/components/SubjectRadarChart';
import { api } from '@/lib/api';

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
import {
  Search, Layers, ArrowRight, ChevronDown,
  BookOpen, Loader2,
  Brain, Atom, Network, Zap, Dna, Cpu,
  Microscope, FlaskConical, Orbit, Waves, BrainCircuit, LineChart,
  Flame, BarChart3, Activity, TrendingUp, Lock,
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
// Inline auth prompt — replaces the full gate card
// ─────────────────────────────────────────────────────────────────────────────

function InsightsAuthGate({ isLight }: { isLight: boolean }) {
  const openAuth = () => window.dispatchEvent(new CustomEvent('steami:openAuth'));

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5 }}
      className="flex flex-col sm:flex-row items-center justify-between gap-4 px-6 py-5 rounded-2xl mb-8"
      style={{
        background: isLight ? 'rgba(37,99,235,0.04)' : 'rgba(0,217,255,0.04)',
        border: isLight ? '1px solid rgba(37,99,235,0.14)' : '1px solid rgba(0,217,255,0.12)',
      }}
    >
      {/* Left: icon + text */}
      <div className="flex items-center gap-4">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
          style={{
            background: isLight ? 'rgba(37,99,235,0.08)' : 'rgba(0,217,255,0.08)',
            border: isLight ? '1px solid rgba(37,99,235,0.18)' : '1px solid rgba(0,217,255,0.18)',
          }}>
          <Brain className="w-4 h-4" style={{ color: isLight ? '#2563eb' : '#00d9ff' }} />
        </div>
        <div>
          <p className="font-mono text-[11px] uppercase tracking-wider mb-0.5"
            style={{ color: isLight ? '#2563eb' : '#00d9ff', opacity: 0.75 }}>
            Live Intelligence Feed — Members Only
          </p>
          <p className="text-[13px]" style={{ color: isLight ? '#475569' : '#94a3b8' }}>
            Sign in to access real-time AI insights: summaries, sentiment analysis, domain filters &amp; more.
          </p>
        </div>
      </div>

      {/* Right: CTA */}
      <button
        onClick={openAuth}
        className="shrink-0 flex items-center gap-2 px-5 py-2.5 rounded-xl font-mono text-[11px] uppercase tracking-widest transition-all duration-200 hover:scale-105"
        style={{
          background: isLight ? '#2563eb' : 'rgba(0,217,255,0.1)',
          border: isLight ? 'none' : '1px solid rgba(0,217,255,0.3)',
          color: isLight ? '#fff' : '#00d9ff',
          boxShadow: isLight ? '0 4px 16px rgba(37,99,235,0.25)' : '0 0 20px rgba(0,217,255,0.08)',
        }}
      >
        Sign In to Unlock
      </button>
    </motion.div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Intelligence Archive Section — GET /api/insights (auth required)
// ─────────────────────────────────────────────────────────────────────────────
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
              Live insights from the latest STEM news — updated in real-time.
              {isAuthed && filtered.length > 0 && (
                <span className="ml-2 font-mono text-steami-cyan text-[13px]">{filtered.length} insights</span>
              )}
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
// Dashboard Preview Section — shown on HomePage
// Logged in: shows real charts from api.dashboard.me(), clicking → /dashboard
// Logged out: clicking any card opens the auth popup
// ─────────────────────────────────────────────────────────────────────────────

interface DashboardStats {
  total_events: number;
  by_type: { explainer?: number; ai_insight?: number; research_article?: number; simulation?: number; [key: string]: number | undefined };
  by_date: Record<string, number>;
  most_opened: Array<{ popup_id: string; popup_title: string; popup_type: string; count: number }>;
  recent: Array<{ id: string; popup_type: string; popup_title: string; opened_at: string }>;
  interests: string[];
  insight_stats: { total_insights: number; articles_with_insight: number; articles_total: number; generating: boolean };
  diary_total: number;
}

const TYPE_BADGE_COLORS: Record<string, string> = {
  simulation:       '#22c55e',
  ai_insight:       '#00d9ff',
  explainer:        '#a78bfa',
  research_article: '#e8b84b',
};

const TYPE_LABELS_HOME: Record<string, string> = {
  explainer: 'Explainer', ai_insight: 'AI Insight', research_article: 'Research', simulation: 'Simulation',
};

// ─────────────────────────────────────────────────────────────────────────────
// Static mock data for the Dashboard Preview (shown to ALL visitors)
// ─────────────────────────────────────────────────────────────────────────────

const MOCK_ACTIVITY = [
  { label: 'Mon', count: 4 },
  { label: 'Tue', count: 9 },
  { label: 'Wed', count: 6 },
  { label: 'Thu', count: 14 },
  { label: 'Fri', count: 11 },
  { label: 'Sat', count: 7 },
  { label: 'Sun', count: 16 },
];
const MOCK_MAX = 16;

const MOCK_RADAR = [
  { metric: 'Research Depth', value: 78 },
  { metric: 'Field Diversity', value: 64 },
  { metric: 'Engagement', value: 91 },
  { metric: 'News', value: 55 },
  { metric: 'Explainers', value: 82 },
  { metric: 'Consistency', value: 70 },
];

const MOCK_BREAKDOWN = [
  { type: 'simulation',       count: 40, color: '#22c55e' },
  { type: 'ai_insight',       count: 36, color: '#00d9ff' },
  { type: 'explainer',        count: 14, color: '#a78bfa' },
  { type: 'research_article', count: 10, color: '#e8b84b' },
];

const MOCK_RECENT = [
  { title: 'CRISPR Breakthrough Targets Rare Mutations',       tag: 'Genomics',      badge: 'AI Insight', color: '#00d9ff' },
  { title: 'Quantum Error Correction Hits New Milestone',      tag: 'Physics',       badge: 'Research',   color: '#e8b84b' },
  { title: 'Dark Matter Detection via Neutrino Oscillations',  tag: 'Astrophysics',  badge: 'Explainer',  color: '#a78bfa' },
  { title: 'mRNA Vaccine Efficacy in Respiratory Viruses',     tag: 'Immunology',    badge: 'AI Insight', color: '#00d9ff' },
];

const MOCK_NEWSLETTER = [
  { time: '08:00 AM', type: 'Live News',    text: '3 new STEM headlines curated for you', color: '#00d9ff' },
  { time: '12:00 PM', type: 'Explainer',    text: 'How gravitational waves reshape cosmology', color: '#a78bfa' },
  { time: '06:00 PM', type: 'Research',     text: 'Top 5 peer-reviewed papers this week', color: '#e8b84b' },
];

function DashboardPreviewSection({ isLight }: { isLight: boolean }) {
  const navigate = useNavigate();
  const openAuth = () => window.dispatchEvent(new CustomEvent('steami:openAuth'));

  const cardBase = {
    background: isLight ? 'rgba(255,255,255,0.72)' : 'rgba(8,16,38,0.72)',
    border: isLight ? '1px solid rgba(37,99,235,0.14)' : '1px solid rgba(0,217,255,0.1)',
    backdropFilter: 'blur(12px)',
  };

  return (
    <section className="relative py-20 px-4 md:px-8 max-w-screen-xl mx-auto">
      {/* Section header */}
      <motion.div className="mb-10 text-center"
        initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }} transition={{ duration: 0.6 }}>
        <div className="steami-section-label mb-3 justify-center flex">◆ YOUR INTELLIGENCE DASHBOARD</div>
        <h2 className="font-serif font-extrabold text-3xl md:text-4xl lg:text-5xl mb-4 leading-tight">
          Real-Time Knowledge<br />
          <span style={{ color: 'hsl(var(--steami-cyan))' }}>Visualization Architecture</span>
        </h2>
        <p className="text-[16px] font-medium text-muted-foreground max-w-2xl mx-auto leading-relaxed mb-2">
          Sign in to unlock your personal intelligence dashboard — track your research, receive daily newsletters, and explore live STEM insights.
        </p>
        <p className="text-[13px] font-mono text-steami-cyan/70 max-w-xl mx-auto">
          ✉ Daily newsletter · 📰 Live news · 🧠 AI explainers · 🔬 New research — delivered every day
        </p>
      </motion.div>

      {/* ── Big Dashboard Preview ── */}
      <motion.div
        initial={{ opacity: 0, y: 32 }} whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }} transition={{ duration: 0.7 }}
        className="relative rounded-3xl overflow-hidden mb-6"
        style={{
          background: isLight ? 'rgba(248,250,255,0.95)' : 'rgba(4,10,28,0.96)',
          border: isLight ? '1px solid rgba(37,99,235,0.18)' : '1px solid rgba(0,217,255,0.12)',
          boxShadow: isLight ? '0 24px 80px rgba(37,99,235,0.10)' : '0 24px 80px rgba(0,0,0,0.5)',
        }}
      >
        {/* Fake browser chrome */}
        <div className="flex items-center gap-2 px-4 py-3 border-b"
          style={{ borderColor: isLight ? 'rgba(37,99,235,0.1)' : 'rgba(0,217,255,0.08)', background: isLight ? 'rgba(241,245,249,0.8)' : 'rgba(3,8,20,0.8)' }}>
          <div className="flex gap-1.5">
            <div className="w-3 h-3 rounded-full" style={{ background: '#ef4444' }} />
            <div className="w-3 h-3 rounded-full" style={{ background: '#f59e0b' }} />
            <div className="w-3 h-3 rounded-full" style={{ background: '#22c55e' }} />
          </div>
          <div className="flex-1 mx-4">
            <div className="rounded-md px-3 py-1 font-mono text-[11px] text-muted-foreground/60 max-w-[240px] mx-auto text-center"
              style={{ background: isLight ? 'rgba(255,255,255,0.7)' : 'rgba(8,18,42,0.7)', border: isLight ? '1px solid rgba(37,99,235,0.12)' : '1px solid rgba(0,217,255,0.1)' }}>
              steami.ai/dashboard
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-5 h-5 rounded flex items-center justify-center" style={{ background: 'rgba(0,217,255,0.08)' }}>
              <TrendingUp className="w-2.5 h-2.5" style={{ color: '#00d9ff' }} />
            </div>
          </div>
        </div>

        {/* Dashboard body */}
        <div className="p-5 md:p-6">
          {/* Top stats bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
            {[
              { label: 'Total Events',    value: '247',  color: '#00d9ff',  icon: Activity },
              { label: 'Insights Read',   value: '89',   color: '#a78bfa',  icon: Brain },
              { label: 'Notes Saved',     value: '34',   color: '#e8b84b',  icon: BookOpen },
              { label: 'Active Days',     value: '18',   color: '#22c55e',  icon: Flame },
            ].map(({ label, value, color, icon: Icon }) => (
              <div key={label} className="rounded-xl p-3"
                style={{ background: isLight ? 'rgba(255,255,255,0.9)' : 'rgba(8,18,42,0.8)', border: `1px solid ${color}18` }}>
                <div className="flex items-center gap-2 mb-1">
                  <Icon className="w-3.5 h-3.5 shrink-0" style={{ color }} />
                  <span className="font-mono text-[9px] uppercase tracking-wider text-muted-foreground">{label}</span>
                </div>
                <p className="font-mono text-[22px] font-extrabold" style={{ color }}>{value}</p>
              </div>
            ))}
          </div>

          {/* Main 3-column grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

            {/* Col 1: 7-Day Activity */}
            <div className="rounded-xl p-4"
              style={{ background: isLight ? 'rgba(255,255,255,0.9)' : 'rgba(8,18,42,0.7)', border: '1px solid rgba(232,184,75,0.15)' }}>
              <div className="flex items-center gap-2 mb-3">
                <Flame className="w-3.5 h-3.5" style={{ color: '#e8b84b' }} />
                <span className="font-mono text-[9px] uppercase tracking-widest" style={{ color: '#e8b84b' }}>7-Day Activity</span>
              </div>
              <div className="flex items-end gap-1.5" style={{ height: 80 }}>
                {MOCK_ACTIVITY.map(({ label, count }) => {
                  const intensity = count / MOCK_MAX;
                  return (
                    <div key={label} className="flex-1 flex flex-col items-center gap-1 h-full justify-end">
                      <div className="w-full rounded-sm"
                        style={{ height: `${Math.max(8, intensity * 100)}%`, background: `hsl(42 75% 65% / ${0.25 + intensity * 0.7})` }} />
                      <span className="font-mono text-[8px] text-muted-foreground">{label}</span>
                    </div>
                  );
                })}
              </div>
              <p className="font-mono text-[11px] text-muted-foreground mt-3">67 interactions this week</p>
            </div>

            {/* Col 2: Intelligence Profile (Radar) */}
            <div className="rounded-xl p-4"
              style={{ background: isLight ? 'rgba(255,255,255,0.9)' : 'rgba(8,18,42,0.7)', border: '1px solid rgba(0,217,255,0.12)' }}>
              <div className="flex items-center gap-2 mb-2">
                <BarChart3 className="w-3.5 h-3.5" style={{ color: '#00d9ff' }} />
                <span className="font-mono text-[9px] uppercase tracking-widest" style={{ color: '#00d9ff' }}>Intelligence Profile</span>
              </div>
              <div style={{ height: 110 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart cx="50%" cy="50%" outerRadius="60%" data={MOCK_RADAR}>
                    <PolarGrid stroke={isLight ? 'rgba(0,217,255,0.2)' : 'rgba(0,217,255,0.1)'} strokeWidth={0.5} />
                    <PolarAngleAxis dataKey="metric" tick={{ fill: isLight ? 'hsl(210 30% 40%)' : 'hsl(210 25% 55%)', fontSize: 7, fontFamily: 'var(--font-mono)' }} />
                    <PolarRadiusAxis angle={90} domain={[0, 100]} tick={false} axisLine={false} />
                    <Radar name="Profile" dataKey="value" stroke="#00d9ff" strokeWidth={1.5} fill="#00d9ff" fillOpacity={0.12}
                      dot={{ r: 2, fill: '#00d9ff', stroke: '#00d9ff', strokeWidth: 1 }} />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
              <p className="font-mono text-[11px] text-muted-foreground mt-1">247 events across 6 dimensions</p>
            </div>

            {/* Col 3: Content Breakdown */}
            <div className="rounded-xl p-4"
              style={{ background: isLight ? 'rgba(255,255,255,0.9)' : 'rgba(8,18,42,0.7)', border: '1px solid rgba(34,197,94,0.12)' }}>
              <div className="flex items-center gap-2 mb-3">
                <Activity className="w-3.5 h-3.5" style={{ color: '#22c55e' }} />
                <span className="font-mono text-[9px] uppercase tracking-widest" style={{ color: '#22c55e' }}>By Content Type</span>
              </div>
              <div className="space-y-2.5">
                {MOCK_BREAKDOWN.map(({ type, count, color }) => {
                  const pct = Math.round((count / 100) * 100);
                  return (
                    <div key={type} className="flex items-center gap-2">
                      <span className="font-mono text-[8px] uppercase tracking-wider px-1.5 py-0.5 rounded shrink-0 w-16 text-center"
                        style={{ background: `${color}18`, color, border: `1px solid ${color}30` }}>
                        {TYPE_LABELS_HOME[type] ?? type}
                      </span>
                      <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: `${color}10` }}>
                        <div className="h-full rounded-full" style={{ width: `${pct}%`, background: `${color}99` }} />
                      </div>
                      <span className="font-mono text-[10px] text-muted-foreground shrink-0 w-4 text-right">{count}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Recent Activity strip */}
          <div className="mt-4 rounded-xl p-4"
            style={{ background: isLight ? 'rgba(255,255,255,0.7)' : 'rgba(8,18,42,0.6)', border: isLight ? '1px solid rgba(37,99,235,0.1)' : '1px solid rgba(0,217,255,0.07)' }}>
            <div className="flex items-center gap-2 mb-3">
              <Zap className="w-3.5 h-3.5" style={{ color: '#e8b84b' }} />
              <span className="font-mono text-[9px] uppercase tracking-widest" style={{ color: '#e8b84b' }}>Recent Insights</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {MOCK_RECENT.map(({ title, tag, badge, color }) => (
                <div key={title} className="flex items-center gap-3 rounded-lg px-3 py-2"
                  style={{ background: isLight ? 'rgba(248,250,252,0.9)' : 'rgba(3,8,20,0.6)', border: `1px solid ${color}12` }}>
                  <div className="shrink-0 w-1.5 h-8 rounded-full" style={{ background: color }} />
                  <div className="flex-1 min-w-0">
                    <p className="font-serif text-[12px] font-bold text-foreground leading-tight line-clamp-1">{title}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="font-mono text-[9px]" style={{ color: `${color}cc` }}>{tag}</span>
                      <span className="font-mono text-[8px] px-1.5 py-0.5 rounded-full"
                        style={{ background: `${color}15`, color }}>{badge}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Gradient overlay — "sign in to see yours" blur effect at bottom */}
        <div className="absolute bottom-0 inset-x-0 h-32 pointer-events-none"
          style={{ background: isLight ? 'linear-gradient(to top, rgba(248,250,255,0.98) 0%, transparent 100%)' : 'linear-gradient(to top, rgba(4,10,28,0.98) 0%, transparent 100%)' }} />
        <div className="absolute bottom-4 left-0 right-0 flex justify-center pointer-events-none">
          <span className="font-mono text-[11px] uppercase tracking-widest px-4 py-1.5 rounded-full"
            style={{ background: 'rgba(0,217,255,0.08)', border: '1px solid rgba(0,217,255,0.2)', color: '#00d9ff' }}>
            ↑ Your dashboard — sign in to see your live data
          </span>
        </div>
      </motion.div>

      {/* Newsletter perks strip */}
      <motion.div
        initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }} transition={{ duration: 0.5, delay: 0.15 }}
        className="rounded-2xl p-5 mb-5"
        style={{
          background: isLight ? 'rgba(0,217,255,0.04)' : 'rgba(0,217,255,0.04)',
          border: isLight ? '1px solid rgba(0,217,255,0.15)' : '1px solid rgba(0,217,255,0.1)',
        }}>
        <div className="flex items-center gap-3 mb-4">
          <div className="w-8 h-8 rounded-xl flex items-center justify-center"
            style={{ background: 'rgba(0,217,255,0.1)', border: '1px solid rgba(0,217,255,0.25)' }}>
            <TrendingUp className="w-4 h-4" style={{ color: '#00d9ff' }} />
          </div>
          <div>
            <p className="font-mono text-[10px] uppercase tracking-widest mb-0.5" style={{ color: '#00d9ff' }}>Daily Newsletter — Members Only</p>
            <p className="text-[13px] font-medium text-muted-foreground">What you get in your inbox every day:</p>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {MOCK_NEWSLETTER.map(({ time, type, text, color }) => (
            <div key={type} className="flex items-start gap-3 rounded-xl p-3"
              style={{ background: isLight ? 'rgba(255,255,255,0.6)' : 'rgba(8,18,42,0.6)', border: `1px solid ${color}15` }}>
              <div className="shrink-0 font-mono text-[9px] pt-0.5" style={{ color: `${color}80` }}>{time}</div>
              <div>
                <p className="font-mono text-[10px] uppercase tracking-wider mb-1" style={{ color }}>{type}</p>
                <p className="text-[12px] text-muted-foreground leading-snug">{text}</p>
              </div>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Sign-in CTA */}
      <motion.div
        initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }} transition={{ duration: 0.5, delay: 0.25 }}
        className="flex flex-col sm:flex-row items-center justify-between gap-4 px-6 py-4 rounded-2xl"
        style={{
          background: isLight ? 'rgba(255,255,255,0.6)' : 'rgba(8,16,38,0.6)',
          border: isLight ? '1px solid rgba(37,99,235,0.18)' : '1px solid rgba(0,217,255,0.14)',
        }}>
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
            style={{ background: 'rgba(0,217,255,0.1)', border: '1px solid rgba(0,217,255,0.2)' }}>
            <Brain className="w-4 h-4" style={{ color: '#00d9ff' }} />
          </div>
          <p className="text-[13px] text-muted-foreground">
            Sign in to see your personal research analytics, get daily newsletters with live news, new explainers, and top research — delivered every day.
          </p>
        </div>
        <button onClick={openAuth}
          className="shrink-0 flex items-center gap-2 px-5 py-2.5 rounded-xl font-mono text-[11px] uppercase tracking-widest transition-all duration-200 hover:scale-105"
          style={{
            background: 'rgba(0,217,255,0.1)',
            border: '1px solid rgba(0,217,255,0.3)',
            color: '#00d9ff',
            boxShadow: '0 0 20px rgba(0,217,255,0.08)',
          }}>
          Sign In to Unlock <ArrowRight className="w-3 h-3" />
        </button>
      </motion.div>
    </section>
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

            {/* 5. DASHBOARD PREVIEW — replaces IntelligenceSystems, live charts for authed / login gate for guests */}
            <DashboardPreviewSection isLight={isLight} />

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