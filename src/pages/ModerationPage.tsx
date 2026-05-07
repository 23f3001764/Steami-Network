import { useEffect, useState } from 'react';
import { SteamiLayout } from '@/components/SteamiLayout';
import { ApiStatePanel, ObjectList } from '@/components/ApiStatePanel';
import { api } from '@/lib/api';
import { useAuthStore } from '@/stores/auth-store';
import { ShieldCheck } from 'lucide-react';
import { NewsletterTab } from '@/components/NewsletterTab';

// ─── Empty form state shapes ────────────────────────────────────────────────────

const emptyExplainer = {
  id: '', title: '', subtitle: '', field: '', badgeColor: '', readTime: '',
  author: '', content: '', keyInsights: '', context: '', technicalDetail: '', impact: '',
  references: '',  // JSON lines: one object per line — { title, url, author, type }
};

const emptyResearch = {
  id: '', title: '', field: '', abstract: '', author: '', date: '', readTime: '',
  content: '', quotes: '', keyFindings: '', relatedTopics: '',
};

const emptyBlog = {
  id: '', title: '', subtitle: '', description: '', field: '', badgeColor: '',
  coverImage: '', tags: '', keyInsights: '', type: 'article', simulationUrl: '',
  content: '', publishDate: '', readingTime: '',
  authorName: '', authorRole: '', authorAvatar: '', authorBio: '',
};

// ─── Helpers ───────────────────────────────────────────────────────────────────

const lines = (s: string) => s.split('\n').map((l) => l.trim()).filter(Boolean);
const csv   = (s: string) => s.split(',').map((l) => l.trim()).filter(Boolean);

/**
 * Parse the references textarea value.
 * Each non-empty line must be valid JSON: {"title":"...","url":"...","author":"...","type":"..."}
 * Lines that fail JSON.parse are treated as plain-text titles: { title: line }.
 */
const parseReferences = (s: string): Array<{ title: string; url?: string; author?: string; type?: string }> =>
  s.split('\n').map((l) => l.trim()).filter(Boolean).map((l) => {
    try { return JSON.parse(l); } catch { return { title: l }; }
  });

// ─── Reusable field components ─────────────────────────────────────────────────

function Field({
  label, value, onChange, placeholder = '', required = false, disabled = false,
}: {
  label: string; value: string; onChange: (v: string) => void;
  placeholder?: string; required?: boolean; disabled?: boolean;
}) {
  return (
    <div>
      <label className="block text-[11px] text-muted-foreground mb-1">
        {label}{required && <span className="text-steami-red ml-1">*</span>}
      </label>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder || label}
        required={required}
        disabled={disabled}
        className="w-full rounded-md border border-white/10 bg-transparent px-3 py-2 text-[14px] disabled:opacity-40"
      />
    </div>
  );
}

function TextArea({
  label, value, onChange, rows = 4, hint = '',
}: {
  label: string; value: string; onChange: (v: string) => void; rows?: number; hint?: string;
}) {
  return (
    <div>
      <label className="block text-[11px] text-muted-foreground mb-1">{label}</label>
      {hint && <p className="text-[10px] text-muted-foreground/60 mb-1">{hint}</p>}
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={label}
        rows={rows}
        className="w-full rounded-md border border-white/10 bg-transparent px-3 py-2 text-[14px]"
      />
    </div>
  );
}

// ─── Main component ────────────────────────────────────────────────────────────

