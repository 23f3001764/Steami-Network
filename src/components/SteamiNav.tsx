import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useSteamiStore } from '@/stores/steami-store';
import { useThemeStore } from '@/stores/theme-store';
import { useAuthStore } from '@/stores/auth-store';
import { useState, useEffect, useCallback } from 'react';
import { Sun, Moon, LogIn, LogOut, ChevronDown, User } from 'lucide-react';
import { AuthModal } from '@/components/AuthModal';
import { OnboardingModal } from '@/components/OnboardingModal';
import { api } from '@/lib/api';

export function SteamiNav() {
  const location = useLocation();
  const diaryCount = useSteamiStore((s) => s.diary.length);
  const { theme, toggleTheme } = useThemeStore();
  const { user, isAuthenticated, logout } = useAuthStore();
  const [subscribed, setSubscribed] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);
  const [onboardOpen, setOnboardOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const isLight = theme === 'light';

  const navLinks = [
    { path: '/', label: 'EXPLAINERS' },
    { path: '/blog', label: 'BLOG' },
    { path: '/research', label: 'RESEARCH' },
    { path: '/simulations', label: 'SIMULATIONS' },
    ...(isAuthenticated ? [{ path: '/dashboard', label: 'DASHBOARD' }] : []),
    ...(isAuthenticated ? [{ path: '/chat', label: 'CHAT' }] : []),
    ...(user?.role === 'mod' || user?.role === 'admin' ? [{ path: '/moderation', label: 'MOD' }] : []),
    ...(user?.role === 'admin' ? [{ path: '/admin', label: 'ADMIN' }] : []),
    ...(user?.role === 'admin' ? [{ path: '/api-console', label: 'API' }] : []),
  ];

  const closeMenu = useCallback(() => setMenuOpen(false), []);

  useEffect(() => { closeMenu(); setUserMenuOpen(false); }, [location.pathname, closeMenu]);

  useEffect(() => {
    document.body.style.overflow = menuOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [menuOpen]);

  useEffect(() => {
    if (!menuOpen) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') closeMenu(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [menuOpen, closeMenu]);

  // Fetch avatar for the nav avatar bubble
  useEffect(() => {
    if (!isAuthenticated) { setAvatarUrl(null); return; }
    api.profile.me()
      .then((data: any) => setAvatarUrl(data?.user?.avatar_url ?? data?.avatar_url ?? null))
      .catch(() => setAvatarUrl(null));
  }, [isAuthenticated]);

  const handleAuthSuccess = () => {
    setAuthOpen(false);
    const u = useAuthStore.getState().user;
    if (u && !u.onboarded) {
      setTimeout(() => setOnboardOpen(true), 300);
    }
  };

  const getInitials = (name: string) => name.split(' ').map((w) => w[0]).join('').toUpperCase().slice(0, 2);

  const btnStyle = {
    border: `1px solid ${isLight ? 'rgba(147,197,253,0.4)' : 'rgba(99,179,237,0.18)'}`,
    background: isLight ? 'rgba(255,255,255,0.6)' : 'rgba(10,25,55,0.4)',
    backdropFilter: 'blur(8px)',
  };

  const menuItemStyle = {
    borderColor: isLight ? 'rgba(147,197,253,0.2)' : 'rgba(111,168,255,0.1)',
  };

  const toggleNewsletter = async () => {
    const next = !subscribed;
    const email = user?.email || window.prompt('Email for the STEAMI newsletter') || '';
    if (!email) return;
    setSubscribed(next);
    try {
      if (isAuthenticated) await api.auth.subscribe(next);
      else if (next) await api.newsletter.subscribe(email, user?.fullName || '');
      else await api.newsletter.unsubscribe(email);
    } catch {
      setSubscribed(!next);
    }
  };

  return (
    <>
      <motion.nav
        initial={{ y: -48, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5, ease: [0.25, 0.1, 0.25, 1] }}
        className="fixed top-0 left-0 right-0 h-16 z-50 flex items-center px-6 md:px-8 gap-8 transition-all duration-300"
        style={{
          background: isLight ? 'rgba(255, 255, 255, 0.72)' : 'rgba(3, 8, 20, 0.75)',
          backdropFilter: 'blur(20px) saturate(180%)',
          borderBottom: isLight ? '1px solid rgba(147, 197, 253, 0.3)' : '1px solid rgba(255, 255, 255, 0.06)',
          boxShadow: isLight ? '0 1px 24px rgba(147, 197, 253, 0.15)' : '0 1px 32px rgba(0,0,0,0.4)',
        }}
      >
        <Link to="/" className="font-mono text-[20px] font-bold tracking-wider group">
          <motion.span
            className="text-steami-gold inline-block drop-shadow-sm group-hover:drop-shadow-[0_0_8px_rgba(232,184,75,0.4)] transition-all duration-200"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            transition={{ duration: 0.15 }}
          >
            STEAMI
          </motion.span>
        </Link>

        {/* Desktop nav links */}
        <div className="hidden md:flex gap-8 ml-4">
          {navLinks.map((link, i) => {
            const isActive = location.pathname === link.path;
            return (
              <motion.div
                key={link.path}
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 + i * 0.06, duration: 0.35 }}
                className="relative flex items-center h-full py-1"
              >
                <Link
                  to={link.path}
                  className={`group relative font-mono text-[16px] tracking-[0.12em] uppercase transition-colors duration-200 ease-in-out ${
                    isActive ? 'text-steami-cyan' : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <span>{link.label}</span>
                  <span
                    className={`absolute left-0 -bottom-1 h-[2px] bg-gradient-to-r from-steami-cyan to-steami-magenta transition-all duration-300 ease-out ${
                      isActive ? 'w-full' : 'w-0 group-hover:w-full'
                    }`}
                  />
                </Link>
              </motion.div>
            );
          })}
        </div>

        <div className="ml-auto flex items-center gap-4">
          {/* Theme toggle */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={toggleTheme}
            className="w-9 h-9 rounded-lg flex items-center justify-center transition-all duration-200 hover:shadow-[0_0_15px_rgba(0,255,255,0.15)]"
            style={btnStyle}
            aria-label="Toggle theme"
          >
            <AnimatePresence mode="wait">
              <motion.div
                key={theme}
                initial={{ rotate: -90, opacity: 0 }}
                animate={{ rotate: 0, opacity: 1 }}
                exit={{ rotate: 90, opacity: 0 }}
                transition={{ duration: 0.2 }}
              >
                {isLight
                  ? <Moon className="w-3.5 h-3.5 text-muted-foreground" />
                  : <Sun className="w-3.5 h-3.5 text-steami-gold" />
                }
              </motion.div>
            </AnimatePresence>
          </motion.button>

          {diaryCount > 0 && (
            <motion.div
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: 'spring', stiffness: 300, damping: 20 }}
              className="hidden md:block"
            >
              <Link to="/dashboard" className="font-mono text-[10px] tracking-wider uppercase px-3 py-1.5 rounded steami-badge-gold">
                {diaryCount} NOTES
              </Link>
            </motion.div>
          )}

          {/* User menu / Login */}
          <div className="hidden md:flex items-center relative">
            {isAuthenticated && user ? (
              <div className="relative">
                {/* Trigger button */}
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setUserMenuOpen((v) => !v)}
                  className="flex items-center gap-2.5 px-3 py-1.5 rounded-lg transition-all duration-200"
                  style={btnStyle}
                >
                  {/* Avatar bubble */}
                  <div className="w-6 h-6 rounded-full overflow-hidden ring-1 ring-steami-cyan/30 shrink-0">
                    {avatarUrl ? (
                      <img src={avatarUrl} alt="avatar" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-steami-cyan/30 to-steami-magenta/30">
                        <span className="font-mono text-[9px] font-bold text-steami-cyan">
                          {getInitials(user.fullName ?? 'U')}
                        </span>
                      </div>
                    )}
                  </div>
                  <span className="font-mono text-[11px] tracking-wider text-muted-foreground max-w-[80px] truncate hidden lg:block">
                    {(user.fullName ?? '').split(' ')[0].toUpperCase()}
                  </span>
                  <ChevronDown className="w-3 h-3 text-muted-foreground" />
                </motion.button>

                {/* Dropdown */}
                <AnimatePresence>
                  {userMenuOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 4, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 4, scale: 0.95 }}
                      transition={{ duration: 0.15 }}
                      className="absolute right-0 top-full mt-2 w-52 rounded-xl overflow-hidden py-2"
                      style={{
                        background: isLight ? 'rgba(255,255,255,0.92)' : 'rgba(8,16,38,0.95)',
                        backdropFilter: 'blur(24px)',
                        border: `1px solid ${isLight ? 'rgba(147,197,253,0.3)' : 'rgba(111,168,255,0.15)'}`,
                        boxShadow: isLight ? '0 12px 40px rgba(147,197,253,0.2)' : '0 12px 40px rgba(0,0,0,0.5)',
                      }}
                    >
                      {/* User info header */}
                      <div className="px-4 py-2.5 border-b" style={menuItemStyle}>
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full overflow-hidden ring-1 ring-steami-cyan/30 shrink-0">
                            {avatarUrl ? (
                              <img src={avatarUrl} alt="avatar" className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-steami-cyan/30 to-steami-magenta/30">
                                <span className="font-mono text-[10px] font-bold text-steami-cyan">
                                  {getInitials(user.fullName ?? 'U')}
                                </span>
                              </div>
                            )}
                          </div>
                          <div className="min-w-0">
                            <p className="font-mono text-[11px] text-foreground font-semibold truncate">{user.fullName}</p>
                            <p className="font-mono text-[10px] text-muted-foreground truncate">{user.email}</p>
                          </div>
                        </div>
                      </div>

                      {/* Profile link */}
                      <Link
                        to="/profile"
                        onClick={() => setUserMenuOpen(false)}
                        className="w-full text-left px-4 py-2.5 flex items-center gap-2 font-mono text-[11px] tracking-wider uppercase text-muted-foreground hover:text-foreground hover:bg-accent/10 transition-colors"
                      >
                        <User className="w-3.5 h-3.5" /> My Profile
                      </Link>

                      {/* Divider */}
                      <div className="my-1 border-t" style={menuItemStyle} />

                      {/* Sign out */}
                      <button
                        onClick={() => { logout(); setUserMenuOpen(false); }}
                        className="w-full text-left px-4 py-2.5 flex items-center gap-2 font-mono text-[11px] tracking-wider uppercase text-muted-foreground hover:text-red-400 hover:bg-red-400/5 transition-colors"
                      >
                        <LogOut className="w-3.5 h-3.5" /> Sign Out
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ) : (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setAuthOpen(true)}
                className="flex items-center gap-1.5 font-mono text-[11px] tracking-wider uppercase px-3.5 py-2 rounded-md transition-all duration-200 text-muted-foreground hover:text-steami-cyan hover:shadow-[0_0_15px_rgba(0,255,255,0.15)]"
                style={btnStyle}
              >
                <LogIn className="w-3.5 h-3.5" /> LOGIN
              </motion.button>
            )}
          </div>

          {/* Hamburger — mobile */}
          <button
            onClick={() => setMenuOpen((v) => !v)}
            className="md:hidden relative w-8 h-8 flex items-center justify-center focus:outline-none"
            aria-label={menuOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={menuOpen}
          >
            <span className="sr-only">{menuOpen ? 'Close' : 'Menu'}</span>
            <span className="block absolute w-5 transition-all duration-300 ease-in-out" style={{ height: 14 }}>
              <span className="block absolute h-[2px] w-5 rounded-full bg-foreground transition-all duration-300"
                style={{ top: menuOpen ? 6 : 0, transform: menuOpen ? 'rotate(45deg)' : 'rotate(0)' }} />
              <span className="block absolute top-[6px] h-[2px] w-5 rounded-full bg-foreground transition-all duration-300"
                style={{ opacity: menuOpen ? 0 : 1 }} />
              <span className="block absolute h-[2px] w-5 rounded-full bg-foreground transition-all duration-300"
                style={{ top: menuOpen ? 6 : 12, transform: menuOpen ? 'rotate(-45deg)' : 'rotate(0)' }} />
            </span>
          </button>
        </div>
      </motion.nav>

      {/* ── Mobile menu ── */}
      <AnimatePresence>
        {menuOpen && (
          <>
            <motion.div
              key="overlay"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
              className="fixed inset-0 z-[49]"
              style={{ background: isLight ? 'rgba(186, 230, 253, 0.4)' : 'rgba(0,0,0,0.6)' }}
              onClick={closeMenu}
            />
            <motion.div
              key="panel"
              initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
              transition={{ duration: 0.3, ease: [0.25, 0.1, 0.25, 1] }}
              className="fixed top-0 right-0 bottom-0 z-[51] w-[75vw] max-w-xs flex flex-col pt-16 px-6 pb-8"
              style={{
                background: isLight ? 'rgba(255, 255, 255, 0.95)' : 'rgba(10, 18, 42, 0.97)',
                backdropFilter: 'blur(24px) saturate(160%)',
                borderLeft: isLight ? '1px solid rgba(147, 197, 253, 0.3)' : '1px solid rgba(111, 168, 255, 0.1)',
                boxShadow: isLight ? '-8px 0 40px rgba(147, 197, 253, 0.15)' : '-8px 0 40px rgba(0,0,0,0.5)',
              }}
            >
              {/* Mobile user identity block */}
              {isAuthenticated && user && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.05 }}
                  className="mb-4 pb-4 border-b flex items-center gap-3"
                  style={{ borderColor: isLight ? 'rgba(147,197,253,0.2)' : 'rgba(111,168,255,0.1)' }}
                >
                  <div className="w-10 h-10 rounded-full overflow-hidden ring-2 ring-steami-cyan/30 shrink-0">
                    {avatarUrl ? (
                      <img src={avatarUrl} alt="avatar" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-steami-cyan/30 to-steami-magenta/30">
                        <span className="font-mono text-[11px] font-bold text-steami-cyan">
                          {getInitials(user.fullName ?? 'U')}
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="font-mono text-[13px] text-foreground font-semibold truncate">{user.fullName}</p>
                    <p className="font-mono text-[10px] text-muted-foreground truncate">{user.email}</p>
                  </div>
                </motion.div>
              )}

              {/* Nav links */}
              <div className="flex flex-col gap-1">
                {navLinks.map((link, i) => {
                  const isActive = location.pathname === link.path;
                  return (
                    <motion.div
                      key={link.path}
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.08 + i * 0.06, duration: 0.3 }}
                    >
                      <Link
                        to={link.path}
                        onClick={closeMenu}
                        className={`block font-mono text-[19px] tracking-[0.14em] uppercase py-3 px-3 rounded-lg transition-colors ${
                          isActive ? 'text-steami-cyan bg-accent/10' : 'text-foreground/70 hover:text-foreground hover:bg-accent/5'
                        }`}
                      >
                        {link.label}
                      </Link>
                    </motion.div>
                  );
                })}

                {/* Profile link — mobile (only when authenticated) */}
                {isAuthenticated && (
                  <motion.div
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.08 + navLinks.length * 0.06, duration: 0.3 }}
                  >
                    <Link
                      to="/profile"
                      onClick={closeMenu}
                      className={`flex items-center gap-2 font-mono text-[19px] tracking-[0.14em] uppercase py-3 px-3 rounded-lg transition-colors ${
                        location.pathname === '/profile'
                          ? 'text-steami-cyan bg-accent/10'
                          : 'text-foreground/70 hover:text-foreground hover:bg-accent/5'
                      }`}
                    >
                      <User className="w-4 h-4" /> PROFILE
                    </Link>
                  </motion.div>
                )}
              </div>

              <div className="my-5 h-px bg-border/30" />

              {diaryCount > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.35, duration: 0.3 }}
                >
                  <Link to="/dashboard" onClick={closeMenu} className="font-mono text-[10px] tracking-wider uppercase px-3 py-2 rounded steami-badge-gold inline-block">
                    {diaryCount} NOTES
                  </Link>
                </motion.div>
              )}

              <motion.div
                className="mt-auto flex flex-col gap-3"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4, duration: 0.3 }}
              >
                {/* Auth actions */}
                {isAuthenticated && user ? (
                  <button
                    onClick={() => { logout(); closeMenu(); }}
                    className="w-full font-mono text-[11px] tracking-wider uppercase px-4 py-3 rounded-lg transition-all flex items-center justify-center gap-2"
                    style={{
                      border: isLight ? '1px solid rgba(252,92,101,0.3)' : '1px solid rgba(252,92,101,0.2)',
                      background: isLight ? 'rgba(252,92,101,0.06)' : 'rgba(252,92,101,0.08)',
                      color: 'hsl(var(--steami-red, 0 85% 65%))',
                    }}
                  >
                    <LogOut className="w-3.5 h-3.5" /> SIGN OUT
                  </button>
                ) : (
                  <button
                    onClick={() => { closeMenu(); setTimeout(() => setAuthOpen(true), 200); }}
                    className="w-full font-mono text-[11px] tracking-wider uppercase px-4 py-3 rounded-lg transition-all flex items-center justify-center gap-2"
                    style={{
                      border: isLight ? '1px solid rgba(147, 197, 253, 0.4)' : '1px solid rgba(99, 179, 237, 0.18)',
                      background: isLight ? 'rgba(224, 242, 254, 0.5)' : 'rgba(10, 25, 55, 0.4)',
                      color: 'hsl(var(--muted-foreground))',
                    }}
                  >
                    <LogIn className="w-3.5 h-3.5" /> LOGIN
                  </button>
                )}

                <button
                  onClick={toggleTheme}
                  className="w-full font-mono text-[11px] tracking-wider uppercase px-4 py-3 rounded-lg transition-all flex items-center justify-center gap-2"
                  style={{
                    border: isLight ? '1px solid rgba(147, 197, 253, 0.4)' : '1px solid rgba(99, 179, 237, 0.18)',
                    background: isLight ? 'rgba(224, 242, 254, 0.5)' : 'rgba(10, 25, 55, 0.4)',
                    color: 'hsl(var(--muted-foreground))',
                  }}
                >
                  {isLight ? <Moon className="w-3.5 h-3.5" /> : <Sun className="w-3.5 h-3.5" />}
                  {isLight ? 'DARK MODE' : 'LIGHT MODE'}
                </button>

                <button
                  onClick={toggleNewsletter}
                  className={`w-full font-mono text-[16px] tracking-wider uppercase px-4 py-3 rounded-lg transition-all ${
                    subscribed ? 'text-steami-gold' : 'text-muted-foreground'
                  }`}
                  style={{
                    border: `1px solid ${subscribed ? 'rgba(232, 184, 75, 0.35)' : isLight ? 'rgba(147, 197, 253, 0.4)' : 'rgba(99, 179, 237, 0.18)'}`,
                    background: subscribed
                      ? (isLight ? 'rgba(163, 133, 36, 0.08)' : 'rgba(232, 184, 75, 0.1)')
                      : (isLight ? 'rgba(255, 255, 255, 0.6)' : 'rgba(10, 25, 55, 0.4)'),
                  }}
                >
                  {subscribed ? '✦ SUBSCRIBED' : '✦ SUBSCRIBE'}
                </button>
              </motion.div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Modals */}
      <AuthModal open={authOpen} onClose={() => setAuthOpen(false)} onSuccess={handleAuthSuccess} />
      <OnboardingModal open={onboardOpen} onClose={() => setOnboardOpen(false)} />
    </>
  );
}