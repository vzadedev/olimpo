'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { gql, useMutation, useQuery } from '@apollo/client';
import Link from 'next/link';
import { Check, ChevronLeft, Timer } from 'lucide-react';
import { useAuthStore } from '@/store/auth';
import {
  COMPLETE_WORKOUT_SET,
  SCHEDULES_FOR_DATE,
  WORKOUT_CALENDAR,
  WORKOUT_STREAK,
} from '@/lib/graphql';
import { toast } from '@/store/toast';
import { cn } from '@/lib/utils';

const WORKOUT_SESSION = gql`
  query WorkoutSession($sessionId: ID!) {
    workoutSession(sessionId: $sessionId) {
      id
      planName
      completedAt
      sets {
        id
        planExerciseId
        exerciseName
        setNumber
        completed
        reps
        suggestedWeight
        restSeconds
      }
    }
  }
`;

type SessionSet = {
  id: string;
  planExerciseId: string;
  setNumber: number;
  completed: boolean;
  exerciseName: string;
  reps?: number;
  suggestedWeight?: number;
  restSeconds?: number;
};

export default function WorkoutSessionPage() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const router = useRouter();
  const token = useAuthStore((s) => s.token);
  const [restSecondsLeft, setRestSecondsLeft] = useState<number | null>(null);

  const { data, refetch } = useQuery(WORKOUT_SESSION, {
    variables: { sessionId },
    skip: !token,
  });
  const [completeSet] = useMutation(COMPLETE_WORKOUT_SET);

  useEffect(() => {
    if (!token) router.replace('/login');
  }, [token, router]);

  useEffect(() => {
    if (restSecondsLeft === null || restSecondsLeft <= 0) return;
    const timer = setInterval(() => {
      setRestSecondsLeft((s) => {
        if (s === null || s <= 1) return null;
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [restSecondsLeft]);

  const session = data?.workoutSession;

  if (!token) return null;
  if (!session) {
    return <p className="p-4 text-muted-foreground">Carregando treino...</p>;
  }

  const grouped = new Map<string, SessionSet[]>();
  for (const set of session.sets ?? []) {
    const list = grouped.get(set.exerciseName) ?? [];
    list.push(set);
    grouped.set(set.exerciseName, list);
  }

  const totalSets = session.sets?.length ?? 0;
  const completedSets = session.sets?.filter((s: SessionSet) => s.completed).length ?? 0;
  const progressPct = totalSets > 0 ? (completedSets / totalSets) * 100 : 0;

  const toggleSet = async (set: SessionSet) => {
    if (set.completed) return;
    const pendingBefore = session.sets.filter((s: SessionSet) => !s.completed).length;
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth() + 1;
    const todayKey = `${year}-${String(month).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

    try {
      const { data: result } = await completeSet({
        variables: {
          sessionId,
          planExerciseId: set.planExerciseId,
          setNumber: set.setNumber,
        },
        refetchQueries:
          pendingBefore === 1
            ? [
                { query: WORKOUT_CALENDAR, variables: { year, month } },
                { query: WORKOUT_STREAK },
                { query: SCHEDULES_FOR_DATE, variables: { date: todayKey } },
              ]
            : [],
      });
      await refetch();

      const remainingInExercise = session.sets.filter(
        (s: SessionSet) =>
          s.planExerciseId === set.planExerciseId &&
          s.setNumber > set.setNumber &&
          !s.completed,
      );
      if (remainingInExercise.length > 0 && set.restSeconds && set.restSeconds > 0) {
        setRestSecondsLeft(set.restSeconds);
      }

      if (pendingBefore === 1 || result?.completeWorkoutSet?.completedAt) {
        setRestSecondsLeft(null);
        toast.success('Treino concluído!');
      }
    } catch {
      toast.error('Erro ao marcar série');
    }
  };

  return (
    <div className="px-2 pt-4 pb-24">
      <header className="mb-4 flex items-center gap-3">
        <Link
          href="/workouts"
          className="flex h-10 w-10 items-center justify-center rounded-full bg-surface"
        >
          <ChevronLeft size={20} />
        </Link>
        <div className="flex-1">
          <h1 className="text-xl font-bold">{session.planName}</h1>
          <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-primary transition-all"
              style={{ width: `${progressPct}%` }}
            />
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            {completedSets}/{totalSets} séries
            {session.completedAt && ' · Concluído!'}
          </p>
        </div>
      </header>

      {restSecondsLeft !== null && restSecondsLeft > 0 && (
        <div className="mb-4 flex items-center justify-center gap-2 rounded-2xl border border-primary/40 bg-primary/10 py-4">
          <Timer className="text-primary" size={20} />
          <span className="text-2xl font-black text-primary">{restSecondsLeft}s</span>
          <span className="text-sm text-muted-foreground">de descanso</span>
          <button
            type="button"
            onClick={() => setRestSecondsLeft(null)}
            className="ml-2 text-xs text-primary underline"
          >
            Pular
          </button>
        </div>
      )}

      {Array.from(grouped.entries()).map(([name, sets]) => (
        <section key={name} className="mb-6">
          <h2 className="mb-2 font-bold">{name}</h2>
          <ul className="space-y-2">
            {sets.map((s) => (
              <li key={s.id}>
                <button
                  type="button"
                  disabled={s.completed}
                  onClick={() => toggleSet(s)}
                  className={cn(
                    'flex w-full items-center justify-between rounded-xl border px-4 py-3 text-left transition-colors',
                    s.completed
                      ? 'border-primary/40 bg-primary/10'
                      : 'border-border bg-surface active:scale-[0.99]',
                  )}
                >
                  <div>
                    <span className="font-medium">Série {s.setNumber}</span>
                    {(s.reps || s.suggestedWeight) && (
                      <p className="text-xs text-muted-foreground">
                        {s.reps ? `${s.reps} reps` : ''}
                        {s.suggestedWeight ? ` · ${s.suggestedWeight}kg` : ''}
                      </p>
                    )}
                  </div>
                  {s.completed && <Check size={18} className="text-primary" />}
                </button>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
