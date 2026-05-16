import { motion, AnimatePresence } from 'framer-motion';
import { Lightbulb, Brain, Bookmark, Terminal, Activity, Archive } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useThemeStore } from '@/stores/theme-store';
import { useSteamiHover } from '@/hooks/use-steami-hover';
import { cn } from '@/lib/utils';

const FeatureCard = ({
  title,
  icon: Icon,
  purpose,
  children,
  index,
  color
}: {
  title: string;
  icon: React.ElementType;
  purpose: string;
  children: React.ReactNode;
  index: number;
  color: string;
}) => {
  const isLight = useThemeStore((s) => s.theme === 'light');
  const hoverRef = useSteamiHover({ tilt: true, mouseGlow: true });
  
  return (
    <motion.div
      initial={{ opacity: 0, x: index % 2 === 0 ? -50 : 50 }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: true }}
      className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center mb-24 last:mb-0"
    >
      <div className={`${index % 2 !== 0 ? 'lg:order-2' : ''}`}>
        <div className="flex items-center gap-3 mb-6">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center border ${isLight ? `bg-${color}/5 border-${color}/20 text-${color}` : `bg-${color}/10 border-${color}/20 text-${color}`}`}>
            <Icon className="w-5 h-5" />
          </div>
          <h3 className={`font-mono text-sm tracking-[0.2em] uppercase ${isLight ? 'text-zinc-500' : 'text-muted-foreground'}`}>{title}</h3>
        </div>

        <h2 className={`steami-heading text-3xl md:text-5xl mb-6 ${isLight ? 'text-zinc-900' : 'text-white'}`}>
          {title === "KEY INSIGHTS" ? "Distilling Complexity" :
            title === "AI INSIGHTS" ? "Synthesizing Patterns" :
              "Preserving Discoveries"}
        </h2>

        <p className={`text-lg mb-8 leading-relaxed ${isLight ? 'text-zinc-700' : 'text-white/70'}`}>
          {purpose}
        </p>

        <div className="flex items-center gap-6">
          <div className="flex flex-col">
            <span className={`font-mono text-[10px] mb-1 uppercase ${isLight ? 'text-zinc-400' : 'text-muted-foreground'}`}>Capabilities</span>
            <span className={`text-sm font-medium ${isLight ? 'text-zinc-800' : 'text-white/80'}`}>Real-time Analysis</span>
          </div>
          <div className={`w-px h-8 ${isLight ? 'bg-zinc-200' : 'bg-white/10'}`} />
          <div className="flex flex-col">
            <span className={`font-mono text-[10px] mb-1 uppercase ${isLight ? 'text-zinc-400' : 'text-muted-foreground'}`}>Tech</span>
            <span className={`text-sm font-medium ${isLight ? 'text-zinc-800' : 'text-white/80'}`}>Neural Engines</span>
          </div>
        </div>
      </div>

      <div 
        ref={hoverRef}
        data-tilt="true"
        data-hover-depth="strong"
        className={cn(
          "relative h-[350px] rounded-2xl glass-card steami-hover-card p-6",
          index % 2 !== 0 ? 'lg:order-1' : '',
          isLight ? 'bg-white/30 border-zinc-200/50 shadow-xl' : ''
        )}
      >
        <div className="steami-mouse-glow" />
        {children}

        {/* Corner Accents */}
        <div className={`absolute top-0 left-0 w-12 h-12 border-t border-l rounded-tl-2xl ${isLight ? `border-${color}/20` : `border-${color}/40`}`} />
        <div className={`absolute bottom-0 right-0 w-12 h-12 border-b border-r rounded-br-2xl ${isLight ? `border-${color}/20` : `border-${color}/40`}`} />
      </div>
    </motion.div>
  );
};

const KeyInsightsUI = () => {
  const isLight = useThemeStore((s) => s.theme === 'light');
  
  return (
    <div className="relative h-full flex flex-col gap-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Terminal className="w-3 h-3 text-steami-gold" />
          <span className="font-mono text-[9px] tracking-tighter text-steami-gold uppercase">Insight Engine v4.2</span>
        </div>
        <div className="flex gap-1">
          <div className="w-1.5 h-1.5 rounded-full bg-steami-gold animate-pulse" />
          <div className="w-1.5 h-1.5 rounded-full bg-steami-gold/40" />
          <div className="w-1.5 h-1.5 rounded-full bg-steami-gold/20" />
        </div>
      </div>

      {[
        "Quantum superposition maintained at room temperature",
        "Graphene production costs reduced by 40%",
        "Neural network efficiency exceeds human baseline"
      ].map((text, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, x: -20 }}
          whileInView={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.5 + i * 0.2 }}
          className={`p-4 rounded-lg border relative group overflow-hidden ${isLight ? 'bg-zinc-50 border-zinc-100' : 'bg-white/5 border-white/5'}`}
        >
          <div className={`font-mono text-[11px] leading-relaxed relative z-10 ${isLight ? 'text-zinc-800' : 'text-white/90'}`}>
            <span className="text-steami-gold mr-2">◆</span>
            {text}
          </div>
          <motion.div
            animate={{ x: ["-100%", "200%"] }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            className={`absolute inset-0 skew-x-12 ${isLight ? 'bg-gradient-to-r from-transparent via-steami-gold/5 to-transparent' : 'bg-gradient-to-r from-transparent via-steami-gold/5 to-transparent'}`}
          />
        </motion.div>
      ))}

      <div className={`mt-auto flex items-center justify-center p-4 border border-dashed rounded-lg ${isLight ? 'border-steami-gold/30 bg-steami-gold/5' : 'border-steami-gold/20'}`}>
        <span className="font-mono text-[9px] text-steami-gold/60 animate-pulse">Scanning Document for Key Signals...</span>
      </div>
    </div>
  );
};

const AIInsightsUI = () => {
  const isLight = useThemeStore((s) => s.theme === 'light');
  const [dots, setDots] = useState<number[]>([]);

  useEffect(() => {
    const interval = setInterval(() => {
      setDots(Array.from({ length: 40 }).map(() => Math.random() * 100));
    }, 200);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="relative h-full flex flex-col justify-center">
      {/* Waveform Visualization */}
      <div className="flex items-end justify-center gap-[2px] h-32 mb-8">
        {dots.map((h, i) => (
          <motion.div
            key={i}
            animate={{ height: h + "%" }}
            className={`w-1 rounded-full ${isLight ? 'bg-gradient-to-t from-steami-cyan/30 to-steami-cyan/80' : 'bg-gradient-to-t from-steami-cyan/20 to-steami-cyan'}`}
          />
        ))}
      </div>

      <div className="text-center">
        <div className="font-mono text-[11px] text-steami-cyan mb-2 flex items-center justify-center gap-2">
          <Activity className="w-3 h-3" /> NEURAL SYNTHESIS ACTIVE
        </div>
        <div className={`p-4 rounded-xl border backdrop-blur-sm ${isLight ? 'bg-steami-cyan/5 border-steami-cyan/30' : 'bg-steami-cyan/10 border-steami-cyan/20'}`}>
          <p className={`text-sm font-mono italic ${isLight ? 'text-zinc-700' : 'text-white/80'}`}>
            "Cross-referencing scientific literature with emerging tech signals... Pattern detected: Fusion energy efficiency plateauing due to magnetic containment instability."
          </p>
        </div>
      </div>

      <motion.div
        animate={{ scale: [1, 1.2, 1], opacity: isLight ? [0.1, 0.2, 0.1] : [0.2, 0.4, 0.2] }}
        transition={{ duration: 4, repeat: Infinity }}
        className={`absolute inset-0 rounded-full blur-[60px] ${isLight ? 'bg-steami-cyan/10' : 'bg-steami-cyan/5'}`}
      />
    </div>
  );
};

const ResearchDiaryUI = () => {
  const isLight = useThemeStore((s) => s.theme === 'light');
  
  return (
    <div className="relative h-full flex flex-col">
      <div className="flex items-center gap-2 mb-6">
        <Archive className="w-4 h-4 text-steami-gold" />
        <span className="font-mono text-[10px] text-steami-gold tracking-widest uppercase">Memory Archive v1.0</span>
      </div>

      <div className="space-y-4 relative">
        <div className={`absolute left-[11px] top-0 bottom-0 w-[1px] ${isLight ? 'bg-zinc-200' : 'bg-white/10'}`} />

        {[
          { date: "MAY 10", title: "Quantum Optics Research", icon: "◆" },
          { date: "MAY 08", title: "CRISPR-Cas9 Ethics Deepdive", icon: "◆" },
          { date: "MAY 05", title: "Solid State Battery Trends", icon: "◆" }
        ].map((item, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.6 + i * 0.1 }}
            className="flex items-center gap-4 pl-8 relative group"
          >
            <div className="absolute left-2 w-2 h-2 rounded-full bg-steami-gold group-hover:scale-150 transition-transform" />
            <div className="flex flex-col">
              <span className={`font-mono text-[9px] ${isLight ? 'text-zinc-400' : 'text-muted-foreground'}`}>{item.date}</span>
              <span className={`text-sm font-medium group-hover:text-steami-gold transition-colors ${isLight ? 'text-zinc-800' : 'text-white/80'}`}>{item.title}</span>
            </div>
            <div className={`ml-auto w-8 h-8 rounded-lg border flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity ${isLight ? 'bg-zinc-50 border-zinc-200' : 'bg-white/5 border-white/5'}`}>
              <Bookmark className="w-3 h-3 text-steami-gold" />
            </div>
          </motion.div>
        ))}
      </div>

      <div className={`mt-auto p-4 border flex items-center justify-center rounded-lg ${isLight ? 'bg-white shadow-sm border-zinc-200/50' : 'glass-card border-steami-gold/10'}`}>
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
          className={`w-8 h-8 border border-t-steami-gold rounded-full ${isLight ? 'border-steami-gold/10' : 'border-steami-gold/20'}`}
        />
        <span className="ml-3 font-mono text-[9px] text-steami-gold tracking-widest">ARCHIVE SYNCED</span>
      </div>
    </div>
  );
};

export const FeatureShowcase = () => {
  const isLight = useThemeStore((s) => s.theme === 'light');
  
  return (
    <section className="py-24 relative overflow-hidden">
      <div className="container mx-auto px-6">
        <div className="flex flex-col items-center text-center mb-24">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="steami-section-label mb-4"
          >
            ◆ CORE CAPABILITIES
          </motion.div>
          <h2 className={`steami-heading text-3xl md:text-5xl mb-6 ${isLight ? 'text-zinc-900' : 'text-white'}`}>
            Think Better. Faster. Deeper.
          </h2>
          <p className={`max-w-2xl text-lg ${isLight ? 'text-zinc-700' : 'text-white/70'}`}>
            STEAMI provides a sophisticated toolset designed to augment human intelligence with advanced scientific analysis.
          </p>
        </div>

        <FeatureCard
          title="KEY INSIGHTS"
          color="steami-gold"
          index={0}
          purpose="Distills complex research and technological developments into fast, understandable, and actionable intelligence."
          icon={Lightbulb}
        >
          <KeyInsightsUI />
        </FeatureCard>

        <FeatureCard
          title="AI INSIGHTS"
          color="steami-cyan"
          index={1}
          purpose="Uses sophisticated neural models to synthesize patterns, identify hidden relationships, and extract cross-domain signals across vast research landscapes."
          icon={Brain}
        >
          <AIInsightsUI />
        </FeatureCard>

        <FeatureCard
          title="RESEARCH DIARY"
          color="steami-gold"
          index={2}
          purpose="Allows users to meticulously track their discoveries, visualize learning evolution, and build a persistent archive of their scientific journeys."
          icon={Bookmark}
        >
          <ResearchDiaryUI />
        </FeatureCard>
      </div>
    </section>
  );
};
