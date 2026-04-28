import { useEffect, useState } from 'react';
import { SteamiLayout } from '@/components/SteamiLayout';
import { ApiStatePanel, ObjectList, MetricGrid } from '@/components/ApiStatePanel';
import { api } from '@/lib/api';
import { useAuthStore } from '@/stores/auth-store';
import { ShieldCheck } from 'lucide-react';

const emptyForm = {
  id: '',
  title: '',
  field: '',
  summary: '',
  content: '',
  coverImage: '',
  tags: '',
};

export default function ModerationPage() {
  const user = useAuthStore((s) => s.user);
  const canModerate = user?.role === 'admin' || user?.role === 'mod';
  const [tab, setTab] = useState<'explainer' | 'research' | 'blog' | 'article' | 'feed'>('explainer');
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [items, setItems] = useState<any[]>([]);
  const [status, setStatus] = useState('');
  const [error, setError] = useState('');
  const [insightStatus, setInsightStatus] = useState<any>(null);

  const loadItems = async () => {
    setError('');
    try {
      const data =
        tab === 'explainer'
          ? await api.content.cmsExplainers()
          : tab === 'research'
          ? await api.content.cmsResearch()
          : tab === 'blog'
          ? await api.content.cmsBlog()
          : tab === 'article'
          ? await api.articles.list()
          : await api.feed.items();
      setItems(Array.isArray(data) ? data : data?.items ?? data?.articles ?? data?.explainers ?? data?.posts ?? []);
    } catch (err: any) {
      setError(err.message || 'Unable to load items');
    }
  };

  useEffect(() => {
    if (canModerate) {
      loadItems();
      api.insights.status().then(setInsightStatus).catch(() => undefined);
    }
  }, [canModerate, tab]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('');
    setError('');
    try {
      if (tab === 'explainer') {
        const body = {
          id: form.id,
          title: form.title,
          field: form.field,
          subtitle: form.summary,
          content: form.content.split('\n').filter(Boolean),
          keyInsights: [],
        };
        if (editingId) await api.content.updateExplainer(editingId, body);
        else await api.content.createExplainer(body);
      } else if (tab === 'research') {
        const body = {
          id: form.id,
          title: form.title,
          field: form.field,
          abstract: form.summary,
          content: form.content.split('\n').filter(Boolean),
          quotes: [],
          keyFindings: [],
          relatedTopics: [],
        };
        if (editingId) await api.content.updateResearch(editingId, body);
        else await api.content.createResearch(body);
      } else if (tab === 'blog') {
        const body = {
          id: form.id,
          title: form.title,
          subtitle: form.summary,
          description: form.summary,
          coverImage: form.coverImage,
          field: form.field,
          badgeColor: 'cyan',
          tags: form.tags.split(',').map((t) => t.trim()).filter(Boolean),
          keyInsights: [],
          type: 'article',
          content: form.content,
          author: { name: user?.fullName || 'STEAMI Editor', role: user?.role || 'Contributor', avatar: '', bio: '' },
          publishDate: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
          readingTime: `${Math.max(1, Math.ceil(form.content.length / 1000))} MIN READ`,
        };
        if (editingId) await api.content.updateBlogPost(editingId, body);
        else await api.content.createBlogPost(body);
      } else {
        await api.articles.create({
          title: form.title,
          content: form.content || form.summary,
          topic: form.field || 'general',
          source: 'manual',
        });
      }
      if (imageFile && editingId) {
        if (tab === 'explainer') await api.content.uploadExplainerImage(editingId, imageFile);
        if (tab === 'research') await api.content.uploadResearchImage(editingId, imageFile);
        if (tab === 'blog') await api.content.uploadBlogCover(editingId, imageFile);
      }
      setStatus('Saved to backend.');
      setForm(emptyForm);
      setEditingId('');
      setImageFile(null);
      loadItems();
    } catch (err: any) {
      setError(err.message || 'Save failed');
    }
  };

  const editItem = async (item: any) => {
    const id = item.id ?? item.uid ?? item.post_id ?? item.article_id;
    if (!id) return;
    setStatus('Loading latest item from backend...');
    setError('');
    let full = item;
    try {
      if (tab === 'explainer') full = await api.content.explainer(id);
      if (tab === 'research') full = await api.content.researchArticle(id);
      if (tab === 'blog') full = await api.content.blogPost(id);
    } catch (err: any) {
      setError(err.message || 'Could not load full item for editing');
      setStatus('');
      return;
    }
    setEditingId(id);
    setForm({
      id,
      title: full.title ?? '',
      field: full.field ?? full.topic ?? '',
      summary: full.subtitle ?? full.description ?? full.abstract ?? '',
      content: Array.isArray(full.content) ? full.content.join('\n') : full.content ?? '',
      coverImage: full.coverImage ?? full.image ?? '',
      tags: Array.isArray(full.tags) ? full.tags.join(', ') : '',
    });
    setStatus('Loaded latest backend record for editing.');
  };

  const deleteItem = async (item: any) => {
    const id = item.id ?? item.uid ?? item.post_id ?? item.article_id;
    if (!id) return;
    if (tab === 'explainer') await api.content.deleteExplainer(id);
    if (tab === 'research') await api.content.deleteResearch(id);
    if (tab === 'blog') await api.content.deleteBlogPost(id);
    if (tab === 'feed') await api.feed.delete(id);
    setStatus('Deleted.');
    loadItems();
  };

  if (!canModerate) {
    return (
      <SteamiLayout>
        <div className="glass-card p-8 text-center">
          <ShieldCheck className="w-8 h-8 text-steami-gold mx-auto mb-3" />
          <h1 className="steami-heading text-2xl mb-2">Moderator Access Required</h1>
          <p className="text-muted-foreground text-[14px]">Admin and mod users can create explainers, research, articles, and operate feed insights here.</p>
        </div>
      </SteamiLayout>
    );
  }

  return (
    <SteamiLayout>
      <div className="mb-8">
        <h1 className="steami-heading text-3xl md:text-4xl mb-3">Content Operations</h1>
        <p className="text-[15px] text-muted-foreground max-w-2xl">Create and manage backend explainers, research articles, manual articles, feed insights, and article processing.</p>
      </div>

      <div className="flex flex-wrap gap-2 mb-6">
        {(['explainer', 'research', 'blog', 'article', 'feed'] as const).map((item) => (
          <button key={item} onClick={() => setTab(item)} className={`steami-btn text-[11px] ${tab === item ? 'steami-btn-gold' : ''}`}>{item}</button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {tab !== 'feed' && (
          <section className="glass-card p-5">
            <h2 className="steami-section-label mb-4">{editingId ? 'Update' : 'Create'} {tab}</h2>
            <form onSubmit={submit} className="space-y-3">
              <input value={form.id} onChange={(e) => setForm({ ...form, id: e.target.value })} placeholder="unique-id" className="w-full rounded-md border border-white/10 bg-transparent px-3 py-2 text-[14px]" required={tab !== 'article'} disabled={!!editingId} />
              <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Title" className="w-full rounded-md border border-white/10 bg-transparent px-3 py-2 text-[14px]" required />
              <input value={form.field} onChange={(e) => setForm({ ...form, field: e.target.value })} placeholder="Field / topic" className="w-full rounded-md border border-white/10 bg-transparent px-3 py-2 text-[14px]" />
              {tab === 'blog' && <input value={form.coverImage} onChange={(e) => setForm({ ...form, coverImage: e.target.value })} placeholder="Cover image URL" className="w-full rounded-md border border-white/10 bg-transparent px-3 py-2 text-[14px]" />}
              {tab === 'blog' && <input value={form.tags} onChange={(e) => setForm({ ...form, tags: e.target.value })} placeholder="Tags, comma separated" className="w-full rounded-md border border-white/10 bg-transparent px-3 py-2 text-[14px]" />}
              <textarea value={form.summary} onChange={(e) => setForm({ ...form, summary: e.target.value })} placeholder="Summary / abstract" rows={3} className="w-full rounded-md border border-white/10 bg-transparent px-3 py-2 text-[14px]" />
              <textarea value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })} placeholder="Content paragraphs, one per line" rows={8} className="w-full rounded-md border border-white/10 bg-transparent px-3 py-2 text-[14px]" />
              {(tab === 'explainer' || tab === 'research' || tab === 'blog') && (
                <input type="file" accept="image/*" onChange={(e) => setImageFile(e.target.files?.[0] ?? null)} className="w-full rounded-md border border-white/10 bg-transparent px-3 py-2 text-[14px]" />
              )}
              {status && <p className="text-[12px] text-steami-green">{status}</p>}
              {error && <p className="text-[12px] text-steami-red">{error}</p>}
              <div className="flex gap-2">
                <button className="steami-btn text-[11px]" type="submit">Save</button>
                {editingId && <button type="button" className="steami-btn text-[11px]" onClick={() => { setEditingId(''); setForm(emptyForm); }}>New</button>}
              </div>
            </form>
          </section>
        )}

        <ApiStatePanel title={tab === 'feed' ? 'Feed Items' : `Backend ${tab}s`} error={error} onRefresh={loadItems}>
          <div className="space-y-2">
            {items.map((item, idx) => (
              <div key={item.id ?? item.uid ?? idx} className="rounded-lg border border-white/10 bg-white/[0.03] p-3">
                <div className="flex flex-wrap items-start gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="font-serif text-[16px] font-bold">{item.title ?? item.id ?? `Record ${idx + 1}`}</div>
                    <p className="text-[13px] text-muted-foreground line-clamp-2">{item.description ?? item.subtitle ?? item.abstract ?? item.content ?? ''}</p>
                  </div>
                  {tab !== 'article' && tab !== 'feed' && <button className="steami-btn text-[11px]" onClick={() => editItem(item)}>Edit</button>}
                  {tab !== 'article' && <button className="steami-btn text-[11px]" onClick={() => deleteItem(item)}>Delete</button>}
                  {tab === 'feed' && <button className="steami-btn text-[11px]" onClick={() => api.feed.insight(item.id).then(loadItems)}>Insight</button>}
                </div>
              </div>
            ))}
            {items.length === 0 && <ObjectList items={[]} />}
          </div>
        </ApiStatePanel>

        <ApiStatePanel title="Article and Insight Tools">
          {insightStatus && <MetricGrid data={insightStatus} />}
          <div className="mt-4 flex flex-wrap gap-2">
            <button className="steami-btn text-[11px]" onClick={() => api.articles.refresh({ target: 20 }).then(() => setStatus('Article refresh started.'))}>Refresh articles</button>
            <button className="steami-btn text-[11px]" onClick={() => api.insights.process(2).then(() => setStatus('Insight queue processing started.'))}>Process insights</button>
            {user?.role === 'admin' && <button className="steami-btn text-[11px]" onClick={() => api.insights.clearQueue().then(() => setStatus('Insight queue cleared.'))}>Clear queue</button>}
          </div>
        </ApiStatePanel>
      </div>
    </SteamiLayout>
  );
}
