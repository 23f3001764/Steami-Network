/**
 * NewsletterTab.tsx  (v5 — Chart.js overhaul)
 * ─────────────────────────────────────────────────────────────────────────────
 * Changes from v4:
 *   - Chart preview: renders live Chart.js canvas from chartjs_config JSON
 *     (no more broken SVG blob URLs or btoa() encoding)
 *   - If chartjs_config is missing (old draft), falls back to <img> with png_b64
 *   - draft.cover_chart_config stores the Chart.js JSON string in MongoDB
 *   - draft.cover_chart_png_b64 stores the pre-rendered PNG base64 data URI
 *   - generateChart() now calls /draft/cover-story-chart and receives both
 *   - Chart.js loaded via CDN <script> tag injected once into document head
 */

import { useEffect, useState, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';
import { api } from '@/lib/api';
import { useAuthStore } from '@/stores/auth-store';
import {
  Send, Eye, Save, Trash2, ChevronDown, ChevronUp,
  Loader2, FileText, BarChart2, Link2, ExternalLink,
  CheckCircle2, AlertCircle, Plus, X as XIcon, Calendar,
} from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────

interface AiInsightArticle {
  id: string;
  title: string;
  fetched_at?: string;
  published_at?: string;
  article_url?: string;
  url?: string;
  short_summary?: string;
  content?: string;
  full_content?: string;
  matched_domains?: string[];
  topic?: string;
  has_insight?: boolean;
  ai_insight?: { summary?: string; emoji?: string; domain?: string; article_url?: string; };
  insight?: { summary?: string; emoji?: string; domain?: string; article_url?: string; };
}

interface ContentItem {
  id: string; title: string; field?: string; date?: string; publishDate?: string;
}

interface KeyStat { label: string; value: string; context: string; }

interface RadarEvent {
  id: string; day: string; month: string; heading: string; text: string;
}

interface NewsletterDraft {
  // Cover signal
  cover_article_id: string;
  cover_article_title: string;
  cover_article_url: string;
  cover_article_date: string;
  cover_insight_summary: string;
  cover_chart_image_url: string;
  cover_chart_explanation: string;
  // V5: Chart.js fields
  cover_chart_config: string;    // JSON string of Chart.js config — for live canvas preview
  cover_chart_png_b64: string;   // PNG base64 data URI — for <img> preview & email
  // Legacy
  cover_chart_svg_data: string;
  // AI cover story extras
  cover_headline: string;
  cover_standfirst: string;
  cover_pull_quote: string;
  cover_key_stats: KeyStat[];
  cover_closing_line: string;
  // Sponsor
  sponsor_name: string; sponsor_message: string;
  sponsor_image_url: string; sponsor_link: string;
  // Content
  explainer_id: string; explainer_title: string; explainer_link: string;
  research_id: string; research_title: string; research_link: string;
  blog_id: string; blog_title: string; blog_link: string;
  // Signal briefs
  signal_brief_ids: string[]; signal_brief_notes: string;
  // On the radar
  on_the_radar: string; radar_events: RadarEvent[];
  // Meta
  frontend_url: string; linkedin_url: string; ad_website_url: string; issue_number: string;
}

const emptyDraft: NewsletterDraft = {
  cover_article_id: '', cover_article_title: '', cover_article_url: '',
  cover_article_date: '', cover_insight_summary: '', cover_chart_image_url: '',
  cover_chart_explanation: '', cover_chart_config: '', cover_chart_png_b64: '',
  cover_chart_svg_data: '', cover_headline: '', cover_standfirst: '',
  cover_pull_quote: '', cover_key_stats: [], cover_closing_line: '',
  sponsor_name: '', sponsor_message: '', sponsor_image_url: '', sponsor_link: '',
  explainer_id: '', explainer_title: '', explainer_link: '',
  research_id: '', research_title: '', research_link: '',
  blog_id: '', blog_title: '', blog_link: '',
  signal_brief_ids: [], signal_brief_notes: '', on_the_radar: '', radar_events: [],
  frontend_url: typeof window !== 'undefined' ? window.location.origin : '',
  linkedin_url: '', ad_website_url: '', issue_number: '',
};

// ─── Chart.js CDN loader ──────────────────────────────────────────────────────

let chartjsLoaded = false;
let chartjsLoading = false;
const chartjsCallbacks: (() => void)[] = [];

function loadChartJs(cb: () => void) {
  if (chartjsLoaded) { cb(); return; }
  chartjsCallbacks.push(cb);
  if (chartjsLoading) return;
  chartjsLoading = true;
  const script = document.createElement('script');
  script.src = 'https://cdn.jsdelivr.net/npm/chart.js@4/dist/chart.umd.min.js';
  script.onload = () => {
    chartjsLoaded = true;
    chartjsCallbacks.forEach((fn) => fn());
    chartjsCallbacks.length = 0;
  };
  script.onerror = () => {
    chartjsLoading = false; // allow retry
  };
  document.head.appendChild(script);
}

// ─── ChartPreview: renders Chart.js config on a canvas ───────────────────────

function ChartPreview({ config, pngB64 }: { config: string; pngB64: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const chartRef  = useRef<any>(null);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState('');

  // Parse config string → object
  const parsed = (() => {
    if (!config) return null;
    try { return typeof config === 'string' ? JSON.parse(config) : config; }
    catch { return null; }
  })();

  useEffect(() => {
    if (!parsed) return;
    loadChartJs(() => setReady(true));
  }, [config]);

  useEffect(() => {
    if (!ready || !parsed || !canvasRef.current) return;
    const ChartJS = (window as any).Chart;
    if (!ChartJS) { setError('Chart.js failed to load'); return; }

    // Destroy previous instance
    if (chartRef.current) {
      try { chartRef.current.destroy(); } catch {}
      chartRef.current = null;
    }

    try {
      // Clone config and ensure responsive is false so it fits our container
      const cfg = JSON.parse(JSON.stringify(parsed));
      if (cfg.options) {
        cfg.options.responsive = false;
        cfg.options.animation  = { duration: 400 };
      }
      chartRef.current = new ChartJS(canvasRef.current, cfg);
      setError('');
    } catch (e: any) {
      setError(`Chart render error: ${e?.message || 'unknown'}`);
    }

    return () => {
      if (chartRef.current) {
        try { chartRef.current.destroy(); } catch {}
        chartRef.current = null;
      }
    };
  }, [ready, config]);

  // If we have a Chart.js config, render the canvas
  if (parsed) {
    return (
      <div className="rounded-md overflow-hidden border border-white/10 bg-white">
        {error ? (
          // Canvas failed — show PNG fallback if available
          pngB64 ? (
            <img src={pngB64} alt="Chart preview" className="w-full max-h-52 object-contain" />
          ) : (
            <div className="flex items-center justify-center h-32 text-[11px] text-red-400">{error}</div>
          )
        ) : (
          <div style={{ position: 'relative', width: '100%', height: '220px', background: '#fff' }}>
            <canvas
              ref={canvasRef}
              width={596}
              height={220}
              style={{ width: '100%', height: '100%', display: 'block' }}
            />
          </div>
        )}
      </div>
    );
  }

  // No Chart.js config — fall back to PNG img or legacy SVG
  if (pngB64) {
    return (
      <div className="rounded-md overflow-hidden border border-white/10 bg-white">
        <img src={pngB64} alt="Chart preview" className="w-full max-h-52 object-contain"
          onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
      </div>
    );
  }

  return null;
}

// ─── Tiny helpers ─────────────────────────────────────────────────────────────

function Field({ label, value, onChange, placeholder = '', disabled = false, hint = '', mono = false }: {
  label: string; value: string; onChange: (v: string) => void;
  placeholder?: string; disabled?: boolean; hint?: string; mono?: boolean;
}) {
  return (
    <div>
      <label className="block text-[11px] text-muted-foreground mb-1">{label}</label>
      {hint && <p className="text-[10px] text-muted-foreground/50 mb-1">{hint}</p>}
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder || label}
        disabled={disabled}
        className={`w-full rounded-md border border-white/10 bg-transparent px-3 py-2 text-[13px] disabled:opacity-40 focus:outline-none focus:border-steami-cyan/40 ${mono ? 'font-mono text-[12px]' : ''}`}
      />
    </div>
  );
}

function TextArea({ label, value, onChange, rows = 4, hint = '' }: {
  label: string; value: string; onChange: (v: string) => void; rows?: number; hint?: string;
}) {
  return (
    <div>
      <label className="block text-[11px] text-muted-foreground mb-1">{label}</label>
      {hint && <p className="text-[10px] text-muted-foreground/50 mb-1">{hint}</p>}
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={label}
        rows={rows}
        className="w-full rounded-md border border-white/10 bg-transparent px-3 py-2 text-[13px] resize-y focus:outline-none focus:border-steami-cyan/40"
      />
    </div>
  );
}

function SectionCard({ title, icon, children, defaultOpen = true }: {
  title: string; icon: string; children: React.ReactNode; defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <section className="glass-card" style={{ overflow: 'visible' }}>
      <button type="button" onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between px-5 py-3.5 hover:bg-white/3 transition-colors">
        <div className="flex items-center gap-2">
          <span>{icon}</span>
          <span className="font-mono text-[11px] uppercase tracking-widest text-muted-foreground">{title}</span>
        </div>
        {open
          ? <ChevronUp className="w-3.5 h-3.5 text-muted-foreground" />
          : <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />}
      </button>
      {open && <div className="px-5 pb-5 pt-3 space-y-3 border-t border-white/8">{children}</div>}
    </section>
  );
}

function AiBtn({ onClick, loading, label, loadingLabel, icon: Icon, disabled = false }: {
  onClick: () => void; loading: boolean; label: string; loadingLabel: string;
  icon: React.ElementType; disabled?: boolean;
}) {
  return (
    <button type="button" onClick={onClick} disabled={loading || disabled}
      className="steami-btn text-[11px] flex items-center gap-1.5 disabled:opacity-40">
      {loading
        ? <><Loader2 className="w-3 h-3 animate-spin" />{loadingLabel}</>
        : <><Icon className="w-3 h-3" />{label}</>}
    </button>
  );
}

function StatusLine({ ok, msg }: { ok: boolean; msg: string }) {
  if (!msg) return null;
  return (
    <div className={`flex items-center gap-1.5 text-[11px] ${ok ? 'text-green-400' : 'text-red-400'}`}>
      {ok ? <CheckCircle2 className="w-3 h-3 shrink-0" /> : <AlertCircle className="w-3 h-3 shrink-0" />}
      {msg}
    </div>
  );
}

function KeyStatsBadges({ stats }: { stats: KeyStat[] }) {
  if (!stats.length) return null;
  return (
    <div className="flex flex-wrap gap-2">
      {stats.map((s, i) => (
        <div key={i} className="rounded-md border border-steami-cyan/20 bg-steami-cyan/5 px-3 py-1.5">
          <span className="font-mono text-steami-cyan font-bold text-[12px]">{s.value}</span>
          <span className="ml-1.5 text-muted-foreground text-[11px]">{s.label}</span>
          {s.context && <p className="text-[10px] text-muted-foreground/60 mt-0.5">{s.context}</p>}
        </div>
      ))}
    </div>
  );
}

// ─── Portal Dropdown ──────────────────────────────────────────────────────────

function PortalDropdown({ triggerRef, open, children }: {
  triggerRef: React.RefObject<HTMLButtonElement>; open: boolean; children: React.ReactNode;
}) {
  const [coords, setCoords] = useState({ top: 0, left: 0, width: 0 });
  useEffect(() => {
    if (!open || !triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    const spaceBelow = window.innerHeight - rect.bottom;
    const listHeight = 224;
    const openUpward = spaceBelow < listHeight + 8;
    setCoords({
      top: openUpward ? rect.top + window.scrollY - listHeight - 4 : rect.bottom + window.scrollY + 4,
      left: rect.left + window.scrollX, width: rect.width,
    });
  }, [open, triggerRef]);
  if (!open) return null;
  return createPortal(
    <div style={{ position: 'absolute', top: coords.top, left: coords.left, width: coords.width, zIndex: 9999 }}>
      {children}
    </div>,
    document.body,
  );
}

// ─── ContentDropdown ─────────────────────────────────────────────────────────

function ContentDropdown({ label, items, selectedId, onSelect, buildLink }: {
  label: string; items: ContentItem[]; selectedId: string;
  onSelect: (item: ContentItem, link: string) => void; buildLink: (id: string) => string;
}) {
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null!);
  const dropRef    = useRef<HTMLDivElement>(null);
  const selected   = items.find((i) => i.id === selectedId);

  useEffect(() => {
    if (!open) return;
    const h = (e: MouseEvent) => {
      const t = e.target as Node;
      if (triggerRef.current && !triggerRef.current.contains(t) && dropRef.current && !dropRef.current.contains(t)) setOpen(false);
    };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, [open]);

  const listContent = (
    <div ref={dropRef} className="max-h-56 overflow-y-auto rounded-md border border-white/15 bg-[#0a1228] shadow-2xl"
      style={{ boxShadow: '0 8px 32px rgba(0,0,0,0.6)' }}>
      <button type="button" onClick={() => { onSelect({ id: '', title: '' }, ''); setOpen(false); }}
        className="w-full text-left px-3 py-2.5 text-[12px] text-muted-foreground/60 hover:bg-white/5 border-b border-white/8 transition-colors">
        — none —
      </button>
      {items.length === 0 && <p className="px-3 py-3 text-[12px] text-muted-foreground/50 italic">No items loaded yet</p>}
      {items.map((item) => (
        <button key={item.id} type="button" onClick={() => { onSelect(item, buildLink(item.id)); setOpen(false); }}
          className={`w-full text-left px-3 py-2.5 text-[13px] hover:bg-white/5 border-b border-white/5 last:border-0 transition-colors ${item.id === selectedId ? 'bg-steami-cyan/8 text-steami-cyan' : 'text-foreground'}`}>
          <div className="font-medium truncate leading-snug">{item.title}</div>
          {(item.date || item.publishDate || item.field) && (
            <div className="text-[10px] text-muted-foreground/60 mt-0.5 flex gap-2">
              {item.field && <span className="uppercase tracking-wide">{item.field}</span>}
              {(item.date || item.publishDate) && <span>{item.date || item.publishDate}</span>}
            </div>
          )}
        </button>
      ))}
    </div>
  );

  return (
    <div className="relative">
      <label className="block text-[11px] text-muted-foreground mb-1">{label}</label>
      <button ref={triggerRef} type="button" onClick={() => setOpen((v) => !v)}
        className={`w-full flex items-center justify-between rounded-md border px-3 py-2 text-[13px] text-left transition-colors ${open ? 'border-steami-cyan/40 bg-white/3' : 'border-white/10 bg-transparent hover:border-white/20'}`}>
        <span className={selected ? 'text-foreground' : 'text-muted-foreground/40'}>
          {selected ? <span className="truncate block max-w-[calc(100%-1.5rem)]">{selected.title}</span> : '— none —'}
        </span>
        {open ? <ChevronUp className="w-3.5 h-3.5 shrink-0 text-muted-foreground" /> : <ChevronDown className="w-3.5 h-3.5 shrink-0 text-muted-foreground" />}
      </button>
      <PortalDropdown triggerRef={{ current: triggerRef.current }} open={open}>{listContent}</PortalDropdown>
    </div>
  );
}

// ─── ArticleDropdown ─────────────────────────────────────────────────────────

function ArticleDropdown({ label, articles, selectedId, onSelect }: {
  label: string; articles: AiInsightArticle[]; selectedId: string;
  onSelect: (art: AiInsightArticle | null) => void;
}) {
  const [open, setOpen]     = useState(false);
  const [search, setSearch] = useState('');
  const triggerRef = useRef<HTMLButtonElement>(null!);
  const dropRef    = useRef<HTMLDivElement>(null);
  const searchRef  = useRef<HTMLInputElement>(null);
  const selected   = articles.find((a) => a.id === selectedId);

  useEffect(() => {
    if (!open) { setSearch(''); return; }
    setTimeout(() => searchRef.current?.focus(), 60);
    const h = (e: MouseEvent) => {
      const t = e.target as Node;
      if (triggerRef.current && !triggerRef.current.contains(t) && dropRef.current && !dropRef.current.contains(t)) setOpen(false);
    };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, [open]);

  const filtered = search.trim()
    ? articles.filter((a) => a.title.toLowerCase().includes(search.toLowerCase()))
    : articles;

  const listContent = (
    <div ref={dropRef} className="rounded-md border border-white/15 bg-[#0a1228] shadow-2xl overflow-hidden"
      style={{ boxShadow: '0 8px 32px rgba(0,0,0,0.6)' }}>
      <div className="p-2 border-b border-white/8">
        <input ref={searchRef} value={search} onChange={(e) => setSearch(e.target.value)}
          placeholder="Search articles…"
          className="w-full rounded bg-white/5 border border-white/10 px-2.5 py-1.5 text-[12px] focus:outline-none focus:border-steami-cyan/30 placeholder:text-muted-foreground/30" />
      </div>
      <div className="max-h-52 overflow-y-auto">
        <button type="button" onClick={() => { onSelect(null); setOpen(false); }}
          className="w-full text-left px-3 py-2.5 text-[12px] text-muted-foreground/60 hover:bg-white/5 border-b border-white/8 transition-colors">
          — none —
        </button>
        {filtered.length === 0 && <p className="px-3 py-3 text-[12px] text-muted-foreground/50 italic">No articles found</p>}
        {filtered.map((art) => {
          const ins = art.insight ?? art.ai_insight;
          return (
            <button key={art.id} type="button" onClick={() => { onSelect(art); setOpen(false); }}
              className={`w-full text-left px-3 py-2.5 text-[13px] hover:bg-white/5 border-b border-white/5 last:border-0 transition-colors ${art.id === selectedId ? 'bg-steami-cyan/8 text-steami-cyan' : 'text-foreground'}`}>
              <div className="flex items-center gap-1.5">
                {ins?.emoji && <span className="shrink-0 text-[13px]">{ins.emoji}</span>}
                <span className="font-medium truncate text-[13px] leading-snug">{art.title}</span>
              </div>
              <div className="text-[10px] text-muted-foreground/50 flex gap-2 mt-0.5">
                {ins?.domain && <span className="font-mono uppercase tracking-wide">{ins.domain}</span>}
                {art.fetched_at && <span>· {new Date(art.fetched_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );

  return (
    <div className="relative">
      <label className="block text-[11px] text-muted-foreground mb-1">{label}</label>
      <button ref={triggerRef} type="button" onClick={() => setOpen((v) => !v)}
        className={`w-full flex items-center justify-between rounded-md border px-3 py-2 text-[13px] text-left transition-colors ${open ? 'border-steami-cyan/40 bg-white/3' : 'border-white/10 bg-transparent hover:border-white/20'}`}>
        <span className="flex items-center gap-2 min-w-0 flex-1">
          {selected ? (
            <>
              {(selected.insight?.emoji || selected.ai_insight?.emoji) && (
                <span className="shrink-0 text-[13px]">{selected.insight?.emoji || selected.ai_insight?.emoji}</span>
              )}
              <span className="truncate text-foreground">{selected.title}</span>
            </>
          ) : (
            <span className="text-muted-foreground/40">— none selected —</span>
          )}
        </span>
        {open ? <ChevronUp className="w-3.5 h-3.5 shrink-0 ml-2 text-muted-foreground" /> : <ChevronDown className="w-3.5 h-3.5 shrink-0 ml-2 text-muted-foreground" />}
      </button>
      <PortalDropdown triggerRef={{ current: triggerRef.current }} open={open}>{listContent}</PortalDropdown>
    </div>
  );
}

// ─── Signal Brief Multi-selector ──────────────────────────────────────────────

function SignalBriefSelector({ articles, selected, onChange }: {
  articles: AiInsightArticle[]; selected: string[]; onChange: (ids: string[]) => void;
}) {
  const insightArticles = articles.filter((a) => a.has_insight || a.ai_insight || a.insight);
  const toggle = (id: string) => {
    if (selected.includes(id)) onChange(selected.filter((s) => s !== id));
    else if (selected.length < 5) onChange([...selected, id]);
  };
  if (insightArticles.length === 0) {
    return (
      <div className="rounded-md border border-white/8 bg-white/2 px-4 py-3 text-center">
        <p className="text-[12px] text-muted-foreground/50">No AI-insight articles found.</p>
      </div>
    );
  }
  return (
    <div className="space-y-1.5 max-h-64 overflow-y-auto pr-1">
      {insightArticles.map((art) => {
        const ins  = art.insight ?? art.ai_insight;
        const isSel = selected.includes(art.id);
        const date  = art.fetched_at ? new Date(art.fetched_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '';
        const atLimit = selected.length >= 5 && !isSel;
        return (
          <button key={art.id} type="button" onClick={() => !atLimit && toggle(art.id)} disabled={atLimit}
            className={`w-full text-left rounded-md border px-3 py-2.5 text-[13px] transition-colors ${isSel ? 'border-steami-cyan/40 bg-steami-cyan/5' : atLimit ? 'border-white/5 opacity-40 cursor-not-allowed' : 'border-white/10 hover:bg-white/3 hover:border-white/20'}`}>
            <div className="flex items-start gap-2">
              <span className={`mt-0.5 text-[10px] font-mono shrink-0 w-3.5 ${isSel ? 'text-steami-cyan' : 'text-muted-foreground/30'}`}>
                {isSel ? '✓' : '○'}
              </span>
              <div className="min-w-0 flex-1">
                <div className={`font-medium truncate text-[12px] leading-snug ${isSel ? 'text-steami-cyan' : 'text-foreground'}`}>{art.title}</div>
                <div className="text-[10px] text-muted-foreground/50 flex gap-2 mt-0.5">
                  {ins?.emoji && <span>{ins.emoji}</span>}
                  {ins?.domain && <span className="font-mono uppercase tracking-wide">{ins.domain}</span>}
                  {date && <span>· {date}</span>}
                </div>
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
}

// ─── Radar helpers ────────────────────────────────────────────────────────────

function radarEventsToText(events: RadarEvent[]): string {
  return events.map((ev) => {
    const header = ev.day && ev.month ? `${ev.day}\n${ev.month}` : '';
    const body   = [ev.heading, ev.text].filter(Boolean).join('\n');
    return header ? `${header}\n${body}` : body;
  }).join('\n\n');
}

function textToRadarEvents(text: string): RadarEvent[] {
  if (!text.trim()) return [];
  const blocks = text.trim().split(/\n{2,}/);
  const results: RadarEvent[] = [];
  for (const block of blocks) {
    const lines = block.trim().split('\n').map((l) => l.trim()).filter(Boolean);
    if (!lines.length) continue;
    let day = '', month = '', bodyStart = 0;
    if (lines.length >= 2 && /^\d{1,2}$/.test(lines[0]) && /^[A-Za-z]{3,9}$/.test(lines[1])) {
      day = lines[0]; month = lines[1]; bodyStart = 2;
    } else {
      const m1 = lines[0].match(/^(\d{1,2})\s+([A-Za-z]{3,9})$/);
      const m2 = lines[0].match(/^([A-Za-z]{3,9})\s+(\d{1,2})$/);
      if (m1) { day = m1[1]; month = m1[2]; bodyStart = 1; }
      else if (m2) { day = m2[2]; month = m2[1]; bodyStart = 1; }
    }
    const bodyLines = lines.slice(bodyStart);
    const heading   = bodyLines[0] ?? '';
    const descLines = bodyLines.slice(1);
    results.push({
      id: crypto.randomUUID(), day, month: month
        ? (month.charAt(0).toUpperCase() + month.slice(1).toLowerCase()).slice(0, 3) : '',
      heading, text: descLines.join('\n'),
    });
  }
  return results;
}

// ─── RadarEventEditor ─────────────────────────────────────────────────────────

const MONTH_OPTS = [
  { val: '', label: 'Month' },
  { val: 'Jan', label: 'Jan' }, { val: 'Feb', label: 'Feb' },
  { val: 'Mar', label: 'Mar' }, { val: 'Apr', label: 'Apr' },
  { val: 'May', label: 'May' }, { val: 'Jun', label: 'Jun' },
  { val: 'Jul', label: 'Jul' }, { val: 'Aug', label: 'Aug' },
  { val: 'Sep', label: 'Sep' }, { val: 'Oct', label: 'Oct' },
  { val: 'Nov', label: 'Nov' }, { val: 'Dec', label: 'Dec' },
];

function RadarEventEditor({ events, onChange }: { events: RadarEvent[]; onChange: (evs: RadarEvent[]) => void; }) {
  const addEvent = () => onChange([...events, { id: crypto.randomUUID(), day: '', month: '', heading: '', text: '' }]);
  const remove   = (id: string) => onChange(events.filter((e) => e.id !== id));
  const update   = (id: string, patch: Partial<RadarEvent>) => onChange(events.map((e) => e.id === id ? { ...e, ...patch } : e));
  const selectCls = 'rounded-md border border-white/10 bg-[#0a1228] text-[13px] text-foreground px-2 py-1.5 focus:outline-none focus:border-steami-cyan/40 cursor-pointer appearance-none';

  return (
    <div className="space-y-3">
      {events.length === 0 && (
        <div className="rounded-md border border-white/8 bg-white/2 px-4 py-3 text-center">
          <p className="text-[12px] text-muted-foreground/50">No events yet. Click + Add Event to add an upcoming date.</p>
        </div>
      )}
      {events.map((ev, idx) => (
        <div key={ev.id} className="rounded-lg border border-white/10 bg-white/[0.02] overflow-visible">
          <div className="flex items-center gap-2 px-3 py-2 border-b border-white/8">
            <Calendar className="w-3.5 h-3.5 text-steami-cyan/50 shrink-0" />
            <span className="font-mono text-[10px] text-muted-foreground/40 uppercase tracking-widest flex-1">Event {idx + 1}</span>
            <button type="button" onClick={() => remove(ev.id)} className="text-muted-foreground/30 hover:text-red-400 transition-colors p-0.5">
              <XIcon className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="p-3 space-y-3">
            <div className="flex items-center gap-2">
              <span className="text-[11px] text-muted-foreground/50 shrink-0 w-8">Date</span>
              <input type="text" value={ev.day} onChange={(e) => update(ev.id, { day: e.target.value })}
                placeholder="14" maxLength={2}
                className="w-12 rounded-md border border-white/10 bg-transparent px-2 py-1.5 text-[13px] text-center focus:outline-none focus:border-steami-cyan/40" />
              <select value={ev.month} onChange={(e) => update(ev.id, { month: e.target.value })} className={selectCls}>
                {MONTH_OPTS.map((m) => <option key={m.val} value={m.val}>{m.label}</option>)}
              </select>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] text-muted-foreground/50 shrink-0 w-8">Name</span>
              <input type="text" value={ev.heading ?? ''} onChange={(e) => update(ev.id, { heading: e.target.value })}
                placeholder="Event name / headline"
                className="flex-1 rounded-md border border-white/10 bg-transparent px-3 py-2 text-[13px] font-medium focus:outline-none focus:border-steami-cyan/40" />
            </div>
            <div className="flex items-start gap-2">
              <span className="text-[11px] text-muted-foreground/50 shrink-0 w-8 pt-2">Info</span>
              <textarea value={ev.text} onChange={(e) => update(ev.id, { text: e.target.value })}
                placeholder="Details, links, etc. URLs are auto-linked in the email." rows={2}
                className="flex-1 rounded-md border border-white/10 bg-transparent px-3 py-2 text-[13px] resize-y focus:outline-none focus:border-steami-cyan/40" />
            </div>
          </div>
        </div>
      ))}
      <button type="button" onClick={addEvent}
        className="steami-btn text-[11px] flex items-center gap-1.5 w-full justify-center opacity-70 hover:opacity-100 transition-opacity">
        <Plus className="w-3 h-3" /> Add Event
      </button>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export function NewsletterTab() {
  const user    = useAuthStore((s) => s.user);
  const isAdmin = user?.role === 'admin';
  const isMod   = user?.role === 'mod' || user?.role === 'moderator' || isAdmin;
  const canSend = isAdmin || isMod;

  const [draft,      setDraft]      = useState<NewsletterDraft>(emptyDraft);
  const [articles,   setArticles]   = useState<AiInsightArticle[]>([]);
  const [explainers, setExplainers] = useState<ContentItem[]>([]);
  const [researches, setResearches] = useState<ContentItem[]>([]);
  const [blogs,      setBlogs]      = useState<ContentItem[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [loadError,  setLoadError]  = useState('');

  const [genCoverLoading, setGenCoverLoading] = useState(false);
  const [genChartLoading, setGenChartLoading] = useState(false);
  const [saveLoading,     setSaveLoading]     = useState(false);
  const [sendLoading,     setSendLoading]     = useState(false);
  const [testEmail,       setTestEmail]       = useState('');
  const [testSendLoading, setTestSendLoading] = useState(false);

  const [coverStatus, setCoverStatus] = useState({ ok: true, msg: '' });
  const [chartStatus, setChartStatus] = useState({ ok: true, msg: '' });
  const [saveStatus,  setSaveStatus]  = useState({ ok: true, msg: '' });
  const [sendStatus,  setSendStatus]  = useState({ ok: true, msg: '' });
  const [testStatus,  setTestStatus]  = useState({ ok: true, msg: '' });
  const [prevStatus,  setPrevStatus]  = useState({ ok: true, msg: '' });

  const [previewHtml, setPreviewHtml] = useState('');
  const [showPreview, setShowPreview] = useState(false);

  const sf = <K extends keyof NewsletterDraft>(k: K) => (v: string) =>
    setDraft((d) => ({ ...d, [k]: v as NewsletterDraft[K] }));

  const normalize = (raw: any): AiInsightArticle => ({
    ...raw,
    insight: raw.insight ?? (raw.ai_insight ? {
      summary: raw.ai_insight.summary ?? '', emoji: raw.ai_insight.emoji ?? '',
      domain: raw.ai_insight.domain ?? '', article_url: raw.ai_insight.article_url ?? raw.article_url ?? '',
    } : undefined),
    short_summary: raw.short_summary || raw.ai_insight?.summary || '',
    has_insight: raw.has_insight ?? !!(raw.ai_insight || raw.insight),
  });

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true); setLoadError('');
      try {
        const [directArts, feedArts, exps, res, blg] = await Promise.allSettled([
          api.articles
            ? api.articles.list({ limit: 100 })
            : fetch('/api/articles?limit=100').then((r) => { if (!r.ok) throw new Error(`HTTP ${r.status}`); return r.json(); }),
          api.feed.items(),
          api.content.cmsExplainers(),
          api.content.cmsResearch(),
          api.content.cmsBlog(),
        ]);
        if (cancelled) return;

        const apiRaw: AiInsightArticle[] = directArts.status === 'fulfilled'
          ? (Array.isArray(directArts.value) ? directArts.value : (directArts.value?.articles ?? directArts.value?.items ?? [])).map(normalize)
          : [];
        const feedRaw: AiInsightArticle[] = feedArts.status === 'fulfilled'
          ? (Array.isArray(feedArts.value) ? feedArts.value : (feedArts.value?.items ?? [])).map(normalize)
          : [];

        const merged = [...apiRaw];
        for (const art of feedRaw) {
          if (!merged.some((a) => a.id === art.id)) merged.push(art);
        }
        setArticles([...merged].sort((a, b) => (b.fetched_at ?? b.published_at ?? '').localeCompare(a.fetched_at ?? a.published_at ?? '')));

        if (directArts.status === 'rejected' && feedArts.status === 'rejected') {
          setLoadError('Could not load articles. Check your connection or auth token.');
        }

        const normItems = (r: PromiseSettledResult<any>, keys: string[]): ContentItem[] => {
          if (r.status !== 'fulfilled') return [];
          const raw = Array.isArray(r.value) ? r.value : keys.reduce<any[]>((a, k) => a.length ? a : (r.value?.[k] ?? []), []);
          return [...raw].reverse();
        };
        setExplainers(normItems(exps, ['explainers']));
        setResearches(normItems(res, ['research', 'articles']));
        setBlogs(normItems(blg, ['posts', 'articles', 'blogs']));

        try {
          const saved = await api.newsletter.getDraft();
          if (!cancelled && saved?.draft) {
            const loaded = { ...emptyDraft, ...saved.draft };
            if (!loaded.radar_events?.length && loaded.on_the_radar) {
              loaded.radar_events = textToRadarEvents(loaded.on_the_radar);
            }
            setDraft(loaded);
          }
        } catch { /* no draft yet */ }
      } catch (e: any) {
        if (!cancelled) setLoadError(e.message || 'Failed to load newsletter data.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const base          = (draft.frontend_url || window.location.origin).replace(/\/$/, '');
  const insightLink   = (id: string) => `${base}/?insight=${encodeURIComponent(id)}`;
  const explainerLink = (id: string) => `${base}/?explainer=${encodeURIComponent(id)}`;
  const researchLink  = (id: string) => `${base}/research?research=${encodeURIComponent(id)}`;
  const blogLink      = (id: string) => `${base}/blog/${encodeURIComponent(id)}`;

  const selectCoverArticle = useCallback((art: AiInsightArticle | null) => {
    if (!art) { setDraft((d) => ({ ...d, cover_article_id: '', cover_article_title: '' })); return; }
    const date = art.fetched_at ? new Date(art.fetched_at).toLocaleDateString('en-US', { dateStyle: 'long' }) : '';
    const ins  = art.insight ?? art.ai_insight;
    setDraft((d) => ({
      ...d,
      cover_article_id: art.id, cover_article_title: art.title,
      cover_article_url: art.article_url || art.url || '',
      cover_article_date: date, cover_insight_summary: ins?.summary || art.short_summary || '',
      cover_headline: '', cover_standfirst: '', cover_pull_quote: '',
      cover_key_stats: [], cover_closing_line: '',
      cover_chart_image_url: '', cover_chart_explanation: '',
      cover_chart_config: '', cover_chart_png_b64: '', cover_chart_svg_data: '',
    }));
    setCoverStatus({ ok: true, msg: '' });
    setChartStatus({ ok: true, msg: '' });
  }, []);

  const buildArticlePayload = useCallback((art: AiInsightArticle) => {
    const ins = art.insight ?? art.ai_insight;
    return {
      article_id: art.id, title: art.title,
      content: art.full_content || art.content || '',
      summary: ins?.summary || art.short_summary || '',
      domain: ins?.domain || art.matched_domains?.[0] || art.topic || 'Technology',
      article_url: art.article_url || art.url || '',
      fetched_at: art.fetched_at || '',
      matched_domains: art.matched_domains || [],
    };
  }, []);

  // ── AI: Generate Cover Story ──────────────────────────────────────────────
  const generateCoverStory = async () => {
    const art = articles.find((a) => a.id === draft.cover_article_id);
    if (!art) { setCoverStatus({ ok: false, msg: 'Select a cover article first.' }); return; }
    setGenCoverLoading(true); setCoverStatus({ ok: true, msg: '' });
    try {
      const res = await api.newsletter.generateCoverStory(buildArticlePayload(art));
      setDraft((d) => ({
        ...d,
        cover_headline:        res.headline         || d.cover_article_title,
        cover_standfirst:      res.standfirst        || '',
        cover_insight_summary: res.formatted_summary || d.cover_insight_summary,
        cover_pull_quote:      res.pull_quote        || '',
        cover_key_stats:       res.key_stats         || [],
        cover_closing_line:    res.closing_line      || '',
      }));
      setCoverStatus({ ok: true, msg: 'Cover story generated.' });
    } catch (e: any) {
      setCoverStatus({ ok: false, msg: e.message || 'Cover story generation failed.' });
    } finally {
      setGenCoverLoading(false);
    }
  };

  // ── AI: Generate Chart (V5) ───────────────────────────────────────────────
  const generateChart = async () => {
    const art = articles.find((a) => a.id === draft.cover_article_id);
    if (!art) { setChartStatus({ ok: false, msg: 'Select a cover article first.' }); return; }
    setGenChartLoading(true); setChartStatus({ ok: true, msg: '' });
    try {
      const res = await api.newsletter.generateCoverStoryChart(buildArticlePayload(art));

      // Store Chart.js config as JSON string + pre-rendered PNG base64
      const configStr = res.chartjs_config
        ? (typeof res.chartjs_config === 'string' ? res.chartjs_config : JSON.stringify(res.chartjs_config))
        : '';

      setDraft((d) => ({
        ...d,
        cover_chart_config:      configStr,
        cover_chart_png_b64:     res.chart_png_b64     || '',
        cover_chart_explanation: res.explanation        || d.cover_chart_explanation,
        cover_chart_image_url:   '',    // no longer URL-based
        cover_chart_svg_data:    '',    // clear legacy SVG
      }));

      const renderOk = res.render_ok ?? res.success;
      setChartStatus({
        ok:  renderOk,
        msg: renderOk
          ? `Chart generated (${res.chart_type || 'bar'}) — preview below.`
          : (res.error || 'Chart generated but PNG render failed. Check QuickChart.io connection.'),
      });
    } catch (e: any) {
      setChartStatus({ ok: false, msg: e.message || 'Chart generation failed.' });
    } finally {
      setGenChartLoading(false);
    }
  };

  // ── Save draft ────────────────────────────────────────────────────────────
  const saveDraft = async () => {
    setSaveLoading(true); setSaveStatus({ ok: true, msg: '' });
    try {
      const payload = { ...draft, on_the_radar: radarEventsToText(draft.radar_events) };
      await api.newsletter.saveDraft(payload);
      setSaveStatus({ ok: true, msg: 'Draft saved successfully.' });
    } catch (e: any) {
      setSaveStatus({ ok: false, msg: e.message || 'Failed to save draft.' });
    } finally {
      setSaveLoading(false);
    }
  };

  const loadPreview = async () => {
    setPrevStatus({ ok: true, msg: '' });
    try {
      const payload = { ...draft, on_the_radar: radarEventsToText(draft.radar_events) };
      const res = await api.newsletter.previewDraft(payload);
      setPreviewHtml(res.html || ''); setShowPreview(true);
    } catch (e: any) {
      setPrevStatus({ ok: false, msg: e.message || 'Preview failed.' });
    }
  };

  const sendNewsletter = async () => {
    if (!window.confirm('Send this newsletter to ALL subscribers now?')) return;
    setSendLoading(true); setSendStatus({ ok: true, msg: '' });
    try {
      const payload = { ...draft, on_the_radar: radarEventsToText(draft.radar_events) };
      const res = await api.newsletter.sendCustom(payload);
      setSendStatus({ ok: true, msg: `Sent to ${res.sent} subscriber(s). Failed: ${res.failed}.` });
    } catch (e: any) {
      setSendStatus({ ok: false, msg: e.message || 'Send failed.' });
    } finally {
      setSendLoading(false);
    }
  };

  // ── Send test email ───────────────────────────────────────────────────────
  // POST /api/newsletter/test  body: { to_email, draft? }
  // Mirrors AdminPage's "Send test" — sends the current draft to a single address.
  const sendTestEmail = async () => {
    if (!testEmail.trim()) { setTestStatus({ ok: false, msg: 'Enter a test email address.' }); return; }
    setTestSendLoading(true); setTestStatus({ ok: true, msg: '' });
    try {
      const payload = { ...draft, on_the_radar: radarEventsToText(draft.radar_events) };
      await api.newsletter.test(testEmail.trim(), payload);
      setTestStatus({ ok: true, msg: `Test email sent to ${testEmail}.` });
    } catch (e: any) {
      setTestStatus({ ok: false, msg: e.message || 'Test send failed.' });
    } finally {
      setTestSendLoading(false);
    }
  };

  const hasContent =
    !!draft.cover_article_title || draft.signal_brief_ids.length > 0 ||
    !!draft.on_the_radar.trim() || !!draft.explainer_title ||
    !!draft.research_title || !!draft.blog_title;

  const coverArticle = articles.find((a) => a.id === draft.cover_article_id);

  // Has any chart data to preview
  const hasChartPreview = !!(draft.cover_chart_config || draft.cover_chart_png_b64 || draft.cover_chart_svg_data);

  if (loading) return (
    <div className="flex flex-col items-center justify-center py-20 gap-3 text-muted-foreground">
      <Loader2 className="w-5 h-5 animate-spin" />
      <span className="text-[13px]">Loading articles and content…</span>
    </div>
  );

  return (
    <div className="space-y-4">

      {loadError && (
        <div className="flex items-center gap-2 rounded-md border border-red-500/20 bg-red-500/8 px-4 py-2.5 text-[12px] text-red-400">
          <AlertCircle className="w-3.5 h-3.5 shrink-0" />{loadError}
        </div>
      )}

      {!loadError && (
        <div className="flex items-center gap-2 text-[11px] text-muted-foreground/40 font-mono">
          <span className="h-1.5 w-1.5 rounded-full bg-steami-cyan/60" />
          {articles.length} articles loaded · {articles.filter(a => a.has_insight || a.ai_insight).length} with AI insight
        </div>
      )}

      {/* ── META ──────────────────────────────────────────────────────────── */}
      <SectionCard title="Newsletter Meta" icon="📋" defaultOpen>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Field label="Issue Number" value={draft.issue_number} onChange={sf('issue_number')} placeholder="e.g. 047" />
          <Field label="Frontend App URL" value={draft.frontend_url} onChange={sf('frontend_url')}
            placeholder="https://steami.com" hint="Builds all deep-link URLs." />
          <Field label="LinkedIn URL" value={draft.linkedin_url} onChange={sf('linkedin_url')} placeholder="https://linkedin.com/company/steami" />
          <Field label="Partner Website URL" value={draft.ad_website_url} onChange={sf('ad_website_url')} placeholder="https://partner.example.com" />
        </div>
      </SectionCard>

      {/* ── COVER SIGNAL ──────────────────────────────────────────────────── */}
      <SectionCard title="① Signal — Cover Story" icon="📡" defaultOpen>
        <p className="text-[12px] text-muted-foreground">
          Pick an article and click <strong>AI Generate Cover Story</strong> — or fill manually.
        </p>

        <ArticleDropdown label="AI-Insight Article" articles={articles}
          selectedId={draft.cover_article_id} onSelect={selectCoverArticle} />

        {coverArticle && (
          <div className="rounded-md border border-steami-cyan/20 bg-steami-cyan/5 px-4 py-3 space-y-1">
            <div className="flex items-center gap-2">
              <span>{coverArticle.insight?.emoji || coverArticle.ai_insight?.emoji}</span>
              <span className="font-medium text-[13px] truncate">{coverArticle.title}</span>
            </div>
            <div className="text-[11px] text-muted-foreground flex flex-wrap gap-3">
              {(coverArticle.insight?.domain || coverArticle.ai_insight?.domain) && (
                <span>{coverArticle.insight?.domain || coverArticle.ai_insight?.domain}</span>
              )}
              {coverArticle.fetched_at && (
                <span>{new Date(coverArticle.fetched_at).toLocaleDateString('en-US', { dateStyle: 'long' })}</span>
              )}
              {(coverArticle.article_url || coverArticle.url) && (
                <a href={coverArticle.article_url || coverArticle.url} target="_blank" rel="noopener"
                  className="text-steami-cyan flex items-center gap-1">
                  <ExternalLink className="w-3 h-3" /> Source
                </a>
              )}
            </div>
          </div>
        )}

        <div className="flex flex-wrap items-center gap-2">
          <AiBtn onClick={generateCoverStory} loading={genCoverLoading}
            label="AI Generate Cover Story" loadingLabel="Writing cover story…"
            icon={FileText} disabled={!draft.cover_article_id} />
          {!draft.cover_article_id && <span className="text-[11px] text-muted-foreground/50">Select an article to enable</span>}
        </div>
        <StatusLine {...coverStatus} />

        {draft.cover_headline && (
          <div className="rounded-md border border-white/10 bg-white/3 px-4 py-3 space-y-2">
            <p className="font-mono text-[10px] text-muted-foreground uppercase tracking-wider">AI Cover Story</p>
            <p className="font-semibold text-[15px] leading-tight">{draft.cover_headline}</p>
            {draft.cover_standfirst && <p className="text-[13px] italic text-muted-foreground">{draft.cover_standfirst}</p>}
            {draft.cover_pull_quote && (
              <blockquote className="border-l-2 border-steami-cyan pl-3 text-[13px] text-muted-foreground">
                "{draft.cover_pull_quote}"
              </blockquote>
            )}
            <KeyStatsBadges stats={draft.cover_key_stats} />
            {draft.cover_closing_line && <p className="text-[12px] text-muted-foreground/70 italic">{draft.cover_closing_line}</p>}
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Field label="Article Title (manual override)" value={draft.cover_article_title}
            onChange={sf('cover_article_title')} placeholder="Leave blank to skip cover" />
          <Field label="Article URL" value={draft.cover_article_url}
            onChange={sf('cover_article_url')} placeholder="https://…" mono />
        </div>
        <Field label="Date" value={draft.cover_article_date} onChange={sf('cover_article_date')} placeholder="May 6, 2026" />
        <TextArea label="Cover Story Body" value={draft.cover_insight_summary}
          onChange={sf('cover_insight_summary')} rows={5}
          hint="Auto-filled by AI Generate Cover Story. Fully editable." />

        {/* ── Chart subsection ─────────────────────────────────────────────── */}
        <div className="pt-2 border-t border-white/8 space-y-3">
          <div className="flex flex-wrap items-center gap-2 pt-1">
            <AiBtn onClick={generateChart} loading={genChartLoading}
              label="AI Generate Chart" loadingLabel="Generating chart…"
              icon={BarChart2} disabled={!draft.cover_article_id} />
            <span className="text-[11px] text-muted-foreground/50">
              Renders via Chart.js · saved as PNG for email
            </span>
          </div>
          <StatusLine {...chartStatus} />

          {/* Chart preview — Chart.js canvas if config available, PNG img otherwise */}
          {hasChartPreview && (
            <>
              <ChartPreview
                config={draft.cover_chart_config}
                pngB64={draft.cover_chart_png_b64}
              />
              {/* Show which rendering mode is active */}
              <p className="text-[10px] text-muted-foreground/40 font-mono">
                {draft.cover_chart_config
                  ? '✓ Live Chart.js preview · PNG stored for email delivery'
                  : draft.cover_chart_png_b64
                  ? '✓ PNG preview (email-ready)'
                  : ''}
              </p>
            </>
          )}

          <TextArea label="Chart Explanation / Caption"
            value={draft.cover_chart_explanation} onChange={sf('cover_chart_explanation')} rows={2}
            hint="Shown as caption below the chart in the email." />
        </div>
      </SectionCard>

      {/* ── SPONSOR ───────────────────────────────────────────────────────── */}
      <SectionCard title="② Sponsored · Partner Message" icon="🤝" defaultOpen={false}>
        <p className="text-[12px] text-muted-foreground">All fields optional. Leave blank to skip.</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Field label="Sponsor Name" value={draft.sponsor_name} onChange={sf('sponsor_name')} placeholder="Acme Labs" />
          <Field label="Sponsor Link" value={draft.sponsor_link} onChange={sf('sponsor_link')} placeholder="https://acmelabs.com" mono />
        </div>
        <TextArea label="Partner Message" value={draft.sponsor_message} onChange={sf('sponsor_message')} rows={3} />
        <Field label="Sponsor Banner Image URL" value={draft.sponsor_image_url}
          onChange={sf('sponsor_image_url')} placeholder="https://…/banner.png" mono />
      </SectionCard>

      {/* ── EXPLAINER ─────────────────────────────────────────────────────── */}
      <SectionCard title="③ Explainer Module" icon="💡" defaultOpen={false}>
        <p className="text-[12px] text-muted-foreground">Newest first. Leave unselected to skip.</p>
        <ContentDropdown label="Select Explainer" items={explainers} selectedId={draft.explainer_id}
          onSelect={(item, link) => setDraft((d) => ({ ...d, explainer_id: item.id, explainer_title: item.title, explainer_link: link }))}
          buildLink={explainerLink} />
        {draft.explainer_id && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Field label="Title" value={draft.explainer_title} onChange={sf('explainer_title')} />
            <Field label="Deep Link" value={draft.explainer_link} onChange={sf('explainer_link')} mono />
          </div>
        )}
      </SectionCard>

      {/* ── RESEARCH ──────────────────────────────────────────────────────── */}
      <SectionCard title="④ Research Article" icon="🔬" defaultOpen={false}>
        <p className="text-[12px] text-muted-foreground">Newest first. Leave unselected to skip.</p>
        <ContentDropdown label="Select Research" items={researches} selectedId={draft.research_id}
          onSelect={(item, link) => setDraft((d) => ({ ...d, research_id: item.id, research_title: item.title, research_link: link }))}
          buildLink={researchLink} />
        {draft.research_id && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Field label="Title" value={draft.research_title} onChange={sf('research_title')} />
            <Field label="Deep Link" value={draft.research_link} onChange={sf('research_link')} mono />
          </div>
        )}
      </SectionCard>

      {/* ── BLOG ──────────────────────────────────────────────────────────── */}
      <SectionCard title="⑤ Blog Post" icon="📝" defaultOpen={false}>
        <p className="text-[12px] text-muted-foreground">Newest first. Leave unselected to skip.</p>
        <ContentDropdown label="Select Blog Post" items={blogs} selectedId={draft.blog_id}
          onSelect={(item, link) => setDraft((d) => ({ ...d, blog_id: item.id, blog_title: item.title, blog_link: link }))}
          buildLink={blogLink} />
        {draft.blog_id && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Field label="Title" value={draft.blog_title} onChange={sf('blog_title')} />
            <Field label="Deep Link" value={draft.blog_link} onChange={sf('blog_link')} mono />
          </div>
        )}
      </SectionCard>

      {/* ── SIGNAL BRIEFS ─────────────────────────────────────────────────── */}
      <SectionCard title="⑥ Signal Briefs (up to 5)" icon="⚡" defaultOpen={false}>
        <p className="text-[12px] text-muted-foreground">
          Pick up to 5 AI-insight articles. Their summaries appear as compact briefs.
        </p>
        <SignalBriefSelector articles={articles} selected={draft.signal_brief_ids}
          onChange={(ids) => setDraft((d) => ({ ...d, signal_brief_ids: ids }))} />
        {draft.signal_brief_ids.length > 0 && (
          <div className="space-y-1 pt-1">
            <p className="text-[11px] text-muted-foreground">{draft.signal_brief_ids.length} selected:</p>
            {draft.signal_brief_ids.map((id) => {
              const art = articles.find((a) => a.id === id);
              const ins = art?.insight ?? art?.ai_insight;
              return art ? (
                <div key={id} className="text-[11px] flex items-center gap-2 text-muted-foreground">
                  <span>{ins?.emoji}</span>
                  <span className="truncate flex-1">{art.title}</span>
                  <a href={insightLink(id)} target="_blank" rel="noopener" className="text-steami-cyan shrink-0">
                    <Link2 className="w-3 h-3" />
                  </a>
                </div>
              ) : null;
            })}
          </div>
        )}
        <TextArea label="Editorial Note (shown above briefs)" value={draft.signal_brief_notes}
          onChange={sf('signal_brief_notes')} rows={2} />
      </SectionCard>

      {/* ── ON THE RADAR ──────────────────────────────────────────────────── */}
      <SectionCard title="⑦ On the Radar" icon="📻" defaultOpen={false}>
        <p className="text-[12px] text-muted-foreground">
          Add upcoming events with a date. URLs in descriptions are auto-linked.
        </p>
        <RadarEventEditor events={draft.radar_events}
          onChange={(evs) => setDraft((d) => ({ ...d, radar_events: evs }))} />
        {draft.radar_events.length === 0 && (
          <div className="mt-2 pt-2 border-t border-white/8">
            <p className="text-[11px] text-muted-foreground/40 mb-1.5">Or enter free-form text (legacy):</p>
            <TextArea label="On the Radar (free-form)" value={draft.on_the_radar}
              onChange={sf('on_the_radar')} rows={4} />
          </div>
        )}
      </SectionCard>

      {/* ── ACTION BAR ────────────────────────────────────────────────────── */}
      <div className="glass-card p-4 space-y-3">
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={saveDraft} disabled={saveLoading}
            className="steami-btn text-[11px] flex items-center gap-1.5 disabled:opacity-40">
            {saveLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />}
            Save Draft
          </button>
          <button type="button" onClick={loadPreview} className="steami-btn text-[11px] flex items-center gap-1.5">
            <Eye className="w-3 h-3" /> Preview
          </button>
          {canSend && (
            <button type="button" onClick={sendNewsletter} disabled={sendLoading || !hasContent}
              className="steami-btn text-[11px] flex items-center gap-1.5 disabled:opacity-40">
              {sendLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Send className="w-3 h-3" />}
              Send Newsletter
            </button>
          )}
          <button type="button"
            onClick={() => {
              setDraft(emptyDraft);
              setCoverStatus({ ok: true, msg: '' }); setChartStatus({ ok: true, msg: '' });
              setSaveStatus({ ok: true, msg: '' }); setSendStatus({ ok: true, msg: '' });
              setTestStatus({ ok: true, msg: '' });
              setPrevStatus({ ok: true, msg: '' });
            }}
            className="steami-btn text-[11px] flex items-center gap-1.5 ml-auto">
            <Trash2 className="w-3 h-3" /> Clear
          </button>
        </div>

        {/* ── Test send — POST /api/newsletter/test (mirrors AdminPage) ────── */}
        {canSend && (
          <div className="pt-2 border-t border-white/8 space-y-2">
            <p className="text-[11px] text-muted-foreground/50 font-mono uppercase tracking-widest">Send test</p>
            <div className="flex flex-wrap gap-2">
              <input
                value={testEmail}
                onChange={(e) => { setTestEmail(e.target.value); setTestStatus({ ok: true, msg: '' }); }}
                placeholder="test@example.com"
                className="min-w-0 flex-1 rounded-md border border-white/10 bg-transparent px-3 py-2 text-[13px] focus:outline-none focus:border-steami-cyan/40"
              />
              <button type="button" onClick={sendTestEmail} disabled={testSendLoading || !testEmail.trim()}
                className="steami-btn text-[11px] flex items-center gap-1.5 disabled:opacity-40">
                {testSendLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Send className="w-3 h-3" />}
                {testSendLoading ? 'Sending…' : 'Send test'}
              </button>
            </div>
            <StatusLine {...testStatus} />
            <p className="text-[10px] text-muted-foreground/30">
              Sends the current draft to a single address — does not affect subscribers.
            </p>
          </div>
        )}

        <StatusLine {...saveStatus} />
        <StatusLine {...sendStatus} />
        <StatusLine {...prevStatus} />
        {!hasContent && canSend && (
          <p className="text-[11px] text-muted-foreground/60">Add at least one section before sending.</p>
        )}
      </div>

      {/* ── PREVIEW MODAL ─────────────────────────────────────────────────── */}
      {showPreview && previewHtml && (
        <div className="fixed inset-0 z-[60] flex items-start justify-center overflow-y-auto p-4 bg-black/70 backdrop-blur-sm">
          <div className="relative w-full max-w-3xl bg-white rounded-xl shadow-2xl overflow-hidden">
            <div className="sticky top-0 z-10 flex items-center justify-between bg-white border-b px-4 py-3">
              <span className="font-mono text-[12px] text-gray-500 uppercase tracking-widest">Newsletter Preview</span>
              <button onClick={() => setShowPreview(false)} className="text-gray-400 hover:text-gray-800 font-mono text-[11px]">
                ✕ Close
              </button>
            </div>
            <iframe srcDoc={previewHtml} title="Newsletter Preview" className="w-full" style={{ height: '80vh', border: 'none' }} />
          </div>
        </div>
      )}
    </div>
  );
}