/**
 * RelatedContentFloatingPanel — global floating version
 * Mounted once in App.tsx inside <BrowserRouter>.
 * Auto-activates when URL has ?explainer= or ?research= or is /blog/:id.
 *
 * Place at: src/components/RelatedContentFloatingPanel.tsx
 */

import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, useLocation, useSearchParams } from 'react-router-dom';
import {
  Lightbulb, FlaskConical, BookOpen, Layers,
  Loader2, X, ChevronDown, ChevronUp,
} from 'lucide-react';
import { useThemeStore } from '@/stores/theme-store';

// ─── types ────────────────────────────────────────────────────────────────────

type Tab = 'explainers' | 'research' | 'intelligence';

interface RelatedItem {
  id: string; title: string; field?: string; readTime?: string;
  keywords: string[];
}

// ─── fetch ────────────────────────────────────────────────────────────────────

const API_BASE = ((import.meta as any).env?.VITE_API_BASE_URL ?? '').replace(/\/$/, '');

async function apiFetch(path: string): Promise<any> {
  const token = localStorage.getItem('steami_token') ?? localStorage.getItem('token') ?? '';
  const res = await fetch(`${API_BASE}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

// ─── normalise ────────────────────────────────────────────────────────────────

function normExplainers(raw: any): RelatedItem[] {
  const items: any[] = Array.isArray(raw) ? raw : raw?.explainers ?? raw?.items ?? [];
  return items.map(e => ({
    id: e.id, title: e.title ?? 'Untitled',
    field: e.field ?? '', readTime: e.readTime ?? '',
    keywords: [...(e.keyInsights ?? []), ...(e.relatedTopics ?? [])],
  }));
}

function normResearch(raw: any): RelatedItem[] {
  const items: any[] = Array.isArray(raw) ? raw : raw?.articles ?? raw?.items ?? [];
  return items.map(a => ({
    id: a.id, title: a.title ?? 'Untitled',
    field: a.field ?? '', readTime: a.readTime ?? '',
    keywords: [...(a.keyFindings ?? []), ...(a.relatedTopics ?? [])],
  }));
}

function normBlog(raw: any): RelatedItem[] {
  const items: any[] = Array.isArray(raw) ? raw : raw?.posts ?? raw?.items ?? [];
  return items.map(p => ({
    id: p.id, title: p.title ?? 'Untitled',
    field: p.field ?? '', readTime: p.readingTime ?? p.readTime ?? '',
    keywords: [...(p.tags ?? []), ...(p.keyInsights ?? [])],
  }));
}

// ─── relevance ────────────────────────────────────────────────────────────────
/**
 * Same field:        +20
 * Keyword overlap:   +5 each
 * Title word match:  +2 each
 */
function scoreItem(item: RelatedItem, field?: string, keywords?: string[], title?: string): number {
  let s = 0;
  if (field && item.field?.toLowerCase() === field.toLowerCase()) s += 20;
  const itemKw = item.keywords.map(k => k.toLowerCase());
  keywords?.forEach(kw => {
    if (itemKw.some(k => k.includes(kw.toLowerCase()) || kw.toLowerCase().includes(k))) s += 5;
  });
  if (title) {
    title.toLowerCase().split(/\s+/).filter(w => w.length > 4)
      .forEach(w => { if (item.title.toLowerCase().includes(w)) s += 2; });
  }
  return s;
}

function rankItems(items: RelatedItem[], field?: string, kw?: string[], title?: string, excludeId?: string) {
  return items
    .filter(i => i.id !== excludeId)
    .map(i => ({ i, s: scoreItem(i, field, kw, title) }))
    .sort((a, b) => b.s - a.s)
    .map(x => x.i)
    .slice(0, 5);
}

// ─── tab config ───────────────────────────────────────────────────────────────

const TABS: { key: Tab; label: string; Icon: React.ElementType }[] = [
  { key: 'explainers',   label: 'Explainers',   Icon: Lightbulb },
  { key: 'research',     label: 'Research',     Icon: FlaskConical },
  { key: 'intelligence', label: 'Intelligence', Icon: BookOpen },
];

// ─── component ────────────────────────────────────────────────────────────────

export function RelatedContentFloatingPanel() {
  const location   = useLocation();
  const [params]   = useSearchParams();
  const isLight    = useThemeStore(s => s.theme === 'light');

  const explainerId = params.get('explainer');
  const researchId  = params.get('research');
  const blogMatch   = location.pathname.match(/^\/blog\/(.+)$/);
  const blogId      = blogMatch?.[1] ?? null;

  const isActive   = !!(explainerId || researchId || blogId);
  const currentId  = explainerId ?? researchId ?? blogId ?? undefined;
  const defaultTab: Tab = researchId ? 'research' : blogId ? 'intelligence' : 'explainers';

  const [tab, setTab]             = useState<Tab>(defaultTab);
  const [collapsed, setCollapsed] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  const [explainers, setExplainers] = useState<RelatedItem[]>([]);
  const [research, setResearch]     = useState<RelatedItem[]>([]);
  const [blog, setBlog]             = useState<RelatedItem[]>([]);
  const [loading, setLoading]       = useState(false);

  const [currentField, setCurrentField]     = useState<string | undefined>();
  const [currentTitle, setCurrentTitle]     = useState<string | undefined>();
  const [currentKeywords, setCurrentKeywords] = useState<string[]>([]);

  // Reset when content changes
  const prevId = useRef<string | undefined>();
  useEffect(() => {
    if (currentId && currentId !== prevId.current) {
      setDismissed(false);
      setCollapsed(false);
      setTab(defaultTab);
      prevId.current = currentId;
    }
    if (!isActive) setDismissed(false);
  }, [currentId, isActive]);

  // Fetch all data once
  const fetched = useRef(false);
  useEffect(() => {
    if (fetched.current) return;
    fetched.current = true;
    setLoading(true);
    Promise.allSettled([
      apiFetch('/api/explainers'),
      apiFetch('/api/research/articles'),   // ← correct endpoint
      apiFetch('/api/blog'),
    ]).then(([eR, rR, bR]) => {
      if (eR.status === 'fulfilled') setExplainers(normExplainers(eR.value));
      if (rR.status === 'fulfilled') setResearch(normResearch(rR.value));
      if (bR.status === 'fulfilled') setBlog(normBlog(bR.value));
    }).finally(() => setLoading(false));
  }, []);

  // Derive context (field/title/keywords) from fetched data
  useEffect(() => {
    if (!currentId) return;
    if (explainerId) {
      const e = explainers.find(x => x.id === explainerId);
      if (e) { setCurrentField(e.field); setCurrentTitle(e.title); setCurrentKeywords(e.keywords); }
    } else if (researchId) {
      const a = research.find(x => x.id === researchId);
      if (a) { setCurrentField(a.field); setCurrentTitle(a.title); setCurrentKeywords(a.keywords); }
    } else if (blogId) {
      const p = blog.find(x => x.id === blogId);
      if (p) { setCurrentField(p.field); setCurrentTitle(p.title); setCurrentKeywords(p.keywords); }
    }
  }, [currentId, explainerId, researchId, blogId, explainers, research, blog]);

  const lists: Record<Tab, RelatedItem[]> = {
    explainers:   rankItems(explainers, currentField, currentKeywords, currentTitle, currentId),
    research:     rankItems(research,   currentField, currentKeywords, currentTitle, currentId),
    intelligence: rankItems(blog,       currentField, currentKeywords, currentTitle, currentId),
  };

  if (!isActive || dismissed) return null;

  // theme
  const bg        = isLight ? 'rgba(255,255,255,0.97)' : 'rgba(5,14,32,0.97)';
  const borderClr = isLight ? 'rgba(99,179,237,0.35)' : 'rgba(99,179,237,0.22)';
  const cyan      = 'hsl(187 72% 55%)';
  const muted     = isLight ? '#64748b' : '#94a3b8';
  const activeTabBg = isLight ? 'rgba(6,182,212,0.13)' : 'rgba(99,179,237,0.16)';
  const hoverBg   = isLight ? 'rgba(99,179,237,0.08)' : 'rgba(99,179,237,0.1)';
  const fieldClr  = isLight ? '#0369a1' : '#7dd3fc';

  return (
    <AnimatePresence>
      <motion.div
        key="related-float"
        initial={{ opacity: 0, y: 40, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 40, scale: 0.95 }}
        transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
        className="fixed bottom-5 right-5 z-[300] w-[280px] sm:w-[300px] rounded-2xl overflow-hidden shadow-2xl"
        style={{
          background: bg,
          border: `1px solid ${borderClr}`,
          boxShadow: isLight
            ? '0 20px 60px -12px rgba(99,179,237,0.25), 0 8px 24px -4px rgba(0,0,0,0.1)'
            : '0 20px 60px -12px rgba(0,0,0,0.7), 0 8px 24px -4px rgba(99,179,237,0.08)',
        }}
      >
        {/* Title bar */}
        <div
          className="flex items-center justify-between px-4 py-2.5 select-none cursor-pointer"
          style={{
            borderBottom: collapsed ? 'none' : `1px solid ${borderClr}`,
            background: isLight ? 'rgba(240,249,255,0.85)' : 'rgba(3,10,26,0.65)',
          }}
          onClick={() => setCollapsed(c => !c)}
        >
          <div className="flex items-center gap-2">
            <Layers className="w-3.5 h-3.5 shrink-0" style={{ color: cyan }} />
            <span className="font-mono text-[11px] tracking-widest uppercase font-semibold" style={{ color: cyan }}>
              Related Content
            </span>
          </div>
          <div className="flex items-center gap-1" onClick={e => e.stopPropagation()}>
            <button
              onClick={() => setCollapsed(c => !c)}
              className="w-5 h-5 flex items-center justify-center rounded hover:bg-foreground/10 transition-colors"
              style={{ color: muted }}
            >
              {collapsed ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>
            <button
              onClick={() => setDismissed(true)}
              className="w-5 h-5 flex items-center justify-center rounded hover:bg-foreground/10 transition-colors"
              style={{ color: muted }}
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Body */}
        <AnimatePresence initial={false}>
          {!collapsed && (
            <motion.div
              key="body"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.22, ease: [0.4, 0, 0.2, 1] }}
              style={{ overflow: 'hidden' }}
            >
              {/* Tabs */}
              <div className="grid grid-cols-3 gap-1 px-3 pt-3 pb-2">
                {TABS.map(({ key, label, Icon }) => {
                  const active = tab === key;
                  return (
                    <button key={key} onClick={() => setTab(key)}
                      className="flex flex-col items-center justify-center gap-0.5 py-2 px-1 rounded-lg transition-all duration-200"
                      style={{
                        background: active ? activeTabBg : 'transparent',
                        color:      active ? cyan : muted,
                        border:     `1px solid ${active ? borderClr : 'transparent'}`,
                      }}
                    >
                      <Icon className="w-3 h-3 shrink-0" />
                      <span className="font-mono text-[9px] uppercase tracking-wide leading-tight">{label}</span>
                    </button>
                  );
                })}
              </div>

              {/* Divider */}
              <div className="h-px mx-3 mb-1" style={{
                background: isLight ? 'rgba(147,197,253,0.3)' : 'rgba(99,179,237,0.12)',
              }} />

              {/* Items */}
              <div className="px-2 pb-3" style={{ maxHeight: 260, overflowY: 'auto' }}>
                {loading ? (
                  <div className="flex items-center justify-center py-7">
                    <Loader2 className="w-4 h-4 animate-spin" style={{ color: cyan }} />
                  </div>
                ) : (
                  <AnimatePresence mode="wait">
                    <motion.div key={tab}
                      initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -4 }} transition={{ duration: 0.15 }}
                    >
                      {lists[tab].length === 0 ? (
                        <p className="font-mono text-[10px] text-center py-5" style={{ color: muted }}>
                          No related {tab} found.
                        </p>
                      ) : lists[tab].map(item => (
                        <FloatItem key={item.id} item={item} tab={tab}
                          hoverBg={hoverBg} fieldClr={fieldClr} />
                      ))}
                    </motion.div>
                  </AnimatePresence>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </AnimatePresence>
  );
}

function FloatItem({ item, tab, hoverBg, fieldClr }: {
  item: RelatedItem; tab: Tab; hoverBg: string; fieldClr: string;
}) {
  const inner = (
    <>
      <div className="font-serif text-[12px] font-bold text-foreground leading-snug line-clamp-2">{item.title}</div>
      {(item.field || item.readTime) && (
        <div className="font-mono text-[9px] mt-0.5 leading-none" style={{ color: fieldClr }}>
          {[item.field, item.readTime].filter(Boolean).join(' · ')}
        </div>
      )}
    </>
  );
  const cls = 'block w-full text-left px-2 py-2 rounded-lg mb-0.5 transition-colors cursor-pointer';
  const on  = (e: React.MouseEvent<HTMLElement>, active: boolean) =>
    (e.currentTarget.style.background = active ? hoverBg : 'transparent');
  const href =
    tab === 'intelligence' ? `/blog/${item.id}` :
    tab === 'explainers'   ? `/?explainer=${encodeURIComponent(item.id)}` :
                             `/research?research=${encodeURIComponent(item.id)}`;
  return (
    <Link to={href} className={cls}
      style={{ background: 'transparent' }}
      onMouseEnter={e => on(e, true)} onMouseLeave={e => on(e, false)}>
      {inner}
    </Link>
  );
}