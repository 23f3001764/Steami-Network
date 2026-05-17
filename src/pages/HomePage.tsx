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

import { Suspense, useEffect, useRef, useState, useCallback } from 'react';
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
// Types
// ─────────────────────────────────────────────────────────────────────────────

interface ApiExplainer {
  id:          string;
  title:       string;
  subtitle:    string;
  field:       string;
  badgeColor:  string;
  readTime?:   string;
  image?:      string;
  keyInsights: unknown[];
  content:     unknown[];
  author?:     string;
}

interface ApiExplainersResponse {
  items:  ApiExplainer[];
  total:  number;
  page:   number;
  limit:  number;
  pages:  number;
  fields: string[];
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
// Explorer Section — API-powered
// ─────────────────────────────────────────────────────────────────────────────

const PAGE_SIZE = 8;

function ExplorerSection({ isLight }: { isLight: boolean }) {
  const navigate = useNavigate();

  const [items,       setItems]       = useState<ApiExplainer[]>([]);
  const [fields,      setFields]      = useState<string[]>(['ALL']);
  const [activeField, setActiveField] = useState('ALL');
  const [search,      setSearch]      = useState('');
  const [page,        setPage]        = useState(1);
  const [totalPages,  setTotalPages]  = useState(1);
  const [totalItems,  setTotalItems]  = useState(0);
  const [loading,     setLoading]     = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error,       setError]       = useState<string | null>(null);

  // Debounce search
  const searchTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [debouncedSearch, setDebouncedSearch] = useState('');

  useEffect(() => {
    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    searchTimeout.current = setTimeout(() => setDebouncedSearch(search), 320);
    return () => { if (searchTimeout.current) clearTimeout(searchTimeout.current); };
  }, [search]);

  // Reset to page 1 when filter/search changes
  useEffect(() => {
    setPage(1);
    setItems([]);
  }, [activeField, debouncedSearch]);

  // Fetch from API
  const fetchPage = useCallback(async (pg: number, append: boolean) => {
    append ? setLoadingMore(true) : setLoading(true);
    setError(null);
    try {
      const params: Record<string, string | number> = {
        page:  pg,
        limit: PAGE_SIZE,
      };
      if (activeField !== 'ALL') params.field  = activeField;
      if (debouncedSearch)       params.search = debouncedSearch;

      // Uses the api helper from @/lib/api — adjust the call if your api
      // helper uses a different method signature.
      const data = await api.explainers.list(params) as ApiExplainersResponse;

      setItems(prev => append ? [...prev, ...data.items] : data.items);
      setTotalPages(data.pages   ?? 1);
      setTotalItems(data.total   ?? 0);

      // Build field list from first full fetch
      if (!append && data.fields?.length) {
        setFields(['ALL', ...data.fields]);
      }
    } catch (err: any) {
      setError(err?.message ?? 'Failed to load explainers. Please try again.');
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [activeField, debouncedSearch]);

  useEffect(() => {
    fetchPage(1, false);
  }, [fetchPage]);

  const handleLoadMore = () => {
    const next = page + 1;
    setPage(next);
    fetchPage(next, true);
  };

  const handleCardClick = (id: string) => {
    navigate(`/?open=${id}`);
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
              Explore Intelligence
            </h2>
            <p className="text-[16px] font-medium text-muted-foreground max-w-xl leading-relaxed">
              Browse our live archive of STEM explainers — updated from the backend in real-time.
              {totalItems > 0 && (
                <span className="ml-2 font-mono text-steami-cyan text-[13px]">
                  {totalItems} total
                </span>
              )}
            </p>
          </div>
          <Link
            to="/explore"
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
        {/* Search input */}
        <div className="relative w-full sm:max-w-sm">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-steami-cyan" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search explainers…"
            className="w-full min-h-11 pl-10 pr-4 py-2.5 rounded-lg text-[14px] font-medium text-foreground placeholder:text-muted-foreground/70 outline-none transition focus:ring-2 focus:ring-steami-cyan/40"
            style={{
              background: isLight ? 'rgba(255,255,255,0.96)' : 'rgba(8,18,42,0.96)',
              border: isLight ? '1px solid rgba(37,99,235,0.35)' : '1px solid rgba(111,168,255,0.28)',
              boxShadow: '0 4px 20px rgba(0,0,0,0.12)',
            }}
          />
        </div>

        {/* Field pills */}
        <div className="flex flex-wrap gap-1.5">
          {fields.map((f) => (
            <button
              key={f}
              onClick={() => setActiveField(f)}
              className="px-3 py-1.5 rounded-md text-[13px] font-mono tracking-wider uppercase transition-all duration-200"
              style={{
                background:
                  activeField === f
                    ? (isLight ? 'rgba(59,130,246,0.1)' : 'rgba(99,179,237,0.12)')
                    : (isLight ? 'rgba(255,255,255,0.5)' : 'rgba(255,255,255,0.03)'),
                border: `1px solid ${
                  activeField === f
                    ? (isLight ? 'rgba(59,130,246,0.3)' : 'rgba(99,179,237,0.25)')
                    : (isLight ? 'rgba(96,165,250,0.2)' : 'rgba(255,255,255,0.06)')
                }`,
                color: activeField === f ? 'hsl(var(--steami-cyan))' : 'hsl(var(--muted-foreground))',
              }}
            >
              {f}
            </button>
          ))}
        </div>
      </motion.div>

      {/* Error state */}
      {error && (
        <div className="flex flex-col items-center justify-center py-16 gap-4">
          <p className="font-mono text-[13px] text-red-400">{error}</p>
          <button
            onClick={() => fetchPage(1, false)}
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
            <ExplainerCardSkeleton key={i} isLight={isLight} />
          ))}
        </div>
      )}

