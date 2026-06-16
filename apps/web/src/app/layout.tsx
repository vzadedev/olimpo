import type { Metadata, Viewport } from 'next';
import { Providers } from '@/components/Providers';
import { BottomNav } from '@/components/BottomNav';
import { ThemeScript } from '@/components/ThemeProvider';
import './globals.css';

export const metadata: Metadata = {
  title: 'OLIMPO — Competição nas academias',
  description: 'Prove seu valor. Ranking de força, títulos e competição entre atletas.',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'OLIMPO',
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#0f0f0f' },
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <head>
        <ThemeScript />
      </head>
      <body className="bg-black text-foreground antialiased selection:bg-primary/30">
        {/* Global Deep Glow Background */}
        <div className="fixed inset-0 z-[-1] bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-[#4a0d0d]/30 via-black to-black" />
        <Providers>
          <main className="relative mx-auto min-h-screen w-full max-w-md overflow-x-hidden pb-24">
            {children}
          </main>
          <BottomNav />
        </Providers>
      </body>
    </html>
  );
}
