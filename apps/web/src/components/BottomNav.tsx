'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Flame, FileText, Settings } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

export function BottomNav() {
  const pathname = usePathname();

  const navItems = [
    { name: 'Home', href: '/', icon: Home },
    { name: 'Train', href: '/gym', icon: Flame },
    { name: 'Report', href: '/reels', icon: FileText, center: true },
    { name: 'Setting', href: '/settings', icon: Settings },
  ];

  // Avoid showing on onboarding and login
  if (pathname === '/onboarding' || pathname === '/login' || pathname === '/register') return null;

  return (
    <div className="fixed bottom-0 left-0 z-50 w-full bg-background/80 backdrop-blur-lg border-t border-border/50 pb-safe">
      <nav className="mx-auto flex max-w-md items-center justify-between px-6 py-3">
        {navItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
          const Icon = item.icon;

          if (item.center) {
            return (
              <div key={item.name} className="relative -mt-8 flex flex-col items-center">
                <Link
                  href={item.href}
                  className="flex h-14 w-14 items-center justify-center rounded-full bg-primary text-black shadow-[0_0_20px_rgba(214,248,0,0.4)] transition-transform active:scale-95"
                >
                  <Icon size={24} strokeWidth={2.5} />
                </Link>
                <span className="mt-2 text-[10px] font-medium text-foreground">{item.name}</span>
              </div>
            );
          }

          return (
            <Link
              key={item.name}
              href={item.href}
              className="flex flex-col items-center gap-1"
            >
              <div className="relative p-2 text-muted-foreground transition-colors hover:text-foreground">
                <Icon
                  size={24}
                  className={cn(isActive ? 'text-primary' : '')}
                  strokeWidth={isActive ? 2.5 : 2}
                />
                {isActive && (
                  <motion.div
                    layoutId="bottom-nav-indicator"
                    className="absolute -bottom-2 left-1/2 h-1 w-1 -translate-x-1/2 rounded-full bg-primary"
                  />
                )}
              </div>
              <span
                className={cn(
                  'text-[10px] font-medium transition-colors',
                  isActive ? 'text-primary' : 'text-muted-foreground'
                )}
              >
                {item.name}
              </span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
