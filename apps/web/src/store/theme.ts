'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

type Theme = 'dark' | 'light';

interface ThemeState {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  toggle: () => void;
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set, get) => ({
      theme: 'dark',
      setTheme: (theme) => set({ theme }),
      toggle: () => set({ theme: get().theme === 'dark' ? 'light' : 'dark' }),
    }),
    { name: 'gymrank-theme' },
  ),
);

export function applyTheme(theme: Theme) {
  const root = document.documentElement;
  root.classList.remove('dark', 'light');
  root.classList.add(theme === 'dark' ? 'dark' : 'light');
  root.style.colorScheme = theme;
}
