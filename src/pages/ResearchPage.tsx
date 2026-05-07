import { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSearchParams } from 'react-router-dom';
import { SteamiLayout } from '@/components/SteamiLayout';
import { TextSelectionPopover } from '@/components/TextSelectionPopover';
import { KnowledgeGraph } from '@/components/KnowledgeGraph';
import { CardSvgVisual } from '@/components/CardSvgVisual';
import { ArticleMedia } from '@/components/ArticleMedia';
import { ShareMenu } from '@/components/ShareMenu';
import { PopupLinkPill } from '@/components/PopupLinkPill';
import { ScrollNavigator } from '@/components/ScrollNavigator';
import { FIELDS, FIELD_ICONS, FIELD_COLORS, type Article, type Field } from '@/data/research-articles';
import { researchFieldImages } from '@/data/research-images';
import { useSteamiStore } from '@/stores/steami-store';
import { useThemeStore } from '@/stores/theme-store';
import { overlayVariants, modalVariants, fadeInUp, cardTap } from '@/lib/motion';
import { X, ChevronLeft, ChevronRight, Network, FileText, Sparkles, Search, BookOpen } from 'lucide-react';
import { MotionWrapper } from '@/components/MotionWrappers';
import { api, apiAssetUrl } from '@/lib/api';

const logPopupEvent = (popup_type: string, popup_id: string | undefined | null, popup_title?: string) => {
  if (!popup_id) return;
  api.dashboard.event({ popup_type, popup_id, popup_title: popup_title ?? '' }).catch(() => {});
};

const API_BASE = (import.meta.env.VITE_API_BASE_URL as string ?? '').replace(/\/$/, '');

