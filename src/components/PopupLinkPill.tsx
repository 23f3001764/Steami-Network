import { useState, useCallback } from 'react';
import { Link2, Check } from 'lucide-react';
import { getPopupLink } from '@/hooks/use-popup-link';
import { api } from '@/lib/api';

type PopupType = 'explainer' | 'research' | 'simulation' | 'blog' | 'article' | 'feed' | 'insight' | 'diary';

interface PopupLinkPillProps {
  type: PopupType;
  id?: string | null;
  title?: string;
  /** Extra Tailwind classes for the button */
  className?: string;
}

/**
 * A small pill button that copies the deep-link URL for any popup type.
 *
 * The generated URL is always absolute and uses window.location.origin so it
 * works identically on localhost AND on Vercel (or any other host).
 *
 * Examples:
 *   http://localhost:8080/?explainer=quantum-dog
 *   https://steami.vercel.app/research?research=a1
 *   https://steami.vercel.app/?insight=3fabd2bc-12f4-5ed6-bc7d-ef1ec2d6267c
 */
export function PopupLinkPill({ type, id, title, className = '' }: PopupLinkPillProps) {
  const [state, setState] = useState<'idle' | 'copied'>('idle');

  const handleCopy = useCallback(async () => {
    if (!id) return;

    // getPopupLink already uses window.location.origin → works on every host
    const link = getPopupLink(type, id);

    try {
      await navigator.clipboard.writeText(link);
    } catch {
      // Clipboard API not available (e.g. http in some browsers) — silently ignore
    }

    // Fire analytics event (same pattern as usePopupLink)
    api.dashboard
      .event({ popup_type: type, popup_id: id, popup_title: title || id })
      .catch(() => undefined);

    setState('copied');
    setTimeout(() => setState('idle'), 1600);
  }, [id, title, type]);

  return (
    <button
      onClick={handleCopy}
      title={state === 'copied' ? 'Link copied!' : `Copy ${type} link`}
      className={[
        'inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5',
        'font-mono text-[10px] font-bold uppercase tracking-wide',
        'transition-all duration-200 select-none',
        state === 'copied'
          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
          : 'bg-white/[0.06] text-white/50 border border-white/[0.08] hover:bg-white/[0.10] hover:text-white/80',
        className,
      ].join(' ')}
    >
      {state === 'copied' ? (
        <>
          <Check className="h-3 w-3 shrink-0" />
          Copied
        </>
      ) : (
        <>
          <Link2 className="h-3 w-3 shrink-0" />
          Copy Link
        </>
      )}
    </button>
  );
}
