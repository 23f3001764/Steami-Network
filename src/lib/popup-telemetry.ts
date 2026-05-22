/**
 * popup-telemetry.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Single source of truth for popup open / close tracking.
 *
 * WHY THIS EXISTS:
 *   The old approach called `api.dashboard.event()` on BOTH open and close,
 *   which created TWO rows per popup view — the "close" row had the duration
 *   but the "open" row was orphaned with null duration. This polluted the CSV
 *   and recommendation data.
 *
 * HOW IT WORKS NOW:
 *   1. `logPopupOpen()` — fires POST /api/dashboard/event, returns { eventId, openedAt }
 *   2. `logPopupClose()` — fires PATCH /api/dashboard/event/{id}/duration
 *      This updates the SAME document. ONE row per open/close cycle in the DB.
 *
 * DEVICE DETECTION:
 *   Resolved here once. Falls back to "desktop" (not "unknown") when
 *   user-agent is ambiguous so the CSV has no empty device_type cells.
 *
 * USAGE (same pattern in every page):
 *
 *   import { logPopupOpen, logPopupClose, type PopupSession } from '@/lib/popup-telemetry';
 *
 *   // On open:
 *   const session = await logPopupOpen('explainer', item.id, item.title);
 *
 *   // On close:
 *   logPopupClose(session);
 *
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { api } from '@/lib/api';

// ── Device detection ─────────────────────────────────────────────────────────

function getDeviceType(): 'mobile' | 'tablet' | 'desktop' {
  const ua = navigator.userAgent.toLowerCase();
  if (/tablet|ipad|playbook|silk/.test(ua)) return 'tablet';
  if (/mobile|iphone|ipod|android|blackberry|mini|windows\sce|palm/.test(ua)) return 'mobile';
  return 'desktop';
}

// ── Types ────────────────────────────────────────────────────────────────────

export type PopupType = 'research_article' | 'ai_insight' | 'explainer' | 'simulation';

/** Returned by logPopupOpen — must be passed to logPopupClose. */
export interface PopupSession {
  eventId:    string | null;   // null if the POST failed (still safe to pass to close)
  openedAt:   number;          // Date.now() at open time
  popupType:  PopupType;
  popupId:    string;
  popupTitle: string;
}

/** Sentinel for "no session active" — safe to pass to logPopupClose. */
export const NO_SESSION: PopupSession = {
  eventId:    null,
  openedAt:   0,
  popupType:  'explainer',
  popupId:    '',
  popupTitle: '',
};

// ── Core functions ────────────────────────────────────────────────────────────

/**
 * Call when a popup / modal OPENS.
 * Fires POST /api/dashboard/event and returns a PopupSession.
 * Never throws — failures are silently swallowed so UI is never blocked.
 */
export async function logPopupOpen(
  popupType:  PopupType,
  popupId:    string | undefined | null,
  popupTitle: string = '',
): Promise<PopupSession> {
  const openedAt = Date.now();

  if (!popupId) {
    return { eventId: null, openedAt, popupType, popupId: '', popupTitle };
  }

  try {
    const result = await api.dashboard.event({
      popup_type:  popupType,
      popup_id:    popupId,
      popup_title: popupTitle,
      device_type: getDeviceType(),
    });

    return {
      eventId:    result?.id ?? null,
      openedAt,
      popupType,
      popupId,
      popupTitle,
    };
  } catch {
    // Return a valid session so logPopupClose is still safe to call
    return { eventId: null, openedAt, popupType, popupId, popupTitle };
  }
}

/**
 * Call when a popup / modal CLOSES.
 * PATCHes read_duration_seconds onto the existing open-event document.
 * Skips if:
 *   - session has no eventId (open failed or never happened)
 *   - duration < 2 s (accidental close)
 *   - duration > 7200 s (tab left open — server also caps this)
 *
 * Never throws.
 */
export function logPopupClose(session: PopupSession | null | undefined): void {
  if (!session?.eventId || !session.openedAt) return;

  const seconds = Math.round((Date.now() - session.openedAt) / 1000);
  if (seconds < 2 || seconds > 7200) return;

  api.dashboard.patchDuration(session.eventId, seconds).catch(() => {});
}

/**
 * Synchronous helper for use in useRef patterns where you can't await.
 * Fires logPopupOpen in the background and calls onSession with the result.
 *
 * Example:
 *   logPopupOpenSync('explainer', id, title, (s) => { sessionRef.current = s; });
 */
export function logPopupOpenSync(
  popupType:  PopupType,
  popupId:    string | undefined | null,
  popupTitle: string = '',
  onSession:  (session: PopupSession) => void = () => {},
): void {
  logPopupOpen(popupType, popupId, popupTitle).then(onSession).catch(() => {});
}
