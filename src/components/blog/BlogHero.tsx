import { motion } from 'framer-motion';
import { useThemeStore } from '@/stores/theme-store';

interface BlogHeroProps {
  title: string;
  subtitle: string;
  authorName: string;
  publishDate: string;
  readingTime: string;
  coverImage: string;
  field: string;
  badgeColor: string;
}

export function BlogHero({
  title,
  subtitle,
  authorName,
  publishDate,
  readingTime,
  coverImage,
  field,
  badgeColor,
}: BlogHeroProps) {
  const isLight = useThemeStore((s) => s.theme === 'light');

  return (
    <div className="relative w-full max-w-5xl mx-auto rounded-xl overflow-hidden mb-12 shadow-2xl" style={{ minHeight: '400px' }}>
      <img
        src={coverImage}
        alt={title}
        className="absolute inset-0 w-full h-full object-cover"
      />
      <div
        className="absolute inset-0"
        style={{
          background: isLight
            ? 'linear-gradient(to top, rgba(255,255,255,1) 0%, rgba(255,255,255,0.7) 30%, transparent 100%)'
            : 'linear-gradient(to top, rgba(5,14,32,1) 0%, rgba(5,14,32,0.8) 40%, rgba(2,8,23,0.3) 100%)',
        }}
      />
      
      <div className="absolute inset-x-0 bottom-0 p-8 md:p-12 flex flex-col justify-end">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="flex items-center gap-3 mb-4">
            <span className={`steami-badge steami-badge-${badgeColor} text-[16px]`}>{field}</span>
            <span className="font-mono text-[11px] text-steami-cyan tracking-wider">{readingTime}</span>
          </div>
          
          <h1 className="steami-heading text-4xl md:text-5xl lg:text-6xl mb-4 leading-tight">
            {title}
          </h1>
          
          <p className="text-lg md:text-xl font-medium text-muted-foreground max-w-3xl leading-relaxed mb-6">
            {subtitle}
          </p>
          
          <div className="flex items-center gap-4 border-t border-foreground/10 pt-6 mt-4">
            <div className="flex flex-col">
              <span className="font-serif text-sm font-extrabold text-foreground">{authorName}</span>
              <span className="font-mono text-[11px] text-muted-foreground uppercase">{publishDate}</span>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
