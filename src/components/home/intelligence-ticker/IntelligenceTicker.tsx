import React, { useEffect, useState } from 'react';
import {
  Cpu, Brain, Zap, Network, Search, LineChart, Atom, Dna,
  Microscope, FlaskConical, Orbit, Waves, BrainCircuit,
  Lock, LogIn, Loader2, RefreshCw, ChevronRight,
} from 'lucide-react';
import { TickerTrack } from './TickerTrack';
import { TickerItem } from './TickerItem';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '@/lib/api';
import { useAuthStore } from '@/stores/auth-store';
import { Link } from 'react-router-dom';

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

interface AiInsight {
  summary?:          string;
  key_points?:       string[];
  sentiment_label?:  'good_news' | 'bad_news' | 'neutral_news';
  emoji?:            string;
  domain?:           string;
  reading_time_min?: number;
  tags?:             string[];
}

interface InsightItem {
  id:           string;
  article_id:   string;
  title:        string;
  topic?:       string;
  source?:      string;
  article_url?: string;
  ai_insight?:  AiInsight;
  created_at?:  string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Icon pool — cycle through for variety
// ─────────────────────────────────────────────────────────────────────────────

const ICON_POOL = [
  Brain, Atom, Network, LineChart, Search, Zap, Dna, Cpu,
  Microscope, FlaskConical, Orbit, Waves, BrainCircuit,
];

function getIcon(index: number) {
  return ICON_POOL[index % ICON_POOL.length];
}

// Sentiment → trend colour
const SENTIMENT_TREND = {
  good_news:    { isUp: true,  symbol: '↑' },
  bad_news:     { isUp: false, symbol: '↓' },
  neutral_news: { isUp: true,  symbol: '→' },
} as const;

// ─────────────────────────────────────────────────────────────────────────────
// Fallback static signals (shown when logged out)
// ─────────────────────────────────────────────────────────────────────────────

const STATIC_SIGNALS = [
  { icon: Brain,       label: "AI Research Signals",                trend: { value: "28%",        isUp: true  } },
  { icon: Atom,        label: "Quantum Intelligence Mapping Active", trend: { value: "Active",     isUp: true  } },
  { icon: Network,     label: "New Scientific Relationship Detected",trend: { value: "Live",       isUp: true  } },
  { icon: LineChart,   label: "Knowledge Graph Expanded",           trend: { value: "+1.2k Nodes", isUp: true  } },
  { icon: Search,      label: "Emerging Tech Clusters Identified",   trend: { value: "9 detected", isUp: true  } },
  { icon: Zap,         label: "STEM Intelligence Stream Updated",    trend: { value: "2ms ago",    isUp: true  } },
  { icon: Dna,         label: "Biotech Synthesis Pipeline Online",   trend: { value: "Synced",     isUp: true  } },
  { icon: Cpu,         label: "Neural Network Density Increased",    trend: { value: "14%",        isUp: true  } },
];

// ─────────────────────────────────────────────────────────────────────────────
// Auth Gate — shown inside the ticker section when not logged in
// ─────────────────────────────────────────────────────────────────────────────

function AuthGate() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative z-20 flex items-center justify-center gap-0 mt-3"
    >
      {/* Blurred ticker preview behind gate */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none select-none"
        style={{ filter: 'blur(3px)', opacity: 0.35 }}>
        <TickerTrack speed={55}>
          {STATIC_SIGNALS.map((s, i) => (
            <TickerItem key={i} icon={s.icon} label={s.label} trend={s.trend} />
          ))}
        </TickerTrack>
      </div>

      {/* Gate card */}
      <div
        className="relative z-10 flex flex-col items-center gap-3 px-8 py-5 rounded-2xl text-center"
        style={{
          background: 'rgba(3,8,20,0.82)',
          border: '1px solid rgba(0,217,255,0.18)',
          backdropFilter: 'blur(18px)',
          boxShadow: '0 0 60px rgba(0,217,255,0.07), 0 8px 40px rgba(0,0,0,0.4)',
        }}
      >
        <div className="relative">
          <div className="w-10 h-10 rounded-full flex items-center justify-center"
            style={{ background: 'rgba(0,217,255,0.1)', border: '1px solid rgba(0,217,255,0.25)' }}>
            <Lock className="w-4 h-4 text-cyan-400" />
          </div>
          <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-cyan-500 animate-ping" />
        </div>

        <div>
          <p className="font-mono text-[11px] uppercase tracking-[0.25em] text-cyan-400/70 mb-1">
            Live Intelligence Feed
          </p>
          <p className="font-serif text-[15px] font-bold text-white/90">
            Sign in to unlock real-time signals
          </p>
          <p className="text-[12px] text-slate-400 mt-1 max-w-[280px]">
            AI-enriched insights from the STEM intelligence network, updated live.
          </p>
        </div>

        <div className="flex items-center gap-3 mt-1">
          <Link
            to="/login"
            className="flex items-center gap-2 px-5 py-2 rounded-xl font-mono text-[11px] uppercase tracking-widest transition-all duration-200 hover:scale-105"
            style={{
              background: 'rgba(0,217,255,0.12)',
              border: '1px solid rgba(0,217,255,0.35)',
              color: '#00d9ff',
              boxShadow: '0 0 20px rgba(0,217,255,0.1)',
            }}
          >
            <LogIn className="w-3.5 h-3.5" />
            Sign In
          </Link>
          <Link
            to="/signup"
            className="flex items-center gap-1.5 px-5 py-2 rounded-xl font-mono text-[11px] uppercase tracking-widest transition-all duration-200 hover:opacity-80"
            style={{
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.1)',
              color: 'rgba(255,255,255,0.6)',
            }}
          >
            Register
            <ChevronRight className="w-3 h-3" />
          </Link>
        </div>
      </div>
    </motion.div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Live Feed Full-Screen Overlay — shown when user clicks "View Feed"
// ─────────────────────────────────────────────────────────────────────────────

const SENTIMENT_COLOR = {
  good_news:    { bg: 'rgba(16,185,129,0.12)',  text: '#6ee7b7', dot: '#10b981', label: 'Good News'  },
  bad_news:     { bg: 'rgba(239,68,68,0.12)',   text: '#fca5a5', dot: '#ef4444', label: 'Bad News'   },
  neutral_news: { bg: 'rgba(99,102,241,0.12)',  text: '#a5b4fc', dot: '#6366f1', label: 'Neutral'    },
} as const;

function FeedCard({ item, idx }: { item: InsightItem; idx: number }) {
  const ai      = item.ai_insight;
  const sentKey = (ai?.sentiment_label ?? 'neutral_news') as keyof typeof SENTIMENT_COLOR;
  const sent    = SENTIMENT_COLOR[sentKey] ?? SENTIMENT_COLOR.neutral_news;
  const Icon    = getIcon(idx);
  const trend   = SENTIMENT_TREND[sentKey] ?? SENTIMENT_TREND.neutral_news;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: idx * 0.04 }}
      className="flex flex-col rounded-2xl overflow-hidden"
      style={{
        background: 'rgba(8,16,38,0.82)',
        border: `1px solid ${sent.dot}22`,
        backdropFilter: 'blur(12px)',
      }}
    >
      {/* Accent bar */}
      <div className="h-[2px] w-full shrink-0"
        style={{ background: `linear-gradient(90deg, ${sent.dot} 0%, transparent 100%)` }} />

      {/* Hero */}
      <div className="flex items-center justify-center py-5"
        style={{ background: sent.bg }}>
        <div className="relative">
          <div className="w-12 h-12 rounded-xl flex items-center justify-center"
            style={{ background: `${sent.dot}20`, border: `1px solid ${sent.dot}40` }}>
            <Icon className="w-5 h-5" style={{ color: sent.text }} />
          </div>
          {ai?.emoji && (
            <span className="absolute -top-2 -right-2 text-[18px]">{ai.emoji}</span>
          )}
        </div>
      </div>

      <div className="p-4 flex flex-col gap-2 flex-1">
        {/* Domain + sentiment */}
        <div className="flex items-center gap-2 flex-wrap">
          {(ai?.domain || item.topic) && (
            <span className="font-mono text-[9px] tracking-widest uppercase px-2 py-0.5 rounded-full"
              style={{ background: `${sent.dot}18`, color: sent.text }}>
              {ai?.domain || item.topic}
            </span>
          )}
          <span className="inline-flex items-center gap-1 font-mono text-[9px] font-bold px-2 py-0.5 rounded-full"
            style={{ background: sent.bg, color: sent.text }}>
            <span className="w-1.5 h-1.5 rounded-full" style={{ background: sent.dot }} />
            {sent.label}
          </span>
        </div>

        {/* Title */}
        <h3 className="font-serif text-[14px] font-bold text-white/90 leading-snug line-clamp-2">
          {item.title}
        </h3>

        {/* Summary */}
        {ai?.summary && (
          <p className="text-[12px] text-slate-400 leading-relaxed line-clamp-3 flex-1">
            {ai.summary}
          </p>
        )}

        {/* Key points */}
        {ai?.key_points && ai.key_points.length > 0 && (
          <ul className="space-y-1 mt-1">
            {ai.key_points.slice(0, 2).map((pt, i) => (
              <li key={i} className="flex items-start gap-1.5 text-[11px] text-slate-400">
                <span className="text-cyan-400 shrink-0 mt-0.5">›</span>
                <span className="line-clamp-1">{pt}</span>
              </li>
            ))}
          </ul>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between pt-3 border-t mt-auto"
          style={{ borderColor: `${sent.dot}15` }}>
          <div className="flex items-center gap-2">
            {item.source && (
              <span className="font-mono text-[10px] text-slate-500 truncate max-w-[80px]">{item.source}</span>
            )}
            {ai?.reading_time_min && (
              <span className="font-mono text-[10px] text-slate-600">{ai.reading_time_min}m</span>
            )}
          </div>
          <span className="font-mono text-[11px] font-bold" style={{ color: sent.text }}>
            {trend.symbol} {sent.label === 'Good News' ? 'Rising' : sent.label === 'Bad News' ? 'Concern' : 'Stable'}
          </span>
        </div>
      </div>
    </motion.div>
  );
}

