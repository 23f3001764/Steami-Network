import { useState } from 'react';
import { SteamiLayout } from '@/components/SteamiLayout';
import { ApiStatePanel, ObjectList, MetricGrid } from '@/components/ApiStatePanel';
import { api } from '@/lib/api';
import { useAuthStore } from '@/stores/auth-store';
import { RequireLogin } from '@/components/RequireLogin';

const calls = [
  { key: 'health', label: 'Health', run: api.health, kind: 'metrics' },
  { key: 'me', label: 'Auth Me', run: api.auth.me, kind: 'metrics' },
  { key: 'profile', label: 'Profile', run: api.auth.profile, kind: 'metrics' },
  { key: 'interests', label: 'Interests', run: api.auth.getInterests, kind: 'metrics' },
  { key: 'site', label: 'Site Info', run: api.public.siteInfo, kind: 'metrics' },
  { key: 'ai', label: 'AI Context', run: api.public.aiContext, kind: 'metrics' },
  { key: 'sources', label: 'RSS Sources', run: api.articles.sources, kind: 'list' },
  { key: 'articles', label: 'Public Articles', run: api.articles.list, kind: 'list' },
  { key: 'forMe', label: 'Articles For Me', run: api.articles.forMe, kind: 'list' },
  { key: 'refreshCheck', label: 'Refresh Check', run: () => api.articles.refreshCheck(24), kind: 'metrics' },
  { key: 'insightStatus', label: 'Insight Status', run: api.insights.status, kind: 'metrics' },
  { key: 'insights', label: 'Insights', run: api.insights.list, kind: 'list' },
  { key: 'insightQueue', label: 'Insight Queue', run: api.insights.queue, kind: 'metrics' },
  { key: 'feed', label: 'Feed Items', run: api.feed.items, kind: 'list' },
  { key: 'blog', label: 'Blog Posts', run: api.content.blogPosts, kind: 'list' },
  { key: 'explainers', label: 'Explainers', run: api.content.explainers, kind: 'list' },
  { key: 'researchFields', label: 'Research Fields', run: api.content.researchFields, kind: 'list' },
  { key: 'researchImages', label: 'Research Images', run: api.content.researchImages, kind: 'metrics' },
  { key: 'researchArticles', label: 'Research Articles', run: api.content.researchArticles, kind: 'list' },
  { key: 'cmsExplainers', label: 'CMS Explainers', run: api.content.cmsExplainers, kind: 'list' },
  { key: 'cmsResearch', label: 'CMS Research', run: api.content.cmsResearch, kind: 'list' },
  { key: 'cmsBlog', label: 'CMS Blog', run: api.content.cmsBlog, kind: 'list' },
  { key: 'diary', label: 'Diary', run: api.diary.list, kind: 'list' },
  { key: 'dashboardMe', label: 'Dashboard Me', run: api.dashboard.me, kind: 'metrics' },
  { key: 'newsletterPreview', label: 'Newsletter Preview', run: () => api.newsletter.preview(5), kind: 'metrics' },
  { key: 'chatUsers', label: 'Chat Users', run: api.chat.users, kind: 'list' },
  { key: 'conversations', label: 'Conversations', run: api.chat.conversations, kind: 'list' },
  { key: 'unread', label: 'Unread Chat', run: api.chat.unread, kind: 'metrics' },
];

export default function ApiConsolePage() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const [active, setActive] = useState(calls[0]);
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const run = async (call = active) => {
    setLoading(true);
    setError('');
    try {
      setData(await call.run());
    } catch (err: any) {
      setError(err.message || 'Request failed');
    } finally {
      setLoading(false);
    }
  };

  const list = Array.isArray(data) ? data : data?.items ?? data?.articles ?? data?.sources ?? data?.entries ?? data?.users ?? data?.conversations ?? [];

  if (!isAuthenticated) {
    return (
      <SteamiLayout>
        <RequireLogin message="Please login first to inspect authenticated API surfaces." />
      </SteamiLayout>
    );
  }

  return (
    <SteamiLayout>
      <div className="mb-8">
        <h1 className="steami-heading text-3xl md:text-4xl mb-3">API Surfaces</h1>
        <p className="text-[15px] text-muted-foreground max-w-2xl">A UI wrapper around backend APIs that are not part of the main reading flow. Responses are summarized into cards and metrics instead of dumping raw JSON.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[260px_1fr] gap-5">
        <aside className="glass-card p-3 h-fit">
          {calls.map((call) => (
            <button
              key={call.key}
              onClick={() => {
                setActive(call);
                setData(null);
                run(call);
              }}
              className={`w-full text-left rounded-md px-3 py-2 font-mono text-[11px] uppercase tracking-wider transition-colors ${active.key === call.key ? 'text-steami-cyan bg-steami-cyan/10' : 'text-muted-foreground hover:text-foreground hover:bg-white/5'}`}
            >
              {call.label}
            </button>
          ))}
        </aside>

        <ApiStatePanel title={active.label} loading={loading} error={error} onRefresh={() => run()}>
          {active.kind === 'list' ? <ObjectList items={list} /> : <MetricGrid data={data || {}} />}
        </ApiStatePanel>
      </div>
    </SteamiLayout>
  );
}
