import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { SteamiLayout } from '@/components/SteamiLayout';
import { useSteamiStore } from '@/stores/steami-store';
import { useAuthStore } from '@/stores/auth-store';
import { useThemeStore } from '@/stores/theme-store';
import { Link } from 'react-router-dom';
import { fadeInUp, cardHover } from '@/lib/motion';
import {
  Trash2, ExternalLink, BookOpen, Sparkles,
  Clock, User, MapPin, Globe, Briefcase,
  Activity, TrendingUp, Star,
} from 'lucide-react';
import { api } from '@/lib/api';
import { RequireLogin } from '@/components/RequireLogin';

// ── Types ────────────────────────────────────────────────────────────────────

interface MostOpenedItem {
  popup_id: string;
  popup_title: string;
  popup_type: string;
  count: number;
}

interface RecentEvent {
  id: string;
  uid: string;
  popup_type: string;
  popup_id: string;
  popup_title: string;
  opened_at: string;
  date: string;
  hour: number;
}

interface DashboardStats {
  total_events: number;
  by_type: {
    explainer?: number;
    ai_insight?: number;
    research_article?: number;
    simulation?: number;
    [key: string]: number | undefined;
  };
  by_date: Record<string, number>;
  most_opened: MostOpenedItem[];
  recent: RecentEvent[];
}

interface UserProfile {
  uid: string;
  full_name: string;
  username?: string;
  email: string;
  bio?: string;
  location?: string;
  website?: string;
  profession?: string;
  avatar_url?: string;
  interests?: string[];
  role?: string;
  subscribe_email?: boolean;
  created_at?: string;
}

// ── Helpers ──────────────────────────────────────────────────────────────────

const TYPE_LABELS: Record<string, string> = {
  explainer: 'Explainer',
  ai_insight: 'AI Insight',
  research_article: 'Research',
  simulation: 'Simulation',
};

const TYPE_BADGE_CLASS: Record<string, string> = {
  explainer: 'steami-badge-violet',
  ai_insight: 'steami-badge-cyan',
  research_article: 'steami-badge-gold',
  simulation: 'steami-badge-green',
};

