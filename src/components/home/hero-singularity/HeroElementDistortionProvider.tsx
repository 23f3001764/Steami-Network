import React, { createContext, useContext, useEffect, useRef, useState, useCallback } from 'react';

interface SingularityContextType {
  waveCount: number;    // increments each time a wave fires — used as key trigger
  isEmitting: boolean;
}

const SingularityContext = createContext<SingularityContextType>({
  waveCount: 0,
  isEmitting: false,
});

export const useSingularity = () => useContext(SingularityContext);

interface Props {
  children: React.ReactNode;
}

export const HeroElementDistortionProvider: React.FC<Props> = ({ children }) => {
  const [waveCount, setWaveCount] = useState(0);
  const [isEmitting, setIsEmitting] = useState(false);
  const emitTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const emitWave = useCallback(() => {
    setIsEmitting(true);
    setWaveCount(c => c + 1);
    // Mark emission as done after wave travel duration (2.8s)
    emitTimeout.current = setTimeout(() => setIsEmitting(false), 2800);
  }, []);

  useEffect(() => {
    // Reduced-motion check
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (mq.matches) return;

    // First wave fires after 2s
    const first = setTimeout(emitWave, 2000);
    // Subsequent waves every 5s
    intervalRef.current = setInterval(emitWave, 5000);

    return () => {
      clearTimeout(first);
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (emitTimeout.current) clearTimeout(emitTimeout.current);
    };
  }, [emitWave]);

  return (
    <SingularityContext.Provider value={{ waveCount, isEmitting }}>
      <div className="hero-singularity-scope relative w-full h-full">
        {children}
      </div>
    </SingularityContext.Provider>
  );
};
