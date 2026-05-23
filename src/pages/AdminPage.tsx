import { useEffect, useMemo, useState, useCallback } from 'react';
import { SteamiLayout } from '@/components/SteamiLayout';
import { ApiStatePanel } from '@/components/ApiStatePanel';
import { api } from '@/lib/api';
import { useAuthStore } from '@/stores/auth-store';
import {
  Shield, Send, Trash2, Filter, Zap, RefreshCw,
  Download, Eye, EyeOff, ChevronLeft, ChevronRight,
  Tag, User, BarChart2, TableProperties, X, Globe, LogIn, UserX,
} from 'lucide-react';

type LoadState = { data: any; loading: boolean; error: string };
const initial: LoadState = { data: null, loading: true, error: '' };

// ── Typed shapes ─────────────────────────────────────────────────────────────

interface DashboardAdmin {
  total_events:  number;
  unique_users:  number;
  by_type:       Record<string, number>;
  by_date:       Record<string, number>;
  by_subject:    Record<string, number>;
  top_items:     Array<{ popup_id: string; popup_type: string; count: number; popup_title?: string; subject?: string }>;
  top_keywords:  Array<{ keyword: string; count: number }>;
  device_counts: Record<string, number>;
}

interface SecurityStats {
  total_requests:   number;
  blocked_requests: number;
  rate_limit_hits:  number;
  active_bans:      string[] | Record<string, unknown>;
  temp_bans?:       string[] | Record<string, unknown>;
  [key: string]: unknown;
}

interface PopupEvent {
  id?:           string;
  popup_id:      string;
  popup_type:    string;
  popup_title?:  string;
  uid?:          string;
  subject?:      string;
  keywords?:     string[];
  date?:         string;
  opened_at?:    string;
  device_type?:  string;
  read_duration_seconds?: number;
  [key: string]: unknown;
}

interface NewsletterRecipient {
  id?:           string;
  email:         string;
  name?:         string;
  full_name?:    string;
  subscribed_at?: string;
  created_at?:   string;
  is_active?:    boolean;
  [key: string]: unknown;
}

// ── CSV data structures ───────────────────────────────────────────────────────

/** All 15 columns the backend exports in the CSV */
const CSV_COLUMNS = [
  { key: 'id',                     label: 'Event ID',        width: 'w-32' },
  { key: 'uid',                    label: 'User ID',         width: 'w-32' },
  { key: 'user_name',              label: 'User Name',       width: 'w-36' },
  { key: 'user_role',              label: 'Role',            width: 'w-20' },
  { key: 'opened_at',              label: 'Opened At',       width: 'w-40' },
  { key: 'date',                   label: 'Date',            width: 'w-24' },
  { key: 'hour',                   label: 'Hour',            width: 'w-14' },
  { key: 'week',                   label: 'Week',            width: 'w-14' },
  { key: 'month',                  label: 'Month',           width: 'w-20' },
  { key: 'popup_type',             label: 'Type',            width: 'w-28' },
  { key: 'popup_id',               label: 'Content ID',      width: 'w-28' },
  { key: 'popup_title',            label: 'Title',           width: 'w-48' },
  { key: 'subject',                label: 'Subject',         width: 'w-36' },
  { key: 'keywords',               label: 'Keywords',        width: 'w-56' },
  { key: 'content_snippet',        label: 'Snippet',         width: 'w-64' },
  { key: 'read_duration_seconds',  label: 'Read (s)',        width: 'w-20' },
  { key: 'device_type',            label: 'Device',          width: 'w-24' },
] as const;

type CsvColumnKey = typeof CSV_COLUMNS[number]['key'];

/** Parse raw CSV text into header + rows */
function parseCsv(text: string): { headers: string[]; rows: string[][] } {
  const lines = text.trim().split(/\r?\n/);
  if (lines.length === 0) return { headers: [], rows: [] };

  const parseRow = (line: string): string[] => {
    const result: string[] = [];
    let cur = '';
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (ch === '"') {
        if (inQuotes && line[i + 1] === '"') { cur += '"'; i++; }
        else inQuotes = !inQuotes;
      } else if (ch === ',' && !inQuotes) {
        result.push(cur); cur = '';
      } else {
        cur += ch;
      }
    }
    result.push(cur);
    return result;
  };

  const headers = parseRow(lines[0]);
  const rows = lines.slice(1).map(parseRow);
  return { headers, rows };
}

const POPUP_TYPE_COLORS: Record<string, string> = {
  research_article: 'text-steami-cyan',
  ai_insight:       'text-steami-gold',
  explainer:        'text-purple-400',
  simulation:       'text-green-400',
};

const SUBJECT_COLORS: Record<string, string> = {
  'PHYSICS':          'bg-blue-500/15 text-blue-300',
  'CHEMISTRY':        'bg-orange-500/15 text-orange-300',
  'BIOLOGY':          'bg-emerald-500/15 text-emerald-300',
  'MATHEMATICS':      'bg-pink-500/15 text-pink-300',
  'COMPUTER SCIENCE': 'bg-cyan-500/15 text-cyan-300',
  'AI + ROBOTICS':    'bg-yellow-500/15 text-yellow-300',
  'SPACE + ASTRONOMY':'bg-indigo-500/15 text-indigo-300',
  'ENGINEERING':      'bg-red-500/15 text-red-300',
  'ENVIRONMENT':      'bg-teal-500/15 text-teal-300',
  'MEDICINE':         'bg-rose-500/15 text-rose-300',
  'NEUROSCIENCE':     'bg-violet-500/15 text-violet-300',
  'QUANTUM':          'bg-fuchsia-500/15 text-fuchsia-300',
};

// ── Sub-components ────────────────────────────────────────────────────────────

function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-lg border border-white/10 bg-white/[0.03] px-4 py-3">
      <div className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground mb-1">{label}</div>
      <div className="font-serif text-[22px] font-bold">{value ?? '—'}</div>
    </div>
  );
}

