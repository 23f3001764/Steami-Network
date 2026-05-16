import { motion, useScroll, useTransform } from 'framer-motion';
import { HeroSingularity } from '../home/hero-singularity/HeroSingularity';
import { HeroElementDistortionProvider, useSingularity } from '../home/hero-singularity/HeroElementDistortionProvider';
import { ArrowRight, Network } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { useThemeStore } from '@/stores/theme-store';

// Internal helper: hero elements that subtly react when the singularity emits a wave
const ReactiveElement = ({ children, className, delay = 0, style = {} }: any) => {
  const { waveCount, isEmitting } = useSingularity();

  return (
    <motion.div
      data-singularity-reactive="true"
      className={className}
      style={style}
      // Re-key each wave emission so the animation always fires fresh
      key={`reactive-${waveCount}`}
      animate={isEmitting ? {
        y:     [0, -1.5, 1, 0],
        x:     [0, 1, -0.5, 0],
        skewX: [0, 0.45, -0.2, 0],
        filter: [
          'blur(0px) brightness(1)',
          'blur(0.8px) brightness(1.06)',
          'blur(0.3px) brightness(1.02)',
          'blur(0px) brightness(1)',
        ],
        opacity: [1, 0.94, 0.98, 1],
      } : { y: 0, x: 0, skewX: 0, filter: 'blur(0px) brightness(1)', opacity: 1 }}
      transition={{
        duration: 1.8,
        delay: delay,
        ease: 'easeInOut',
      }}
    >
      {children}
    </motion.div>
  );
};

