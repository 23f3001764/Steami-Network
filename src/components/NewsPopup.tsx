import { useEffect, useRef, useState } from 'react';
import { ExternalLink, Radio, X } from 'lucide-react';
import { api } from '@/lib/api';

export function NewsPopup() {
  const [articles, setArticles] = useState<any[]>([]);
  const [idx, setIdx] = useState(0);
  const [visible, setVisible] = useState(true);
  const [dismissed, setDismissed] = useState(false);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    api.articles
      .list({ limit: 15 })
      .then((data: any) => setArticles(Array.isArray(data) ? data : data?.articles ?? data?.items ?? []))
      .catch(() => undefined);
  }, []);

  useEffect(() => {
    if (articles.length === 0 || dismissed) return;
    timer.current = setInterval(() => {
      setVisible(false);
      setTimeout(() => {
        setIdx((i) => (i + 1) % articles.length);
        setVisible(true);
      }, 240);
    }, 5200);
    return () => {
      if (timer.current) clearInterval(timer.current);
    };
  }, [articles.length, dismissed]);

  if (dismissed || articles.length === 0) return null;

  const item = articles[idx];
  const source = item.source || item.topic || item.matched_domains?.[0] || '';
  const readUrl = item.article_url || item.url || '';
  const summary = item.short_summary || item.description || item.content || '';

  return (
    <div className="fixed bottom-4 left-4 z-40 hidden w-72 overflow-hidden rounded-xl border border-white/10 shadow-2xl transition-all duration-300 sm:block"
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(8px)',
        background: 'rgba(6,9,20,0.91)',
        backdropFilter: 'blur(22px)',
      }}
    >
      <div className="flex items-center justify-between border-b border-white/[0.06] px-3 py-2">
        <div className="flex items-center gap-1.5">
          <Radio className="h-3 w-3 animate-pulse text-indigo-400" />
          <span className="text-[9px] font-bold uppercase tracking-[0.18em] text-indigo-400">Live</span>
        </div>
        <button onClick={() => setDismissed(true)} className="p-0.5 text-white/25 hover:text-white/65">
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
      <div className="px-3 py-3">
        {source && <p className="mb-1 text-[9px] font-bold uppercase tracking-widest text-indigo-400">{source}</p>}
        <p className="mb-1.5 line-clamp-2 text-[12px] font-semibold leading-snug text-white">{item.title}</p>
        {summary && <p className="mb-2 line-clamp-2 text-[10px] leading-relaxed text-white/35">{summary}</p>}
        <div className="flex items-center justify-between">
          <span className="text-[9px] text-white/20">{item.published_at ? new Date(item.published_at).toLocaleDateString() : ''}</span>
          {readUrl && (
            <a href={readUrl} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-[10px] text-indigo-400 hover:text-indigo-300">
              Read <ExternalLink className="h-2.5 w-2.5" />
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
