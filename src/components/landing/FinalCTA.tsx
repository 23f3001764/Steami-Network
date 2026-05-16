import { motion } from 'framer-motion';
import { ArrowRight, Network, Sparkles } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useThemeStore } from '@/stores/theme-store';

export const FinalCTA = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const isLight = useThemeStore((s) => s.theme === 'light');

  return (
    <section className="py-32 relative overflow-hidden">
      {/* Background Energy Fields */}
      <div className="absolute inset-0 z-0">
        <div className={`absolute bottom-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-steami-cyan/40 to-transparent ${isLight ? 'opacity-40' : 'opacity-100'}`} />
        <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[80vw] h-[40vh] blur-[120px] rounded-full rotate-12 ${isLight ? 'bg-steami-cyan/15' : 'bg-steami-cyan/5'}`} />
      </div>

      {/* Star Grid Overlay */}
      <div className={`absolute inset-0 pointer-events-none ${isLight ? 'opacity-[0.08]' : 'opacity-20'}`} style={{ 
        backgroundImage: isLight ? 'radial-gradient(circle, #005CC2 1px, transparent 1px)' : 'radial-gradient(circle, #6FA8FF 1px, transparent 1px)', 
        backgroundSize: '40px 40px' 
      }} />

      <div className="container relative z-10 mx-auto px-6 text-center">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="max-w-3xl mx-auto"
        >
          <motion.div 
            animate={{ rotate: 360 }}
            transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
            className="w-20 h-20 mx-auto mb-12 relative flex items-center justify-center"
          >
            <Sparkles className="w-10 h-10 text-steami-cyan" />
            <div className={`absolute inset-0 border rounded-full ${isLight ? 'border-steami-cyan/30' : 'border-steami-cyan/20'}`} />
            <div className={`absolute inset-2 border rounded-full ${isLight ? 'border-steami-gold/20' : 'border-steami-gold/10'}`} />
          </motion.div>

          <h2 className={`steami-heading text-4xl md:text-6xl mb-8 leading-tight ${isLight ? 'text-zinc-900' : 'text-white'}`}>
            Enter the Intelligence Network
          </h2>
          
          <p className={`text-xl mb-12 leading-relaxed ${isLight ? 'text-zinc-700' : 'text-white/70'}`}>
            Explore the evolving architecture of science, technology, research, and AI-powered intelligence. Join the next generation of scientific discoverers.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
            <motion.button
              whileHover={{ scale: 1.05, boxShadow: isLight ? "0 10px 30px rgba(0, 92, 194, 0.2)" : "0 0 30px rgba(111,168,255,0.4)" }}
              whileTap={{ scale: 0.95 }}
              onClick={() => { if (location.pathname !== '/explore') navigate('/explore'); }}
              className={`steami-btn py-5 px-10 flex items-center gap-3 border-steami-cyan/50 text-steami-cyan text-sm group w-full sm:w-auto font-bold transition-all duration-300 ${isLight ? 'bg-white shadow-md hover:border-steami-cyan' : 'bg-steami-cyan/25 hover:bg-steami-cyan/35'}`}
            >
              START EXPLORING
              <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
            </motion.button>
            
            <motion.button
              whileHover={{ scale: 1.05, backgroundColor: isLight ? "rgba(0,0,0,0.05)" : "rgba(255,255,255,0.1)" }}
              whileTap={{ scale: 0.95 }}
              onClick={() => { if (location.pathname !== '/dashboard') navigate('/dashboard'); }}
              className={`steami-btn py-5 px-10 flex items-center gap-3 text-sm w-full sm:w-auto font-bold transition-all duration-300 ${isLight ? 'bg-zinc-200/80 border-zinc-300 text-zinc-900 shadow-sm' : 'bg-white/5 border-white/20 text-white hover:bg-white/10'}`}
            >
              VIEW KNOWLEDGE MAPS
              <Network className="w-4 h-4" />
            </motion.button>
          </div>
          
          <motion.div 
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
            className={`mt-20 font-mono text-[10px] uppercase tracking-[0.4em] ${isLight ? 'text-zinc-500 font-bold' : 'text-white/40'}`}
          >
            STEAMI NETWORK · 2026 EDITION · ALL SIGNALS VERIFIED
          </motion.div>
        </motion.div>
      </div>

      {/* Decorative Particle Streams */}
      <DataStream direction="left" isLight={isLight} />
      <DataStream direction="right" isLight={isLight} />
    </section>
  );
};

const DataStream = ({ direction, isLight }: { direction: 'left' | 'right', isLight: boolean }) => (
  <motion.div 
    animate={{ 
      x: direction === 'left' ? ["-100%", "200%"] : ["200%", "-100%"],
      opacity: isLight ? [0, 0.3, 0] : [0, 0.5, 0]
    }}
    transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
    className={`absolute ${direction === 'left' ? 'top-1/4' : 'bottom-1/4'} w-96 h-[1px] bg-gradient-to-r from-transparent via-steami-cyan/20 to-transparent pointer-events-none`}
  />
);