      {/* Cards grid */}
      {!loading && !error && (
        <>
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3 text-muted-foreground">
              <BookOpen className="w-10 h-10 opacity-20" />
              <p className="font-mono text-[13px] tracking-wider">No explainers found</p>
            </div>
          ) : (
            <motion.div
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: '-60px' }}
              variants={{
                hidden:  {},
                visible: { transition: { staggerChildren: 0.07 } },
              }}
            >
              {items.map((exp, idx) => (
                <ExplainerCard
                  key={exp.id}
                  exp={exp}
                  idx={idx}
                  isLight={isLight}
                  onClick={() => handleCardClick(exp.id)}
                />
              ))}
            </motion.div>
          )}

          {/* Load More / View All */}
          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            {page < totalPages && (
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
              to="/explore"
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
// Explainer Card
// ─────────────────────────────────────────────────────────────────────────────

function ExplainerCard({
  exp, idx, isLight, onClick,
}: {
  exp: ApiExplainer; idx: number; isLight: boolean; onClick: () => void;
}) {
  const cardVariants = {
    hidden:  { opacity: 0, y: 24 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.45, ease: [0.25, 0.1, 0.25, 1] as [number,number,number,number] } },
  };

  const badgeColor = exp.badgeColor ?? 'cyan';

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
      {/* Top accent bar */}
      <div
        className="h-[2px] w-full shrink-0"
        style={{
          background: `linear-gradient(90deg, hsl(var(--steami-${badgeColor})) 0%, transparent 100%)`,
        }}
      />

      {/* Cover image */}
      {exp.image ? (
        <div className="relative overflow-hidden" style={{ height: 148 }}>
          <img
            src={exp.image}
            alt={exp.title}
            loading="lazy"
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
          <div
            className="absolute inset-0"
            style={{
              background: isLight
                ? 'linear-gradient(to top, rgba(255,255,255,0.4) 0%, transparent 60%)'
                : 'linear-gradient(to top, rgba(8,16,38,0.6) 0%, transparent 60%)',
            }}
          />
        </div>
      ) : (
        <div
          className="flex items-center justify-center"
          style={{
            height: 148,
            background: isLight
              ? `linear-gradient(135deg, rgba(147,197,253,0.12) 0%, rgba(167,139,250,0.08) 100%)`
              : `linear-gradient(135deg, rgba(0,217,255,0.08) 0%, rgba(255,78,240,0.06) 100%)`,
          }}
        >
          <BookOpen className="w-10 h-10 opacity-10" />
        </div>
      )}

      {/* Divider */}
      <div
        className="h-px mx-5"
        style={{
          background: isLight
            ? 'linear-gradient(90deg, transparent, rgba(147,197,253,0.4), transparent)'
            : `linear-gradient(90deg, transparent, hsl(var(--steami-${badgeColor}) / 0.2), transparent)`,
        }}
      />

      {/* Content */}
      <div className="p-5 pt-4 flex-1 flex flex-col">
        <div className="mb-3">
          <span
            className={`steami-badge steami-badge-${badgeColor} text-[11px] inline-block`}
          >
            {exp.field}
          </span>
        </div>

        <h3 className="font-serif text-[16px] font-extrabold mb-1.5 leading-snug text-foreground line-clamp-2">
          {exp.title}
        </h3>
        <p className="text-[13px] font-medium text-muted-foreground leading-relaxed line-clamp-3 mb-4 flex-1">
          {exp.subtitle}
        </p>

        {/* Footer */}
        <div className="flex items-center justify-between pt-3 border-t border-foreground/5 mt-auto">
          <span className="text-[10px] font-mono text-muted-foreground/55 tracking-wider">
            {exp.keyInsights.length} INSIGHTS · {exp.content.length} SLIDES
            {exp.readTime && ` · ${exp.readTime}`}
          </span>
          <span className="text-[10px] font-mono text-steami-cyan tracking-wider uppercase opacity-0 group-hover:opacity-100 transition-opacity">
            Read →
          </span>
        </div>
      </div>
    </motion.div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Skeleton card shown while loading
// ─────────────────────────────────────────────────────────────────────────────

function ExplainerCardSkeleton({ isLight }: { isLight: boolean }) {
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
      <div
        className="w-full"
        style={{
          height: 148,
          background: isLight ? 'rgba(226,232,240,0.8)' : 'rgba(30,41,59,0.6)',
        }}
      />
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

            {/* 6. EXPLORER SECTION — backend API */}
            <ExplorerSection isLight={isLight} />

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
