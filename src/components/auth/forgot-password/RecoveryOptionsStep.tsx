import React from 'react';
import { motion } from 'framer-motion';
import { UserCheck, Key, ArrowRight } from 'lucide-react';

interface RecoveryOptionsStepProps {
  onContinue: () => void;
  onUpdatePassword: () => void;
  isLight: boolean;
}

export function RecoveryOptionsStep({ onContinue, onUpdatePassword, isLight }: RecoveryOptionsStepProps) {
  const cardStyle = {
    background: isLight ? 'rgba(255,255,255,0.6)' : 'rgba(255,255,255,0.03)',
    border: `1px solid ${isLight ? 'rgba(147,197,253,0.3)' : 'rgba(111,168,255,0.1)'}`,
    backdropFilter: 'blur(10px)',
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="forgot-password-scope"
    >
      <div className="text-center mb-8">
        <h2 className="steami-heading text-xl mb-2">Verification complete</h2>
        <p className="text-[13px] text-muted-foreground">
          Choose how you want to continue.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Continue to Account */}
        <motion.button
          whileHover={{ y: -4, borderColor: 'hsl(var(--steami-cyan) / 0.4)' }}
          whileTap={{ scale: 0.98 }}
          onClick={onContinue}
          className="group relative flex flex-col items-center p-6 rounded-2xl transition-all text-center"
          style={cardStyle}
        >
          <div className="w-12 h-12 rounded-xl bg-steami-cyan/10 flex items-center justify-center mb-4 text-steami-cyan transition-transform group-hover:scale-110">
            <UserCheck className="w-6 h-6" />
          </div>
          <h3 className="font-mono text-[11px] uppercase tracking-wider mb-2">Continue to account</h3>
          <p className="text-[11px] text-muted-foreground leading-relaxed">
            Use this verified recovery session to enter your account.
          </p>
          <div className="mt-4 flex items-center gap-1 text-steami-cyan opacity-0 group-hover:opacity-100 transition-opacity">
             <span className="font-mono text-[9px] uppercase">Select</span>
             <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
          </div>
        </motion.button>

        {/* Update Password */}
        <motion.button
          whileHover={{ y: -4, borderColor: 'hsl(var(--steami-cyan) / 0.4)' }}
          whileTap={{ scale: 0.98 }}
          onClick={onUpdatePassword}
          className="group relative flex flex-col items-center p-6 rounded-2xl transition-all text-center"
          style={cardStyle}
        >
          <div className="w-12 h-12 rounded-xl bg-steami-cyan/10 flex items-center justify-center mb-4 text-steami-cyan transition-transform group-hover:scale-110">
            <Key className="w-6 h-6" />
          </div>
          <h3 className="font-mono text-[11px] uppercase tracking-wider mb-2">Update password</h3>
          <p className="text-[11px] text-muted-foreground leading-relaxed">
            Create a new password before returning to login.
          </p>
          <div className="mt-4 flex items-center gap-1 text-steami-cyan opacity-0 group-hover:opacity-100 transition-opacity">
             <span className="font-mono text-[9px] uppercase">Select</span>
             <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
          </div>
        </motion.button>
      </div>
    </motion.div>
  );
}