export default function ModerationPage() {
  const user = useAuthStore((s) => s.user);
  const canModerate = user?.role === 'admin' || user?.role === 'mod';

  const [tab, setTab] = useState<'explainer' | 'research' | 'blog' | 'newsletter'>('explainer');

  const [explainerForm, setExplainerForm] = useState(emptyExplainer);
  const [researchForm,  setResearchForm]  = useState(emptyResearch);
  const [blogForm,      setBlogForm]      = useState(emptyBlog);
  const [editingId,     setEditingId]     = useState('');
  const [imageFile,     setImageFile]     = useState<File | null>(null);
  const [items,         setItems]         = useState<any[]>([]);
  const [status,        setStatus]        = useState('');
  const [error,         setError]         = useState('');

  // Setter factories
  const ef = (k: keyof typeof emptyExplainer) => (v: string) => setExplainerForm((f) => ({ ...f, [k]: v }));
  const rf = (k: keyof typeof emptyResearch)  => (v: string) => setResearchForm((f)  => ({ ...f, [k]: v }));
  const bf = (k: keyof typeof emptyBlog)      => (v: string) => setBlogForm((f)      => ({ ...f, [k]: v }));

  const resetAll = () => {
    setExplainerForm(emptyExplainer);
    setResearchForm(emptyResearch);
    setBlogForm(emptyBlog);
    setEditingId('');
    setImageFile(null);
  };

  // ── Load list ────────────────────────────────────────────────────────────────

  const loadItems = async () => {
    setError('');
    try {
      const data =
        tab === 'explainer' ? await api.content.cmsExplainers()
        : tab === 'research' ? await api.content.cmsResearch()
        :                      await api.content.cmsBlog();
      setItems(Array.isArray(data) ? data : data?.items ?? data?.articles ?? data?.explainers ?? data?.posts ?? []);
    } catch (err: any) {
      setError(err.message || 'Unable to load items');
    }
  };

  useEffect(() => {
    if (canModerate) loadItems();
  }, [canModerate, tab]);

  // ── Submit ───────────────────────────────────────────────────────────────────

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('');
    setError('');
    try {

      // ── EXPLAINER ──────────────────────────────────────────────────────────
      if (tab === 'explainer') {
        if (editingId) {
          await api.content.updateExplainer(editingId, {
            title:           explainerForm.title           || undefined,
            subtitle:        explainerForm.subtitle        || undefined,
            field:           explainerForm.field           || undefined,
            badgeColor:      explainerForm.badgeColor      || undefined,
            readTime:        explainerForm.readTime        || undefined,
            author:          explainerForm.author          || undefined,
            content:         lines(explainerForm.content),
            keyInsights:     lines(explainerForm.keyInsights),
            context:         explainerForm.context         || undefined,
            technicalDetail: explainerForm.technicalDetail || undefined,
            impact:          explainerForm.impact          || undefined,
            references:      parseReferences(explainerForm.references),
          });
          if (imageFile) await api.content.uploadExplainerImage(editingId, imageFile);
        } else {
          if (!imageFile) { setError('An image file is required to create an explainer.'); return; }
          // POST /api/explainers/create-with-image (multipart)
          await api.content.createExplainerWithImage(
            {
              id:              explainerForm.id,
              title:           explainerForm.title,
              subtitle:        explainerForm.subtitle,
              field:           explainerForm.field,
              badgeColor:      explainerForm.badgeColor,
              readTime:        explainerForm.readTime,
              author:          explainerForm.author,
              context:         explainerForm.context,
              technicalDetail: explainerForm.technicalDetail,
              impact:          explainerForm.impact,
              content:         JSON.stringify(lines(explainerForm.content)),
              keyInsights:     JSON.stringify(lines(explainerForm.keyInsights)),
              references:      JSON.stringify(parseReferences(explainerForm.references)),
            },
            imageFile,
          );
        }
      }

      // ── RESEARCH ───────────────────────────────────────────────────────────
      else if (tab === 'research') {
        if (editingId) {
          await api.content.updateResearch(editingId, {
            title:         researchForm.title        || undefined,
            field:         researchForm.field        || undefined,
            abstract:      researchForm.abstract     || undefined,
            author:        researchForm.author       || undefined,
            date:          researchForm.date         || undefined,
            readTime:      researchForm.readTime     || undefined,
            content:       lines(researchForm.content),
            quotes:        lines(researchForm.quotes),
            keyFindings:   lines(researchForm.keyFindings),
            relatedTopics: lines(researchForm.relatedTopics),
          });
          if (imageFile) await api.content.uploadResearchImage(editingId, imageFile);
        } else {
          if (!imageFile) { setError('An image file is required to create a research article.'); return; }
          // POST /api/research/articles/create-with-image (multipart)
          await api.content.createResearchWithImage(
            {
              id:            researchForm.id,
              title:         researchForm.title,
              field:         researchForm.field,
              abstract:      researchForm.abstract,
              author:        researchForm.author,
              date:          researchForm.date,
              readTime:      researchForm.readTime,
              content:       JSON.stringify(lines(researchForm.content)),
              quotes:        JSON.stringify(lines(researchForm.quotes)),
              keyFindings:   JSON.stringify(lines(researchForm.keyFindings)),
              relatedTopics: JSON.stringify(lines(researchForm.relatedTopics)),
            },
            imageFile,
          );
        }
      }

      // ── BLOG ───────────────────────────────────────────────────────────────
      else if (tab === 'blog') {
        const blogBody = {
          id:           blogForm.id,
          title:        blogForm.title,
          subtitle:     blogForm.subtitle,
          description:  blogForm.description,
          field:        blogForm.field,
          badgeColor:   blogForm.badgeColor   || 'cyan',
          coverImage:   blogForm.coverImage,
          tags:         csv(blogForm.tags),
          keyInsights:  lines(blogForm.keyInsights),
          type:         blogForm.type         || 'article',
          simulationUrl: blogForm.simulationUrl,
          content:      blogForm.content,
          publishDate:  blogForm.publishDate  || new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
          readingTime:  blogForm.readingTime  || `${Math.max(1, Math.ceil(blogForm.content.length / 1000))} MIN READ`,
          author: {
            name:   blogForm.authorName   || user?.fullName || '',
            role:   blogForm.authorRole   || user?.role     || '',
            avatar: blogForm.authorAvatar || '',
            bio:    blogForm.authorBio    || '',
          },
        };
        if (editingId) {
          await api.content.updateBlogPost(editingId, blogBody);
        } else {
          // Step 1: POST /api/blog (JSON)
          await api.content.createBlogPost(blogBody);
        }
        // Step 2: upload cover image if selected — POST /api/blog/{id}/cover-image
        if (imageFile) {
          await api.content.uploadBlogCover(editingId || blogForm.id, imageFile);
        }
      }

      setStatus('Saved successfully.');
      resetAll();
      loadItems();
    } catch (err: any) {
      setError(err.message || 'Save failed');
    }
  };

  // ── Edit / delete ────────────────────────────────────────────────────────────

  const editItem = async (item: any) => {
    const id = item.id ?? item.uid ?? item.post_id ?? item.article_id;
    if (!id) return;
    setStatus('Loading…'); setError('');
    let full = item;
    try {
      if (tab === 'explainer') full = await api.content.explainer(id);
      if (tab === 'research')  full = await api.content.researchArticle(id);
      if (tab === 'blog')      full = await api.content.blogPost(id);
    } catch (err: any) {
      setError(err.message || 'Could not load item'); setStatus(''); return;
    }
    setEditingId(id);
    setImageFile(null);
    if (tab === 'explainer') {
      setExplainerForm({
        id:              full.id            ?? id,
        title:           full.title         ?? '',
        subtitle:        full.subtitle      ?? '',
        field:           full.field         ?? '',
        badgeColor:      full.badgeColor    ?? '',
        readTime:        full.readTime      ?? '',
        author:          full.author        ?? '',
        content:         Array.isArray(full.content)     ? full.content.join('\n')     : full.content     ?? '',
        keyInsights:     Array.isArray(full.keyInsights) ? full.keyInsights.join('\n') : '',
        context:         full.context         ?? '',
        technicalDetail: full.technicalDetail ?? '',
        impact:          full.impact          ?? '',
        references:      Array.isArray(full.references)
          ? full.references.map((r: any) => JSON.stringify(r)).join('\n')
          : '',
      });
    } else if (tab === 'research') {
      setResearchForm({
        id:            full.id      ?? id,
        title:         full.title   ?? '',
        field:         full.field   ?? '',
        abstract:      full.abstract ?? '',
        author:        full.author  ?? '',
        date:          full.date    ?? '',
        readTime:      full.readTime ?? '',
        content:       Array.isArray(full.content)       ? full.content.join('\n')       : full.content       ?? '',
        quotes:        Array.isArray(full.quotes)        ? full.quotes.join('\n')        : '',
        keyFindings:   Array.isArray(full.keyFindings)   ? full.keyFindings.join('\n')   : '',
        relatedTopics: Array.isArray(full.relatedTopics) ? full.relatedTopics.join('\n') : '',
      });
    } else if (tab === 'blog') {
      const a = full.author ?? {};
      setBlogForm({
        id:           full.id            ?? id,
        title:        full.title         ?? '',
        subtitle:     full.subtitle      ?? '',
        description:  full.description   ?? '',
        field:        full.field         ?? '',
        badgeColor:   full.badgeColor    ?? '',
        coverImage:   full.coverImage    ?? '',
        tags:         Array.isArray(full.tags)        ? full.tags.join(', ')        : '',
        keyInsights:  Array.isArray(full.keyInsights) ? full.keyInsights.join('\n') : '',
        type:         full.type          ?? 'article',
        simulationUrl: full.simulationUrl ?? '',
        content:      full.content       ?? '',
        publishDate:  full.publishDate   ?? '',
        readingTime:  full.readingTime   ?? '',
        authorName:   a.name   ?? '',
        authorRole:   a.role   ?? '',
        authorAvatar: a.avatar ?? '',
        authorBio:    a.bio    ?? '',
      });
    }
    setStatus('Loaded for editing.');
  };

  const deleteItem = async (item: any) => {
    const id = item.id ?? item.uid ?? item.post_id ?? item.article_id;
    if (!id) return;
    if (tab === 'explainer') await api.content.deleteExplainer(id);
    if (tab === 'research')  await api.content.deleteResearch(id);
    if (tab === 'blog')      await api.content.deleteBlogPost(id);
    setStatus('Deleted.'); loadItems();
  };

  // ── Access guard ─────────────────────────────────────────────────────────────

  if (!canModerate) {
    return (
      <SteamiLayout>
        <div className="glass-card p-8 text-center">
          <ShieldCheck className="w-8 h-8 text-steami-gold mx-auto mb-3" />
          <h1 className="steami-heading text-2xl mb-2">Moderator Access Required</h1>
          <p className="text-muted-foreground text-[14px]">Admin and mod users can create and manage content here.</p>
        </div>
      </SteamiLayout>
    );
  }

  const imageRequired = !editingId && (tab === 'explainer' || tab === 'research');

  // ── Render ───────────────────────────────────────────────────────────────────

  return (
    <SteamiLayout>
      <div className="mb-8">
        <h1 className="steami-heading text-3xl md:text-4xl mb-3">Content Operations</h1>
        <p className="text-[15px] text-muted-foreground max-w-2xl">
          Create and manage explainers, research articles, blog posts, manual articles, and feed insights.
        </p>
      </div>

      {/* Tab bar */}
      <div className="flex flex-wrap gap-2 mb-6">
        {(['explainer', 'research', 'blog', 'newsletter'] as const).map((t) => (
          <button
            key={t}
            onClick={() => { setTab(t); resetAll(); setStatus(''); setError(''); }}
            className={`steami-btn text-[11px] ${tab === t ? 'steami-btn-gold' : ''}`}
          >
            {t === 'newsletter' ? '📰 Newsletter' : t}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

        {tab === 'newsletter' ? (
          <div className="lg:col-span-2">
            <NewsletterTab />
          </div>
        ) : (
          <>
        {/* ── CREATE / EDIT FORM ────────────────────────────────────────────── */}
        {tab !== 'newsletter' && (
          <section className="glass-card p-5">
            <h2 className="steami-section-label mb-4">{editingId ? `Update ${tab}` : `Create ${tab}`}</h2>
            <form onSubmit={submit} className="space-y-3">

              {/* ── Explainer fields ── */}
              {tab === 'explainer' && (
                <>
                  <Field label="ID (unique slug)" value={explainerForm.id} onChange={ef('id')} required disabled={!!editingId} placeholder="e.g. quantum-dog" />
                  <Field label="Title" value={explainerForm.title} onChange={ef('title')} required />
                  <Field label="Subtitle" value={explainerForm.subtitle} onChange={ef('subtitle')} />
                  <Field label="Field (e.g. QUANTUM PHYSICS)" value={explainerForm.field} onChange={ef('field')} />
                  <Field label="Badge Color (cyan / green / violet / gold)" value={explainerForm.badgeColor} onChange={ef('badgeColor')} />
                  <Field label="Read Time (e.g. 8 MIN READ)" value={explainerForm.readTime} onChange={ef('readTime')} />
                  <Field label="Author" value={explainerForm.author} onChange={ef('author')} />
                  <TextArea label="Content" value={explainerForm.content} onChange={ef('content')} rows={6} hint="One paragraph per line — each line becomes a separate array item sent to the API." />
                  <TextArea label="Key Insights" value={explainerForm.keyInsights} onChange={ef('keyInsights')} rows={3} hint="One insight per line." />
                  <TextArea label="Context & Background" value={explainerForm.context} onChange={ef('context')} rows={3} />
                  <TextArea label="Technical Detail" value={explainerForm.technicalDetail} onChange={ef('technicalDetail')} rows={3} />
                  <TextArea label="Impact & Implications" value={explainerForm.impact} onChange={ef('impact')} rows={3} />
                  <TextArea
                    label="References / Credentials"
                    value={explainerForm.references}
                    onChange={ef('references')}
                    rows={4}
                    hint='One reference per line as JSON: {"title":"Paper Title","url":"https://...","author":"Author Name","type":"paper"} — or just a plain title string.'
                  />
                </>
              )}

              {/* ── Research fields ── */}
              {tab === 'research' && (
                <>
                  <Field label="ID (unique slug)" value={researchForm.id} onChange={rf('id')} required disabled={!!editingId} placeholder="e.g. topological-qubits-99" />
                  <Field label="Title" value={researchForm.title} onChange={rf('title')} required />
                  <Field label="Field (e.g. PHYSICS)" value={researchForm.field} onChange={rf('field')} required />
                  <Field label="Abstract" value={researchForm.abstract} onChange={rf('abstract')} />
                  <Field label="Author" value={researchForm.author} onChange={rf('author')} />
                  <Field label="Date (YYYY-MM-DD)" value={researchForm.date} onChange={rf('date')} placeholder="2026-04-30" />
                  <Field label="Read Time (e.g. 10 min)" value={researchForm.readTime} onChange={rf('readTime')} />
                  <TextArea label="Content" value={researchForm.content} onChange={rf('content')} rows={6} hint="One paragraph per line." />
                  <TextArea label="Quotes" value={researchForm.quotes} onChange={rf('quotes')} rows={3} hint="One quote per line." />
                  <TextArea label="Key Findings" value={researchForm.keyFindings} onChange={rf('keyFindings')} rows={3} hint="One finding per line." />
                  <TextArea label="Related Topics" value={researchForm.relatedTopics} onChange={rf('relatedTopics')} rows={2} hint="One topic per line." />
                </>
              )}

              {/* ── Blog fields ── */}
              {tab === 'blog' && (
                <>
                  <Field label="ID (unique slug)" value={blogForm.id} onChange={bf('id')} required disabled={!!editingId} placeholder="e.g. future-of-quantum" />
                  <Field label="Title" value={blogForm.title} onChange={bf('title')} required />
                  <Field label="Subtitle" value={blogForm.subtitle} onChange={bf('subtitle')} />
                  <Field label="Description (meta / preview text)" value={blogForm.description} onChange={bf('description')} />
                  <Field label="Field / Category" value={blogForm.field} onChange={bf('field')} />
                  <Field label="Badge Color (cyan / green / violet / gold)" value={blogForm.badgeColor} onChange={bf('badgeColor')} />
                  <Field label="Type (article / simulation)" value={blogForm.type} onChange={bf('type')} />
                  <Field label="Cover Image URL (or upload a file below)" value={blogForm.coverImage} onChange={bf('coverImage')} />
                  <Field label="Tags (comma-separated)" value={blogForm.tags} onChange={bf('tags')} placeholder="AI, Quantum, Physics" />
                  <Field label="Publish Date (e.g. Apr 30, 2026)" value={blogForm.publishDate} onChange={bf('publishDate')} />
                  <Field label="Reading Time (e.g. 5 MIN READ)" value={blogForm.readingTime} onChange={bf('readingTime')} />
                  <Field label="Simulation URL (optional)" value={blogForm.simulationUrl} onChange={bf('simulationUrl')} />
                  <TextArea label="Key Insights" value={blogForm.keyInsights} onChange={bf('keyInsights')} rows={3} hint="One insight per line." />
                  <TextArea label="Content (markdown / rich text)" value={blogForm.content} onChange={bf('content')} rows={8} />
                  {/* Author sub-section */}
                  <div className="rounded-md border border-white/10 bg-white/[0.02] p-3 space-y-3">
                    <p className="text-[11px] text-muted-foreground uppercase tracking-wider">Author</p>
                    <Field label="Name" value={blogForm.authorName} onChange={bf('authorName')} placeholder={user?.fullName || 'Dr. Jane Smith'} />
                    <Field label="Role / Title" value={blogForm.authorRole} onChange={bf('authorRole')} placeholder="Quantum Physicist" />
                    <Field label="Avatar URL" value={blogForm.authorAvatar} onChange={bf('authorAvatar')} />
                    <Field label="Bio" value={blogForm.authorBio} onChange={bf('authorBio')} />
                  </div>
                </>
              )}

              {/* ── Image upload ── */}
              {(tab === 'explainer' || tab === 'research' || tab === 'blog') && (
                <div>
                  <label className="block text-[11px] text-muted-foreground mb-1">
                    {tab === 'blog'
                      ? 'Cover Image File (optional — overrides URL above)'
                      : editingId
                      ? 'Replace Image (optional)'
                      : <span>Image File <span className="text-steami-red">*</span></span>
                    }
                  </label>
                  <input
                    type="file"
                    accept="image/*"
                    required={imageRequired}
                    onChange={(e) => setImageFile(e.target.files?.[0] ?? null)}
                    className="w-full rounded-md border border-white/10 bg-transparent px-3 py-2 text-[14px]"
                  />
                  {imageFile && (
                    <p className="text-[11px] text-steami-green mt-1">Selected: {imageFile.name}</p>
                  )}
                </div>
              )}

              {status && <p className="text-[12px] text-steami-green">{status}</p>}
              {error  && <p className="text-[12px] text-steami-red">{error}</p>}

              <div className="flex gap-2 pt-1">
                <button className="steami-btn text-[11px]" type="submit">
                  {editingId ? 'Update' : 'Create'}
                </button>
                {editingId && (
                  <button
                    type="button"
                    className="steami-btn text-[11px]"
                    onClick={() => { resetAll(); setStatus(''); setError(''); }}
                  >
                    New
                  </button>
                )}
              </div>
            </form>
          </section>
        )}

        {/* ── ITEM LIST ─────────────────────────────────────────────────────── */}
        <ApiStatePanel
          title={`Backend ${tab}s`}
          error={error}
          onRefresh={loadItems}
        >
          <div className="space-y-2">
            {items.map((item, idx) => (
              <div key={item.id ?? item.uid ?? idx} className="rounded-lg border border-white/10 bg-white/[0.03] p-3">
                <div className="flex flex-wrap items-start gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="font-serif text-[16px] font-bold">{item.title ?? item.id ?? `Record ${idx + 1}`}</div>
                    <p className="text-[13px] text-muted-foreground line-clamp-2">
                      {item.description ?? item.subtitle ?? item.abstract ?? item.content ?? ''}
                    </p>
                  </div>
                  {tab !== 'newsletter' && (
                    <button className="steami-btn text-[11px]" onClick={() => editItem(item)}>Edit</button>
                  )}
                  {tab !== 'newsletter' && (
                    <button className="steami-btn text-[11px]" onClick={() => deleteItem(item)}>Delete</button>
                  )}
                </div>
              </div>
            ))}
            {items.length === 0 && <ObjectList items={[]} />}
          </div>
        </ApiStatePanel>
          </>
        )}

      </div>
    </SteamiLayout>
  );
}