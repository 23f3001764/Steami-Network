import { create } from 'zustand';
import { api } from '@/lib/api';

export interface UserProfile {
  id: string;
  fullName: string;
  email: string;
  role: 'user' | 'mod' | 'admin';
  token?: string;
  profession?: string;
  subscribedNewsletter?: boolean;
  interests: string[];
  onboarded: boolean;
}

interface AuthState {
  user: UserProfile | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  register: (fullName: string, email: string, password: string, profession?: string) => Promise<boolean>;
  googleLogin: (idToken: string) => Promise<boolean>;
  logout: () => void;
  setInterests: (interests: string[]) => void;
  completeOnboarding: () => void;
}

const STORAGE_KEY = 'steami-auth-user';

const loadUser = (): UserProfile | null => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

const saveUser = (user: UserProfile | null) => {
  if (user) localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
  else localStorage.removeItem(STORAGE_KEY);
};

const normalizeUser = (payload: any, fallbackEmail = ''): UserProfile => {
  const source = payload?.user ?? payload ?? {};
  const interests = source.interests ?? payload?.interests ?? [];
  return {
    id: source.id ?? source.uid ?? payload?.uid ?? crypto.randomUUID(),
    fullName:
      source.full_name ??
      source.display_name ??
      source.fullName ??
      payload?.display_name ??
      fallbackEmail.split('@')[0]?.replace(/[._]/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()) ??
      'STEAMI User',
    email: source.email ?? payload?.email ?? fallbackEmail,
    role: source.role ?? payload?.role ?? 'user',
    token: payload?.token ?? source.token,
    profession: source.profession ?? payload?.profession,
    subscribedNewsletter: source.subscribe_email ?? source.subscribed_newsletter ?? payload?.subscribed_newsletter,
    interests,
    onboarded: Array.isArray(interests) && interests.length > 0,
  };
};

export const useAuthStore = create<AuthState>((set) => ({
  user: loadUser(),
  isAuthenticated: !!loadUser(),

  login: async (email: string, password: string) => {
    const payload = await api.auth.login({ email, password });
    const user = normalizeUser(payload, email);

    try {
      const interestsPayload: any = await api.auth.getInterests();
      const topics = interestsPayload?.topics ?? interestsPayload?.interests ?? [];
      user.interests = Array.isArray(topics) ? topics : [];
      user.onboarded = true;
    } catch {
      user.onboarded = true;
    }

    saveUser(user);
    set({ user, isAuthenticated: true });
    return true;
  },

  register: async (fullName: string, email: string, password: string, profession = 'student') => {
    const payload = await api.auth.signup({ full_name: fullName, email, password, profession, subscribe_email: true });
    const user = { ...normalizeUser(payload, email), fullName, onboarded: false };
    saveUser(user);
    set({ user, isAuthenticated: true });
    return true;
  },

  googleLogin: async (idToken: string) => {
    const payload = await api.auth.google(idToken);
    const user = normalizeUser(payload, payload?.email);
    user.onboarded = !(payload as any)?.is_new_user;
    saveUser(user);
    set({ user, isAuthenticated: true });
    return true;
  },

  logout: () => {
    saveUser(null);
    set({ user: null, isAuthenticated: false });
  },

  setInterests: (interests: string[]) =>
    set((state) => {
      if (!state.user) return {};
      const updated = { ...state.user, interests };
      saveUser(updated);
      api.auth.saveInterests(interests).catch(() => undefined);
      return { user: updated };
    }),

  completeOnboarding: () =>
    set((state) => {
      if (!state.user) return {};
      const updated = { ...state.user, onboarded: true };
      saveUser(updated);
      return { user: updated };
    }),
}));
