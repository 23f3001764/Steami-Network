import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { SteamiLayout } from '@/components/SteamiLayout';
import { ShareMenu } from '@/components/ShareMenu';
import { ScrollNavigator } from '@/components/ScrollNavigator';
import { CardSvgVisual } from '@/components/CardSvgVisual';
import { CardMedia } from '@/components/CardMedia';
import { ArticleMedia } from '@/components/ArticleMedia';
import { ContentBlock } from '@/components/ContentBlock';
import { TextSelectionPopover } from '@/components/TextSelectionPopover';
import { KnowledgeGraph } from '@/components/KnowledgeGraph';
import { PopupLinkPill } from '@/components/PopupLinkPill';
import { staggerContainer, cardVariants, cardTap, fadeInUp, overlayVariants, modalVariants, cardHover } from '@/lib/motion';
import { ArrowLeft, Search, Layers, ChevronLeft, ChevronRight, Play, Pause, X, Lightbulb, Network, BookOpen, Cpu, Zap, ExternalLink, Award, FileText } from 'lucide-react';
import { useThemeStore } from '@/stores/theme-store';
import { AnimatedSection, AnimatedCard } from '@/components/MotionWrappers';
import { api } from '@/lib/api';

const API_BASE = (import.meta.env.VITE_API_BASE_URL as string ?? '').replace(/\/$/, '');

