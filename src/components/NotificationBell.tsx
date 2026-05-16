/**
 * NotificationBell.tsx
 * ─────────────────────────────────────────────────────────────────────────────
 * Polls GET /api/notifications/latest every 60 s, shows a badge count,
 * and renders a dropdown panel with new Explainers, Research, and Blog posts.
 *
 * Usage in SteamiNav.tsx:
 *   import { NotificationBell } from '@/components/NotificationBell';
 *   // Drop inside the <div className="ml-auto flex items-center gap-4"> block:
 *   <NotificationBell />
 *
 * Dependencies (already in STEAMI):
 *   - lucide-react    (Bell icon)
 *   - framer-motion   (AnimatePresence, motion)
 *   - react-router-dom (Link)
 *   - @/stores/theme-store (useThemeStore)
 *   - @/lib/api        (api.get or raw fetch — see apiGet below)
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, BookOpen, FlaskConical, Newspaper, X, ChevronRight } from 'lucide-react';
import { useThemeStore } from '@/stores/theme-store';
import { api } from '@/lib/api';

// ── Types ─────────────────────────────────────────────────────────────────────

type ContentType = 'explainer' | 'research' | 'blog';

interface NotificationItem {
  id:         string;
  type:       ContentType;
  title:      string;
  field:      string;
  image:      string;
  created_at: string;
  url:        string;
}

// ── Constants ─────────────────────────────────────────────────────────────────

const STORAGE_KEY   = 'steami_notif_since';
const POLL_INTERVAL = 60_000; // 60 seconds
const API_BASE      = '/api/notifications/latest';

const TYPE_META: Record<ContentType, { label: string; Icon: React.ElementType; color: string }> = {
  explainer: { label: 'Explainer',        Icon: BookOpen,     color: '#00d9ff' },
  research:  { label: 'Research Article', Icon: FlaskConical, color: '#ff4ef0' },
  blog:      { label: 'Blog Post',        Icon: Newspaper,    color: '#e8b84b' },
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function getSince(): string {
  return localStorage.getItem(STORAGE_KEY) ?? new Date(Date.now() - 7 * 86_400_000).toISOString();
}

function saveSince(iso: string) {
  localStorage.setItem(STORAGE_KEY, iso);
}

function formatRelative(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60_000);
  if (m < 60)   return m <= 1 ? 'just now' : `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24)   return `${h}h ago`;
  const d = Math.floor(h / 24);
  return `${d}d ago`;
}

// ── Main Component ────────────────────────────────────────────────────────────

export function NotificationBell() {
  const { theme }                = useThemeStore();
  const isLight                  = theme === 'light';

  const [items,   setItems]      = useState<NotificationItem[]>([]);
  const [unread,  setUnread]     = useState(0);
  const [open,    setOpen]       = useState(false);
  const [loading, setLoading]    = useState(false);
  const panelRef                 = useRef<HTMLDivElement>(null);
  const pollerRef                = useRef<ReturnType<typeof setInterval> | null>(null);

  // ── Fetch ──────────────────────────────────────────────────────────────────

  const fetchNotifications = useCallback(async () => {
    setLoading(true);
    try {
      const since = getSince();
      const data = await api.notifications.latest(since, 20);

      if (data.items.length > 0) {
        setItems(prev => {
          // Deduplicate by id+type
          const existing = new Set(prev.map(i => `${i.type}:${i.id}`));
          const fresh    = data.items.filter((i: any) => !existing.has(`${i.type}:${i.id}`));
          return [...fresh, ...prev].slice(0, 50); // cap history at 50
        });
        setUnread(prev => prev + data.items.length);

        // Advance the since cursor to the newest item's timestamp
        const newest = data.items.reduce((a: any, b: any) =>
          (a.created_at || a.date) > (b.created_at || b.date) ? a : b
        );
        // Add 1 ms to avoid re-fetching the same item
        const nextSince = new Date(new Date(newest.created_at || newest.date).getTime() + 1).toISOString();
        saveSince(nextSince);
      }
    } catch {
      // Network errors are silent — will retry on next interval
    } finally {
      setLoading(false);
    }
  }, []);

  // ── Polling ────────────────────────────────────────────────────────────────

  useEffect(() => {
    fetchNotifications();
    pollerRef.current = setInterval(fetchNotifications, POLL_INTERVAL);
    return () => { if (pollerRef.current) clearInterval(pollerRef.current); };
  }, [fetchNotifications]);

  // ── Close on outside click / Escape ───────────────────────────────────────

  useEffect(() => {
    if (!open) return;
    const onKey   = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
    const onClick = (e: MouseEvent)    => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('keydown', onClick as any);
    document.addEventListener('keydown', onKey);
    document.addEventListener('mousedown', onClick);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.removeEventListener('mousedown', onClick);
    };
  }, [open]);

  // ── Mark as read when panel opens ─────────────────────────────────────────

  const handleOpen = () => {
    setOpen(v => {
      if (!v) setUnread(0);
      return !v;
    });
  };

  // ── Clear all ─────────────────────────────────────────────────────────────

  const clearAll = () => {
    setItems([]);
    setUnread(0);
    saveSince(new Date().toISOString());
  };

  // ── Styles ────────────────────────────────────────────────────────────────

  const glassStyle = {
    border:          `1px solid ${isLight ? 'rgba(147,197,253,0.4)' : 'rgba(99,179,237,0.18)'}`,
    background:      isLight ? 'rgba(255,255,255,0.6)' : 'rgba(10,25,55,0.4)',
    backdropFilter:  'blur(8px)',
  } as React.CSSProperties;

  const panelStyle = {
    background:     isLight ? 'rgba(255,255,255,0.95)' : 'rgba(5,15,40,0.96)',
    border:         `1px solid ${isLight ? 'rgba(147,197,253,0.4)' : 'rgba(99,179,237,0.14)'}`,
    backdropFilter: 'blur(24px) saturate(200%)',
    boxShadow:      isLight
      ? '0 8px 40px rgba(0,180,255,0.12)'
      : '0 8px 40px rgba(0,0,0,0.6), 0 0 0 1px rgba(0,217,255,0.06)',
  } as React.CSSProperties;

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="relative" ref={panelRef}>

      {/* ── Bell Button ─────────────────────────────────────────────────── */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={handleOpen}
        className="relative w-9 h-9 rounded-lg flex items-center justify-center transition-all duration-200
                   hover:shadow-[0_0_15px_rgba(0,255,255,0.15)]"
        style={glassStyle}
        aria-label="Notifications"
      >
        <motion.div
          animate={loading ? { rotate: [0, 15, -15, 0] } : {}}
          transition={{ repeat: Infinity, duration: 1.4, ease: 'easeInOut' }}
        >
          <Bell
            className="w-3.5 h-3.5"
            style={{ color: unread > 0 ? '#00d9ff' : (isLight ? '#64748b' : '#94a3b8') }}
          />
        </motion.div>

        {/* Badge */}
        <AnimatePresence>
          {unread > 0 && (
            <motion.span
              key="badge"
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              className="absolute -top-1 -right-1 min-w-[16px] h-4 px-0.5 rounded-full
                         flex items-center justify-center
                         font-mono text-[9px] font-bold text-black"
              style={{ background: 'linear-gradient(135deg, #00d9ff, #ff4ef0)' }}
            >
              {unread > 99 ? '99+' : unread}
            </motion.span>
          )}
        </AnimatePresence>
      </motion.button>

      {/* ── Dropdown Panel ──────────────────────────────────────────────── */}
      <AnimatePresence>
        {open && (
          <motion.div
            key="panel"
            initial={{ opacity: 0, y: -8, scale: 0.96 }}
            animate={{ opacity: 1, y: 0,  scale: 1 }}
            exit={{   opacity: 0, y: -8, scale: 0.96 }}
            transition={{ duration: 0.18, ease: [0.25, 0.1, 0.25, 1] }}
            className="absolute right-0 top-12 w-[340px] rounded-xl overflow-hidden z-50"
            style={panelStyle}
          >
            {/* Header */}
            <div
              className="flex items-center justify-between px-4 py-3 border-b"
              style={{ borderColor: isLight ? 'rgba(147,197,253,0.25)' : 'rgba(99,179,237,0.1)' }}
            >
              <div className="flex items-center gap-2">
                <Bell className="w-3.5 h-3.5" style={{ color: '#00d9ff' }} />
                <span className="font-mono text-[11px] tracking-widest uppercase"
                      style={{ color: isLight ? '#0f172a' : '#e2e8f0' }}>
                  Notifications
                </span>
                {items.length > 0 && (
                  <span className="font-mono text-[10px] px-1.5 py-0.5 rounded-full"
                        style={{
                          background: isLight ? 'rgba(0,217,255,0.1)' : 'rgba(0,217,255,0.12)',
                          color: '#00d9ff',
                        }}>
                    {items.length}
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2">
                {items.length > 0 && (
                  <button
                    onClick={clearAll}
                    className="font-mono text-[9px] tracking-wider uppercase opacity-50 hover:opacity-100 transition-opacity"
                    style={{ color: isLight ? '#64748b' : '#94a3b8' }}
                  >
                    Clear all
                  </button>
                )}
                <button onClick={() => setOpen(false)} className="opacity-40 hover:opacity-80 transition-opacity">
                  <X className="w-3 h-3" style={{ color: isLight ? '#0f172a' : '#e2e8f0' }} />
                </button>
              </div>
            </div>

            {/* Items */}
            <div className="max-h-[420px] overflow-y-auto steami-scrollbar">
              {items.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 gap-3">
                  <motion.div
                    animate={{ y: [0, -4, 0] }}
                    transition={{ repeat: Infinity, duration: 2.5, ease: 'easeInOut' }}
                  >
                    <Bell className="w-8 h-8 opacity-20" style={{ color: isLight ? '#0f172a' : '#e2e8f0' }} />
                  </motion.div>
                  <span className="font-mono text-[10px] tracking-widest uppercase opacity-30"
                        style={{ color: isLight ? '#0f172a' : '#e2e8f0' }}>
                    All caught up
                  </span>
                </div>
              ) : (
                <ul>
                  {items.map((item, idx) => {
                    const meta = TYPE_META[item.type] ?? TYPE_META.blog;
                    const Icon = meta.Icon;
                    return (
                      <motion.li
                        key={`${item.type}:${item.id}`}
                        initial={{ opacity: 0, x: -8 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: idx * 0.04, duration: 0.22 }}
                      >
                        <Link
                          to={item.url}
                          onClick={() => setOpen(false)}
                          className="flex items-start gap-3 px-4 py-3 group transition-all duration-150"
                          style={{
                            borderBottom: `1px solid ${isLight ? 'rgba(147,197,253,0.12)' : 'rgba(99,179,237,0.07)'}`,
                          }}
                          onMouseEnter={e => {
                            (e.currentTarget as HTMLElement).style.background =
                              isLight ? 'rgba(0,217,255,0.04)' : 'rgba(0,217,255,0.05)';
                          }}
                          onMouseLeave={e => {
                            (e.currentTarget as HTMLElement).style.background = 'transparent';
                          }}
                        >
                          {/* Icon / thumbnail */}
                          <div
                            className="shrink-0 w-9 h-9 rounded-lg flex items-center justify-center overflow-hidden mt-0.5"
                            style={{ background: `${meta.color}18`, border: `1px solid ${meta.color}30` }}
                          >
                            {item.image ? (
                              <img
                                src={item.image}
                                alt=""
                                className="w-full h-full object-cover rounded-lg"
                                onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
                              />
                            ) : (
                              <Icon className="w-4 h-4" style={{ color: meta.color }} />
                            )}
                          </div>

                          {/* Text */}
                          <div className="flex-1 min-w-0">
                            {/* Type badge */}
                            <div className="flex items-center gap-1.5 mb-0.5">
                              <span
                                className="font-mono text-[8px] tracking-widest uppercase font-semibold"
                                style={{ color: meta.color }}
                              >
                                New {meta.label}
                              </span>
                              {item.field && (
                                <span
                                  className="font-mono text-[8px] tracking-wider uppercase opacity-50"
                                  style={{ color: isLight ? '#64748b' : '#94a3b8' }}
                                >
                                  · {item.field}
                                </span>
                              )}
                            </div>

                            <p
                              className="font-mono text-[11px] leading-snug line-clamp-2 group-hover:opacity-100 transition-opacity"
                              style={{ color: isLight ? '#0f172a' : '#e2e8f0', opacity: 0.85 }}
                            >
                              {item.title}
                            </p>

                            <span
                              className="font-mono text-[9px] opacity-40 mt-1 block"
                              style={{ color: isLight ? '#64748b' : '#94a3b8' }}
                            >
                              {formatRelative(item.created_at)}
                            </span>
                          </div>

                          {/* Chevron */}
                          <ChevronRight
                            className="w-3 h-3 shrink-0 mt-1 opacity-0 group-hover:opacity-40 transition-opacity"
                            style={{ color: isLight ? '#0f172a' : '#e2e8f0' }}
                          />
                        </Link>
                      </motion.li>
                    );
                  })}
                </ul>
              )}
            </div>

            {/* Footer */}
            {items.length > 0 && (
              <div
                className="px-4 py-2.5 flex items-center justify-center border-t"
                style={{ borderColor: isLight ? 'rgba(147,197,253,0.18)' : 'rgba(99,179,237,0.08)' }}
              >
                <span className="font-mono text-[9px] tracking-widest uppercase opacity-30"
                      style={{ color: isLight ? '#0f172a' : '#e2e8f0' }}>
                  Polling every 60s
                </span>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
