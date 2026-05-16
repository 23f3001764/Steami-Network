import { useState, useEffect } from 'react';
import { api, apiAssetUrl } from '@/lib/api';
import { ExplainerCard } from '@/components/cards/ExplainerCard';
import { ResearchCard } from '@/components/cards/ResearchCard';
import { BlogCard } from '@/components/cards/BlogCard';
import { AnimatedCardWrapper } from './AnimatedCardWrapper';
import { EcosystemRow } from './EcosystemRow';
import { SectionHeader } from './SectionHeader';
import { explainerImages } from '@/data/explainer-images';
import { researchFieldImages } from '@/data/research-images';
import { useBlogStore } from '@/stores/blog-store';

const getImageUrl = (path: string | undefined | null) => apiAssetUrl(path || '');

export const EcosystemSection = () => {
  const [explainers, setExplainers] = useState<any[]>([]);
  const [articles, setArticles] = useState<any[]>([]);
  const [blogs, setBlogs] = useState<any[]>([]);
  const { posts: localPosts } = useBlogStore();

  useEffect(() => {
    // Fetch top 4 items for each category
    api.content.explainers().then((data: any) => {
      const items = Array.isArray(data) ? data : data?.explainers ?? [];
      setExplainers(items.slice(0, 4));
    }).catch(() => {});

    api.content.researchArticles().then((data: any) => {
      const items = Array.isArray(data) ? data : data?.articles ?? [];
      setArticles(items.slice(0, 4));
    }).catch(() => {});

    api.content.blogPosts().then((data: any) => {
      const items = Array.isArray(data) ? data : data?.posts ?? [];
      setBlogs(items.slice(0, 4));
    }).catch(() => {});
  }, []);

  const onSelectExplainer = (idx: number) => {
    // For now, redirect to explainers page with the specific explainer open
    window.location.href = `/explainers?explainer=${explainers[idx].id}`;
  };

  const onSelectArticle = (article: any) => {
    window.location.href = `/research?research=${article.id}`;
  };

  return (
    <section className="py-24 relative overflow-hidden">
      <div className="container mx-auto px-6 sm:px-12 relative z-10">
        <SectionHeader />

        <div className="space-y-32">
          {/* ROW 1: EXPLAINERS */}
          <EcosystemRow title="Explainers" viewAllPath="/explainers" index={0}>
            {explainers.map((exp, idx) => (
              <div key={exp.id} className="w-[300px] sm:w-[380px] lg:w-[400px] shrink-0 h-full">
                <AnimatedCardWrapper index={idx}>
                  <ExplainerCard 
                    exp={exp} 
                    idx={idx} 
                    onClick={() => onSelectExplainer(idx)} 
                    getImageUrl={getImageUrl} 
                    explainerImages={explainerImages}
                  />
                </AnimatedCardWrapper>
              </div>
            ))}
          </EcosystemRow>

          {/* ROW 2: RESEARCH ARTICLES */}
          <EcosystemRow title="Research Articles" viewAllPath="/research" index={1}>
            {articles.map((article, idx) => (
              <div key={article.id} className="w-[90vw] sm:w-[600px] lg:w-[720px] shrink-0 h-full">
                <AnimatedCardWrapper index={idx + 4}>
                  <ResearchCard 
                    article={article} 
                    idx={idx} 
                    onSelect={onSelectArticle} 
                    fieldImg={getImageUrl(article.image) || researchFieldImages[article.field]}
                  />
                </AnimatedCardWrapper>
              </div>
            ))}
          </EcosystemRow>

          {/* ROW 3: BLOGS */}
          <EcosystemRow title="Blogs" viewAllPath="/blog" index={2}>
            {blogs.map((post, idx) => (
              <div key={post.id} className="w-[300px] sm:w-[380px] lg:w-[400px] shrink-0 h-full">
                <AnimatedCardWrapper index={idx + 8}>
                  <BlogCard 
                    post={post} 
                    coverImage={apiAssetUrl(post.coverImage) || localPosts[0]?.coverImage} 
                    authorAvatar={apiAssetUrl(post.author?.avatar) || `https://api.dicebear.com/7.x/avataaars/svg?seed=${post.author?.name || 'STEAMI'}`}
                  />
                </AnimatedCardWrapper>
              </div>
            ))}
          </EcosystemRow>
        </div>
      </div>
      
      {/* Background Decorative Elements */}
      <div className="absolute top-[20%] right-[-5%] w-[40vw] h-[40vw] bg-steami-cyan/5 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-[10%] left-[-5%] w-[30vw] h-[30vw] bg-steami-gold/5 blur-[100px] rounded-full pointer-events-none" />
    </section>
  );
};
