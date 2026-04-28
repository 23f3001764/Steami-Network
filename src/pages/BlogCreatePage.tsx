import { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { SteamiLayout } from '@/components/SteamiLayout';
import { useBlogStore, BlogPost } from '@/stores/blog-store';
import { useThemeStore } from '@/stores/theme-store';
import { api } from '@/lib/api';

export default function BlogCreatePage() {
  const navigate = useNavigate();
  const { addPost } = useBlogStore();
  const isLight = useThemeStore((s) => s.theme === 'light');

  const [formData, setFormData] = useState({
    title: '',
    subtitle: '',
    description: '',
    authorName: 'Guest Author',
    authorRole: 'Contributor',
    coverImage: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=2000&auto=format&fit=crop',
    field: 'GENERAL',
    type: 'article',
    tags: '',
    content: '## New Blog Post\n\nStart writing here...',
    simulationUrl: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const inputStyle = `w-full bg-transparent border rounded-md px-4 py-2.5 text-[15px] font-medium transition-colors outline-none focus:border-steami-cyan focus:ring-1 focus:ring-steami-cyan ${
    isLight ? 'border-blue-200 text-foreground' : 'border-white/10 text-white'
  }`;

  const labelStyle = 'block font-mono text-[11px] text-muted-foreground uppercase tracking-wider mb-1.5';

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    if (errors[e.target.name]) {
      setErrors({ ...errors, [e.target.name]: '' });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const newErrors: Record<string, string> = {};
    if (!formData.title.trim()) newErrors.title = 'Title is required';
    if (!formData.description.trim()) newErrors.description = 'Description is required';
    
    if (formData.type === 'article' && !formData.content.trim()) {
      newErrors.content = 'Content is required';
    }
    
    if (formData.type === 'simulation' && !formData.simulationUrl.trim()) {
      newErrors.simulationUrl = 'Simulation URL is required';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    const newPost: BlogPost = {
      id: formData.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '') + '-' + Date.now(),
      title: formData.title,
      subtitle: formData.subtitle,
      description: formData.description,
      author: {
        name: formData.authorName,
        role: formData.authorRole,
        avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${formData.authorName}`,
        bio: 'A contributor to the STEAMI network.',
      },
      publishDate: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      readingTime: `${Math.max(1, Math.ceil(formData.content.length / 1000))} MIN READ`,
      coverImage: formData.coverImage,
      field: formData.field.toUpperCase(),
      badgeColor: 'cyan', // Default
      tags: formData.tags.split(',').map(t => t.trim()).filter(Boolean),
      type: formData.type as 'explainer' | 'article' | 'simulation',
      content: formData.type === 'article' ? formData.content : undefined,
      simulationUrl: formData.type === 'simulation' ? formData.simulationUrl : undefined,
      keyInsights: [],
    };

    try {
      await api.content.createBlogPost(newPost as unknown as Record<string, unknown>);
    } catch {
      addPost(newPost);
    }
    navigate('/blog');
  };

  return (
    <SteamiLayout>
      <div className="max-w-3xl mx-auto py-8">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <h1 className="steami-heading text-3xl mb-2">Create New Post</h1>
          <p className="text-[15px] text-muted-foreground">Draft and publish a new article to the STEAMI network.</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="glass-card p-6 md:p-8"
        >
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                <label className={labelStyle}>Title *</label>
                <input name="title" value={formData.title} onChange={handleChange} className={inputStyle} placeholder="Article title" />
                {errors.title && <p className="text-steami-red text-[11px] mt-1">{errors.title}</p>}
              </div>

              <div className="md:col-span-2">
                <label className={labelStyle}>Subtitle</label>
                <input name="subtitle" value={formData.subtitle} onChange={handleChange} className={inputStyle} placeholder="Brief subtitle" />
              </div>

              <div className="md:col-span-2">
                <label className={labelStyle}>Description *</label>
                <textarea name="description" value={formData.description} onChange={handleChange} rows={2} className={`${inputStyle} resize-none`} placeholder="Short summary" />
                {errors.description && <p className="text-steami-red text-[11px] mt-1">{errors.description}</p>}
              </div>

              <div>
                <label className={labelStyle}>Author Name</label>
                <input name="authorName" value={formData.authorName} onChange={handleChange} className={inputStyle} />
              </div>

              <div>
                <label className={labelStyle}>Field / Category</label>
                <select name="field" value={formData.field} onChange={handleChange} className={inputStyle}>
                  <option value="GENERAL">General</option>
                  <option value="PHYSICS">Physics</option>
                  <option value="COMPUTING">Computing</option>
                  <option value="BIOLOGY">Biology</option>
                  <option value="AI">AI / Machine Learning</option>
                </select>
              </div>

              <div>
                <label className={labelStyle}>Content Type *</label>
                <select name="type" value={formData.type} onChange={handleChange} className={inputStyle} required>
                  <option value="article">Article</option>
                  <option value="explainer">Explainer Card</option>
                  <option value="simulation">3D Simulation</option>
                </select>
              </div>

              <div className="md:col-span-2">
                <label className={labelStyle}>Cover Image URL</label>
                <input name="coverImage" value={formData.coverImage} onChange={handleChange} className={inputStyle} placeholder="https://..." />
              </div>

              <div className="md:col-span-2">
                <label className={labelStyle}>Tags (comma separated)</label>
                <input name="tags" value={formData.tags} onChange={handleChange} className={inputStyle} placeholder="e.g. Science, Technology, Future" />
              </div>

              {formData.type === 'article' && (
                <div className="md:col-span-2">
                  <label className={labelStyle}>Content (Markdown) *</label>
                  <textarea name="content" value={formData.content} onChange={handleChange} rows={15} className={`${inputStyle} font-mono text-[14px] leading-relaxed`} />
                  {errors.content && <p className="text-steami-red text-[11px] mt-1">{errors.content}</p>}
                </div>
              )}

              {formData.type === 'simulation' && (
                <div className="md:col-span-2">
                  <label className={labelStyle}>Simulation URL or Embed *</label>
                  <input name="simulationUrl" value={formData.simulationUrl} onChange={handleChange} className={inputStyle} placeholder="https://my-3d-simulation-link.com" />
                  {errors.simulationUrl && <p className="text-steami-red text-[11px] mt-1">{errors.simulationUrl}</p>}
                </div>
              )}
            </div>

            <div className="pt-4 flex justify-end gap-3">
              <button type="button" onClick={() => navigate(-1)} className="steami-btn bg-transparent text-foreground border-foreground/20 hover:bg-foreground/5 text-[11px]">
                CANCEL
              </button>
              <button type="submit" className="steami-btn text-[11px]">
                PUBLISH POST
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </SteamiLayout>
  );
}