function formatRelativeTime(isoString: string): string {
  const diff = Date.now() - new Date(isoString).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const { diary, removeDiaryEntry, clearDiary } = useSteamiStore();
  const { user, isAuthenticated } = useAuthStore();
  const { theme } = useThemeStore();

  const [backendStats, setBackendStats] = useState<DashboardStats | null>(null);
  const [statsLoading, setStatsLoading] = useState(false);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [profileLoading, setProfileLoading] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) return;

    // Fetch dashboard stats
    setStatsLoading(true);
    api.dashboard
      .me()
      .then((data) => setBackendStats(data as DashboardStats))
      .catch(() => undefined)
      .finally(() => setStatsLoading(false));

    // Fetch profile from /api/profile/me
    setProfileLoading(true);
    api.profile
      .me()
      .then((data) => setProfile(data as UserProfile))
      .catch(() => undefined)
      .finally(() => setProfileLoading(false));
  }, [isAuthenticated]);

  if (!isAuthenticated) {
    return (
      <SteamiLayout>
        <RequireLogin message="Please login first to view your dashboard and saved research diary." />
      </SteamiLayout>
    );
  }

  const userInterests = profile?.interests ?? user?.interests ?? [];

  // Activity by date — last 7 days for mini heatmap
  const last7Days: { date: string; label: string; count: number }[] = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    const key = d.toISOString().split('T')[0];
    const label = d.toLocaleDateString('en-US', { weekday: 'short' });
    return { date: key, label, count: backendStats?.by_date?.[key] ?? 0 };
  });

  const maxDayCount = Math.max(...last7Days.map((d) => d.count), 1);

  // By-type breakdown
  const byType = backendStats?.by_type ?? {};
  const typeBreakdown = Object.entries(byType)
    .filter(([, v]) => (v ?? 0) > 0)
    .map(([type, count]) => ({ type, count: count ?? 0 }))
    .sort((a, b) => b.count - a.count);

  return (
    <SteamiLayout>
      {/* Page Header */}
      <motion.div className="mb-8" variants={fadeInUp} initial="hidden" animate="visible">
        <h1 className="steami-heading text-3xl md:text-4xl mb-3">
          {user ? `Welcome back, ${(profile?.full_name ?? user.fullName ?? '').split(' ')[0]}` : 'Intelligence Dashboard'}
        </h1>
        <p className="text-[18px] font-medium text-muted-foreground max-w-xl leading-relaxed">
          Your personalized research hub. Notes, activity, and profile — all in one place.
        </p>
      </motion.div>

      {/* Interest prompt */}
      {userInterests.length === 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card relative p-5 mb-6 overflow-hidden flex items-center gap-3"
        >
          <Sparkles className="w-5 h-5 text-steami-gold shrink-0" />
          <p className="text-[14px] text-muted-foreground font-medium flex-1">
            You haven't selected any interests yet. Set them to get personalized recommendations.
          </p>
          <Link to="/interests" className="steami-btn steami-btn-gold text-[11px] shrink-0">
            SET INTERESTS
          </Link>
        </motion.div>
      )}

      {/* Top grid: Profile card + Stats + Activity heatmap */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">

        {/* Profile Card */}
        <motion.div
          className="glass-card relative p-6 overflow-hidden"
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
        >
          <div className="steami-section-label mb-4">PROFILE</div>
          {profileLoading ? (
            <div className="space-y-3">
              {[80, 60, 70].map((w, i) => (
                <div key={i} className="h-3 bg-muted/40 rounded animate-pulse" style={{ width: `${w}%` }} />
              ))}
            </div>
          ) : profile ? (
            <div className="space-y-3">
              {/* Avatar / name */}
              <div className="flex items-center gap-3">
                {profile.avatar_url ? (
                  <img
                    src={profile.avatar_url}
                    alt="avatar"
                    className="w-10 h-10 rounded-full object-cover border border-border/40"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-steami-cyan/20 flex items-center justify-center">
                    <User className="w-5 h-5 text-steami-cyan" />
                  </div>
                )}
                <div>
                  <p className="font-bold text-[15px] text-foreground leading-tight">{profile.full_name}</p>
                  {profile.username && (
                    <p className="font-mono text-[11px] text-muted-foreground">@{profile.username}</p>
                  )}
                </div>
              </div>

              {/* Bio */}
              {profile.bio && (
                <p className="text-[13px] text-muted-foreground leading-relaxed line-clamp-2">{profile.bio}</p>
              )}

              {/* Meta fields */}
              <div className="space-y-1.5 pt-1">
                {profile.location && (
                  <div className="flex items-center gap-1.5">
                    <MapPin className="w-3 h-3 text-muted-foreground shrink-0" />
                    <span className="text-[12px] text-muted-foreground">{profile.location}</span>
                  </div>
                )}
                {profile.website && (
                  <div className="flex items-center gap-1.5">
                    <Globe className="w-3 h-3 text-muted-foreground shrink-0" />
                    <a
                      href={profile.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[12px] text-steami-cyan hover:underline truncate"
                    >
                      {profile.website.replace(/^https?:\/\//, '')}
                    </a>
                  </div>
                )}
                {profile.profession && (
                  <div className="flex items-center gap-1.5">
                    <Briefcase className="w-3 h-3 text-muted-foreground shrink-0" />
                    <span className="text-[12px] text-muted-foreground capitalize">{profile.profession}</span>
                  </div>
                )}
              </div>

              {/* Interests preview */}
              {userInterests.length > 0 && (
                <div className="flex flex-wrap gap-1 pt-1">
                  {userInterests.slice(0, 4).map((t) => (
                    <span key={t} className="steami-badge steami-badge-gold text-[10px]">{t}</span>
                  ))}
                  {userInterests.length > 4 && (
                    <span className="steami-badge text-[10px]">+{userInterests.length - 4}</span>
                  )}
                </div>
              )}

              <Link to="/profile" className="steami-btn text-[11px] mt-2 inline-flex">
                EDIT PROFILE
              </Link>
            </div>
          ) : (
            <p className="font-mono text-[12px] text-muted-foreground">Could not load profile.</p>
          )}
        </motion.div>

        {/* Stats overview */}
        <motion.div
          className="glass-card relative p-6 overflow-hidden"
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <div className="steami-section-label mb-4">ACTIVITY STATS</div>
          {statsLoading ? (
            <div className="space-y-3">
              {[50, 70, 60, 80].map((w, i) => (
                <div key={i} className="h-3 bg-muted/40 rounded animate-pulse" style={{ width: `${w}%` }} />
              ))}
            </div>
          ) : backendStats ? (
            <div className="space-y-4">
              {/* Total events */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Activity className="w-4 h-4 text-steami-cyan" />
                  <span className="text-[13px] font-medium text-muted-foreground">Total Opens</span>
                </div>
                <span className="font-mono text-[20px] font-bold text-foreground">{backendStats.total_events}</span>
              </div>

              {/* By-type breakdown */}
              {typeBreakdown.length > 0 && (
                <div className="space-y-2">
                  {typeBreakdown.map(({ type, count }) => {
                    const pct = Math.round((count / backendStats.total_events) * 100);
                    return (
                      <div key={type}>
                        <div className="flex items-center justify-between mb-1">
                          <span className={`steami-badge text-[10px] ${TYPE_BADGE_CLASS[type] ?? 'steami-badge-cyan'}`}>
                            {TYPE_LABELS[type] ?? type}
                          </span>
                          <span className="font-mono text-[11px] text-muted-foreground">{count} · {pct}%</span>
                        </div>
                        <div className="h-1 bg-muted/30 rounded-full overflow-hidden">
                          <motion.div
                            className="h-full bg-steami-cyan/60 rounded-full"
                            initial={{ width: 0 }}
                            animate={{ width: `${pct}%` }}
                            transition={{ duration: 0.6, delay: 0.2 }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Diary count */}
              <div className="flex items-center justify-between pt-1 border-t border-border/20">
                <div className="flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-steami-gold" />
                  <span className="text-[13px] font-medium text-muted-foreground">Diary Notes</span>
                </div>
                <span className="font-mono text-[18px] font-bold text-steami-gold">{diary.length}</span>
              </div>
            </div>
          ) : (
            <p className="font-mono text-[12px] text-muted-foreground">No activity yet.</p>
          )}
        </motion.div>

        {/* 7-day activity heatmap */}
        <motion.div
          className="glass-card relative p-6 overflow-hidden"
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
        >
          <div className="flex items-center gap-2 mb-4">
            <div className="steami-section-label mb-0">7-DAY ACTIVITY</div>
            <TrendingUp className="w-3.5 h-3.5 text-steami-gold ml-auto" />
          </div>
          <div className="flex items-end gap-2 h-20">
            {last7Days.map(({ date, label, count }) => (
              <div key={date} className="flex-1 flex flex-col items-center gap-1">
                <motion.div
                  className="w-full rounded-sm bg-steami-cyan/70"
                  initial={{ height: 0 }}
                  animate={{ height: `${Math.max(4, (count / maxDayCount) * 64)}px` }}
                  transition={{ duration: 0.5, delay: 0.1 }}
                  title={`${count} events`}
                />
                <span className="font-mono text-[9px] text-muted-foreground">{label}</span>
              </div>
            ))}
          </div>
          <p className="font-mono text-[10px] text-muted-foreground mt-3">
            {last7Days.reduce((s, d) => s + d.count, 0)} opens this week
          </p>
        </motion.div>
      </div>

      {/* Most Opened + Recent Activity */}
      {backendStats && (
        <motion.div
          className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8"
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          {/* Most Opened */}
          <div>
            <div className="steami-section-label mb-3">MOST OPENED</div>
            <div className="glass-card relative p-5 overflow-hidden">
              {backendStats.most_opened.length === 0 ? (
                <p className="font-mono text-[12px] text-muted-foreground">No activity recorded yet.</p>
              ) : (
                <div className="space-y-3">
                  {backendStats.most_opened.slice(0, 6).map((item, idx) => (
                    <motion.div
                      key={item.popup_id}
                      className="flex items-center gap-3"
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.05 * idx }}
                    >
                      <span className="font-mono text-[11px] text-muted-foreground w-4 text-right shrink-0">
                        {idx + 1}
                      </span>
                      <span className={`steami-badge text-[10px] shrink-0 ${TYPE_BADGE_CLASS[item.popup_type] ?? 'steami-badge-cyan'}`}>
                        {TYPE_LABELS[item.popup_type] ?? item.popup_type}
                      </span>
                      <p className="font-medium text-[13px] text-foreground leading-snug flex-1 line-clamp-1">
                        {item.popup_title}
                      </p>
                      <span className="font-mono text-[11px] text-steami-gold shrink-0">×{item.count}</span>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Recent Activity */}
          <div>
            <div className="steami-section-label mb-3">RECENT ACTIVITY</div>
            <div className="glass-card relative p-5 overflow-hidden">
              {backendStats.recent.length === 0 ? (
                <p className="font-mono text-[12px] text-muted-foreground">No recent activity.</p>
              ) : (
                <div className="space-y-3">
                  {backendStats.recent.slice(0, 6).map((event, idx) => (
                    <motion.div
                      key={event.id}
                      className="flex items-start gap-3"
                      initial={{ opacity: 0, x: 10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.05 * idx }}
                    >
                      <Clock className="w-3 h-3 text-muted-foreground mt-0.5 shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-[13px] text-foreground leading-snug line-clamp-1">
                          {event.popup_title}
                        </p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className={`steami-badge text-[10px] ${TYPE_BADGE_CLASS[event.popup_type] ?? 'steami-badge-cyan'}`}>
                            {TYPE_LABELS[event.popup_type] ?? event.popup_type}
                          </span>
                          <span className="font-mono text-[10px] text-muted-foreground">
                            {formatRelativeTime(event.opened_at)}
                          </span>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </motion.div>
      )}

      {/* Research Diary */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div className="steami-section-label mb-0">RESEARCH DIARY</div>
          {diary.length > 0 && (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={clearDiary}
              className="steami-btn text-[11px] py-1 px-2.5"
              style={{ borderColor: 'rgba(252, 92, 101, 0.3)', color: 'hsl(var(--steami-red))' }}
            >
              CLEAR ALL
            </motion.button>
          )}
        </div>

        {diary.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            className="glass-card relative p-10 text-center overflow-hidden"
          >
            <motion.div
              className="text-4xl mb-4"
              animate={{ y: [0, -6, 0] }}
              transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
            >
              📓
            </motion.div>
            <p className="font-mono text-sm text-muted-foreground mb-2">No notes saved yet</p>
            <p className="text-[14px] font-medium text-muted-foreground mb-5">
              Select text in any Explainer or Research Article to save it here.
            </p>
            <div className="flex gap-2 justify-center">
              <Link to="/" className="steami-btn text-[11px]">
                <BookOpen className="w-3 h-3" /> EXPLAINERS
              </Link>
              <Link to="/research" className="steami-btn steami-btn-gold text-[11px]">
                <ExternalLink className="w-3 h-3" /> RESEARCH
              </Link>
            </div>
          </motion.div>
        ) : (
          <div className="space-y-2">
            <AnimatePresence>
              {diary.map((entry, idx) => (
                <motion.div
                  key={entry.id}
                  initial={{ opacity: 0, x: -20, scale: 0.97 }}
                  animate={{ opacity: 1, x: 0, scale: 1 }}
                  exit={{ opacity: 0, x: 20, scale: 0.95, transition: { duration: 0.2 } }}
                  transition={{ delay: idx * 0.04 }}
                  layout
                  className="glass-card relative p-5 overflow-hidden group"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className={`steami-badge text-[10px] ${entry.sourceType === 'article' ? 'steami-badge-cyan' : 'steami-badge-violet'}`}>
                          {entry.sourceType}
                        </span>
                        {entry.field && (
                          <span className="steami-badge steami-badge-gold text-[10px]">{entry.field}</span>
                        )}
                      </div>
                      <p className="text-[15px] font-medium text-foreground/80 leading-relaxed mb-1">
                        "{entry.text}"
                      </p>
                      <p className="font-mono text-[11px] text-muted-foreground">from: {entry.source}</p>
                    </div>
                    <motion.button
                      whileHover={{ scale: 1.2 }}
                      whileTap={{ scale: 0.85 }}
                      onClick={() => removeDiaryEntry(entry.id)}
                      className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-steami-red"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </motion.button>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* Interests summary — shortcut to InterestsPage */}
      {userInterests.length > 0 && (
        <motion.div
          className="glass-card relative p-6 overflow-hidden"
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <div className="flex items-center justify-between mb-3">
            <div className="steami-section-label mb-0">YOUR INTERESTS</div>
            <Link to="/interests" className="steami-btn text-[11px]">
              <Star className="w-3 h-3" /> MANAGE
            </Link>
          </div>
          <div className="flex flex-wrap gap-2">
            {userInterests.map((topic) => (
              <span key={topic} className="steami-badge steami-badge-gold text-[11px]">{topic}</span>
            ))}
          </div>
        </motion.div>
      )}
    </SteamiLayout>
  );
}