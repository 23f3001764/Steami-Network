/**
 * NewsletterModal.tsx
 * ─────────────────────────────────────────────────────────────────────────────
 * Reusable modal for newsletter subscribe / unsubscribe.
 * Called from SteamiNav via useNewsletterPopup() hook.
 *
 * APIs used:
 *   POST /api/newsletter/subscribe   { email, name }
 *   POST /api/newsletter/unsubscribe { email }
 */

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Mail, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { api } from '@/lib/api';

interface Props {
  /** 'subscribe' | 'unsubscribe' | null — null means closed */
  mode: 'subscribe' | 'unsubscribe' | null;
  /** Pre-filled email (from URL param when user clicks unsubscribe link in email) */
  initialEmail?: string;
  onClose: () => void;
}

export function NewsletterModal({ mode, initialEmail = '', onClose }: Props) {
  const [email,       setEmail]       = useState(initialEmail);
  const [name,        setName]        = useState('');
  const [status,      setStatus]      = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message,     setMessage]     = useState('');
  /** null = unchecked, true = actively subscribed, false = not subscribed / inactive */
  const [isSubscribed,  setIsSubscribed]  = useState<boolean | null>(null);
  const [checkingEmail, setCheckingEmail] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  /**
   * GET /api/newsletter/recipients — public, no token needed.
   * Checks subscribed===true AND is_active!==false (inactive users count as unsubscribed).
   */
  const checkEmailSubscription = async (emailToCheck: string) => {
    if (!emailToCheck.includes('@')) { setIsSubscribed(null); return; }
    setCheckingEmail(true);
    try {
      const data: any = await api.newsletter.recipients();
      const recipients: any[] = Array.isArray(data)
        ? data
        : data?.recipients ?? data?.subscribers ?? [];
      const match = recipients.find(
        (entry: any) => String(entry.email ?? entry).toLowerCase() === emailToCheck.toLowerCase(),
      );
      // is_active===false means unsubscribed even if subscribed field says true
      const found = !!match && match.subscribed === true && match.is_active !== false;
      setIsSubscribed(found);
    } catch {
      setIsSubscribed(null); // network error — let server decide
    } finally {
      setCheckingEmail(false);
    }
  };

  // Reset when modal opens/closes or mode changes
  useEffect(() => {
    setEmail(initialEmail);
    setName('');
    setStatus('idle');
    setMessage('');
    setIsSubscribed(null);
    if (mode && initialEmail) checkEmailSubscription(initialEmail);
    if (mode) setTimeout(() => inputRef.current?.focus(), 120);
  }, [mode, initialEmail]);

  // Close on Escape
  useEffect(() => {
    if (!mode) return;
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [mode, onClose]);

  const submit = async () => {
    const trimmedEmail = email.trim();
    if (!trimmedEmail || !trimmedEmail.includes('@')) {
      setStatus('error');
      setMessage('Please enter a valid email address.');
      return;
    }

    // Pre-flight: block if subscription state conflicts with action
    if (mode === 'subscribe' && isSubscribed === true) {
      setStatus('error');
      setMessage('This email is already subscribed to the newsletter.');
      return;
    }
    if (mode === 'unsubscribe' && isSubscribed === false) {
      setStatus('error');
      setMessage("This email isn't subscribed — nothing to unsubscribe.");
      return;
    }

    setStatus('loading');
    setMessage('');
    try {
      if (mode === 'subscribe') {
        // POST /api/newsletter/subscribe — body: { email: string, name?: string }
        await api.newsletter.subscribe({ email: trimmedEmail, name: name.trim() });
        setStatus('success');
        setMessage("You're subscribed! Welcome to STEAMI — expect your first digest soon. 🚀");
      } else {
        // POST /api/newsletter/unsubscribe — body: { email: string }
        await api.newsletter.unsubscribe({ email: trimmedEmail });
        setStatus('success');
        setMessage("You've been unsubscribed. You won't receive further newsletter emails.");
      }
    } catch (e: any) {
      // Surface FastAPI 422 detail[] into a readable string
      const detail = e?.detail ?? e?.response?.data?.detail;
      const humanMsg = Array.isArray(detail)
        ? detail.map((d: any) => d.msg ?? String(d)).join(', ')
        : typeof detail === 'string'
          ? detail
          : e?.message ?? 'Something went wrong. Please try again.';
      setStatus('error');
      setMessage(humanMsg);
    }
  };

  const isSubscribe = mode === 'subscribe';

  return (
    <AnimatePresence>
      {mode && (
        <>
          {/* Backdrop */}
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[70] bg-black/60 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Panel */}
          <motion.div
            key="panel"
            initial={{ opacity: 0, scale: 0.95, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 16 }}
            transition={{ duration: 0.22, ease: [0.25, 0.1, 0.25, 1] }}
            className="fixed inset-0 z-[71] flex items-center justify-center p-4 pointer-events-none"
          >
            <div
              className="pointer-events-auto w-full max-w-md rounded-2xl border border-white/10 bg-[#0a1228] shadow-2xl overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-white/10">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-steami-cyan/10 flex items-center justify-center">
                    <Mail className="w-4 h-4 text-steami-cyan" />
                  </div>
                  <div>
                    <h2 className="font-serif text-[17px] font-bold">
                      {isSubscribe ? 'Subscribe to STEAMI' : 'Unsubscribe'}
                    </h2>
                    <p className="font-mono text-[10px] text-muted-foreground uppercase tracking-widest">
                      {isSubscribe ? 'Daily science & tech digest' : 'Newsletter'}
                    </p>
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className="text-muted-foreground hover:text-foreground transition-colors"
                  aria-label="Close"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Body */}
              <div className="px-6 py-5 space-y-4">
                {status === 'success' ? (
                  <div className="flex flex-col items-center gap-3 py-4 text-center">
                    <CheckCircle2 className="w-10 h-10 text-steami-green" />
                    <p className="text-[14px] text-foreground">{message}</p>
                    <button
                      onClick={onClose}
                      className="steami-btn text-[12px] mt-2"
                    >
                      Close
                    </button>
                  </div>
                ) : (
                  <>
                    {isSubscribe && (
                      <p className="text-[13px] text-muted-foreground leading-relaxed">
                        Get the best STEM insights, explainers, and research — curated by our team
                        and powered by AI. No spam, unsubscribe anytime.
                      </p>
                    )}

                    {!isSubscribe && (
                      <p className="text-[13px] text-muted-foreground">
                        Enter your email below to unsubscribe from all STEAMI newsletter emails.
                      </p>
                    )}

                    {/* Email */}
                    <div>
                      <label className="block text-[11px] text-muted-foreground mb-1.5">
                        Email address <span className="text-steami-red">*</span>
                      </label>
                      <input
                        ref={inputRef}
                        type="email"
                        value={email}
                        onChange={(e) => { setEmail(e.target.value); setIsSubscribed(null); }}
                        onBlur={(e) => checkEmailSubscription(e.target.value.trim())}
                        placeholder="you@example.com"
                        onKeyDown={(e) => e.key === 'Enter' && submit()}
                        className="w-full rounded-md border border-white/10 bg-transparent px-3 py-2 text-[14px] focus:outline-none focus:border-steami-cyan/40"
                      />
                      {checkingEmail && (
                        <p className="mt-1 flex items-center gap-1 font-mono text-[10px] text-muted-foreground">
                          <Loader2 className="w-2.5 h-2.5 animate-spin" /> Checking…
                        </p>
                      )}
                      {!checkingEmail && isSubscribed === true && mode === 'subscribe' && (
                        <p className="mt-1 font-mono text-[10px] text-yellow-400">⚠ Already subscribed with this email.</p>
                      )}
                      {!checkingEmail && isSubscribed === false && mode === 'subscribe' && (
                        <p className="mt-1 font-mono text-[10px] text-green-400">✓ Email available to subscribe.</p>
                      )}
                      {!checkingEmail && isSubscribed === true && mode === 'unsubscribe' && (
                        <p className="mt-1 font-mono text-[10px] text-green-400">✓ Found — you can unsubscribe this email.</p>
                      )}
                      {!checkingEmail && isSubscribed === false && mode === 'unsubscribe' && (
                        <p className="mt-1 font-mono text-[10px] text-red-400">⚠ This email is not currently subscribed.</p>
                      )}
                    </div>

                    {/* Name — subscribe only */}
                    {isSubscribe && (
                      <div>
                        <label className="block text-[11px] text-muted-foreground mb-1.5">
                          Your name <span className="text-muted-foreground/50">(optional)</span>
                        </label>
                        <input
                          type="text"
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          placeholder="Ada Lovelace"
                          onKeyDown={(e) => e.key === 'Enter' && submit()}
                          className="w-full rounded-md border border-white/10 bg-transparent px-3 py-2 text-[14px] focus:outline-none focus:border-steami-cyan/40"
                        />
                      </div>
                    )}

                    {/* Error */}
                    {status === 'error' && (
                      <div className="flex items-center gap-2 text-steami-red text-[12px]">
                        <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                        {message}
                      </div>
                    )}

                    {/* Submit */}
                    <button
                      onClick={submit}
                      disabled={status === 'loading'}
                      className="w-full steami-btn text-[13px] flex items-center justify-center gap-2 py-2.5 disabled:opacity-50"
                    >
                      {status === 'loading' && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                      {isSubscribe ? '🚀 Subscribe' : 'Unsubscribe'}
                    </button>

                    {isSubscribe && (
                      <p className="text-[10px] text-muted-foreground/60 text-center">
                        By subscribing you agree to receive email newsletters. Unsubscribe anytime.
                      </p>
                    )}
                  </>
                )}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}