function FeedModal({
  items, loading, error, onClose, onRefresh,
}: {
  items: InsightItem[]; loading: boolean; error: string | null;
  onClose: () => void; onRefresh: () => void;
}) {
  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex flex-col"
        style={{ background: 'rgba(2,6,16,0.97)', backdropFilter: 'blur(24px)' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b"
          style={{ borderColor: 'rgba(0,217,255,0.1)' }}>
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 rounded-full bg-cyan-500 animate-ping" />
            <span className="font-mono text-[11px] uppercase tracking-[0.3em] text-cyan-400/80">
              Live Intelligence Feed
            </span>
            {items.length > 0 && (
              <span className="font-mono text-[10px] px-2 py-0.5 rounded-full"
                style={{ background: 'rgba(0,217,255,0.1)', color: '#00d9ff' }}>
                {items.length} signals
              </span>
            )}
          </div>
          <div className="flex items-center gap-3">
            <button onClick={onRefresh} disabled={loading}
              className="p-2 rounded-lg transition-colors hover:bg-white/5 disabled:opacity-40"
              style={{ border: '1px solid rgba(255,255,255,0.08)' }}>
              <RefreshCw className={`w-4 h-4 text-slate-400 ${loading ? 'animate-spin' : ''}`} />
            </button>
            <button onClick={onClose}
              className="px-4 py-2 rounded-xl font-mono text-[11px] uppercase tracking-wider transition-all hover:bg-white/5"
              style={{ border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.5)' }}>
              Close
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-6">
          {loading && (
            <div className="flex flex-col items-center justify-center h-64 gap-4">
              <Loader2 className="w-8 h-8 text-cyan-400 animate-spin" />
              <p className="font-mono text-[12px] text-slate-500 tracking-wider">Syncing intelligence signals…</p>
            </div>
          )}
          {error && (
            <div className="flex flex-col items-center justify-center h-64 gap-4">
              <p className="font-mono text-[13px] text-red-400">{error}</p>
              <button onClick={onRefresh}
                className="font-mono text-[11px] uppercase px-4 py-2 rounded-lg"
                style={{ border: '1px solid rgba(0,217,255,0.3)', color: '#00d9ff' }}>
                Retry
              </button>
            </div>
          )}
          {!loading && !error && items.length === 0 && (
            <div className="flex flex-col items-center justify-center h-64 gap-3 text-slate-500">
              <Network className="w-10 h-10 opacity-20" />
              <p className="font-mono text-[13px] tracking-wider">No signals found</p>
            </div>
          )}
          {!loading && !error && items.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {items.map((item, idx) => (
                <FeedCard key={item.id || item.article_id} item={item} idx={idx} />
              ))}
            </div>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main IntelligenceTicker
// ─────────────────────────────────────────────────────────────────────────────

export const IntelligenceTicker: React.FC = () => {
  const user      = useAuthStore(s => s.user);
  const isAuthed  = !!user;

  const [signals,     setSignals]     = useState(STATIC_SIGNALS as any[]);
  const [loading,     setLoading]     = useState(false);
  const [error,       setError]       = useState<string | null>(null);
  const [showFeed,    setShowFeed]    = useState(false);
  const [feedItems,   setFeedItems]   = useState<InsightItem[]>([]);
  const [feedLoading, setFeedLoading] = useState(false);
  const [feedError,   setFeedError]   = useState<string | null>(null);

  // Fetch live signals for the ticker strip when logged in
  useEffect(() => {
    if (!isAuthed) { setSignals(STATIC_SIGNALS as any[]); return; }
    setLoading(true);
    setError(null);
    api.insights
      .list()
      .then((data: any) => {
        const list: InsightItem[] = Array.isArray(data?.insights) ? data.insights
          : Array.isArray(data) ? data : [];
        if (list.length === 0) { setSignals(STATIC_SIGNALS as any[]); return; }
        const mapped = list.slice(0, 16).map((item, idx) => {
          const ai      = item.ai_insight;
          const sentKey = (ai?.sentiment_label ?? 'neutral_news') as keyof typeof SENTIMENT_TREND;
          const trend   = SENTIMENT_TREND[sentKey] ?? SENTIMENT_TREND.neutral_news;
          return {
            icon:  getIcon(idx),
            label: item.title,
            trend: {
              value: ai?.domain || item.topic || item.source || 'Signal',
              isUp:  trend.isUp,
            },
            raw: item,
          };
        });
        setSignals(mapped);
        setFeedItems(list);
      })
      .catch((err: any) => {
        setError(err?.message ?? 'Failed to load signals');
        setSignals(STATIC_SIGNALS as any[]);
      })
      .finally(() => setLoading(false));
  }, [isAuthed]);

  // Load full feed when modal opens
  const openFeed = () => {
    setShowFeed(true);
    if (feedItems.length > 0) return; // already loaded
    setFeedLoading(true);
    setFeedError(null);
    api.insights
      .list()
      .then((data: any) => {
        const list: InsightItem[] = Array.isArray(data?.insights) ? data.insights
          : Array.isArray(data) ? data : [];
        setFeedItems(list);
      })
      .catch((err: any) => setFeedError(err?.message ?? 'Failed to load feed'))
      .finally(() => setFeedLoading(false));
  };

  const refreshFeed = () => {
    setFeedLoading(true);
    setFeedError(null);
    api.insights
      .list()
      .then((data: any) => {
        const list: InsightItem[] = Array.isArray(data?.insights) ? data.insights
          : Array.isArray(data) ? data : [];
        setFeedItems(list);
      })
      .catch((err: any) => setFeedError(err?.message ?? 'Failed to load feed'))
      .finally(() => setFeedLoading(false));
  };

  return (
    <>
      <section className="relative py-12 overflow-hidden">
        {/* Decorative line */}
        <div className="absolute inset-0 flex items-center justify-center opacity-20 pointer-events-none">
          <div className="w-[800px] h-[1px] bg-gradient-to-r from-transparent via-cyan-500 to-transparent" />
        </div>

        {/* Header row */}
        <div className="container mx-auto px-4 mb-6 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-cyan-500 animate-ping" />
            <h3 className="text-[10px] uppercase tracking-[0.3em] font-bold text-cyan-500/70 dark:text-cyan-400/70">
              Live Intelligence Network
            </h3>
            {loading && <Loader2 className="w-3 h-3 text-cyan-400/50 animate-spin ml-1" />}
          </div>
          <div className="flex items-center gap-4">
            <div className="text-[10px] uppercase tracking-[0.2em] font-medium text-slate-500 dark:text-slate-400">
              Signal Synchronicity: {isAuthed ? (error ? 'Error' : loading ? 'Syncing…' : 'Optimal') : 'Locked'}
            </div>
            {/* View full feed button — auth required */}
            {isAuthed && (
              <button
                onClick={openFeed}
                className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-widest px-3 py-1.5 rounded-lg transition-all hover:scale-105"
                style={{
                  background: 'rgba(0,217,255,0.08)',
                  border: '1px solid rgba(0,217,255,0.2)',
                  color: '#00d9ff',
                }}
              >
                View Feed
                <ChevronRight className="w-3 h-3" />
              </button>
            )}
          </div>
        </div>

        {/* Ticker OR auth gate */}
        {isAuthed ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
          >
            <TickerTrack speed={45}>
              {signals.map((signal, index) => (
                <TickerItem
                  key={index}
                  icon={signal.icon}
                  label={signal.label}
                  trend={signal.trend}
                />
              ))}
            </TickerTrack>
          </motion.div>
        ) : (
          /* Not logged in — show blurred ticker + login gate overlay */
          <div className="relative" style={{ minHeight: 64 }}>
            <AuthGate />
          </div>
        )}

        {/* Atmospheric glow */}
        <div className="absolute -bottom-10 left-1/2 -translate-x-1/2 w-1/2 h-20 bg-cyan-500/5 blur-[100px] rounded-full pointer-events-none" />
      </section>

      {/* Full-screen feed modal */}
      {showFeed && isAuthed && (
        <FeedModal
          items={feedItems}
          loading={feedLoading}
          error={feedError}
          onClose={() => setShowFeed(false)}
          onRefresh={refreshFeed}
        />
      )}
    </>
  );
};
