'use client';

import { useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery } from '@apollo/client';
import Link from 'next/link';
import { ChevronLeft, Crown, Plus } from 'lucide-react';
import type { RankingEntry, WorkoutEntry } from '@gymrank/types';
import { useAuthStore } from '@/store/auth';
import { EXERCISE_WORKOUTS, GYM_EXERCISES, RANKING } from '@/lib/graphql';
import { cn } from '@/lib/utils';

export default function ExerciseDetailPage() {
  const { id: gymId, exerciseId } = useParams<{ id: string; exerciseId: string }>();
  const router = useRouter();
  const token = useAuthStore((s) => s.token);

  const { data: exercisesData } = useQuery(GYM_EXERCISES, {
    variables: { gymId },
    skip: !token,
  });
  const exercise = exercisesData?.gymExercises.find(
    (e: { exerciseId: string }) => e.exerciseId === exerciseId,
  );

  const { data: rankingData, loading: rankingLoading } = useQuery<{
    getRanking: RankingEntry[];
  }>(RANKING, {
    variables: { gymId, exerciseId },
  });

  const { data: workoutsData, loading: workoutsLoading } = useQuery<{
    exerciseWorkouts: WorkoutEntry[];
  }>(EXERCISE_WORKOUTS, {
    variables: { gymId, exerciseId },
  });

  useEffect(() => {
    if (!token) router.replace('/login');
  }, [token, router]);

  if (!token) return null;

  const ranking = rankingData?.getRanking ?? [];
  const workouts = workoutsData?.exerciseWorkouts ?? [];

  return (
    <div className="px-2 pt-4 pb-20">
      <header className="mb-6 flex items-center gap-3">
        <Link
          href={`/gym/${gymId}`}
          className="flex h-10 w-10 items-center justify-center rounded-full bg-surface"
        >
          <ChevronLeft size={20} />
        </Link>
        <div>
          <h1 className="text-xl font-bold">{exercise?.exerciseName ?? 'Exercício'}</h1>
          <p className="text-xs text-primary">Ranking e levantamentos</p>
        </div>
      </header>

      <section className="mb-8">
        <h2 className="mb-3 text-lg font-bold">🏆 Ranking</h2>
        {rankingLoading && <p className="text-sm text-muted-foreground">Carregando...</p>}
        <ul className="space-y-2">
          {ranking.map((entry) => (
            <li
              key={entry.id}
              className={cn(
                'flex items-center justify-between rounded-xl border border-border bg-surface px-4 py-3',
                entry.rank === 1 && 'border-primary/40 bg-primary/5',
              )}
            >
              <div className="flex items-center gap-3">
                <span
                  className={cn(
                    'flex h-8 w-8 items-center justify-center rounded-full text-sm font-black',
                    entry.rank === 1 ? 'bg-primary text-black' : 'bg-muted text-muted-foreground',
                  )}
                >
                  {entry.rank}
                </span>
                <div>
                  <p className="font-semibold">{entry.userName ?? entry.userEmail.split('@')[0]}</p>
                  {entry.title && (
                    <p className="flex items-center gap-1 text-xs text-primary">
                      <Crown size={10} /> {entry.title}
                    </p>
                  )}
                </div>
              </div>
              <div className="text-right">
                <p className="text-xl font-black text-primary">{entry.score}</p>
                <p className="text-xs text-muted-foreground">
                  {entry.weight}kg × {entry.reps}
                </p>
              </div>
            </li>
          ))}
        </ul>
      </section>

      <section>
        <h2 className="mb-3 text-lg font-bold">📋 Histórico de levantamentos</h2>
        {workoutsLoading && <p className="text-sm text-muted-foreground">Carregando...</p>}
        {workouts.length === 0 && !workoutsLoading && (
          <p className="text-sm text-muted-foreground">Ninguém registrou levantamentos ainda. Seja o primeiro!</p>
        )}
        <ul className="space-y-2">
          {workouts.map((w) => (
            <li
              key={w.id}
              className="rounded-xl border border-border bg-surface px-4 py-3"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold">{w.userName}</p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(w.createdAt).toLocaleDateString('pt-BR')}
                  </p>
                  {w.title && (
                    <p className="mt-1 text-xs text-primary">{w.title}</p>
                  )}
                </div>
                <div className="text-right">
                  <p className="text-lg font-black">{w.weight}kg</p>
                  <p className="text-xs text-muted-foreground">{w.reps} rep. · {w.score} pts</p>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </section>

      <Link
        href={`/submit?gymId=${gymId}&exerciseId=${exerciseId}`}
        className="mt-6 flex w-full items-center justify-center gap-2 rounded-full bg-primary py-4 font-bold text-black"
      >
        <Plus size={20} />
        Novo levantamento
      </Link>
    </div>
  );
}