/** Prepend the backend base URL to an image path returned by the API. */
function getImageUrl(path: string | undefined | null): string {
  if (!path) return '';
  if (/^https?:\/\//.test(path)) return path;
  return `${API_BASE}${path.startsWith('/') ? '' : '/'}${path}`;
}

export default function ResearchPage() {
  const isLight = useThemeStore((s) => s.theme === 'light');
  const [selectedArticle, setSelectedArticle] = useState<Article | null>(null);
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeField, setActiveField] = useState<string>('ALL');
  const [search, setSearch] = useState('');
  const [backendArticles, setBackendArticles] = useState<Article[]>([]);
  const [loadingResearch, setLoadingResearch] = useState(true);
  const [researchError, setResearchError] = useState('');
  const contentRef = useRef<HTMLDivElement>(null);
  const diary = useSteamiStore((s) => s.diary);
  const recommendations = useSteamiStore((s) => s.recommendations);

  const openArticle = (article: Article) => {
    setSelectedArticle(article);
    setSearchParams({ research: article.id }, { replace: false });
    logPopupEvent('research_article', article.id, article.title);
  };

  const openArticleFromLink = (article: Article) => {
    setSelectedArticle(article);
  };

  const closeArticle = () => {
    setSelectedArticle(null);
    const params = new URLSearchParams(searchParams);
    params.delete('research');
    params.delete('open');
    setSearchParams(params, { replace: true });
  };

  useEffect(() => {
    setLoadingResearch(true);
    setResearchError('');
    api.content.researchArticles()
      .then((data: any) => {
        const items: Article[] = Array.isArray(data) ? data : data?.articles ?? data?.items ?? [];
        setBackendArticles([...items].reverse());
      })
      .catch((err: any) => {
        setResearchError(`Backend research API failed: ${err.message || 'Unable to fetch research articles'}`);
        setBackendArticles([]);
      })
      .finally(() => setLoadingResearch(false));
  }, []);

  const pageArticles = backendArticles;
  const activeFields = FIELDS.filter(f => pageArticles.some(a => a.field === f));
  const allFields = ['ALL', ...activeFields];

  const filtered = pageArticles.filter((a) => {
    const matchField = activeField === 'ALL' || a.field === activeField;
    const matchSearch =
      !search ||
      a.title.toLowerCase().includes(search.toLowerCase()) ||
      a.abstract.toLowerCase().includes(search.toLowerCase());
    return matchField && matchSearch;
  });

  useEffect(() => {
    const openId = searchParams.get('research') ?? searchParams.get('open');
    const article = openId ? pageArticles.find((a) => a.id === openId) : null;
    if (article) {
      // Only log if selectedArticle isn't already set — avoids double-firing
      // when openArticle() sets the param and immediately triggers this effect
      if (!selectedArticle) {
        logPopupEvent('research_article', article.id, article.title);
      }
      openArticleFromLink(article);
    }
  }, [searchParams, pageArticles]);

  const grouped = activeField === 'ALL'
    ? activeFields
      .map((f) => [f, filtered.filter((a) => a.field === f)] as [Field, Article[]])
      .filter(([, items]) => items.length > 0)
    : [[activeField as Field, filtered] as [Field, Article[]]];

  return (
    <SteamiLayout>
      <ScrollNavigator />

      <motion.div className="mb-6" variants={fadeInUp} initial="hidden" animate="visible">
        <h1 className="steami-heading text-3xl md:text-4xl mb-3">Research News</h1>
        <p className="text-[16px] sm:text-[18px] font-medium text-muted-foreground max-w-xl leading-relaxed">
          Deep research environment across {activeFields.length} scientific fields. Browse by category and click news for the full study.
        </p>
      </motion.div>

      {researchError && (
        <div className="mb-6 rounded-lg border border-steami-red/20 bg-steami-red/5 p-4 text-[13px] text-steami-red">
          {researchError}
        </div>
      )}
      {loadingResearch && (
        <div className="py-20 text-center font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
          Loading backend research Article...
        </div>
      )}

      {/* Filters */}
      <motion.div
        className="flex flex-col gap-3 mb-8"
        variants={fadeInUp}
        initial="hidden"
        animate="visible"
      >
        {/* Search bar — own full-width row so it never gets squeezed */}
        <div className="relative w-full max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-steami-cyan pointer-events-none z-10" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search news..."
            className="block w-full min-h-11 pl-10 pr-4 py-2.5 rounded-lg text-[15px] font-medium outline-none shadow-[0_8px_28px_rgba(0,0,0,0.16)] transition focus:ring-2 focus:ring-steami-cyan/45"
            style={{
              background: isLight ? 'rgba(255,255,255,0.96)' : 'rgba(8, 18, 42, 0.96)',
              border: isLight ? '1px solid rgba(37, 99, 235, 0.42)' : '1px solid rgba(111, 168, 255, 0.38)',
              color: isLight ? '#0f172a' : '#e2e8f0',
            }}
          />
        </div>

        {/* Field filter pills — separate row, wraps freely */}
        <div className="flex flex-wrap gap-1.5">
          {allFields.map((f) => (
            <button
              key={f}
              onClick={() => setActiveField(f)}
              className={`px-3 py-1.5 rounded-md text-[12px] sm:text-[14px] font-mono tracking-wider uppercase transition-all duration-200 ${activeField === f
                  ? 'text-steami-cyan'
                  : 'text-muted-foreground hover:text-foreground'
                }`}
              style={{
                background: activeField === f
                  ? (isLight ? 'rgba(147,197,253,0.2)' : 'rgba(99, 179, 237, 0.12)')
                  : (isLight ? 'rgba(255,255,255,0.5)' : 'rgba(255,255,255,0.03)'),
                border: `1px solid ${activeField === f
                    ? (isLight ? 'rgba(147,197,253,0.5)' : 'rgba(99, 179, 237, 0.25)')
                    : (isLight ? 'rgba(147,197,253,0.2)' : 'rgba(255,255,255,0.06)')
                  }`,
              }}
            >
              {f}
            </button>
          ))}
        </div>
      </motion.div>

      {/* Category Sections */}
      {grouped.map(([field, items]) => (
        <CategorySection key={field} field={field} items={items} onSelect={openArticle} isLight={isLight} />
      ))}

      {filtered.length === 0 && (
        <div className="text-center py-20 text-muted-foreground text-sm font-medium">
          No news found matching your criteria.
        </div>
      )}

      {/* Full Article Modal */}
      <AnimatePresence>
        {selectedArticle && (
          <ArticleModal
            article={selectedArticle}
            contentRef={contentRef}
            diary={diary}
            recommendations={recommendations}
            onClose={closeArticle}
            onSelectArticle={openArticle}
            relatedPool={pageArticles}
            isLight={isLight}
          />
        )}
      </AnimatePresence>
    </SteamiLayout>
  );
}

