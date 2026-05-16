import { Link } from 'react-router-dom';
import { CardSvgVisual } from '@/components/CardSvgVisual';
import { useThemeStore } from '@/stores/theme-store';
import { cn } from '@/lib/utils';

interface BlogCardProps {
  post: any;
  coverImage: string;
  authorAvatar: string;
}

export const BlogCard = ({ post, coverImage, authorAvatar }: BlogCardProps) => {
  const isLight = useThemeStore((s) => s.theme === 'light');

  return (
    <Link to={`/blog/${post.id}`} className={cn("glass-card steami-hover-card flex flex-col h-full group", isLight ? "bg-white/40 border-zinc-200/50" : "")}>
      <div className="relative h-48 overflow-hidden">
        <img
          src={coverImage}
          alt={post.title}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
        <div
          className="absolute inset-0"
          style={{
            background: isLight
              ? 'linear-gradient(180deg, transparent 40%, rgba(255,255,255,0.95) 100%)'
              : 'linear-gradient(180deg, transparent 40%, rgba(2,8,23,0.95) 100%)',
          }}
        />
        <CardSvgVisual field={post.field} variant="mini" className="absolute bottom-2 right-2 opacity-50" />
      </div>

      <div className="p-5 flex flex-col flex-1">
        <div className="flex items-center gap-2 mb-3">
          <span className={`steami-badge steami-badge-${post.badgeColor} text-[10px]`}>
            {post.field}
          </span>
        </div>
        <h2 className="font-serif text-[17px] font-bold text-foreground mb-2 leading-snug line-clamp-2 min-h-[2.8em]">
          {post.title}
        </h2>
        <p className={`text-[14px] font-medium leading-relaxed line-clamp-3 flex-1 mb-4 ${isLight ? 'text-zinc-600' : 'text-white/70'}`}>
          {post.description}
        </p>

        <div className="flex items-center justify-between pt-4 border-t border-foreground/5 mt-auto">
          <div className="flex items-center gap-2">
            <img src={authorAvatar} alt={post.author?.name || 'STEAMI'} className="w-6 h-6 rounded-full" />
            <span className={`font-mono text-[11px] ${isLight ? 'text-zinc-500' : 'text-white/60'}`}>{post.author?.name || 'STEAMI'}</span>
          </div>
          <span className={`font-mono text-[11px] ${isLight ? 'text-zinc-400' : 'text-white/40'}`}>{post.publishDate}</span>
        </div>
      </div>
    </Link>
  );
};
