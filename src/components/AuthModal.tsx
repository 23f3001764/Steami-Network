import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Eye, EyeOff, Mail, Lock, User } from 'lucide-react';
import { useAuthStore } from '@/stores/auth-store';
import { useThemeStore } from '@/stores/theme-store';
import { ForgotPasswordFlow } from './auth/forgot-password/ForgotPasswordFlow';

interface AuthModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function AuthModal({ open, onClose, onSuccess }: AuthModalProps) {
  const [tab, setTab] = useState<'login' | 'register'>('login');
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login, register, googleLogin } = useAuthStore();
  const googleButtonRef = useRef<HTMLDivElement>(null);
  const isLight = useThemeStore((s) => s.theme === 'light');
  const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

  const reset = () => {
    setEmail(''); setPassword(''); setConfirmPassword(''); setFullName(''); setError(''); setShowPassword(false);
    setShowForgotPassword(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email || !password) { setError('Please fill in all fields.'); return; }

    if (tab === 'register') {
      if (!fullName.trim()) { setError('Please enter your full name.'); return; }
      if (password.length < 6) { setError('Password must be at least 6 characters.'); return; }
      if (password !== confirmPassword) { setError('Passwords do not match.'); return; }
    }

    setLoading(true);
    try {
      const success = tab === 'login'
        ? await login(email, password)
        : await register(fullName, email, password);
      if (success) { reset(); onSuccess(); }
    } catch { setError('Something went wrong.'); }
    setLoading(false);
  };

  const switchTab = (t: 'login' | 'register') => { 
    setTab(t); 
    setError(''); 
    setShowForgotPassword(false);
  };

  useEffect(() => {
    if (!open || !googleClientId || !googleButtonRef.current || showForgotPassword) return;

    const renderButton = () => {
      const google = (window as any).google;
      if (!google?.accounts?.id || !googleButtonRef.current) return;
      google.accounts.id.initialize({
        client_id: googleClientId,
        callback: async (response: { credential?: string }) => {
          if (!response.credential) return;
          setLoading(true);
          setError('');
          try {
            await googleLogin(response.credential);
            reset();
            onSuccess();
          } catch {
            setError('Google sign-in failed.');
          } finally {
            setLoading(false);
          }
        },
      });
      google.accounts.id.renderButton(googleButtonRef.current, {
        type: 'standard',
        theme: isLight ? 'outline' : 'filled_black',
        size: 'large',
        width: 336,
        text: tab === 'login' ? 'signin_with' : 'signup_with',
      });
    };

    if (!(window as any).google?.accounts?.id) {
      const script = document.createElement('script');
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.defer = true;
      script.onload = renderButton;
      document.head.appendChild(script);
      return () => {
        script.onload = null;
      };
    }
    renderButton();
  }, [googleClientId, googleLogin, isLight, onSuccess, open, tab, showForgotPassword]);

  const inputStyle = {
    background: isLight ? 'rgba(255,255,255,0.7)' : 'rgba(10,25,55,0.5)',
    border: `1px solid ${isLight ? 'rgba(147,197,253,0.4)' : 'rgba(111,168,255,0.18)'}`,
    backdropFilter: 'blur(8px)',
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
        >
          {/* Backdrop */}
          <motion.div
            className="absolute inset-0"
            style={{
              background: isLight ? 'rgba(186,230,253,0.5)' : 'rgba(0,0,0,0.7)',
              backdropFilter: 'blur(8px)',
            }}
            onClick={onClose}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />

          {/* Modal */}
          <motion.div
            className="relative w-full max-w-md rounded-2xl overflow-hidden"
            style={{
              background: isLight ? 'rgba(255,255,255,0.85)' : 'rgba(8,16,38,0.92)',
              backdropFilter: 'blur(40px) saturate(160%)',
              border: `1px solid ${isLight ? 'rgba(147,197,253,0.4)' : 'rgba(111,168,255,0.15)'}`,
              boxShadow: isLight
                ? '0 24px 80px rgba(147,197,253,0.3), 0 0 1px rgba(0,0,0,0.1)'
                : '0 24px 80px rgba(0,0,0,0.6), 0 0 60px rgba(111,168,255,0.05)',
            }}
            initial={{ scale: 0.92, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.92, opacity: 0, y: 20 }}
            transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
          >
            {/* Close */}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 z-10 w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
              style={{ background: isLight ? 'rgba(255,255,255,0.5)' : 'rgba(255,255,255,0.05)' }}
            >
              <X className="w-4 h-4" />
            </button>

            <AnimatePresence mode="wait">
              {showForgotPassword ? (
                <motion.div
                  key="forgot-password"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.3 }}
                  className="p-8"
                >
                  <ForgotPasswordFlow 
                    onClose={onClose} 
                    onBackToLogin={() => setShowForgotPassword(false)} 
                  />
                </motion.div>
              ) : (
                <motion.div
                  key="auth-content"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.3 }}
                >
                  {/* Header */}
                  <div className="px-8 pt-8 pb-2">
                    <h2 className="steami-heading text-xl mb-1">
                      {tab === 'login' ? 'Welcome Back' : 'Join STEAMI'}
                    </h2>
                    <p className="text-[14px] text-muted-foreground font-medium">
                      {tab === 'login' ? 'Sign in to your intelligence dashboard.' : 'Create your personalized science feed.'}
                    </p>
                  </div>

                  {/* Tabs */}
                  <div className="px-8 pt-4 flex gap-1">
                    {(['login', 'register'] as const).map((t) => (
                      <button
                        key={t}
                        onClick={() => switchTab(t)}
                        className="relative font-mono text-[11px] tracking-[0.12em] uppercase px-4 py-2 rounded-lg transition-colors"
                        style={{
                          color: tab === t ? 'hsl(var(--steami-cyan))' : 'hsl(var(--muted-foreground))',
                          background: tab === t
                            ? (isLight ? 'rgba(59,130,246,0.08)' : 'rgba(111,168,255,0.1)')
                            : 'transparent',
                          border: `1px solid ${tab === t ? (isLight ? 'rgba(59,130,246,0.2)' : 'rgba(111,168,255,0.2)') : 'transparent'}`,
                        }}
                      >
                        {t === 'login' ? 'Login' : 'Register'}
                      </button>
                    ))}
                  </div>

                  {/* Form */}
                  <form onSubmit={handleSubmit} className="px-8 pt-5 pb-8 space-y-4">
                    {googleClientId && (
                      <>
                        <div ref={googleButtonRef} className="min-h-10 flex justify-center" />
                        <div className="flex items-center gap-3">
                          <span className="h-px flex-1 bg-border/40" />
                          <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">or</span>
                          <span className="h-px flex-1 bg-border/40" />
                        </div>
                      </>
                    )}
                    <AnimatePresence mode="wait">
                      {tab === 'register' && (
                        <motion.div
                          key="name"
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.2 }}
                          className="overflow-hidden"
                        >
                          <label className="font-mono text-[11px] tracking-wider uppercase text-muted-foreground mb-1.5 block">Full Name</label>
                          <div className="relative">
                            <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                            <input
                              type="text"
                              value={fullName}
                              onChange={(e) => setFullName(e.target.value)}
                              placeholder="Jane Doe"
                              className="w-full pl-10 pr-4 py-2.5 rounded-lg text-[18px] text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-ring/30 transition-all"
                              style={inputStyle}
                            />
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    <div>
                      <label className="font-mono text-[11px] tracking-wider uppercase text-muted-foreground mb-1.5 block">Email or Phone</label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <input
                          type="text"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="you@example.com"
                          className="w-full pl-10 pr-4 py-2.5 rounded-lg text-[18px] text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-ring/30 transition-all"
                          style={inputStyle}
                        />
                      </div>
                    </div>

                    <div>
                      <label className="font-mono text-[11px] tracking-wider uppercase text-muted-foreground mb-1.5 block">Password</label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <input
                          type={showPassword ? 'text' : 'password'}
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          placeholder="••••••••"
                          className="w-full pl-10 pr-10 py-2.5 rounded-lg text-[18px] text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-ring/30 transition-all"
                          style={inputStyle}
                        />
                        <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors">
                          {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                      
                      {tab === 'login' && (
                        <div className="flex justify-end mt-2">
                          <button
                            type="button"
                            onClick={() => setShowForgotPassword(true)}
                            className="group relative flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-wider text-muted-foreground hover:text-steami-cyan transition-colors"
                          >
                            <motion.span 
                              animate={{ opacity: [0.4, 1, 0.4] }}
                              transition={{ duration: 2, repeat: Infinity }}
                              className="w-1 h-1 rounded-full bg-steami-cyan"
                            />
                            Forgot Password?
                            <span className="absolute -bottom-1 right-0 w-0 h-px bg-steami-cyan group-hover:w-full transition-all duration-300" />
                          </button>
                        </div>
                      )}
                    </div>

                    <AnimatePresence mode="wait">
                      {tab === 'register' && (
                        <motion.div
                          key="confirm"
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.2 }}
                          className="overflow-hidden"
                        >
                          <label className="font-mono text-[11px] tracking-wider uppercase text-muted-foreground mb-1.5 block">Confirm Password</label>
                          <div className="relative">
                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                            <input
                              type={showPassword ? 'text' : 'password'}
                              value={confirmPassword}
                              onChange={(e) => setConfirmPassword(e.target.value)}
                              placeholder="••••••••"
                              className="w-full pl-10 pr-4 py-2.5 rounded-lg text-[18px] text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-ring/30 transition-all"
                              style={inputStyle}
                            />
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {error && (
                      <motion.p
                        initial={{ opacity: 0, y: -4 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-[11px] font-mono text-destructive"
                      >
                        {error}
                      </motion.p>
                    )}

                    <motion.button
                      type="submit"
                      disabled={loading}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className="w-full py-3 rounded-lg font-mono text-[11px] tracking-[0.12em] uppercase transition-all disabled:opacity-50"
                      style={{
                        background: isLight
                          ? 'linear-gradient(135deg, hsl(210 100% 50%), hsl(210 100% 42%))'
                          : 'linear-gradient(135deg, hsl(218 100% 72%), hsl(218 80% 55%))',
                        color: '#fff',
                        boxShadow: isLight
                          ? '0 4px 20px rgba(59,130,246,0.3)'
                          : '0 4px 20px rgba(111,168,255,0.2)',
                      }}
                    >
                      {loading ? '...' : tab === 'login' ? 'Sign In' : 'Create Account'}
                    </motion.button>
                  </form>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
