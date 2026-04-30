import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { SteamiLayout } from '@/components/SteamiLayout';
import { TextSelectionPopover } from '@/components/TextSelectionPopover';
import { KnowledgeGraph } from '@/components/KnowledgeGraph';
import { CardSvgVisual } from '@/components/CardSvgVisual';
import { CardMedia } from '@/components/CardMedia';
import { ArticleMedia } from '@/components/ArticleMedia';
import { ContentBlock } from '@/components/ContentBlock';
import { ShareMenu } from '@/components/ShareMenu';
import { PopupLinkPill } from '@/components/PopupLinkPill';
import { ScrollNavigator } from '@/components/ScrollNavigator';
import { explainers } from '@/data/explainers';
import { explainerImages } from '@/data/explainer-images';
import { staggerContainer, cardVariants, cardHover, cardTap, overlayVariants, modalVariants, fadeInUp } from '@/lib/motion';
import { ChevronLeft, ChevronRight, Play, Pause, X, Lightbulb, ArrowRight, Network, BookOpen, Cpu, Zap } from 'lucide-react';
import { useThemeStore } from '@/stores/theme-store';
import { api, apiAssetUrl } from '@/lib/api';

const logPopupEvent = (popup_type: string, popup_id: string | undefined | null, popup_title?: string) => {
  if (!popup_id) return;
  api.dashboard.event({ popup_type, popup_id, popup_title: popup_title ?? '' }).catch(() => {});
};

const API_BASE = (import.meta.env.VITE_API_BASE_URL as string ?? '').replace(/\/$/, '');

