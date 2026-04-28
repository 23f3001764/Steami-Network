import { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { SteamiLayout } from '@/components/SteamiLayout';
import { ShareMenu } from '@/components/ShareMenu';
import { ScrollNavigator } from '@/components/ScrollNavigator';
import { CardSvgVisual } from '@/components/CardSvgVisual';
import { CardMedia } from '@/components/CardMedia';
import { explainers, Explainer } from '@/data/explainers';
import { explainerImages } from '@/data/explainer-images';
import { staggerContainer, cardVariants, cardTap, fadeInUp } from '@/lib/motion';
import { ArrowLeft, Search, Layers } from 'lucide-react';
import { useThemeStore } from '@/stores/theme-store';
import { AnimatedSection, AnimatedCard } from '@/components/MotionWrappers';

const allFields = ['ALL', ...Array.from(new Set(explainers.map((e) => e.field)))];

export default function ExplorePage() {
  const navigate = useNavigate();
  const isLight = useThemeStore((s) => s.theme === 'light');
  const [activeField, setActiveField] = useState('ALL');
  const [search, setSearch] = useState('');

  const filtered = explainers.filter((e) => {
    const matchField = activeField === 'ALL' || e.field === activeField;
    const matchSearch =
      !search ||
      e.title.toLowerCase().includes(search.toLowerCase()) ||
      e.subtitle.toLowerCase().includes(search.toLowerCase());
    return matchField && matchSearch;
  });

  const grouped = activeField === 'ALL'
    ? Object.entries(
        filtered.reduce<Record<string, Explainer[]>>((acc, e) => {
          (acc[e.field] ??= []).push(e);
          return acc;
        }, {})
      )
    : [[activeField, filtered] as [string, Explainer[]]];

  return (
    <SteamiLayout>
      <ScrollNavigator />

      {/* Header */}
      <motion.div className="mb-8" variants={fadeInUp} initial="hidden" animate="visible">
        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-1.5 text-[11px] font-mono tracking-wider uppercase text-muted-foreground hover:text-steami-cyan transition-colors mb-4"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Explainers
        </button>
        <h1 className="steami-heading text-3xl md:text-4xl mb-3">
          <Layers className="w-7 h-7 inline-block mr-2 opacity-60" />
          Explore All Intelligence
        </h1>
        <p className="text-[18px] font-medium text-muted-foreground max-w-xl leading-relaxed">
          Browse the full archive of intelligence explainers across every field.
        </p>
      </motion.div>

      {/* Filters */}
      <motion.div
        className="flex flex-col sm:flex-row gap-4 mb-8"
        variants={fadeInUp}
        initial="hidden"
        animate="visible"
      >
        {/* Search */}
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search explainers..."
            className="w-full pl-9 pr-4 py-2.5 rounded-lg text-[14px] font-medium text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-1 focus:ring-steami-cyan/30 transition-shadow"
            style={{
              background: isLight ? 'rgba(255, 255, 255, 0.7)' : 'rgba(10, 18, 42, 0.7)',
              border: isLight ? '1px solid rgba(96, 165, 250, 0.3)' : '1px solid rgba(255,255,255,0.07)',
            }}
          />
        </div>

        {/* Field pills */}
        <div className="flex flex-wrap gap-1.5">
          {allFields.map((f) => (
            <button
              key={f}
              onClick={() => setActiveField(f)}
              className={`px-3 py-1.5 rounded-md text-[16px] font-mono tracking-wider uppercase transition-all duration-200 ${
                activeField === f
                  ? 'text-steami-cyan'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
              style={{
                background:
                  activeField === f
                    ? (isLight ? 'rgba(59, 130, 246, 0.1)' : 'rgba(99, 179, 237, 0.12)')
                    : (isLight ? 'rgba(255, 255, 255, 0.5)' : 'rgba(255,255,255,0.03)'),
                border: `1px solid ${
                  activeField === f
                    ? (isLight ? 'rgba(59, 130, 246, 0.3)' : 'rgba(99, 179, 237, 0.25)')
                    : (isLight ? 'rgba(96, 165, 250, 0.2)' : 'rgba(255,255,255,0.06)')
                }`,
              }}
            >
              {f}
            </button>
          ))}
        </div>
      </motion.div>

      {/* Grouped content */}
      {grouped.map(([field, items]) => (
        <AnimatedSection key={field} className="mb-10">
          <div className="steami-section-label mb-4">
            ◆ {field} <span className="text-muted-foreground/50 ml-1">({items.length})</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {items.map((exp, idx) => (
              <ExploreCard key={exp.id} exp={exp} idx={idx} onClick={() => navigate(`/?open=${exp.id}`)} />
            ))}
          </div>
        </AnimatedSection>
      ))}

      {filtered.length === 0 && (
        <div className="text-center py-20 text-muted-foreground text-sm font-medium">
          No explainers found matching your criteria.
        </div>
      )}
    </SteamiLayout>
  );
}

function ExploreCard({ exp, idx, onClick }: { exp: Explainer; idx: number; onClick: () => void }) {
  const isLight = useThemeStore((s) => s.theme === 'light');
  const heroImg = explainerImages[exp.id];

  return (
    <AnimatedCard
      index={idx}
      className="relative p-0 cursor-pointer overflow-hidden group flex flex-col"
      onClick={onClick}
    >
      {/* Top accent bar */}
      <div
        className="h-[2px] w-full"
        style={{
          background: `linear-gradient(90deg, hsl(var(--steami-${exp.badgeColor})) 0%, transparent 100%)`,
        }}
      />

      {/* Image */}
      <CardMedia src={heroImg} alt={exp.title} badgeColor={exp.badgeColor} height={160}>
        <ShareMenu title={exp.title} compact className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity" />
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
      <div className="p-6 pt-4 flex-1 flex flex-col">
        <div className="flex items-center gap-2 mb-3">
          <span className={`steami-badge steami-badge-${exp.badgeColor} text-[16px] inline-block`}>
            {exp.field}
          </span>
        </div>
        <div className="flex items-start gap-3">
          <div className="flex-1">
            <h3 className="font-serif text-[18px] font-extrabold mb-2 leading-snug text-foreground">
              {exp.title}
            </h3>
            <p className="text-[14px] font-medium text-muted-foreground leading-relaxed line-clamp-3 mb-4">
              {exp.subtitle}
            </p>
          </div>
          <CardSvgVisual field={exp.field} variant="mini" className="hidden sm:flex mt-0.5" />
        </div>

        {/* Footer */}
        <div className="mt-auto flex items-center justify-between pt-3 border-t border-foreground/5">
          <span className="text-[11px] font-mono text-muted-foreground/60 tracking-wider">
            {exp.keyInsights.length} INSIGHTS · {exp.content.length} SLIDES
          </span>
          <span className="text-[11px] font-mono text-steami-cyan tracking-wider uppercase opacity-0 group-hover:opacity-100 transition-opacity">
            Read →
          </span>
        </div>
      </div>
    </AnimatedCard>
  );
}
