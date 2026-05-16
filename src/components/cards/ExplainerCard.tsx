import { motion } from 'framer-motion';
import { cardTap } from '@/lib/motion';
import { CardMedia } from '@/components/CardMedia';
import { ShareMenu } from '@/components/ShareMenu';
import { CardSvgVisual } from '@/components/CardSvgVisual';
import { useThemeStore } from '@/stores/theme-store';
import { cn } from '@/lib/utils';

interface ExplainerCardProps {
  exp: any;
  idx: number;
  onClick: () => void;
  getImageUrl: (path: string | undefined | null) => string;
  explainerImages: Record<string, string>;
}

export const ExplainerCard = ({ exp, idx, onClick, getImageUrl, explainerImages }: ExplainerCardProps) => {
  const isLight = useThemeStore((s) => s.theme === 'light');
  const heroImg = getImageUrl(exp.image) || explainerImages[exp.id];

  return (
    <motion.div
      key={exp.id}
      custom={idx}
      whileTap={cardTap}
      className={cn(
        "glass-card steami-hover-card relative cursor-pointer group flex flex-col h-full",
        isLight ? "bg-white/40 border-zinc-200/50" : ""
      )}
      onClick={onClick}
    >
      {/* Accent bar */}
      <div className="h-[2px] w-full" style={{ background: `linear-gradient(90deg, hsl(var(--steami-${exp.badgeColor})) 0%, transparent 100%)` }} />

      {/* Image Window via CardMedia */}
      <CardMedia src={heroImg} alt={exp.title} badgeColor={exp.badgeColor} height={200}>
        <ShareMenu title={exp.title} popupType="explainer" popupId={exp.id} compact className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity" />
      </CardMedia>

      {/* Glowing Divider */}
      <div
        className="h-px mx-5"
        style={{
          background: isLight
            ? 'linear-gradient(90deg, transparent, rgba(147,197,253,0.5), transparent)'
            : `linear-gradient(90deg, transparent, hsl(var(--steami-${exp.badgeColor}) / 0.25), transparent)`,
        }}
      />

      {/* Content Area */}
      <div className="p-5 sm:p-6 sm:pt-4 flex-1 flex flex-col">
        <div className="flex flex-wrap items-center gap-2 mb-3">
          <span className={`steami-badge steami-badge-${exp.badgeColor} text-[11px] sm:text-[13px] inline-block`}>{exp.field}</span>
        </div>
        <div className="flex items-start gap-3">
          <div className="flex-1">
            <h3 className="font-serif text-[18px] font-extrabold mb-2 leading-snug text-foreground line-clamp-2 min-h-[2.8em]">{exp.title}</h3>
            <p className={`text-[15px] sm:text-[17px] font-medium leading-relaxed line-clamp-3 mb-4 ${isLight ? 'text-zinc-600' : 'text-white/70'}`}>{exp.subtitle}</p>
          </div>
          <CardSvgVisual field={exp.field} variant="mini" className="hidden sm:flex mt-0.5 shrink-0 opacity-60" />
        </div>
        <div className="mt-auto flex items-center justify-between pt-3 border-t border-foreground/5">
          <span className={`text-[11px] font-mono tracking-wider ${isLight ? 'text-zinc-500' : 'text-white/50'}`}>
            {(exp.keyInsights ?? []).length} INSIGHTS · {(exp.content ?? []).length} SLIDES
          </span>
          <span className="text-[11px] font-mono text-steami-cyan tracking-wider uppercase opacity-0 group-hover:opacity-100 transition-opacity font-bold">
            Read →
          </span>
        </div>
      </div>
    </motion.div>
  );
};