function BreakdownTable({ title, data }: { title: string; data: Record<string, number> }) {
  const entries = Object.entries(data ?? {}).sort((a, b) => b[1] - a[1]);
  if (!entries.length) return null;
  const max = entries[0][1];
  return (
    <div className="mt-4">
      <div className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground mb-2">{title}</div>
      <div className="space-y-1.5">
        {entries.map(([key, val]) => (
          <div key={key} className="space-y-0.5">
            <div className="flex items-center gap-2 font-mono text-[12px]">
              <span className="flex-1 truncate">{key}</span>
              <span className="text-steami-cyan shrink-0">{val}</span>
            </div>
            <div className="h-1 rounded-full bg-white/5 overflow-hidden">
              <div
                className="h-full rounded-full bg-steami-cyan/40"
                style={{ width: `${(val / max) * 100}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function SubjectBadge({ subject }: { subject?: string }) {
  if (!subject) return <span className="text-muted-foreground/40 text-[10px]">—</span>;
  const cls = SUBJECT_COLORS[subject] ?? 'bg-white/10 text-white/60';
  return (
    <span className={`inline-block rounded px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-wide ${cls}`}>
      {subject}
    </span>
  );
}

function EventRow({ ev }: { ev: PopupEvent }) {
  const typeColor = POPUP_TYPE_COLORS[ev.popup_type] ?? 'text-muted-foreground';
  const when = ev.opened_at ?? ev.date;
  const displayTime = when
    ? new Date(when).toLocaleString(undefined, { dateStyle: 'short', timeStyle: 'short' })
    : null;

  return (
    <div className="flex flex-wrap items-start gap-x-3 gap-y-1.5 rounded-md border border-white/10 bg-white/[0.03] px-3 py-2.5">
      <span className={`font-mono text-[10px] uppercase tracking-wider shrink-0 w-28 mt-0.5 ${typeColor}`}>
        {ev.popup_type}
      </span>
      <div className="flex-1 min-w-0">
        <div className="truncate text-[13px] font-medium">{ev.popup_title || ev.popup_id}</div>
        {ev.keywords && ev.keywords.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-1">
            {ev.keywords.slice(0, 4).map((kw) => (
              <span key={kw} className="flex items-center gap-0.5 rounded bg-white/[0.06] px-1.5 py-0.5 font-mono text-[9px] text-muted-foreground">
                <Tag className="w-2.5 h-2.5 shrink-0" />{kw}
              </span>
            ))}
          </div>
        )}
      </div>
      <div className="flex flex-col items-end gap-1 shrink-0">
        <SubjectBadge subject={ev.subject} />
        <span className="font-mono text-[10px] text-muted-foreground/50">{ev.uid?.slice(0, 8)}…</span>
        {displayTime && (
          <span className="font-mono text-[10px] text-muted-foreground/40">{displayTime}</span>
        )}
      </div>
    </div>
  );
}

function NewsletterRow({ r }: { r: NewsletterRecipient }) {
  const name = r.full_name ?? r.name;
  const when = r.subscribed_at ?? r.created_at;
  const displayDate = when
    ? new Date(when).toLocaleDateString(undefined, { dateStyle: 'medium' })
    : null;

  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 rounded-md border border-white/10 bg-white/[0.03] px-3 py-2">
      <div className="flex-1 min-w-0">
        {name && <div className="text-[13px] font-medium truncate">{name}</div>}
        <div className="font-mono text-[11px] text-muted-foreground truncate">{r.email}</div>
      </div>
      {r.is_active !== undefined && (
        <span className={`font-mono text-[10px] shrink-0 ${r.is_active ? 'text-green-400' : 'text-red-400'}`}>
          {r.is_active ? 'active' : 'inactive'}
        </span>
      )}
      {displayDate && (
        <span className="font-mono text-[10px] text-muted-foreground/60 shrink-0">{displayDate}</span>
      )}
    </div>
  );
}

// ── CSV Viewer Panel ──────────────────────────────────────────────────────────

const ROWS_PER_PAGE = 25;
const VISIBLE_COLS_DEFAULT: CsvColumnKey[] = [
  'user_name', 'user_role', 'date', 'popup_type', 'popup_title', 'subject', 'keywords', 'read_duration_seconds', 'device_type',
];

interface CsvFilters {
  popup_type: string;
  uid_filter: string;
  subject:    string;
  date_from:  string;
  date_to:    string;
  limit:      number;
}

const defaultFilters: CsvFilters = {
  popup_type: '',
  uid_filter: '',
  subject:    '',
  date_from:  '',
  date_to:    '',
  limit:      200,
};

const ALL_SUBJECTS = [
  'PHYSICS','CHEMISTRY','BIOLOGY','MATHEMATICS','COMPUTER SCIENCE',
  'AI + ROBOTICS','SPACE + ASTRONOMY','ENGINEERING','ENVIRONMENT',
  'MEDICINE','NEUROSCIENCE','QUANTUM',
];

function CsvViewerPanel() {
  const [filters,       setFilters]      = useState<CsvFilters>(defaultFilters);
  const [csvText,       setCsvText]      = useState<string | null>(null);
  const [loading,       setLoading]      = useState(false);
  const [dlLoading,     setDlLoading]    = useState(false);
  const [error,         setError]        = useState('');
  const [page,          setPage]         = useState(0);
  const [visibleCols,   setVisibleCols]  = useState<Set<CsvColumnKey>>(new Set(VISIBLE_COLS_DEFAULT));
  const [showColPicker, setShowColPicker]= useState(false);
  const [dlResult,      setDlResult]     = useState<{ rowCount: number | null } | null>(null);

  const { headers, rows } = useMemo(
    () => (csvText ? parseCsv(csvText) : { headers: [], rows: [] }),
    [csvText]
  );

  const totalPages = Math.ceil(rows.length / ROWS_PER_PAGE);
  const pageRows   = rows.slice(page * ROWS_PER_PAGE, (page + 1) * ROWS_PER_PAGE);

  // Map header name → column index for fast lookup
  const colIndex = useMemo(
    () => Object.fromEntries(headers.map((h, i) => [h, i])),
    [headers]
  );

  const visibleColumnDefs = CSV_COLUMNS.filter((c) => visibleCols.has(c.key));

  const handlePreview = useCallback(async () => {
    setLoading(true); setError(''); setPage(0); setDlResult(null);
    try {
      const text = await api.dashboard.previewCsv(filters);
      setCsvText(text);
    } catch (e: any) {
      setError(e.message || 'Failed to load CSV');
    } finally {
      setLoading(false);
    }
  }, [filters]);

  const handleDownload = useCallback(async () => {
    setDlLoading(true); setDlResult(null);
    try {
      const result = await api.dashboard.exportCsv(filters);
      setDlResult(result);
    } catch (e: any) {
      setError(e.message || 'Download failed');
    } finally {
      setDlLoading(false);
    }
  }, [filters]);

  const toggleCol = (key: CsvColumnKey) => {
    setVisibleCols((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const updateFilter = <K extends keyof CsvFilters>(key: K, val: CsvFilters[K]) =>
    setFilters((f) => ({ ...f, [key]: val }));

  // Cell value renderer
  const renderCell = (row: string[], colKey: CsvColumnKey) => {
    const idx = colIndex[colKey];
    const raw = idx !== undefined ? (row[idx] ?? '') : '';

    if (colKey === 'keywords') {
      const tags = raw.split('|').filter(Boolean);
      if (!tags.length) return <span className="text-white/20">—</span>;
      return (
        <div className="flex flex-wrap gap-0.5">
          {tags.map((t) => (
            <span key={t} className="rounded bg-steami-cyan/10 px-1 py-0.5 font-mono text-[9px] text-steami-cyan/80">{t}</span>
          ))}
        </div>
      );
    }
    if (colKey === 'subject') {
      return <SubjectBadge subject={raw || undefined} />;
    }
    if (colKey === 'popup_type') {
      const cls = POPUP_TYPE_COLORS[raw] ?? 'text-muted-foreground';
      return <span className={`font-mono text-[10px] uppercase ${cls}`}>{raw || '—'}</span>;
    }
    if (colKey === 'opened_at') {
      try {
        return <span className="font-mono text-[10px] text-muted-foreground">{new Date(raw).toLocaleString()}</span>;
      } catch { return <span className="font-mono text-[10px]">{raw}</span>; }
    }
    if (colKey === 'content_snippet') {
      return (
        <span className="block max-w-xs truncate text-[11px] text-muted-foreground" title={raw}>
          {raw || '—'}
        </span>
      );
    }
    if (colKey === 'read_duration_seconds') {
      if (!raw || raw === 'None' || raw === '') return <span className="text-white/20">—</span>;
      return <span className="font-mono text-[11px] text-steami-gold">{raw}s</span>;
    }

    if (colKey === 'user_role') {
      const roleStyles: Record<string, string> = {
        admin: 'bg-steami-gold/15 text-steami-gold border-steami-gold/30',
        mod:   'bg-purple-500/15 text-purple-300 border-purple-500/30',
        user:  'bg-white/5 text-white/50 border-white/10',
      };
      const cls = roleStyles[raw] ?? roleStyles['user'];
      return (
        <span className={`inline-block rounded border px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-wide ${cls}`}>
          {raw || 'user'}
        </span>
      );
    }
    if (colKey === 'user_name') {
      if (!raw || raw === 'Unknown') return <span className="font-mono text-[11px] text-white/30 italic">Unknown</span>;
      return <span className="text-[12px] font-medium truncate max-w-[140px] block" title={raw}>{raw}</span>;
    }
    if (['id', 'uid'].includes(colKey)) {
      return <span className="font-mono text-[10px] text-muted-foreground/60" title={raw}>{raw.slice(0, 8)}…</span>;
    }
    return <span className="text-[12px]">{raw || '—'}</span>;
  };

  return (
    <div className="lg:col-span-2 rounded-xl border border-white/10 bg-white/[0.02] overflow-hidden">
      {/* Header */}
      <div className="flex flex-wrap items-center gap-3 px-5 py-4 border-b border-white/10">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <TableProperties className="w-4 h-4 text-steami-cyan shrink-0" />
          <h2 className="font-mono text-[13px] uppercase tracking-wider">Event Data Export</h2>
          {csvText && rows.length > 0 && (
            <span className="font-mono text-[11px] text-muted-foreground">
              ({rows.length} row{rows.length !== 1 ? 's' : ''})
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowColPicker((v) => !v)}
            className="flex items-center gap-1.5 rounded-md border border-white/10 bg-white/[0.04] px-2.5 py-1.5 font-mono text-[11px] hover:bg-white/[0.08] transition-colors"
          >
            {showColPicker ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
            Columns
          </button>
          <button
            onClick={handlePreview}
            disabled={loading}
            className="flex items-center gap-1.5 steami-btn text-[11px]"
          >
            <Eye className={`w-3 h-3 ${loading ? 'animate-pulse' : ''}`} />
            {loading ? 'Loading…' : 'Preview'}
          </button>
          <button
            onClick={handleDownload}
            disabled={dlLoading}
            className="flex items-center gap-1.5 steami-btn text-[11px] bg-steami-cyan/10 border-steami-cyan/30 text-steami-cyan hover:bg-steami-cyan/20"
          >
            <Download className={`w-3 h-3 ${dlLoading ? 'animate-bounce' : ''}`} />
            {dlLoading ? 'Downloading…' : 'Download CSV'}
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="px-5 py-3 border-b border-white/10 bg-white/[0.01]">
        <div className="flex flex-wrap gap-2 items-center">
          <Filter className="w-3 h-3 text-muted-foreground shrink-0" />

          {/* Popup type */}
          <select
            value={filters.popup_type}
            onChange={(e) => updateFilter('popup_type', e.target.value)}
            className="rounded border border-white/10 bg-transparent px-2 py-1.5 font-mono text-[11px] text-muted-foreground"
          >
            <option value="">All types</option>
            <option value="research_article">research_article</option>
            <option value="ai_insight">ai_insight</option>
            <option value="explainer">explainer</option>
            <option value="simulation">simulation</option>
          </select>

          {/* Subject */}
          <select
            value={filters.subject}
            onChange={(e) => updateFilter('subject', e.target.value)}
            className="rounded border border-white/10 bg-transparent px-2 py-1.5 font-mono text-[11px] text-muted-foreground"
          >
            <option value="">All subjects</option>
            {ALL_SUBJECTS.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>

          {/* UID filter */}
          <input
            value={filters.uid_filter}
            onChange={(e) => updateFilter('uid_filter', e.target.value)}
            placeholder="User UID"
            className="rounded border border-white/10 bg-transparent px-2 py-1.5 font-mono text-[11px] w-36 placeholder:text-muted-foreground/40"
          />

          {/* Date range */}
          <input
            type="date"
            value={filters.date_from}
            onChange={(e) => updateFilter('date_from', e.target.value)}
            className="rounded border border-white/10 bg-transparent px-2 py-1.5 font-mono text-[11px] text-muted-foreground"
          />
          <span className="font-mono text-[10px] text-muted-foreground">→</span>
          <input
            type="date"
            value={filters.date_to}
            onChange={(e) => updateFilter('date_to', e.target.value)}
            className="rounded border border-white/10 bg-transparent px-2 py-1.5 font-mono text-[11px] text-muted-foreground"
          />

          {/* Row limit */}
          <input
            type="number"
            min={1}
            max={10000}
            value={filters.limit}
            onChange={(e) => updateFilter('limit', Number(e.target.value))}
            className="rounded border border-white/10 bg-transparent px-2 py-1.5 font-mono text-[11px] w-24 text-muted-foreground"
            placeholder="Rows"
          />

          {/* Clear */}
          {(filters.popup_type || filters.uid_filter || filters.subject || filters.date_from || filters.date_to) && (
            <button
              onClick={() => setFilters(defaultFilters)}
              className="flex items-center gap-1 font-mono text-[10px] text-muted-foreground hover:text-white transition-colors"
            >
              <X className="w-3 h-3" /> Clear
            </button>
          )}
        </div>

        {/* Column picker dropdown */}
        {showColPicker && (
          <div className="mt-3 flex flex-wrap gap-2">
            {CSV_COLUMNS.map((col) => (
              <button
                key={col.key}
                onClick={() => toggleCol(col.key)}
                className={`flex items-center gap-1 rounded border px-2 py-1 font-mono text-[10px] transition-colors
                  ${visibleCols.has(col.key)
                    ? 'border-steami-cyan/40 bg-steami-cyan/10 text-steami-cyan'
                    : 'border-white/10 bg-transparent text-muted-foreground hover:border-white/20'}`}
              >
                {visibleCols.has(col.key) ? <Eye className="w-2.5 h-2.5" /> : <EyeOff className="w-2.5 h-2.5" />}
                {col.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Status bar */}
      {(error || dlResult) && (
        <div className={`px-5 py-2 font-mono text-[11px] border-b border-white/10 ${error ? 'text-red-400 bg-red-500/5' : 'text-green-400 bg-green-500/5'}`}>
          {error ? `✕ ${error}` : `✓ Downloaded ${dlResult?.rowCount ?? '?'} rows`}
        </div>
      )}

      {/* Table */}
      {!csvText && !loading && (
        <div className="flex flex-col items-center justify-center py-16 gap-3 text-muted-foreground">
          <TableProperties className="w-8 h-8 opacity-20" />
          <p className="font-mono text-[12px]">Click Preview to load data, or Download CSV to export.</p>
        </div>
      )}

      {loading && (
        <div className="flex items-center justify-center py-16 gap-2 text-muted-foreground">
          <RefreshCw className="w-4 h-4 animate-spin" />
          <span className="font-mono text-[12px]">Fetching events…</span>
        </div>
      )}

      {csvText && rows.length === 0 && !loading && (
        <div className="flex items-center justify-center py-16 text-muted-foreground font-mono text-[12px]">
          No events match the current filters.
        </div>
      )}

      {pageRows.length > 0 && (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="border-b border-white/10 bg-white/[0.02]">
                {visibleColumnDefs.map((col) => (
                  <th
                    key={col.key}
                    className={`${col.width} px-3 py-2.5 font-mono text-[9px] uppercase tracking-widest text-muted-foreground/60 whitespace-nowrap`}
                  >
                    {col.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {pageRows.map((row, i) => (
                <tr
                  key={i}
                  className="border-b border-white/[0.04] hover:bg-white/[0.025] transition-colors"
                >
                  {visibleColumnDefs.map((col) => (
                    <td key={col.key} className={`${col.width} px-3 py-2 align-top`}>
                      {renderCell(row, col.key)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between px-5 py-3 border-t border-white/10 bg-white/[0.01]">
          <span className="font-mono text-[11px] text-muted-foreground">
            Page {page + 1} of {totalPages} &nbsp;·&nbsp; {rows.length} total rows
          </span>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              disabled={page === 0}
              className="rounded border border-white/10 p-1.5 hover:bg-white/[0.06] disabled:opacity-30 transition-colors"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
              disabled={page >= totalPages - 1}
              className="rounded border border-white/10 p-1.5 hover:bg-white/[0.06] disabled:opacity-30 transition-colors"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* CSV column legend */}
      <div className="px-5 py-4 border-t border-white/10 bg-white/[0.01]">
        <p className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground mb-2">CSV column reference</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-1">
          {CSV_COLUMNS.map((col) => (
            <div key={col.key} className="flex gap-2 text-[11px]">
              <span className="font-mono text-steami-cyan/70 shrink-0 w-36">{col.key}</span>
              <span className="text-muted-foreground">{COL_DESCRIPTIONS[col.key]}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

const COL_DESCRIPTIONS: Record<CsvColumnKey, string> = {
  id:                    'Unique UUID for this event',
  uid:                   'User who opened the popup',
  user_name:             'Display name of the user, or "Unknown" if not logged in',
  user_role:             'admin | mod | user ("user" if not logged in)',
  opened_at:             'Full ISO-8601 timestamp (UTC)',
  date:                  'Date only: YYYY-MM-DD',
  hour:                  'UTC hour 0–23 (for heatmaps)',
  week:                  'ISO week number 1–53',
  month:                 'YYYY-MM for monthly rollups',
  popup_type:            'research_article | ai_insight | explainer | simulation',
  popup_id:              'ID of the opened content item',
  popup_title:           'Display title of the content',
  subject:               'Resolved STEAMI subject (e.g. PHYSICS)',
  keywords:              'Pipe-separated STEM keyword tags',
  content_snippet:       'First 280 chars of content text',
  read_duration_seconds: 'Seconds popup was open (may be null)',
  device_type:           'mobile | desktop | tablet | unknown',
};

// ── Recommendation Data Panel ─────────────────────────────────────────────────

function RecommendationPanel() {
  const [profiles, setProfiles] = useState<LoadState>(initial);
  const [heatmap,  setHeatmap]  = useState<LoadState>(initial);
  const [tab, setTab] = useState<'profiles' | 'heatmap'>('profiles');

  useEffect(() => {
    api.dashboard.userProfiles({ limit: 1000 })
      .then((d) => setProfiles({ data: d, loading: false, error: '' }))
      .catch((e) => setProfiles({ data: null, loading: false, error: e.message }));
    api.dashboard.contentHeatmap({ limit: 2000 })
      .then((d) => setHeatmap({ data: d, loading: false, error: '' }))
      .catch((e) => setHeatmap({ data: null, loading: false, error: e.message }));
  }, []);

  const profileList: any[] = Array.isArray(profiles.data?.profiles) ? profiles.data.profiles : [];
  const heatmapData = heatmap.data?.heatmap ?? {};
  const subjectTotals = heatmap.data?.subject_totals ?? {};

  return (
    <div className="lg:col-span-2 rounded-xl border border-white/10 bg-white/[0.02] overflow-hidden">
      <div className="flex items-center gap-3 px-5 py-4 border-b border-white/10">
        <BarChart2 className="w-4 h-4 text-steami-gold shrink-0" />
        <h2 className="font-mono text-[13px] uppercase tracking-wider flex-1">Recommendation Engine Data</h2>
        <div className="flex gap-1">
          {(['profiles', 'heatmap'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-3 py-1.5 rounded font-mono text-[10px] uppercase tracking-wider transition-colors
                ${tab === t ? 'bg-steami-gold/20 text-steami-gold border border-steami-gold/30' : 'text-muted-foreground hover:text-white border border-transparent'}`}
            >
              {t === 'profiles' ? 'User Profiles' : 'Content Heatmap'}
            </button>
          ))}
        </div>
      </div>

      <div className="p-5">
        {tab === 'profiles' && (
          <>
            {profiles.loading && <p className="font-mono text-[12px] text-muted-foreground">Loading profiles…</p>}
            {profiles.error && <p className="font-mono text-[12px] text-red-400">{profiles.error}</p>}
            {profileList.length > 0 && (
              <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
                {profileList.slice(0, 50).map((p: any) => (
                  <div key={p.uid} className="rounded-lg border border-white/10 bg-white/[0.03] px-4 py-3">
                    <div className="flex items-center gap-3 mb-2">
                      <User className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                      <span className="font-mono text-[11px] text-muted-foreground flex-1 truncate">{p.uid}</span>
                      <span className="font-mono text-[10px] text-steami-cyan">{p.total_events} events</span>
                      <span className="font-mono text-[10px] text-muted-foreground/50">{p.last_active}</span>
                    </div>
                    <div className="flex flex-wrap gap-2 items-center">
                      {p.top_subject && <SubjectBadge subject={p.top_subject} />}
                      {p.top_keywords?.slice(0, 3).map((kw: any) => (
                        <span key={kw.keyword} className="flex items-center gap-0.5 rounded bg-white/[0.05] px-1.5 py-0.5 font-mono text-[9px] text-muted-foreground">
                          <Tag className="w-2.5 h-2.5" />{kw.keyword} <span className="text-steami-cyan ml-0.5">×{kw.count}</span>
                        </span>
                      ))}
                      {p.device_preference && (
                        <span className="font-mono text-[9px] text-muted-foreground/50">{p.device_preference}</span>
                      )}
                      {p.total_read_seconds > 0 && (
                        <span className="font-mono text-[9px] text-steami-gold/60">{Math.round(p.total_read_seconds / 60)}m read</span>
                      )}
                    </div>
                  </div>
                ))}
                {profileList.length > 50 && (
                  <p className="font-mono text-[11px] text-muted-foreground text-center pt-2">
                    …and {profileList.length - 50} more users (use CSV export for full data)
                  </p>
                )}
              </div>
            )}
          </>
        )}

        {tab === 'heatmap' && (
          <>
            {heatmap.loading && <p className="font-mono text-[12px] text-muted-foreground">Loading heatmap…</p>}
            {heatmap.error && <p className="font-mono text-[12px] text-red-400">{heatmap.error}</p>}
            {Object.keys(heatmapData).length > 0 && (
              <div className="space-y-4 max-h-[600px] overflow-y-auto pr-1">
                {Object.entries(subjectTotals)
                  .sort((a: any, b: any) => b[1] - a[1])
                  .map(([subject, total]) => {
                    const items: any[] = heatmapData[subject] ?? [];
                    if (!items.length) return null;
                    return (
                      <div key={subject}>
                        <div className="flex items-center gap-2 mb-2">
                          <SubjectBadge subject={subject} />
                          <span className="font-mono text-[10px] text-muted-foreground">{total as number} opens</span>
                        </div>
                        <div className="space-y-1 pl-2">
                          {items.slice(0, 5).map((item: any) => (
                            <div key={item.popup_id} className="flex items-center gap-2">
                              <span className={`font-mono text-[9px] uppercase w-20 shrink-0 ${POPUP_TYPE_COLORS[item.popup_type] ?? 'text-muted-foreground'}`}>
                                {item.popup_type}
                              </span>
                              <span className="flex-1 text-[12px] truncate">{item.popup_title || item.popup_id}</span>
                              <span className="font-mono text-[11px] text-steami-cyan shrink-0">{item.opens}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

// ── Visitor Tracker Panel ─────────────────────────────────────────────────────

interface VisitorRecord {
  ip:           string;
  name:         string;
  uid?:         string | null;
  role?:        string | null;
  first_seen:   string;
  last_seen:    string;
  visit_count:  number;
  is_logged_in: boolean;
}

interface VisitorStats {
  total_unique_ips: number;
  logged_in:        number;
  unknown:          number;
  latest_visit:     string | null;
  top_visitors:     Array<{ ip: string; name: string; visit_count: number; last_seen: string }>;
}

function VisitorPanel() {
  const [stats,    setStats]    = useState<LoadState>(initial);
  const [visitors, setVisitors] = useState<LoadState>(initial);
  const [filter,   setFilter]   = useState<'all' | 'logged_in' | 'unknown'>('all');
  const [deleting, setDeleting] = useState<string | null>(null);

  // Local load helper (mirrors the one in AdminPage)
  const load = async (setter: (s: LoadState) => void, fn: () => Promise<any>) => {
    setter({ data: null, loading: true, error: '' });
    try {
      setter({ data: await fn(), loading: false, error: '' });
    } catch (err: any) {
      setter({ data: null, loading: false, error: err.message || 'Unable to load data' });
    }
  };
  const loadStats    = () => load(setStats, api.visitors.stats);
  const loadVisitors = (f: typeof filter = filter) => {
    const params: Record<string, unknown> = { limit: 200 };
    if (f === 'logged_in') params.logged_in = true;
    if (f === 'unknown')   params.logged_in = false;
    load(setVisitors, () => api.visitors.list(params));
  };

  useEffect(() => {
    loadStats();
    loadVisitors('all');
  }, []);

  const handleFilterChange = (f: typeof filter) => {
    setFilter(f);
    loadVisitors(f);
  };

  const handleDelete = async (ip: string) => {
    if (!window.confirm(`Remove visitor record for ${ip}?`)) return;
    setDeleting(ip);
    try {
      await api.visitors.delete(ip);
      loadVisitors();
      loadStats();
    } catch (e: any) {
      alert(e.message || 'Delete failed');
    } finally {
      setDeleting(null);
    }
  };

  const s: VisitorStats | null = stats.data ?? null;
  const vList: VisitorRecord[] = Array.isArray(visitors.data?.visitors) ? visitors.data.visitors : [];

  const formatDate = (iso?: string | null) => {
    if (!iso) return '—';
    return new Date(iso).toLocaleString(undefined, { dateStyle: 'short', timeStyle: 'short' });
  };

  return (
    <div className="lg:col-span-2 rounded-xl border border-white/10 bg-white/[0.02] overflow-hidden">
      {/* Header */}
      <div className="flex flex-wrap items-center gap-3 px-5 py-4 border-b border-white/10">
        <Globe className="w-4 h-4 text-steami-cyan shrink-0" />
        <h2 className="font-mono text-[13px] uppercase tracking-wider flex-1">Unique Visitors</h2>
        <button
          onClick={() => { loadStats(); loadVisitors(); }}
          className="flex items-center gap-1.5 steami-btn text-[11px]"
        >
          <RefreshCw className="w-3 h-3" /> Refresh
        </button>
      </div>

      {/* Stats strip */}
      {s && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 px-5 py-4 border-b border-white/10">
          <StatCard label="Total Unique IPs" value={s.total_unique_ips} />
          <StatCard label="Logged-in Users"  value={s.logged_in} />
          <StatCard label="Unknown / Guest"  value={s.unknown} />
          <StatCard label="Latest Visit"     value={formatDate(s.latest_visit)} />
        </div>
      )}

      {/* Top visitors */}
      {s?.top_visitors && s.top_visitors.length > 0 && (
        <div className="px-5 py-3 border-b border-white/10 bg-white/[0.01]">
          <div className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground mb-2">
            Top 5 most frequent IPs
          </div>
          <div className="flex flex-wrap gap-2">
            {s.top_visitors.map((v) => (
              <div key={v.ip} className="flex items-center gap-2 rounded-md border border-white/10 bg-white/[0.04] px-3 py-1.5">
                <span className="font-mono text-[11px] text-steami-cyan">{v.ip}</span>
                <span className="text-[12px]">{v.name}</span>
                <span className="font-mono text-[10px] text-muted-foreground">×{v.visit_count}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Filter tabs */}
      <div className="flex items-center gap-2 px-5 py-3 border-b border-white/10">
        <Filter className="w-3 h-3 text-muted-foreground shrink-0" />
        {([
          { key: 'all',       label: 'All',          icon: Globe },
          { key: 'logged_in', label: 'Logged-in',    icon: LogIn },
          { key: 'unknown',   label: 'Unknown / Guest', icon: UserX },
        ] as const).map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => handleFilterChange(key)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded font-mono text-[10px] uppercase tracking-wider transition-colors
              ${filter === key
                ? 'bg-steami-cyan/15 text-steami-cyan border border-steami-cyan/30'
                : 'text-muted-foreground hover:text-white border border-transparent'}`}
          >
            <Icon className="w-3 h-3" />{label}
          </button>
        ))}
        {visitors.data?.total !== undefined && (
          <span className="ml-auto font-mono text-[11px] text-muted-foreground">
            {visitors.data.total} record{visitors.data.total !== 1 ? 's' : ''}
          </span>
        )}
      </div>

      {/* Visitor list */}
      <div className="p-5">
        {visitors.loading && (
          <div className="flex items-center gap-2 text-muted-foreground py-8 justify-center">
            <RefreshCw className="w-4 h-4 animate-spin" />
            <span className="font-mono text-[12px]">Loading visitors…</span>
          </div>
        )}

        {visitors.error && (
          <p className="font-mono text-[12px] text-red-400 py-4">{visitors.error}</p>
        )}

        {!visitors.loading && vList.length === 0 && (
          <p className="font-mono text-[12px] text-muted-foreground py-8 text-center">
            No visitor records yet. Records appear as requests hit the backend.
          </p>
        )}

        {vList.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="border-b border-white/10 bg-white/[0.02]">
                  {[
                    ['IP Address',   'w-32'],
                    ['Name',         'w-40'],
                    ['Role',         'w-20'],
                    ['Visits',       'w-16'],
                    ['First Seen',   'w-36'],
                    ['Last Seen',    'w-36'],
                    ['',             'w-16'],   // delete button
                  ].map(([label, width]) => (
                    <th key={label} className={`${width} px-3 py-2.5 font-mono text-[9px] uppercase tracking-widest text-muted-foreground/60 whitespace-nowrap`}>
                      {label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {vList.map((v) => {
                  const roleStyles: Record<string, string> = {
                    admin: 'bg-steami-gold/15 text-steami-gold border-steami-gold/30',
                    mod:   'bg-purple-500/15 text-purple-300 border-purple-500/30',
                    user:  'bg-white/5 text-white/50 border-white/10',
                  };
                  const roleCls = roleStyles[v.role ?? ''] ?? roleStyles['user'];

                  return (
                    <tr
                      key={v.ip}
                      className="border-b border-white/[0.04] hover:bg-white/[0.02] transition-colors"
                    >
                      {/* IP */}
                      <td className="px-3 py-2.5 align-middle">
                        <span className="font-mono text-[11px] text-steami-cyan">{v.ip}</span>
                      </td>

                      {/* Name */}
                      <td className="px-3 py-2.5 align-middle">
                        <div className="flex items-center gap-1.5">
                          {v.is_logged_in
                            ? <LogIn className="w-3 h-3 text-green-400 shrink-0" />
                            : <UserX className="w-3 h-3 text-white/20 shrink-0" />}
                          <span className={`text-[12px] truncate max-w-[140px] ${v.is_logged_in ? '' : 'text-muted-foreground/50 italic'}`}>
                            {v.name}
                          </span>
                        </div>
                      </td>

                      {/* Role */}
                      <td className="px-3 py-2.5 align-middle">
                        {v.role
                          ? <span className={`inline-block rounded border px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-wide ${roleCls}`}>{v.role}</span>
                          : <span className="text-muted-foreground/30 font-mono text-[10px]">—</span>}
                      </td>

                      {/* Visits */}
                      <td className="px-3 py-2.5 align-middle">
                        <span className="font-mono text-[12px] text-steami-gold">{v.visit_count}</span>
                      </td>

                      {/* First seen */}
                      <td className="px-3 py-2.5 align-middle">
                        <span className="font-mono text-[10px] text-muted-foreground/60">{formatDate(v.first_seen)}</span>
                      </td>

                      {/* Last seen */}
                      <td className="px-3 py-2.5 align-middle">
                        <span className="font-mono text-[10px] text-muted-foreground">{formatDate(v.last_seen)}</span>
                      </td>

                      {/* Delete */}
                      <td className="px-3 py-2.5 align-middle">
                        <button
                          onClick={() => handleDelete(v.ip)}
                          disabled={deleting === v.ip}
                          className="text-muted-foreground/40 hover:text-red-400 transition-colors disabled:opacity-30"
                          title={`Remove ${v.ip}`}
                        >
                          {deleting === v.ip
                            ? <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                            : <Trash2 className="w-3.5 h-3.5" />}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function AdminPage() {
  const user = useAuthStore((s) => s.user);

  const [dashboard,      setDashboard]      = useState<LoadState>(initial);
  const [events,         setEvents]         = useState<LoadState>(initial);
  const [users,          setUsers]          = useState<LoadState>(initial);
  const [security,       setSecurity]       = useState<LoadState>(initial);
  const [newsletter,     setNewsletter]     = useState<LoadState>(initial);
  const [articleRefresh, setArticleRefresh] = useState<{ loading: boolean; result: any; error: string }>({ loading: false, result: null, error: '' });
  const [insightStatus,  setInsightStatus]  = useState<any>(null);

  const [ip,                  setIp]                  = useState('');
  const [testEmail,           setTestEmail]           = useState('');
  const [testSendStatus,      setTestSendStatus]      = useState<{ msg: string; ok: boolean } | null>(null);
  const [sendCustomStatus,    setSendCustomStatus]    = useState<{ msg: string; ok: boolean } | null>(null);
  const [sendCustomLoading,   setSendCustomLoading]   = useState(false);
  const [sendCustomDraftLoading, setSendCustomDraftLoading] = useState(false);

  // Event log filters
  const [eventTypeFilter, setEventTypeFilter] = useState('');
  const [eventUidFilter,  setEventUidFilter]  = useState('');
  const [eventSubject,    setEventSubject]    = useState('');
  const [eventLimit,      setEventLimit]      = useState(50);

  const isAdmin   = user?.role === 'admin';
  const isMod     = user?.role === 'mod' || user?.role === 'moderator';
  const canAccess = isAdmin || isMod;

  const load = async (setter: (s: LoadState) => void, fn: () => Promise<any>) => {
    setter({ data: null, loading: true, error: '' });
    try {
      setter({ data: await fn(), loading: false, error: '' });
    } catch (err: any) {
      setter({ data: null, loading: false, error: err.message || 'Unable to load data' });
    }
  };

  const loadEvents = () =>
    load(setEvents, () =>
      api.dashboard.events({
        limit:      eventLimit,
        ...(eventTypeFilter ? { popup_type: eventTypeFilter } : {}),
        ...(eventUidFilter  ? { uid_filter: eventUidFilter }  : {}),
        ...(eventSubject    ? { subject:    eventSubject }    : {}),
      })
    );

  const refreshAll = () => {
    if (isAdmin) {
      load(setDashboard, api.dashboard.admin);
      loadEvents();
      load(setUsers, api.auth.users);
      load(setSecurity, api.security.stats);
    }
    load(setNewsletter, api.newsletter.recipients);
    api.insights.status().then(setInsightStatus).catch(() => undefined);
  };

  const runArticleRefresh = async () => {
    setArticleRefresh({ loading: true, result: null, error: '' });
    try {
      const result = await api.articles.refresh({ domains: [], target: 40 });
      setArticleRefresh({ loading: false, result, error: '' });
      if (result?.insight_thread) {
        const poll = setInterval(() => {
          api.insights.status().then(setInsightStatus).catch(() => undefined);
        }, 15_000);
        setTimeout(() => clearInterval(poll), 10 * 60 * 1000);
      }
    } catch (err: any) {
      setArticleRefresh({ loading: false, result: null, error: err.message || 'Refresh failed' });
    }
  };

  useEffect(() => {
    if (canAccess) refreshAll();
  }, [canAccess]);

  // Derived data
  const dash: DashboardAdmin | null = dashboard.data ?? null;
  const sec:  SecurityStats | null  = security.data ?? null;

  const bannedIps = useMemo<string[]>(() => {
    if (!sec) return [];
    const raw = sec.active_bans ?? sec.temp_bans ?? [];
    if (Array.isArray(raw)) return raw.map(String);
    return Object.keys(raw);
  }, [sec]);

  const normalizedUsers     = useMemo(() => (Array.isArray(users.data) ? users.data : users.data?.users ?? []), [users.data]);
  const normalizedEvents    = useMemo(() => (Array.isArray(events.data) ? events.data : events.data?.events ?? []), [events.data]);
  const normalizedNewsletter = useMemo(
    () => Array.isArray(newsletter.data) ? newsletter.data : newsletter.data?.recipients ?? newsletter.data?.subscribers ?? [],
    [newsletter.data]
  );

  if (!canAccess) {
    return (
      <SteamiLayout>
        <div className="glass-card p-8 text-center">
          <Shield className="w-8 h-8 text-steami-gold mx-auto mb-3" />
          <h1 className="steami-heading text-2xl mb-2">Admin Access Required</h1>
          <p className="text-muted-foreground text-[14px]">
            Sign in with an admin or mod account to manage users, security, dashboards, and newsletters.
          </p>
        </div>
      </SteamiLayout>
    );
  }

  return (
    <SteamiLayout>
      <div className="mb-8">
        <h1 className="steami-heading text-3xl md:text-4xl mb-3">
          {isAdmin ? 'Admin Control Room' : 'Mod Control Room'}
        </h1>
        <p className="text-[15px] text-muted-foreground max-w-2xl">
          {isAdmin
            ? 'Platform metrics, user roles, newsletter operations, DDoS controls, popup event telemetry, and recommendation data.'
            : 'Newsletter recipients, test sends, news refresh, and insight pipeline.'}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

        {/* ── Dashboard stats ──────────────────────────────────────────────── */}
        {isAdmin && (
          <ApiStatePanel
            title="Dashboard — Platform Stats"
            {...dashboard}
            onRefresh={() => load(setDashboard, api.dashboard.admin)}
          >
            {dash && (
              <>
                <div className="grid grid-cols-2 gap-3">
                  <StatCard label="Total Events"  value={dash.total_events} />
                  <StatCard label="Unique Users"  value={dash.unique_users} />
                </div>
                <BreakdownTable title="Events by type"         data={dash.by_type} />
                <BreakdownTable title="Events by subject"      data={dash.by_subject ?? {}} />
                <BreakdownTable title="Events by date (30d)"   data={dash.by_date} />
                <BreakdownTable title="Device breakdown"       data={dash.device_counts ?? {}} />

                {/* Top keywords */}
                {dash.top_keywords?.length > 0 && (
                  <div className="mt-4">
                    <div className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground mb-2">Top keywords</div>
                    <div className="flex flex-wrap gap-1.5">
                      {dash.top_keywords.map((kw) => (
                        <span key={kw.keyword} className="flex items-center gap-1 rounded-full bg-steami-cyan/10 border border-steami-cyan/20 px-2.5 py-1 font-mono text-[10px] text-steami-cyan">
                          <Tag className="w-2.5 h-2.5" />{kw.keyword}
                          <span className="text-steami-cyan/50 ml-0.5">·{kw.count}</span>
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Top items */}
                {dash.top_items?.length > 0 && (
                  <div className="mt-4">
                    <div className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground mb-2">Top 10 items</div>
                    <div className="space-y-1">
                      {dash.top_items.map((item) => (
                        <div
                          key={`${item.popup_type}:${item.popup_id}`}
                          className="flex items-center gap-2 rounded-md border border-white/10 bg-white/[0.03] px-3 py-2"
                        >
                          <span className={`font-mono text-[10px] w-24 shrink-0 ${POPUP_TYPE_COLORS[item.popup_type] ?? 'text-muted-foreground'}`}>
                            {item.popup_type}
                          </span>
                          <span className="flex-1 truncate text-[13px]">{item.popup_title ?? item.popup_id}</span>
                          {item.subject && <SubjectBadge subject={item.subject} />}
                          <span className="font-mono text-[12px] text-steami-cyan shrink-0">{item.count}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </ApiStatePanel>
        )}

        {/* ── Security ─────────────────────────────────────────────────────── */}
        {isAdmin && (
          <ApiStatePanel
            title="DDoS Protection"
            {...security}
            onRefresh={() => load(setSecurity, api.security.stats)}
          >
            {sec && (
              <>
                <div className="grid grid-cols-2 gap-3 mb-4">
                  <StatCard label="Total Requests"  value={sec.total_requests} />
                  <StatCard label="Blocked Requests" value={sec.blocked_requests} />
                  <StatCard label="Rate-Limit Hits"  value={sec.rate_limit_hits} />
                  <StatCard label="Active Bans"      value={bannedIps.length} />
                </div>
                {bannedIps.length > 0 && (
                  <div className="mb-4 space-y-2">
                    <div className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">Permanently banned IPs</div>
                    {bannedIps.map((ipAddr) => (
                      <div key={ipAddr} className="flex items-center gap-2 rounded-md border border-white/10 bg-white/[0.03] px-3 py-2">
                        <span className="font-mono text-[12px] flex-1">{ipAddr}</span>
                        <button className="steami-btn text-[11px] py-1 px-2" onClick={() => api.security.unban(ipAddr).then(() => load(setSecurity, api.security.stats))}>
                          Unban
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
            <div className="flex flex-wrap gap-2">
              <input value={ip} onChange={(e) => setIp(e.target.value)} placeholder="IP address to ban / unban" className="min-w-0 flex-1 rounded-md border border-white/10 bg-transparent px-3 py-2 text-[14px]" />
              <button className="steami-btn text-[11px]" onClick={() => ip && api.security.ban(ip).then(() => load(setSecurity, api.security.stats))}>Ban IP</button>
              <button className="steami-btn text-[11px]" onClick={() => ip && api.security.unban(ip).then(() => load(setSecurity, api.security.stats))}>Unban IP</button>
              <button className="steami-btn text-[11px]" onClick={() => api.security.clearTempBans().then(() => load(setSecurity, api.security.stats))}>
                <Trash2 className="w-3 h-3" /> Clear temp bans
              </button>
            </div>
          </ApiStatePanel>
        )}

        {/* ── Users ────────────────────────────────────────────────────────── */}
        {isAdmin && (
          <ApiStatePanel title="Users and Roles" {...users} onRefresh={() => load(setUsers, api.auth.users)}>
            <div className="space-y-2">
              {normalizedUsers.map((u: any) => {
                const uid: string = u.id ?? u.uid;
                return (
                  <div key={uid ?? u.email} className="rounded-lg border border-white/10 bg-white/[0.03] p-3 flex flex-wrap items-center gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="font-serif text-[16px] font-bold">{u.full_name ?? u.display_name ?? u.email}</div>
                      <div className="font-mono text-[11px] text-muted-foreground">{u.email}</div>
                      {u.profession && <div className="font-mono text-[10px] text-muted-foreground/60">{u.profession}</div>}
                    </div>
                    <select value={u.role ?? 'user'} onChange={(e) => api.auth.updateRole(uid, e.target.value).then(() => load(setUsers, api.auth.users))} className="rounded-md border border-steami-cyan/20 bg-transparent px-2 py-1.5 font-mono text-[11px]">
                      <option value="user">user</option>
                      <option value="mod">mod</option>
                      <option value="admin">admin</option>
                    </select>
                    <button title={u.subscribe_email ? 'Unsubscribe' : 'Subscribe'} className={`steami-btn text-[11px] ${u.subscribe_email ? 'opacity-100' : 'opacity-40'}`} onClick={() => api.auth.toggleUserSubscription(uid).then(() => load(setUsers, api.auth.users))}>
                      Digest {u.subscribe_email ? 'ON' : 'OFF'}
                    </button>
                    <button className="text-steami-red" title="Delete user" onClick={() => window.confirm(`Delete ${u.email}?`) && api.auth.deleteUser(uid).then(() => load(setUsers, api.auth.users))}>
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                );
              })}
            </div>
          </ApiStatePanel>
        )}

        {/* ── Newsletter ───────────────────────────────────────────────────── */}
        <ApiStatePanel title="Newsletter" {...newsletter} onRefresh={() => load(setNewsletter, api.newsletter.recipients)}>
          <div className="space-y-2">
            {normalizedNewsletter.length === 0
              ? <p className="text-muted-foreground text-[13px]">No newsletter recipients yet.</p>
              : normalizedNewsletter.map((r: NewsletterRecipient, i: number) => <NewsletterRow key={r.id ?? r.email ?? i} r={r} />)
            }
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            <input value={testEmail} onChange={(e) => { setTestEmail(e.target.value); setTestSendStatus(null); }} placeholder="test@example.com" className="min-w-0 flex-1 rounded-md border border-white/10 bg-transparent px-3 py-2 text-[14px]" />
            <button className="steami-btn text-[11px]" onClick={async () => { if (!testEmail) return; setTestSendStatus(null); try { await api.newsletter.test(testEmail); setTestSendStatus({ ok: true, msg: `Test sent to ${testEmail}` }); } catch (e: any) { setTestSendStatus({ ok: false, msg: e.message || 'Send failed' }); } }}>
              <Send className="w-3 h-3" /> Send test
            </button>
            <button className="steami-btn text-[11px] flex items-center gap-1.5" disabled={sendCustomLoading || sendCustomDraftLoading} onClick={async () => { if (!window.confirm('Send the saved newsletter draft to ALL subscribers?')) return; setSendCustomStatus(null); setSendCustomLoading(true); try { setSendCustomDraftLoading(true); const saved = await api.newsletter.getDraft().catch(() => null); setSendCustomDraftLoading(false); const payload = saved?.draft ?? {}; const res = await api.newsletter.sendCustom(payload); setSendCustomStatus({ ok: true, msg: `Sent to ${res?.sent ?? '?'} subscriber(s). Failed: ${res?.failed ?? 0}.` }); } catch (e: any) { setSendCustomStatus({ ok: false, msg: e.message || 'Send failed' }); } finally { setSendCustomLoading(false); setSendCustomDraftLoading(false); } }}>
              <Send className={`w-3 h-3 ${sendCustomLoading ? 'animate-pulse' : ''}`} />
              {sendCustomDraftLoading ? 'Loading draft…' : sendCustomLoading ? 'Sending…' : 'Send custom newsletter'}
            </button>
          </div>
          {testSendStatus && <p className={`mt-2 font-mono text-[11px] ${testSendStatus.ok ? 'text-green-400' : 'text-red-400'}`}>{testSendStatus.ok ? '✓' : '✕'} {testSendStatus.msg}</p>}
          {sendCustomStatus && <p className={`mt-2 font-mono text-[11px] ${sendCustomStatus.ok ? 'text-green-400' : 'text-red-400'}`}>{sendCustomStatus.ok ? '✓' : '✕'} {sendCustomStatus.msg}</p>}
        </ApiStatePanel>

        {/* ── Article Refresh ──────────────────────────────────────────────── */}
        <div className="lg:col-span-2">
          <ApiStatePanel title="News Refresh &amp; Insight Pipeline" loading={false} error={articleRefresh.error} onRefresh={() => api.insights.status().then(setInsightStatus).catch(() => undefined)}>
            <p className="text-[13px] text-muted-foreground mb-4">Fetches up to 40 fresh news items from all RSS sources. Skips duplicates by URL. AI insight generation starts automatically in the background.</p>
            {insightStatus && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
                {Object.entries(insightStatus).map(([k, v]) => <StatCard key={k} label={k.replace(/_/g, ' ')} value={String(v)} />)}
              </div>
            )}
            {articleRefresh.result && (
              <div className="mb-4 rounded-md border border-white/10 bg-white/[0.03] px-4 py-3 space-y-1">
                <div className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground mb-2">Last refresh result</div>
                {Object.entries(articleRefresh.result).map(([k, v]) => (
                  <div key={k} className="flex gap-2 font-mono text-[12px]">
                    <span className="text-muted-foreground w-40 shrink-0">{k.replace(/_/g, ' ')}</span>
                    <span className={k === 'insight_thread' ? 'text-steami-gold' : 'text-steami-cyan'}>{String(v)}</span>
                  </div>
                ))}
              </div>
            )}
            <div className="flex flex-wrap gap-2">
              <button className="steami-btn text-[11px] flex items-center gap-1.5" onClick={runArticleRefresh} disabled={articleRefresh.loading}>
                <RefreshCw className={`w-3 h-3 ${articleRefresh.loading ? 'animate-spin' : ''}`} />
                {articleRefresh.loading ? 'Fetching…' : 'Refresh all news'}
              </button>
              <button className="steami-btn text-[11px] flex items-center gap-1.5" onClick={() => api.insights.process(2).then(() => api.insights.status().then(setInsightStatus))}>
                <Zap className="w-3 h-3" /> Process insights
              </button>
              <button className="steami-btn text-[11px] flex items-center gap-1.5" onClick={() => api.insights.clearQueue().then(() => api.insights.status().then(setInsightStatus))}>
                <Trash2 className="w-3 h-3" /> Clear insight queue
              </button>
            </div>
          </ApiStatePanel>
        </div>

        {/* ── Event log ────────────────────────────────────────────────────── */}
        {isAdmin && (
          <div className="lg:col-span-2">
            <ApiStatePanel title="Popup Event Log" {...events} onRefresh={loadEvents}>
              <div className="mb-4 flex flex-wrap gap-2 items-center">
                <Filter className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                <select value={eventTypeFilter} onChange={(e) => setEventTypeFilter(e.target.value)} className="rounded-md border border-white/10 bg-transparent px-3 py-1.5 text-[13px] font-mono text-muted-foreground">
                  <option value="">All types</option>
                  <option value="research_article">research_article</option>
                  <option value="ai_insight">ai_insight</option>
                  <option value="explainer">explainer</option>
                  <option value="simulation">simulation</option>
                </select>
                <select value={eventSubject} onChange={(e) => setEventSubject(e.target.value)} className="rounded-md border border-white/10 bg-transparent px-3 py-1.5 text-[13px] font-mono text-muted-foreground">
                  <option value="">All subjects</option>
                  {ALL_SUBJECTS.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
                <input value={eventUidFilter} onChange={(e) => setEventUidFilter(e.target.value)} placeholder="uid filter" className="rounded-md border border-white/10 bg-transparent px-3 py-1.5 text-[13px] w-40" />
                <input type="number" min={1} max={500} value={eventLimit} onChange={(e) => setEventLimit(Number(e.target.value))} className="rounded-md border border-white/10 bg-transparent px-3 py-1.5 text-[13px] w-24" placeholder="limit" />
                <button className="steami-btn text-[11px]" onClick={loadEvents}>Apply</button>
              </div>
              <div className="space-y-2">
                {normalizedEvents.length === 0
                  ? <p className="text-muted-foreground text-[13px]">No popup events logged yet.</p>
                  : normalizedEvents.map((ev: PopupEvent, i: number) => <EventRow key={ev.id ?? `${ev.popup_id}-${i}`} ev={ev} />)
                }
              </div>
            </ApiStatePanel>
          </div>
        )}

        {/* ── CSV Export Viewer ─────────────────────────────────────────────── */}
        {isAdmin && <CsvViewerPanel />}

        {/* ── Recommendation Engine Data ────────────────────────────────────── */}
        {isAdmin && <RecommendationPanel />}

        {/* ── Unique Visitor Tracker ───────────────────────────────────────── */}
        {isAdmin && <VisitorPanel />}

      </div>
    </SteamiLayout>
  );
}
