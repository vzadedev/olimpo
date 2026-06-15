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
        toast.success('Login realizado!');
        router.push('/');
      }
    } catch {
      toast.error('Email ou senha inválidos');
    }
  };

  return (
    <div className="flex min-h-[70vh] flex-col justify-center">
      <h1 className="mb-8 text-center text-3xl font-bold">GymRank</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full rounded-xl bg-surface px-4 py-3 outline-none ring-accent focus:ring-2"
          required
        />
        <input
          type="password"
          placeholder="Senha"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full rounded-xl bg-surface px-4 py-3 outline-none ring-accent focus:ring-2"
          required
        />
        {error && <p className="text-center text-sm text-red-400">{error}</p>}
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-xl bg-accent py-3 font-semibold text-black disabled:opacity-50"
        >
          {loading ? 'Entrando...' : 'Entrar'}
        </button>
      </form>
      <p className="mt-6 text-center text-sm text-muted-foreground">
        Não tem conta?{' '}
        <Link href="/register" className="font-medium text-primary">
          Criar conta
        </Link>
      </p>
    </div>
  );
}
