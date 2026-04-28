import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { ExternalLink, Loader2, MessageCircle, Newspaper, Sparkles, X, Zap } from 'lucide-react';
import { api } from '@/lib/api';
import { useAuthStore } from '@/stores/auth-store';
import { TextSelectionPopover } from '@/components/TextSelectionPopover';
import { ShareMenu } from '@/components/ShareMenu';
import { PopupLinkPill } from '@/components/PopupLinkPill';

type Tab = 'articles' | 'feed' | null;

const getSummary = (item: any) => item.short_summary || item.description || item.abstract || item.content || '';
const getUrl = (item: any) => item.article_url || item.url || '';
const hasInsight = (item: any) => !!(item.has_insight || item.ai_insight);
const getArticleId = (item: any) => pickFirst(item.article_id, item.source_article_id, item.articleId, item.id, item._id);

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

function getInsightSvg(item: any) {
  const insight = getInsightPayload(item);
  return pickFirst(
    insight.svg_image,
    insight.svg,
    insight.visual_svg,
    insight.svg_url,
    insight.image_svg,
    item.svg_image,
    item.svg,
    item.visual_svg,
    item.svg_url,
    item.image_svg,
  );
}

function InsightVisual({ item }: { item: any }) {
  const svg = getInsightSvg(item);
  const topic = pickFirst(item.topic, item.field, getInsightPayload(item).topic, getInsightPayload(item).category, 'AI insight');

  return (
    <div className="flex h-full min-h-[420px] flex-col justify-between border-r border-white/[0.08] bg-[#111326]/85">
      <div className="px-6 pt-8 font-mono text-[11px] font-bold lowercase tracking-wide text-indigo-300/90">{topic}</div>
      <div className="flex flex-1 items-center justify-center px-8 py-8">
        {svg ? (
          String(svg).trim().startsWith('<svg') ? (
            <img src={`data:image/svg+xml;charset=utf-8,${encodeURIComponent(String(svg))}`} alt="" className="max-h-[300px] w-full object-contain" />
          ) : (
            <img src={String(svg)} alt="" className="max-h-[300px] w-full object-contain" />
          )
        ) : (
          <div className="relative h-52 w-64">
            <div className="absolute left-12 top-20 h-6 w-6 rounded-full bg-indigo-400" />
            <div className="absolute left-28 top-12 h-6 w-6 rounded-full bg-indigo-400" />
            <div className="absolute left-28 top-36 h-6 w-6 rounded-full bg-indigo-400" />
            <div className="absolute left-44 top-20 h-6 w-6 rounded-full bg-indigo-400" />
            <div className="absolute left-[58px] top-[92px] h-px w-[88px] rotate-[-42deg] bg-indigo-300/70" />
            <div className="absolute left-[58px] top-[104px] h-px w-[88px] rotate-[42deg] bg-indigo-300/70" />
            <div className="absolute left-[136px] top-[96px] h-px w-[80px] bg-steami-gold" />
          </div>
        )}
      </div>
      <div className="px-6 pb-7 text-right font-mono text-[10px] uppercase tracking-wide text-indigo-300">STEAMI</div>
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
  const confidence = pickFirst(insight.confidence, insight.confidence_score, item.confidence);
  const sentiment = pickFirst(insight.sentiment, item.sentiment);
  const category = pickFirst(insight.category, insight.topic, item.topic, item.field);
  const readTime = pickFirst(insight.read_time, insight.readTime, item.readTime, item.read_time);
  const tags = Array.isArray(insight.tags) ? insight.tags : Array.isArray(item.tags) ? item.tags : [];
  const readUrl = getUrl(item);
  const source = pickFirst(item.source, insight.source);
  const date = pickFirst(item.published_at, item.date, insight.date);
  return (
    <div className="fixed inset-0 z-[230] flex items-center justify-center p-4" style={{ background: 'rgba(2,8,23,0.72)', backdropFilter: 'blur(10px)' }}>
      <div className="grid max-h-[84vh] w-full max-w-[900px] overflow-hidden rounded-xl border border-white/[0.08] bg-[#0b0f1c]/96 shadow-2xl md:grid-cols-[360px_1fr]">
        <InsightVisual item={item} />

        <div className="flex min-h-0 flex-col">
          <div className="flex items-center justify-between gap-3 border-b border-white/[0.07] px-5 py-4">
            <div className="flex min-w-0 flex-wrap items-center gap-2">
              <span className="font-mono text-[10px] font-bold uppercase tracking-[0.22em] text-indigo-300">AI Insight</span>
              {category && <span className="rounded-full bg-indigo-500/25 px-2 py-0.5 font-mono text-[10px] font-bold lowercase text-indigo-100">{category}</span>}
              {sentiment && <span className="font-mono text-[10px] font-bold lowercase text-emerald-300">{sentiment}</span>}
              {readTime && <span className="font-mono text-[10px] text-white/35">{readTime}</span>}
            </div>
            <div className="flex shrink-0 items-center gap-2">
              {articleId && (
                <PopupLinkPill type="insight" id={articleId} title={title} />
              )}
              <ShareMenu title={title} popupType="insight" popupId={articleId} compact />
              <button onClick={onClose} className="rounded-md p-1.5 text-white/35 hover:bg-white/[0.08] hover:text-white">
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div ref={contentRef} className="min-h-0 flex-1 overflow-y-auto px-5 py-5 text-[14px] leading-relaxed text-white/68">
            <TextSelectionPopover containerRef={contentRef as React.RefObject<HTMLDivElement>} source={title} sourceType="insight" sourceId={articleId} />
            <h3 className="font-serif text-2xl font-bold leading-tight text-white">{title}</h3>
            {confidence !== undefined && confidence !== null && (
              <div className="mt-4 flex items-center gap-3">
                <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/10">
                  <div className="h-full rounded-full bg-indigo-500" style={{ width: `${Math.max(0, Math.min(100, Number(confidence) <= 1 ? Number(confidence) * 100 : Number(confidence)))}%` }} />
                </div>
                <span className="font-mono text-[10px] text-white/35">{Number(confidence) <= 1 ? Math.round(Number(confidence) * 100) : Math.round(Number(confidence))}% confidence</span>
              </div>
            )}
            {summary && <p className="mt-5 whitespace-pre-line text-[14px] font-medium leading-[1.7] text-white/70">{summary}</p>}
            {keyPoints.length > 0 && (
              <div className="mt-5">
                <div className="mb-2 font-mono text-[10px] font-bold uppercase tracking-wider text-white/35">Key Points</div>
                <div className="space-y-2">
                  {keyPoints.map((point: string, index: number) => (
                    <p key={index} className="border-b border-white/[0.04] pb-2 font-mono text-[11px] leading-relaxed text-white/55">
                      <span className="mr-2 text-indigo-300">›</span>{point}
                    </p>
                  ))}
                </div>
              </div>
            )}
            {tags.length > 0 && (
              <div className="mt-5 flex flex-wrap gap-1.5">
                {tags.map((tag: string) => <span key={tag} className="rounded-full bg-white/[0.07] px-2 py-1 font-mono text-[10px] text-white/40">{tag}</span>)}
              </div>
            )}
            {!summary && keyPoints.length === 0 && <p className="mt-5">Insight data is available, but the backend returned it in an unfamiliar shape.</p>}
          </div>

          <div className="flex items-center justify-between gap-3 border-t border-white/[0.07] px-5 py-4">
            <div className="min-w-0 truncate font-mono text-[10px] text-white/25">
              {[source, date ? new Date(date).toLocaleDateString() : ''].filter(Boolean).join(' · ')}
            </div>
            {readUrl && (
              <a href={readUrl} target="_blank" rel="noreferrer" className="flex shrink-0 items-center gap-1.5 font-mono text-[11px] font-bold text-indigo-300 hover:text-indigo-200">
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
          <div className="min-w-0 flex items-center gap-2">
            {(item.source || item.topic || item.field) && <span className="truncate text-[10px] text-white/22">{item.source || item.topic || item.field}</span>}
            {url && (
              <a href={url} target="_blank" rel="noreferrer" className="text-white/25 hover:text-white/70" onClick={(e) => e.stopPropagation()}>
                <ExternalLink className="h-3 w-3" />
              </a>
            )}
          </div>
          <button
            onClick={() => onInsight(item)}
            disabled={loading}
            className={`flex shrink-0 items-center gap-1 rounded-md px-2 py-1 text-[9px] font-bold uppercase tracking-wide transition-colors ${
              hasInsight(item) ? 'bg-indigo-600/45 text-indigo-100 hover:bg-indigo-500/70' : 'bg-white/[0.07] text-white/45 hover:bg-white/[0.10]'
            }`}
          >
            {loading ? <Loader2 className="h-2.5 w-2.5 animate-spin" /> : <Sparkles className="h-2.5 w-2.5" />}
            {hasInsight(item) ? 'View Insight' : canGenerateInsight ? 'Generate Insight' : 'View Insight'}
          </button>
        </div>
      </div>
    </li>
  );
}

export function SteamiSidePanel() {
  const { isAuthenticated, user } = useAuthStore();
  const [tab, setTab] = useState<Tab>(null);
  const [articles, setArticles] = useState<any[]>([]);
  const [feed, setFeed] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState(false);
  const [openInsight, setOpenInsight] = useState<any | null>(null);
  const [insightLoadingId, setInsightLoadingId] = useState<string | null>(null);

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
          return;
        }

        if (articleInsight) {
          setOpenInsight(makeInsightItem(article, insightId, articleInsight));
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
      if (tab === 'articles' && (user?.role === 'admin' || user?.role === 'mod') && articleId) {
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
  };

  const items = tab === 'articles' ? articles : feed;
  const open = tab !== null;

  return (
    <>
      <div className="fixed right-0 top-1/2 z-[60] hidden -translate-y-1/2 flex-col gap-0.5 sm:flex">
        {[
          { key: 'articles' as const, label: 'Articles', Icon: Newspaper },
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
        <Link
          to={isAuthenticated ? '/chat' : '/dashboard'}
          title="Chat"
          className="flex w-12 flex-col items-center justify-center gap-1 rounded-l-xl border border-white/10 bg-[#080c18]/90 py-4 text-[9px] font-bold uppercase tracking-widest text-white/50 shadow-2xl transition-all hover:bg-white/10 hover:text-white"
        >
          <MessageCircle className="h-4 w-4" />
          <span>Chat</span>
        </Link>
      </div>

      <div
        className="fixed right-0 top-0 z-50 flex h-full flex-col overflow-hidden border-l border-white/[0.08] shadow-2xl transition-[width,opacity] duration-300"
        style={{
          width: open ? 'clamp(320px, 38vw, 600px)' : 0,
          opacity: open ? 1 : 0,
          pointerEvents: open ? 'auto' : 'none',
          background: 'rgba(6,9,20,0.97)',
          backdropFilter: 'blur(24px)',
        }}
      >
        <div className="flex min-h-0 flex-1 flex-col pr-12">
          <div className="flex items-center justify-between border-b border-white/[0.07] px-4 py-3">
            <div className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-indigo-400" />
              <span className="text-[11px] font-bold uppercase tracking-[0.18em] text-white">
                {tab === 'articles' ? 'Articles' : 'Feed'}
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
                No {tab === 'articles' ? 'articles' : 'feed items'} found yet.
              </div>
            ) : (
              <ul className="divide-y divide-white/[0.04]">
                {items.map((item, index) => (
                  <ItemCard
                    key={item.id || item._id || index}
                    item={item}
                    onInsight={onInsight}
                    canGenerateInsight={tab === 'articles' && (user?.role === 'admin' || user?.role === 'mod')}
                    loading={insightLoadingId === getArticleId(item)}
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
