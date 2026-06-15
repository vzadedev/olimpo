'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useMutation } from '@apollo/client';
import type { AuthPayload } from '@gymrank/types';
import { useAuthStore } from '@/store/auth';
import { toast } from '@/store/toast';
import { REGISTER } from '@/lib/graphql';

export default function RegisterPage() {
  const router = useRouter();
  const login = useAuthStore((s) => s.login);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const [registerMutation, { loading }] = useMutation<
    { register: AuthPayload },
    { input: { email: string; password: string; name?: string } }
  >(REGISTER);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      const { data } = await registerMutation({
        variables: {
          input: {
            email,
            password,
            name: name.trim() || undefined,
          },
        },
      });
      if (data?.register.accessToken) {
        login(data.register.accessToken);
        toast.success('Conta criada com sucesso!');
        router.push('/');
      }
    } catch (err: unknown) {
      const gqlError =
        err &&
        typeof err === 'object' &&
        'graphQLErrors' in err &&
        Array.isArray((err as { graphQLErrors: { message: string }[] }).graphQLErrors)
          ? (err as { graphQLErrors: { message: string }[] }).graphQLErrors[0]?.message
          : null;
      toast.error(gqlError ?? 'Não foi possível criar a conta');
    }
  };

  return (
    <div className="flex min-h-[80vh] flex-col justify-center px-2">
      <h1 className="mb-2 text-center text-3xl font-bold">Criar conta</h1>
      <p className="mb-8 text-center text-sm text-muted-foreground">
        Junte-se ao GymRank
      </p>
      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          type="text"
          placeholder="Nome (opcional)"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full rounded-xl border border-border bg-surface px-4 py-3 outline-none focus:ring-2 focus:ring-primary"
        />
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full rounded-xl border border-border bg-surface px-4 py-3 outline-none focus:ring-2 focus:ring-primary"
          required
        />
        <input
          type="password"
          placeholder="Senha (mín. 6 caracteres)"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full rounded-xl border border-border bg-surface px-4 py-3 outline-none focus:ring-2 focus:ring-primary"
          minLength={6}
          required
        />
        {error && <p className="text-center text-sm text-destructive">{error}</p>}
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-xl bg-primary py-3 font-semibold text-black disabled:opacity-50"
        >
          {loading ? 'Criando...' : 'Criar conta'}
        </button>
      </form>
      <p className="mt-6 text-center text-sm text-muted-foreground">
        Já tem conta?{' '}
        <Link href="/login" className="font-medium text-primary">
          Entrar
        </Link>
      </p>
    </div>
  );
}
