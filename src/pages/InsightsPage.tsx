import { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { SteamiLayout } from '@/components/SteamiLayout';
import { useAuthStore } from '@/stores/auth-store';
import { fadeInUp, cardHover } from '@/lib/motion';
import {
  Lightbulb, ExternalLink, RefreshCw, ChevronDown, ChevronUp,
  Zap, CheckCircle2, Clock, AlertCircle, Search,
} from 'lucide-react';
import { api } from '@/lib/api';
import { RequireLogin } from '@/components/RequireLogin';
import { useThemeStore } from '@/stores/theme-store';

// ── Types ────────────────────────────────────────────────────────────────────

interface AiInsightBody {
  summary?: string;
  domain?: string;
  key_points?: string[];
  implications?: string;
  difficulty?: string;
  tags?: string[];
}

interface Insight {
  article_id: string;
  source_table?: string;
  title: string;
  topic?: string;
  source?: string;
  matched_domains?: string[];
  article_url?: string;
  ai_insight?: AiInsightBody;
  created_at?: string;
}

interface InsightStatus {
  total_articles: number;
  with_insight: number;
  without_insight: number;
  generating: boolean;
  queue_pending: number;
  queue_processing: number;
  queue_done: number;
  queue_failed: number;
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function formatRelativeTime(isoString?: string): string {
  if (!isoString) return '';
  const diff = Date.now() - new Date(isoString).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

const DOMAIN_BADGE: Record<string, string> = {
  'PHYSICS':            'steami-badge-violet',
  'AI + ROBOTICS':      'steami-badge-cyan',
  'COMPUTER SCIENCE':   'steami-badge-cyan',
  'BIOLOGY':            'steami-badge-green',
  'MEDICINE':           'steami-badge-green',
  'MATHEMATICS & DATA': 'steami-badge-gold',
  'CHEMISTRY':          'steami-badge-gold',
  'ENGINEERING':        'steami-badge-violet',
  'EARTH & SPACE':      'steami-badge-cyan',
  'CLIMATE & ENERGY':   'steami-badge-green',
};

// ── Insight Card ──────────────────────────────────────────────────────────────

function InsightCard({ insight }: { insight: Insight }) {
  const [expanded, setExpanded] = useState(false);
  const ins = insight.ai_insight;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={cardHover}
      className="glass-card relative overflow-hidden"
    >
      <div className="p-5">
        {/* Header */}
        <div className="flex items-start gap-3 mb-3">
          <Lightbulb className="w-4 h-4 text-steami-gold shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <h3 className="font-serif text-[15px] font-extrabold text-foreground leading-snug line-clamp-2 mb-1">
              {insight.title}
            </h3>
            <div className="flex items-center gap-2 flex-wrap">
              {insight.topic && (
                <span className="steami-badge steami-badge-gold text-[10px]">{insight.topic}</span>
              )}
              {ins?.domain && (
                <span className={`steami-badge text-[10px] ${DOMAIN_BADGE[ins.domain] ?? 'steami-badge-cyan'}`}>
                  {ins.domain}
                </span>
              )}
              {ins?.difficulty && (
                <span className="font-mono text-[10px] text-muted-foreground">{ins.difficulty}</span>
              )}
              {insight.source && (
                <span className="font-mono text-[10px] text-muted-foreground truncate max-w-[120px]">
                  {insight.source}
                </span>
              )}
              {insight.created_at && (
                <span className="font-mono text-[10px] text-muted-foreground ml-auto">
                  {formatRelativeTime(insight.created_at)}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Summary */}
        {ins?.summary && (
          <p className="text-[13px] text-muted-foreground leading-relaxed mb-3 line-clamp-3">
            {ins.summary}
          </p>
        )}

        {/* Key points (always show 2, expand for rest) */}
        {ins?.key_points && ins.key_points.length > 0 && (
          <ul className="space-y-1 mb-3">
            {(expanded ? ins.key_points : ins.key_points.slice(0, 2)).map((pt, i) => (
              <li key={i} className="flex items-start gap-1.5 text-[12px] text-muted-foreground">
                <span className="text-steami-cyan mt-0.5 shrink-0">›</span>
                <span>{pt}</span>
              </li>
            ))}
          </ul>
        )}

        {/* Implications (only when expanded) */}
        <AnimatePresence>
          {expanded && ins?.implications && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-3"
            >
              <p className="font-mono text-[10px] text-steami-gold uppercase tracking-widest mb-1">Implications</p>
              <p className="text-[12px] text-muted-foreground leading-relaxed">{ins.implications}</p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Tags (only when expanded) */}
        <AnimatePresence>
          {expanded && ins?.tags && ins.tags.length > 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-wrap gap-1 mb-3"
            >
              {ins.tags.map((tag) => (
                <span key={tag} className="font-mono text-[10px] text-muted-foreground border border-border/30 px-2 py-0.5 rounded-sm">
                  #{tag}
                </span>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Footer */}
        <div className="flex items-center justify-between pt-2 border-t border-steami-cyan/10">
          <div className="flex items-center gap-2">
            {insight.article_url && (
              <a
                href={insight.article_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 font-mono text-[10px] text-steami-cyan hover:underline"
              >
                <ExternalLink className="w-3 h-3" /> Source
              </a>
            )}
          </div>

          {/* Expand / collapse */}
          {ins && (ins.key_points?.length ?? 0) > 2 || ins?.implications || ins?.tags?.length ? (
            <button
              onClick={() => setExpanded((v) => !v)}
              className="flex items-center gap-1 font-mono text-[10px] text-muted-foreground hover:text-foreground transition-colors"
            >
              {expanded ? (
                <><ChevronUp className="w-3 h-3" /> Less</>
              ) : (
                <><ChevronDown className="w-3 h-3" /> More</>
              )}
            </button>
          ) : null}
        </div>
      </div>
    </motion.div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function InsightsPage() {
  const { isAuthenticated } = useAuthStore();
  const isLight = useThemeStore((s) => s.theme === 'light');

  const [insights, setInsights]           = useState<Insight[]>([]);
  const [status, setStatus]               = useState<InsightStatus | null>(null);
  const [loading, setLoading]             = useState(false);
  const [statusLoading, setStatusLoading] = useState(false);
  const [search, setSearch]               = useState('');
  const [domainFilter, setDomainFilter]   = useState('');
  const [generatingId, setGeneratingId]   = useState<string | null>(null);
  const [generateMsg, setGenerateMsg]     = useState<{ id: string; ok: boolean; text: string } | null>(null);

  // All unique domains across loaded insights
  const allDomains = [...new Set(
    insights.flatMap((ins) => ins.matched_domains ?? [ins.ai_insight?.domain ?? '']).filter(Boolean)
  )].sort();

  const loadInsights = useCallback(() => {
    if (!isAuthenticated) return;
    setLoading(true);
    // GET /api/insights
    api.insights
      .list()
      .then((data: any) => {
        const list: Insight[] = Array.isArray(data?.insights) ? data.insights : [];
        setInsights(list);
      })
      .catch(() => undefined)
      .finally(() => setLoading(false));
  }, [isAuthenticated]);

  const loadStatus = useCallback(() => {
    if (!isAuthenticated) return;
    setStatusLoading(true);
    // GET /api/articles/insights/status
    api.insights
      .status()
      .then((data) => setStatus(data as InsightStatus))
      .catch(() => undefined)
      .finally(() => setStatusLoading(false));
  }, [isAuthenticated]);

  useEffect(() => {
    loadInsights();
    loadStatus();
  }, [loadInsights, loadStatus]);

  // Auto-refresh status while generating
  useEffect(() => {
    if (!status?.generating) return;
    const timer = setInterval(loadStatus, 8000);
    return () => clearInterval(timer);
  }, [status?.generating, loadStatus]);

  if (!isAuthenticated) {
    return (
      <SteamiLayout>
        <RequireLogin message="Please login to view AI insights." />
      </SteamiLayout>
    );
  }

  // POST /api/articles/{article_id}/generate-insight
  const handleGenerateInsight = async (articleId: string) => {
    setGeneratingId(articleId);
    setGenerateMsg(null);
    try {
      await api.articles.generateInsight(articleId, true);
      setGenerateMsg({ id: articleId, ok: true, text: 'Insight generated! Reloading…' });
      setTimeout(() => {
        loadInsights();
        loadStatus();
        setGenerateMsg(null);
      }, 1500);
    } catch (err: any) {
      const msg = err?.data?.detail ?? err?.message ?? 'Failed to generate insight.';
      setGenerateMsg({ id: articleId, ok: false, text: typeof msg === 'string' ? msg : JSON.stringify(msg) });
    } finally {
      setGeneratingId(null);
    }
  };

  // Filter
  const filtered = insights.filter((ins) => {
    const matchSearch = !search || ins.title.toLowerCase().includes(search.toLowerCase())
      || ins.ai_insight?.summary?.toLowerCase().includes(search.toLowerCase())
      || ins.topic?.toLowerCase().includes(search.toLowerCase());
    const matchDomain = !domainFilter
      || (ins.matched_domains ?? []).includes(domainFilter)
      || ins.ai_insight?.domain === domainFilter;
    return matchSearch && matchDomain;
  });

  return (
    <SteamiLayout>
      {/* Header */}
      <motion.div className="mb-8" variants={fadeInUp} initial="hidden" animate="visible">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="steami-heading text-3xl md:text-4xl mb-3 flex items-center gap-2">
              <Lightbulb className="w-7 h-7 text-steami-gold" />
              AI Insights
            </h1>
            <p className="text-[17px] font-medium text-muted-foreground max-w-xl leading-relaxed">
              AI-generated analysis and key takeaways from the latest STEM research and news.
            </p>
          </div>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => { loadInsights(); loadStatus(); }}
            disabled={loading}
            className="steami-btn text-[11px] flex items-center gap-1.5 self-start mt-1"
          >
            <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} />
            REFRESH
          </motion.button>
        </div>
      </motion.div>

      {/* Status bar — GET /api/articles/insights/status */}
      {status && (
        <motion.div
          className="glass-card relative p-4 mb-6 overflow-hidden"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
        >
          <div className="flex items-center gap-6 flex-wrap">
            {/* Progress */}
            <div className="flex items-center gap-3 flex-1 min-w-[180px]">
              <div className="flex-1 h-1.5 rounded-full bg-steami-cyan/10 overflow-hidden">
                <motion.div
                  className="h-full rounded-full bg-steami-cyan/70"
                  initial={{ width: 0 }}
                  animate={{
                    width: status.total_articles > 0
                      ? `${Math.round((status.with_insight / status.total_articles) * 100)}%`
                      : '0%',
                  }}
                  transition={{ duration: 0.8, ease: 'easeOut' }}
                />
              </div>
              <span className="font-mono text-[11px] text-muted-foreground whitespace-nowrap">
                {status.with_insight}/{status.total_articles} insights ready
              </span>
            </div>

            {/* Status pills */}
            <div className="flex items-center gap-3 flex-wrap">
              {status.generating && (
                <span className="flex items-center gap-1 font-mono text-[10px] text-steami-cyan animate-pulse">
                  <Zap className="w-3 h-3" /> Generating…
                </span>
              )}
              {status.queue_pending > 0 && (
                <span className="flex items-center gap-1 font-mono text-[10px] text-muted-foreground">
                  <Clock className="w-3 h-3" /> {status.queue_pending} pending
                </span>
              )}
              {status.queue_done > 0 && (
                <span className="flex items-center gap-1 font-mono text-[10px] text-steami-green">
                  <CheckCircle2 className="w-3 h-3" /> {status.queue_done} done
                </span>
              )}
              {status.queue_failed > 0 && (
                <span className="flex items-center gap-1 font-mono text-[10px] text-steami-red">
                  <AlertCircle className="w-3 h-3" /> {status.queue_failed} failed
                </span>
              )}
            </div>
          </div>
        </motion.div>
      )}

      {/* Search + Domain filter */}
      <motion.div
        className="flex gap-2 mb-6 flex-wrap"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.1 }}
      >
        {/* Search */}
        <div className="relative w-full min-w-0 sm:flex-1 sm:min-w-[260px]">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-steami-cyan" />
          <input
            type="text"
            placeholder="Search insights…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full min-h-11 rounded-lg border pl-10 pr-4 py-2.5 font-mono text-[13px] text-foreground placeholder:text-muted-foreground/80 outline-none shadow-[0_8px_28px_rgba(0,0,0,0.16)] transition focus:ring-2 focus:ring-steami-cyan/45"
            style={{
              background: isLight ? 'rgba(255,255,255,0.96)' : 'rgba(8, 18, 42, 0.96)',
              borderColor: isLight ? 'rgba(37, 99, 235, 0.42)' : 'rgba(111, 168, 255, 0.38)',
            }}
          />
        </div>

        {/* Domain filter */}
        {allDomains.length > 0 && (
          <div className="flex gap-1 flex-wrap">
            <button
              onClick={() => setDomainFilter('')}
              className={`font-mono text-[11px] tracking-wider uppercase px-3 py-1.5 rounded-md transition-all ${!domainFilter ? 'text-steami-gold bg-steami-gold/10' : 'text-muted-foreground hover:text-foreground'}`}
              style={{ border: `1px solid ${!domainFilter ? 'rgba(232,184,75,0.3)' : 'rgba(99,179,237,0.1)'}` }}
            >
              All
            </button>
            {allDomains.slice(0, 6).map((d) => (
              <button
                key={d}
                onClick={() => setDomainFilter(d === domainFilter ? '' : d)}
                className={`font-mono text-[11px] tracking-wider uppercase px-3 py-1.5 rounded-md transition-all ${domainFilter === d ? 'text-steami-cyan bg-steami-cyan/10' : 'text-muted-foreground hover:text-foreground'}`}
                style={{ border: `1px solid ${domainFilter === d ? 'rgba(99,179,237,0.3)' : 'rgba(99,179,237,0.1)'}` }}
              >
                {d}
              </button>
            ))}
          </div>
        )}
      </motion.div>

      {/* Result count */}
      {!loading && insights.length > 0 && (
        <p className="font-mono text-[11px] text-muted-foreground mb-4">
          Showing {filtered.length} of {insights.length} insights
          {search && ` matching "${search}"`}
          {domainFilter && ` in ${domainFilter}`}
        </p>
      )}

      {/* Insights Grid — GET /api/insights */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-44 bg-muted/20 rounded-lg animate-pulse" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.97 }}
          animate={{ opacity: 1, scale: 1 }}
          className="glass-card relative p-12 text-center overflow-hidden"
        >
          <Lightbulb className="w-10 h-10 mx-auto mb-4 text-muted-foreground/30" />
          <p className="font-mono text-sm text-muted-foreground mb-2">
            {insights.length === 0 ? 'No insights available yet.' : 'No insights match your filters.'}
          </p>
          <p className="text-[13px] text-muted-foreground">
            {insights.length === 0
              ? 'Insights are generated automatically after news is refreshed by an admin.'
              : 'Try clearing the search or domain filter.'}
          </p>
          {search || domainFilter ? (
            <button
              onClick={() => { setSearch(''); setDomainFilter(''); }}
              className="steami-btn text-[11px] mt-4"
            >
              Clear Filters
            </button>
          ) : null}
        </motion.div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <AnimatePresence>
            {filtered.map((insight, idx) => (
              <motion.div key={insight.article_id} layout>
                <InsightCard insight={insight} />

                {/* Generate insight button — POST /api/articles/{article_id}/generate-insight */}
                {!insight.ai_insight && (
                  <div className="mt-2 px-1">
                    <motion.button
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.97 }}
                      onClick={() => handleGenerateInsight(insight.article_id)}
                      disabled={generatingId === insight.article_id}
                      className="steami-btn steami-btn-gold text-[10px] w-full flex items-center justify-center gap-1.5"
                    >
                      {generatingId === insight.article_id ? (
                        <><span className="inline-block w-3 h-3 border border-current border-t-transparent rounded-full animate-spin" /> Generating…</>
                      ) : (
                        <><Zap className="w-3 h-3" /> Generate Insight</>
                      )}
                    </motion.button>
                    {generateMsg?.id === insight.article_id && (
                      <p className={`font-mono text-[10px] mt-1 text-center ${generateMsg.ok ? 'text-steami-green' : 'text-steami-red'}`}>
                        {generateMsg.text}
                      </p>
                    )}
                  </div>
                )}
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </SteamiLayout>
  );
}
