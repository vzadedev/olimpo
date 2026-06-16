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
        toast.success('Conta criada! Hora de subir no ranking.');
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
    <div className="flex min-h-[80vh] flex-col justify-center px-4 py-8">
      <div className="mx-auto w-full max-w-md">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-black tracking-tight">Criar conta</h1>
          <p className="mt-2 text-sm text-muted-foreground">Junte-se à competição do OLIMPO</p>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-6 rounded-2xl border border-border bg-surface p-6 shadow-sm">
          <div className="space-y-4">
            <div>
              <input
                type="text"
                placeholder="Nome de atleta (opcional)"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full rounded-xl border border-border bg-background px-4 py-3.5 text-sm font-medium outline-none transition-all focus:border-transparent focus:ring-2 focus:ring-primary"
              />
            </div>
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
                placeholder="Senha (mín. 6 caracteres)"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-xl border border-border bg-background px-4 py-3.5 text-sm font-medium outline-none transition-all focus:border-transparent focus:ring-2 focus:ring-primary"
                minLength={6}
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
            {loading ? 'Criando...' : 'Criar conta'}
          </button>
        </form>

        <p className="mt-8 text-center text-sm font-medium text-muted-foreground">
          Já tem conta?{' '}
          <Link href="/login" className="text-primary hover:underline">
            Entrar
          </Link>
        </p>
      </div>
    </div>
  );
}
