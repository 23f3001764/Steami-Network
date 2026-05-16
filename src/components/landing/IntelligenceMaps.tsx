import { motion } from 'framer-motion';
import { Network, User, Book } from 'lucide-react';
import { useThemeStore } from '@/stores/theme-store';

const MapCard = ({
  title,
  icon: Icon,
  explain,
  color,
  visualType,
  index
}: {
  title: string;
  icon: any;
  explain: string;
  color: string;
  visualType: 'profile' | 'subject' | 'knowledge';
  index: number;
}) => {
  const isLight = useThemeStore((s) => s.theme === 'light');

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      whileInView={{ opacity: 1, scale: 1 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.2 }}
      className="group relative glass-card p-1 overflow-hidden h-full"
    >
      <div className={`relative z-10 rounded-[14px] p-8 h-full flex flex-col ${isLight ? 'bg-white/30 backdrop-blur-md' : 'bg-black/40'}`}>
        {/* Visual Preview Area */}
        <div className={`relative h-64 mb-8 rounded-xl overflow-hidden flex items-center justify-center transition-colors duration-500 border ${isLight ? 'bg-zinc-50/50 border-zinc-200/50 group-hover:border-steami-cyan/40' : 'bg-white/5 border-white/5 group-hover:border-steami-cyan/20'}`}>
          <MapVisual type={visualType} color={color} />
        </div>

        <div className="flex items-center gap-3 mb-4">
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center border ${isLight ? `bg-${color}/5 border-${color}/20 text-${color}` : `bg-${color}/10 border-${color}/20 text-${color}`}`}>
            <Icon className="w-4 h-4" />
          </div>
          <h3 className={`font-serif text-2xl font-bold ${isLight ? 'text-zinc-900' : 'text-white'}`}>{title}</h3>
        </div>

        <p className={`leading-relaxed text-sm mb-8 flex-1 ${isLight ? 'text-zinc-600' : 'text-muted-foreground'}`}>
          {explain}
        </p>

        <motion.button
          whileHover={{ x: 5 }}
          className={`flex items-center gap-2 font-mono text-[10px] uppercase tracking-widest transition-colors ${isLight ? `text-${color}` : `text-${color}`}`}
        >
          View System →
        </motion.button>
      </div>

      {/* Background Accent */}
      <div className={`absolute top-0 right-0 w-32 h-32 blur-[60px] pointer-events-none opacity-40 ${isLight ? `bg-${color}/10` : `bg-${color}/5`}`} />
    </motion.div>
  );
};

const MapVisual = ({ type, color }: { type: string, color: string }) => {
  const isLight = useThemeStore((s) => s.theme === 'light');

  if (type === 'profile') {
    return (
      <div className="relative w-full h-full flex items-center justify-center p-4">
        {/* Animated Nodes for Profile */}
        <div className={`relative w-32 h-32 border rounded-full flex items-center justify-center ${isLight ? 'border-steami-cyan/30' : 'border-steami-cyan/20'}`}>
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
            className="absolute inset-0"
          >
            {[0, 120, 240].map((deg) => (
              <motion.div
                key={deg}
                className={`absolute w-3 h-3 rounded-full ${isLight ? 'bg-steami-cyan/80' : 'bg-steami-cyan shadow-[0_0_10px_rgba(111,168,255,0.8)]'}`}
                style={{
                  top: '50%',
                  left: '50%',
                  transform: `rotate(${deg}deg) translate(64px) rotate(-${deg}deg)`,
                }}
                animate={{ scale: [1, 1.5, 1] }}
                transition={{ duration: 2, repeat: Infinity, delay: deg / 120 }}
              />
            ))}
          </motion.div>
          <div className={`w-12 h-12 rounded-full flex items-center justify-center ${isLight ? 'bg-steami-cyan/10' : 'bg-steami-cyan/20'}`}>
            <User className="w-6 h-6 text-steami-cyan" />
          </div>
        </div>
      </div>
    );
  }

  if (type === 'subject') {
    return (
      <div className="relative w-full h-full p-4 overflow-hidden">
        {/* Subject Intelligence: Morphing Grid/Graph */}
        <svg className={`w-full h-full ${isLight ? 'opacity-30' : 'opacity-40'}`}>
          {Array.from({ length: 6 }).map((_, i) => (
            <motion.line
              key={i}
              x1={Math.random() * 100 + "%"}
              y1={Math.random() * 100 + "%"}
              x2={Math.random() * 100 + "%"}
              y2={Math.random() * 100 + "%"}
              stroke={isLight ? "#8A7020" : "hsl(var(--steami-gold))"}
              strokeWidth="0.5"
              animate={{
                x1: [Math.random() * 100 + "%", Math.random() * 100 + "%"],
                y1: [Math.random() * 100 + "%", Math.random() * 100 + "%"],
              }}
              transition={{ duration: 10 + i, repeat: Infinity, ease: "easeInOut" }}
            />
          ))}
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <motion.div
            animate={{ scale: [1, 1.1, 1], rotate: [0, 5, 0] }}
            transition={{ duration: 6, repeat: Infinity }}
            className={`w-24 h-24 border-2 rounded-xl rotate-45 flex items-center justify-center ${isLight ? 'border-steami-gold/40' : 'border-steami-gold/30'}`}
          >
            <Book className={`w-8 h-8 -rotate-45 ${isLight ? 'text-steami-gold' : 'text-steami-gold'}`} />
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full flex items-center justify-center p-4">
      {/* Knowledge Map: Global Network */}
      <div className="relative w-40 h-40">
        {Array.from({ length: 8 }).map((_, i) => (
          <motion.div
            key={i}
            className={`absolute ${isLight ? 'bg-steami-cyan/30' : 'bg-steami-cyan/40'}`}
            style={{
              height: '1px',
              width: '100px',
              top: '50%',
              left: '50%',
              transformOrigin: 'left center',
              rotate: `${i * 45}deg`,
            }}
            initial={{ scaleX: 0 }}
            whileInView={{ scaleX: 1 }}
            transition={{ delay: 0.5 + i * 0.1, duration: 1 }}
          />
        ))}
        <motion.div
          animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 3, repeat: Infinity }}
          className={`absolute inset-0 border rounded-full ${isLight ? 'border-steami-cyan/15' : 'border-steami-cyan/20'}`}
        />
        <div className="absolute inset-0 flex items-center justify-center">
          <Network className="w-10 h-10 text-steami-cyan" />
        </div>
      </div>
    </div>
  );
};

export const IntelligenceMaps = () => {
  const isLight = useThemeStore((s) => s.theme === 'light');

  return (
    <section className={`py-24 transition-colors duration-500 ${isLight ? 'bg-zinc-100/50' : 'bg-black/20'}`}>
      <div className="container mx-auto px-6">
        <div className="flex flex-col items-center text-center mb-16">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="steami-section-label mb-4"
          >
            ◆ INTELLIGENCE SYSTEMS
          </motion.div>
          <h2 className={`steami-heading text-3xl md:text-5xl mb-6 ${isLight ? 'text-zinc-900' : 'text-white'}`}>
            Visualizing the Architecture of Knowledge
          </h2>
          <p className={`max-w-2xl text-lg ${isLight ? 'text-zinc-700' : 'text-white/70'}`}>
            Our specialized mapping systems transform <span className="text-steami-cyan font-semibold">fragmented</span> data into interconnected, actionable intelligence.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <MapCard
            title="Intelligence Profile"
            icon={User}
            color="steami-cyan"
            visualType="profile"
            index={0}
            explain="Tracks evolving research domains and emerging scientific directions while visualizing your unique interconnected intelligence footprint."
          />
          <MapCard
            title="Subject Intelligence"
            icon={Book}
            color="steami-gold"
            visualType="subject"
            index={1}
            explain="Allows deep exploration of subject relationships, hidden patterns, and connected research ecosystems across disparate scientific silos."
          />
          <MapCard
            title="Knowledge Map"
            icon={Network}
            color="steami-cyan"
            visualType="knowledge"
            index={2}
            explain="Visualizes the architecture of global knowledge through dynamically connected concepts, citations, and multi-layered intelligence structures."
          />
        </div>
      </div>
    </section>
  );
};
