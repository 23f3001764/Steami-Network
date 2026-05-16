import { motion } from 'framer-motion';
import { WorkflowGrid } from './WorkflowGrid';
import { useThemeStore } from '@/stores/theme-store';

export const WorkflowSection = () => {
  const isLight = useThemeStore((s) => s.theme === 'light');

  return (
    <section className={`pt-24 pb-16 relative overflow-hidden transition-colors duration-500 ${isLight ? 'bg-zinc-100/30' : 'bg-[#020617]/50'}`}>
      {/* Atmospheric Accents */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className={`absolute top-0 left-1/4 w-[500px] h-[500px] blur-[150px] rounded-full ${isLight ? 'bg-steami-cyan/5' : 'bg-steami-cyan/5'} opacity-50`} />
        <div className={`absolute bottom-0 right-1/4 w-[500px] h-[500px] blur-[150px] rounded-full ${isLight ? 'bg-steami-gold/5' : 'bg-steami-gold/5'} opacity-30`} />
      </div>

      <div className="container relative z-10 mx-auto px-6">
        <div className="flex flex-col items-center text-center mb-16 md:mb-24">
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className={`font-mono text-[10px] tracking-[0.4em] uppercase mb-4 flex items-center gap-3 ${isLight ? 'text-zinc-500' : 'text-steami-cyan'}`}
          >
            <span className={`w-2 h-2 rounded-full animate-pulse ${isLight ? 'bg-zinc-400' : 'bg-steami-cyan'}`} />
            OPERATIONAL WORKFLOW
          </motion.div>
          
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className={`steami-heading text-4xl md:text-5xl lg:text-6xl mb-6 ${isLight ? 'text-zinc-900' : 'text-white'}`}
          >
            How STEAMI <span className={`text-transparent bg-clip-text bg-gradient-to-r ${isLight ? 'from-steami-cyan to-steami-gold' : 'from-steami-cyan via-white to-steami-gold'}`}>Transforms</span> Intelligence
          </motion.h2>
          
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className={`max-w-3xl text-lg md:text-xl leading-relaxed ${isLight ? 'text-zinc-600' : 'text-muted-foreground'}`}
          >
            From signal detection to knowledge synthesis, STEAMI structures scientific and technological intelligence into actionable understanding.
          </motion.p>
        </div>

        <WorkflowGrid />
      </div>
    </section>
  );
};
