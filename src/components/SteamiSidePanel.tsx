import { useEffect, useRef, useState } from 'react';
import { ExternalLink, Loader2, Newspaper, Sparkles, X, Zap } from 'lucide-react';
import { api } from '@/lib/api';
import { useAuthStore } from '@/stores/auth-store';

const logPopupEvent = (popup_type: string, popup_id: string | undefined | null, popup_title?: string) => {
  if (!popup_id) return;
  api.dashboard.event({ popup_type, popup_id, popup_title: popup_title ?? '' }).catch(() => {});
};
import { TextSelectionPopover } from '@/components/TextSelectionPopover';
import { ShareMenu } from '@/components/ShareMenu';
import { PopupLinkPill } from '@/components/PopupLinkPill';

type Tab = 'articles' | 'feed' | null;

const getSummary = (item: any) => item.short_summary || item.description || item.abstract || item.content || '';
const getUrl = (item: any) => item.article_url || item.url || '';
const hasInsight = (item: any) => !!(item.has_insight || item.ai_insight || item.insight_payload || item.insight);
const getArticleId = (item: any) => pickFirst(item.article_id, item.source_article_id, item.articleId, item.id, item._id);
const getItemId = (item: any) => pickFirst(item.id, item._id);

const setInsightParam = (articleId?: string | null) => {
  if (!articleId) return;
  const url = new URL(window.location.href);
  url.searchParams.set('insight', articleId);
  window.history.pushState({}, '', `${url.pathname}${url.search}${url.hash}`);
};

const clearInsightParam = () => {
  const url = new URL(window.location.href);
  url.searchParams.delete('insight');
  window.history.replaceState({}, '', `${url.pathname}${url.search}${url.hash}`);
};

const pickFirst = (...values: any[]) => values.find((value) => value !== undefined && value !== null && value !== '');

const getInsightPayload = (item: any) => item.insight_payload || item.ai_insight || item.insight || {};

const makeInsightItem = (base: any, articleId: string, raw?: any) => ({
  ...(base || {}),
  id: articleId,
  article_id: articleId,
  insight_payload: raw ?? base?.insight_payload ?? base?.ai_insight ?? base?.insight,
  ai_insight: raw?.ai_insight || raw?.insight || raw || base?.ai_insight || base?.insight,
  has_insight: true,
});

// ─── sentiment helpers ────────────────────────────────────────────────────────

function getSentimentLabel(item: any): 'good_news' | 'bad_news' | 'neutral_news' {
  const insight = getInsightPayload(item);
  const raw = pickFirst(insight.sentiment_label, item.sentiment_label);
  if (raw === 'good_news' || raw === 'bad_news' || raw === 'neutral_news') return raw;
  // derive from raw sentiment polarity as fallback
  const polarity = pickFirst(insight.sentiment, item.sentiment, '');
  if (polarity === 'positive') return 'good_news';
  if (polarity === 'negative') return 'bad_news';
  return 'neutral_news';
}

function getEmoji(item: any): string {
  const insight = getInsightPayload(item);
  return pickFirst(insight.emoji, item.emoji, '');
}

const SENTIMENT_CONFIG = {
  good_news:    { label: 'Good News', bg: 'bg-emerald-500/20', text: 'text-emerald-300', dot: 'bg-emerald-400' },
  bad_news:     { label: 'Bad News',  bg: 'bg-red-500/20',     text: 'text-red-300',     dot: 'bg-red-400'     },
  neutral_news: { label: 'Neutral',   bg: 'bg-indigo-500/15',  text: 'text-indigo-300',  dot: 'bg-indigo-400'  },
} as const;

