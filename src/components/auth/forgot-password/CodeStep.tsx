import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Loader2, RefreshCw } from 'lucide-react';
import { OtpInput } from './OtpInput';
import { useThemeStore } from '@/stores/theme-store';

interface CodeStepProps {
  email: string;
  code: string;
  setCode: (code: string) => void;
  onNext: () => void;
  onBack: () => void;
  isLight?: boolean;
}

export function CodeStep({ email, code, setCode, onNext, onBack, isLight: propIsLight }: CodeStepProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const [success, setSuccess] = useState(false);
  const [cooldown, setCooldown] = useState(59);
  const storeIsLight = useThemeStore((s) => s.theme === 'light');
  const isLight = propIsLight ?? storeIsLight;

  useEffect(() => {
    if (cooldown > 0) {
      const timer = setTimeout(() => setCooldown(cooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [cooldown]);

  const handleVerify = async () => {
    if (code.length < 6) return;
    
    setLoading(true);
    setError(false);
    
    /**
     * API-READY HANDLER: verifyCode(email, code)
     * TODO: Implement verification logic with backend
     * const { session } = await authService.verifyCode(email, code);
     */
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // Frontend mock verification: accept any 6-digit numeric code
    if (code.length === 6) {
      setSuccess(true);
      setTimeout(onNext, 800);
    } else {
      setError(true);
    }
    setLoading(false);
  };

  const handleResend = async () => {
    if (cooldown > 0) return;
    setLoading(true);
    
    /**
     * TODO: Re-trigger code request
     * await authService.requestCode(email);
     */
    await new Promise(resolve => setTimeout(resolve, 1000));
    setCooldown(59);
    setLoading(false);
  };

  const maskEmail = (e: string) => {
    const [name, domain] = e.split('@');
    if (!name || !domain) return e;
    return `${name[0]}${'*'.repeat(name.length - 1)}@${domain}`;
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="forgot-password-scope"
    >
      <div className="text-center mb-6">
        <h2 className="steami-heading text-2xl mb-2">Enter verification code</h2>
        <p className="text-[14px] text-muted-foreground leading-relaxed">
          Check your Gmail inbox for <span className="text-foreground font-medium">{maskEmail(email)}</span> and enter the 6-digit code.
        </p>
      </div>

      <OtpInput 
        value={code} 
        onChange={(val) => { 
          setCode(val); 
          if(val.length === 6) handleVerify(); 
        }} 
        error={error}
        success={success}
        disabled={loading || success}
      />

      <div className="flex flex-col items-center gap-6 mt-4">
        {error && (
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-[11px] font-mono text-destructive">
            Invalid verification signal. Please check the code and try again.
          </motion.p>
        )}

        <div className="w-full space-y-3">
          <motion.button
            onClick={handleVerify}
            disabled={loading || code.length < 6 || success}
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
            className="w-full py-3.5 rounded-xl font-mono text-[11px] tracking-[0.15em] uppercase text-white shadow-lg relative overflow-hidden flex items-center justify-center gap-2"
            style={{
              background: isLight 
                ? 'linear-gradient(135deg, #3b82f6, #2563eb)'
                : 'linear-gradient(135deg, #22d3ee, #0891b2)'
            }}
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Verify identity'}
          </motion.button>

          <div className="flex items-center justify-between px-1">
            <button
              type="button"
              onClick={onBack}
              className="text-[10px] font-mono tracking-wider uppercase text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1.5"
            >
              <ArrowLeft className="w-3 h-3" />
              Back
            </button>

            <button
              type="button"
              disabled={cooldown > 0 || loading}
              onClick={handleResend}
              className="text-[10px] font-mono tracking-wider uppercase flex items-center gap-1.5 transition-colors
                disabled:text-muted-foreground/50 text-steami-cyan hover:brightness-110"
            >
              <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} />
              {cooldown > 0 ? `Resend in 00:${cooldown.toString().padStart(2, '0')}` : 'Resend code'}
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
