import { motion } from 'framer-motion';
import { ArrowUpRight } from 'lucide-react';
import { Link } from 'react-router-dom';

export const SectionHeader = () => {
  return (
    <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-6">
      <div className="max-w-2xl">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="font-mono text-[10px] tracking-[0.4em] text-steami-cyan uppercase mb-4 flex items-center gap-2"
        >
          <span className="w-2 h-2 rounded-full bg-steami-cyan animate-pulse" />
          Intelligence Ecosystem
        </motion.div>
        
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.1 }}
          className="steami-heading text-4xl md:text-5xl lg:text-6xl mb-6 leading-tight"
        >
          Explore Curated <span className="text-transparent bg-clip-text bg-gradient-to-r from-steami-cyan to-steami-gold">Intelligence</span> Streams
        </motion.h2>
        
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.2 }}
          className="text-lg text-muted-foreground leading-relaxed"
        >
          Discover explainers, research articles, and evolving insights shaping science, technology, and innovation through a multi-dimensional knowledge universe.
        </motion.p>
      </div>

      <motion.div
        initial={{ opacity: 0, x: 20 }}
        whileInView={{ opacity: 1, x: 0 }}
        viewport={{ once: true }}
        transition={{ delay: 0.3 }}
        className="flex gap-6"
      >
        <Link to="/explore" className="group relative flex items-center gap-2 font-mono text-[11px] tracking-widest uppercase text-steami-cyan">
          <span>GLOBAL INDEX</span>
          <ArrowUpRight className="w-4 h-4 transition-transform group-hover:translate-x-1 group-hover:-translate-y-1" />
          <span className="absolute left-0 bottom-[-4px] w-0 h-[1px] bg-steami-cyan transition-all duration-300 group-hover:w-full" />
        </Link>
      </motion.div>
    </div>
  );
};
