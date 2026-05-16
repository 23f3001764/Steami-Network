import React from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2 } from 'lucide-react';

interface RecoverySuccessStepProps {
  onBackToLogin: () => void;
  isLight: boolean;
}

export function RecoverySuccessStep({ onBackToLogin, isLight }: RecoverySuccessStepProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="forgot-password-scope text-center"
    >
      <div className="flex justify-center mb-6">
        <div className="w-20 h-20 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-500">
          <CheckCircle2 className="w-10 h-10" />
        </div>
      </div>

      <h2 className="steami-heading text-xl mb-2">Password updated</h2>
      <p className="text-[14px] text-muted-foreground mb-8">
        Your password has been updated. Please sign in again.
      </p>

      <button
        onClick={onBackToLogin}
        className="w-full py-3 rounded-lg font-mono text-[11px] tracking-[0.12em] uppercase transition-all"
        style={{
          background: isLight
            ? 'linear-gradient(135deg, hsl(210 100% 50%), hsl(210 100% 42%))'
            : 'linear-gradient(135deg, hsl(218 100% 72%), hsl(218 80% 55%))',
          color: '#fff',
          boxShadow: isLight
            ? '0 4px 20px rgba(59,130,246,0.3)'
            : '0 4px 20px rgba(111,168,255,0.2)',
        }}
      >
        Back to login
      </button>
    </motion.div>
  );
}
