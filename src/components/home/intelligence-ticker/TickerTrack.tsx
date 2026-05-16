import React from 'react';
import { cn } from '@/lib/utils';

interface TickerTrackProps {
  children: React.ReactNode;
  className?: string;
  speed?: number; // Speed in seconds for one full loop
}

export const TickerTrack: React.FC<TickerTrackProps> = ({ 
  children, 
  className,
  speed = 40 
}) => {
  return (
    <div className={cn("relative flex overflow-hidden group", className)}>
      <div 
        className="flex animate-marquee group-hover:pause-marquee"
        style={{ animationDuration: `${speed}s` }}
      >
        {children}
      </div>
      <div 
        className="flex animate-marquee group-hover:pause-marquee"
        style={{ animationDuration: `${speed}s` }}
        aria-hidden="true"
      >
        {children}
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes marquee {
          0% { transform: translateX(0); }
          100% { transform: translateX(-100%); }
        }
        .animate-marquee {
          animation: marquee linear infinite;
        }
        .pause-marquee {
          animation-play-state: paused;
        }
      `}} />
    </div>
  );
};
