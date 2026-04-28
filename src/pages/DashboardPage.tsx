import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { SteamiLayout } from '@/components/SteamiLayout';
import { useSteamiStore } from '@/stores/steami-store';
import { useAuthStore } from '@/stores/auth-store';
import { useThemeStore } from '@/stores/theme-store';
import { Link } from 'react-router-dom';
import { staggerContainer, cardVariants, cardHover, fadeInUp } from '@/lib/motion';
import { Trash2, ExternalLink, BookOpen, Sparkles, BarChart3, Activity, TrendingUp, Zap } from 'lucide-react';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, Tooltip } from 'recharts';
import { explainers } from '@/data/explainers';
import { SubjectRadarChart } from '@/components/SubjectRadarChart';
import { api } from '@/lib/api';
import { RequireLogin } from '@/components/RequireLogin';
export default function DashboardPage() {
  const { diary, recommendations, removeDiaryEntry, clearDiary } = useSteamiStore();
  const { user, isAuthenticated } = useAuthStore();
  const { theme } = useThemeStore();
  const isLight = theme === 'light';
  const [feedFilter, setFeedFilter] = useState<'all' | 'article' | 'news' | 'explainer'>('all');
  const [backendStats, setBackendStats] = useState<Record<string, any> | null>(null);

  useEffect(() => {
    if (isAuthenticated) {
      api.dashboard.me().then(setBackendStats).catch(() => undefined);
    }
  }, [isAuthenticated]);

  if (!isAuthenticated) {
    return (
      <SteamiLayout>
        <RequireLogin message="Please login first to view your dashboard and saved research diary." />
      </SteamiLayout>
    );
  }

  const filteredRecs = feedFilter === 'all'
    ? recommendations
    : recommendations.filter((r) => r.type === feedFilter);

  // Personalized: sort recs by user interests
  const userInterests = user?.interests ?? [];
  const sortedRecs = [...filteredRecs].sort((a, b) => {
    const aMatch = userInterests.includes(a.field) ? -1 : 0;
    const bMatch = userInterests.includes(b.field) ? -1 : 0;
    return aMatch - bMatch;
  });

  // Personalized explainer suggestions
  const personalizedExplainers = userInterests.length > 0
    ? explainers.filter((e) => userInterests.includes(e.field)).slice(0, 4)
    : [];

  const stats = {
    totalNotes: diary.length,
    fields: [...new Set(diary.map((d) => d.field).filter(Boolean))].length,
    articles: diary.filter((d) => d.sourceType === 'article').length,
    explainers: diary.filter((d) => d.sourceType === 'explainer').length,
  };

  return (
    <SteamiLayout>
      {/* Page Header */}
      <motion.div className="mb-8" variants={fadeInUp} initial="hidden" animate="visible">
        <h1 className="steami-heading text-3xl md:text-4xl mb-3">
          {isAuthenticated && user ? `Welcome, ${user.fullName.split(' ')[0]}` : ' Intelligence Dashboard'}
        </h1>
        <p className="text-[18px] font-medium text-muted-foreground max-w-xl leading-relaxed">
          Your personalized research hub. Notes, recommendations, and learning insights — all in one place.
        </p>
      </motion.div>

      {/* Interest prompt */}
      {isAuthenticated && userInterests.length === 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card relative p-5 mb-6 overflow-hidden flex items-center gap-3"
        >
          <Sparkles className="w-5 h-5 text-steami-gold shrink-0" />
          <p className="text-[14px] text-muted-foreground font-medium">
            You haven't selected any interests yet. Update your profile to get personalized recommendations.
          </p>
        </motion.div>
      )}

      {/* Personalized topic cards */}
      {personalizedExplainers.length > 0 && (
        <motion.div className="mb-8" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.15 }}>
          <div className="steami-section-label mb-3"> FOR YOU</div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {personalizedExplainers.map((exp, idx) => (
              <motion.div
                key={exp.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 + idx * 0.06 }}
                whileHover={cardHover}
              >
                <Link to={`/?open=${exp.id}`} className="glass-card relative p-5 overflow-hidden block h-full">
                  <span className={`steami-badge text-[16px] steami-badge-${exp.badgeColor} mb-2 inline-block`}>{exp.field}</span>
                  <h4 className="font-serif text-[18px] font-extrabold text-foreground leading-snug mb-1">{exp.title}</h4>
                  <p className="text-[14px] font-medium text-muted-foreground leading-relaxed line-clamp-2">{exp.subtitle}</p>
                </Link>
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Stats Cards */}
      <motion.div
        className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8"
        variants={staggerContainer}
        initial="hidden"
        animate="visible"
      >
        {[  
          { label: 'SAVED NOTES', value: stats.totalNotes, icon: BookOpen, color: 'steami-gold' },
          { label: 'FIELDS EXPLORED', value: stats.fields, icon: BarChart3, color: 'steami-cyan' },
          { label: 'ARTICLES READ', value: backendStats?.articles_read ?? backendStats?.article_events ?? stats.articles, icon: Activity, color: 'steami-green' },
          { label: 'POPUPS OPENED', value: backendStats?.popup_events ?? backendStats?.events ?? stats.explainers, icon: Zap, color: 'steami-violet' },
        ].map((stat, idx) => (
          <motion.div
            key={stat.label}
            custom={idx}
            variants={cardVariants}
            whileHover={cardHover}
            className="glass-card relative p-6 overflow-hidden text-center"
          >
            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.2 + idx * 0.08, type: 'spring', stiffness: 300, damping: 18 }}>
              <stat.icon className={`w-5 h-5 mx-auto mb-2 text-${stat.color}`} />
            </motion.div>
            <motion.div className="font-mono text-2xl font-extrabold text-foreground mb-1" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 + idx * 0.08 }}>
              {stat.value}
            </motion.div>
            <div className="font-mono text-[11px] tracking-wider uppercase text-muted-foreground">{stat.label}</div>
          </motion.div>
        ))}
      </motion.div>

      {/* Dual Radar Charts */}
      <motion.div
        className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15, duration: 0.5 }}
      >
        {/* Intelligence Profile (hover-based) */}
        <div>
          <div className="steami-section-label mb-3"> INTELLIGENCE PROFILE</div>
          <div className="glass-card relative p-6 overflow-hidden">
            <motion.div initial={{ opacity: 0, scale: 0.5 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.8, ease: 'easeOut' }}>
              <ResponsiveContainer width="100%" height={280}>
                <RadarChart cx="50%" cy="50%" outerRadius="70%" data={[
                  { metric: 'Research Depth', value: Math.min(100, stats.totalNotes * 15), fullMark: 100 },
                  { metric: 'Field Diversity', value: Math.min(100, stats.fields * 20), fullMark: 100 },
                  { metric: 'Engagement', value: Math.min(100, (stats.articles + stats.explainers) * 12), fullMark: 100 },
                  { metric: 'Articles', value: Math.min(100, stats.articles * 25), fullMark: 100 },
                  { metric: 'Explainers', value: Math.min(100, stats.explainers * 25), fullMark: 100 },
                  { metric: 'Consistency', value: Math.min(100, stats.totalNotes * 10), fullMark: 100 },
                ]}>
                  <PolarGrid stroke={isLight ? 'hsl(210 40% 75% / 0.4)' : 'hsl(207 72% 65% / 0.12)'} strokeWidth={0.5} />
                  <PolarAngleAxis dataKey="metric" tick={{ fill: isLight ? 'hsl(210 30% 30%)' : 'hsl(210 25% 55%)', fontSize: 9, fontFamily: 'var(--font-mono)' }} />
                  <PolarRadiusAxis angle={90} domain={[0, 100]} tick={false} axisLine={false} />
                  <Radar name="Profile" dataKey="value" stroke="hsl(207 72% 65%)" strokeWidth={2} fill="hsl(207 72% 65%)" fillOpacity={isLight ? 0.1 : 0.15} dot={{ r: 3, fill: 'hsl(207 72% 65%)', stroke: 'hsl(207 72% 85%)', strokeWidth: 1 }} activeDot={{ r: 5, fill: 'hsl(42 75% 60%)', stroke: 'hsl(42 75% 70%)', strokeWidth: 2 }} />
                  <Tooltip content={({ active, payload }) => {
                    if (!active || !payload?.length) return null;
                    const data = payload[0].payload;
                    return (
                      <div className="glass-card relative px-3 py-2 overflow-hidden !border-steami-cyan/30">
                        <p className="font-mono text-[11px] text-muted-foreground uppercase tracking-wider">{data.metric}</p>
                        <p className="font-mono text-sm font-extrabold text-foreground">{data.value}%</p>
                      </div>
                    );
                  }} />
                </RadarChart>
              </ResponsiveContainer>
            </motion.div>
            <div className="mt-2 pt-3 border-t border-steami-cyan/10">
              <motion.div className="flex items-center gap-2 text-steami-cyan font-mono text-[11px]" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.8 }}>
                <TrendingUp className="w-3 h-3" />
                {stats.totalNotes > 0 ? 'Your research activity is growing. Keep exploring!' : 'Start exploring to build your intelligence profile.'}
              </motion.div>
            </div>
          </div>
        </div>

        {/* Subject Intelligence (always-visible) */}
        <SubjectRadarChart />
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Research Diary */}
        <div className="lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <div className="steami-section-label mb-0"> RESEARCH DIARY</div>
            {diary.length > 0 && (
              <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={clearDiary} className="steami-btn text-[11px] py-1 px-2.5" style={{ borderColor: 'rgba(252, 92, 101, 0.3)', color: 'hsl(var(--steami-red))' }}>
                CLEAR ALL
              </motion.button>
            )}
          </div>

          {diary.length === 0 ? (
            <motion.div initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} className="glass-card relative p-10 text-center overflow-hidden">
              <motion.div className="text-4xl mb-4" animate={{ y: [0, -6, 0] }} transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}></motion.div>
              <p className="font-mono text-sm text-muted-foreground mb-2">No notes saved yet</p>
              <p className="text-[14px] font-medium text-muted-foreground mb-5">Select text in any Explainer or Research Article to save it here.</p>
              <div className="flex gap-2 justify-center">
                <Link to="/" className="steami-btn text-[11px]"><BookOpen className="w-3 h-3" /> EXPLAINERS</Link>
                <Link to="/research" className="steami-btn steami-btn-gold text-[11px]"><ExternalLink className="w-3 h-3" /> RESEARCH</Link>
              </div>
            </motion.div>
          ) : (
            <div className="space-y-2">
              <AnimatePresence>
                {diary.map((entry, idx) => (
                  <motion.div key={entry.id} initial={{ opacity: 0, x: -20, scale: 0.97 }} animate={{ opacity: 1, x: 0, scale: 1 }} exit={{ opacity: 0, x: 20, scale: 0.95, transition: { duration: 0.2 } }} transition={{ delay: idx * 0.04 }} layout className="glass-card relative p-5 overflow-hidden group">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className={`steami-badge text-[16px] ${entry.sourceType === 'article' ? 'steami-badge-cyan' : 'steami-badge-violet'}`}>{entry.sourceType}</span>
                          {entry.field && <span className="steami-badge steami-badge-gold text-[10px]">{entry.field}</span>}
                        </div>
                        <p className="text-[15px] font-medium text-foreground/80 leading-relaxed mb-1">"{entry.text}"</p>
                        <p className="font-mono text-[11px] text-muted-foreground">from: {entry.source}</p>
                      </div>
                      <motion.button whileHover={{ scale: 1.2 }} whileTap={{ scale: 0.85 }} onClick={() => removeDiaryEntry(entry.id)} className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-steami-red">
                        <Trash2 className="w-3.5 h-3.5" />
                      </motion.button>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </div>

        {/* Feed */}
        <motion.div initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2, duration: 0.45 }}>
          <div className="steami-section-label mb-3"> FEED</div>
          <div className="flex gap-1 mb-3">
            {(['all', 'article', 'news', 'explainer'] as const).map((f) => (
              <motion.button key={f} whileHover={{ scale: 1.06 }} whileTap={{ scale: 0.94 }} onClick={() => setFeedFilter(f)}
                className={`font-mono text-[16px] tracking-wider uppercase px-3 py-1.5 rounded-md transition-all ${feedFilter === f ? 'text-steami-gold bg-steami-gold/10 border-steami-gold/30' : 'text-muted-foreground hover:text-foreground bg-transparent'}`}
                style={{ border: `1px solid ${feedFilter === f ? 'rgba(232, 184, 75, 0.3)' : 'rgba(99, 179, 237, 0.1)'}` }}>
                {f}
              </motion.button>
            ))}
          </div>
          <AnimatePresence mode="popLayout">
            <div className="space-y-2">
              {sortedRecs.map((rec, idx) => (
                <motion.div key={rec.id} layout initial={{ opacity: 0, y: 10, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} transition={{ delay: idx * 0.04 }} whileHover={cardHover} className="glass-card relative p-5 overflow-hidden cursor-pointer">
                  <div className="flex items-center gap-2 mb-2">
                    <span className={`steami-badge text-[16px] ${rec.type === 'article' ? 'steami-badge-cyan' : rec.type === 'news' ? 'steami-badge-green' : 'steami-badge-violet'}`}>{rec.type}</span>
                    <span className="steami-badge steami-badge-gold text-[10px]">{rec.field}</span>
                    {userInterests.includes(rec.field) && (
                      <span className="font-mono text-[11px] text-steami-cyan"></span>
                    )}
                  </div>
                  <h4 className="font-serif text-[17px] font-extrabold text-foreground leading-snug mb-1">{rec.title}</h4>
                  <p className="text-[14px] font-medium text-muted-foreground leading-relaxed">{rec.description}</p>
                </motion.div>
              ))}
            </div>
          </AnimatePresence>
        </motion.div>
      </div>
    </SteamiLayout>
  );
}
