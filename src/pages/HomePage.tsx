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

// ─────────────────────────────────────────────────────────────────────────────
// Intelligence Archive Section — GET /api/insights
// ─────────────────────────────────────────────────────────────────────────────

const PAGE_SIZE = 8;

function IntelligenceArchiveSection({ isLight }: { isLight: boolean }) {
  const navigate = useNavigate();

  const [items,       setItems]       = useState<ApiInsightItem[]>([]);
  const [allItems,    setAllItems]    = useState<ApiInsightItem[]>([]);
  const [domains,     setDomains]     = useState<string[]>(['ALL']);
  const [activeDomain, setActiveDomain] = useState('ALL');
  const [search,      setSearch]      = useState('');
  const [page,        setPage]        = useState(1);
  const [hasMore,     setHasMore]     = useState(false);
  const [loading,     setLoading]     = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error,       setError]       = useState<string | null>(null);

  const searchTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [debouncedSearch, setDebouncedSearch] = useState('');

  useEffect(() => {
    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    searchTimeout.current = setTimeout(() => setDebouncedSearch(search), 320);
    return () => { if (searchTimeout.current) clearTimeout(searchTimeout.current); };
  }, [search]);

  // Load all insights once, filter client-side (API doesn't support filtering)
  useEffect(() => {
    setLoading(true);
    setError(null);
    api.insights
      .list({ limit: 100 } as any)
      .then((data: any) => {
        const list: ApiInsightItem[] = Array.isArray(data?.insights) ? data.insights
          : Array.isArray(data) ? data : [];
        setAllItems(list);
        // Collect unique domains
        const domainSet = new Set<string>();
        list.forEach((item) => {
          const d = item.ai_insight?.domain || item.topic;
          if (d) domainSet.add(d);
        });
        setDomains(['ALL', ...Array.from(domainSet).sort()]);
      })
      .catch((err: any) => setError(err?.message ?? 'Failed to load insights.'))
      .finally(() => setLoading(false));
  }, []);

  // Filter + paginate client-side
  const filtered = useMemo(() => {
    let list = allItems;
    if (activeDomain !== 'ALL') {
      list = list.filter((item) =>
        item.ai_insight?.domain === activeDomain || item.topic === activeDomain
      );
    }
    if (debouncedSearch.trim()) {
      const q = debouncedSearch.toLowerCase();
      list = list.filter((item) =>
        item.title.toLowerCase().includes(q) ||
        item.source?.toLowerCase().includes(q) ||
        item.ai_insight?.summary?.toLowerCase().includes(q)
      );
    }
    return list;
  }, [allItems, activeDomain, debouncedSearch]);

  useEffect(() => {
    setPage(1);
  }, [activeDomain, debouncedSearch]);

  const displayed = filtered.slice(0, page * PAGE_SIZE);

  const handleLoadMore = () => {
    setLoadingMore(true);
    setTimeout(() => {
      setPage((p) => p + 1);
      setLoadingMore(false);
    }, 200);
  };

  const handleCardClick = (item: ApiInsightItem) => {
    navigate(`/?insight=${item.article_id}`);
  };

  return (
    <section className="relative py-20 px-4 md:px-8 max-w-screen-xl mx-auto">
      {/* Section header */}
      <motion.div
        className="mb-10"
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
      >
        <div className="steami-section-label mb-3">◆ INTELLIGENCE ARCHIVE</div>
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
          <div>
            <h2 className="steami-heading text-3xl md:text-4xl mb-2 flex items-center gap-3">
              <Layers className="w-7 h-7 opacity-60" />
              AI Insights
            </h2>
            <p className="text-[16px] font-medium text-muted-foreground max-w-xl leading-relaxed">
              AI-generated insights from the latest STEM news — updated in real-time.
              {filtered.length > 0 && (
                <span className="ml-2 font-mono text-steami-cyan text-[13px]">
                  {filtered.length} insights
                </span>
              )}
            </p>
          </div>
          <Link
            to="/insights"
            className="hidden sm:flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-widest text-steami-cyan hover:text-steami-cyan/80 transition-colors shrink-0"
          >
            View All <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </motion.div>

      {/* Filters */}
      <motion.div
        className="flex flex-col sm:flex-row gap-4 mb-8"
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5, delay: 0.1 }}
      >
        {/* Search */}
        <div className="relative w-full sm:max-w-sm">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-steami-cyan" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search insights…"
            className="w-full min-h-11 pl-10 pr-4 py-2.5 rounded-lg text-[14px] font-medium text-foreground placeholder:text-muted-foreground/70 outline-none transition focus:ring-2 focus:ring-steami-cyan/40"
            style={{
              background: isLight ? 'rgba(255,255,255,0.96)' : 'rgba(8,18,42,0.96)',
              border: isLight ? '1px solid rgba(37,99,235,0.35)' : '1px solid rgba(111,168,255,0.28)',
              boxShadow: '0 4px 20px rgba(0,0,0,0.12)',
            }}
          />
        </div>

        {/* Domain pills */}
        <div className="flex flex-wrap gap-1.5">
          {domains.map((d) => (
            <button
              key={d}
              onClick={() => setActiveDomain(d)}
              className="px-3 py-1.5 rounded-md text-[13px] font-mono tracking-wider uppercase transition-all duration-200"
              style={{
                background: activeDomain === d
                  ? (isLight ? 'rgba(59,130,246,0.1)' : 'rgba(99,179,237,0.12)')
                  : (isLight ? 'rgba(255,255,255,0.5)' : 'rgba(255,255,255,0.03)'),
                border: `1px solid ${activeDomain === d
                  ? (isLight ? 'rgba(59,130,246,0.3)' : 'rgba(99,179,237,0.25)')
                  : (isLight ? 'rgba(96,165,250,0.2)' : 'rgba(255,255,255,0.06)')}`,
                color: activeDomain === d ? 'hsl(var(--steami-cyan))' : 'hsl(var(--muted-foreground))',
              }}
            >
              {d}
            </button>
          ))}
        </div>
      </motion.div>

      {/* Error */}
      {error && (
        <div className="flex flex-col items-center justify-center py-16 gap-4">
          <p className="font-mono text-[13px] text-red-400">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="font-mono text-[11px] uppercase tracking-wider px-4 py-2 rounded-lg border border-steami-cyan/30 text-steami-cyan hover:bg-steami-cyan/10 transition-colors"
          >
            Retry
          </button>
        </div>
      )}

      {/* Loading skeleton */}
      {loading && !error && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {Array.from({ length: PAGE_SIZE }).map((_, i) => (
            <InsightCardSkeleton key={i} isLight={isLight} />
          ))}
        </div>
      )}

      {/* Cards grid */}
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
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: '-60px' }}
              variants={{
                hidden: {},
                visible: { transition: { staggerChildren: 0.07 } },
              }}
            >
              {displayed.map((item, idx) => (
                <InsightCard
                  key={item.article_id}
                  item={item}
                  idx={idx}
                  isLight={isLight}
                  onClick={() => handleCardClick(item)}
                />
              ))}
            </motion.div>
          )}

          {/* Load More / View All */}
          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            {displayed.length < filtered.length && (
              <button
                onClick={handleLoadMore}
                disabled={loadingMore}
                className="flex items-center gap-2 font-mono text-[12px] uppercase tracking-widest px-6 py-3 rounded-xl transition-all duration-200 disabled:opacity-50"
                style={{
                  border: isLight ? '1px solid rgba(59,130,246,0.35)' : '1px solid rgba(99,179,237,0.22)',
                  background: isLight ? 'rgba(255,255,255,0.7)' : 'rgba(8,18,42,0.6)',
                  color: 'hsl(var(--muted-foreground))',
                }}
              >
                {loadingMore
                  ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Loading…</>
                  : <><ChevronDown className="w-3.5 h-3.5" /> Load More</>
                }
              </button>
            )}
            <Link
              to="/insights"
              className="flex items-center gap-2 font-mono text-[12px] uppercase tracking-widest px-6 py-3 rounded-xl transition-all duration-200"
              style={{
                border: isLight ? '1px solid rgba(0,217,255,0.35)' : '1px solid rgba(0,217,255,0.2)',
                background: isLight ? 'rgba(0,217,255,0.06)' : 'rgba(0,217,255,0.08)',
                color: 'hsl(var(--steami-cyan))',
              }}
            >
              View Full Archive <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
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
    visible: { opacity: 1, y: 0, transition: { duration: 0.45, ease: [0.25, 0.1, 0.25, 1] as [number,number,number,number] } },
  };

  const insight = item.ai_insight;
  const sentKey = insight?.sentiment_label ?? 'neutral_news';
  const sentCfg = SENTIMENT_CONFIG[sentKey] ?? SENTIMENT_CONFIG.neutral_news;
  const domain  = insight?.domain || item.topic || (item.matched_domains?.[0] ?? '');
  const emoji   = insight?.emoji ?? '';

  return (
    <motion.div
      variants={cardVariants}
      whileTap={{ scale: 0.975 }}
      onClick={onClick}
      className="relative cursor-pointer overflow-hidden group flex flex-col rounded-xl transition-shadow duration-300 hover:shadow-[0_8px_40px_rgba(0,0,0,0.25)]"
      style={{
        background: isLight ? 'rgba(255,255,255,0.85)' : 'rgba(8,16,38,0.82)',
        border: isLight ? '1px solid rgba(147,197,253,0.25)' : '1px solid rgba(111,168,255,0.1)',
        backdropFilter: 'blur(12px)',
      }}
    >
      {/* Top accent bar — sentiment colour */}
      <div className="h-[2px] w-full shrink-0" style={{ background: `linear-gradient(90deg, ${sentCfg.dot} 0%, transparent 100%)` }} />

      {/* Emoji hero */}
      <div
        className="flex items-center justify-center"
        style={{
          height: 100,
          background: isLight
            ? 'linear-gradient(135deg, rgba(147,197,253,0.1) 0%, rgba(167,139,250,0.07) 100%)'
            : 'linear-gradient(135deg, rgba(0,217,255,0.07) 0%, rgba(255,78,240,0.05) 100%)',
        }}
      >
        {emoji
          ? <span style={{ fontSize: 44 }} role="img">{emoji}</span>
          : <BookOpen className="w-10 h-10 opacity-10" />
        }
      </div>

      {/* Divider */}
      <div
        className="h-px mx-5"
        style={{
          background: isLight
            ? 'linear-gradient(90deg, transparent, rgba(147,197,253,0.4), transparent)'
            : `linear-gradient(90deg, transparent, ${sentCfg.dot}33, transparent)`,
        }}
      />

      {/* Content */}
      <div className="p-5 pt-4 flex-1 flex flex-col">
        {/* Domain + sentiment badge */}
        <div className="flex items-center gap-2 mb-3 flex-wrap">
          {domain && (
            <span className="steami-badge steami-badge-cyan text-[11px]">{domain}</span>
          )}
          <span
            className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 font-mono text-[9px] font-bold"
            style={{ background: sentCfg.bg, color: sentCfg.text }}
          >
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

        {/* Key points preview */}
        {insight?.key_points && insight.key_points.length > 0 && (
          <ul className="space-y-1 mb-3">
            {insight.key_points.slice(0, 2).map((pt, i) => (
              <li key={i} className="flex items-start gap-1.5 text-[11px] text-muted-foreground">
                <span className="text-steami-cyan mt-0.5 shrink-0">›</span>
                <span className="line-clamp-1">{pt}</span>
              </li>
            ))}
          </ul>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between pt-3 border-t border-foreground/5 mt-auto">
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
          <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
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
    <div
      className="rounded-xl overflow-hidden animate-pulse flex flex-col"
      style={{
        background: isLight ? 'rgba(241,245,249,0.9)' : 'rgba(15,23,42,0.7)',
        border: isLight ? '1px solid rgba(147,197,253,0.15)' : '1px solid rgba(111,168,255,0.07)',
        height: 300,
      }}
    >
      <div className="h-[2px] w-full" style={{ background: isLight ? 'rgba(147,197,253,0.3)' : 'rgba(99,179,237,0.12)' }} />
      <div className="w-full" style={{ height: 100, background: isLight ? 'rgba(226,232,240,0.8)' : 'rgba(30,41,59,0.6)' }} />
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
