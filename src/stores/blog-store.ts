import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { blogPosts as initialBlogPosts, BlogPost } from '@/data/blog';

interface BlogState {
  posts: BlogPost[];
  addPost: (post: BlogPost) => void;
  deletePost: (id: string) => void;
  updatePost: (id: string, updatedPost: Partial<BlogPost>) => void;
}

export const useBlogStore = create<BlogState>()(
  persist(
    (set) => ({
      posts: initialBlogPosts,
      addPost: (post) => set((state) => ({ posts: [post, ...state.posts] })),
      deletePost: (id) => set((state) => ({ posts: state.posts.filter((p) => p.id !== id) })),
      updatePost: (id, updatedPost) =>
        set((state) => ({
          posts: state.posts.map((p) => (p.id === id ? { ...p, ...updatedPost } : p)),
        })),
    }),
    {
      name: 'steami-blog-storage',
    }
  )
);
