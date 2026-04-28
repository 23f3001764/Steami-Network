import { create } from 'zustand';

type Theme = 'dark' | 'light';

interface ThemeState {
  theme: Theme;
  toggleTheme: () => void;
  setTheme: (t: Theme) => void;
}

export const useThemeStore = create<ThemeState>((set) => {
  const saved = (typeof window !== 'undefined' && localStorage.getItem('steami-theme')) as Theme | null;
  const initial: Theme = saved === 'light' ? 'light' : 'dark';

  // Apply immediately
  if (typeof document !== 'undefined') {
    document.documentElement.setAttribute('data-theme', initial);
  }

  return {
    theme: initial,
    toggleTheme: () =>
      set((state) => {
        const next = state.theme === 'dark' ? 'light' : 'dark';
        localStorage.setItem('steami-theme', next);
        document.documentElement.setAttribute('data-theme', next);
        return { theme: next };
      }),
    setTheme: (t) => {
      localStorage.setItem('steami-theme', t);
      document.documentElement.setAttribute('data-theme', t);
      set({ theme: t });
    },
  };
});
