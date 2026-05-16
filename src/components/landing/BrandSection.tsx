import { motion, useScroll, useTransform } from 'framer-motion';
import { useRef } from 'react';
import { useThemeStore } from '@/stores/theme-store';
import { TimePressureVisualization } from '../home/time-pressure/TimePressureVisualization';

export const BrandSection = () => {
  const isLight = useThemeStore((s) => s.theme === 'light');
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start end", "end start"]
  });

  const opacity = useTransform(scrollYProgress, [0, 0.5, 1], [0, 1, 0]);
  const scale = useTransform(scrollYProgress, [0, 0.5, 1], [0.8, 1, 0.8]);

  return (
    <section ref={containerRef} className="py-48 flex items-center justify-center relative overflow-hidden">
      {/* 1. Atmospheric Visualization Layer */}
      <TimePressureVisualization isLight={isLight} />

      {/* 2. Deep Background Glow */}
      <div className="absolute inset-0 pointer-events-none z-0">
        <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[70vw] h-[70vw] blur-[180px] rounded-full ${isLight ? 'bg-steami-cyan/15' : 'bg-steami-cyan/5'}`} />
      </div>

      {/* 3. Main Narrative Content */}
      <motion.div
        style={{ opacity, scale }}
        className="container mx-auto px-6 text-center relative z-10"
      >
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="max-w-4xl mx-auto"
        >
          <h2 className={`steami-heading text-4xl md:text-6xl lg:text-8xl mb-12 leading-[1.1] ${isLight ? 'text-zinc-900' : 'text-white'}`}>
            The future moves too fast for <span className="text-steami-cyan">fragmented</span> information.
          </h2>

          <div className="flex flex-col md:flex-row items-center justify-center gap-8 md:gap-16">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="flex flex-col items-center"
            >
              <span className="font-mono text-[10px] uppercase tracking-[0.4em] text-steami-cyan mb-4">The Challenge</span>
              <p className={`text-xl italic font-serif ${isLight ? 'text-zinc-500' : 'text-white/60'}`}>Research Chaos</p>
            </motion.div>

            <div className={`w-12 h-[1px] hidden md:block ${isLight ? 'bg-zinc-300' : 'bg-white/20'}`} />

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="flex flex-col items-center"
            >
              <span className="font-mono text-[10px] uppercase tracking-[0.4em] text-steami-gold mb-4">The Solution</span>
              <p className="text-xl text-steami-gold italic font-serif">Structured Intelligence</p>
            </motion.div>
          </div>

          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className={`mt-20 text-2xl md:text-3xl font-light max-w-2xl mx-auto leading-relaxed ${isLight ? 'text-zinc-600' : 'text-white/80'}`}
          >
            STEAMI transforms scientific complexity into the <span className={`${isLight ? 'text-zinc-900 font-medium' : 'text-white underline decoration-steami-cyan/30 underline-offset-8'}`}>architecture of discovery</span>.
          </motion.p>
        </motion.div>
      </motion.div>
    </section>
  );
};
