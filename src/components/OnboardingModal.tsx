import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, Sparkles } from 'lucide-react';
import { useAuthStore } from '@/stores/auth-store';
import { useThemeStore } from '@/stores/theme-store';
import { useNavigate } from 'react-router-dom';

const TOPICS = [
  { id: 'QUANTUM PHYSICS', label: 'Quantum Physics', desc: 'Superposition, entanglement, qubits', icon: '️' },
  { id: 'BIOLOGY', label: 'Biology', desc: 'CRISPR, genetics, evolution', icon: '' },
  { id: 'AI', label: 'Artificial Intelligence', desc: 'Neural nets, LLMs, machine learning', icon: '' },
  { id: 'EARTH & SPACE', label: 'Earth & Space', desc: 'Cosmology, exoplanets, dark energy', icon: '' },
  { id: 'CLIMATE & ENERGY', label: 'Climate & Energy', desc: 'Fusion, renewables, sustainability', icon: '' },
  { id: 'COMPUTER SCIENCE', label: 'Computer Science', desc: 'Blockchain, cryptography, algorithms', icon: '' },
  { id: 'MEDICINE', label: 'Medicine', desc: 'Neuroscience, immunology, health', icon: '' },
  { id: 'CHEMISTRY', label: 'Chemistry', desc: 'Materials, reactions, nanotechnology', icon: '' },
  { id: 'PHYSICS', label: 'Physics', desc: 'Relativity, particles, thermodynamics', icon: '' },
];

interface OnboardingModalProps {
  open: boolean;
  onClose: () => void;
}

export function OnboardingModal({ open, onClose }: OnboardingModalProps) {
  const [selected, setSelected] = useState<string[]>([]);
  const { setInterests, completeOnboarding, user } = useAuthStore();
  const isLight = useThemeStore((s) => s.theme === 'light');
  const navigate = useNavigate();

  const toggle = (id: string) => {
    setSelected((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]);
  };

  const handleContinue = () => {
    setInterests(selected);
    completeOnboarding();
    onClose();
    navigate('/dashboard');
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[110] flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            className="absolute inset-0"
            style={{
              background: isLight ? 'rgba(224,242,254,0.85)' : 'rgba(2,8,23,0.9)',
              backdropFilter: 'blur(16px)',
            }}
          />

          <motion.div
            className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl"
            style={{
              background: isLight ? 'rgba(255,255,255,0.88)' : 'rgba(8,16,38,0.94)',
              backdropFilter: 'blur(40px) saturate(160%)',
              border: `1px solid ${isLight ? 'rgba(147,197,253,0.4)' : 'rgba(111,168,255,0.15)'}`,
              boxShadow: isLight
                ? '0 32px 100px rgba(147,197,253,0.35)'
                : '0 32px 100px rgba(0,0,0,0.7)',
            }}
            initial={{ scale: 0.9, opacity: 0, y: 30 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 30 }}
            transition={{ duration: 0.35, ease: [0.4, 0, 0.2, 1] }}
          >
            <div className="px-8 pt-8 pb-4 text-center">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
                className="inline-flex items-center justify-center w-14 h-14 rounded-2xl mb-4"
                style={{
                  background: isLight
                    ? 'linear-gradient(135deg, rgba(59,130,246,0.12), rgba(147,197,253,0.2))'
                    : 'linear-gradient(135deg, rgba(111,168,255,0.15), rgba(111,168,255,0.05))',
                  border: `1px solid ${isLight ? 'rgba(59,130,246,0.2)' : 'rgba(111,168,255,0.2)'}`,
                }}
              >
                <Sparkles className="w-6 h-6" style={{ color: 'hsl(var(--steami-cyan))' }} />
              </motion.div>
              <h2 className="steami-heading text-2xl mb-2">Choose Your Interests</h2>
              <p className="text-[18px] text-muted-foreground font-medium max-w-md mx-auto">
                Welcome, <span className="text-foreground font-semibold">{user?.fullName}</span>! Select topics to personalize your feed. Pick at least 3 for best results.
              </p>
            </div>

            <div className="px-8 pb-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {TOPICS.map((topic, i) => {
                const isSelected = selected.includes(topic.id);
                return (
                  <motion.button
                    key={topic.id}
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 + i * 0.04 }}
                    onClick={() => toggle(topic.id)}
                    className="relative text-left p-4 rounded-xl transition-all group"
                    style={{
                      background: isSelected
                        ? (isLight ? 'rgba(59,130,246,0.1)' : 'rgba(111,168,255,0.12)')
                        : (isLight ? 'rgba(255,255,255,0.5)' : 'rgba(10,25,55,0.4)'),
                      border: `1px solid ${isSelected
                        ? (isLight ? 'rgba(59,130,246,0.4)' : 'rgba(111,168,255,0.35)')
                        : (isLight ? 'rgba(147,197,253,0.3)' : 'rgba(111,168,255,0.1)')}`,
                      boxShadow: isSelected
                        ? (isLight ? '0 4px 16px rgba(59,130,246,0.15)' : '0 4px 16px rgba(111,168,255,0.1)')
                        : 'none',
                    }}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <span className="text-xl">{topic.icon}</span>
                      <div
                        className="w-5 h-5 rounded-md flex items-center justify-center transition-all"
                        style={{
                          background: isSelected
                            ? (isLight ? 'hsl(210 100% 50%)' : 'hsl(218 100% 72%)')
                            : (isLight ? 'rgba(255,255,255,0.6)' : 'rgba(255,255,255,0.05)'),
                          border: `1px solid ${isSelected
                            ? 'transparent'
                            : (isLight ? 'rgba(147,197,253,0.4)' : 'rgba(111,168,255,0.15)')}`,
                        }}
                      >
                        {isSelected && <Check className="w-3 h-3 text-white" />}
                      </div>
                    </div>
                    <h3 className="font-mono text-[11px] tracking-wider uppercase text-foreground mb-0.5">{topic.label}</h3>
                    <p className="text-[14px] text-muted-foreground font-medium leading-relaxed">{topic.desc}</p>
                  </motion.button>
                );
              })}
            </div>

            <div className="px-8 pb-8 pt-4 flex items-center justify-between">
              <span className="font-mono text-[11px] text-muted-foreground">
                {selected.length} selected {selected.length < 3 && '· 3+ recommended'}
              </span>
              <div className="flex gap-3">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => { completeOnboarding(); onClose(); navigate('/dashboard'); }}
                  className="font-mono text-[11px] tracking-wider uppercase px-5 py-2.5 rounded-lg text-muted-foreground hover:text-foreground transition-colors"
                >
                  Skip
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={handleContinue}
                  className="font-mono text-[11px] tracking-[0.12em] uppercase px-6 py-2.5 rounded-lg text-white transition-all"
                  style={{
                    background: isLight
                      ? 'linear-gradient(135deg, hsl(210 100% 50%), hsl(210 100% 42%))'
                      : 'linear-gradient(135deg, hsl(218 100% 72%), hsl(218 80% 55%))',
                    boxShadow: isLight
                      ? '0 4px 20px rgba(59,130,246,0.3)'
                      : '0 4px 20px rgba(111,168,255,0.2)',
                    opacity: selected.length === 0 ? 0.5 : 1,
                  }}
                >
                  Continue →
                </motion.button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
