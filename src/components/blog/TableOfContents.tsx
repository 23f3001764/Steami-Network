import { useEffect, useState } from 'react';
import { useThemeStore } from '@/stores/theme-store';

interface TableOfContentsProps {
  content: string;
}

interface Heading {
  id: string;
  text: string;
  level: number;
}

export function TableOfContents({ content }: TableOfContentsProps) {
  const isLight = useThemeStore((s) => s.theme === 'light');
  const [headings, setHeadings] = useState<Heading[]>([]);
  const [activeId, setActiveId] = useState<string>('');

  useEffect(() => {
    // Basic markdown heading extraction
    const extracted: Heading[] = [];
    const lines = content.split('\n');
    const slugify = (str: string) =>
      str.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');

    lines.forEach((line) => {
      const match = line.match(/^(#{2,4})\s+(.+)$/);
      if (match) {
        const level = match[1].length;
        const text = match[2];
        extracted.push({ id: slugify(text), text, level });
      }
    });
    setHeadings(extracted);

    let observer: IntersectionObserver | null = null;

    // Give some time for markdown to render before observing
    const timer = setTimeout(() => {
      observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              setActiveId(entry.target.id);
            }
          });
        },
        { rootMargin: '-20% 0% -80% 0%' }
      );

      extracted.forEach((h) => {
        const el = document.getElementById(h.id);
        if (el) observer?.observe(el);
      });
    }, 500);

    return () => {
      clearTimeout(timer);
      if (observer) observer.disconnect();
    };
  }, [content]);

  if (headings.length === 0) return null;

  return (
    <div
      className="p-5 rounded-xl mb-6 sticky top-24"
      style={{
        background: isLight ? 'rgba(255,255,255,0.7)' : 'rgba(5,14,32,0.6)',
        backdropFilter: 'blur(12px)',
        border: isLight ? '1px solid rgba(147,197,253,0.3)' : '1px solid rgba(99,179,237,0.1)',
      }}
    >
      <h4 className="font-mono text-[11px] tracking-wider uppercase text-steami-cyan mb-4">On This Page</h4>
      <ul className="space-y-2.5">
        {headings.map((h) => (
          <li key={h.id} style={{ paddingLeft: `${(h.level - 2) * 12}px` }}>
            <a
              href={`#${h.id}`}
              className={`text-[16px] transition-colors duration-200 block truncate ${activeId === h.id ? 'text-steami-gold font-semibold' : 'text-muted-foreground hover:text-steami-cyan'
                }`}
              onClick={(e) => {
                e.preventDefault();
                const el = document.getElementById(h.id);
                if (el) {
                  window.scrollTo({ top: el.offsetTop - 80, behavior: 'smooth' });
                }
              }}
            >
              {h.text}
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}
