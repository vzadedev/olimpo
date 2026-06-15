'use client';

import { useEffect } from 'react';
import { useThemeStore, applyTheme } from '@/store/theme';
import { useAuthStore } from '@/store/auth';

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const theme = useThemeStore((s) => s.theme);
  const userTheme = useAuthStore((s) => s.user?.theme);

  useEffect(() => {
    const active = (userTheme as 'dark' | 'light') || theme;
    applyTheme(active);
  }, [theme, userTheme]);

  return <>{children}</>;
}
