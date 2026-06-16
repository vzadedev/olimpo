'use client';

import { useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery } from '@apollo/client';
import Link from 'next/link';
import { ChevronLeft, Crown, Trophy } from 'lucide-react';
import type { GymExerciseScore } from '@gymrank/types';
import { useAuthStore } from '@/store/auth';
import { GYMS, GYM_EXERCISES } from '@/lib/graphql';
import { cn } from '@/lib/utils';

export default function GymExercisesPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const token = useAuthStore((s) => s.token);

  const { data: gymsData } = useQuery(GYMS);
  const gym = gymsData?.gyms.find((g: { id: string }) => g.id === id);

  const { data, loading, error } = useQuery<{ gymExercises: GymExerciseScore[] }>(
    GYM_EXERCISES,
    { variables: { gymId: id }, skip: !token },
  );

  useEffect(() => {
    if (!token) router.replace('/login');
  }, [token, router]);

  if (!token) return null;

  return (
    <div className="px-2 pt-4 pb-20">
      <header className="mb-6 flex items-center gap-3">
        <Link
          href="/gym"
          className="flex h-10 w-10 items-center justify-center rounded-full bg-surface"
        >
          <ChevronLeft size={20} />
        </Link>
        <div>
          <h1 className="text-xl font-bold">{gym?.name ?? 'Academia'}</h1>
          <p className="text-xs text-muted-foreground">Escolha um exercício para competir</p>
        </div>
      </header>

      {loading && <p className="text-muted-foreground">Carregando...</p>}
      {error && <p className="text-destructive">Erro ao carregar exercícios</p>}

      <ul className="space-y-3">
        {data?.gymExercises.map((ex) => (
          <li key={ex.exerciseId}>
            <Link
              href={`/gym/${id}/exercise/${ex.exerciseId}`}
              className="block rounded-2xl border border-border bg-surface p-4"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-bold">{ex.exerciseName}</p>
                  {ex.leaderTitle && (
                    <p className="mt-1 flex items-center gap-1 text-xs text-primary">
                      <Crown size={12} /> {ex.leaderTitle}
                    </p>
                  )}
                </div>
                <div className="text-right">
                  <p className="text-2xl font-black text-primary">{ex.myScore}</p>
                  <p className="text-xs text-muted-foreground">
                    {ex.myRank > 0 ? `#${ex.myRank}` : 'Fora do ranking'}
                  </p>
                </div>
              </div>
              {ex.myBestWeight > 0 && (
                <p className="mt-2 text-xs text-muted-foreground">
                  Recorde: {ex.myBestWeight}kg
                </p>
              )}
            </Link>
          </li>
        ))}
      </ul>

      <Link
        href={`/submit?gymId=${id}`}
        className={cn(
          'mt-6 flex w-full items-center justify-center gap-2 rounded-full bg-primary py-4 font-bold text-black',
        )}
      >
        <Trophy size={20} />
        Provar meu valor
      </Link>
    </div>
  );
}
