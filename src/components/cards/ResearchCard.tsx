import { motion } from 'framer-motion';
import { cardTap } from '@/lib/motion';
import { CardSvgVisual } from '@/components/CardSvgVisual';
import { ShareMenu } from '@/components/ShareMenu';
import { BookOpen } from 'lucide-react';
import { useThemeStore } from '@/stores/theme-store';
import { FIELD_COLORS } from '@/data/research-articles';

interface ResearchCardProps {
  article: any;
  idx: number;
  onSelect: (a: any) => void;
  fieldImg: string;
}

export const ResearchCard = ({ article, idx, onSelect, fieldImg }: ResearchCardProps) => {
  const isLight = useThemeStore((s) => s.theme === 'light');

  return (
    <motion.div
      key={article.id}
      whileTap={cardTap}
      className="glass-card relative p-0 cursor-pointer overflow-hidden group/card flex flex-col sm:flex-row h-full min-h-[320px]"
      onClick={() => onSelect(article)}
    >
      {/* Left accent bar (vertical) */}
      <div
        className="w-[2px] shrink-0"
        style={{
          background: `linear-gradient(180deg, hsl(var(--steami-${FIELD_COLORS[article.field] || 'cyan'})) 0%, transparent 100%)`,
        }}
      />

      {/* LEFT — Content Area (60%) */}
      <div className="flex-[3] p-5 flex flex-col justify-between min-w-0">
        <div>
          <div className="flex flex-wrap items-center gap-2 mb-3">
            <span className={`steami-badge steami-badge-${FIELD_COLORS[article.field] || 'cyan'} text-[11px] sm:text-[13px] inline-block`}>
              {article.field}
            </span>
            <ShareMenu title={article.title} popupType="research" popupId={article.id} compact className="opacity-0 group-hover/card:opacity-100 transition-opacity" />
          </div>
          <h3 className="font-serif text-[18px] font-extrabold mb-2 leading-snug text-foreground line-clamp-2">{article.title}</h3>
          <p className={`text-[14px] font-medium leading-relaxed line-clamp-3 mb-3 ${isLight ? 'text-zinc-600' : 'text-white/70'}`}>{article.abstract || article.short_summary}</p>
        </div>
        <div className="flex items-center justify-between pt-3 border-t border-foreground/5">
          <span className={`text-[11px] font-mono tracking-wider ${isLight ? 'text-zinc-500' : 'text-white/50'}`}>
            {article.author} · {article.readTime}
          </span>
          <span className="text-[11px] font-mono text-steami-cyan tracking-wider uppercase opacity-0 group-hover/card:opacity-100 transition-opacity flex items-center gap-1 font-bold">
            Read Research <BookOpen className="w-3 h-3" />
          </span>
        </div>
      </div>

      {/* Glowing vertical divider */}
      <div
        className="w-px my-4 shrink-0 hidden sm:block"
        style={{
          background: isLight
            ? 'linear-gradient(180deg, transparent, rgba(147,197,253,0.5), transparent)'
            : `linear-gradient(180deg, transparent, hsl(var(--steami-${FIELD_COLORS[article.field] || 'cyan'}) / 0.25), transparent)`,
        }}
      />

      {/* RIGHT — Image Window (40%) */}
      <div className="flex-[2] relative overflow-hidden min-h-40 sm:min-h-0">
        <motion.div
          className="w-full h-full"
          whileHover={{ scale: 1.05 }}
          transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
        >
          <img
            src={fieldImg}
            alt={article.field}
            loading="lazy"
            className="w-full h-full object-cover"
          />
        </motion.div>
        {/* Gradient overlay for depth */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: isLight
              ? 'linear-gradient(90deg, rgba(255,255,255,0.4) 0%, transparent 40%)'
              : 'linear-gradient(90deg, rgba(2,8,23,0.5) 0%, transparent 40%)',
          }}
        />
        <CardSvgVisual field={article.field} variant="mini" className="absolute bottom-3 right-3 opacity-40 group-hover/card:opacity-70 transition-opacity" />
      </div>
    </motion.div>
  );
};
