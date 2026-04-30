import { useEffect, useMemo, useState } from 'react';
import { SteamiLayout } from '@/components/SteamiLayout';
import { ApiStatePanel } from '@/components/ApiStatePanel';
import { api } from '@/lib/api';
import { useAuthStore } from '@/stores/auth-store';
import { Shield, Send, Trash2, Filter, Zap, RefreshCw, Clock } from 'lucide-react';

type LoadState = { data: any; loading: boolean; error: string };

const initial: LoadState = { data: null, loading: true, error: '' };

// ── Typed shapes from OpenAPI ────────────────────────────────────────────────

interface DashboardAdmin {
  total_events: number;
  unique_users: number;
  by_popup_type: Record<string, number>;
  by_date: Record<string, number>;       // last 30 days
  top_10: Array<{ popup_id: string; popup_type: string; count: number; title?: string }>;
}

interface SecurityStats {
  total_requests: number;
  blocked_requests: number;
  rate_limit_hits: number;
  active_bans: string[] | Record<string, unknown>;
  temp_bans?: string[] | Record<string, unknown>;
  [key: string]: unknown;
}

interface PopupEvent {
  id?: string;
  popup_id: string;
  popup_type: string;
  popup_title?: string;
  uid?: string;
  user_email?: string;
  user_name?: string;
  created_at?: string;
  timestamp?: string;
  [key: string]: unknown;
}

interface NewsletterRecipient {
  id?: string;
  email: string;
  name?: string;
  full_name?: string;
  subscribed_at?: string;
  created_at?: string;
  is_active?: boolean;
  [key: string]: unknown;
}

// ── Row components ───────────────────────────────────────────────────────────

const POPUP_TYPE_COLORS: Record<string, string> = {
  article: 'text-steami-cyan',
  insight: 'text-steami-gold',
  explainer: 'text-purple-400',
  research: 'text-green-400',
  blog: 'text-pink-400',
  feed: 'text-orange-400',
};

