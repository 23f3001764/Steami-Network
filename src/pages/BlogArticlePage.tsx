import { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { SteamiLayout } from '@/components/SteamiLayout';
import { ScrollNavigator } from '@/components/ScrollNavigator';
import { KnowledgeGraph } from '@/components/KnowledgeGraph';
import { ContentBlock } from '@/components/ContentBlock';
import { Lightbulb, Network } from 'lucide-react';

import { BlogHero } from '@/components/blog/BlogHero';
import { BlogContent } from '@/components/blog/BlogContent';
import { BlogSidebar } from '@/components/blog/BlogSidebar';
import { RelatedPosts } from '@/components/blog/RelatedPosts';

import { useBlogStore } from '@/stores/blog-store';
import { useThemeStore } from '@/stores/theme-store';
import { Trash2, Share2, Twitter, Linkedin, ChevronLeft, ChevronRight, BookMarked, Quote } from 'lucide-react';
import { Link } from 'react-router-dom';
import { api, apiAssetUrl } from '@/lib/api';

import { logPopupOpen, logPopupOpenSync, logPopupClose, NO_SESSION, type PopupSession } from '@/lib/popup-telemetry';

/**
 * Returns a stable anonymous guest ID for unauthenticated event tracking.
 * Generated once per browser and persisted in localStorage as `steami_guest_id`.
 * This seeds the ID immediately on page module load so it is always available.
 */
const getGuestId = (): string => {
  const KEY = 'steami_guest_id';
  let id = localStorage.getItem(KEY);
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem(KEY, id);
  }
  return id;
};

// Seed the guest ID on module load so it exists before the first event fires.
// This is a no-op if the ID is already stored.
getGuestId();

import { TextSelectionPopover } from '@/components/TextSelectionPopover';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Normalises a raw backend post into the shape the UI components expect.
 */