/** Prepend the backend base URL to an image path returned by the API. */
function getImageUrl(path: string | undefined | null): string {
  if (!path) return '';
  // Already absolute (http/https) — return as-is
  if (/^https?:\/\//.test(path)) return path;
  return `${API_BASE}${path.startsWith('/') ? '' : '/'}${path}`;
}

export default function ExplainerPage() {
  const navigate = useNavigate();
  const isLight = useThemeStore((s) => s.theme === 'light');
  const [searchParams, setSearchParams] = useSearchParams();
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);
  const [slideIdx, setSlideIdx] = useState(0);
  const [autoPlay, setAutoPlay] = useState(true);
  const contentRef = useRef<HTMLDivElement>(null);
  const [backendExplainers, setBackendExplainers] = useState<any[]>([]);
  const [loadingExplainers, setLoadingExplainers] = useState(true);
  const [explainerError, setExplainerError] = useState('');
  const pageExplainers = backendExplainers;

  const [carouselIdx, setCarouselIdx] = useState(0);
  const [carouselPaused, setCarouselPaused] = useState(false);
  const featuredCount = Math.min(pageExplainers.length, 6);

  useEffect(() => {
    setLoadingExplainers(true);
    setExplainerError('');
    api.content.explainers()
      .then((data: any) => {
        const items: any[] = Array.isArray(data) ? data : data?.explainers ?? data?.items ?? [];
        setBackendExplainers([...items].reverse());
      })
      .catch((err: any) => {
        setExplainerError(`Backend explainer API failed: ${err.message || 'Unable to fetch explainers'}`);
        setBackendExplainers([]);
      })
      .finally(() => setLoadingExplainers(false));
  }, []);

  const openModal = useCallback((idx: number) => {
    setSelectedIdx(idx);
    setSlideIdx(0);
    setAutoPlay(true);
    const item = pageExplainers[idx];
    if (item?.id) {
      setSearchParams({ explainer: item.id }, { replace: false });
      logPopupEvent('explainer', item.id, item.title);
    }
  }, [pageExplainers, setSearchParams]);

  const openModalFromLink = useCallback((idx: number) => {
    setSelectedIdx(idx);
    setSlideIdx(0);
    setAutoPlay(true);
  }, []);

  const closeModal = () => {
    setSelectedIdx(null);
    setSlideIdx(0);
    setAutoPlay(true);
    const params = new URLSearchParams(searchParams);
    params.delete('explainer');
    params.delete('open');
    setSearchParams(params, { replace: true });
  };

  useEffect(() => {
    const openId = searchParams.get('explainer') ?? searchParams.get('open');
    if (openId) {
      const idx = pageExplainers.findIndex((e) => e.id === openId);
      if (idx !== -1) {
        if (selectedIdx === null) {
          logPopupEvent('explainer', pageExplainers[idx]?.id, pageExplainers[idx]?.title);
        }
        openModalFromLink(idx);
      }
    }
  }, [searchParams, openModalFromLink, pageExplainers]);

  const selected = selectedIdx !== null ? pageExplainers[selectedIdx] : null;

  useEffect(() => {
    if (!autoPlay || selectedIdx === null || !selected) return;
    const slideCount = (selected.content ?? []).length;
    if (slideCount === 0) return;
    const timer = setInterval(() => {
      setSlideIdx((p) => (p + 1) % slideCount);
    }, 6000);
    return () => clearInterval(timer);
  }, [autoPlay, selectedIdx, selected]);

  useEffect(() => {
    if (carouselPaused) return;
    if (featuredCount === 0) return;
    const timer = setInterval(() => {
      setCarouselIdx((p) => (p + 1) % featuredCount);
    }, 4000);
    return () => clearInterval(timer);
  }, [carouselPaused, featuredCount]);

  // removed old modal functions

  const badgeClass = (color: string) => `steami-badge steami-badge-${color}`;

  return (
    <SteamiLayout>
      <ScrollNavigator />

      <motion.div className="mb-10" variants={fadeInUp} initial="hidden" animate="visible">
        <h1 className="steami-heading text-4xl md:text-5xl mb-4">
          Intelligence Explainers
        </h1>
        <p className="text-[18px] font-medium text-muted-foreground max-w-xl leading-relaxed">
          Interactive deep-dives into breakthrough science & technology. Select text to save to your Research Diary.
        </p>
      </motion.div>

      {explainerError && (
        <div className="mb-6 rounded-lg border border-steami-red/20 bg-steami-red/5 p-4 text-[13px] text-steami-red">
          {explainerError}
        </div>
      )}
      {loadingExplainers && (
        <div className="py-20 text-center font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
          Loading backend explainers...
        </div>
      )}

      {/* ═══════════════════════════════════════════════════
          FEATURED CAROUSEL
          ═══════════════════════════════════════════════════ */}
      <div className="mb-10">
        <div className="steami-section-label mb-5">◆ FEATURED EXPLAINERS</div>
        <div
          className="relative"
          onMouseEnter={() => setCarouselPaused(true)}
          onMouseLeave={() => setCarouselPaused(false)}
        >
          <div className="relative overflow-hidden" style={{ minHeight: 400 }}>
            <AnimatePresence mode="wait">
              <motion.div
                key={carouselIdx}
                initial={{ opacity: 0, x: 80 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -80 }}
                transition={{ duration: 0.45, ease: [0.4, 0, 0.2, 1] }}
                className="w-full"
              >
                {(() => {
                  const exp = pageExplainers[carouselIdx];
                  if (!exp) return null;
                  const heroImg = getImageUrl(exp.image) || explainerImages[exp.id];
                  return (
                    <motion.div
                      whileHover={cardHover}
                      whileTap={cardTap}
                      className="glass-card relative cursor-pointer overflow-hidden"
                      onClick={() => openModal(carouselIdx)}
                    >
                      <motion.div
                        className="absolute top-0 left-0 right-0 h-[2px]"
                        style={{ background: 'hsl(var(--steami-gold))' }}
                        initial={{ scaleX: 0 }}
                        animate={{ scaleX: 1 }}
                        transition={{ duration: 0.5 }}
                      />
                      {/* Hero image via CardMedia (no hover-zoom on featured) */}
                      <div className="relative overflow-hidden" style={{ height: 220 }}>
                        <img
                          src={heroImg}
                          alt={exp.title}
                          className="w-full h-full object-cover"
                          width={768}
                          height={512}
                        />
                         <div
                          className="absolute inset-0"
                          style={{
                            background: isLight
                              ? 'linear-gradient(180deg, transparent 55%, rgba(15,40,80,0.15) 100%)'
                              : 'linear-gradient(180deg, transparent 40%, rgba(2,8,23,0.95) 100%)',
                          }}
                         />
                        <ShareMenu title={exp.title} popupType="explainer" popupId={exp.id} compact className="absolute top-4 right-5 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                      <div className="px-8 pb-8 pt-4">
                        <div className="flex items-center gap-2 mb-3">
                          <span className={`${badgeClass(exp.badgeColor)} text-[16px]`}>{exp.field}</span>
                          <span className="steami-badge steami-badge-gold text-[10px]">FEATURED</span>
                        </div>
                        <div className="flex items-start gap-5">
                          <div className="flex-1">
                            <h3 className="font-serif text-2xl md:text-3xl font-extrabold mb-3 leading-snug text-foreground">{exp.title}</h3>
                            <p className="text-[18px] font-medium text-muted-foreground leading-relaxed mb-6 max-w-2xl">{exp.subtitle}</p>
                          </div>
                          <CardSvgVisual field={exp.field} variant="featured" className="hidden sm:flex mt-1" />
                        </div>
                        <div className="flex items-center justify-end">
                          <span className="font-mono text-[11px] text-steami-cyan tracking-wider uppercase">Click to read →</span>
                        </div>
                      </div>
                    </motion.div>
                  );
                })()}
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Carousel arrows */}
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => { setCarouselIdx((p) => (p - 1 + featuredCount) % featuredCount); setCarouselPaused(true); }}
            className="absolute left-2 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full flex items-center justify-center text-muted-foreground hover:text-steami-cyan transition-colors"
            style={{ background: isLight ? 'rgba(255,255,255,0.8)' : 'rgba(3,8,20,0.85)', border: isLight ? '1px solid rgba(147,197,253,0.4)' : '1px solid rgba(99,179,237,0.2)' }}
          >
            <ChevronLeft className="w-4 h-4" />
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => { setCarouselIdx((p) => (p + 1) % featuredCount); setCarouselPaused(true); }}
            className="absolute right-2 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full flex items-center justify-center text-muted-foreground hover:text-steami-cyan transition-colors"
            style={{ background: isLight ? 'rgba(255,255,255,0.8)' : 'rgba(3,8,20,0.85)', border: isLight ? '1px solid rgba(147,197,253,0.4)' : '1px solid rgba(99,179,237,0.2)' }}
          >
            <ChevronRight className="w-4 h-4" />
          </motion.button>

          <div className="flex justify-center gap-2 mt-4">
            {Array.from({ length: featuredCount }).map((_, i) => (
              <button
                key={i}
                onClick={() => { setCarouselIdx(i); setCarouselPaused(true); }}
                className="w-2 h-2 rounded-full transition-all duration-300"
                style={{
                  background: i === carouselIdx ? 'hsl(var(--steami-cyan))' : 'rgba(99,179,237,0.2)',
                  transform: i === carouselIdx ? 'scale(1.5)' : 'scale(1)',
                }}
              />
            ))}
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════
          PORTRAIT CARD GRID (using CardMedia)
          ═══════════════════════════════════════════════════ */}
      <div className="steami-section-label mb-5">ALL EXPLAINERS</div>
      <motion.div
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
        variants={staggerContainer}
        initial="hidden"
        animate="visible"
      >
        {pageExplainers.map((exp, idx) => {
          const heroImg = getImageUrl(exp.image) || explainerImages[exp.id];
          return (
            <motion.div
              key={exp.id}
              custom={idx}
              variants={cardVariants}
              whileTap={cardTap}
              className="glass-card relative cursor-pointer overflow-hidden group flex flex-col"
              onClick={() => openModal(idx)}
            >
              {/* Accent bar */}
              <div className="h-[2px] w-full" style={{ background: `linear-gradient(90deg, hsl(var(--steami-${exp.badgeColor})) 0%, transparent 100%)` }} />

              {/* Image Window via CardMedia */}
              <CardMedia src={heroImg} alt={exp.title} badgeColor={exp.badgeColor} height={200}>
                <ShareMenu title={exp.title} popupType="explainer" popupId={exp.id} compact className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity" />
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
                  <span className={`${badgeClass(exp.badgeColor)} text-[16px] inline-block`}>{exp.field}</span>
                </div>
                <div className="flex items-start gap-3">
                  <div className="flex-1">
                    <h3 className="font-serif text-[18px] font-extrabold mb-2 leading-snug text-foreground">{exp.title}</h3>
                    <p className="text-[18px] font-medium text-muted-foreground leading-relaxed line-clamp-3 mb-4">{exp.subtitle}</p>
                  </div>
                  <CardSvgVisual field={exp.field} variant="mini" className="hidden sm:flex mt-0.5 shrink-0" />
                </div>
                <div className="mt-auto flex items-center justify-between pt-3 border-t border-foreground/5">
                  <span className="text-[11px] font-mono text-muted-foreground/60 tracking-wider">
                    {(exp.keyInsights ?? []).length} INSIGHTS · {(exp.content ?? []).length} SLIDES
                  </span>
                  <span className="text-[11px] font-mono text-steami-cyan tracking-wider uppercase opacity-0 group-hover:opacity-100 transition-opacity">
                    Read →
                  </span>
                </div>
              </div>
            </motion.div>
          );
        })}
      </motion.div>

      {/* Explore button */}
      <motion.div className="flex justify-center mt-10 mb-4" variants={fadeInUp} initial="hidden" animate="visible">
        <motion.button
          whileHover={{ scale: 1.04, y: -2 }}
          whileTap={{ scale: 0.97 }}
          onClick={() => navigate('/explore')}
          className="steami-btn py-3 px-8 text-[11px] tracking-wider flex items-center gap-2.5 group"
        >
          EXPLORE ALL INTELLIGENCE
          <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
        </motion.button>
      </motion.div>

      {/* ═══════════════════════════════════════════════════
          DUAL-PANEL ARTICLE MODAL
          Left: scrollable content  |  Right: sticky media + sidebar
          ═══════════════════════════════════════════════════ */}
      <AnimatePresence>
        {selected && (
          <motion.div
            variants={overlayVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="fixed inset-0 z-[200] flex p-3 md:p-4"
            style={{ background: isLight ? 'rgba(186,230,253,0.6)' : 'rgba(2,8,18,0.85)', backdropFilter: 'blur(8px)' }}
            onClick={closeModal}
          >
            <motion.div
              variants={modalVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="flex flex-1 max-w-[1200px] mx-auto gap-0 md:gap-4 max-h-[92vh]"
              onClick={(e) => e.stopPropagation()}
            >
              {/* ── LEFT PANEL: Scrollable Content ── */}
              <div
                ref={contentRef}
                className="flex-1 min-w-0 overflow-y-auto rounded-xl md:rounded-r-none md:rounded-l-xl"
                style={{
                  background: isLight ? 'rgba(255,255,255,0.94)' : 'rgba(5,14,32,0.94)',
                  backdropFilter: 'blur(24px) saturate(160%)',
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

                {/* Mobile-only hero image (hidden on lg where right panel shows it) */}
                <div className="relative overflow-hidden rounded-t-xl lg:hidden" style={{ height: 180 }}>
                  <img
                    src={getImageUrl(selected.image) || explainerImages[selected.id]}
                    alt={selected.title}
                    className="w-full h-full object-cover"
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
                  className="sticky top-0 z-10 px-6 py-3 flex items-center justify-between border-b border-foreground/5"
                  style={{
                    background: isLight ? 'rgba(255,255,255,0.96)' : 'rgba(5,14,32,0.96)',
                    backdropFilter: 'blur(20px)',
                  }}
                >
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={badgeClass(selected.badgeColor)}>{selected.field}</span>
                    <span className="font-mono text-[11px] text-muted-foreground">{selected.readTime}</span>
                  </div>
                  <div className="flex items-center gap-2">
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
                <div className="p-6 md:p-7">
                  {/* Title + meta */}
                  <motion.div
                    className="flex items-start gap-4 mb-2"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.15 }}
                  >
                    <h2 className="steami-heading text-2xl flex-1">{selected.title}</h2>
                    <CardSvgVisual field={selected.field} variant="modal" className="hidden sm:flex lg:hidden" />
                  </motion.div>
                  {selected.author && (
                    <div className="flex items-center gap-3 mb-5 font-mono text-[11px] text-muted-foreground">
                      <span>{selected.author}</span>
                    </div>
                  )}

                  {/* Key Insights — inline on mobile, part of right panel on lg */}
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
                    {(selected.keyInsights ?? []).map((insight, i) => (
                      <div key={i} className="flex items-start gap-2 py-1.5 border-b border-steami-cyan/5 last:border-0">
                        <span className="text-steami-cyan text-xs mt-0.5">◆</span>
                        <span className="font-mono text-[11px] text-muted-foreground leading-relaxed">{insight}</span>
                      </div>
                    ))}
                  </motion.div>

                  {/* Slide Progress */}
                  <div className="flex gap-1 mb-6">
                    {(selected.content ?? []).map((_, i) => (
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

                  {/* Deep-dive sections via ContentBlock */}
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
                </div>
              </div>

              {/* ── RIGHT PANEL: Sticky Media + Sidebar (desktop only) ── */}
              <motion.div
                className="w-80 hidden lg:flex flex-col gap-3 overflow-y-auto"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2, duration: 0.4 }}
              >
                {/* Sticky ArticleMedia */}
                <div className="sticky top-0 z-10">
                  <ArticleMedia
                    src={getImageUrl(selected.image) || explainerImages[selected.id]}
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
                  {(selected.keyInsights ?? []).map((insight, i) => (
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

                {/* Related Explainers */}
                <div
                  className="rounded-xl p-4"
                  style={{
                    background: isLight ? 'rgba(255,255,255,0.85)' : 'rgba(5,14,32,0.88)',
                    border: isLight ? '1px solid rgba(163,133,36,0.2)' : '1px solid rgba(232,184,75,0.14)',
                  }}
                >
                  <div className="font-mono text-[11px] tracking-wider uppercase text-steami-gold mb-3 flex items-center gap-2">
                    <BookOpen className="w-3 h-3" /> RELATED EXPLAINERS
                  </div>
                  {pageExplainers
                    .filter((e) => e.id !== selected.id && e.field === selected.field)
                    .slice(0, 3)
                    .map((e) => {
                      const relIdx = pageExplainers.findIndex((x) => x.id === e.id);
                      return (
                        <motion.button
                          key={e.id}
                          whileHover={{ x: 3, backgroundColor: 'rgba(99,179,237,0.08)' }}
                          onClick={() => openModal(relIdx)}
                          className="block w-full text-left p-2 rounded-md mb-1 transition-colors"
                        >
                          <div className="font-serif text-[17px] font-extrabold text-foreground leading-tight">{e.title}</div>
                          <div className="font-mono text-[11px] text-muted-foreground mt-1">{e.readTime}</div>
                        </motion.button>
                      );
                    })}
                  {pageExplainers.filter((e) => e.id !== selected.id && e.field === selected.field).length === 0 &&
                    pageExplainers
                      .filter((e) => e.id !== selected.id)
                      .slice(0, 2)
                      .map((e) => {
                        const relIdx = pageExplainers.findIndex((x) => x.id === e.id);
                        return (
                          <motion.button
                            key={e.id}
                            whileHover={{ x: 3, backgroundColor: 'rgba(99,179,237,0.08)' }}
                            onClick={() => openModal(relIdx)}
                            className="block w-full text-left p-2 rounded-md mb-1 transition-colors"
                          >
                            <div className="font-serif text-[17px] font-extrabold text-foreground leading-tight">{e.title}</div>
                            <div className="font-mono text-[11px] text-muted-foreground mt-1">{e.field} · {e.readTime}</div>
                          </motion.button>
                        );
                      })}
                </div>
              </motion.div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </SteamiLayout>
  );
}