/* ═══════════════════════════════════════════════════
   CATEGORY SECTION — horizontal slider with media cards
   ═══════════════════════════════════════════════════ */
function CategorySection({
  field, items, onSelect, isLight,
}: {
  field: Field; items: Article[]; onSelect: (a: Article) => void; isLight: boolean;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);
  if (items.length === 0) return null;

  const scroll = (dir: number) => {
    scrollRef.current?.scrollBy({ left: dir * 540, behavior: 'smooth' });
  };

  return (
    <MotionWrapper className="mb-8">
      <div className="steami-section-label mb-3">
        {FIELD_ICONS[field]} {field} — {items.length} NEWS
      </div>
      <div className="relative group">
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => scroll(-1)}
          className="absolute left-0 top-1/2 -translate-y-1/2 z-10 hidden sm:flex w-8 h-8 rounded-full items-center justify-center text-muted-foreground hover:text-steami-cyan transition-colors opacity-0 group-hover:opacity-100"
          style={{
            background: isLight ? 'rgba(255,255,255,0.85)' : 'rgba(3, 8, 20, 0.9)',
            border: isLight ? '1px solid rgba(147,197,253,0.4)' : '1px solid rgba(99,179,237,0.2)',
          }}
        >
          <ChevronLeft className="w-4 h-4" />
        </motion.button>
        <div
          ref={scrollRef}
          className="flex gap-4 overflow-x-auto scrollbar-hide py-1 px-1 snap-x snap-mandatory"
          style={{ scrollbarWidth: 'none', scrollSnapType: 'x mandatory' }}
        >
          {items.map((article, idx) => {
            const fieldImg = getImageUrl((article as any).image) || researchFieldImages[article.field];
            return (
              <motion.div
                key={article.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: idx * 0.05 }}
                whileHover={{ y: -3, boxShadow: isLight ? '0 12px 32px -8px rgba(147,197,253,0.35)' : '0 12px 32px -8px rgba(99,179,237,0.15)' }}
                whileTap={cardTap}
                className="glass-card relative p-0 cursor-pointer overflow-hidden shrink-0 snap-start group/card flex flex-col sm:flex-row"
                style={{ width: 'min(520px, calc(100vw - 40px))', minHeight: 240 }}
                onClick={() => onSelect(article)}
              >
                {/* Left accent bar (vertical) */}
                <div
                  className="w-[2px] shrink-0"
                  style={{
                    background: `linear-gradient(180deg, hsl(var(--steami-${FIELD_COLORS[article.field]})) 0%, transparent 100%)`,
                  }}
                />

                {/* LEFT — Content Area (60%) */}
                <div className="flex-[3] p-5 flex flex-col justify-between min-w-0">
                  <div>
                    <div className="flex flex-wrap items-center gap-2 mb-3">
                      <span className={`steami-badge steami-badge-${FIELD_COLORS[article.field]} text-[11px] sm:text-[13px] inline-block`}>
                        {article.field}
                      </span>
                      <ShareMenu title={article.title} popupType="research" popupId={article.id} compact className="opacity-0 group-hover/card:opacity-100 transition-opacity" />
                    </div>
                    <h3 className="font-serif text-[18px] font-extrabold mb-2 leading-snug text-foreground line-clamp-2">{article.title}</h3>
                    <p className="text-[14px] font-medium text-muted-foreground leading-relaxed line-clamp-3 mb-3">{article.abstract}</p>
                  </div>
                  <div className="flex items-center justify-between pt-3 border-t border-foreground/5">
                    <span className="text-[11px] font-mono text-muted-foreground/60 tracking-wider">
                      {article.author} · {article.readTime}
                    </span>
                    <span className="text-[11px] font-mono text-steami-cyan tracking-wider uppercase opacity-0 group-hover/card:opacity-100 transition-opacity flex items-center gap-1">
                      Read Research <BookOpen className="w-3 h-3" />
                    </span>
                  </div>
                </div>

                {/* Glowing vertical divider */}
                <div
                  className="w-px my-4 shrink-0"
                  style={{
                    background: isLight
                      ? 'linear-gradient(180deg, transparent, rgba(147,197,253,0.5), transparent)'
                      : `linear-gradient(180deg, transparent, hsl(var(--steami-${FIELD_COLORS[article.field]}) / 0.25), transparent)`,
                  }}
                />

                {/* RIGHT — Image Window (40%) */}
                <div className="flex-[2] relative overflow-hidden min-h-40 sm:min-h-0">
                  <motion.div
                    className="w-full h-full"
                    whileHover={{ scale: 1.05 }}
                    transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
                  >
                    <img
                      src={fieldImg}
                      alt={article.field}
                      loading="lazy"
                      className="w-full h-full object-cover"
                    />
                  </motion.div>
                  {/* Gradient overlay for depth */}
                  <div
                    className="absolute inset-0 pointer-events-none"
                    style={{
                      background: isLight
                        ? 'linear-gradient(90deg, rgba(255,255,255,0.4) 0%, transparent 40%)'
                        : 'linear-gradient(90deg, rgba(2,8,23,0.5) 0%, transparent 40%)',
                    }}
                  />
                  <CardSvgVisual field={article.field} variant="mini" className="absolute bottom-3 right-3 opacity-40 group-hover/card:opacity-70 transition-opacity" />
                </div>
              </motion.div>
            );
          })}
        </div>
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => scroll(1)}
          className="absolute right-0 top-1/2 -translate-y-1/2 z-10 hidden sm:flex w-8 h-8 rounded-full items-center justify-center text-muted-foreground hover:text-steami-cyan transition-colors opacity-0 group-hover:opacity-100"
          style={{
            background: isLight ? 'rgba(255,255,255,0.85)' : 'rgba(3, 8, 20, 0.9)',
            border: isLight ? '1px solid rgba(147,197,253,0.4)' : '1px solid rgba(99,179,237,0.2)',
          }}
        >
          <ChevronRight className="w-4 h-4" />
        </motion.button>
      </div>
    </MotionWrapper>
  );
}

