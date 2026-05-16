import { motion } from 'framer-motion';
import { useThemeStore } from '@/stores/theme-store';
import { SystemCard } from './SystemCard';

export const IntelligenceSystems = () => {
  const isLight = useThemeStore((s) => s.theme === 'light');

  const systems = [
    {
      title: "Intelligence Profile",
      explanation: "A dynamic visualization of your unique research footprint, tracking domain evolution and emerging scientific directions.",
      image: "/previews/profile-preview.png",
      color: "steami-cyan" as const
    },
    {
      title: "Subject Intelligence",
      explanation: "Deep exploration of subject relationships and hidden patterns across disparate scientific silos through cluster-based analysis.",
      image: "/previews/subject-preview.png",
      color: "steami-gold" as const
    },
    {
      title: "Knowledge Map",
      explanation: "The global architecture of scientific knowledge, visualized as an interconnected web of multi-layered intelligence structures.",
      image: "/previews/knowledge-preview.png",
      color: "steami-cyan" as const
    }
  ];

  return (
    <section className={`py-32 relative overflow-hidden transition-colors duration-500 ${isLight ? 'bg-zinc-50' : 'bg-[#020817]'}`}>
      {/* Background Ambience */}
      <div className={`absolute top-0 left-1/4 w-[500px] h-[500px] blur-[120px] rounded-full pointer-events-none opacity-[0.15] ${isLight ? 'bg-blue-300' : 'bg-blue-900/20'}`} />
      
      <div className="container mx-auto px-6 relative z-10">
        <div className="flex flex-col items-center text-center mb-20">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className={`steami-section-label mb-6 ${isLight ? 'text-zinc-600' : 'text-white/80'}`}
          >
            ✦ INTELLIGENCE SYSTEMS
          </motion.div>
          
          <h2 className={`steami-heading text-4xl md:text-6xl mb-8 leading-tight ${isLight ? 'text-zinc-900' : 'text-white'}`}>
            Real-Time Knowledge <br /> 
            <span className={isLight ? 'text-steami-cyan' : 'text-steami-cyan'}>Visualization Architecture</span>
          </h2>
          
          <p className={`max-w-3xl text-lg md:text-xl font-medium leading-relaxed ${isLight ? 'text-zinc-700' : 'text-white/70'}`}>
            Experience the actual intelligence engines powering the STEAMI Network. 
            No concepts—only authentic research maps and interconnected data structures.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-10 lg:gap-12">
          {systems.map((system, idx) => (
            <SystemCard
              key={system.title}
              {...system}
              index={idx}
            />
          ))}
        </div>

        {/* Global Network Backdrop (Subtle) */}
        <div className={`absolute inset-0 z-[-1] pointer-events-none ${isLight ? 'opacity-[0.06] text-steami-cyan' : 'opacity-[0.05] text-white'}`}>
          <svg width="100%" height="100%">
            <pattern id="network-bg" x="0" y="0" width="100" height="100" patternUnits="userSpaceOnUse">
              <circle cx="2" cy="2" r="1" fill="currentColor" />
              <path d="M 2 2 L 100 100" stroke="currentColor" strokeWidth="0.2" />
            </pattern>
            <rect width="100%" height="100%" fill="url(#network-bg)" />
          </svg>
        </div>
      </div>
    </section>
  );
};
