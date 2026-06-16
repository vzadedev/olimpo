'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useMutation, useQuery } from '@apollo/client';
import Link from 'next/link';
import {
  ChevronDown,
  ChevronLeft,
  ChevronUp,
  GripVertical,
  Play,
  Save,
  Trash2,
} from 'lucide-react';
import { useAuthStore } from '@/store/auth';
import {
  EXERCISE_CATALOG,
  START_WORKOUT_SESSION,
  UPDATE_WORKOUT_PLAN,
  UPDATE_WORKOUT_PLAN_EXERCISES,
  WORKOUT_PLAN,
} from '@/lib/graphql';
import { toast } from '@/store/toast';

type PlanExercise = {
  id?: string;
  exerciseId: string;
  exerciseName?: string;
  muscleGroup?: string;
  sets: number;
  reps: number;
  suggestedWeight?: number;
  restSeconds: number;
  orderIndex: number;
};

export default function WorkoutPlanPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const token = useAuthStore((s) => s.token);
  const [planName, setPlanName] = useState('');
  const [planDescription, setPlanDescription] = useState('');
  const [exercises, setExercises] = useState<PlanExercise[]>([]);
  const [search, setSearch] = useState('');
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [showCatalog, setShowCatalog] = useState(true);

  const { data, loading, refetch } = useQuery(WORKOUT_PLAN, {
    variables: { planId: id },
    skip: !token,
  });
  const { data: catalogData } = useQuery(EXERCISE_CATALOG, {
    variables: { search: search || undefined },
  });
  const [updatePlan] = useMutation(UPDATE_WORKOUT_PLAN);
  const [updateExercises, { loading: saving }] = useMutation(UPDATE_WORKOUT_PLAN_EXERCISES);
  const [startSession] = useMutation(START_WORKOUT_SESSION);

  useEffect(() => {
    if (!token) router.replace('/login');
  }, [token, router]);

  useEffect(() => {
    if (data?.workoutPlan) {
      setPlanName(data.workoutPlan.name);
      setPlanDescription(data.workoutPlan.description ?? '');
      setExercises(data.workoutPlan.exercises);
    }
  }, [data]);

  if (!token) return null;

  const catalog = catalogData?.exerciseCatalog ?? [];
  const filteredCatalog = search
    ? catalog.slice(0, 10)
    : catalog.filter((ex: { isDefault: boolean }) => ex.isDefault).slice(0, 12);

  const addExercise = (exerciseId: string, exerciseName: string, muscleGroup?: string) => {
    if (exercises.some((e) => e.exerciseId === exerciseId)) {
      toast.error('Exercício já adicionado');
      return;
    }
    setExercises((list) => [
      ...list,
      {
        exerciseId,
        exerciseName,
        muscleGroup,
        sets: 3,
        reps: 10,
        restSeconds: 60,
        orderIndex: list.length,
      },
    ]);
    setSearch('');
  };

  const removeExercise = (index: number) => {
    setExercises((list) =>
      list.filter((_, i) => i !== index).map((e, i) => ({ ...e, orderIndex: i })),
    );
  };

  const moveItem = (from: number, to: number) => {
    if (to < 0 || to >= exercises.length) return;
    const next = [...exercises];
    const [item] = next.splice(from, 1);
    next.splice(to, 0, item);
    setExercises(next.map((e, i) => ({ ...e, orderIndex: i })));
  };

  const save = async () => {
    try {
      await updatePlan({
        variables: {
          planId: id,
          input: {
            name: planName.trim(),
            description: planDescription.trim() || null,
          },
        },
      });
      await updateExercises({
        variables: {
          planId: id,
          exercises: exercises.map((e, index) => ({
            exerciseId: e.exerciseId,
            sets: e.sets,
            reps: e.reps,
            suggestedWeight: e.suggestedWeight,
            restSeconds: e.restSeconds,
            orderIndex: index,
          })),
        },
      });
      toast.success('Planilha salva!');
      refetch();
    } catch {
      toast.error('Erro ao salvar');
    }
  };

  const startWorkout = async () => {
    if (exercises.length === 0) {
      toast.error('Adicione exercícios antes de iniciar');
      return;
    }
    try {
      await save();
      const { data: result } = await startSession({ variables: { planId: id } });
      router.push(`/workouts/session/${result.startWorkoutSession.id}`);
    } catch {
      toast.error('Erro ao iniciar treino');
    }
  };

  return (
    <div className="px-2 pt-4 pb-32">
      <header className="mb-4 flex items-center gap-3">
        <Link
          href="/workouts"
          className="flex h-10 w-10 items-center justify-center rounded-full bg-surface"
        >
          <ChevronLeft size={20} />
        </Link>
        <div className="flex-1">
          <input
            value={planName}
            onChange={(e) => setPlanName(e.target.value)}
            className="w-full bg-transparent text-xl font-bold outline-none"
            placeholder="Nome da planilha"
          />
          <input
            value={planDescription}
            onChange={(e) => setPlanDescription(e.target.value)}
            className="mt-1 w-full bg-transparent text-sm text-muted-foreground outline-none"
            placeholder="Descrição opcional"
          />
        </div>
      </header>

      {loading && <p className="text-muted-foreground">Carregando...</p>}

      <section className="mb-4">
        <div className="mb-2 flex items-center justify-between">
          <h2 className="text-sm font-semibold">Exercícios</h2>
          <button
            type="button"
            onClick={() => setShowCatalog((v) => !v)}
            className="text-xs text-primary"
          >
            {showCatalog ? 'Ocultar catálogo' : 'Mostrar catálogo'}
          </button>
        </div>
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar exercício..."
          className="w-full rounded-xl border border-border bg-surface px-4 py-3 outline-none focus:ring-2 focus:ring-primary"
        />
        {showCatalog && filteredCatalog.length > 0 && (
          <ul className="mt-2 max-h-48 overflow-y-auto rounded-xl border border-border bg-surface">
            {filteredCatalog.map(
              (ex: { id: string; name: string; muscleGroup?: string }) => (
                <li key={ex.id}>
                  <button
                    type="button"
                    onClick={() => addExercise(ex.id, ex.name, ex.muscleGroup)}
                    className="flex w-full items-center justify-between px-4 py-2.5 text-left text-sm hover:bg-primary/10"
                  >
                    <span>{ex.name}</span>
                    {ex.muscleGroup && (
                      <span className="text-xs text-muted-foreground">{ex.muscleGroup}</span>
                    )}
                  </button>
                </li>
              ),
            )}
          </ul>
        )}
      </section>

      {exercises.length === 0 ? (
        <p className="mb-4 rounded-xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
          Nenhum exercício na planilha. Busque ou selecione do catálogo acima.
        </p>
      ) : (
        <ul className="mb-4 space-y-3">
          {exercises.map((ex, index) => (
            <li
              key={`${ex.exerciseId}-${index}`}
              draggable
              onDragStart={() => setDragIndex(index)}
              onDragOver={(e) => e.preventDefault()}
              onDrop={() => {
                if (dragIndex !== null && dragIndex !== index) moveItem(dragIndex, index);
                setDragIndex(null);
              }}
              className="rounded-2xl border border-border bg-surface p-4"
            >
              <div className="mb-3 flex items-center gap-2">
                <GripVertical size={16} className="shrink-0 text-muted-foreground" />
                <div className="min-w-0 flex-1">
                  <p className="font-bold">{ex.exerciseName ?? ex.exerciseId}</p>
                  {ex.muscleGroup && (
                    <p className="text-xs text-muted-foreground">{ex.muscleGroup}</p>
                  )}
                </div>
                <div className="flex shrink-0 items-center gap-1">
                  <button
                    type="button"
                    onClick={() => moveItem(index, index - 1)}
                    disabled={index === 0}
                    className="rounded-lg p-1 disabled:opacity-30"
                    aria-label="Mover para cima"
                  >
                    <ChevronUp size={16} />
                  </button>
                  <button
                    type="button"
                    onClick={() => moveItem(index, index + 1)}
                    disabled={index === exercises.length - 1}
                    className="rounded-lg p-1 disabled:opacity-30"
                    aria-label="Mover para baixo"
                  >
                    <ChevronDown size={16} />
                  </button>
                  <button
                    type="button"
                    onClick={() => removeExercise(index)}
                    className="rounded-lg p-1 text-destructive"
                    aria-label="Remover exercício"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2 text-sm sm:grid-cols-4">
                <label>
                  Séries
                  <input
                    type="number"
                    min={1}
                    value={ex.sets}
                    onChange={(e) => {
                      const next = [...exercises];
                      next[index] = { ...ex, sets: parseInt(e.target.value, 10) || 1 };
                      setExercises(next);
                    }}
                    className="mt-1 w-full rounded-lg border border-border bg-background px-2 py-1"
                  />
                </label>
                <label>
                  Reps
                  <input
                    type="number"
                    min={1}
                    value={ex.reps}
                    onChange={(e) => {
                      const next = [...exercises];
                      next[index] = { ...ex, reps: parseInt(e.target.value, 10) || 1 };
                      setExercises(next);
                    }}
                    className="mt-1 w-full rounded-lg border border-border bg-background px-2 py-1"
                  />
                </label>
                <label>
                  Carga (kg)
                  <input
                    type="number"
                    min={0}
                    step={0.5}
                    value={ex.suggestedWeight ?? ''}
                    onChange={(e) => {
                      const next = [...exercises];
                      next[index] = {
                        ...ex,
                        suggestedWeight: parseFloat(e.target.value) || undefined,
                      };
                      setExercises(next);
                    }}
                    className="mt-1 w-full rounded-lg border border-border bg-background px-2 py-1"
                  />
                </label>
                <label>
                  Descanso (s)
                  <input
                    type="number"
                    min={0}
                    step={5}
                    value={ex.restSeconds}
                    onChange={(e) => {
                      const next = [...exercises];
                      next[index] = {
                        ...ex,
                        restSeconds: parseInt(e.target.value, 10) || 0,
                      };
                      setExercises(next);
                    }}
                    className="mt-1 w-full rounded-lg border border-border bg-background px-2 py-1"
                  />
                </label>
              </div>
            </li>
          ))}
        </ul>
      )}

      <div className="fixed bottom-20 left-0 right-0 z-40 mx-auto flex max-w-md gap-2 px-2">
        <button
          type="button"
          onClick={save}
          disabled={saving}
          className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-border bg-background/95 py-3 backdrop-blur"
        >
          <Save size={16} /> {saving ? 'Salvando...' : 'Salvar'}
        </button>
        <button
          type="button"
          onClick={startWorkout}
          disabled={exercises.length === 0}
          className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-primary py-3 font-semibold text-black disabled:opacity-50"
        >
          <Play size={16} /> Iniciar
        </button>
      </div>
    </div>
  );
}
