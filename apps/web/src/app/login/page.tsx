'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useMutation } from '@apollo/client';
import type { AuthPayload } from '@gymrank/types';
import { useAuthStore } from '@/store/auth';
import { toast } from '@/store/toast';
import { LOGIN } from '@/lib/graphql';

export default function LoginPage() {
  const router = useRouter();
  const login = useAuthStore((s) => s.login);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const [loginMutation, { loading }] = useMutation<
    { login: AuthPayload },
    { input: { email: string; password: string } }
  >(LOGIN);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      const { data } = await loginMutation({
        variables: { input: { email, password } },
      });
      if (data?.login.accessToken) {
        login(data.login.accessToken);
        toast.success('Bem-vindo de volta à arena!');
        router.push('/');
      }
    } catch {
      toast.error('E-mail ou senha inválidos');
    }
  };

  return (
    <div className="flex min-h-[80vh] flex-col justify-center px-4">
      <div className="mx-auto w-full max-w-md">
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-black tracking-tight">OLIMPO</h1>
          <p className="mt-2 text-sm text-muted-foreground">Entre na arena e acompanhe sua evolução</p>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-6 rounded-2xl border border-border bg-surface p-6 shadow-sm">
          <div className="space-y-4">
            <div>
              <input
                type="email"
                placeholder="E-mail"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-xl border border-border bg-background px-4 py-3.5 text-sm font-medium outline-none transition-all focus:border-transparent focus:ring-2 focus:ring-primary"
                required
              />
            </div>
            <div>
              <input
                type="password"
                placeholder="Senha"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-xl border border-border bg-background px-4 py-3.5 text-sm font-medium outline-none transition-all focus:border-transparent focus:ring-2 focus:ring-primary"
                required
              />
            </div>
          </div>

          {error && <p className="text-center text-sm font-semibold text-destructive">{error}</p>}
          
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-primary py-3.5 text-sm font-bold text-black shadow-sm transition-transform hover:bg-primary/90 active:scale-95 disabled:opacity-50 disabled:active:scale-100"
          >
            {loading ? 'Entrando...' : 'Entrar'}
          </button>
        </form>

        <p className="mt-8 text-center text-sm font-medium text-muted-foreground">
          Não tem conta?{' '}
          <Link href="/register" className="text-primary hover:underline">
            Criar conta
          </Link>
        </p>
      </div>
    </div>
  );
}
