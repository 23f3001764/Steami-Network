import React from 'react';
import { motion } from 'framer-motion';
import { StopwatchField } from './StopwatchField';
import { TemporalSweep } from './TemporalSweep';
import { FragmentedRings } from './FragmentedRings';

interface TimePressureVisualizationProps {
  isLight: boolean;
}

export const TimePressureVisualization: React.FC<TimePressureVisualizationProps> = ({ isLight }) => {
  return (
    <div className="absolute inset-0 pointer-events-none z-0">
      <motion.div
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 1.5 }}
        className="w-full h-full relative flex items-center justify-center"
      >
        <StopwatchField isLight={isLight} />
        <FragmentedRings isLight={isLight} />
        <TemporalSweep isLight={isLight} />
        
        {/* Subtle Depth Particles */}
        <div className="absolute inset-0 overflow-hidden">
          {Array.from({ length: 20 }).map((_, i) => (
            <motion.div
              key={i}
              className={`absolute w-1 h-1 rounded-full ${isLight ? 'bg-steami-cyan/20' : 'bg-steami-cyan/40'}`}
              initial={{ 
                x: Math.random() * 100 + "%", 
                y: Math.random() * 100 + "%",
                scale: Math.random() * 0.5 + 0.5,
                opacity: Math.random() * 0.3
              }}
              animate={{ 
                y: [null, "-100%"],
                opacity: [null, 0]
              }}
              transition={{ 
                duration: Math.random() * 10 + 10, 
                repeat: Infinity,
                ease: "linear",
                delay: Math.random() * 10
              }}
            />
          ))}
        </div>
      </motion.div>
    </div>
  );
};
