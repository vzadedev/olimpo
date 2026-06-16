'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery } from '@apollo/client';
import Link from 'next/link';
import { Crown, Dumbbell, Trophy } from 'lucide-react';
import type { Gym, User } from '@gymrank/types';
import { useAuthStore } from '@/store/auth';
import { GYMS, ME } from '@/lib/graphql';
import { mediaUrl } from '@/lib/media';

export default function HomePage() {
  const router = useRouter();
  const token = useAuthStore((s) => s.token);
  const { data: gymsData, loading, error } = useQuery<{ gyms: Gym[] }>(GYMS);
  const { data: meData } = useQuery<{ me: User }>(ME, { skip: !token });

  useEffect(() => {
    if (!token) router.replace('/onboarding');
  }, [token, router]);

  const user = meData?.me;

  return (
    <div className="px-2 pt-4 pb-20">
      <header className="mb-6">
        <h1 className="text-2xl font-bold">OLIMPO</h1>
        <p className="text-sm text-muted-foreground">Prove seu valor. Competição e ranking nas academias</p>
      </header>

      {user && (
        <div className="mb-6 rounded-2xl border border-primary/30 bg-primary/5 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Olá, {user.name ?? 'Atleta'}</p>
              <p className="mt-1 flex items-center gap-2 text-xl font-black text-primary">
                <Trophy size={20} />
                {user.globalRank ?? 'Bronze'}
              </p>
              <p className="text-xs text-muted-foreground">{user.globalScore ?? 0} pontos</p>
            </div>
            {user.exerciseTitles && user.exerciseTitles.length > 0 && (
              <div className="text-right">
                <p className="text-xs font-semibold text-primary">Título em disputa</p>
                <p className="mt-1 flex items-center justify-end gap-1 text-sm font-bold">
                  <Crown size={14} />
                  {user.exerciseTitles[0].title}
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      <section>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold">Academias</h2>
          <Link href="/gym" className="text-sm font-medium text-primary">
            Ver todas →
          </Link>
        </div>

        {loading && <p className="text-muted-foreground">Carregando...</p>}
        {error && <p className="text-destructive">Erro ao carregar academias</p>}

        <ul className="space-y-3">
          {gymsData?.gyms.map((gym) => (
            <li key={gym.id}>
              <Link
                href={`/gym/${gym.id}`}
                className="flex items-center gap-4 rounded-2xl border border-border bg-surface p-4 transition active:scale-[0.98]"
              >
                <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-primary/10">
                  {gym.photoUrl ? (
                    <img
                      src={mediaUrl(gym.photoUrl)!}
                      alt={gym.name}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <Dumbbell className="text-primary" size={24} />
                  )}
                </div>
                <div>
                  <p className="font-bold">{gym.name}</p>
                  <p className="text-sm text-muted-foreground">Competir e subir no ranking</p>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
