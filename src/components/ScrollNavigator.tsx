import { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { ChevronsDown, ChevronsUp } from 'lucide-react';

export function ScrollNavigator() {
  const [stage, setStage] = useState(0);

  const handleClick = useCallback(() => {
    const docHeight = document.documentElement.scrollHeight;
    const viewHeight = window.innerHeight;

    if (stage === 0) {
      window.scrollTo({ top: (docHeight - viewHeight) / 2, behavior: 'smooth' });
      setStage(1);
    } else if (stage === 1) {
      window.scrollTo({ top: docHeight, behavior: 'smooth' });
      setStage(2);
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      setStage(0);
    }
  }, [stage]);

  const isUp = stage === 2;

  return (
    <motion.button
      onClick={handleClick}
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.9 }}
      className="fixed bottom-6 right-6 z-50 w-10 h-10 rounded-full flex items-center justify-center text-muted-foreground hover:text-steami-cyan transition-colors"
      style={{
        background: 'rgba(10, 18, 42, 0.9)',
        border: '1px solid rgba(99, 179, 237, 0.2)',
        backdropFilter: 'blur(8px)',
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3)',
      }}
      title={isUp ? 'Back to top' : stage === 0 ? 'Scroll to middle' : 'Scroll to bottom'}
    >
      {isUp ? <ChevronsUp className="w-4 h-4" /> : <ChevronsDown className="w-4 h-4" />}
    </motion.button>
  );
}
