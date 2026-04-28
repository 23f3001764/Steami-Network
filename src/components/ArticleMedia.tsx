import { useThemeStore } from '@/stores/theme-store';
import { CardSvgVisual } from '@/components/CardSvgVisual';

interface ArticleMediaProps {
  src: string;
  alt: string;
  field: string;
  className?: string;
}

/**
 * Sticky/adaptive image panel for the opened article view.
 * Displays the hero image with field SVG overlay in a self-contained container.
 * On desktop it becomes sticky inside the right column of the dual-panel layout.
 */
export function ArticleMedia({ src, alt, field, className = '' }: ArticleMediaProps) {
  const isLight = useThemeStore((s) => s.theme === 'light');

  return (
    <div
      className={`rounded-xl overflow-hidden ${className}`}
      style={{
        background: isLight ? 'rgba(255,255,255,0.85)' : 'rgba(5,14,32,0.88)',
        border: isLight
          ? '1px solid rgba(147,197,253,0.35)'
          : '1px solid rgba(99,179,237,0.14)',
      }}
    >
      {/* Image container */}
      <div className="relative overflow-hidden aspect-[16/10]">
        <img
          src={src}
          alt={alt}
          className="w-full h-full object-cover"
          width={768}
          height={512}
        />
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: isLight
              ? 'linear-gradient(180deg, transparent 60%, rgba(15,40,80,0.1) 100%)'
              : 'linear-gradient(180deg, transparent 50%, rgba(5,14,32,0.6) 100%)',
          }}
        />
      </div>
      {/* SVG decoration below image */}
      <div className="flex items-center justify-center py-4">
        <CardSvgVisual field={field} variant="modal" />
      </div>
    </div>
  );
}