function normalisePost(raw: any) {
  return {
    // identity
    id:            raw.id,
    type:          raw.type ?? 'article',
    simulationUrl: raw.simulationUrl ?? '',

    // display fields
    title:       raw.title       ?? 'Untitled',
    subtitle:    raw.subtitle    ?? '',
    description: raw.description ?? '',
    field:       raw.field       ?? '',
    badgeColor:  raw.badgeColor  ?? 'green',
    publishDate: raw.publishDate ?? '',
    readingTime: raw.readingTime ?? '',
    content:     raw.content     ?? '',

    // resolved cover image — apiAssetUrl handles full URLs, data URIs, and relative paths
    coverImage: apiAssetUrl(raw.coverImage) || undefined,

    // arrays
    tags:        Array.isArray(raw.tags)        ? raw.tags        : [],
    keyInsights: Array.isArray(raw.keyInsights) ? raw.keyInsights : [],

    // references and citations
    references: Array.isArray(raw.references) ? raw.references : [],
    citations:  Array.isArray(raw.citations)  ? raw.citations  : [],

    // author with safe fallbacks
    author: raw.author
      ? {
          name:   raw.author.name   ?? 'STEAMI',
          role:   raw.author.role   ?? 'Editor',
          bio:    raw.author.bio    ?? '',
          // avatar can itself be a data URI or a URL — resolve the same way
          avatar: apiAssetUrl(raw.author.avatar)
                  || `https://api.dicebear.com/7.x/avataaars/svg?seed=STEAMI`,
        }
      : {
          name:   'STEAMI',
          role:   'Editor',
          bio:    '',
          avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=STEAMI`,
        },
  };
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function BlogArticlePage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isLight = useThemeStore((s) => s.theme === 'light');

  const { posts, deletePost } = useBlogStore();

  const [post, setPost]   = useState<any>(null);
  const [error, setError] = useState('');

  /** Ref scoped to the article body — TextSelectionPopover listens here only */
  const contentRef = useRef<HTMLDivElement>(null);

  /** Telemetry session — holds eventId so close can PATCH the same row */
  const pageSession = useRef<PopupSession>(NO_SESSION);

  useEffect(() => {
    window.scrollTo(0, 0);
    if (id) {
      setError('');
      setPost(null);
      api.content
        .blogPost(id)
        .then((backendPost: any) => {
          const normalised = normalisePost(backendPost);
          setPost(normalised);
          // Log open event once content is confirmed to exist
          logPopupOpen('ai_insight', id, normalised.title, getGuestId())
            .then((s) => { pageSession.current = s; })
            .catch(() => {});
        })
        .catch((err: any) =>
          setError(`Backend blog API failed: ${err.message || 'Unable to fetch post'}`)
        );
    }
    // On unmount / route change — PATCH read duration onto the open-event row
    return () => {
      logPopupClose(pageSession.current);
      pageSession.current = NO_SESSION;
    };
  }, [id]);

  if (!post) {
    return (
      <SteamiLayout>
        <div className="py-20 text-center">
          <p
            className={`font-mono text-[11px] uppercase tracking-wider ${
              error ? 'text-steami-red' : 'text-muted-foreground'
            }`}
          >
            {error || 'Loading backend blog post...'}
          </p>
        </div>
      </SteamiLayout>
    );
  }

  const currentIndex = posts.findIndex((p) => p.id === post.id);
  const prevPost = currentIndex > 0 ? posts[currentIndex - 1] : null;
  const nextPost = currentIndex < posts.length - 1 ? posts[currentIndex + 1] : null;

  const related = posts.filter((p) => p.id !== post.id).slice(0, 3);

  const handleDelete = () => {
    if (window.confirm('Are you sure you want to delete this post?')) {
      api.content.deleteBlogPost(post.id).catch(() => deletePost(post.id));
      navigate('/blog');
    }
  };

  return (
    <SteamiLayout>
      <ScrollNavigator />

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6 }}
      >
        <BlogHero
          title={post.title}
          subtitle={post.subtitle}
          authorName={post.author.name}
          publishDate={post.publishDate}
          readingTime={post.readingTime}
          coverImage={post.coverImage}
          field={post.field}
          badgeColor={post.badgeColor}
        />

        <div className="max-w-[1200px] mx-auto flex flex-col lg:flex-row gap-8 lg:gap-12 relative px-4 sm:px-6">
          {/* Main Content Column */}
          <div className="flex-1 min-w-0">
            {/* Key Insights */}
            {post.keyInsights.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="rounded-xl p-5 md:p-6 mb-8"
                style={{
                  background: isLight ? 'rgba(224,242,254,0.4)' : 'rgba(6,16,38,0.4)',
                  border: isLight
                    ? '1px solid rgba(147,197,253,0.3)'
                    : '1px solid rgba(99,179,237,0.14)',
                }}
              >
                <div className="font-mono text-[11px] tracking-wider uppercase text-steami-cyan mb-4 flex items-center gap-2">
                  <Lightbulb className="w-4 h-4" /> KEY INSIGHTS
                </div>
                <ul className="space-y-3">
                  {post.keyInsights.map((insight: string, i: number) => (
                    <li key={i} className="flex items-start gap-3">
                      <span className="text-steami-cyan mt-1 text-sm">◆</span>
                      <span className="text-[15px] font-medium text-foreground leading-relaxed">
                        {insight}
                      </span>
                    </li>
                  ))}
                </ul>
              </motion.div>
            )}

            {/* Article body — TextSelectionPopover listens to mouseup inside this div only */}
            <div ref={contentRef}>
              <BlogContent content={post.content} citations={post.citations} />
            </div>

            {/* Text-selection toolbar — scoped to article body, not sidebar/insights */}
            <TextSelectionPopover
              containerRef={contentRef}
              source={post.title}
              sourceType="article"
              field={post.field}
              sourceId={post.id}
            />

            {/* ── Citations ──────────────────────────────────────────────── */}
            {post.citations.length > 0 && (
              <BlogCitationsSection citations={post.citations} />
            )}

            {/* ── References ─────────────────────────────────────────────── */}
            {post.references.length > 0 && (
              <BlogReferencesSection references={post.references} />
            )}

            {/* Knowledge Graph */}
            <div className="my-10">
              <ContentBlock
                icon={<Network className="w-4 h-4" />}
                label="Knowledge Map"
                colorClass="text-steami-gold"
                variant="inset"
              >
                <div className="mb-4">
                  Explore the conceptual relationships surrounding{' '}
                  {post.title.toLowerCase()}.
                </div>
                <div className="flex justify-center">
                  <KnowledgeGraph
                    centerTopic={post.title}
                    relatedTopics={post.keyInsights.slice(0, 3)}
                    field={post.field}
                    compact={false}
                  />
                </div>
              </ContentBlock>
            </div>

            {/* Article Footer */}
            <div className="mt-16 pt-8 border-t border-foreground/10">
              {/* Tags */}
              {post.tags.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-8">
                  {post.tags.map((tag: string) => (
                    <span
                      key={tag}
                      className="px-3 py-1.5 rounded-full bg-foreground/5 text-muted-foreground text-[12px] font-medium border border-foreground/10 hover:bg-foreground/10 transition-colors cursor-pointer"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              )}

              {/* Author card */}
              <div className="flex flex-col md:flex-row items-center justify-between gap-6 mb-12 bg-foreground/5 p-6 rounded-xl border border-foreground/5">
                <div className="flex items-center gap-4">
                  <img
                    src={post.author.avatar}
                    alt={post.author.name}
                    className="w-16 h-16 rounded-full border-2 border-steami-cyan/20 object-cover"
                  />
                  <div>
                    <h4 className="font-serif text-[17px] font-bold text-foreground mb-1">
                      {post.author.name}
                    </h4>
                    {post.author.role && (
                      <p className="text-[12px] font-mono text-steami-cyan uppercase tracking-wider mb-0.5">
                        {post.author.role}
                      </p>
                    )}
                    {post.author.bio && (
                      <p className="text-[14px] text-muted-foreground">{post.author.bio}</p>
                    )}
                  </div>
                </div>
                <div className="flex gap-3">
                  <button className="p-2 rounded-full bg-foreground/5 hover:bg-foreground/10 text-muted-foreground hover:text-steami-cyan transition-colors">
                    <Twitter className="w-4 h-4" />
                  </button>
                  <button className="p-2 rounded-full bg-foreground/5 hover:bg-foreground/10 text-muted-foreground hover:text-steami-cyan transition-colors">
                    <Linkedin className="w-4 h-4" />
                  </button>
                  <button className="p-2 rounded-full bg-foreground/5 hover:bg-foreground/10 text-muted-foreground hover:text-steami-cyan transition-colors">
                    <Share2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={handleDelete}
                    className="p-2 rounded-full bg-steami-red/10 hover:bg-steami-red/20 text-steami-red transition-colors ml-2"
                    title="Delete Post"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Prev / Next Navigation */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-16">
                {prevPost ? (
                  <Link
                    to={`/blog/${prevPost.id}`}
                    className="group p-4 rounded-xl border border-foreground/10 hover:border-steami-cyan/30 bg-foreground/5 transition-colors flex flex-col justify-center"
                  >
                    <span className="font-mono text-[11px] text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1">
                      <ChevronLeft className="w-3 h-3" /> Previous Post
                    </span>
                    <span className="font-serif text-[15px] font-bold text-foreground group-hover:text-steami-cyan transition-colors line-clamp-1">
                      {prevPost.title}
                    </span>
                  </Link>
                ) : (
                  <div />
                )}

                {nextPost ? (
                  <Link
                    to={`/blog/${nextPost.id}`}
                    className="group p-4 rounded-xl border border-foreground/10 hover:border-steami-cyan/30 bg-foreground/5 transition-colors flex flex-col justify-center text-right"
                  >
                    <span className="font-mono text-[11px] text-muted-foreground uppercase tracking-wider mb-2 flex items-center justify-end gap-1">
                      Next Post <ChevronRight className="w-3 h-3" />
                    </span>
                    <span className="font-serif text-[15px] font-bold text-foreground group-hover:text-steami-cyan transition-colors line-clamp-1">
                      {nextPost.title}
                    </span>
                  </Link>
                ) : (
                  <div />
                )}
              </div>
            </div>

            <RelatedPosts posts={related} />
          </div>

          {/* Sidebar */}
          <div className="w-full lg:w-[320px] shrink-0 mt-8 lg:mt-0">
            <div className="lg:sticky lg:top-4 lg:self-start">
              <BlogSidebar post={post} />
            </div>
          </div>
        </div>
      </motion.div>
    </SteamiLayout>
  );
}
/* ══════════════════════════════════════════════════════════════════
   BLOG CITATIONS SECTION — numbered inline citations
   ══════════════════════════════════════════════════════════════════ */
function BlogCitationsSection({ citations }: { citations: any[] }) {
  return (
    <div className="mt-10 pt-6 border-t border-foreground/10">
      <div className="font-mono text-[11px] tracking-wider uppercase mb-5 flex items-center gap-2 text-steami-cyan">
        <Quote className="w-3.5 h-3.5" /> CITATIONS
      </div>
      <ol className="space-y-4">
        {citations.map((c: any, i: number) => (
          <li key={c.id ?? i} className="flex gap-3 items-start text-[13px] leading-relaxed">
            {/* Number badge */}
            <span
              className="shrink-0 font-mono text-[10px] font-bold rounded-sm px-1.5 py-0.5 mt-0.5"
              style={{
                background: 'rgba(99,179,237,0.12)',
                color: '#63b3ed',
                border: '1px solid rgba(99,179,237,0.22)',
              }}
            >
              {c.id ?? i + 1}
            </span>
            <div className="min-w-0">
              {c.text && (
                <p className="text-muted-foreground mb-1 italic leading-relaxed">"{c.text}"</p>
              )}
              <div className="flex flex-wrap items-center gap-2">
                {c.source_url ? (
                  <a
                    href={c.source_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-medium text-steami-cyan hover:underline transition-colors break-all"
                  >
                    {c.source_title || c.source_url}
                  </a>
                ) : c.source_title ? (
                  <span className="font-medium text-steami-cyan">{c.source_title}</span>
                ) : null}
                {c.accessed_date && (
                  <span className="font-mono text-[10px] text-muted-foreground/50">
                    accessed {c.accessed_date}
                  </span>
                )}
              </div>
              {c.source_url && (
                <span className="font-mono text-[10px] text-muted-foreground/40 break-all block mt-0.5">
                  {c.source_url}
                </span>
              )}
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════
   BLOG REFERENCES SECTION — works cited / source list
   ══════════════════════════════════════════════════════════════════ */
const BLOG_REF_TYPE_COLORS: Record<string, string> = {
  paper:   'rgba(167,139,250,0.15)', article: 'rgba(99,179,237,0.12)',
  book:    'rgba(52,211,153,0.12)',  website: 'rgba(251,191,36,0.10)',
  dataset: 'rgba(248,113,113,0.10)',
};
const BLOG_REF_TYPE_TEXT: Record<string, string> = {
  paper: '#a78bfa', article: '#63b3ed', book: '#34d399', website: '#fbbf24', dataset: '#f87171',
};

function BlogReferencesSection({ references }: { references: any[] }) {
  return (
    <div className="mt-10 pt-6 border-t border-foreground/10">
      <div className="font-mono text-[11px] tracking-wider uppercase mb-5 flex items-center gap-2 text-steami-gold">
        <BookMarked className="w-3.5 h-3.5" /> WORKS CITED
      </div>
      <ol className="space-y-3">
        {references.map((ref: any, i: number) => {
          const title  = typeof ref === 'string' ? ref : ref.title;
          const url    = typeof ref === 'string' ? undefined : ref.url;
          const author = typeof ref === 'string' ? undefined : ref.author;
          const type   = typeof ref === 'string' ? undefined : ref.type;
          return (
            <li key={i} className="flex gap-3 items-start text-[13px] leading-relaxed">
              <span className="shrink-0 font-mono text-[10px] text-muted-foreground/40 mt-0.5 w-5 text-right">
                {i + 1}.
              </span>
              <div className="min-w-0 flex flex-col gap-0.5">
                {type && (
                  <span
                    className="self-start font-mono text-[9px] uppercase tracking-wider px-1.5 py-0.5 rounded-sm mb-0.5"
                    style={{
                      background: BLOG_REF_TYPE_COLORS[type] ?? 'rgba(255,255,255,0.06)',
                      color:      BLOG_REF_TYPE_TEXT[type]   ?? '#94a3b8',
                    }}
                  >
                    {type}
                  </span>
                )}
                <div>
                  {url ? (
                    <a
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-medium text-steami-cyan hover:underline break-all transition-colors"
                    >
                      {title}
                    </a>
                  ) : (
                    <span className="text-foreground/80 font-medium">{title}</span>
                  )}
                  {author && (
                    <span className="text-muted-foreground/60 text-[12px] ml-2">— {author}</span>
                  )}
                </div>
                {url && (
                  <span className="font-mono text-[10px] text-muted-foreground/40 break-all">{url}</span>
                )}
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
