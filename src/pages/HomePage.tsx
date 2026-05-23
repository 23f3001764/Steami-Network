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
import { api }                from '@/lib/api';
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
              AI-generated insights from the latest STEM news — updated in real-time.
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

function DashboardPreviewSection({ isLight }: { isLight: boolean }) {
  const navigate    = useNavigate();
  const user        = useAuthStore(s => s.user);
  const isAuthed    = !!user;
  const openAuth    = () => window.dispatchEvent(new CustomEvent('steami:openAuth'));

  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isAuthed) return;
    setLoading(true);
    api.dashboard.me()
      .then((data) => setStats(data as DashboardStats))
      .catch(() => undefined)
      .finally(() => setLoading(false));
  }, [isAuthed]);

  // 7-day heatmap
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    const key = d.toISOString().split('T')[0];
    return { date: key, count: stats?.by_date?.[key] ?? 0, label: d.toLocaleDateString('en', { weekday: 'short' }) };
  });
  const maxDayCount = Math.max(...last7Days.map(d => d.count), 1);

  const byType = stats?.by_type ?? {};
  const typeBreakdown = Object.entries(byType)
    .filter(([, v]) => (v ?? 0) > 0)
    .map(([type, count]) => ({ type, count: count ?? 0 }))
    .sort((a, b) => b.count - a.count);

  const totalNotes = stats?.diary_total ?? 0;
  const fields     = stats ? Object.keys(stats.by_type ?? {}).filter(k => (stats.by_type[k] ?? 0) > 0).length : 0;

  const radarData = [
    { metric: 'Research Depth', value: Math.min(100, totalNotes * 15), fullMark: 100 },
    { metric: 'Field Diversity', value: Math.min(100, fields * 20), fullMark: 100 },
    { metric: 'Engagement',      value: Math.min(100, (stats?.total_events ?? 0) * 5), fullMark: 100 },
    { metric: 'News',            value: Math.min(100, (stats?.by_type?.research_article ?? 0) * 25), fullMark: 100 },
    { metric: 'Explainers',      value: Math.min(100, (stats?.by_type?.explainer ?? 0) * 15), fullMark: 100 },
    { metric: 'Consistency',     value: Math.min(100, Object.keys(stats?.by_date ?? {}).length * 14), fullMark: 100 },
  ];

  const cardBase = {
    background: isLight ? 'rgba(255,255,255,0.72)' : 'rgba(8,16,38,0.72)',
    border: isLight ? '1px solid rgba(37,99,235,0.14)' : '1px solid rgba(0,217,255,0.1)',
    backdropFilter: 'blur(12px)',
  };

  // The three preview cards shown to all users
  const cards = [
    { id: 'activity',    title: '7-DAY ACTIVITY',         icon: Flame,    iconColor: '#e8b84b' },
    { id: 'profile',     title: 'INTELLIGENCE PROFILE',   icon: BarChart3, iconColor: '#00d9ff' },
    { id: 'subject',     title: 'SUBJECT INTELLIGENCE',   icon: Activity,  iconColor: '#22c55e' },
  ];

  const handleCardClick = () => {
    if (isAuthed) navigate('/dashboard');
    else openAuth();
  };

  return (
    <section className="relative py-20 px-4 md:px-8 max-w-screen-xl mx-auto">
      {/* Section header — matches original IntelligenceSystems heading style */}
      <motion.div className="mb-10 text-center"
        initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }} transition={{ duration: 0.6 }}>
        <h2 className="font-serif font-extrabold text-3xl md:text-4xl lg:text-5xl mb-4 leading-tight">
          Real-Time Knowledge<br />
          <span style={{ color: 'hsl(var(--steami-cyan))' }}>Visualization Architecture</span>
        </h2>
        <p className="text-[16px] font-medium text-muted-foreground max-w-2xl mx-auto leading-relaxed mb-4">
          {isAuthed
            ? 'Experience the actual intelligence engines powering the STEAMI Network — your personal data, live.'
            : 'Experience the actual intelligence engines powering the STEAMI Network. No concepts—only authentic research maps and interconnected data structures.'}
        </p>
        {isAuthed && (
          <button
            onClick={() => navigate('/dashboard')}
            className="inline-flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-widest text-steami-cyan hover:text-steami-cyan/80 transition-colors">
            Full Dashboard <ArrowRight className="w-3.5 h-3.5" />
          </button>
        )}
      </motion.div>

      {/* ── Cards grid ── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">

        {/* Card 1: 7-Day Activity */}
        <motion.div
          initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }} transition={{ duration: 0.5, delay: 0 }}
          whileHover={{ y: -4, transition: { duration: 0.2 } }}
          onClick={handleCardClick}
          className="relative rounded-2xl overflow-hidden cursor-pointer group"
          style={cardBase}
        >
          {/* Top accent */}
          <div className="h-[2px] w-full" style={{ background: 'linear-gradient(90deg, #e8b84b 0%, transparent 80%)' }} />

          {/* Preview image area — shown to non-authed */}
          {!isAuthed && (
            <div className="relative flex items-center justify-center" style={{ height: 200, background: isLight ? 'rgba(232,184,75,0.04)' : 'rgba(232,184,75,0.06)' }}>
              {/* Blurred fake chart */}
              <div className="w-full px-5 flex items-end gap-1.5 h-12 opacity-30 blur-[2px]">
                {[30,60,20,50,80,45,90].map((h, i) => (
                  <div key={i} className="flex-1 rounded-sm" style={{ height: `${h}%`, background: `hsl(42 75% 65% / 0.6)` }} />
                ))}
              </div>
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="flex flex-col items-center gap-2">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background: 'rgba(232,184,75,0.12)', border: '1px solid rgba(232,184,75,0.3)' }}>
                    <Lock className="w-4 h-4" style={{ color: '#e8b84b' }} />
                  </div>
                  <p className="font-mono text-[10px] uppercase tracking-widest" style={{ color: '#e8b84b' }}>Sign in to unlock</p>
                </div>
              </div>
            </div>
          )}

          {/* Real chart — authed */}
          {isAuthed && (
            <div className="px-5 py-4" style={{ height: 200 }}>
              {loading ? (
                <div className="flex items-center justify-center h-full">
                  <Loader2 className="w-6 h-6 animate-spin" style={{ color: '#e8b84b', opacity: 0.4 }} />
                </div>
              ) : (
                <div className="flex items-end gap-1.5 h-full">
                  {last7Days.map(({ date, count, label }) => {
                    const intensity = count / maxDayCount;
                    return (
                      <div key={date} className="flex-1 flex flex-col items-center gap-1 h-full justify-end" title={`${date}: ${count}`}>
                        <div className="w-full rounded-sm transition-all"
                          style={{
                            height: `${Math.max(6, intensity * 100)}%`,
                            background: count === 0 ? 'hsl(42 75% 65% / 0.08)' : `hsl(42 75% 65% / ${0.2 + intensity * 0.75})`,
                          }} />
                        <span className="font-mono text-[9px] text-muted-foreground">{label}</span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Card footer */}
          <div className="p-5 pt-2">
            <div className="flex items-center gap-2 mb-1">
              <Flame className="w-3.5 h-3.5" style={{ color: '#e8b84b' }} />
              <span className="font-mono text-[10px] uppercase tracking-widest" style={{ color: '#e8b84b', opacity: 0.8 }}>7-Day Activity</span>
            </div>
            <h3 className="font-serif text-[18px] font-extrabold text-foreground mb-1">
              {isAuthed ? `${stats?.total_events ?? 0} interactions` : 'Intelligence Profile'}
            </h3>
            <p className="text-[13px] text-muted-foreground mb-4">
              {isAuthed
                ? 'Your research engagement over the last week.'
                : 'A dynamic visualization of your unique research footprint, tracking domain evolution and emerging scientific directions.'}
            </p>
            <span className="font-mono text-[11px] uppercase tracking-widest flex items-center gap-1"
              style={{ color: isAuthed ? '#e8b84b' : 'hsl(var(--muted-foreground))' }}>
              {isAuthed ? 'VIEW DASHBOARD' : 'VIEW SYSTEM'} <ArrowRight className="w-3 h-3" />
            </span>
          </div>
        </motion.div>

        {/* Card 2: Intelligence Profile (Radar) */}
        <motion.div
          initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }} transition={{ duration: 0.5, delay: 0.1 }}
          whileHover={{ y: -4, transition: { duration: 0.2 } }}
          onClick={handleCardClick}
          className="relative rounded-2xl overflow-hidden cursor-pointer group"
          style={cardBase}
        >
          <div className="h-[2px] w-full" style={{ background: 'linear-gradient(90deg, #00d9ff 0%, transparent 80%)' }} />

          {!isAuthed && (
            <div className="relative flex items-center justify-center" style={{ height: 200, background: isLight ? 'rgba(0,217,255,0.04)' : 'rgba(0,217,255,0.06)' }}>
              {/* Blurred fake radar */}
              <div className="opacity-20 blur-[3px]" style={{ width: 120, height: 120 }}>
                <svg viewBox="0 0 120 120" xmlns="http://www.w3.org/2000/svg">
                  <polygon points="60,10 110,45 95,100 25,100 10,45" fill="rgba(0,217,255,0.15)" stroke="#00d9ff" strokeWidth="1" />
                  <polygon points="60,25 90,50 80,85 40,85 30,50" fill="rgba(0,217,255,0.2)" stroke="#00d9ff" strokeWidth="1" />
                </svg>
              </div>
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="flex flex-col items-center gap-2">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background: 'rgba(0,217,255,0.12)', border: '1px solid rgba(0,217,255,0.3)' }}>
                    <Lock className="w-4 h-4" style={{ color: '#00d9ff' }} />
                  </div>
                  <p className="font-mono text-[10px] uppercase tracking-widest" style={{ color: '#00d9ff' }}>Sign in to unlock</p>
                </div>
              </div>
            </div>
          )}

          {isAuthed && (
            <div style={{ height: 200 }}>
              {loading ? (
                <div className="flex items-center justify-center h-full">
                  <Loader2 className="w-6 h-6 animate-spin" style={{ color: '#00d9ff', opacity: 0.4 }} />
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart cx="50%" cy="50%" outerRadius="65%" data={radarData}>
                    <PolarGrid stroke={isLight ? 'hsl(210 40% 75% / 0.4)' : 'hsl(207 72% 65% / 0.12)'} strokeWidth={0.5} />
                    <PolarAngleAxis dataKey="metric" tick={{ fill: isLight ? 'hsl(210 30% 30%)' : 'hsl(210 25% 55%)', fontSize: 8, fontFamily: 'var(--font-mono)' }} />
                    <PolarRadiusAxis angle={90} domain={[0, 100]} tick={false} axisLine={false} />
                    <Radar name="Profile" dataKey="value" stroke="hsl(207 72% 65%)" strokeWidth={1.5} fill="hsl(207 72% 65%)" fillOpacity={isLight ? 0.1 : 0.15}
                      dot={{ r: 2.5, fill: 'hsl(207 72% 65%)', stroke: 'hsl(207 72% 85%)', strokeWidth: 1 }} />
                    <Tooltip content={({ active, payload }) => {
                      if (!active || !payload?.length) return null;
                      const d = payload[0].payload;
                      return (
                        <div className="rounded-lg px-3 py-2" style={{ background: isLight ? 'white' : '#0d1a2e', border: '1px solid rgba(0,217,255,0.2)' }}>
                          <p className="font-mono text-[10px] text-muted-foreground uppercase">{d.metric}</p>
                          <p className="font-mono text-sm font-extrabold text-foreground">{d.value}%</p>
                        </div>
                      );
                    }} />
                  </RadarChart>
                </ResponsiveContainer>
              )}
            </div>
          )}

          <div className="p-5 pt-2">
            <div className="flex items-center gap-2 mb-1">
              <BarChart3 className="w-3.5 h-3.5" style={{ color: '#00d9ff' }} />
              <span className="font-mono text-[10px] uppercase tracking-widest" style={{ color: '#00d9ff', opacity: 0.8 }}>Intelligence Profile</span>
            </div>
            <h3 className="font-serif text-[18px] font-extrabold text-foreground mb-1">
              {isAuthed && stats ? `${stats.total_events} events analysed` : 'Subject Intelligence'}
            </h3>
            <p className="text-[13px] text-muted-foreground mb-4">
              {isAuthed
                ? 'Your research profile across six intelligence dimensions.'
                : 'Deep exploration of subject relationships and hidden patterns across disparate scientific silos through cluster-based analysis.'}
            </p>
            <span className="font-mono text-[11px] uppercase tracking-widest flex items-center gap-1"
              style={{ color: isAuthed ? '#00d9ff' : 'hsl(var(--muted-foreground))' }}>
              {isAuthed ? 'VIEW DASHBOARD' : 'VIEW SYSTEM'} <ArrowRight className="w-3 h-3" />
            </span>
          </div>
        </motion.div>

        {/* Card 3: By Content Type / Subject Intelligence */}
        <motion.div
          initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }} transition={{ duration: 0.5, delay: 0.2 }}
          whileHover={{ y: -4, transition: { duration: 0.2 } }}
          onClick={handleCardClick}
          className="relative rounded-2xl overflow-hidden cursor-pointer group"
          style={cardBase}
        >
          <div className="h-[2px] w-full" style={{ background: 'linear-gradient(90deg, #22c55e 0%, transparent 80%)' }} />

          {!isAuthed && (
            <div className="relative flex items-center justify-center" style={{ height: 200, background: isLight ? 'rgba(34,197,94,0.04)' : 'rgba(34,197,94,0.06)' }}>
              {/* Blurred fake bars */}
              <div className="w-full px-6 space-y-2.5 opacity-20 blur-[2px]">
                {[['Simulation', 80], ['AI Insight', 70], ['Explainer', 35], ['Research', 25]].map(([label, w]) => (
                  <div key={label as string} className="flex items-center gap-3">
                    <div className="w-16 h-4 rounded-sm" style={{ background: 'rgba(34,197,94,0.3)' }} />
                    <div className="flex-1 h-1.5 rounded-full" style={{ background: `rgba(34,197,94,0.5)`, width: `${w}%` }} />
                  </div>
                ))}
              </div>
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="flex flex-col items-center gap-2">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background: 'rgba(34,197,94,0.12)', border: '1px solid rgba(34,197,94,0.3)' }}>
                    <Lock className="w-4 h-4" style={{ color: '#22c55e' }} />
                  </div>
                  <p className="font-mono text-[10px] uppercase tracking-widest" style={{ color: '#22c55e' }}>Sign in to unlock</p>
                </div>
              </div>
            </div>
          )}

          {isAuthed && (
            <div className="px-5 py-4" style={{ height: 200 }}>
              {loading ? (
                <div className="flex items-center justify-center h-full">
                  <Loader2 className="w-6 h-6 animate-spin" style={{ color: '#22c55e', opacity: 0.4 }} />
                </div>
              ) : typeBreakdown.length === 0 ? (
                <div className="flex items-center justify-center h-full">
                  <p className="font-mono text-[12px] text-muted-foreground">No activity yet.</p>
                </div>
              ) : (
                <div className="space-y-3 pt-2">
                  {typeBreakdown.map(({ type, count }) => {
                    const pct = Math.round((count / (stats?.total_events || 1)) * 100);
                    const color = TYPE_BADGE_COLORS[type] ?? '#00d9ff';
                    return (
                      <div key={type} className="flex items-center gap-3">
                        <span className="font-mono text-[9px] uppercase tracking-wider px-2 py-0.5 rounded shrink-0 w-20 text-center"
                          style={{ background: `${color}18`, color, border: `1px solid ${color}33` }}>
                          {TYPE_LABELS_HOME[type] ?? type}
                        </span>
                        <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: `${color}10` }}>
                          <motion.div className="h-full rounded-full"
                            style={{ background: `${color}99` }}
                            initial={{ width: 0 }}
                            animate={{ width: `${pct}%` }}
                            transition={{ duration: 0.8, ease: 'easeOut' }} />
                        </div>
                        <span className="font-mono text-[11px] text-muted-foreground w-6 text-right shrink-0">{count}</span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          <div className="p-5 pt-2">
            <div className="flex items-center gap-2 mb-1">
              <Activity className="w-3.5 h-3.5" style={{ color: '#22c55e' }} />
              <span className="font-mono text-[10px] uppercase tracking-widest" style={{ color: '#22c55e', opacity: 0.8 }}>By Content Type</span>
            </div>
            <h3 className="font-serif text-[18px] font-extrabold text-foreground mb-1">
              {isAuthed ? 'Content Breakdown' : 'Knowledge Map'}
            </h3>
            <p className="text-[13px] text-muted-foreground mb-4">
              {isAuthed
                ? 'How your engagement is distributed across simulations, insights, explainers, and research.'
                : 'The global architecture of scientific knowledge, visualized as an interconnected web of multi-layered intelligence structures.'}
            </p>
            <span className="font-mono text-[11px] uppercase tracking-widest flex items-center gap-1"
              style={{ color: isAuthed ? '#22c55e' : 'hsl(var(--muted-foreground))' }}>
              {isAuthed ? 'VIEW DASHBOARD' : 'VIEW SYSTEM'} <ArrowRight className="w-3 h-3" />
            </span>
          </div>
        </motion.div>
      </div>

      {/* Auth CTA bar — only for non-authed users */}
      {!isAuthed && (
        <motion.div
          initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }} transition={{ duration: 0.5, delay: 0.3 }}
          className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-4 px-6 py-4 rounded-2xl"
          style={{
            background: isLight ? 'rgba(0,217,255,0.04)' : 'rgba(0,217,255,0.04)',
            border: isLight ? '1px solid rgba(0,217,255,0.15)' : '1px solid rgba(0,217,255,0.12)',
          }}>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
              style={{ background: 'rgba(0,217,255,0.1)', border: '1px solid rgba(0,217,255,0.2)' }}>
              <Brain className="w-4 h-4" style={{ color: '#00d9ff' }} />
            </div>
            <p className="text-[13px] text-muted-foreground">
              Sign in to access your personal research analytics, intelligence profile, and live STEM insights.
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
            Sign In to Unlock
          </button>
        </motion.div>
      )}
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
