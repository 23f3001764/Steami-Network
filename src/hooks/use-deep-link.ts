import { useEffect } from 'react';

type DeepLinkKey = 'explainer' | 'research' | 'simulation' | 'insight' | 'feed' | 'diary';

interface Options {
  onExplainer?: (id: string) => void;
  onResearch?: (id: string) => void;
  onSimulation?: (id: string) => void;
  onInsight?: (id: string) => void;
  onFeed?: (id: string) => void;
  onDiary?: (id: string) => void;
}

export function useDeepLink({ onExplainer, onResearch, onSimulation, onInsight, onFeed, onDiary }: Options = {}) {
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const legacyOpen = params.get('open');
    const explainerId = params.get('explainer') ?? (window.location.pathname === '/' ? legacyOpen : null);
    const researchId = params.get('research') ?? (window.location.pathname.startsWith('/research') ? legacyOpen : null);
    const simulationId = params.get('simulation') ?? (window.location.pathname.startsWith('/simulations') ? legacyOpen : null);

    if (explainerId) onExplainer?.(explainerId);
    if (researchId) onResearch?.(researchId);
    if (simulationId) onSimulation?.(simulationId);
    if (params.get('insight')) onInsight?.(params.get('insight')!);
    if (params.get('feed')) onFeed?.(params.get('feed')!);
    if (params.get('diary')) onDiary?.(params.get('diary')!);
  }, [onDiary, onExplainer, onFeed, onInsight, onResearch, onSimulation]);
}

export function clearDeepLinkParam(key: DeepLinkKey | 'open') {
  const url = new URL(window.location.href);
  url.searchParams.delete(key);
  window.history.replaceState({}, '', `${url.pathname}${url.search}${url.hash}`);
}

export function setDeepLinkParam(key: DeepLinkKey, value: string) {
  const url = new URL(window.location.href);
  url.searchParams.set(key, value);
  window.history.replaceState({}, '', `${url.pathname}${url.search}${url.hash}`);
}

export function copyDeepLink(): string {
  const link = window.location.href;
  navigator.clipboard.writeText(link).catch(() => undefined);
  return link;
}
