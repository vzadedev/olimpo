'use client';

import Link from 'next/link';
import { useAuthStore } from '@/store/auth';

export function Header() {
  const { token, logout } = useAuthStore();

  return (
    <header className="border-b border-white/10 px-4 py-4">
      <div className="mx-auto flex max-w-lg items-center justify-between">
        <Link href="/" className="text-xl font-bold text-accent">
          OLIMPO
        </Link>
        {token ? (
          <button
            onClick={logout}
            className="text-sm text-white/60 hover:text-white"
          >
            Sair
          </button>
        ) : (
          <Link href="/login" className="text-sm text-accent">
            Entrar
          </Link>
        )}
      </div>
    </header>
  );
}