function EventRow({ ev }: { ev: PopupEvent }) {
  const typeColor = POPUP_TYPE_COLORS[ev.popup_type] ?? 'text-muted-foreground';
  const when = ev.created_at ?? ev.timestamp;
  const displayTime = when
    ? new Date(when).toLocaleString(undefined, { dateStyle: 'short', timeStyle: 'short' })
    : null;
  const who = ev.user_email ?? ev.user_name ?? ev.uid ?? '—';

  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 rounded-md border border-white/10 bg-white/[0.03] px-3 py-2">
      {/* type badge */}
      <span className={`font-mono text-[10px] uppercase tracking-wider shrink-0 w-20 ${typeColor}`}>
        {ev.popup_type}
      </span>
      {/* title or id */}
      <span className="flex-1 min-w-0 truncate text-[13px] font-medium">
        {ev.popup_title || ev.popup_id}
      </span>
      {/* user */}
      <span className="font-mono text-[11px] text-muted-foreground truncate max-w-[160px]" title={who}>
        {who}
      </span>
      {/* time */}
      {displayTime && (
        <span className="font-mono text-[10px] text-muted-foreground/60 shrink-0">{displayTime}</span>
      )}
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

// ── Small display helpers ────────────────────────────────────────────────────

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
  return (
    <div className="mt-4">
      <div className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground mb-2">{title}</div>
      <div className="space-y-1">
        {entries.map(([key, val]) => (
          <div key={key} className="flex items-center gap-2 font-mono text-[12px]">
            <span className="flex-1 truncate">{key}</span>
            <span className="text-steami-cyan">{val}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Main page ────────────────────────────────────────────────────────────────

export default function AdminPage() {
  const user = useAuthStore((s) => s.user);

  const [dashboard, setDashboard] = useState<LoadState>(initial);
  const [events, setEvents] = useState<LoadState>(initial);
  const [users, setUsers] = useState<LoadState>(initial);
  const [security, setSecurity] = useState<LoadState>(initial);
  const [newsletter, setNewsletter] = useState<LoadState>(initial);
  const [articleRefresh, setArticleRefresh] = useState<{ loading: boolean; result: any; error: string }>({ loading: false, result: null, error: '' });
  const [insightStatus, setInsightStatus] = useState<any>(null);
  const [cleanup, setCleanup] = useState<{ loading: boolean; result: any; error: string; schedulerStatus: any }>({
    loading: false, result: null, error: '', schedulerStatus: null,
  });

  // IP ban controls
  const [ip, setIp] = useState('');
  // Newsletter test
  const [testEmail, setTestEmail] = useState('');
  // Event log filters (supported by GET /api/dashboard/admin/events)
  const [eventTypeFilter, setEventTypeFilter] = useState('');
  const [eventUidFilter, setEventUidFilter] = useState('');
  const [eventLimit, setEventLimit] = useState(50);

  const isAdmin = user?.role === 'admin';

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
        limit: eventLimit,
        ...(eventTypeFilter ? { popup_type: eventTypeFilter } : {}),
        ...(eventUidFilter ? { uid_filter: eventUidFilter } : {}),
      })
    );

  const refreshAll = () => {
    load(setDashboard, api.dashboard.admin);
    loadEvents();
    load(setUsers, api.auth.users);
    load(setSecurity, api.security.stats);
    load(setNewsletter, api.newsletter.recipients);
    api.insights.status().then(setInsightStatus).catch(() => undefined);
    api.admin.cleanupStatus().then((s: any) => setCleanup(prev => ({ ...prev, schedulerStatus: s }))).catch(() => undefined);
  };

  const runCleanup = async () => {
    setCleanup(prev => ({ ...prev, loading: true, result: null, error: '' }));
    try {
      const result = await api.admin.triggerCleanup();
      setCleanup(prev => ({ ...prev, loading: false, result }));
    } catch (err: any) {
      setCleanup(prev => ({ ...prev, loading: false, error: err.message || 'Cleanup failed' }));
    }
  };

  // POST /api/articles/refresh — domains always [] to fetch all types, target 40
  const runArticleRefresh = async () => {
    setArticleRefresh({ loading: true, result: null, error: '' });
    try {
      const result = await api.articles.refresh({ domains: [], target: 40 });
      setArticleRefresh({ loading: false, result, error: '' });
      // Start polling insight status if background thread kicked off
      if (result?.insight_thread) {
        const poll = setInterval(() => {
          api.insights.status().then(setInsightStatus).catch(() => undefined);
        }, 15_000);
        setTimeout(() => clearInterval(poll), 10 * 60 * 1000); // stop after 10 min
      }
    } catch (err: any) {
      setArticleRefresh({ loading: false, result: null, error: err.message || 'Refresh failed' });
    }
  };

  useEffect(() => {
    if (isAdmin) refreshAll();
  }, [isAdmin]);

  // ── Derived / normalised data ──────────────────────────────────────────────

  const dash: DashboardAdmin | null = dashboard.data ?? null;

  const sec: SecurityStats | null = security.data ?? null;

  // active_bans can be a string[] or object keyed by IP
  const bannedIps = useMemo<string[]>(() => {
    if (!sec) return [];
    const raw = sec.active_bans ?? sec.temp_bans ?? [];
    if (Array.isArray(raw)) return raw.map(String);
    return Object.keys(raw);
  }, [sec]);

  const normalizedUsers = useMemo(
    () => (Array.isArray(users.data) ? users.data : users.data?.users ?? []),
    [users.data]
  );

  const normalizedEvents = useMemo(
    () => (Array.isArray(events.data) ? events.data : events.data?.events ?? []),
    [events.data]
  );

  const normalizedNewsletter = useMemo(
    () =>
      Array.isArray(newsletter.data)
        ? newsletter.data
        : newsletter.data?.recipients ?? newsletter.data?.subscribers ?? [],
    [newsletter.data]
  );

  // ── Access guard ──────────────────────────────────────────────────────────

  if (!isAdmin) {
    return (
      <SteamiLayout>
        <div className="glass-card p-8 text-center">
          <Shield className="w-8 h-8 text-steami-gold mx-auto mb-3" />
          <h1 className="steami-heading text-2xl mb-2">Admin Access Required</h1>
          <p className="text-muted-foreground text-[14px]">
            Sign in with an admin account to manage users, security, dashboards, and newsletters.
          </p>
        </div>
      </SteamiLayout>
    );
  }

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <SteamiLayout>
      <div className="mb-8">
        <h1 className="steami-heading text-3xl md:text-4xl mb-3">Admin Control Room</h1>
        <p className="text-[15px] text-muted-foreground max-w-2xl">
          Platform metrics, user roles, newsletter operations, DDoS controls, and popup event telemetry.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

        {/* ── Dashboard stats: GET /api/dashboard/admin ───────────────────── */}
        <ApiStatePanel
          title="Dashboard — Platform Stats"
          {...dashboard}
          onRefresh={() => load(setDashboard, api.dashboard.admin)}
        >
          {dash && (
            <>
              <div className="grid grid-cols-2 gap-3">
                <StatCard label="Total Events" value={dash.total_events} />
                <StatCard label="Unique Users" value={dash.unique_users} />
              </div>
              <BreakdownTable title="Events by popup type" data={dash.by_popup_type} />
              <BreakdownTable title="Events by date (last 30 days)" data={dash.by_date} />
              {dash.top_10?.length > 0 && (
                <div className="mt-4">
                  <div className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground mb-2">
                    Top 10 items
                  </div>
                  <div className="space-y-1">
                    {dash.top_10.map((item) => (
                      <div
                        key={`${item.popup_type}:${item.popup_id}`}
                        className="flex items-center gap-2 rounded-md border border-white/10 bg-white/[0.03] px-3 py-2"
                      >
                        <span className="font-mono text-[10px] text-muted-foreground w-16 shrink-0">
                          {item.popup_type}
                        </span>
                        <span className="flex-1 truncate text-[13px]">{item.title ?? item.popup_id}</span>
                        <span className="font-mono text-[12px] text-steami-cyan">{item.count}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </ApiStatePanel>

        {/* ── Security: GET /api/security/stats ───────────────────────────── */}
        <ApiStatePanel
          title="DDoS Protection"
          {...security}
          onRefresh={() => load(setSecurity, api.security.stats)}
        >
          {sec && (
            <>
              <div className="grid grid-cols-2 gap-3 mb-4">
                <StatCard label="Total Requests" value={sec.total_requests} />
                <StatCard label="Blocked Requests" value={sec.blocked_requests} />
                <StatCard label="Rate-Limit Hits" value={sec.rate_limit_hits} />
                <StatCard label="Active Bans" value={bannedIps.length} />
              </div>

              {bannedIps.length > 0 && (
                <div className="mb-4 space-y-2">
                  <div className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                    Permanently banned IPs
                  </div>
                  {bannedIps.map((ipAddr) => (
                    <div
                      key={ipAddr}
                      className="flex items-center gap-2 rounded-md border border-white/10 bg-white/[0.03] px-3 py-2"
                    >
                      <span className="font-mono text-[12px] flex-1">{ipAddr}</span>
                      {/* DELETE /api/security/ban/{ip} */}
                      <button
                        className="steami-btn text-[11px] py-1 px-2"
                        onClick={() => api.security.unban(ipAddr).then(() => load(setSecurity, api.security.stats))}
                      >
                        Unban
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}

          {/* POST /api/security/ban/{ip}  &  DELETE /api/security/ban/{ip} */}
          <div className="flex flex-wrap gap-2">
            <input
              value={ip}
              onChange={(e) => setIp(e.target.value)}
              placeholder="IP address to ban / unban"
              className="min-w-0 flex-1 rounded-md border border-white/10 bg-transparent px-3 py-2 text-[14px]"
            />
            <button
              className="steami-btn text-[11px]"
              onClick={() => ip && api.security.ban(ip).then(() => load(setSecurity, api.security.stats))}
            >
              Ban IP
            </button>
            <button
              className="steami-btn text-[11px]"
              onClick={() => ip && api.security.unban(ip).then(() => load(setSecurity, api.security.stats))}
            >
              Unban IP
            </button>
            {/* DELETE /api/security/temp-bans */}
            <button
              className="steami-btn text-[11px]"
              onClick={() => api.security.clearTempBans().then(() => load(setSecurity, api.security.stats))}
            >
              <Trash2 className="w-3 h-3" /> Clear temp bans
            </button>
          </div>
        </ApiStatePanel>

        {/* ── Users: GET /api/auth/users ───────────────────────────────────── */}
        <ApiStatePanel
          title="Users and Roles"
          {...users}
          onRefresh={() => load(setUsers, api.auth.users)}
        >
          <div className="space-y-2">
            {normalizedUsers.map((u: any) => {
              const uid: string = u.id ?? u.uid;
              return (
                <div
                  key={uid ?? u.email}
                  className="rounded-lg border border-white/10 bg-white/[0.03] p-3 flex flex-wrap items-center gap-3"
                >
                  <div className="min-w-0 flex-1">
                    <div className="font-serif text-[16px] font-bold">
                      {u.full_name ?? u.display_name ?? u.email}
                    </div>
                    <div className="font-mono text-[11px] text-muted-foreground">{u.email}</div>
                    {u.profession && (
                      <div className="font-mono text-[10px] text-muted-foreground/60">{u.profession}</div>
                    )}
                  </div>

                  {/* PUT /api/auth/users/{uid}/role  body: { role } */}
                  <select
                    value={u.role ?? 'user'}
                    onChange={(e) =>
                      api.auth
                        .updateRole(uid, e.target.value)
                        .then(() => load(setUsers, api.auth.users))
                    }
                    className="rounded-md border border-steami-cyan/20 bg-transparent px-2 py-1.5 font-mono text-[11px]"
                  >
                    <option value="user">user</option>
                    <option value="mod">mod</option>
                    <option value="admin">admin</option>
                  </select>

                  {/* PATCH /api/auth/users/{uid}/subscribe/toggle */}
                  <button
                    title={u.subscribe_email ? 'Unsubscribe from digest' : 'Subscribe to digest'}
                    className={`steami-btn text-[11px] ${u.subscribe_email ? 'opacity-100' : 'opacity-40'}`}
                    onClick={() =>
                      api.auth
                        .toggleUserSubscription(uid)
                        .then(() => load(setUsers, api.auth.users))
                    }
                  >
                    Digest {u.subscribe_email ? 'ON' : 'OFF'}
                  </button>

                  {/* DELETE /api/auth/users/{uid} */}
                  <button
                    className="text-steami-red"
                    title="Delete user"
                    onClick={() =>
                      window.confirm(`Delete ${u.email}?`) &&
                      api.auth.deleteUser(uid).then(() => load(setUsers, api.auth.users))
                    }
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              );
            })}
          </div>
        </ApiStatePanel>

        {/* ── Newsletter: GET /api/newsletter/recipients ───────────────────── */}
        <ApiStatePanel
          title="Newsletter"
          {...newsletter}
          onRefresh={() => load(setNewsletter, api.newsletter.recipients)}
        >
          <div className="space-y-2">
            {normalizedNewsletter.length === 0
              ? <p className="text-muted-foreground text-[13px]">No newsletter recipients yet.</p>
              : normalizedNewsletter.map((r: NewsletterRecipient, i: number) => (
                  <NewsletterRow key={r.id ?? r.email ?? i} r={r} />
                ))
            }
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            <input
              value={testEmail}
              onChange={(e) => setTestEmail(e.target.value)}
              placeholder="test@example.com"
              className="min-w-0 flex-1 rounded-md border border-white/10 bg-transparent px-3 py-2 text-[14px]"
            />
            {/* POST /api/newsletter/test  body: { to_email, subject? } */}
            <button
              className="steami-btn text-[11px]"
              onClick={() => testEmail && api.newsletter.test(testEmail)}
            >
              <Send className="w-3 h-3" /> Send test
            </button>
            {/* POST /api/newsletter/send-daily?limit=5 */}
            <button
              className="steami-btn text-[11px]"
              onClick={() => api.newsletter.sendDaily(5)}
            >
              Send daily digest
            </button>
          </div>
        </ApiStatePanel>

        {/* ── Article Refresh: POST /api/articles/refresh ──────────────────── */}
        <div className="lg:col-span-2">
          <ApiStatePanel
            title="Article Refresh &amp; Insight Pipeline"
            loading={false}
            error={articleRefresh.error}
            onRefresh={() => api.insights.status().then(setInsightStatus).catch(() => undefined)}
          >
            <p className="text-[13px] text-muted-foreground mb-4">
              Fetches up to 40 fresh articles from all RSS sources (MIT Tech Review, BBC Tech, NYTimes Tech, ScienceDaily).
              Skips duplicates by URL. AI insight generation starts automatically in the background after fetch.
            </p>

            {/* Insight status */}
            {insightStatus && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
                {Object.entries(insightStatus).map(([k, v]) => (
                  <StatCard key={k} label={k.replace(/_/g, ' ')} value={String(v)} />
                ))}
              </div>
            )}

            {/* Result from last refresh */}
            {articleRefresh.result && (
              <div className="mb-4 rounded-md border border-white/10 bg-white/[0.03] px-4 py-3 space-y-1">
                <div className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground mb-2">Last refresh result</div>
                {Object.entries(articleRefresh.result).map(([k, v]) => (
                  <div key={k} className="flex gap-2 font-mono text-[12px]">
                    <span className="text-muted-foreground w-40 shrink-0">{k.replace(/_/g, ' ')}</span>
                    <span className={k === 'insight_thread' ? 'text-steami-gold' : 'text-steami-cyan'}>
                      {String(v)}
                    </span>
                  </div>
                ))}
              </div>
            )}

            <div className="flex flex-wrap gap-2">
              {/* POST /api/articles/refresh  body: { domains: [], target: 40 } */}
              <button
                className="steami-btn text-[11px] flex items-center gap-1.5"
                onClick={runArticleRefresh}
                disabled={articleRefresh.loading}
              >
                <RefreshCw className={`w-3 h-3 ${articleRefresh.loading ? 'animate-spin' : ''}`} />
                {articleRefresh.loading ? 'Fetching…' : 'Refresh all articles'}
              </button>

              {/* POST /api/articles/insights/process */}
              <button
                className="steami-btn text-[11px] flex items-center gap-1.5"
                onClick={() => api.insights.process(2).then(() => api.insights.status().then(setInsightStatus))}
              >
                <Zap className="w-3 h-3" /> Process insights
              </button>

              {/* DELETE /api/articles/insights/queue — admin only */}
              <button
                className="steami-btn text-[11px] flex items-center gap-1.5"
                onClick={() => api.insights.clearQueue().then(() => api.insights.status().then(setInsightStatus))}
              >
                <Trash2 className="w-3 h-3" /> Clear insight queue
              </button>
            </div>
          </ApiStatePanel>
        </div>

        {/* ── Event log: GET /api/dashboard/admin/events ───────────────────── */}
        <div className="lg:col-span-2">
          <ApiStatePanel
            title="Popup Event Log"
            {...events}
            onRefresh={loadEvents}
          >
            {/* Filters supported by the API: popup_type, uid_filter, limit */}
            <div className="mb-4 flex flex-wrap gap-2 items-center">
              <Filter className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
              <input
                value={eventTypeFilter}
                onChange={(e) => setEventTypeFilter(e.target.value)}
                placeholder="popup_type filter"
                className="rounded-md border border-white/10 bg-transparent px-3 py-1.5 text-[13px] w-40"
              />
              <input
                value={eventUidFilter}
                onChange={(e) => setEventUidFilter(e.target.value)}
                placeholder="uid filter"
                className="rounded-md border border-white/10 bg-transparent px-3 py-1.5 text-[13px] w-40"
              />
              <input
                type="number"
                min={1}
                max={500}
                value={eventLimit}
                onChange={(e) => setEventLimit(Number(e.target.value))}
                className="rounded-md border border-white/10 bg-transparent px-3 py-1.5 text-[13px] w-24"
                placeholder="limit"
              />
              <button className="steami-btn text-[11px]" onClick={loadEvents}>
                Apply
              </button>
            </div>

            <div className="space-y-2">
              {normalizedEvents.length === 0
                ? <p className="text-muted-foreground text-[13px]">No popup events logged yet.</p>
                : normalizedEvents.map((ev: PopupEvent, i: number) => (
                    <EventRow key={ev.id ?? `${ev.popup_id}-${i}`} ev={ev} />
                  ))
              }
            </div>
          </ApiStatePanel>
        </div>

        {/* ── Daily Cleanup: POST /api/admin/cleanup ───────────────────────── */}
        <div className="lg:col-span-2">
          <ApiStatePanel
            title="Daily Auto-Cleanup"
            loading={false}
            error={cleanup.error}
            onRefresh={() =>
              api.admin.cleanupStatus()
                .then((s: any) => setCleanup(prev => ({ ...prev, schedulerStatus: s })))
                .catch(() => undefined)
            }
          >
            <p className="text-[13px] text-muted-foreground mb-4">
              Automatically deletes articles, feed items, AI insights, and insight queue entries
              older than <span className="text-steami-cyan font-mono">25 days</span>.
              The scheduler runs every 24 hours on startup. You can also trigger a pass manually.
            </p>

            {/* Scheduler status badges */}
            {cleanup.schedulerStatus && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
                <StatCard
                  label="Scheduler"
                  value={cleanup.schedulerStatus.scheduler_started ? 'Running' : 'Stopped'}
                />
                <StatCard
                  label="In Progress"
                  value={cleanup.schedulerStatus.cleanup_in_progress ? 'Yes' : 'No'}
                />
                <StatCard label="Expiry Days" value={cleanup.schedulerStatus.expiry_days ?? 25} />
                <StatCard
                  label="Interval"
                  value={`${cleanup.schedulerStatus.interval_hours ?? 24}h`}
                />
              </div>
            )}

            {/* Last cleanup result */}
            {cleanup.result && !cleanup.result.skipped && (
              <div className="mb-4 rounded-md border border-white/10 bg-white/[0.03] px-4 py-3 space-y-1">
                <div className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground mb-2">
                  Last cleanup result
                </div>
                {[
                  ['Articles deleted',      cleanup.result.articles?.deleted ?? 0],
                  ['Feed items deleted',    cleanup.result.feed?.deleted ?? 0],
                  ['AI insights deleted',   cleanup.result.ai_insights?.deleted ?? 0],
                  ['Queue entries deleted', cleanup.result.insight_queue?.deleted ?? 0],
                  ['Total deleted',         cleanup.result.total_deleted ?? 0],
                  ['Cutoff date',           cleanup.result.cutoff ? new Date(cleanup.result.cutoff).toLocaleString() : '—'],
                  ['Finished at',           cleanup.result.finished_at ? new Date(cleanup.result.finished_at).toLocaleString() : '—'],
                ].map(([label, val]) => (
                  <div key={String(label)} className="flex gap-2 font-mono text-[12px]">
                    <span className="text-muted-foreground w-44 shrink-0">{label}</span>
                    <span className={String(label) === 'Total deleted' ? 'text-steami-gold' : 'text-steami-cyan'}>
                      {String(val)}
                    </span>
                  </div>
                ))}
              </div>
            )}

            {cleanup.result?.skipped && (
              <div className="mb-4 rounded-md border border-yellow-400/20 bg-yellow-400/5 px-4 py-2 font-mono text-[12px] text-yellow-300">
                ⚠ {cleanup.result.reason}
              </div>
            )}

            <div className="flex flex-wrap gap-2">
              {/* POST /api/admin/cleanup */}
              <button
                className="steami-btn text-[11px] flex items-center gap-1.5"
                onClick={runCleanup}
                disabled={cleanup.loading}
              >
                <Trash2 className={`w-3 h-3 ${cleanup.loading ? 'animate-pulse' : ''}`} />
                {cleanup.loading ? 'Cleaning…' : 'Run cleanup now'}
              </button>

              {/* GET /api/admin/cleanup/status */}
              <button
                className="steami-btn text-[11px] flex items-center gap-1.5"
                onClick={() =>
                  api.admin.cleanupStatus()
                    .then((s: any) => setCleanup(prev => ({ ...prev, schedulerStatus: s })))
                    .catch(() => undefined)
                }
              >
                <Clock className="w-3 h-3" /> Check scheduler status
              </button>
            </div>
          </ApiStatePanel>
        </div>

      </div>
    </SteamiLayout>
  );
}
