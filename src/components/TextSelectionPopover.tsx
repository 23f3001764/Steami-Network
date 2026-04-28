import { useCallback, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { BookOpen, Sparkles } from 'lucide-react';
import { api } from '@/lib/api';
import { useSteamiStore } from '@/stores/steami-store';

interface Props {
  containerRef: React.RefObject<HTMLDivElement>;
  source: string;
  sourceType: 'explainer' | 'article' | 'simulation' | 'insight';
  field?: string;
  sourceId?: string;
}

export function TextSelectionPopover({ containerRef, source, sourceType, field, sourceId }: Props) {
  const [show, setShow] = useState(false);
  const [pos, setPos] = useState({ x: 0, y: 0, above: true });
  const [selectedText, setSelectedText] = useState('');
  const addToDiary = useSteamiStore((s) => s.addToDiary);
  const canPortal = typeof document !== 'undefined';

  const handleMouseUp = useCallback(() => {
    const sel = window.getSelection();
    if (!sel || sel.isCollapsed || !sel.toString().trim()) {
      setShow(false);
      return;
    }

    const text = sel.toString().trim();
    if (text.length < 5) {
      setShow(false);
      return;
    }

    const rect = sel.getRangeAt(0).getBoundingClientRect();
    const toolbarWidth = 176;
    const x = Math.min(Math.max(rect.left + rect.width / 2, toolbarWidth / 2 + 8), window.innerWidth - toolbarWidth / 2 - 8);
    const above = rect.top > 76;
    const y = above ? Math.max(12, rect.top - 12) : Math.min(window.innerHeight - 64, rect.bottom + 12);
    setPos({ x, y, above });
    setSelectedText(text);
    setShow(true);
  }, []);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    el.addEventListener('mouseup', handleMouseUp);
    return () => el.removeEventListener('mouseup', handleMouseUp);
  }, [containerRef, handleMouseUp]);

  const clear = () => {
    setShow(false);
    window.getSelection()?.removeAllRanges();
  };

  const popover = (
    <AnimatePresence>
      {show && (
        <motion.div
          className="fixed z-[1000]"
          style={{
            left: pos.x,
            top: pos.y,
            transform: pos.above ? 'translate(-50%, -100%)' : 'translate(-50%, 0)',
          }}
          initial={{ opacity: 0, scale: 0.86, y: pos.above ? 6 : -6 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.86, y: pos.above ? 6 : -6 }}
          transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
        >
          <div
            className="flex w-max max-w-[calc(100vw-16px)] items-center gap-1 rounded-xl px-1.5 py-1.5"
            style={{
              background: 'rgba(8, 20, 48, 0.92)',
              backdropFilter: 'blur(20px) saturate(160%)',
              border: '1px solid rgba(99, 179, 237, 0.25)',
              boxShadow: '0 12px 40px rgba(0,0,0,0.5), 0 0 24px rgba(99,179,237,0.1), inset 0 1px 0 rgba(255,255,255,0.08)',
            }}
          >
            <motion.button
              whileHover={{ scale: 1.06, backgroundColor: 'rgba(232, 184, 75, 0.18)' }}
              whileTap={{ scale: 0.94 }}
              onClick={() => {
                addToDiary({ text: selectedText, source, sourceType, field });
                api.diary
                  .create({
                    popup_type: sourceType,
                    popup_id: sourceId || source,
                    title: source,
                    selected_text: selectedText,
                  })
                  .catch(() => undefined);
                clear();
              }}
              className="flex items-center gap-1.5 rounded-lg px-3 py-2 font-mono text-[11px] uppercase tracking-wider transition-colors"
              style={{
                color: 'hsl(var(--steami-gold))',
                border: '1px solid rgba(232, 184, 75, 0.2)',
                background: 'rgba(232, 184, 75, 0.06)',
              }}
            >
              <BookOpen className="h-3 w-3" />
              Diary
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.06, backgroundColor: 'rgba(111, 168, 255, 0.15)' }}
              whileTap={{ scale: 0.94 }}
              onClick={() => {
                api.feed.fromSelection({ selected_text: selectedText, source_article_id: sourceId || '' }).catch(() => undefined);
                clear();
              }}
              className="flex items-center gap-1.5 rounded-lg px-3 py-2 font-mono text-[11px] uppercase tracking-wider transition-colors"
              style={{
                color: 'hsl(var(--steami-cyan))',
                border: '1px solid rgba(111, 168, 255, 0.15)',
                background: 'rgba(111, 168, 255, 0.05)',
              }}
            >
              <Sparkles className="h-3 w-3" />
              Feed
            </motion.button>
          </div>
          <div
            className="mx-auto h-0 w-0"
            style={{
              borderLeft: '6px solid transparent',
              borderRight: '6px solid transparent',
              ...(pos.above
                ? { borderTop: '6px solid rgba(10,18,42,0.92)', marginTop: '-1px' }
                : { borderBottom: '6px solid rgba(10,18,42,0.92)', marginBottom: '-1px' }),
            }}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );

  return canPortal ? createPortal(popover, document.body) : popover;
}
