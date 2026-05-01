/**
 * SubjectRadarChart.tsx
 * ─────────────────────
 * Subject Intelligence radar chart for the STEAMI dashboard.
 *
 * Calls GET /api/dashboard/subject-intelligence and renders a Recharts
 * RadarChart showing the user's engagement score (0–100) per STEAMI subject.
 *
 * Subjects where the user has a saved interest are highlighted with a gold dot.
 * A "top subject" badge is shown beneath the chart.
 *
 * Usage (drop-in replacement for the placeholder in DashboardPage.tsx):
 *   <SubjectRadarChart />
 *
 * The component is self-contained — it owns its own data fetch so the parent
 * page does not need to pass any props.
 */

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  Radar, RadarChart, PolarGrid, PolarAngleAxis,
  PolarRadiusAxis, ResponsiveContainer, Tooltip,
} from 'recharts';
import { BrainCircuit, TrendingUp, Loader2 } from 'lucide-react';
import { useThemeStore } from '@/stores/theme-store';
import { api } from '@/lib/api';

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

interface SubjectScore {
  subject: string;
  opens: number;
  score: number;
  is_interest: boolean;
}

interface SubjectIntelligenceResponse {
  subjects: SubjectScore[];
  total_events_analysed: number;
  top_subject: string | null;
  user_interests: string[];
}

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

/** Shorten long subject names so the radar axis labels stay readable. */
function shortLabel(subject: string): string {
  const MAP: Record<string, string> = {
    'COMPUTER SCIENCE':  'CS',
    'AI + ROBOTICS':     'AI/Robotics',
    'SPACE + ASTRONOMY': 'Space',
    'ENVIRONMENT':       'Env.',
    'MATHEMATICS':       'Math',
    'NEUROSCIENCE':      'Neuro',
    'ENGINEERING':       'Eng.',
    'CHEMISTRY':         'Chem.',
    'MEDICINE':          'Med.',
  };
  return MAP[subject] ?? subject.charAt(0) + subject.slice(1).toLowerCase();
}

// ─────────────────────────────────────────────────────────────────────────────
// Custom Tooltip
// ─────────────────────────────────────────────────────────────────────────────

function SubjectTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null;
  const d: SubjectScore & { fullMark: number; metric: string } = payload[0].payload;
  return (
    <div className="glass-card relative px-3 py-2 overflow-hidden !border-steami-gold/30 min-w-[120px]">
      <p className="font-mono text-[10px] text-muted-foreground uppercase tracking-wider mb-1">
        {d.metric}
      </p>
      <p className="font-mono text-sm font-extrabold text-foreground">{d.score}%</p>
      {d.opens > 0 && (
        <p className="font-mono text-[10px] text-steami-gold mt-0.5">{d.opens} open{d.opens !== 1 ? 's' : ''}</p>
      )}
      {d.is_interest && (
        <p className="font-mono text-[10px] text-steami-cyan mt-0.5">★ Your interest</p>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────────────────────

export function SubjectRadarChart() {
  const { theme } = useThemeStore();
  const isLight   = theme === 'light';

  const [data, setData]       = useState<SubjectIntelligenceResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(false);

  useEffect(() => {
    setLoading(true);
    // Uses the same `api` helper the rest of the dashboard uses.
    // If your api helper doesn't have this method yet, add:
    //   dashboard: { subjectIntelligence: () => apiFetch('/api/dashboard/subject-intelligence') }
    api.dashboard
      .subjectIntelligence()
      .then((res: any) => setData(res as SubjectIntelligenceResponse))
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, []);

  // Map API data → Recharts format
  const chartData = (data?.subjects ?? []).map((s) => ({
    metric:   shortLabel(s.subject),
    value:    s.score,
    fullMark: 100,
    // pass through for tooltip
    subject:     s.subject,
    opens:       s.opens,
    is_interest: s.is_interest,
    score:       s.score,
  }));

  const hasActivity = (data?.total_events_analysed ?? 0) > 0;

  return (
    <div>
      {/* Section label */}
      <div className="steami-section-label mb-3">✦ SUBJECT INTELLIGENCE</div>

      <div className="glass-card relative p-6 overflow-hidden">

        {/* ── Loading ── */}
        {loading && (
          <div className="flex flex-col items-center justify-center h-[280px] gap-3">
            <Loader2 className="w-5 h-5 text-steami-gold animate-spin" />
            <p className="font-mono text-[11px] text-muted-foreground animate-pulse">
              Analysing your subject engagement…
            </p>
          </div>
        )}

        {/* ── Error ── */}
        {!loading && error && (
          <div className="flex flex-col items-center justify-center h-[280px] gap-3">
            <BrainCircuit className="w-8 h-8 text-muted-foreground/40" />
            <p className="font-mono text-[12px] text-muted-foreground">
              Could not load subject data.
            </p>
          </div>
        )}

        {/* ── Chart ── */}
        {!loading && !error && (
          <>
            <motion.div
              initial={{ opacity: 0, scale: 0.85 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.7, ease: 'easeOut' }}
            >
              <ResponsiveContainer width="100%" height={280}>
                <RadarChart cx="50%" cy="50%" outerRadius="70%" data={chartData}>
                  <PolarGrid
                    stroke={isLight ? 'hsl(42 75% 60% / 0.25)' : 'hsl(42 75% 60% / 0.1)'}
                    strokeWidth={0.5}
                  />
                  <PolarAngleAxis
                    dataKey="metric"
                    tick={{
                      fill:       isLight ? 'hsl(35 40% 30%)' : 'hsl(42 30% 55%)',
                      fontSize:   9,
                      fontFamily: 'var(--font-mono)',
                    }}
                  />
                  <PolarRadiusAxis
                    angle={90}
                    domain={[0, 100]}
                    tick={false}
                    axisLine={false}
                  />
                  <Radar
                    name="Subject"
                    dataKey="value"
                    stroke="hsl(42 75% 60%)"
                    strokeWidth={2}
                    fill="hsl(42 75% 60%)"
                    fillOpacity={isLight ? 0.12 : 0.18}
                    dot={{ r: 3, fill: 'hsl(42 75% 60%)', stroke: 'hsl(42 75% 75%)', strokeWidth: 1 }}
                    activeDot={{ r: 5, fill: 'hsl(207 72% 65%)', stroke: 'hsl(207 72% 80%)', strokeWidth: 2 }}
                  />
                  <Tooltip content={<SubjectTooltip />} />
                </RadarChart>
              </ResponsiveContainer>
            </motion.div>

            {/* Footer */}
            <div className="mt-2 pt-3 border-t border-steami-gold/10">
              <motion.div
                className="flex items-center gap-2 text-steami-gold font-mono text-[11px]"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.75 }}
              >
                <TrendingUp className="w-3 h-3 shrink-0" />
                {hasActivity && data?.top_subject
                  ? `Strongest subject: ${shortLabel(data.top_subject)} · ${data.total_events_analysed} events analysed`
                  : 'Open explainers, articles, and insights to build your subject profile.'}
              </motion.div>

              {/* Interest legend dots */}
              {(data?.user_interests?.length ?? 0) > 0 && (
                <motion.div
                  className="flex flex-wrap gap-x-3 gap-y-1 mt-2"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.9 }}
                >
                  <span className="font-mono text-[10px] text-muted-foreground">Your interests:</span>
                  {data!.user_interests.map((interest) => (
                    <span key={interest} className="font-mono text-[10px] text-steami-cyan">
                      ★ {shortLabel(interest)}
                    </span>
                  ))}
                </motion.div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}