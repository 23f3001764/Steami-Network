import React from 'react';
import { motion } from 'framer-motion';

interface PasswordStrengthMeterProps {
  password: string;
}

export function PasswordStrengthMeter({ password }: PasswordStrengthMeterProps) {
  const getStrength = (pass: string) => {
    let strength = 0;
    if (pass.length >= 8) strength += 1;
    if (/[A-Z]/.test(pass)) strength += 1;
    if (/[0-9]/.test(pass)) strength += 1;
    if (/[^A-Za-z0-9]/.test(pass)) strength += 1;
    return strength;
  };

  const strength = getStrength(password);
  const labels = ['Weak', 'Fair', 'Good', 'Strong'];
  const colors = [
    'bg-destructive',
    'bg-orange-500',
    'bg-yellow-500',
    'bg-steami-cyan'
  ];

  return (
    <div className="forgot-password-scope mt-2">
      <div className="flex justify-between items-center mb-1">
        <span className="font-mono text-[9px] uppercase tracking-wider text-muted-foreground">
          Strength: <span className={strength > 0 ? 'text-foreground' : ''}>{password ? labels[Math.min(strength - 1, 3)] || 'Weak' : 'None'}</span>
        </span>
      </div>
      <div className="h-1 w-full bg-muted/20 rounded-full overflow-hidden flex gap-0.5">
        {[0, 1, 2, 3].map((i) => (
          <motion.div
            key={i}
            className={`h-full flex-1 transition-colors duration-500 ${
              i < strength ? colors[Math.min(strength - 1, 3)] : 'bg-transparent'
            }`}
            initial={false}
            animate={{
              opacity: i < strength ? 1 : 0.3
            }}
          />
        ))}
      </div>
    </div>
  );
}
