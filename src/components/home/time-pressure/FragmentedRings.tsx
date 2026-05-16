import React from 'react';
import { motion } from 'framer-motion';

interface FragmentedRingsProps {
  isLight: boolean;
}

export const FragmentedRings: React.FC<FragmentedRingsProps> = ({ isLight }) => {
  return (
    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
      <svg width="800" height="800" viewBox="0 0 800 800" className="overflow-visible">
        {/* Ring 1 - Inner fragmented */}
        <motion.path
          d="M 400 150 A 250 250 0 0 1 650 400"
          fill="none"
          stroke={isLight ? "rgba(0,0,0,0.1)" : "rgba(255,255,255,0.05)"}
          strokeWidth="1"
          animate={{ rotate: 360 }}
          transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
          style={{ originX: "400px", originY: "400px" }}
        />
        <motion.path
          d="M 400 650 A 250 250 0 0 1 150 400"
          fill="none"
          stroke={isLight ? "rgba(0,0,0,0.1)" : "rgba(255,255,255,0.05)"}
          strokeWidth="1"
          animate={{ rotate: -360 }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          style={{ originX: "400px", originY: "400px" }}
        />

        {/* Ring 2 - Outer fragments */}
        <motion.path
          d="M 400 80 A 320 320 0 0 1 720 400"
          fill="none"
          stroke="currentColor"
          className={isLight ? "text-steami-cyan/20" : "text-steami-cyan/10"}
          strokeWidth="0.5"
          strokeDasharray="20 40"
          animate={{ rotate: 360 }}
          transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
          style={{ originX: "400px", originY: "400px" }}
        />
        
        {/* Floating Signal Dots */}
        {[0, 60, 120, 180, 240, 300].map((angle, i) => (
          <motion.circle
            key={i}
            cx="400"
            cy="100"
            r="1.5"
            fill={isLight ? "#06b6d4" : "#22d3ee"}
            animate={{ 
              opacity: [0.2, 0.6, 0.2],
              scale: [1, 1.5, 1],
            }}
            transition={{ 
              duration: 3 + i, 
              repeat: Infinity,
              delay: i * 0.5
            }}
            style={{ 
              originX: "400px", 
              originY: "400px",
              transform: `rotate(${angle}deg)`
            }}
          />
        ))}
      </svg>
    </div>
  );
};