export const LandingHero = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const isLight = useThemeStore((s) => s.theme === 'light');
  const { scrollY } = useScroll();
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePos({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);
  
  const y1 = useTransform(scrollY, [0, 500], [0, 200]);
  const opacity = useTransform(scrollY, [0, 300], [1, 0]);
  const scale = useTransform(scrollY, [0, 300], [1, 0.95]);

  return (
    <HeroElementDistortionProvider>
      <section className="relative min-h-[90svh] flex items-center pt-20 md:pt-0 overflow-hidden">
      {/* Mouse Follow Glow - Refined for "Scientific Command Center" vibe in light mode */}
      <motion.div
        className="fixed inset-0 z-0 pointer-events-none"
        animate={{
          background: isLight
            ? `radial-gradient(900px circle at ${mousePos.x}px ${mousePos.y}px, rgba(186, 230, 253, 0.22), transparent 50%), 
               radial-gradient(600px circle at ${mousePos.x}px ${mousePos.y}px, rgba(255, 255, 255, 0.5), transparent 40%)`
            : `radial-gradient(800px circle at ${mousePos.x}px ${mousePos.y}px, rgba(111, 168, 255, 0.12), transparent 40%)`,
          opacity: isLight ? 1 : 0.6
        }}
      />

      {/* Background Ambience & Depth System */}
      <div className="absolute inset-0 z-0">
        {/* Layered Atmospheric Gradients */}
        <div className={`absolute top-[5%] left-[10%] w-[50vw] h-[50vw] blur-[140px] rounded-full animate-pulse transition-opacity duration-1000 ${isLight ? 'bg-steami-cyan/20 opacity-80' : 'bg-steami-cyan/10'}`} />
        <div className={`absolute bottom-[5%] right-[10%] w-[40vw] h-[40vw] blur-[140px] rounded-full transition-opacity duration-1000 ${isLight ? 'bg-steami-gold/15 opacity-60' : 'bg-steami-gold/5'}`} />
        
        {/* Scientific Mesh Overlay for Light Mode */}
        {isLight && (
          <>
            <div className="absolute inset-0 bg-[radial-gradient(#005CC2_0.5px,transparent_0.5px)] [background-size:32px_32px] opacity-[0.03]" />
            <div className="absolute inset-0 bg-gradient-to-b from-white/40 via-transparent to-white/60 pointer-events-none" />
          </>
        )}
      </div>

      <div className="container relative z-10 mx-auto px-6 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
        {/* Left Side: Content */}
        <motion.div 
          style={{ y: y1, opacity, scale }}
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="flex flex-col items-start text-left"
        >
          <ReactiveElement delay={0.2}>
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="flex items-center gap-2 mb-6"
            >
              <span className={`w-8 h-[1px] ${isLight ? 'bg-steami-cyan/40 shadow-[0_0_8px_rgba(0,92,194,0.2)]' : 'bg-steami-cyan/50'}`} />
              <span className={`steami-label tracking-[0.3em] ${isLight ? 'text-steami-cyan font-semibold' : 'text-steami-cyan'}`}>Next-Gen Intelligence</span>
            </motion.div>
          </ReactiveElement>

          <ReactiveElement delay={0.4}>
            <h1 className={`steami-heading text-4xl md:text-6xl lg:text-7xl mb-8 leading-[1.1] tracking-tight ${isLight ? 'text-zinc-900 drop-shadow-sm' : 'text-white'}`}>
              Mapping the <span className={`text-transparent bg-clip-text bg-gradient-to-r ${isLight ? 'from-steami-cyan via-steami-cyan to-steami-gold drop-shadow-none' : 'from-steami-cyan via-white to-steami-gold'}`}>Future</span> of Science & Technology
            </h1>
          </ReactiveElement>

          <ReactiveElement delay={0.6}>
            <p className={`text-lg md:text-xl max-w-xl mb-10 leading-relaxed font-medium ${isLight ? 'text-zinc-700' : 'text-white/70'}`}>
              STEAMI transforms research, emerging signals, and scientific discoveries into structured intelligence through interactive explainers, AI synthesis, and knowledge mapping.
            </p>
          </ReactiveElement>

          <div className="flex flex-wrap gap-5">
            <ReactiveElement delay={0.8}>
              <motion.button
                whileHover={{ scale: 1.05, boxShadow: isLight ? "0 20px 40px rgba(0, 92, 194, 0.15), 0 0 10px rgba(0, 92, 194, 0.08)" : "0 0 30px rgba(111,168,255,0.4)" }}
                whileTap={{ scale: 0.95 }}
                onClick={() => { if (location.pathname !== '/explore') navigate('/explore'); }}
                className={`steami-btn py-4 px-8 flex items-center gap-3 group transition-all duration-300 ${isLight ? 'bg-white border-steami-cyan/40 text-steami-cyan shadow-lg hover:border-steami-cyan' : 'bg-steami-cyan/25 border-steami-cyan/50 text-steami-cyan hover:bg-steami-cyan/35'}`}
              >
                EXPLORE INTELLIGENCE
                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
              </motion.button>
            </ReactiveElement>
            
            <ReactiveElement delay={0.9}>
              <motion.button
                whileHover={{ scale: 1.05, backgroundColor: isLight ? "rgba(255,255,255,1)" : "rgba(255,255,255,0.1)" }}
                whileTap={{ scale: 0.95 }}
                onClick={() => { if (location.pathname !== '/dashboard') navigate('/dashboard'); }}
                className={`steami-btn py-4 px-8 flex items-center gap-3 transition-all duration-300 ${isLight ? 'bg-zinc-200/60 text-zinc-900 border-zinc-400/40 shadow-md hover:shadow-lg' : 'bg-white/5 border-white/20 text-white hover:bg-white/10'}`}
              >
                KNOWLEDGE MAPS
                <Network className="w-4 h-4" />
              </motion.button>
            </ReactiveElement>
          </div>
          
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1, duration: 1 }}
            className={`mt-16 flex items-center gap-4 transition-all cursor-default ${isLight ? 'opacity-90' : 'opacity-60 hover:opacity-100'}`}
          >
            <span className={`font-mono text-[10px] uppercase tracking-widest ${isLight ? 'text-zinc-500 font-bold' : 'text-white/60'}`}>Trusted by Pioneers</span>
            <div className={`w-px h-4 ${isLight ? 'bg-zinc-400' : 'bg-white/30'}`} />
            <div className={`flex gap-6 font-serif italic text-sm ${isLight ? 'text-zinc-900' : 'text-white/90'}`}>
              <span className="hover:text-steami-cyan transition-colors">DeepMind</span>
              <span className="hover:text-steami-cyan transition-colors">OpenAI</span>
              <span className="hover:text-steami-cyan transition-colors">CERN</span>
            </div>
          </motion.div>
        </motion.div>

        {/* Right Side: Visual */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, filter: "blur(4px)" }}
          animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
          transition={{ duration: 0.8, ease: "easeOut", delay: 0.1 }}
          className="relative flex items-center justify-center w-full min-h-[400px] lg:min-h-[600px] xl:min-h-[650px]"
          style={{ overflow: 'visible' }}
        >
          <HeroSingularity />
          
          {/* Subtle Floating Labels - Enhanced for light theme with reaction */}
          <ReactiveElement delay={1.2} className="absolute top-[20%] right-0">
            <motion.div 
              animate={{ y: [0, -10, 0] }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
              className={`glass-card p-3 px-4 text-[10px] font-mono tracking-wider text-steami-cyan flex items-center gap-2 ${isLight ? 'shadow-xl border-white/80 bg-white/70 backdrop-blur-md' : ''}`}
            >
              <div className={`w-1.5 h-1.5 bg-steami-cyan rounded-full animate-pulse ${isLight ? 'shadow-[0_0_8px_rgba(0,92,194,0.5)]' : ''}`} />
              LIVE SIGNAL DETECTION
            </motion.div>
          </ReactiveElement>

          <ReactiveElement delay={1.4} className="absolute bottom-[20%] left-0">
            <motion.div 
              animate={{ y: [0, 10, 0] }}
              transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 1 }}
              className={`glass-card p-3 px-4 text-[10px] font-mono tracking-wider text-steami-gold flex items-center gap-2 ${isLight ? 'shadow-xl border-white/80 bg-white/70 backdrop-blur-md' : ''}`}
            >
              <div className={`w-1.5 h-1.5 bg-steami-gold rounded-full animate-pulse ${isLight ? 'shadow-[0_0_8px_rgba(138,112,32,0.5)]' : ''}`} />
              NEURAL MAPPING ACTIVE
            </motion.div>
          </ReactiveElement>
        </motion.div>
      </div>
      
      {/* Scroll Indicator */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 2 }}
        className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2"
      >
        <span className={`font-mono text-[9px] uppercase tracking-[0.3em] ${isLight ? 'text-zinc-600 font-medium' : 'text-muted-foreground'}`}>Scroll to explore</span>
        <motion.div 
          animate={{ y: [0, 8, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
          className={`w-[1px] h-12 bg-gradient-to-b from-steami-cyan to-transparent ${isLight ? 'opacity-70' : ''}`}
        />
      </motion.div>
    </section>
    </HeroElementDistortionProvider>
  );
};
