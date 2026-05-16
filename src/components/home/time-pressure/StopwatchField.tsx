import React from 'react';
import { motion } from 'framer-motion';

interface StopwatchFieldProps {
  isLight: boolean;
}

export const StopwatchField: React.FC<StopwatchFieldProps> = ({ isLight }) => {
  return (
    <div className="absolute inset-0 flex items-center justify-center pointer-events-none overflow-hidden">
      {/* Outer Glow */}
      <div 
        className={`absolute w-[800px] h-[800px] rounded-full blur-[120px] opacity-20 ${
          isLight ? 'bg-steami-cyan/30' : 'bg-steami-cyan/10'
        }`} 
      />

      {/* Main Stopwatch Frame */}
      <svg width="800" height="800" viewBox="0 0 800 800" className="opacity-20 dark:opacity-10">
        <circle 
          cx="400" 
          cy="400" 
          r="380" 
          fill="none" 
          stroke={isLight ? "#000" : "#fff"} 
          strokeWidth="0.5" 
          strokeDasharray="4 8"
        />
        <circle 
          cx="400" 
          cy="400" 
          r="360" 
          fill="none" 
          stroke={isLight ? "#000" : "#fff"} 
          strokeWidth="1" 
          opacity="0.3"
        />
        
        {/* Tick Marks */}
        {Array.from({ length: 12 }).map((_, i) => (
          <line
            key={i}
            x1="400"
            y1="40"
            x2="400"
            y2="60"
            stroke={isLight ? "#000" : "#fff"}
            strokeWidth="2"
            transform={`rotate(${i * 30}, 400, 400)`}
          />
        ))}
      </svg>
    </div>
  );
};
