import { useCallback } from 'react';
import { api } from '@/lib/api';

export function useEventTracker() {
  return useCallback((event_type: string, entity_type?: string, entity_id?: string, metadata?: Record<string, any>) => {
    api.dashboard
      .event({
        popup_type: entity_type || event_type,
        popup_id: entity_id || event_type,
        popup_title: metadata?.title || event_type,
      })
      .catch(() => undefined);
  }, []);
}