function getImageUrl(path: string | undefined | null): string {
  if (!path) return '';
  if (/^https?:\/\//.test(path)) return path;
  return `${API_BASE}${path.startsWith('/') ? '' : '/'}${path}`;
}

const logPopupEvent = (popup_type: string, popup_id: string | undefined | null, popup_title?: string) => {
  if (!popup_id) return;
  api.dashboard.event({ popup_type, popup_id, popup_title: popup_title ?? '' }).catch(() => {});
};

export default function ExplorePage() {
  const navigate = useNavigate();
  const isLight = useThemeStore((s) => s.theme === 'light');
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeField, setActiveField] = useState('ALL');
  const [search, setSearch] = useState('');

  // ── API state ──
  const [explainers, setExplainers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // ── Modal state ──
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);
  const [slideIdx, setSlideIdx] = useState(0);
  const [autoPlay, setAutoPlay] = useState(true);
  const contentRef = useRef<HTMLDivElement>(null);

  // ── Fetch explainers from API ──
  useEffect(() => {
    setLoading(true);
    setError('');
    api.content.explainers()
      .then((data: any) => {
        const items: any[] = Array.isArray(data) ? data : data?.explainers ?? data?.items ?? [];
        setExplainers([...items].reverse());
      })
      .catch((err: any) => {
        setError(`Failed to load explainers: ${err.message || 'Unknown error'}`);
        setExplainers([]);
      })
      .finally(() => setLoading(false));
  }, []);

  // ── Modal open/close ──
  const openModal = useCallback((idx: number) => {
    setSelectedIdx(idx);
    setSlideIdx(0);
    setAutoPlay(true);
    const item = explainers[idx];
    if (item?.id) {
      setSearchParams((prev) => { const p = new URLSearchParams(prev); p.set('open', item.id); return p; }, { replace: false });
      logPopupEvent('explainer', item.id, item.title);
    }
  }, [explainers, setSearchParams]);

  const closeModal = useCallback(() => {
    setSelectedIdx(null);
    setSlideIdx(0);
    setAutoPlay(true);
    setSearchParams((prev) => {
      const p = new URLSearchParams(prev);
      p.delete('open');
      p.delete('explainer');
      return p;
    }, { replace: true });
  }, [setSearchParams]);

  // ── Deep-link: open modal from URL param ──
  useEffect(() => {
    if (explainers.length === 0) return;
    const openId = searchParams.get('open') ?? searchParams.get('explainer');
    if (!openId) return;
    const idx = explainers.findIndex((e) => e.id === openId);
    if (idx !== -1 && selectedIdx === null) {
      setSelectedIdx(idx);
      setSlideIdx(0);
      setAutoPlay(true);
    }
  }, [searchParams, explainers]);

  // ── Autoplay slides ──
  const selected = selectedIdx !== null ? explainers[selectedIdx] : null;
  useEffect(() => {
    if (!autoPlay || !selected) return;
    const slideCount = (selected.content ?? []).length;
    if (slideCount === 0) return;
    const timer = setInterval(() => setSlideIdx((p) => (p + 1) % slideCount), 6000);
    return () => clearInterval(timer);
  }, [autoPlay, selected]);

  // ── Filtering ──
  const allFields = ['ALL', ...Array.from(new Set(explainers.map((e: any) => e.field)))];

  const filtered = explainers.filter((e: any) => {
    const matchField = activeField === 'ALL' || e.field === activeField;
    const matchSearch =
      !search ||
      e.title?.toLowerCase().includes(search.toLowerCase()) ||
      e.subtitle?.toLowerCase().includes(search.toLowerCase());
    return matchField && matchSearch;
  });

  const grouped = activeField === 'ALL'
    ? Object.entries(
        filtered.reduce<Record<string, any[]>>((acc, e) => {
          (acc[e.field] ??= []).push(e);
          return acc;
        }, {})
      )
    : [[activeField, filtered] as [string, any[]]];

  const badgeClass = (color: string) => `steami-badge steami-badge-${color}`;

  return (
    <SteamiLayout>
      <ScrollNavigator />

      {/* Header */}
      <motion.div className="mb-8" variants={fadeInUp} initial="hidden" animate="visible">
        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-1.5 text-[11px] font-mono tracking-wider uppercase text-muted-foreground hover:text-steami-cyan transition-colors mb-4"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Explainers
        </button>
        <h1 className="steami-heading text-3xl md:text-4xl mb-3">
          <Layers className="w-7 h-7 inline-block mr-2 opacity-60" />
          Explore All Intelligence
        </h1>
        <p className="text-[18px] font-medium text-muted-foreground max-w-xl leading-relaxed">
          Browse the full archive of intelligence explainers across every field.
        </p>
      </motion.div>

      {/* Error */}
      {error && (
        <div className="mb-6 rounded-lg border border-steami-red/20 bg-steami-red/5 p-4 text-[13px] text-steami-red">
          {error}
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="py-20 text-center font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
          Loading explainers...
        </div>
      )}

      {/* Filters */}
      {!loading && (
        <motion.div
          className="flex flex-col sm:flex-row gap-4 mb-8"
          variants={fadeInUp}
          initial="hidden"
          animate="visible"
        >
          {/* Search */}
          <div className="relative w-full sm:flex-1 sm:max-w-md">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-steami-cyan" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search explainers..."
              className="w-full min-h-11 pl-10 pr-4 py-2.5 rounded-lg text-[15px] font-medium text-foreground placeholder:text-muted-foreground/80 outline-none shadow-[0_8px_28px_rgba(0,0,0,0.16)] transition focus:ring-2 focus:ring-steami-cyan/45"
              style={{
                background: isLight ? 'rgba(255,255,255,0.96)' : 'rgba(8, 18, 42, 0.96)',
                border: isLight ? '1px solid rgba(37, 99, 235, 0.42)' : '1px solid rgba(111, 168, 255, 0.38)',
              }}
            />
          </div>

          {/* Field pills */}
          <div className="flex flex-wrap gap-1.5">
            {allFields.map((f) => (
              <button
                key={f}
                onClick={() => setActiveField(f)}
                className={`px-3 py-1.5 rounded-md text-[16px] font-mono tracking-wider uppercase transition-all duration-200 ${
                  activeField === f
                    ? 'text-steami-cyan'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
                style={{
                  background:
                    activeField === f
                      ? (isLight ? 'rgba(59, 130, 246, 0.1)' : 'rgba(99, 179, 237, 0.12)')
                      : (isLight ? 'rgba(255, 255, 255, 0.5)' : 'rgba(255,255,255,0.03)'),
                  border: `1px solid ${
                    activeField === f
                      ? (isLight ? 'rgba(59, 130, 246, 0.3)' : 'rgba(99, 179, 237, 0.25)')
                      : (isLight ? 'rgba(96, 165, 250, 0.2)' : 'rgba(255,255,255,0.06)')
                  }`,
                }}
              >
                {f}
              </button>
            ))}
          </div>
        </motion.div>
      )}

      {/* Grouped content */}
      {!loading && grouped.map(([field, items]) => (
        <AnimatedSection key={field} className="mb-10">
          <div className="steami-section-label mb-4">
            ◆ {field} <span className="text-muted-foreground/50 ml-1">({items.length})</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {items.map((exp: any, idx: number) => {
              const globalIdx = explainers.findIndex((e) => e.id === exp.id);
              return (
                <ExploreCard
                  key={exp.id}
                  exp={exp}
                  idx={idx}
                  isLight={isLight}
                  onClick={() => openModal(globalIdx)}
                />
              );
            })}
          </div>
        </AnimatedSection>
      ))}

      {!loading && filtered.length === 0 && !error && (
        <div className="text-center py-20 text-muted-foreground text-sm font-medium">
          No explainers found matching your criteria.
        </div>
      )}

      {/* ═══════════════════════════════════════════════════
          DUAL-PANEL ARTICLE MODAL (identical to ExplainerPage)
          ═══════════════════════════════════════════════════ */}
      <AnimatePresence>
        {selected && (
          <motion.div
            variants={overlayVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="fixed inset-0 z-[200] flex p-2 sm:p-3 md:p-4"
            style={{ background: isLight ? 'rgba(186,230,253,0.6)' : 'rgba(2,8,18,0.85)', backdropFilter: 'blur(8px)' }}
            onClick={closeModal}
          >
            <motion.div
              variants={modalVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="flex w-full flex-1 max-w-[1200px] mx-auto gap-0 md:gap-4 max-h-[94svh]"
              onClick={(e) => e.stopPropagation()}
            >
              {/* ── LEFT PANEL: Scrollable Content ── */}
              <div
                ref={contentRef}
                className="flex-1 min-w-0 overflow-y-auto rounded-xl md:rounded-r-none md:rounded-l-xl"
                style={{
                  background: isLight ? '#FFFFFF' : '#050E20',
                  backdropFilter: 'none',
                  border: isLight ? '1px solid rgba(147,197,253,0.35)' : '1px solid rgba(255,255,255,0.07)',
                  boxShadow: isLight ? '0 25px 50px -12px rgba(147,197,253,0.3)' : '0 25px 50px -12px rgba(0,0,0,0.6)',
                }}
              >
                <TextSelectionPopover
                  containerRef={contentRef as React.RefObject<HTMLDivElement>}
                  source={selected.title}
                  sourceType="explainer"
                  field={selected.field}
                  sourceId={selected.id}
                />

                {/* Mobile-only hero image */}
                <div className="relative overflow-hidden rounded-t-xl lg:hidden aspect-video">
                  <img
                    src={getImageUrl(selected.image)}
                    alt={selected.title}
                    className="w-full h-full object-contain bg-muted/5 dark:bg-black/20"
                    width={768}
                    height={512}
                  />
                  <div
                    className="absolute inset-0"
                    style={{
                      background: isLight
                        ? 'linear-gradient(180deg, transparent 30%, rgba(255,255,255,0.95) 100%)'
                        : 'linear-gradient(180deg, transparent 30%, rgba(5,14,32,0.95) 100%)',
                    }}
                  />
                </div>

                {/* Sticky header bar */}
                <div
                  className="sticky top-0 z-10 px-4 sm:px-6 py-3 flex flex-wrap items-center justify-between gap-2 border-b border-foreground/5"
                  style={{
                    background: isLight ? 'rgba(255,255,255,0.96)' : 'rgba(5,14,32,0.96)',
                    backdropFilter: 'blur(20px)',
                  }}
                >
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={badgeClass(selected.badgeColor)}>{selected.field}</span>
                    <span className="font-mono text-[11px] text-muted-foreground">{selected.readTime}</span>
                  </div>
                  <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap justify-end">
                    <PopupLinkPill type="explainer" id={selected.id} />
                    <ShareMenu title={selected.title} popupType="explainer" popupId={selected.id} compact />
                    <motion.button
                      whileHover={{ scale: 1.08 }}
                      whileTap={{ scale: 0.92 }}
                      onClick={() => setAutoPlay(!autoPlay)}
                      className="steami-btn py-1.5 px-2.5 text-[11px]"
                    >
                      {autoPlay ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={closeModal}
                      className="w-7 h-7 rounded-md flex items-center justify-center text-muted-foreground hover:text-steami-red transition-colors"
                      style={{
                        border: isLight ? '1px solid rgba(147,197,253,0.3)' : '1px solid rgba(255,255,255,0.1)',
                        background: isLight ? 'rgba(255,255,255,0.6)' : 'rgba(10,25,55,0.4)',
                      }}
                    >
                      <X className="w-4 h-4" />
                    </motion.button>
                  </div>
                </div>

                {/* Article body */}
                <div className="p-4 sm:p-6 md:p-7">
                  {/* Title + meta */}
                  <motion.div
                    className="flex items-start gap-4 mb-2"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.15 }}
                  >
                    <h2 className="steami-heading text-xl sm:text-2xl flex-1 min-w-0">{selected.title}</h2>
                    <CardSvgVisual field={selected.field} variant="modal" className="hidden sm:flex lg:hidden" />
                  </motion.div>
                  {selected.author && (
                    <div className="flex items-center gap-3 mb-5 font-mono text-[11px] text-muted-foreground">
                      <span>{selected.author}</span>
                    </div>
                  )}

                  {/* Key Insights — mobile only (desktop sidebar handles it) */}
                  <motion.div
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="rounded-xl p-5 mb-5 lg:hidden"
                    style={{
                      background: isLight ? 'rgba(224,242,254,0.5)' : 'rgba(6,16,38,0.5)',
                      border: isLight ? '1px solid rgba(147,197,253,0.3)' : '1px solid rgba(99,179,237,0.14)',
                    }}
                  >
                    <div className="font-mono text-[11px] tracking-wider uppercase text-steami-cyan mb-3 flex items-center gap-2">
                      <Lightbulb className="w-3 h-3" /> KEY INSIGHTS
                    </div>
                    {(selected.keyInsights ?? []).map((insight: string, i: number) => (
                      <div key={i} className="flex items-start gap-2 py-1.5 border-b border-steami-cyan/5 last:border-0">
                        <span className="text-steami-cyan text-xs mt-0.5">◆</span>
                        <span className="font-mono text-[11px] text-muted-foreground leading-relaxed">{insight}</span>
                      </div>
                    ))}
                  </motion.div>

                  {/* Slide Progress */}
                  <div className="flex gap-1 mb-6">
                    {(selected.content ?? []).map((_: any, i: number) => (
                      <motion.button
                        key={i}
                        onClick={() => { setSlideIdx(i); setAutoPlay(false); }}
                        className="h-1 flex-1 rounded-full"
                        animate={{
                          background: i === slideIdx
                            ? 'hsl(207 72% 65%)'
                            : i < slideIdx
                            ? 'rgba(99,179,237,0.3)'
                            : isLight ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.08)',
                          scaleY: i === slideIdx ? 1.5 : 1,
                        }}
                        transition={{ duration: 0.3 }}
                        whileHover={{ scaleY: 2, background: 'rgba(99,179,237,0.5)' }}
                      />
                    ))}
                  </div>

                  {/* Active Slide */}
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={slideIdx}
                      initial={{ opacity: 0, x: 30, filter: 'blur(4px)' }}
                      animate={{ opacity: 1, x: 0, filter: 'blur(0px)' }}
                      exit={{ opacity: 0, x: -30, filter: 'blur(4px)' }}
                      transition={{ duration: 0.35, ease: [0.4, 0, 0.2, 1] }}
                    >
                      <div
                        className="text-sm font-medium leading-relaxed text-muted-foreground mb-6 pl-5 border-l-2 border-steami-gold/50"
                        style={{ fontStyle: 'italic', color: isLight ? '#3b6a8a' : '#8aacca' }}
                      >
                        <span className="font-mono text-[11px] text-steami-gold tracking-wider uppercase block mb-2">
                          SLIDE {slideIdx + 1} OF {(selected.content ?? []).length}
                        </span>
                        {(selected.content ?? [])[slideIdx]}
                      </div>
                    </motion.div>
                  </AnimatePresence>

                  {/* Slide nav */}
                  <div className="flex items-center justify-between mb-8">
                    <motion.button
                      whileHover={{ scale: 1.05, x: -2 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => { setSlideIdx(Math.max(0, slideIdx - 1)); setAutoPlay(false); }}
                      className="steami-btn py-2 px-4 text-[11px]"
                      disabled={slideIdx === 0}
                      style={{ opacity: slideIdx === 0 ? 0.3 : 1 }}
                    >
                      <ChevronLeft className="w-3 h-3" /> PREV
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.05, x: 2 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => { setSlideIdx(Math.min((selected.content ?? []).length - 1, slideIdx + 1)); setAutoPlay(false); }}
                      className="steami-btn py-2 px-4 text-[11px]"
                      disabled={slideIdx === (selected.content ?? []).length - 1}
                      style={{ opacity: slideIdx === (selected.content ?? []).length - 1 ? 0.3 : 1 }}
                    >
                      NEXT <ChevronRight className="w-3 h-3" />
                    </motion.button>
                  </div>

                  {/* Divider */}
                  <div className="h-px w-full mb-8" style={{ background: isLight ? 'linear-gradient(90deg, transparent, rgba(147,197,253,0.35), transparent)' : 'linear-gradient(90deg, transparent, rgba(99,179,237,0.15), transparent)' }} />

                  {/* Deep-dive sections */}
                  {selected.context && (
                    <ContentBlock icon={<BookOpen className="w-3.5 h-3.5" />} label="Context & Background" colorClass="text-steami-gold" delay={0.3}>
                      {selected.context}
                    </ContentBlock>
                  )}
                  {selected.technicalDetail && (
                    <ContentBlock icon={<Cpu className="w-3.5 h-3.5" />} label="Technical Detail" colorClass="text-steami-cyan" delay={0.35} variant="inset">
                      {selected.technicalDetail}
                    </ContentBlock>
                  )}
                  {selected.impact && (
                    <ContentBlock icon={<Zap className="w-3.5 h-3.5" />} label="Impact & Implications" colorClass="text-steami-green" delay={0.4}>
                      {selected.impact}
                    </ContentBlock>
                  )}

                  {/* References — mobile only */}
                  <motion.div
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.45 }}
                    className="rounded-xl p-5 mt-8 lg:hidden"
                    style={{
                      background: isLight ? 'rgba(255,255,255,0.5)' : 'rgba(5,14,32,0.5)',
                      border: isLight ? '1px solid rgba(147,197,253,0.35)' : '1px solid rgba(111,168,255,0.14)',
                    }}
                  >
                    <div className="font-mono text-[11px] tracking-wider uppercase text-steami-cyan mb-3 flex items-center gap-2">
                      <FileText className="w-3 h-3" /> REFERENCES / CREDENTIALS
                    </div>
                    {selected.references && selected.references.length > 0 ? (
                      <div className="space-y-4">
                        {selected.references.map((ref: any, i: number) => (
                          <div key={i} className="group/ref">
                            <div className="flex items-start gap-2">
                              {ref.url ? (
                                <a href={ref.url} target="_blank" rel="noopener noreferrer"
                                  className="font-serif text-[15px] font-bold text-foreground leading-tight hover:text-steami-cyan transition-colors flex items-center gap-1.5"
                                >
                                  {ref.title}
                                  <ExternalLink className="w-3 h-3 shrink-0 opacity-40" />
                                </a>
                              ) : (
                                <div className="font-serif text-[15px] font-bold text-foreground leading-tight">{ref.title}</div>
                              )}
                            </div>
                            <div className="flex items-center gap-2 mt-1">
                              {ref.author && <span className="font-mono text-[10px] text-muted-foreground uppercase tracking-tight">{ref.author}</span>}
                              {ref.type && <span className="font-mono text-[9px] px-1.5 py-0.5 rounded border border-steami-cyan/20 text-steami-cyan/70 uppercase">{ref.type}</span>}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="flex flex-col gap-3">
                        <div className="font-serif text-[15px] font-bold text-foreground leading-tight">Primary Research Source</div>
                        <div className="font-mono text-[10px] text-muted-foreground uppercase mt-1">STEAMI EDITORIAL BOARD</div>
                        <div className="flex items-center gap-2 p-2 rounded-lg bg-steami-cyan/5 border border-steami-cyan/10">
                          <Award className="w-4 h-4 text-steami-cyan" />
                          <span className="font-mono text-[10px] text-steami-cyan uppercase tracking-wider">Verified Credential</span>
                        </div>
                      </div>
                    )}
                  </motion.div>
                </div>
              </div>

              {/* ── RIGHT PANEL: Sticky Media + Sidebar (desktop only) ── */}
              <motion.div
                className="w-80 hidden lg:flex flex-col gap-3 overflow-y-auto max-h-[94svh]"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2, duration: 0.4 }}
              >
                {/* Sticky ArticleMedia */}
                <div
                  className="sticky top-0 z-20 pb-3"
                  style={{ background: isLight ? 'rgba(186,230,253,1)' : 'rgba(2,8,18,1)' }}
                >
                  <ArticleMedia
                    src={getImageUrl(selected.image)}
                    alt={selected.title}
                    field={selected.field}
                  />
                </div>

                {/* Key Insights (desktop) */}
                <motion.div
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.25 }}
                  className="rounded-xl p-4"
                  style={{
                    background: isLight ? 'rgba(255,255,255,0.85)' : 'rgba(5,14,32,0.88)',
                    border: isLight ? '1px solid rgba(147,197,253,0.35)' : '1px solid rgba(99,179,237,0.14)',
                  }}
                >
                  <div className="font-mono text-[11px] tracking-wider uppercase text-steami-cyan mb-3 flex items-center gap-2">
                    <Lightbulb className="w-3 h-3" /> KEY INSIGHTS
                  </div>
                  {(selected.keyInsights ?? []).map((insight: string, i: number) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.3 + i * 0.05 }}
                      className="flex items-start gap-2 py-1.5 border-b border-steami-cyan/5 last:border-0"
                    >
                      <span className="text-steami-cyan text-xs mt-0.5">◆</span>
                      <span className="font-mono text-[11px] text-muted-foreground leading-relaxed">{insight}</span>
                    </motion.div>
                  ))}
                </motion.div>

                {/* Knowledge Graph */}
                <div
                  className="rounded-xl p-4"
                  style={{
                    background: isLight ? 'rgba(255,255,255,0.85)' : 'rgba(5,14,32,0.88)',
                    border: isLight ? '1px solid rgba(147,197,253,0.35)' : '1px solid rgba(99,179,237,0.14)',
                  }}
                >
                  <div className="font-mono text-[11px] tracking-wider uppercase text-steami-cyan mb-3 flex items-center gap-2">
                    <Network className="w-3 h-3" /> KNOWLEDGE MAP
                  </div>
                  <KnowledgeGraph
                    centerTopic={selected.title}
                    relatedTopics={(selected.keyInsights ?? []).slice(0, 4)}
                    field={selected.field}
                    compact
                  />
                </div>

                {/* References / Credentials (desktop) */}
                <div
                  className="rounded-xl p-4"
                  style={{
                    background: isLight ? 'rgba(255,255,255,0.85)' : 'rgba(5,14,32,0.88)',
                    border: isLight ? '1px solid rgba(147,197,253,0.35)' : '1px solid rgba(111,168,255,0.14)',
                  }}
                >
                  <div className="font-mono text-[11px] tracking-wider uppercase text-steami-cyan mb-3 flex items-center gap-2">
                    <FileText className="w-3 h-3" /> REFERENCES / CREDENTIALS
                  </div>
                  {selected.references && selected.references.length > 0 ? (
                    <div className="space-y-3">
                      {selected.references.map((ref: any, i: number) => (
                        <div key={i} className="group/ref">
                          <div className="flex items-start gap-2">
                            {ref.url ? (
                              <a href={ref.url} target="_blank" rel="noopener noreferrer"
                                className="font-serif text-[15px] font-bold text-foreground leading-tight hover:text-steami-cyan transition-colors flex items-center gap-1.5"
                              >
                                {ref.title}
                                <ExternalLink className="w-3 h-3 shrink-0 opacity-40 group-hover/ref:opacity-100" />
                              </a>
                            ) : (
                              <div className="font-serif text-[15px] font-bold text-foreground leading-tight">{ref.title}</div>
                            )}
                          </div>
                          <div className="flex items-center gap-2 mt-1">
                            {ref.author && <span className="font-mono text-[10px] text-muted-foreground uppercase tracking-tight">{ref.author}</span>}
                            {ref.type && <span className="font-mono text-[9px] px-1.5 py-0.5 rounded border border-steami-cyan/20 text-steami-cyan/70 uppercase">{ref.type}</span>}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="flex flex-col gap-3">
                      <div className="group/ref">
                        <div className="font-serif text-[15px] font-bold text-foreground leading-tight">Primary Research Source</div>
                        <div className="font-mono text-[10px] text-muted-foreground uppercase mt-1">STEAMI EDITORIAL BOARD</div>
                      </div>
                      <div className="flex items-center gap-2 p-2 rounded-lg bg-steami-cyan/5 border border-steami-cyan/10">
                        <Award className="w-4 h-4 text-steami-cyan" />
                        <span className="font-mono text-[10px] text-steami-cyan uppercase tracking-wider">Verified Credential</span>
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </SteamiLayout>
  );
}

function ExploreCard({
  exp,
  idx,
  isLight,
  onClick,
}: {
  exp: any;
  idx: number;
  isLight: boolean;
  onClick: () => void;
}) {
  const heroImg = getImageUrl(exp.image);

  return (
    <AnimatedCard
      index={idx}
      className="relative p-0 cursor-pointer overflow-hidden group flex flex-col"
      onClick={onClick}
    >
      {/* Top accent bar */}
      <div
        className="h-[2px] w-full"
        style={{
          background: `linear-gradient(90deg, hsl(var(--steami-${exp.badgeColor})) 0%, transparent 100%)`,
        }}
      />

      {/* Image */}
      <CardMedia src={heroImg} alt={exp.title} badgeColor={exp.badgeColor} height={160}>
        <ShareMenu title={exp.title} compact className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity" />
      </CardMedia>

      {/* Glowing Divider */}
      <div
        className="h-px mx-5"
        style={{
          background: isLight
            ? 'linear-gradient(90deg, transparent, rgba(147,197,253,0.5), transparent)'
            : `linear-gradient(90deg, transparent, hsl(var(--steami-${exp.badgeColor}) / 0.25), transparent)`,
        }}
      />

      {/* Content Area */}
      <div className="p-6 pt-4 flex-1 flex flex-col">
        <div className="flex items-center gap-2 mb-3">
          <span className={`steami-badge steami-badge-${exp.badgeColor} text-[16px] inline-block`}>
            {exp.field}
          </span>
        </div>
        <div className="flex items-start gap-3">
          <div className="flex-1">
            <h3 className="font-serif text-[18px] font-extrabold mb-2 leading-snug text-foreground">
              {exp.title}
            </h3>
            <p className="text-[14px] font-medium text-muted-foreground leading-relaxed line-clamp-3 mb-4">
              {exp.subtitle}
            </p>
          </div>
          <CardSvgVisual field={exp.field} variant="mini" className="hidden sm:flex mt-0.5" />
        </div>

        {/* Footer */}
        <div className="mt-auto flex items-center justify-between pt-3 border-t border-foreground/5">
          <span className="text-[11px] font-mono text-muted-foreground/60 tracking-wider">
            {(exp.keyInsights ?? []).length} INSIGHTS · {(exp.content ?? []).length} SLIDES
          </span>
          <span className="text-[11px] font-mono text-steami-cyan tracking-wider uppercase opacity-0 group-hover:opacity-100 transition-opacity">
            Read →
          </span>
        </div>
      </div>
    </AnimatedCard>
  );
}
