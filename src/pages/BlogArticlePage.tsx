import { useEffect, useState } from 'react';
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
import { Trash2, Share2, Twitter, Linkedin, ChevronLeft, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { api, apiAssetUrl } from '@/lib/api';

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

  useEffect(() => {
    window.scrollTo(0, 0);
    if (id) {
      setError('');
      setPost(null);
      api.content
        .blogPost(id)
        .then((backendPost: any) => setPost(normalisePost(backendPost)))
        .catch((err: any) =>
          setError(`Backend blog API failed: ${err.message || 'Unable to fetch post'}`)
        );
    }
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

            <BlogContent content={post.content} />

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