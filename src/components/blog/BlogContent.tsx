import { motion } from 'framer-motion';
import { useThemeStore } from '@/stores/theme-store';
import ReactMarkdown from 'react-markdown';

interface BlogContentProps {
  content: string;
}

export function BlogContent({ content }: BlogContentProps) {
  const isLight = useThemeStore((s) => s.theme === 'light');

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.3, duration: 0.5 }}
      className={`prose prose-lg max-w-none ${isLight ? 'prose-slate' : 'prose-invert'}
        prose-headings:font-serif prose-headings:font-extrabold prose-headings:text-foreground
        prose-p:text-muted-foreground prose-p:leading-[1.8] prose-p:font-medium
        prose-a:text-steami-cyan prose-a:no-underline hover:prose-a:underline hover:prose-a:text-steami-gold
        prose-blockquote:border-l-steami-gold prose-blockquote:bg-steami-gold/5 prose-blockquote:py-1 prose-blockquote:px-4 prose-blockquote:rounded-r-lg
        prose-code:text-steami-cyan prose-code:bg-steami-cyan/10 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded-md
        prose-pre:bg-slate-900 prose-pre:border prose-pre:border-slate-800
        prose-li:text-muted-foreground prose-li:leading-[1.8]
      `}
    >
      <ReactMarkdown>{content}</ReactMarkdown>
    </motion.div>
  );
}