/* ═══════════════════════════════════════════════════
   DUAL-PANEL ARTICLE MODAL
   Left: scrollable content  |  Right: sticky media + sidebar
   ═══════════════════════════════════════════════════ */
function ArticleModal({
  article,
  contentRef,
  diary,
  recommendations,
  onClose,
  onSelectArticle,
  relatedPool,
  isLight,
}: {
  article: Article;
  contentRef: React.RefObject<HTMLDivElement>;
  diary: Array<{ id: string; text: string; source: string; field: string }>;
  recommendations: Array<{ id: string; title: string; description: string; field: string }>;
  onClose: () => void;
  onSelectArticle: (a: Article) => void;
  relatedPool: Article[];
  isLight: boolean;
}) {
  const fieldImg = getImageUrl((article as any).image) || researchFieldImages[article.field];

  return (
    <motion.div
      variants={overlayVariants}
      initial="hidden"
      animate="visible"
      exit="exit"
      className="fixed inset-0 z-[200] flex p-2 sm:p-3 md:p-4"
      style={{
        background: isLight ? 'rgba(186,230,253,0.6)' : 'rgba(2, 8, 18, 0.85)',
        backdropFilter: 'blur(8px)',
      }}
      onClick={onClose}
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
            background: isLight ? 'rgba(255,255,255,0.94)' : 'rgba(5, 14, 32, 0.94)',
            backdropFilter: 'blur(24px) saturate(160%)',
            border: isLight ? '1px solid rgba(147,197,253,0.35)' : '1px solid rgba(255, 255, 255, 0.07)',
            boxShadow: isLight ? '0 25px 50px -12px rgba(147,197,253,0.3)' : '0 25px 50px -12px rgba(0, 0, 0, 0.6)',
          }}
        >
          <TextSelectionPopover
            containerRef={contentRef as React.RefObject<HTMLDivElement>}
            source={article.title}
            sourceType="article"
            field={article.field}
            sourceId={article.id}
          />

          {/* Mobile-only hero image */}
          <div className="relative overflow-hidden rounded-t-xl lg:hidden" style={{ height: 180 }}>
            <img
              src={fieldImg}
              alt={article.field}
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
            className="sticky top-0 z-10 px-4 sm:px-6 py-3 flex flex-wrap items-center justify-between gap-2 border-b border-foreground/5"
            style={{
              background: isLight ? 'rgba(255,255,255,0.96)' : 'rgba(5, 14, 32, 0.96)',
              backdropFilter: 'blur(20px)',
            }}
          >
            <div className="flex items-center gap-2 flex-wrap">
              <span className={`steami-badge steami-badge-${FIELD_COLORS[article.field]}`}>{article.field}</span>
              <span className="font-mono text-[11px] text-muted-foreground">{article.readTime}</span>
            </div>
            <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap justify-end">
              <PopupLinkPill type="research" id={article.id} />
              <ShareMenu title={article.title} popupType="research" popupId={article.id} compact />
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={onClose}
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
            {/* Key Findings — inline on mobile */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="rounded-xl p-5 mb-5 lg:hidden"
              style={{
                background: isLight ? 'rgba(224,242,254,0.5)' : 'rgba(6, 16, 38, 0.5)',
                border: isLight ? '1px solid rgba(147,197,253,0.3)' : '1px solid rgba(99, 179, 237, 0.14)',
              }}
            >
              <div className="font-mono text-[11px] tracking-wider uppercase text-steami-cyan mb-3 flex items-center gap-2">
                <Sparkles className="w-3 h-3" /> KEY FINDINGS
              </div>
              {article.keyFindings.map((f, i) => (
                <div key={i} className="flex items-start gap-2 py-1.5 border-b border-steami-cyan/5 last:border-0">
                  <span className="text-steami-cyan text-xs mt-0.5">◆</span>
                  <span className="font-mono text-[11px] text-muted-foreground leading-relaxed">{f}</span>
                </div>
              ))}
            </motion.div>

            {/* Title + meta */}
            <motion.div
              className="flex items-start gap-4 mb-2"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
            >
              <h2 className="steami-heading text-xl sm:text-2xl flex-1 min-w-0">{article.title}</h2>
              <CardSvgVisual field={article.field} variant="modal" className="hidden sm:flex lg:hidden" />
            </motion.div>
            <div className="flex items-center gap-3 mb-5 font-mono text-[11px] text-muted-foreground">
              <span>{article.author}</span>
              <span>·</span>
              <span>{article.readTime}</span>
            </div>

            {/* Abstract */}
            <motion.div
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="text-sm font-medium leading-relaxed text-muted-foreground mb-6 pl-5 border-l-2 border-steami-gold/50"
              style={{ fontStyle: 'italic', color: isLight ? '#3b6a8a' : '#8aacca' }}
            >
              {article.abstract}
            </motion.div>

            {/* Content paragraphs */}
            {article.content.map((para, i) => (
              <motion.p
                key={i}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.25 + i * 0.05 }}
                className="text-[18px] font-medium leading-relaxed text-foreground/80 mb-5"
              >
                {para}
              </motion.p>
            ))}

            {/* Quotes */}
            {article.quotes.map((quote, i) => (
              <motion.blockquote
                key={i}
                initial={{ opacity: 0, scale: 0.97 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.3 + i * 0.08 }}
                className="my-6 p-4 rounded-lg"
                style={{
                  background: isLight ? 'rgba(212,175,55,0.08)' : 'rgba(232, 184, 75, 0.06)',
                  borderLeft: '3px solid hsl(var(--steami-gold))',
                }}
              >
                <p className="text-sm font-medium leading-relaxed text-steami-gold2 italic">{quote}</p>
              </motion.blockquote>
            ))}
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
              src={fieldImg}
              alt={article.field}
              field={article.field}
            />
          </div>

          {/* Key Findings (desktop) */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
            className="rounded-xl p-4"
            style={{
              background: isLight ? 'rgba(255,255,255,0.85)' : 'rgba(5, 14, 32, 0.88)',
              border: isLight ? '1px solid rgba(147,197,253,0.35)' : '1px solid rgba(99, 179, 237, 0.14)',
            }}
          >
            <div className="font-mono text-[11px] tracking-wider uppercase text-steami-cyan mb-3 flex items-center gap-2">
              <Sparkles className="w-3 h-3" /> KEY FINDINGS
            </div>
            {article.keyFindings.map((f, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 + i * 0.05 }}
                className="flex items-start gap-2 py-1.5 border-b border-steami-cyan/5 last:border-0"
              >
                <span className="text-steami-cyan text-xs mt-0.5">◆</span>
                <span className="font-mono text-[11px] text-muted-foreground leading-relaxed">{f}</span>
              </motion.div>
            ))}
          </motion.div>

          {/* Knowledge Graph */}
          <div
            className="rounded-xl p-4"
            style={{
              background: isLight ? 'rgba(255,255,255,0.85)' : 'rgba(5, 14, 32, 0.88)',
              border: isLight ? '1px solid rgba(147,197,253,0.35)' : '1px solid rgba(99, 179, 237, 0.14)',
            }}
          >
            <div className="font-mono text-[11px] tracking-wider uppercase text-steami-cyan mb-3 flex items-center gap-2">
              <Network className="w-3 h-3" /> KNOWLEDGE MAP
            </div>
            <KnowledgeGraph
              centerTopic={article.title}
              relatedTopics={article.relatedTopics}
              field={article.field}
              compact
            />
            <div className="mt-3 pt-3 border-t border-steami-cyan/10">
              <div className="font-mono text-[11px] text-muted-foreground mb-2">RELATED NEWS</div>
              {relatedPool.filter(a => a.id !== article.id && a.field === article.field).slice(0, 2).map(a => (
                <motion.button
                  key={a.id}
                  whileHover={{ x: 3, backgroundColor: 'rgba(99, 179, 237, 0.08)' }}
                  onClick={() => onSelectArticle(a)}
                  className="block w-full text-left p-2 rounded-md mb-1 transition-colors"
                >
                  <div className="font-serif text-[17px] font-extrabold text-foreground leading-tight">{a.title}</div>
                  <div className="font-mono text-[11px] text-muted-foreground mt-1">{a.author}</div>
                </motion.button>
              ))}
            </div>
          </div>

          {/* Research Diary */}
          <div
            className="rounded-xl p-4"
            style={{
              background: isLight ? 'rgba(255,255,255,0.85)' : 'rgba(5, 14, 32, 0.88)',
              border: isLight ? '1px solid rgba(163,133,36,0.2)' : '1px solid rgba(232, 184, 75, 0.14)',
            }}
          >
            <div className="font-mono text-[11px] tracking-wider uppercase text-steami-gold mb-3 flex items-center gap-2">
              <FileText className="w-3 h-3" /> RESEARCH DIARY
            </div>
            {diary.length === 0 ? (
              <p className="font-mono text-[11px] text-muted-foreground">Select text in any news item to save notes here.</p>
            ) : (
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {diary.slice(0, 5).map((entry) => (
                  <div
                    key={entry.id}
                    className="p-2 rounded-md text-[11px] font-mono text-muted-foreground"
                    style={{
                      background: isLight ? 'rgba(212,175,55,0.08)' : 'rgba(232, 184, 75, 0.05)',
                      border: isLight ? '1px solid rgba(212,175,55,0.2)' : '1px solid rgba(232, 184, 75, 0.1)',
                    }}
                  >
                    "{entry.text.slice(0, 80)}..."
                    <div className="text-[15px] mt-1 text-steami-gold/60">{entry.source}</div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Recommendations */}
          <div
            className="rounded-xl p-4"
            style={{
              background: isLight ? 'rgba(255,255,255,0.85)' : 'rgba(5, 14, 32, 0.88)',
              border: isLight ? '1px solid rgba(167,139,250,0.2)' : '1px solid rgba(167, 139, 250, 0.14)',
            }}
          >
            <div className="font-mono text-[11px] tracking-wider uppercase text-steami-violet mb-3 flex items-center gap-2">
              <Sparkles className="w-3 h-3" /> RECOMMENDATIONS
            </div>
            {recommendations.slice(0, 3).map((rec) => (
              <motion.div
                key={rec.id}
                whileHover={{ scale: 1.02, borderColor: 'rgba(167, 139, 250, 0.2)' }}
                className="p-2 rounded-md mb-1.5 transition-colors"
                style={{
                  background: isLight ? 'rgba(167,139,250,0.06)' : 'rgba(167, 139, 250, 0.04)',
                  border: isLight ? '1px solid rgba(167,139,250,0.15)' : '1px solid rgba(167, 139, 250, 0.08)',
                }}
              >
                <div className="font-serif text-[17px] font-extrabold text-foreground leading-tight">{rec.title}</div>
                <div className="text-[14px] font-medium text-muted-foreground mt-1 leading-relaxed">{rec.description.slice(0, 80)}...</div>
                <span className="steami-badge steami-badge-violet text-[10px] mt-1.5 inline-block">{rec.field}</span>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </motion.div>
    </motion.div>
  );
}
