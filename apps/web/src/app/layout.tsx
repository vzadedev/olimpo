import type { Metadata, Viewport } from 'next';
import { Providers } from '@/components/Providers';
import { BottomNav } from '@/components/BottomNav';
import './globals.css';

export const metadata: Metadata = {
  title: 'GymRank',
  description: 'Ranking de força nas academias',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'GymRank',
  },
};

export const viewport: Viewport = {
  themeColor: '#0f0f0f',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR" className="dark" suppressHydrationWarning>
      <body className="bg-background text-foreground antialiased selection:bg-primary/30">
        <Providers>
          <main className="mx-auto min-h-screen max-w-md pb-24 relative overflow-x-hidden">
            {children}
          </main>
          <BottomNav />
        </Providers>
      </body>
    </html>
  );
}
