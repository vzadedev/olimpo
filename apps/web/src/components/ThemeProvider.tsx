'use client';

import { useEffect } from 'react';
import { useThemeStore, applyTheme } from '@/store/theme';

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const theme = useThemeStore((s) => s.theme);

  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  return <>{children}</>;
}

export function ThemeScript() {
  return (
    <script
      dangerouslySetInnerHTML={{
        __html: `(function(){try{var s=localStorage.getItem('gymrank-theme');var t=s?JSON.parse(s).state.theme:'dark';document.documentElement.classList.toggle('dark',t==='dark');}catch(e){document.documentElement.classList.add('dark');}})();`,
      }}
    />
  );
}
