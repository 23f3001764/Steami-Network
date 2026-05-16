import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ArrowRight, ChevronLeft, ChevronRight } from 'lucide-react';
import { ReactNode, useRef, useState, useEffect } from 'react';

interface EcosystemRowProps {
  title: string;
  viewAllPath: string;
  children: ReactNode;
  index: number;
}

export const EcosystemRow = ({ title, viewAllPath, children, index }: EcosystemRowProps) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(true);

  const checkScroll = () => {
    if (!scrollRef.current) return;
    const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
    setShowLeftArrow(scrollLeft > 20);
    setShowRightArrow(scrollLeft < scrollWidth - clientWidth - 20);
  };

  const hasResetScroll = useRef(false);

  // Reset scroll position when children are first loaded
  useEffect(() => {
    if (scrollRef.current && children) {
      const hasContent = Array.isArray(children) ? children.length > 0 : !!children;
      if (hasContent && !hasResetScroll.current) {
        scrollRef.current.scrollLeft = 0;
        checkScroll();
        hasResetScroll.current = true;
      }
    }
  }, [children]);

  useEffect(() => {
    const el = scrollRef.current;
    if (el) {
      el.addEventListener('scroll', checkScroll);
      // Also check on resize
      window.addEventListener('resize', checkScroll);
    }
    return () => {
      el?.removeEventListener('scroll', checkScroll);
      window.removeEventListener('resize', checkScroll);
    };
  }, []);

  const scroll = (direction: 'left' | 'right') => {
    if (!scrollRef.current) return;
    const { clientWidth } = scrollRef.current;
    const scrollAmount = direction === 'left' ? -clientWidth * 0.8 : clientWidth * 0.8;
    scrollRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
  };

  return (
    <div className="mb-24 last:mb-0 relative group/row">
      {/* Header */}
      <div className="flex items-center justify-between mb-8 px-2">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ delay: index * 0.1 }}
          className="flex items-center gap-4"
        >
          <div className="w-1 h-6 bg-gradient-to-b from-steami-cyan to-transparent rounded-full" />
          <h3 className="font-mono text-sm tracking-[0.2em] uppercase text-muted-foreground">{title}</h3>
        </motion.div>

        <div className="flex items-center gap-4">
          {/* Slider Controls */}
          <div className="hidden md:flex items-center gap-2 mr-4">
            <button
              onClick={() => scroll('left')}
              disabled={!showLeftArrow}
              className={`p-2 rounded-full border transition-all duration-300 ${showLeftArrow
                ? 'border-steami-cyan/30 text-steami-cyan hover:bg-steami-cyan/10 opacity-100'
                : 'border-muted/10 text-muted/30 opacity-50 cursor-not-allowed'
                }`}
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => scroll('right')}
              disabled={!showRightArrow}
              className={`p-2 rounded-full border transition-all duration-300 ${showRightArrow
                ? 'border-steami-cyan/30 text-steami-cyan hover:bg-steami-cyan/10 opacity-100'
                : 'border-muted/10 text-muted/30 opacity-50 cursor-not-allowed'
                }`}
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ delay: index * 0.1 + 0.2 }}
          >
            <Link to={viewAllPath} className="group relative flex items-center gap-3 px-4 py-2 font-mono text-[10px] tracking-[0.2em] uppercase text-muted-foreground hover:text-steami-cyan transition-all duration-300">
              <span className="relative z-10">View All</span>
              <ArrowRight className="w-3.5 h-3.5 relative z-10 transition-transform duration-300 group-hover:translate-x-1.5" />
              <div className="absolute inset-0 bg-steami-cyan/5 scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-left rounded-md" />
            </Link>
          </motion.div>
        </div>
      </div>

      {/* Slider Track */}
      <div className="relative">
        {/* Left Fader Overlay */}
        <div className={`absolute left-0 top-0 bottom-0 w-12 z-20 pointer-events-none bg-gradient-to-r from-background to-transparent transition-opacity duration-500 ${showLeftArrow ? 'opacity-100' : 'opacity-0'}`} />

        <div
          ref={scrollRef}
          className="flex gap-6 overflow-x-auto scrollbar-hide snap-x snap-mandatory pb-8 px-2"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {children}

          {/* End CTA Card */}
          <div className="snap-end shrink-0 h-full">
            <Link
              to={viewAllPath}
              className="flex flex-col items-center justify-center h-full min-w-[240px] glass-card steami-hover-card group/cta transition-all duration-500 p-8 text-center"
            >
              <div className="w-12 h-12 rounded-full bg-steami-cyan/10 flex items-center justify-center mb-4 group-hover/cta:scale-110 transition-transform duration-500">
                <ArrowRight className="w-6 h-6 text-steami-cyan" />
              </div>
              <h4 className="font-mono text-xs tracking-widest uppercase text-muted-foreground group-hover/cta:text-steami-cyan transition-colors mb-2">Explore All</h4>
              <p className="text-[18px] font-serif font-extrabold text-foreground">{title}</p>

              {/* Subtle Background Glow */}
              <div className="absolute inset-0 bg-steami-cyan/5 opacity-0 group-hover/cta:opacity-100 transition-opacity duration-500" />
            </Link>
          </div>
        </div>

        {/* Right Fader Overlay */}
        <div className={`absolute right-0 top-0 bottom-0 w-12 z-20 pointer-events-none bg-gradient-to-l from-background to-transparent transition-opacity duration-500 ${showRightArrow ? 'opacity-100' : 'opacity-0'}`} />
      </div>
    </div>
  );
};
