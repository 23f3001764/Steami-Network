import { Loader2, RefreshCw } from 'lucide-react';

export function ApiStatePanel({
  title,
  error,
  loading,
  onRefresh,
  children,
}: {
  title: string;
  error?: string;
  loading?: boolean;
  onRefresh?: () => void;
  children: React.ReactNode;
}) {
  return (
    <section className="glass-card p-5 overflow-hidden">
      <div className="flex items-center justify-between gap-3 mb-4">
        <h2 className="steami-section-label mb-0">{title}</h2>
        {onRefresh && (
          <button onClick={onRefresh} className="steami-btn text-[11px] py-1.5 px-2.5" disabled={loading}>
            {loading ? <Loader2 className="w-3 h-3 animate-spin" /> : <RefreshCw className="w-3 h-3" />}
            Refresh
          </button>
        )}
      </div>
      {error ? (
        <div className="rounded-md border border-steami-red/20 bg-steami-red/5 p-3 text-[13px] text-steami-red">{error}</div>
      ) : loading ? (
        <div className="flex items-center gap-2 text-muted-foreground font-mono text-[11px]">
          <Loader2 className="w-3 h-3 animate-spin" /> Loading
        </div>
      ) : (
        children
      )}
    </section>
  );
}

export function MetricGrid({ data }: { data: Record<string, unknown> }) {
  const entries = Object.entries(data || {}).filter(([, value]) => typeof value !== 'object' || value === null).slice(0, 12);
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      {entries.map(([key, value]) => (
        <div key={key} className="rounded-lg border border-steami-cyan/10 bg-steami-cyan/5 p-3">
          <div className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">{key.replace(/_/g, ' ')}</div>
          <div className="mt-1 font-mono text-lg font-bold text-foreground">{String(value ?? '0')}</div>
        </div>
      ))}
    </div>
  );
}

export function ObjectList({ items, empty = 'No records found.' }: { items: any[]; empty?: string }) {
  if (!items?.length) return <p className="text-[13px] text-muted-foreground">{empty}</p>;
  return (
    <div className="space-y-2">
      {items.slice(0, 20).map((item, idx) => (
        <div key={item.id ?? item.uid ?? item.email ?? idx} className="rounded-lg border border-white/10 bg-white/[0.03] p-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-serif text-[16px] font-bold text-foreground">{item.title ?? item.full_name ?? item.display_name ?? item.email ?? item.id ?? `Record ${idx + 1}`}</span>
            {(item.role || item.field || item.topic) && <span className="steami-badge steami-badge-cyan text-[10px]">{item.role ?? item.field ?? item.topic}</span>}
          </div>
          <p className="mt-1 text-[13px] text-muted-foreground line-clamp-2">
            {item.description ?? item.abstract ?? item.short_summary ?? item.content ?? item.selected_text ?? item.source ?? item.url ?? ''}
          </p>
        </div>
      ))}
    </div>
  );
}
