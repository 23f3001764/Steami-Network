import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { SteamiLayout } from '@/components/SteamiLayout';
import { useAuthStore } from '@/stores/auth-store';
import { fadeInUp } from '@/lib/motion';
import { Sparkles, Check, Save, RotateCcw } from 'lucide-react';
import { api } from '@/lib/api';
import { RequireLogin } from '@/components/RequireLogin';

// ── Topic catalogue ───────────────────────────────────────────────────────────
// Keep in sync with whatever your backend considers valid topics.

// These must exactly match the backend's valid topic list (case-sensitive).
const ALL_TOPICS: { label: string; emoji: string; group: string }[] = [
  { label: 'PHYSICS',           emoji: '⚛️',  group: 'Science' },
  { label: 'CHEMISTRY',         emoji: '🧪',  group: 'Science' },
  { label: 'BIOLOGY',           emoji: '🧬',  group: 'Science' },
  { label: 'MEDICINE',          emoji: '💊',  group: 'Science' },
  { label: 'EARTH & SPACE',     emoji: '🌌',  group: 'Earth & Space' },
  { label: 'COMPUTER SCIENCE',  emoji: '💻',  group: 'Technology' },
  { label: 'AI + ROBOTICS',     emoji: '🤖',  group: 'Technology' },
  { label: 'ENGINEERING',       emoji: '🔩',  group: 'Technology' },
  { label: 'MATHEMATICS & DATA',emoji: '📊',  group: 'Mathematics' },
  { label: 'CLIMATE & ENERGY',  emoji: '🌍',  group: 'Earth & Space' },
];

const GROUPS = [...new Set(ALL_TOPICS.map((t) => t.group))];

// ── Component ─────────────────────────────────────────────────────────────────

