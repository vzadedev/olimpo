'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Trophy, FileText, Users, UtensilsCrossed } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import { NotificationBell } from '@/components/NotificationBell';

export function BottomNav() {
  const pathname = usePathname();

  const navItems = [
    { name: 'Início', href: '/', icon: Home },
    { name: 'Rankings', href: '/rankings', icon: Trophy },
    { name: 'Reels', href: '/reels', icon: FileText, center: true },
    { name: 'Feed', href: '/feed', icon: Users },
    { name: 'Dieta', href: '/diet', icon: UtensilsCrossed },
  ];

  if (pathname === '/onboarding' || pathname === '/login' || pathname === '/register') {
    return null;
  }

  return (
    <>
      <div className="fixed right-4 top-4 z-50 md:hidden">
        <NotificationBell />
      </div>
      <div className="fixed bottom-0 left-0 z-50 w-full border-t border-white/10 bg-black/40 pb-safe backdrop-blur-2xl">
        <nav className="mx-auto flex max-w-md items-center justify-between px-3 py-3">
          {navItems.map((item) => {
            const isActive =
              pathname === item.href || pathname.startsWith(item.href + '/');
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
              <Link key={item.name} href={item.href} className="flex flex-col items-center gap-1">
                <div className="relative p-1.5 text-muted-foreground transition-colors hover:text-foreground">
                  <Icon
                    size={22}
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
                    'text-[9px] font-medium transition-colors',
                    isActive ? 'text-primary' : 'text-muted-foreground',
                  )}
                >
                  {item.name}
                </span>
              </Link>
            );
          })}
        </nav>
        <div className="mx-auto flex max-w-md justify-end px-4 pb-1">
          <Link href="/settings" className="text-[10px] text-muted-foreground hover:text-primary">
            Perfil →
          </Link>
        </div>
      </div>
    </>
  );
}
