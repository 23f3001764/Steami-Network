import React from 'react';
import { motion } from 'framer-motion';

interface TemporalSweepProps {
  isLight: boolean;
}

export const TemporalSweep: React.FC<TemporalSweepProps> = ({ isLight }) => {
  return (
    <motion.div 
      className="absolute inset-0 flex items-center justify-center pointer-events-none"
      animate={{ rotate: 360 }}
      transition={{ 
        duration: 10, 
        repeat: Infinity, 
        ease: "linear" 
      }}
    >
      <div className="w-[800px] h-[800px] relative">
        {/* The Sweep Line */}
        <div 
          className="absolute top-1/2 left-1/2 w-[380px] h-[2px] -translate-y-1/2 origin-left"
          style={{
            background: `linear-gradient(to right, transparent, ${isLight ? 'rgba(6, 182, 212, 0.4)' : 'rgba(6, 182, 212, 0.6)'})`,
            boxShadow: `0 0 20px ${isLight ? 'rgba(6, 182, 212, 0.2)' : 'rgba(6, 182, 212, 0.4)'}`
          }}
        />
        
        {/* Trailing Arc */}
        <svg 
          viewBox="0 0 800 800" 
          className="absolute inset-0 w-full h-full"
        >
          <defs>
            <linearGradient id="sweepGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="transparent" />
              <stop offset="100%" stopColor={isLight ? "rgba(6, 182, 212, 0.1)" : "rgba(6, 182, 212, 0.2)"} />
            </linearGradient>
          </defs>
          <path
            d="M 400 400 L 780 400 A 380 380 0 0 0 668.7 131.3 Z"
            fill="url(#sweepGradient)"
            opacity="0.5"
          />
        </svg>
      </div>
    </motion.div>
  );
};
