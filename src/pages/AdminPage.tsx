import { useEffect, useMemo, useState } from 'react';
import { SteamiLayout } from '@/components/SteamiLayout';
import { ApiStatePanel, MetricGrid, ObjectList } from '@/components/ApiStatePanel';
import { api } from '@/lib/api';
import { useAuthStore } from '@/stores/auth-store';
import { Shield, Send, Trash2 } from 'lucide-react';

type LoadState = { data: any; loading: boolean; error: string };

const initial: LoadState = { data: null, loading: true, error: '' };

export default function AdminPage() {
  const user = useAuthStore((s) => s.user);
  const [dashboard, setDashboard] = useState<LoadState>(initial);
  const [events, setEvents] = useState<LoadState>(initial);
  const [users, setUsers] = useState<LoadState>(initial);
  const [security, setSecurity] = useState<LoadState>(initial);
  const [newsletter, setNewsletter] = useState<LoadState>(initial);
  const [ip, setIp] = useState('');
  const [testEmail, setTestEmail] = useState('');

  const isAdmin = user?.role === 'admin';

  const load = async (setter: (s: LoadState) => void, fn: () => Promise<any>) => {
    setter({ data: null, loading: true, error: '' });
    try {
      setter({ data: await fn(), loading: false, error: '' });
    } catch (err: any) {
      setter({ data: null, loading: false, error: err.message || 'Unable to load data' });
    }
  };

  const refreshAll = () => {
    load(setDashboard, api.dashboard.admin);
    load(setEvents, api.dashboard.events);
    load(setUsers, api.auth.users);
    load(setSecurity, api.security.stats);
    load(setNewsletter, api.newsletter.recipients);
  };

  useEffect(() => {
    if (isAdmin) refreshAll();
  }, [isAdmin]);

  const normalizedUsers = useMemo(() => Array.isArray(users.data) ? users.data : users.data?.users ?? [], [users.data]);
  const normalizedEvents = useMemo(() => Array.isArray(events.data) ? events.data : events.data?.events ?? [], [events.data]);
  const normalizedNewsletter = useMemo(() => Array.isArray(newsletter.data) ? newsletter.data : newsletter.data?.recipients ?? newsletter.data?.subscribers ?? [], [newsletter.data]);
  const blockedIps = useMemo(() => {
    const data = security.data || {};
    const list = data.banned_ips ?? data.temp_bans ?? data.active_bans ?? data.blocked_ips ?? [];
    if (Array.isArray(list)) return list.map((item: any) => typeof item === 'string' ? { ip: item } : item);
    return Object.entries(list).map(([ip, value]) => ({ ip, value }));
  }, [security.data]);

  if (!isAdmin) {
    return (
      <SteamiLayout>
        <div className="glass-card p-8 text-center">
          <Shield className="w-8 h-8 text-steami-gold mx-auto mb-3" />
          <h1 className="steami-heading text-2xl mb-2">Admin Access Required</h1>
          <p className="text-muted-foreground text-[14px]">Sign in with an admin account to manage users, security, dashboards, and newsletters.</p>
        </div>
      </SteamiLayout>
    );
  }

  return (
    <SteamiLayout>
      <div className="mb-8">
        <h1 className="steami-heading text-3xl md:text-4xl mb-3">Admin Control Room</h1>
        <p className="text-[15px] text-muted-foreground max-w-2xl">Platform metrics, user roles, newsletter operations, DDoS controls, and popup event telemetry.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <ApiStatePanel title="Dashboard API" {...dashboard} onRefresh={() => load(setDashboard, api.dashboard.admin)}>
          <MetricGrid data={dashboard.data || {}} />
        </ApiStatePanel>

        <ApiStatePanel title="DDoS Protection" {...security} onRefresh={() => load(setSecurity, api.security.stats)}>
          <MetricGrid data={security.data || {}} />
          {blockedIps.length > 0 && (
            <div className="mt-4 space-y-2">
              <div className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">Blocked IP addresses</div>
              {blockedIps.map((entry: any) => (
                <div key={entry.ip} className="flex items-center gap-2 rounded-md border border-white/10 bg-white/[0.03] px-3 py-2">
                  <span className="font-mono text-[12px] flex-1">{entry.ip}</span>
                  <button className="steami-btn text-[11px] py-1 px-2" onClick={() => api.security.unban(entry.ip).then(refreshAll)}>Delete IP</button>
                </div>
              ))}
            </div>
          )}
          <div className="mt-4 flex flex-wrap gap-2">
            <input value={ip} onChange={(e) => setIp(e.target.value)} placeholder="IP address" className="min-w-0 flex-1 rounded-md border border-white/10 bg-transparent px-3 py-2 text-[14px]" />
            <button className="steami-btn text-[11px]" onClick={() => ip && api.security.ban(ip).then(refreshAll)}>Ban IP</button>
            <button className="steami-btn text-[11px]" onClick={() => ip && api.security.unban(ip).then(refreshAll)}>Unban</button>
            <button className="steami-btn text-[11px]" onClick={() => api.security.clearTempBans().then(refreshAll)}><Trash2 className="w-3 h-3" /> Temp bans</button>
          </div>
        </ApiStatePanel>

        <ApiStatePanel title="Users and Roles" {...users} onRefresh={() => load(setUsers, api.auth.users)}>
          <div className="space-y-2">
            {normalizedUsers.map((u: any) => (
              <div key={u.id ?? u.uid ?? u.email} className="rounded-lg border border-white/10 bg-white/[0.03] p-3 flex flex-wrap items-center gap-3">
                <div className="min-w-0 flex-1">
                  <div className="font-serif text-[16px] font-bold">{u.full_name ?? u.display_name ?? u.email}</div>
                  <div className="font-mono text-[11px] text-muted-foreground">{u.email}</div>
                </div>
                <select
                  value={u.role ?? 'user'}
                  onChange={(e) => api.auth.updateRole(u.id ?? u.uid, e.target.value).then(() => load(setUsers, api.auth.users))}
                  className="rounded-md border border-steami-cyan/20 bg-transparent px-2 py-1.5 font-mono text-[11px]"
                >
                  <option value="user">user</option>
                  <option value="mod">mod</option>
                  <option value="admin">admin</option>
                </select>
                <button className="steami-btn text-[11px]" onClick={() => api.auth.toggleUserSubscription(u.id ?? u.uid).then(() => load(setUsers, api.auth.users))}>Digest</button>
                <button className="text-steami-red" onClick={() => api.auth.deleteUser(u.id ?? u.uid).then(() => load(setUsers, api.auth.users))}><Trash2 className="w-4 h-4" /></button>
              </div>
            ))}
          </div>
        </ApiStatePanel>

        <ApiStatePanel title="Newsletter" {...newsletter} onRefresh={() => load(setNewsletter, api.newsletter.recipients)}>
          <ObjectList items={normalizedNewsletter} empty="No newsletter recipients yet." />
          <div className="mt-4 flex flex-wrap gap-2">
            <input value={testEmail} onChange={(e) => setTestEmail(e.target.value)} placeholder="test@example.com" className="min-w-0 flex-1 rounded-md border border-white/10 bg-transparent px-3 py-2 text-[14px]" />
            <button className="steami-btn text-[11px]" onClick={() => testEmail && api.newsletter.test(testEmail)}><Send className="w-3 h-3" /> Test</button>
            <button className="steami-btn text-[11px]" onClick={() => api.newsletter.sendDaily(5)}>Send daily</button>
          </div>
        </ApiStatePanel>

        <div className="lg:col-span-2">
          <ApiStatePanel title="Popup Event Log" {...events} onRefresh={() => load(setEvents, api.dashboard.events)}>
            <ObjectList items={normalizedEvents} empty="No popup events logged yet." />
          </ApiStatePanel>
        </div>
      </div>
    </SteamiLayout>
  );
}
