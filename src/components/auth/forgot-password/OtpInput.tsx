import React, { useRef, useEffect } from 'react';
import { motion, useAnimation } from 'framer-motion';

interface OtpInputProps {
  value: string;
  onChange: (value: string) => void;
  error?: boolean;
  success?: boolean;
  disabled?: boolean;
}

export function OtpInput({ value, onChange, error, success, disabled }: OtpInputProps) {
  const inputs = useRef<(HTMLInputElement | null)[]>([]);
  const controls = useAnimation();

  useEffect(() => {
    if (error) {
      controls.start({
        x: [0, -10, 10, -10, 10, 0],
        transition: { duration: 0.4 }
      });
    }
  }, [error, controls]);

  useEffect(() => {
    if (success) {
      controls.start({
        scale: [1, 1.05, 1],
        transition: { duration: 0.4 }
      });
    }
  }, [success, controls]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>, index: number) => {
    const val = e.target.value;
    if (!/^\d*$/.test(val)) return;

    const newValue = value.split('');
    newValue[index] = val.slice(-1);
    const updatedValue = newValue.join('');
    onChange(updatedValue);

    if (val && index < 5) {
      inputs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, index: number) => {
    if (e.key === 'Backspace' && !value[index] && index > 0) {
      inputs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').slice(0, 6);
    if (!/^\d+$/.test(pastedData)) return;
    onChange(pastedData.padEnd(6, ''));
    inputs.current[Math.min(pastedData.length, 5)]?.focus();
  };

  return (
    <motion.div 
      animate={controls}
      className="forgot-password-scope flex justify-center gap-3 py-4"
    >
      {[0, 1, 2, 3, 4, 5].map((i) => (
        <div key={i} className="relative">
          <input
            ref={(el) => (inputs.current[i] = el)}
            type="text"
            inputMode="numeric"
            pattern="\d*"
            maxLength={1}
            value={value[i] || ''}
            onChange={(e) => handleChange(e, i)}
            onKeyDown={(e) => handleKeyDown(e, i)}
            onPaste={handlePaste}
            disabled={disabled}
            className={`w-12 h-14 text-center text-2xl font-bold rounded-xl border-2 transition-all outline-none
              ${value[i] ? 'border-steami-cyan bg-steami-cyan/5 shadow-[0_0_15px_rgba(34,211,238,0.2)]' : 'border-border/40 bg-muted/10'}
              ${error ? 'border-destructive/60' : ''}
              ${success ? 'border-emerald-500/60' : ''}
              focus:border-steami-cyan focus:ring-4 focus:ring-steami-cyan/10
            `}
          />
          {success && (
            <motion.div
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1.5, opacity: 0 }}
              transition={{ duration: 0.6 }}
              className="absolute inset-0 bg-steami-cyan/20 rounded-xl pointer-events-none"
            />
          )}
        </div>
      ))}
    </motion.div>
  );
}
