'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation, useQuery } from '@apollo/client';
import Link from 'next/link';
import { ChevronLeft, ChevronRight, Plus, Trash2 } from 'lucide-react';
import { useAuthStore } from '@/store/auth';
import {
  CREATE_WORKOUT_PLAN,
  DELETE_WORKOUT_PLAN,
  MY_WORKOUT_PLANS,
} from '@/lib/graphql';
import { toast } from '@/store/toast';
import { Sheet } from '@/components/ui/overlay';

export default function WorkoutsPage() {
  const router = useRouter();
  const token = useAuthStore((s) => s.token);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [showForm, setShowForm] = useState(false);

  const { data, loading, refetch } = useQuery(MY_WORKOUT_PLANS, { skip: !token });
  const [createPlan, { loading: creating }] = useMutation(CREATE_WORKOUT_PLAN);
  const [deletePlan] = useMutation(DELETE_WORKOUT_PLAN);

  useEffect(() => {
    if (!token) router.replace('/login');
  }, [token, router]);

  if (!token) return null;

  const plans = data?.myWorkoutPlans ?? [];

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const { data: result } = await createPlan({
        variables: { input: { name, description: description.trim() || undefined } },
      });
      setShowForm(false);
      setName('');
      setDescription('');
      refetch();
      router.push(`/workouts/${result.createWorkoutPlan.id}`);
    } catch {
      toast.error('Erro ao criar planilha');
    }
  };

  return (
    <div className="px-2 pt-4 pb-24">
      <header className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/settings" className="flex h-10 w-10 items-center justify-center rounded-full bg-surface">
            <ChevronLeft size={20} />
          </Link>
          <h1 className="text-2xl font-bold">Meus Treinos</h1>
        </div>
        <Link href="/calendar" className="text-sm text-primary">Calendário</Link>
      </header>

      <button
        type="button"
        onClick={() => setShowForm(true)}
        className="mb-4 flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-primary/50 py-4 text-primary"
      >
        <Plus size={18} /> Nova planilha
      </button>

      {loading && <p className="text-muted-foreground">Carregando...</p>}

      <ul className="space-y-3">
        {plans.map((plan: { id: string; name: string; description?: string; exercises: unknown[] }) => (
          <li key={plan.id} className="rounded-2xl border border-border bg-surface p-4">
            <div className="flex items-start justify-between">
              <Link href={`/workouts/${plan.id}`} className="flex-1">
                <p className="font-bold">{plan.name}</p>
                <p className="text-sm text-muted-foreground">
                  {plan.exercises.length} exercícios
                </p>
              </Link>
              <button
                type="button"
                onClick={async () => {
                  await deletePlan({ variables: { planId: plan.id } });
                  refetch();
                  toast.success('Planilha excluída');
                }}
                className="text-destructive"
              >
                <Trash2 size={16} />
              </button>
            </div>
            <Link
              href={`/workouts/${plan.id}`}
              className="mt-3 flex items-center gap-1 text-sm text-primary"
            >
              Editar <ChevronRight size={14} />
            </Link>
          </li>
        ))}
      </ul>

      <Sheet open={showForm} onClose={() => setShowForm(false)} title="Nova planilha">
        <form onSubmit={handleCreate} className="space-y-3 px-4 pb-safe">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ex: Treino A — Peito e Tríceps"
            className="w-full rounded-xl border border-border bg-background px-4 py-3 outline-none focus:ring-2 focus:ring-primary"
            required
          />
          <input
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Descrição opcional"
            className="w-full rounded-xl border border-border bg-background px-4 py-3 outline-none"
          />
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
              {creating ? 'Criando...' : 'Criar planilha'}
            </button>
          </div>
        </form>
      </Sheet>
    </div>
  );
}
