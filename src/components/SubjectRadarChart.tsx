import { motion } from 'framer-motion';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer } from 'recharts';
import { useThemeStore } from '@/stores/theme-store';
import { articles } from '@/data/research-articles';
import { explainers } from '@/data/explainers';
import { useMemo } from 'react';

const FIELD_COLORS: Record<string, string> = {
  'PHYSICS': 'hsl(207 72% 65%)',
  'AI': 'hsl(280 60% 65%)',
  'BIOLOGY': 'hsl(142 55% 50%)',
  'CHEMISTRY': 'hsl(42 75% 60%)',
  'MEDICINE': 'hsl(0 65% 60%)',
  'EARTH & SPACE': 'hsl(200 70% 55%)',
  'CLIMATE & ENERGY': 'hsl(160 55% 50%)',
  'MATHEMATICS': 'hsl(260 50% 60%)',
  'COMPUTER SCIENCE': 'hsl(190 65% 55%)',
  'ENGINEERING': 'hsl(25 70% 55%)',
  'ROBOTICS': 'hsl(320 55% 55%)',
};

export function SubjectRadarChart() {
  const { theme } = useThemeStore();
  const isLight = theme === 'light';

  const subjectData = useMemo(() => {
    const fieldCounts: Record<string, number> = {};

    articles.forEach((a) => {
      fieldCounts[a.field] = (fieldCounts[a.field] || 0) + 1;
    });
    explainers.forEach((e) => {
      fieldCounts[e.field] = (fieldCounts[e.field] || 0) + 1;
    });

    const maxCount = Math.max(...Object.values(fieldCounts), 1);

    return Object.entries(fieldCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(([field, count]) => ({
        subject: field.length > 12 ? field.slice(0, 10) + '…' : field,
        fullName: field,
        value: Math.round((count / maxCount) * 100),
        count,
      }));
  }, []);

  return (
    <div>
      <div className="steami-section-label mb-3"> SUBJECT INTELLIGENCE</div>
      <div className="glass-card relative p-6 overflow-hidden">
        <motion.div
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, ease: 'easeOut', delay: 0.15 }}
        >
          <ResponsiveContainer width="100%" height={280}>
            <RadarChart cx="50%" cy="50%" outerRadius="65%" data={subjectData}>
              <PolarGrid
                stroke={isLight ? 'hsl(210 40% 75% / 0.4)' : 'hsl(42 75% 60% / 0.1)'}
                strokeWidth={0.5}
              />
              <PolarAngleAxis
                dataKey="subject"
                tick={{
                  fill: isLight ? 'hsl(210 30% 30%)' : 'hsl(210 25% 65%)',
                  fontSize: 9,
                  fontFamily: 'var(--font-mono)',
                  fontWeight: 600,
                }}
              />
              <PolarRadiusAxis
                angle={90}
                domain={[0, 100]}
                tick={{
                  fill: isLight ? 'hsl(210 20% 50%)' : 'hsl(210 15% 45%)',
                  fontSize: 7,
                  fontFamily: 'var(--font-mono)',
                }}
                tickCount={4}
                axisLine={false}
              />
              <Radar
                name="Content"
                dataKey="value"
                stroke="hsl(42 75% 60%)"
                strokeWidth={2}
                fill="hsl(42 75% 60%)"
                fillOpacity={isLight ? 0.12 : 0.2}
                dot={{
                  r: 4,
                  fill: 'hsl(42 75% 60%)',
                  stroke: 'hsl(42 75% 80%)',
                  strokeWidth: 2,
                }}
              />
            </RadarChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Always-visible legend */}
        <div className="mt-3 pt-3 border-t border-steami-gold/10">
          <div className="grid grid-cols-2 gap-x-4 gap-y-1.5">
            {subjectData.map((item) => (
              <div key={item.fullName} className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5 min-w-0">
                  <div
                    className="w-2 h-2 rounded-full shrink-0"
                    style={{ backgroundColor: FIELD_COLORS[item.fullName] || 'hsl(42 75% 60%)' }}
                  />
                  <span className="font-mono text-[11px] text-muted-foreground truncate">
                    {item.fullName}
                  </span>
                </div>
                <span className="font-mono text-[11px] font-extrabold text-foreground shrink-0">
                  {item.count}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
