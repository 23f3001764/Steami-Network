/**
 * use-newsletter-popup.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Hook that detects ?subscribe=1 / ?unsubscribe=1 query params in the URL
 * (added by email footer links) and surfaces a flag so SteamiNav can open
 * the subscribe / unsubscribe modal automatically.
 *
 * USAGE in SteamiNav (or any top-level component):
 *   const { showSubscribe, showUnsubscribe, email, dismiss } = useNewsletterPopup();
 *
 * URL formats produced by the newsletter email footer:
 *   https://steami.com/?subscribe=1
 *   https://steami.com/?unsubscribe=1&email=user%40example.com
 */

import { useEffect, useState } from 'react';

type PopupMode = 'subscribe' | 'unsubscribe' | null;

interface NewsletterPopupState {
  mode: PopupMode;
  /** Pre-filled email — present when clicking unsubscribe from email footer */
  email: string;
  /** Call to clear query params and close the popup */
  dismiss: () => void;
}

export function useNewsletterPopup(): NewsletterPopupState {
  const [mode,  setMode]  = useState<PopupMode>(null);
  const [email, setEmail] = useState('');

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const sub    = params.get('subscribe');
    const unsub  = params.get('unsubscribe');
    const mail   = params.get('email') ?? '';

    if (sub === '1' || sub === 'true') {
      setMode('subscribe');
      setEmail(mail);
    } else if (unsub === '1' || unsub === 'true') {
      setMode('unsubscribe');
      setEmail(decodeURIComponent(mail));
    }
  }, []);

  const dismiss = () => {
    setMode(null);
    setEmail('');
    // Strip the query params so refreshing doesn't re-open the modal
    const url = new URL(window.location.href);
    url.searchParams.delete('subscribe');
    url.searchParams.delete('unsubscribe');
    url.searchParams.delete('email');
    window.history.replaceState({}, '', `${url.pathname}${url.search}${url.hash}`);
  };

  return { mode, email, dismiss };
}