import { useState, useCallback, useRef, useEffect } from 'react';

interface UseSteamiHoverOptions {
  tilt?: boolean;
  mouseGlow?: boolean;
}

export const useSteamiHover = (options: UseSteamiHoverOptions = {}) => {
  const { tilt = false, mouseGlow = false } = options;
  const ref = useRef<HTMLDivElement>(null);

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!ref.current) return;

      const rect = ref.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      if (mouseGlow) {
        const xPercent = (x / rect.width) * 100;
        const yPercent = (y / rect.height) * 100;
        ref.current.style.setProperty('--mouse-x', `${xPercent}%`);
        ref.current.style.setProperty('--mouse-y', `${yPercent}%`);
      }

      if (tilt) {
        const centerX = rect.width / 2;
        const centerY = rect.height / 2;
        const rotateX = ((y - centerY) / centerY) * -5; // Max 5 degrees
        const rotateY = ((x - centerX) / centerX) * 5; // Max 5 degrees

        ref.current.style.setProperty('--tilt-x', `${rotateX}deg`);
        ref.current.style.setProperty('--tilt-y', `${rotateY}deg`);
      }
    },
    [tilt, mouseGlow]
  );

  const handleMouseLeave = useCallback(() => {
    if (!ref.current) return;

    if (tilt) {
      ref.current.style.setProperty('--tilt-x', '0deg');
      ref.current.style.setProperty('--tilt-y', '0deg');
    }
  }, [tilt]);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    el.addEventListener('mousemove', handleMouseMove);
    el.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      el.removeEventListener('mousemove', handleMouseMove);
      el.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, [handleMouseMove, handleMouseLeave]);

  return ref;
};
