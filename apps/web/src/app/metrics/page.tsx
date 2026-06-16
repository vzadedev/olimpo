'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation, useQuery } from '@apollo/client';
import Link from 'next/link';
import { ChevronLeft, Plus, Target, Trophy } from 'lucide-react';
import { useAuthStore } from '@/store/auth';
import {
  CREATE_GOAL,
  DELETE_GOAL,
  MY_GOALS,
  MY_METRICS,
} from '@/lib/graphql';
import { toast } from '@/store/toast';
import { Sheet } from '@/components/ui/overlay';

export default function MetricsPage() {
  const router = useRouter();
  const token = useAuthStore((s) => s.token);
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState('');
  const [targetValue, setTargetValue] = useState('');
  const [unit, setUnit] = useState('kg');

  const { data: metricsData, loading: metricsLoading, refetch: refetchMetrics } = useQuery(MY_METRICS, { skip: !token });
  const { data: goalsData, refetch: refetchGoals } = useQuery(MY_GOALS, {
    variables: { status: 'in_progress' },
    skip: !token,
  });

  const [createGoal, { loading: creating }] = useMutation(CREATE_GOAL, {
    refetchQueries: [{ query: MY_GOALS, variables: { status: 'in_progress' } }, { query: MY_METRICS }],
    awaitRefetchQueries: true,
  });
  const [deleteGoal] = useMutation(DELETE_GOAL, {
    refetchQueries: [{ query: MY_GOALS, variables: { status: 'in_progress' } }],
    awaitRefetchQueries: true,
  });

  useEffect(() => {
    if (!token) router.replace('/login');
  }, [token, router]);

  if (!token) return null;

  const metrics = metricsData?.myMetrics;
  const goals = goalsData?.myGoals ?? [];

  const handleCreateGoal = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createGoal({
        variables: {
          input: {
            title,
            targetValue: parseFloat(targetValue),
            unit,
          },
        },
      });
      setShowForm(false);
      setTitle('');
      setTargetValue('');
      refetchGoals();
      toast.success('Objetivo criado!');
    } catch {
      toast.error('Erro ao criar objetivo');
    }
  };

  return (
    <div className="px-2 pt-4 pb-24">
      <header className="mb-6 flex items-center gap-3">
        <Link href="/settings" className="flex h-10 w-10 items-center justify-center rounded-full bg-surface">
          <ChevronLeft size={20} />
        </Link>
        <h1 className="text-2xl font-bold">Métricas & Objetivos</h1>
      </header>

      {metricsLoading && <p className="text-muted-foreground">Carregando...</p>}

      {metrics && (
        <>
          <section className="mb-6 grid grid-cols-2 gap-3">
            <div className="rounded-2xl border border-border bg-surface p-4">
              <p className="text-xs text-muted-foreground">Este mês</p>
              <p className="text-2xl font-black text-primary">{metrics.submissionsThisMonth}</p>
              <p className="text-xs">levantamentos</p>
            </div>
            <div className="rounded-2xl border border-border bg-surface p-4">
              <p className="text-xs text-muted-foreground">Sequência</p>
              <p className="text-2xl font-black text-primary">{metrics.currentStreak}</p>
              <p className="text-xs">dias · recorde {metrics.longestStreak}</p>
            </div>
          </section>

          {(metrics.currentWeightKg || metrics.currentBmi) && (
            <section className="mb-6 rounded-2xl border border-border bg-surface p-4">
              <div className="mb-3 flex items-center justify-between">
                <h2 className="font-bold">Corpo & IMC</h2>
                <Link href="/settings" className="text-xs font-semibold text-primary">
                  Atualizar
                </Link>
              </div>
              <div className="mb-4 grid grid-cols-3 gap-2 text-center text-sm">
                <div>
                  <p className="text-xs text-muted-foreground">Peso</p>
                  <p className="font-bold">{metrics.currentWeightKg ?? '—'} kg</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Altura</p>
                  <p className="font-bold">{metrics.currentHeightCm ?? '—'} cm</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">IMC</p>
                  <p className="font-bold text-primary">{metrics.currentBmi ?? '—'}</p>
                </div>
              </div>
              {metrics.bodyMetricHistory?.length > 1 && (
                <>
                  <p className="mb-2 text-xs text-muted-foreground">Evolução do peso</p>
                  <div className="flex h-20 items-end gap-1">
                    {[...metrics.bodyMetricHistory].reverse().map((p: {
                      recordedAt: string;
                      weightKg: number;
                    }) => {
                      const minW = Math.min(...metrics.bodyMetricHistory.map((x: { weightKg: number }) => x.weightKg));
                      const maxW = Math.max(...metrics.bodyMetricHistory.map((x: { weightKg: number }) => x.weightKg));
                      const range = maxW - minW || 1;
                      return (
                        <div key={p.recordedAt} className="flex flex-1 flex-col items-center gap-1">
                          <div
                            className="w-full rounded-t bg-primary/80"
                            style={{
                              height: `${Math.max(12, ((p.weightKg - minW) / range) * 100)}%`,
                            }}
                          />
                          <span className="text-[9px] text-muted-foreground">
                            {new Date(p.recordedAt).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </>
              )}
            </section>
          )}

          <section className="mb-6">
            <div className="space-y-2">
              {metrics.weeklyProgress.map((w: { weekLabel: string; submissions: number; totalVolume: number }) => (
                <div key={w.weekLabel} className="rounded-xl border border-border bg-surface p-3">
                  <div className="flex justify-between text-sm">
                    <span>{w.weekLabel}</span>
                    <span className="text-primary">{w.submissions} treinos</span>
                  </div>
                  <div className="mt-2 h-2 rounded-full bg-muted">
                    <div
                      className="h-full rounded-full bg-primary"
                      style={{
                        width: `${Math.min(100, (w.submissions / Math.max(1, metrics.submissionsThisMonth)) * 100)}%`,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="mb-6">
            <h2 className="mb-3 font-bold">Peso máximo por exercício</h2>
            <ul className="space-y-2">
              {metrics.maxWeightByExercise.map((e: { exerciseName: string; maxWeight: number }) => (
                <li key={e.exerciseName} className="flex justify-between rounded-xl border border-border bg-surface px-4 py-3">
                  <span>{e.exerciseName}</span>
                  <span className="font-bold text-primary">{e.maxWeight}kg</span>
                </li>
              ))}
            </ul>
          </section>

          <section className="mb-6">
            <h2 className="mb-3 flex items-center gap-2 font-bold">
              <Trophy size={18} /> Conquistas
            </h2>
            <div className="flex flex-wrap gap-2">
              {metrics.badges.map((b: { id: string; title: string; description: string }) => (
                <span key={b.id} className="rounded-full border border-primary/40 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                  {b.title}
                </span>
              ))}
            </div>
          </section>
        </>
      )}

      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="flex items-center gap-2 font-bold">
            <Target size={18} /> Objetivos
          </h2>
          <button
            type="button"
            onClick={() => setShowForm(true)}
            className="flex items-center gap-1 text-sm text-primary"
          >
            <Plus size={16} /> Novo
          </button>
        </div>

        <ul className="space-y-3">
          {goals.map((g: {
            id: string;
            title: string;
            currentValue: number;
            targetValue: number;
            unit: string;
            progressPercent: number;
          }) => (
            <li key={g.id} className="rounded-2xl border border-border bg-surface p-4">
              <div className="flex justify-between">
                <p className="font-bold">{g.title}</p>
                <button
                  type="button"
                  className="text-xs text-destructive"
                  onClick={async () => {
                    await deleteGoal({ variables: { goalId: g.id } });
                    refetchGoals();
                  }}
                >
                  Remover
                </button>
              </div>
              <p className="text-sm text-muted-foreground">
                {g.currentValue} / {g.targetValue} {g.unit}
              </p>
              <div className="mt-2 h-2 rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-primary transition-all"
                  style={{ width: `${g.progressPercent}%` }}
                />
              </div>
            </li>
          ))}
        </ul>

        {metrics?.completedGoals?.length > 0 && (
          <div className="mt-6">
            <h3 className="mb-2 text-sm font-bold text-primary">Objetivos concluídos</h3>
            <ul className="space-y-1 text-sm text-muted-foreground">
              {metrics.completedGoals.map((g: { id: string; title: string; completedAt?: string }) => (
                <li key={g.id}>✓ {g.title}</li>
              ))}
            </ul>
          </div>
        )}
      </section>

      <Sheet open={showForm} onClose={() => setShowForm(false)} title="Novo objetivo">
        <form onSubmit={handleCreateGoal} className="space-y-3 px-4 pb-safe">
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Ex: Levantar 100kg no supino"
            className="w-full rounded-xl border border-border bg-background px-4 py-3 outline-none focus:ring-2 focus:ring-primary"
            required
          />
          <div className="flex gap-2">
            <input
              type="number"
              value={targetValue}
              onChange={(e) => setTargetValue(e.target.value)}
              placeholder="Meta"
              className="flex-1 rounded-xl border border-border bg-background px-4 py-3 outline-none focus:ring-2 focus:ring-primary"
              required
            />
            <select
              value={unit}
              onChange={(e) => setUnit(e.target.value)}
              className="rounded-xl border border-border bg-background px-3 py-3"
            >
              <option value="kg">kg</option>
              <option value="reps">reps</option>
              <option value="pts">pts</option>
              <option value="treinos">treinos</option>
            </select>
          </div>
          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="flex-1 rounded-xl border border-border py-3 font-medium"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={creating}
              className="flex-1 rounded-xl bg-primary py-3 font-semibold text-black disabled:opacity-50"
            >
              {creating ? 'Salvando...' : 'Salvar objetivo'}
            </button>
          </div>
        </form>
      </Sheet>
    </div>
  );
}
