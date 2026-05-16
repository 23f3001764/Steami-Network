import React from 'react';
import { 
  Cpu, 
  Brain, 
  Zap, 
  Network, 
  Search, 
  LineChart, 
  Atom,
  Dna
} from 'lucide-react';
import { TickerTrack } from './TickerTrack';
import { TickerItem } from './TickerItem';
import { motion } from 'framer-motion';

const SIGNALS = [
  { icon: Brain, label: "AI Research Signals", trend: { value: "28%", isUp: true } },
  { icon: Atom, label: "Quantum Intelligence Mapping Active", trend: { value: "Active", isUp: true } },
  { icon: Network, label: "New Scientific Relationship Detected", trend: { value: "Live", isUp: true } },
  { icon: LineChart, label: "Knowledge Graph Expanded", trend: { value: "+1.2k Nodes", isUp: true } },
  { icon: Search, label: "Emerging Tech Clusters Identified", trend: { value: "9 detected", isUp: true } },
  { icon: Zap, label: "STEM Intelligence Stream Updated", trend: { value: "2ms ago", isUp: true } },
  { icon: Dna, label: "Biotech Synthesis Pipeline Online", trend: { value: "Synced", isUp: true } },
  { icon: Cpu, label: "Neural Network Density Increased", trend: { value: "14%", isUp: true } },
];

export const IntelligenceTicker: React.FC = () => {
  return (
    <section className="relative py-12 overflow-hidden">
      {/* Decorative Background Elements */}
      <div className="absolute inset-0 flex items-center justify-center opacity-20 pointer-events-none">
        <div className="w-[800px] h-[1px] bg-gradient-to-r from-transparent via-cyan-500 to-transparent" />
      </div>

      <div className="container mx-auto px-4 mb-6 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-cyan-500 animate-ping" />
          <h3 className="text-[10px] uppercase tracking-[0.3em] font-bold text-cyan-500/70 dark:text-cyan-400/70">
            Live Intelligence Network
          </h3>
        </div>
        <div className="text-[10px] uppercase tracking-[0.2em] font-medium text-slate-500 dark:text-slate-400">
          Signal Synchronicity: Optimal
        </div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.8, ease: "easeOut" }}
      >
        <TickerTrack speed={45}>
          {SIGNALS.map((signal, index) => (
            <TickerItem 
              key={index}
              icon={signal.icon}
              label={signal.label}
              trend={signal.trend}
            />
          ))}
        </TickerTrack>
      </motion.div>

      {/* Atmospheric Glow */}
      <div className="absolute -bottom-10 left-1/2 -translate-x-1/2 w-1/2 h-20 bg-cyan-500/5 blur-[100px] rounded-full pointer-events-none" />
    </section>
  );
};
