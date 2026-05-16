import { motion } from 'framer-motion';
import { ForgotPasswordStep } from './types';

interface RecoverySignalAnimationProps {
  step: ForgotPasswordStep;
}

export function RecoverySignalAnimation({ step }: RecoverySignalAnimationProps) {
  return (
    <div className="relative w-full h-32 flex items-center justify-center mb-6 overflow-hidden">
      <svg width="240" height="120" viewBox="0 0 240 120" fill="none" xmlns="http://www.w3.org/2000/svg" className="forgot-password-scope">
        {/* Step: EMAIL - Signal waves toward envelope */}
        {step === 'email' && (
          <g>
            {/* Target Node (Envelope/Intelligence) */}
            <motion.circle
              cx="180" cy="60" r="12"
              className="fill-steami-cyan/20 stroke-steami-cyan"
              strokeWidth="1.5"
              animate={{ opacity: [0.4, 1, 0.4] }}
              transition={{ duration: 2, repeat: Infinity }}
            />
            <motion.path
              d="M174 56L180 62L186 56"
              className="stroke-steami-cyan"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
            
            {/* Signal Waves */}
            {[0, 1, 2].map((i) => (
              <motion.path
                key={i}
                d={`M${60 + i * 20} 30 Q ${80 + i * 20} 60, ${60 + i * 20} 90`}
                className="stroke-steami-cyan/40"
                strokeWidth="2"
                strokeLinecap="round"
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 60, opacity: [0, 1, 0] }}
                transition={{ duration: 2, repeat: Infinity, delay: i * 0.4 }}
              />
            ))}
          </g>
        )}

        {/* Step: CODE - Six nodes & scan ring */}
        {step === 'code' && (
          <g>
            {/* Central Lock Node */}
            <motion.circle
              cx="120" cy="60" r="20"
              className="fill-steami-cyan/10 stroke-steami-cyan/40"
              strokeWidth="1"
            />
            <motion.path
              d="M115 65V58C115 55.2386 117.239 53 120 53C122.761 53 125 55.2386 125 58V65H115Z"
              className="stroke-steami-cyan"
              strokeWidth="1.5"
              animate={{ y: [0, -2, 0] }}
              transition={{ duration: 1.5, repeat: Infinity }}
            />
            <rect x="114" y="62" width="12" height="10" rx="1" className="fill-steami-cyan/40 stroke-steami-cyan" strokeWidth="1" />

            {/* Scan Ring */}
            <motion.circle
              cx="120" cy="60" r="30"
              className="stroke-steami-cyan/30"
              strokeWidth="1"
              strokeDasharray="4 4"
              animate={{ rotate: 360 }}
              transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
            />

            {/* Six Code Nodes */}
            {[0, 1, 2, 3, 4, 5].map((i) => {
              const angle = (i * 60) * (Math.PI / 180);
              const x = 120 + Math.cos(angle) * 45;
              const y = 60 + Math.sin(angle) * 45;
              return (
                <motion.circle
                  key={i}
                  cx={x} cy={y} r="3"
                  className="fill-steami-cyan"
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: i * 0.2 }}
                />
              );
            })}
          </g>
        )}

        {/* Step: OPTIONS - Branching paths */}
        {step === 'options' && (
          <g>
            {/* Origin Verified Node */}
            <motion.circle
              cx="60" cy="60" r="8"
              className="fill-[hsl(var(--steami-gold))] stroke-[hsl(var(--steami-gold))]"
              strokeWidth="2"
            />
            <motion.path
              d="M57 60L59 62L63 58"
              className="stroke-[hsl(var(--steami-bg))]"
              strokeWidth="1.5"
              strokeLinecap="round"
            />

            {/* Branching Paths */}
            <motion.path
              d="M68 60 H 120 Q 140 60, 140 40 H 180"
              className="stroke-[hsl(var(--steami-gold)/0.4)]"
              strokeWidth="1.5"
              fill="none"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 1 }}
            />
            <motion.path
              d="M68 60 H 120 Q 140 60, 140 80 H 180"
              className="stroke-[hsl(var(--steami-gold)/0.4)]"
              strokeWidth="1.5"
              fill="none"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 1 }}
            />

            {/* Option Nodes */}
            <motion.circle
              cx="185" cy="40" r="6"
              className="fill-[hsl(var(--steami-gold)/0.2)] stroke-[hsl(var(--steami-gold))]"
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
            />
            <motion.circle
              cx="185" cy="80" r="6"
              className="fill-[hsl(var(--steami-gold)/0.2)] stroke-[hsl(var(--steami-gold))]"
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ duration: 2, repeat: Infinity, delay: 1 }}
            />
          </g>
        )}

        {/* Step: UPDATE-PASSWORD - Shield reforming */}
        {step === 'update-password' && (
          <g>
            {/* Shield Construction */}
            <motion.path
              d="M120 40 L140 48 V 65 C 140 75, 120 85, 120 85 C 120 85, 100 75, 100 65 V 48 L 120 40 Z"
              className="fill-steami-cyan/10 stroke-steami-cyan"
              strokeWidth="2"
              initial={{ pathLength: 0, opacity: 0 }}
              animate={{ pathLength: 1, opacity: 1 }}
              transition={{ duration: 1.5 }}
            />
            
            {/* Security Rings */}
            <motion.circle
              cx="120" cy="62" r="35"
              className="stroke-steami-cyan/20"
              strokeWidth="1"
              animate={{ scale: [0.8, 1.1], opacity: [0.6, 0] }}
              transition={{ duration: 2, repeat: Infinity }}
            />
            <motion.circle
              cx="120" cy="62" r="35"
              className="stroke-steami-cyan/20"
              strokeWidth="1"
              animate={{ scale: [0.8, 1.1], opacity: [0.6, 0] }}
              transition={{ duration: 2, repeat: Infinity, delay: 1 }}
            />
          </g>
        )}

        {/* Step: SUCCESS - Stable glowing node */}
        {step === 'success' && (
          <g>
            {/* Central Success Node */}
            <motion.circle
              cx="120" cy="60" r="16"
              className="fill-steami-cyan shadow-[0_0_20px_rgba(34,211,238,0.5)]"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', damping: 10 }}
            />
            <motion.path
              d="M114 60L118 64L126 56"
              className="stroke-white"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ delay: 0.3 }}
            />

            {/* Confirmation Pulses */}
            {[0, 1].map((i) => (
              <motion.circle
                key={i}
                cx="120" cy="60" r="40"
                className="stroke-steami-cyan/40"
                strokeWidth="1"
                initial={{ scale: 0.4, opacity: 0 }}
                animate={{ scale: 1.5, opacity: [0, 1, 0] }}
                transition={{ duration: 3, repeat: Infinity, delay: i * 1.5 }}
              />
            ))}
          </g>
        )}
      </svg>
    </div>
  );
}