export default function InterestsPage() {
  const { user, isAuthenticated } = useAuthStore();

  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [originalSelected, setOriginalSelected] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeGroup, setActiveGroup] = useState<string>('All');

  // Load existing interests on mount
  useEffect(() => {
    if (!isAuthenticated) return;
    setLoading(true);
    api.auth
      .getInterests()
      .then((data: any) => {
        const topics: string[] = Array.isArray(data?.topics) ? data.topics : Array.isArray(data) ? data : [];
        const s = new Set<string>(topics);
        setSelected(s);
        setOriginalSelected(new Set(s));
      })
      .catch(() => undefined)
      .finally(() => setLoading(false));
  }, [isAuthenticated]);

  if (!isAuthenticated) {
    return (
      <SteamiLayout>
        <RequireLogin message="Please login to manage your interests." />
      </SteamiLayout>
    );
  }

  const toggleTopic = (label: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(label)) next.delete(label);
      else next.add(label);
      return next;
    });
    setSaveSuccess(false);
    setError(null);
  };

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    try {
      await api.auth.saveInterests([...selected]);
      setOriginalSelected(new Set(selected));
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch {
      setError('Failed to save interests. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    setSelected(new Set(originalSelected));
    setSaveSuccess(false);
    setError(null);
  };

  const isDirty = [...selected].sort().join(',') !== [...originalSelected].sort().join(',');

  const displayGroups = ['All', ...GROUPS];
  const visibleTopics =
    activeGroup === 'All' ? ALL_TOPICS : ALL_TOPICS.filter((t) => t.group === activeGroup);

  return (
    <SteamiLayout>
      {/* Header */}
      <motion.div className="mb-8" variants={fadeInUp} initial="hidden" animate="visible">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="steami-heading text-3xl md:text-4xl mb-3 flex items-center gap-2">
              <Sparkles className="w-7 h-7 text-steami-gold" />
              Your Interests
            </h1>
            <p className="text-[17px] font-medium text-muted-foreground max-w-xl leading-relaxed">
              Pick the STEM topics you care about. We'll use these to personalise your feed and recommendations.
            </p>
          </div>

          {/* Save / Reset */}
          <div className="flex items-center gap-2 flex-shrink-0 self-start mt-1">
            {isDirty && (
              <motion.button
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleReset}
                disabled={saving}
                className="steami-btn text-[11px] flex items-center gap-1.5"
              >
                <RotateCcw className="w-3 h-3" />
                RESET
              </motion.button>
            )}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleSave}
              disabled={saving || !isDirty}
              className={`steami-btn steami-btn-gold text-[11px] flex items-center gap-1.5 ${
                !isDirty ? 'opacity-40 cursor-not-allowed' : ''
              }`}
            >
              {saving ? (
                <span className="inline-block w-3 h-3 border border-current border-t-transparent rounded-full animate-spin" />
              ) : saveSuccess ? (
                <Check className="w-3 h-3" />
              ) : (
                <Save className="w-3 h-3" />
              )}
              {saveSuccess ? 'SAVED!' : 'SAVE'}
            </motion.button>
          </div>
        </div>

        {/* Status line */}
        <div className="flex items-center gap-3 mt-4">
          <span className="font-mono text-[12px] text-steami-gold">
            {selected.size} topic{selected.size !== 1 ? 's' : ''} selected
          </span>
          {isDirty && (
            <span className="font-mono text-[11px] text-muted-foreground">· unsaved changes</span>
          )}
          {error && (
            <span className="font-mono text-[11px] text-steami-red">{error}</span>
          )}
        </div>
      </motion.div>

      {/* Group filter tabs */}
      <div className="flex flex-wrap gap-1.5 mb-6">
        {displayGroups.map((g) => (
          <motion.button
            key={g}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setActiveGroup(g)}
            className={`font-mono text-[11px] tracking-wider uppercase px-3 py-1.5 rounded-md transition-all ${
              activeGroup === g
                ? 'text-steami-gold bg-steami-gold/10 border-steami-gold/30'
                : 'text-muted-foreground hover:text-foreground bg-transparent border-border/20'
            }`}
            style={{
              border: `1px solid ${activeGroup === g ? 'rgba(232, 184, 75, 0.3)' : 'rgba(99, 179, 237, 0.1)'}`,
            }}
          >
            {g}
          </motion.button>
        ))}
      </div>

      {/* Topic grid */}
      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {Array.from({ length: 12 }).map((_, i) => (
            <div key={i} className="h-16 bg-muted/30 rounded-lg animate-pulse" />
          ))}
        </div>
      ) : (
        <AnimatePresence mode="popLayout">
          <motion.div
            key={activeGroup}
            className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
          >
            {visibleTopics.map((topic, idx) => {
              const isOn = selected.has(topic.label);
              return (
                <motion.button
                  key={topic.label}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: idx * 0.02 }}
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => toggleTopic(topic.label)}
                  className={`relative glass-card p-4 text-left transition-all overflow-hidden ${
                    isOn ? 'border-steami-gold/50 bg-steami-gold/5' : 'hover:border-border/50'
                  }`}
                >
                  {/* Checkmark */}
                  <AnimatePresence>
                    {isOn && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.5 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.5 }}
                        className="absolute top-2 right-2 w-4 h-4 bg-steami-gold rounded-full flex items-center justify-center"
                      >
                        <Check className="w-2.5 h-2.5 text-black" />
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <span className="text-2xl mb-2 block">{topic.emoji}</span>
                  <p className={`font-medium text-[13px] leading-snug ${isOn ? 'text-steami-gold' : 'text-foreground'}`}>
                    {topic.label}
                  </p>
                  <p className="font-mono text-[10px] text-muted-foreground mt-0.5">{topic.group}</p>
                </motion.button>
              );
            })}
          </motion.div>
        </AnimatePresence>
      )}

      {/* Bottom save bar (sticky on mobile) */}
      <AnimatePresence>
        {isDirty && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50"
          >
            <div className="glass-card px-5 py-3 flex items-center gap-3 shadow-xl">
              <span className="font-mono text-[12px] text-muted-foreground">
                {selected.size} selected · unsaved
              </span>
              <button
                onClick={handleReset}
                disabled={saving}
                className="steami-btn text-[11px] py-1 px-3"
              >
                Reset
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="steami-btn steami-btn-gold text-[11px] py-1 px-3 flex items-center gap-1.5"
              >
                {saving ? (
                  <span className="inline-block w-3 h-3 border border-current border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Save className="w-3 h-3" />
                )}
                Save Changes
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </SteamiLayout>
  );
}