function SentimentBadge({ label }: { label: 'good_news' | 'bad_news' | 'neutral_news' }) {
  const cfg = SENTIMENT_CONFIG[label];
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 font-mono text-[10px] font-bold ${cfg.bg} ${cfg.text}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${cfg.dot}`} />
      {cfg.label}
    </span>
  );
}

function InsightVisualPanel({ item }: { item: any }) {
  const insight    = getInsightPayload(item);
  const emoji      = getEmoji(item);
  const sentLabel  = getSentimentLabel(item);
  const sentCfg    = SENTIMENT_CONFIG[sentLabel];
  const domain     = pickFirst(insight.domain, item.topic, item.field, 'Technology');
  const readingMin = pickFirst(insight.reading_time_min, insight.readingTime, item.reading_time_min);
  const confidence = pickFirst(insight.confidence, item.confidence);
  const confPct    = confidence !== undefined
    ? (Number(confidence) <= 1 ? Math.round(Number(confidence) * 100) : Math.round(Number(confidence)))
    : null;

  return (
    <div className="flex shrink-0 flex-col justify-between overflow-visible border-b border-white/[0.08] bg-[#0d1022]/90 md:h-full md:border-b-0 md:border-r">
      {/* top label */}
      <div className="flex items-center justify-between px-5 pt-5">
        <span className="font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-indigo-300/70">{domain}</span>
        <span className="font-mono text-[9px] uppercase tracking-widest text-white/15">STEAMI</span>
      </div>

      {/* emoji hero */}
      <div className="flex flex-1 flex-col items-center justify-center gap-3 overflow-visible px-4 py-6 md:py-10">
        {emoji ? (
          <span
            className="block select-none pb-1 leading-[1.18]"
            style={{ fontSize: 'clamp(52px, 14vw, 88px)' }}
            role="img"
            aria-label={sentCfg.label}
          >
            {emoji}
          </span>
        ) : (
          <span className="flex h-20 w-20 items-center justify-center rounded-full bg-indigo-500/20">
            <Sparkles className="h-8 w-8 text-indigo-400" />
          </span>
        )}
        <SentimentBadge label={sentLabel} />
      </div>

      {/* confidence bar */}
      {confPct !== null && (
        <div className="px-5 pb-5">
          <div className="mb-1.5 flex items-center justify-between">
            <span className="font-mono text-[9px] uppercase tracking-wider text-white/25">Confidence</span>
            <span className="font-mono text-[9px] text-white/35">{confPct}%</span>
          </div>
          <div className="h-1 w-full overflow-hidden rounded-full bg-white/[0.08]">
            <div className={`h-full rounded-full ${sentCfg.dot}`} style={{ width: `${confPct}%` }} />
          </div>
          {readingMin && <p className="mt-2 font-mono text-[9px] text-white/20">{readingMin} min read</p>}
        </div>
      )}
    </div>
  );
}

function InsightNotice({ onClose }: { onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-[230] flex items-center justify-center p-4" style={{ background: 'rgba(2,8,23,0.72)', backdropFilter: 'blur(10px)' }}>
      <div className="w-full max-w-sm rounded-xl border border-steami-cyan/20 bg-background/95 p-5 shadow-2xl">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="font-serif text-xl font-bold text-foreground">Insight is being prepared</h3>
            <p className="mt-2 text-[14px] leading-relaxed text-muted-foreground">
              AI insight has not been generated for this item yet. Please wait 2 to 3 hours and check again.
            </p>
          </div>
          <button onClick={onClose} className="rounded-md p-1 text-muted-foreground hover:text-foreground">
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

function InsightPopup({ item, onClose }: { item: any; onClose: () => void }) {
  const contentRef = useRef<HTMLDivElement>(null);
  const insight = getInsightPayload(item);
  const articleId = getArticleId(item);
  const title = pickFirst(insight.title, item.title, 'AI insight');
  const summary = typeof insight === 'string' ? insight : pickFirst(insight.summary, insight.content, insight.text, insight.analysis, item.short_summary, item.description);
  const keyPoints = Array.isArray(insight.key_points)
    ? insight.key_points
    : Array.isArray(insight.keyPoints)
      ? insight.keyPoints
      : Array.isArray(insight.bullets)
        ? insight.bullets
        : [];
  const sentimentLabel = getSentimentLabel(item);
  const category = pickFirst(insight.domain, insight.category, insight.topic, item.topic, item.field);
  const readTime = pickFirst(insight.reading_time_min, insight.read_time, insight.readTime, item.readTime, item.read_time);
  const tags = Array.isArray(insight.tags) ? insight.tags : Array.isArray(item.tags) ? item.tags : [];
  const readUrl = getUrl(item);
  const source = pickFirst(item.source, insight.source);
  const date = pickFirst(item.published_at, item.date, insight.date);

  return (
    <div
      className="fixed inset-0 z-[230] flex items-end justify-center sm:items-center sm:p-4"
      style={{ background: 'rgba(2,8,23,0.75)', backdropFilter: 'blur(12px)' }}
    >
      {/* Sheet on mobile (slides up from bottom), dialog on sm+ */}
      <div className="flex max-h-[94svh] w-full flex-col overflow-hidden rounded-t-2xl border border-white/[0.08] bg-[#0b0f1c]/97 shadow-2xl sm:max-h-[88svh] sm:max-w-[900px] sm:rounded-xl sm:flex-row">

        {/* Left visual panel — full-width row on mobile, fixed 220px col on desktop */}
        <div className="w-full sm:w-[220px] sm:shrink-0 md:w-[280px]">
          <InsightVisualPanel item={item} />
        </div>

        {/* Right content pane */}
        <div className="flex min-h-0 flex-1 flex-col sm:max-h-[88svh]">
          {/* Header */}
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/[0.07] px-4 py-3 sm:px-5">
            <div className="flex min-w-0 flex-wrap items-center gap-2">
              <span className="font-mono text-[10px] font-bold uppercase tracking-[0.22em] text-indigo-300">AI Insight</span>
              {category && (
                <span className="rounded-full bg-indigo-500/20 px-2 py-0.5 font-mono text-[10px] font-bold lowercase text-indigo-100">
                  {category}
                </span>
              )}
              <SentimentBadge label={sentimentLabel} />
              {readTime && <span className="font-mono text-[10px] text-white/30">{readTime} min read</span>}
            </div>
            <div className="flex shrink-0 items-center gap-1.5">
              {articleId && <PopupLinkPill type="insight" id={articleId} title={title} />}
              <ShareMenu title={title} popupType="insight" popupId={articleId} compact />
              <button
                onClick={onClose}
                className="rounded-md p-1.5 text-white/35 hover:bg-white/[0.08] hover:text-white"
                aria-label="Close insight"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Scrollable body */}
          <div
            ref={contentRef}
            className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-4 text-[14px] leading-relaxed text-white/68 sm:px-5 sm:py-5"
          >
            <TextSelectionPopover containerRef={contentRef as React.RefObject<HTMLDivElement>} source={title} sourceType="insight" sourceId={articleId} />
            <h3 className="font-serif text-lg font-bold leading-tight text-white sm:text-2xl">{title}</h3>

            {summary && (
              <p className="mt-4 whitespace-pre-line text-[13px] font-medium leading-[1.75] text-white/70 sm:text-[14px]">
                {summary}
              </p>
            )}

            {keyPoints.length > 0 && (
              <div className="mt-5">
                <div className="mb-2.5 font-mono text-[10px] font-bold uppercase tracking-wider text-white/30">Key Points</div>
                <div className="space-y-2">
                  {keyPoints.map((point: string, index: number) => (
                    <p
                      key={index}
                      className="flex gap-2 border-b border-white/[0.04] pb-2.5 font-mono text-[11px] leading-relaxed text-white/55"
                    >
                      <span className="mt-px shrink-0 text-indigo-300">›</span>
                      <span>{point}</span>
                    </p>
                  ))}
                </div>
              </div>
            )}

            {tags.length > 0 && (
              <div className="mt-5 flex flex-wrap gap-1.5">
                {tags.map((tag: string) => (
                  <span key={tag} className="rounded-full bg-white/[0.07] px-2.5 py-1 font-mono text-[10px] text-white/40">
                    {tag}
                  </span>
                ))}
              </div>
            )}

            {!summary && keyPoints.length === 0 && (
              <p className="mt-5 text-white/40">Insight data is available, but the backend returned it in an unfamiliar shape.</p>
            )}
          </div>

          {/* Footer */}
          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-white/[0.07] px-4 py-3 sm:px-5">
            <div className="min-w-0 truncate font-mono text-[10px] text-white/25">
              {[source, date ? new Date(date).toLocaleDateString() : ''].filter(Boolean).join(' · ')}
            </div>
            {readUrl && (
              <a
                href={readUrl}
                target="_blank"
                rel="noreferrer"
                className="flex shrink-0 items-center gap-1.5 font-mono text-[11px] font-bold text-indigo-300 hover:text-indigo-200"
              >
                Read article <ExternalLink className="h-3 w-3" />
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function ItemCard({ item, onInsight, canGenerateInsight, loading }: { item: any; onInsight: (item: any) => void; canGenerateInsight: boolean; loading: boolean }) {
  const summary = getSummary(item).split(/\s+/).slice(0, 32).join(' ');
  const url = getUrl(item);
  const hasIns = hasInsight(item);
  const emoji = hasIns ? getEmoji(item) : '';
  const sentLabel = hasIns ? getSentimentLabel(item) : null;
  const sentCfg = sentLabel ? SENTIMENT_CONFIG[sentLabel] : null;

  return (
    <li className="group flex gap-3 px-4 py-3.5 transition-colors hover:bg-white/[0.035]">
      <div className="h-14 w-[72px] shrink-0 overflow-hidden rounded-lg bg-white/[0.05]">
        {item.image_url || item.image ? (
          <img src={item.image_url || item.image} alt="" className="h-full w-full object-cover opacity-75 transition-opacity group-hover:opacity-95" />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-white/15"><Newspaper className="h-4 w-4" /></div>
        )}
      </div>
      <div className="min-w-0 flex-1">
        <p className="line-clamp-2 text-[12px] font-semibold leading-snug text-white">{item.title}</p>
        {summary && <p className="mt-1 line-clamp-2 text-[11px] leading-relaxed text-white/38">{summary}</p>}
        <div className="mt-2 flex items-center justify-between gap-2">
          <div className="flex min-w-0 items-center gap-2">
            {/* sentiment label pill if insight exists */}
            {sentCfg && emoji ? (
              <span className={`inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 font-mono text-[9px] font-bold ${sentCfg.bg} ${sentCfg.text}`}>
                <span>{emoji}</span>
                {sentCfg.label}
              </span>
            ) : (item.source || item.topic || item.field) ? (
              <span className="truncate text-[10px] text-white/22">{item.source || item.topic || item.field}</span>
            ) : null}
            {url && (
              <a href={url} target="_blank" rel="noreferrer" className="shrink-0 text-white/25 hover:text-white/70" onClick={(e) => e.stopPropagation()}>
                <ExternalLink className="h-3 w-3" />
              </a>
            )}
          </div>
          <button
            onClick={() => onInsight(item)}
            disabled={loading}
            className={`flex shrink-0 items-center gap-1 rounded-md px-2 py-1 text-[9px] font-bold uppercase tracking-wide transition-colors ${
              hasIns ? 'bg-indigo-600/45 text-indigo-100 hover:bg-indigo-500/70' : 'bg-white/[0.07] text-white/45 hover:bg-white/[0.10]'
            }`}
          >
            {loading ? <Loader2 className="h-2.5 w-2.5 animate-spin" /> : <Sparkles className="h-2.5 w-2.5" />}
            {hasIns ? 'View Insight' : canGenerateInsight ? 'Generate' : 'View Insight'}
          </button>
        </div>
      </div>
    </li>
  );
}

export function SteamiSidePanel() {
  const { user } = useAuthStore();
  const [tab, setTab] = useState<Tab>(null);
  const [articles, setArticles] = useState<any[]>([]);
  const [feed, setFeed] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState(false);
  const [openInsight, setOpenInsight] = useState<any | null>(null);
  const [insightLoadingId, setInsightLoadingId] = useState<string | null>(null);
  const canManageInsights = user?.role === 'admin' || user?.role === 'mod';

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const insightId = params.get('insight');
    if (!insightId) return;

    setInsightLoadingId(insightId);
    Promise.allSettled([api.articles.get(insightId), api.insights.get(insightId), api.insights.list()])
      .then(([articleResult, insightResult, listResult]) => {
        const article: any = articleResult.status === 'fulfilled' ? articleResult.value : { id: insightId, title: 'AI Insight' };
        const articleInsight = article?.ai_insight || article?.insight;

        if (insightResult.status === 'fulfilled') {
          setOpenInsight(makeInsightItem(article, insightId, insightResult.value));
          logPopupEvent('ai_insight', insightId, article?.title);
          return;
        }

        if (articleInsight) {
          setOpenInsight(makeInsightItem(article, insightId, articleInsight));
          logPopupEvent('ai_insight', insightId, article?.title);
          return;
        }

        const insightList: any[] =
          listResult.status === 'fulfilled'
            ? Array.isArray(listResult.value)
              ? listResult.value
              : listResult.value?.insights || listResult.value?.items || []
            : [];
        const found = insightList.find((entry) => getArticleId(entry) === insightId || entry.id === insightId || entry._id === insightId);
        if (found) {
          setOpenInsight(makeInsightItem({ ...article, ...found }, insightId, found.ai_insight || found.insight || found));
          logPopupEvent('ai_insight', insightId, article?.title);
          return;
        }

        setNotice(true);
      })
      .finally(() => {
        setInsightLoadingId(null);
      });
  }, []);

  useEffect(() => {
    if (!tab) return;
    setLoading(true);
    const request = tab === 'articles' ? api.articles.list({ limit: 30 }) : api.feed.items();
    request
      .then((data: any) => {
        const items = Array.isArray(data) ? data : data?.articles || data?.items || [];
        if (tab === 'articles') setArticles(items);
        else setFeed(items);
      })
      .catch(() => undefined)
      .finally(() => setLoading(false));
  }, [tab]);

  const onInsight = async (item: any) => {
    const articleId = getArticleId(item);
    if (!hasInsight(item)) {
      if (tab === 'articles' && canManageInsights && articleId) {
        setInsightLoadingId(articleId);
        try {
          const raw: any = await api.articles.generateInsight(articleId);
          const updated = {
            ...item,
            title: raw?.title || item.title,
            ai_insight: raw?.insight || raw?.ai_insight || raw,
            has_insight: true,
          };
          setArticles((prev) => prev.map((article) => (getArticleId(article) === articleId ? updated : article)));
          setInsightParam(articleId);
          setOpenInsight(makeInsightItem(updated, articleId, updated.ai_insight));
          logPopupEvent('ai_insight', articleId, updated.title);
        } catch {
          setNotice(true);
        } finally {
          setInsightLoadingId(null);
        }
        return;
      }

      const feedItemId = getItemId(item);
      if (tab === 'feed' && canManageInsights && feedItemId) {
        setInsightLoadingId(feedItemId);
        try {
          const raw: any = await api.feed.insight(feedItemId);
          const updated = {
            ...item,
            ...raw,
            title: raw?.title || item.title,
            insight_payload: raw?.insight_payload || raw?.ai_insight || raw?.insight || raw,
            ai_insight: raw?.ai_insight || raw?.insight || raw,
            has_insight: true,
          };
          setFeed((prev) => prev.map((feedItem) => (getItemId(feedItem) === feedItemId ? updated : feedItem)));
          setInsightParam(feedItemId);
          setOpenInsight(makeInsightItem(updated, feedItemId, updated.ai_insight));
          logPopupEvent('ai_insight', feedItemId, updated.title);
        } catch {
          setNotice(true);
        } finally {
          setInsightLoadingId(null);
        }
        return;
      }

      setNotice(true);
      return;
    }
    setInsightParam(articleId);
    setOpenInsight(makeInsightItem(item, articleId));
    logPopupEvent('ai_insight', articleId, item.title);
  };

  const items = tab === 'articles' ? articles : feed;
  const open = tab !== null;

  return (
    <>
      <div className="fixed bottom-3 left-1/2 z-[60] flex -translate-x-1/2 items-center gap-1 rounded-2xl border border-white/10 bg-[#080c18]/95 p-1 shadow-2xl backdrop-blur-xl sm:hidden">
        {[
          { key: 'articles' as const, label: 'News', Icon: Newspaper },
          { key: 'feed' as const, label: 'Feed', Icon: Zap },
        ].map(({ key, label, Icon }) => (
          <button
            key={key}
            title={label}
            onClick={() => setTab((prev) => (prev === key ? null : key))}
            className={`flex h-11 min-w-16 items-center justify-center gap-1.5 rounded-xl px-3 text-[10px] font-bold uppercase tracking-wider transition-all ${
              tab === key ? 'bg-indigo-600 text-white' : 'text-white/60 hover:bg-white/10 hover:text-white'
            }`}
          >
            <Icon className="h-3.5 w-3.5" />
            <span>{label}</span>
          </button>
        ))}
      </div>

      {open && (
        <button
          aria-label="Close side panel"
          onClick={() => setTab(null)}
          className="fixed inset-0 z-[49] bg-black/40 sm:hidden"
        />
      )}

      <div className="fixed right-0 top-1/2 z-[60] hidden -translate-y-1/2 flex-col gap-0.5 sm:flex">
        {[
          { key: 'articles' as const, label: 'News', Icon: Newspaper },
          { key: 'feed' as const, label: 'Feed', Icon: Zap },
        ].map(({ key, label, Icon }) => (
          <button
            key={key}
            title={label}
            onClick={() => setTab((prev) => (prev === key ? null : key))}
            className={`flex w-12 flex-col items-center justify-center gap-1 rounded-l-xl border py-4 text-[9px] font-bold uppercase tracking-widest shadow-2xl transition-all ${
              tab === key ? 'border-indigo-500 bg-indigo-600 text-white' : 'border-white/10 bg-[#080c18]/90 text-white/50 hover:bg-white/10 hover:text-white'
            }`}
          >
            <Icon className="h-4 w-4" />
            <span>{label}</span>
          </button>
        ))}
      </div>

      <div
        className={`fixed right-0 top-0 z-50 flex h-full flex-col overflow-hidden border-l border-white/[0.08] shadow-2xl transition-[width,opacity] duration-300 ${open ? 'w-full sm:w-[clamp(320px,38vw,600px)]' : 'w-0'}`}
        style={{
          opacity: open ? 1 : 0,
          pointerEvents: open ? 'auto' : 'none',
          background: 'rgba(6,9,20,0.97)',
          backdropFilter: 'blur(24px)',
        }}
      >
        <div className="flex min-h-0 flex-1 flex-col sm:pr-12">
          <div className="flex items-center justify-between border-b border-white/[0.07] px-4 py-3">
            <div className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-indigo-400" />
              <span className="text-[11px] font-bold uppercase tracking-[0.18em] text-white">
                {tab === 'articles' ? 'News' : 'Feed'}
              </span>
            </div>
            <button onClick={() => setTab(null)} className="rounded-md p-1 text-white/30 hover:bg-white/10 hover:text-white">
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto">
            {loading ? (
              <div className="flex h-44 items-center justify-center gap-2 text-white/25">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="text-xs">Loading</span>
              </div>
            ) : items.length === 0 ? (
              <div className="flex h-44 items-center justify-center px-6 text-center text-xs text-white/25">
                No {tab === 'articles' ? 'news' : 'feed items'} found yet.
              </div>
            ) : (
              <ul className="divide-y divide-white/[0.04]">
                {items.map((item, index) => (
                  <ItemCard
                    key={item.id || item._id || index}
                    item={item}
                    onInsight={onInsight}
                    canGenerateInsight={canManageInsights && !hasInsight(item)}
                    loading={insightLoadingId === (tab === 'feed' ? getItemId(item) : getArticleId(item))}
                  />
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>

      {notice && <InsightNotice onClose={() => setNotice(false)} />}
      {insightLoadingId && (
        <div className="fixed inset-0 z-[230] flex items-center justify-center" style={{ background: 'rgba(2,8,23,0.5)', backdropFilter: 'blur(8px)' }}>
          <div className="flex items-center gap-2 rounded-xl border border-steami-cyan/20 bg-background/95 px-4 py-3 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading insight
          </div>
        </div>
      )}
      {openInsight && <InsightPopup item={openInsight} onClose={() => { setOpenInsight(null); clearInsightParam(); }} />}
    </>
  );
}
