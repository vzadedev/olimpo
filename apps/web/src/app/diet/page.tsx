'use client';

import { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useApolloClient, useMutation, useQuery } from '@apollo/client';
import { ChevronLeft, Plus, Settings2 } from 'lucide-react';
import { useAuthStore } from '@/store/auth';
import {
  ACTIVE_DIET_PLAN,
  CREATE_DIET_PLAN,
  ACTIVATE_DIET_PLAN,
  DELETE_DIET_PLAN,
  CREATE_MEAL,
  DELETE_MEAL,
  DIET_DASHBOARD,
  DIET_WEEKLY_SUMMARY,
  MY_DIET_PLANS,
  SUGGEST_DIET_GOAL,
  SUGGEST_DIET_GOAL_WITH_AI,
  UPDATE_DIET_GOAL,
} from '@/lib/graphql';
import { toast } from '@/store/toast';
import { getGraphQLErrorMessage } from '@/lib/apollo-utils';
import { cn } from '@/lib/utils';
import { Sheet } from '@/components/ui/overlay';
import { MealCameraCapture } from '@/components/MealCameraCapture';
import { analyzeMealImage } from '@/lib/diet-api';
import { getLocalDateString } from '@/lib/date';

const MEAL_LABELS: Record<string, string> = {
  breakfast: 'Café da manhã',
  lunch: 'Almoço',
  dinner: 'Jantar',
  snack: 'Lanche',
  other: 'Outro',
};

type AnalysisFood = {
  nome: string;
  metodo_preparo?: string;
  quantidade_g?: number;
  quantidade_estimada?: string;
  calorias: number;
  proteina_g: number;
  carboidrato_g: number;
  gordura_g: number;
  fibra_g?: number;
  _baseQuantidadeG?: number;
  _baseMacros?: {
    calorias: number;
    proteina_g: number;
    carboidrato_g: number;
    gordura_g: number;
    fibra_g: number;
  };
};

function withBaseMacros(f: AnalysisFood): AnalysisFood {
  return {
    ...f,
    _baseQuantidadeG: f.quantidade_g ?? f._baseQuantidadeG ?? 100,
    _baseMacros: f._baseMacros ?? {
      calorias: f.calorias,
      proteina_g: f.proteina_g,
      carboidrato_g: f.carboidrato_g,
      gordura_g: f.gordura_g,
      fibra_g: f.fibra_g ?? 0,
    },
  };
}

function scaleFoodQty(f: AnalysisFood, newQty: number): AnalysisFood {
  const base = withBaseMacros(f);
  const baseQty = base._baseQuantidadeG || 100;
  const ratio = newQty / baseQty;
  const m = base._baseMacros!;
  return {
    ...base,
    quantidade_g: newQty,
    calorias: Math.round(m.calorias * ratio),
    proteina_g: Math.round(m.proteina_g * ratio * 10) / 10,
    carboidrato_g: Math.round(m.carboidrato_g * ratio * 10) / 10,
    gordura_g: Math.round(m.gordura_g * ratio * 10) / 10,
    fibra_g: Math.round((m.fibra_g ?? 0) * ratio * 10) / 10,
  };
}

export default function DietPage() {
  const router = useRouter();
  const token = useAuthStore((s) => s.token);
  const [showGoals, setShowGoals] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [previewFile, setPreviewFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [userNote, setUserNote] = useState('');
  const [analyzing, setAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<{
    descricao?: string;
    alimentos?: AnalysisFood[];
    confianca?: string;
    totalCalorias?: number;
    totalProteina?: number;
    totalCarboidrato?: number;
    totalGordura?: number;
  } | null>(null);
  const [mealName, setMealName] = useState('');
  const [mealType, setMealType] = useState('lunch');
  const [foods, setFoods] = useState<AnalysisFood[]>([]);
  const [goalCalories, setGoalCalories] = useState('');
  const [goalProtein, setGoalProtein] = useState('');
  const [goalCarb, setGoalCarb] = useState('');
  const [goalFat, setGoalFat] = useState('');
  const [goalObjective, setGoalObjective] = useState('maintain');
  const [showCamera, setShowCamera] = useState(false);
  const [showPlanForm, setShowPlanForm] = useState(false);
  const [planName, setPlanName] = useState('');
  const [planMeals, setPlanMeals] = useState<Array<{
    dayOfWeek: number;
    mealType: string;
    name: string;
    calories: number;
    proteinG: number;
    carbG: number;
    fatG: number;
  }>>([{ dayOfWeek: new Date().getDay(), mealType: 'lunch', name: '', calories: 0, proteinG: 0, carbG: 0, fatG: 0 }]);
  const galleryInputRef = useRef<HTMLInputElement>(null);
  const client = useApolloClient();
  const today = useMemo(() => getLocalDateString(), []);

  const dietRefetch = [{ query: DIET_DASHBOARD, variables: { date: today } }];

  const { data, refetch } = useQuery(DIET_DASHBOARD, {
    variables: { date: today },
    skip: !token,
    fetchPolicy: 'cache-and-network',
    notifyOnNetworkStatusChange: true,
  });

  const refreshDiet = useCallback(async () => {
    await client.refetchQueries({
      include: ['DietDashboard', 'DietWeeklySummary'],
    });
    await refetch({ date: today });
  }, [client, refetch, today]);
  const { data: weeklyData } = useQuery(DIET_WEEKLY_SUMMARY, { skip: !token });
  const { data: plansData, refetch: refetchPlans } = useQuery(MY_DIET_PLANS, { skip: !token });
  const { data: activePlanData, refetch: refetchActivePlan } = useQuery(ACTIVE_DIET_PLAN, { skip: !token });
  const [createMeal] = useMutation(CREATE_MEAL, {
    refetchQueries: dietRefetch,
    awaitRefetchQueries: true,
    onCompleted: () => {
      void refreshDiet();
    },
  });
  const [deleteMeal] = useMutation(DELETE_MEAL, {
    refetchQueries: dietRefetch,
    awaitRefetchQueries: true,
    onCompleted: () => {
      void refreshDiet();
    },
  });
  const [suggestGoal] = useMutation(SUGGEST_DIET_GOAL, {
    refetchQueries: dietRefetch,
    awaitRefetchQueries: true,
  });
  const [suggestGoalAI] = useMutation(SUGGEST_DIET_GOAL_WITH_AI, {
    refetchQueries: dietRefetch,
    awaitRefetchQueries: true,
  });
  const [updateGoal] = useMutation(UPDATE_DIET_GOAL, {
    refetchQueries: dietRefetch,
    awaitRefetchQueries: true,
  });
  const [createPlan] = useMutation(CREATE_DIET_PLAN);
  const [activatePlan] = useMutation(ACTIVATE_DIET_PLAN);
  const [deletePlan] = useMutation(DELETE_DIET_PLAN);

  useEffect(() => {
    if (!token) router.replace('/login');
  }, [token, router]);

  const dash = data?.dietDashboard;
  const goal = dash?.goal;
  const calPct = goal ? Math.min(100, (dash.caloriesConsumed / goal.caloriesGoal) * 100) : 0;

  const macroTotal = (dash?.proteinG ?? 0) + (dash?.carbG ?? 0) + (dash?.fatG ?? 0) || 1;

  const weekly = weeklyData?.dietWeeklySummary ?? [];
  const maxCal = Math.max(...weekly.map((d: { calories: number }) => d.calories), 1);
  const activePlan = activePlanData?.activeDietPlan;
  const allPlans = plansData?.myDietPlans ?? [];
  const todayDow = new Date().getDay();
  const todayPlanMeals = activePlan?.meals?.filter((m: { dayOfWeek: number }) => m.dayOfWeek === todayDow) ?? [];

  const mealsByType = useMemo(() => {
    const groups: Record<string, typeof dash.meals> = {};
    for (const meal of dash?.meals ?? []) {
      groups[meal.mealType] = groups[meal.mealType] ?? [];
      groups[meal.mealType].push(meal);
    }
    return groups;
  }, [dash?.meals]);

  useEffect(() => {
    if (goal) {
      setGoalCalories(String(goal.caloriesGoal ?? ''));
      setGoalProtein(String(goal.proteinGoalG ?? ''));
      setGoalCarb(String(goal.carbGoalG ?? ''));
      setGoalFat(String(goal.fatGoalG ?? ''));
      setGoalObjective(goal.objective ?? 'maintain');
    }
  }, [goal, showGoals]);

  const foodTotals = useMemo(() => foods.reduce(
    (acc, f) => ({
      calorias: acc.calorias + f.calorias,
      proteina_g: acc.proteina_g + f.proteina_g,
      carboidrato_g: acc.carboidrato_g + f.carboidrato_g,
      gordura_g: acc.gordura_g + f.gordura_g,
    }),
    { calorias: 0, proteina_g: 0, carboidrato_g: 0, gordura_g: 0 },
  ), [foods]);

  const openPreview = (file: File) => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewFile(file);
    setPreviewUrl(URL.createObjectURL(file));
    setShowPreview(true);
  };

  const runAnalyze = async () => {
    if (!previewFile) return;
    setAnalyzing(true);
    try {
      const result = await analyzeMealImage(previewFile, userNote.trim() || undefined, mealType);
      if (result.erro) {
        toast.error(String(result.erro));
        return;
      }
      setAnalysis(result as typeof analysis);
      const items = ((result.alimentos as AnalysisFood[]) ?? []).map((a) => withBaseMacros(a));
      setFoods(items);
      setMealName(String(result.descricao ?? 'Refeição'));
      setShowPreview(false);
      setShowAdd(true);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Erro na análise');
    } finally {
      setAnalyzing(false);
    }
  };

  const handleAnalyze = async (file: File) => {
    openPreview(file);
  };

  const saveMeal = async () => {
    try {
      await createMeal({
        variables: {
          input: {
            name: mealName || 'Refeição',
            mealType,
            eatenAt: new Date().toISOString(),
            aiConfidence: analysis?.confianca,
            foods: foods.map((f) => ({
              foodName: f.nome,
              preparationMethod: f.metodo_preparo,
              quantityG: f.quantidade_g,
              quantityDescription: f.quantidade_estimada,
              calories: f.calorias,
              proteinG: f.proteina_g,
              carbG: f.carboidrato_g,
              fatG: f.gordura_g,
              fiberG: f.fibra_g ?? 0,
              wasEditedByUser: true,
            })),
          },
        },
      });
      toast.success('Refeição registrada no OLIMPO!');
      setShowAdd(false);
      setAnalysis(null);
      setFoods([]);
      setPreviewFile(null);
      setUserNote('');
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
      await refreshDiet();
    } catch {
      toast.error('Erro ao salvar refeição');
    }
  };

  const setObjective = async (objective: string) => {
    try {
      await suggestGoal({ variables: { objective } });
      toast.success('Metas padrão aplicadas!');
      setShowGoals(false);
    } catch (err) {
      toast.error(getGraphQLErrorMessage(err, 'Erro ao definir metas'));
    }
  };

  const setObjectiveAI = async (objective: string) => {
    try {
      await suggestGoalAI({ variables: { objective } });
      toast.success('Metas personalizadas com IA!');
      setShowGoals(false);
    } catch (err) {
      toast.error(getGraphQLErrorMessage(err, 'Erro na recomendação IA'));
    }
  };

  const saveManualGoals = async () => {
    try {
      await updateGoal({
        variables: {
          input: {
            objective: goalObjective,
            caloriesGoal: parseInt(goalCalories, 10),
            proteinGoalG: parseFloat(goalProtein),
            carbGoalG: parseFloat(goalCarb),
            fatGoalG: parseFloat(goalFat),
          },
        },
      });
      toast.success('Metas salvas!');
      setShowGoals(false);
    } catch (err) {
      toast.error(getGraphQLErrorMessage(err, 'Erro ao salvar metas'));
    }
  };

  const savePlan = async () => {
    if (!planName.trim() || planMeals.every((m) => !m.name.trim())) {
      toast.error('Informe nome do plano e ao menos uma refeição');
      return;
    }
    try {
      await createPlan({
        variables: {
          input: {
            name: planName.trim(),
            meals: planMeals.filter((m) => m.name.trim()).map((m) => ({
              dayOfWeek: m.dayOfWeek,
              mealType: m.mealType,
              name: m.name.trim(),
              calories: m.calories,
              proteinG: m.proteinG,
              carbG: m.carbG,
              fatG: m.fatG,
            })),
          },
        },
      });
      toast.success('Plano criado!');
      setShowPlanForm(false);
      setPlanName('');
      refetchPlans();
      refetchActivePlan();
    } catch (err) {
      toast.error(getGraphQLErrorMessage(err, 'Erro ao criar plano'));
    }
  };

  if (!token) return null;

  return (
    <div className="px-2 pt-4 pb-24">
      <header className="mb-4 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Dieta</h1>
          <p className="text-sm text-muted-foreground">OLIMPO · macros do dia</p>
        </div>
        <button
          type="button"
          onClick={() => setShowGoals(true)}
          className="flex h-10 w-10 items-center justify-center rounded-full bg-surface"
        >
          <Settings2 size={18} />
        </button>
      </header>

      <div className="mb-6 flex items-center gap-4 rounded-2xl border border-border bg-surface p-4">
        <div
          className="relative flex h-24 w-24 shrink-0 items-center justify-center rounded-full"
          style={{
            background: `conic-gradient(hsl(var(--primary)) ${calPct}%, hsl(var(--muted)) ${calPct}%)`,
          }}
        >
          <div className="flex h-[4.5rem] w-[4.5rem] flex-col items-center justify-center rounded-full bg-background text-center">
            <span className="text-lg font-black">{Math.round(dash?.caloriesConsumed ?? 0)}</span>
            <span className="text-[10px] text-muted-foreground">/ {goal?.caloriesGoal ?? '—'} kcal</span>
          </div>
        </div>
        <div className="flex-1 space-y-2 text-sm">
          <MacroBar label="Proteína" value={dash?.proteinG ?? 0} goal={goal?.proteinGoalG} color="bg-blue-500" pct={goal?.proteinGoalG ? ((dash?.proteinG ?? 0) / goal.proteinGoalG) * 100 : (dash?.proteinG ?? 0) / macroTotal * 100} />
          <MacroBar label="Carbo" value={dash?.carbG ?? 0} goal={goal?.carbGoalG} color="bg-amber-500" pct={goal?.carbGoalG ? ((dash?.carbG ?? 0) / goal.carbGoalG) * 100 : (dash?.carbG ?? 0) / macroTotal * 100} />
          <MacroBar label="Gordura" value={dash?.fatG ?? 0} goal={goal?.fatGoalG} color="bg-rose-500" pct={goal?.fatGoalG ? ((dash?.fatG ?? 0) / goal.fatGoalG) * 100 : (dash?.fatG ?? 0) / macroTotal * 100} />
        </div>
      </div>

      {!goal && (
        <button
          type="button"
          onClick={() => setShowGoals(true)}
          className="mb-4 w-full rounded-xl border border-primary/40 bg-primary/10 py-3 text-sm font-semibold text-primary"
        >
          Configurar metas de dieta
        </button>
      )}

      <section className="mb-6 rounded-2xl border border-border bg-surface p-4">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-bold">Plano alimentar</h2>
          <button
            type="button"
            onClick={() => setShowPlanForm(true)}
            className="text-xs font-semibold text-primary"
          >
            + Criar plano
          </button>
        </div>
        {activePlan ? (
          <>
            <p className="mb-2 text-sm font-semibold text-primary">{activePlan.name} (ativo)</p>
            {todayPlanMeals.length > 0 ? (
              <ul className="space-y-2 text-sm">
                {todayPlanMeals.map((m: { id: string; name: string; mealType: string; calories: number }) => (
                  <li key={m.id} className="rounded-lg border border-border px-3 py-2">
                    <span className="font-medium">{MEAL_LABELS[m.mealType] ?? m.mealType}: {m.name}</span>
                    <span className="ml-2 text-xs text-muted-foreground">{m.calories} kcal</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground">Nada planejado para hoje neste plano.</p>
            )}
          </>
        ) : (
          <p className="text-sm text-muted-foreground">Crie um plano semanal para seguir suas refeições.</p>
        )}
        {allPlans.length > 0 && (
          <ul className="mt-3 space-y-1 border-t border-border pt-3">
            {allPlans.map((p: { id: string; name: string; isActive: boolean }) => (
              <li key={p.id} className="flex items-center justify-between text-sm">
                <span className={p.isActive ? 'font-semibold text-primary' : ''}>{p.name}</span>
                <div className="flex gap-2">
                  {!p.isActive && (
                    <button
                      type="button"
                      className="text-xs text-primary"
                      onClick={async () => {
                        await activatePlan({ variables: { planId: p.id } });
                        refetchPlans();
                        refetchActivePlan();
                        toast.success('Plano ativado');
                      }}
                    >
                      Ativar
                    </button>
                  )}
                  <button
                    type="button"
                    className="text-xs text-destructive"
                    onClick={async () => {
                      await deletePlan({ variables: { planId: p.id } });
                      refetchPlans();
                      refetchActivePlan();
                    }}
                  >
                    Excluir
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="mb-6">
        <h2 className="mb-2 font-bold">Últimos 7 dias</h2>
        <div className="flex h-24 items-end gap-1 rounded-xl border border-border bg-surface p-3">
          {weekly.map((d: { date: string; calories: number }) => (
            <div key={d.date} className="flex flex-1 flex-col items-center gap-1">
              <div
                className="w-full rounded-t bg-primary/80"
                style={{ height: `${Math.max(8, (d.calories / maxCal) * 100)}%` }}
              />
              <span className="text-[9px] text-muted-foreground">
                {d.date.slice(8, 10)}
              </span>
            </div>
          ))}
        </div>
      </section>

      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-bold">Refeições de hoje</h2>
          <div className="flex gap-2">
            <button
              type="button"
              disabled={analyzing}
              onClick={() => setShowCamera(true)}
              className="rounded-full bg-primary px-3 py-1.5 text-xs font-bold text-black disabled:opacity-50"
            >
              {analyzing ? 'Analisando...' : '📷 Câmera'}
            </button>
            <button
              type="button"
              disabled={analyzing}
              onClick={() => galleryInputRef.current?.click()}
              className="rounded-full border border-border px-3 py-1.5 text-xs font-semibold disabled:opacity-50"
            >
              Galeria
            </button>
            <input
              ref={galleryInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              disabled={analyzing}
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleAnalyze(file);
                e.target.value = '';
              }}
            />
          </div>
        </div>

        {Object.keys(mealsByType).length === 0 ? (
          <p className="text-sm text-muted-foreground">Nenhuma refeição registrada hoje.</p>
        ) : (
          Object.entries(mealsByType).map(([type, meals]) => (
            <div key={type} className="mb-4">
              <p className="mb-2 text-xs font-semibold text-muted-foreground">
                {MEAL_LABELS[type] ?? type}
              </p>
              <ul className="space-y-2">
                {(meals ?? []).map((meal: {
                  id: string;
                  name: string;
                  foods: { foodName: string; calories: number }[];
                }) => (
                  <li
                    key={meal.id}
                    className="flex items-center justify-between rounded-xl border border-border bg-surface p-3"
                  >
                    <div>
                      <p className="font-semibold">{meal.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {meal.foods.reduce((s, f) => s + f.calories, 0).toFixed(0)} kcal ·{' '}
                        {meal.foods.map((f) => f.foodName).join(', ')}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={async () => {
                        await deleteMeal({ variables: { mealId: meal.id } });
                        await refreshDiet();
                      }}
                      className="text-xs text-destructive"
                    >
                      Excluir
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ))
        )}
      </section>

      <Sheet open={showGoals} onClose={() => setShowGoals(false)} title="Metas de dieta">
        <div className="p-4 space-y-4">
        {goal?.aiExplanation && (
          <p className="rounded-xl border border-primary/20 bg-primary/5 p-3 text-xs text-muted-foreground">
            {goal.aiExplanation}
          </p>
        )}
        <p className="text-sm text-muted-foreground">Recomendação com IA (usa peso/altura do perfil):</p>
        <div className="space-y-2">
          {[
            { id: 'lose_weight', label: 'Perder peso' },
            { id: 'maintain', label: 'Manter peso' },
            { id: 'gain_muscle', label: 'Ganhar massa' },
          ].map((o) => (
            <button
              key={o.id}
              type="button"
              onClick={() => setObjectiveAI(o.id)}
              className="w-full rounded-xl border border-primary/30 bg-primary/5 py-3 text-sm font-semibold text-primary"
            >
              ✨ IA — {o.label}
            </button>
          ))}
        </div>
        <p className="text-sm text-muted-foreground">Presets rápidos:</p>
        <div className="space-y-2">
          {[
            { id: 'lose_weight', label: 'Perder peso' },
            { id: 'maintain', label: 'Manter peso' },
            { id: 'gain_muscle', label: 'Ganhar massa' },
          ].map((o) => (
            <button
              key={`preset-${o.id}`}
              type="button"
              onClick={() => setObjective(o.id)}
              className="w-full rounded-xl border border-border bg-surface py-3 text-sm font-semibold"
            >
              {o.label}
            </button>
          ))}
        </div>
        <div className="border-t border-border pt-4">
          <p className="mb-3 text-sm font-semibold">Ajuste manual</p>
          <select
            value={goalObjective}
            onChange={(e) => setGoalObjective(e.target.value)}
            className="mb-3 w-full rounded-xl border border-border bg-background px-3 py-2 text-sm"
          >
            <option value="lose_weight">Perder peso</option>
            <option value="maintain">Manter peso</option>
            <option value="gain_muscle">Ganhar massa</option>
          </select>
          <div className="grid grid-cols-2 gap-2">
            <label className="text-xs">
              Calorias
              <input type="number" value={goalCalories} onChange={(e) => setGoalCalories(e.target.value)} className="mt-1 w-full rounded-lg border border-border bg-background px-2 py-1.5 text-sm" />
            </label>
            <label className="text-xs">
              Proteína (g)
              <input type="number" value={goalProtein} onChange={(e) => setGoalProtein(e.target.value)} className="mt-1 w-full rounded-lg border border-border bg-background px-2 py-1.5 text-sm" />
            </label>
            <label className="text-xs">
              Carbo (g)
              <input type="number" value={goalCarb} onChange={(e) => setGoalCarb(e.target.value)} className="mt-1 w-full rounded-lg border border-border bg-background px-2 py-1.5 text-sm" />
            </label>
            <label className="text-xs">
              Gordura (g)
              <input type="number" value={goalFat} onChange={(e) => setGoalFat(e.target.value)} className="mt-1 w-full rounded-lg border border-border bg-background px-2 py-1.5 text-sm" />
            </label>
          </div>
          <button
            type="button"
            onClick={saveManualGoals}
            className="mt-3 w-full rounded-xl bg-primary py-3 font-bold text-black"
          >
            Salvar metas
          </button>
        </div>
        </div>
      </Sheet>

      <Sheet open={showPreview} onClose={() => setShowPreview(false)} title="Analisar prato · OLIMPO">
        <div className="space-y-3 p-4 pb-6">
          {previewUrl && (
            <img src={previewUrl} alt="Prato" className="mx-auto max-h-48 rounded-xl object-cover" />
          )}
          <textarea
            value={userNote}
            onChange={(e) => setUserNote(e.target.value)}
            placeholder="Alguma observação? (ex: porção grande, com azeite)"
            className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm"
            rows={2}
          />
          <select
            value={mealType}
            onChange={(e) => setMealType(e.target.value)}
            className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm"
          >
            {Object.entries(MEAL_LABELS).map(([k, v]) => (
              <option key={k} value={k}>{v}</option>
            ))}
          </select>
          <button
            type="button"
            disabled={analyzing}
            onClick={runAnalyze}
            className="w-full rounded-xl bg-primary py-3 font-bold text-black disabled:opacity-50"
          >
            {analyzing ? 'Analisando com IA…' : 'Analisar com IA'}
          </button>
        </div>
      </Sheet>

      <Sheet open={showAdd} onClose={() => setShowAdd(false)} title="Revisar refeição">
        <div className="flex max-h-[80vh] flex-col p-4">
        {analysis?.confianca && (
          <p className={cn(
            'mb-2 rounded-lg px-3 py-2 text-xs font-semibold',
            analysis.confianca === 'alta' && 'bg-emerald-500/15 text-emerald-600',
            analysis.confianca === 'media' && 'bg-amber-500/15 text-amber-600',
            analysis.confianca === 'baixa' && 'bg-destructive/15 text-destructive',
          )}>
            {analysis.confianca === 'alta' && '🟢 Confiança alta'}
            {analysis.confianca === 'media' && '🟡 Confiança média'}
            {analysis.confianca === 'baixa' && '🔴 Confiança baixa — revise os valores'}
          </p>
        )}
        <input
          value={mealName}
          onChange={(e) => setMealName(e.target.value)}
          className="mb-3 w-full rounded-xl border border-border bg-background px-3 py-2 text-sm"
          placeholder="Nome da refeição"
        />
        <ul className="mb-4 flex-1 space-y-2 overflow-y-auto">
          {foods.map((f, i) => (
            <li key={i} className="rounded-lg border border-border p-2 text-sm">
              <input
                value={f.nome}
                onChange={(e) => {
                  const next = [...foods];
                  next[i] = { ...f, nome: e.target.value };
                  setFoods(next);
                }}
                className="mb-1 w-full bg-transparent font-semibold outline-none"
              />
              {f.metodo_preparo && (
                <p className="mb-1 text-xs text-muted-foreground">Método: {f.metodo_preparo}</p>
              )}
              <div className="grid grid-cols-2 gap-1 text-xs">
                <label>
                  Quantidade (g)
                  <input
                    type="number"
                    value={f.quantidade_g ?? ''}
                    onChange={(e) => {
                      const qty = Number(e.target.value);
                      if (!qty) return;
                      const next = [...foods];
                      next[i] = scaleFoodQty(f, qty);
                      setFoods(next);
                    }}
                    className="w-full rounded border border-border bg-background px-1"
                  />
                </label>
                <label>
                  kcal
                  <input
                    type="number"
                    value={f.calorias}
                    onChange={(e) => {
                      const next = [...foods];
                      next[i] = withBaseMacros({ ...f, calorias: Number(e.target.value) });
                      setFoods(next);
                    }}
                    className="w-full rounded border border-border bg-background px-1"
                  />
                </label>
                <label>
                  prot (g)
                  <input
                    type="number"
                    value={f.proteina_g}
                    onChange={(e) => {
                      const next = [...foods];
                      next[i] = withBaseMacros({ ...f, proteina_g: Number(e.target.value) });
                      setFoods(next);
                    }}
                    className="w-full rounded border border-border bg-background px-1"
                  />
                </label>
                <label>
                  carb (g)
                  <input
                    type="number"
                    value={f.carboidrato_g}
                    onChange={(e) => {
                      const next = [...foods];
                      next[i] = withBaseMacros({ ...f, carboidrato_g: Number(e.target.value) });
                      setFoods(next);
                    }}
                    className="w-full rounded border border-border bg-background px-1"
                  />
                </label>
              </div>
            </li>
          ))}
        </ul>
        <div className="sticky bottom-0 border-t border-border bg-background pt-3">
          <p className="mb-2 text-xs font-bold uppercase text-muted-foreground">Total do prato</p>
          <p className="text-lg font-black">🔥 {foodTotals.calorias} kcal</p>
          <p className="mb-3 text-xs text-muted-foreground">
            💪 {Math.round(foodTotals.proteina_g)}g prot · 🍞 {Math.round(foodTotals.carboidrato_g)}g carb · 🫙 {Math.round(foodTotals.gordura_g)}g gord
          </p>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setShowAdd(false)}
              className="flex-1 rounded-xl border border-border py-3 text-sm font-medium"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={saveMeal}
              className="flex-1 rounded-xl bg-primary py-3 font-bold text-black"
            >
              Salvar refeição ✓
            </button>
          </div>
        </div>
        </div>
      </Sheet>

      <MealCameraCapture
        open={showCamera}
        onClose={() => setShowCamera(false)}
        onCapture={handleAnalyze}
      />

      <Sheet open={showPlanForm} onClose={() => setShowPlanForm(false)} title="Novo plano alimentar">
        <div className="space-y-3 p-4 pb-safe">
          <input
            value={planName}
            onChange={(e) => setPlanName(e.target.value)}
            placeholder="Nome do plano (ex: Cutting 4 semanas)"
            className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm"
          />
          {planMeals.map((m, i) => (
            <div key={i} className="rounded-xl border border-border p-3 space-y-2">
              <div className="grid grid-cols-2 gap-2">
                <select
                  value={m.dayOfWeek}
                  onChange={(e) => {
                    const next = [...planMeals];
                    next[i] = { ...m, dayOfWeek: Number(e.target.value) };
                    setPlanMeals(next);
                  }}
                  className="rounded-lg border border-border bg-background px-2 py-1.5 text-xs"
                >
                  {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map((d, di) => (
                    <option key={d} value={di}>{d}</option>
                  ))}
                </select>
                <select
                  value={m.mealType}
                  onChange={(e) => {
                    const next = [...planMeals];
                    next[i] = { ...m, mealType: e.target.value };
                    setPlanMeals(next);
                  }}
                  className="rounded-lg border border-border bg-background px-2 py-1.5 text-xs"
                >
                  {Object.entries(MEAL_LABELS).map(([k, v]) => (
                    <option key={k} value={k}>{v}</option>
                  ))}
                </select>
              </div>
              <input
                value={m.name}
                onChange={(e) => {
                  const next = [...planMeals];
                  next[i] = { ...m, name: e.target.value };
                  setPlanMeals(next);
                }}
                placeholder="Refeição (ex: Frango + arroz)"
                className="w-full rounded-lg border border-border bg-background px-2 py-1.5 text-sm"
              />
              <div className="grid grid-cols-4 gap-1 text-xs">
                <input type="number" placeholder="kcal" value={m.calories || ''} onChange={(e) => { const next = [...planMeals]; next[i] = { ...m, calories: Number(e.target.value) }; setPlanMeals(next); }} className="rounded border border-border px-1 py-1" />
                <input type="number" placeholder="prot" value={m.proteinG || ''} onChange={(e) => { const next = [...planMeals]; next[i] = { ...m, proteinG: Number(e.target.value) }; setPlanMeals(next); }} className="rounded border border-border px-1 py-1" />
                <input type="number" placeholder="carb" value={m.carbG || ''} onChange={(e) => { const next = [...planMeals]; next[i] = { ...m, carbG: Number(e.target.value) }; setPlanMeals(next); }} className="rounded border border-border px-1 py-1" />
                <input type="number" placeholder="gord" value={m.fatG || ''} onChange={(e) => { const next = [...planMeals]; next[i] = { ...m, fatG: Number(e.target.value) }; setPlanMeals(next); }} className="rounded border border-border px-1 py-1" />
              </div>
            </div>
          ))}
          <button
            type="button"
            onClick={() => setPlanMeals([...planMeals, { dayOfWeek: todayDow, mealType: 'lunch', name: '', calories: 0, proteinG: 0, carbG: 0, fatG: 0 }])}
            className="w-full rounded-xl border border-border py-2 text-sm"
          >
            + Adicionar refeição ao plano
          </button>
          <button type="button" onClick={savePlan} className="w-full rounded-xl bg-primary py-3 font-bold text-black">
            Salvar plano
          </button>
        </div>
      </Sheet>
    </div>
  );
}

function MacroBar({
  label,
  value,
  goal,
  color,
  pct,
}: {
  label: string;
  value: number;
  goal?: number;
  color: string;
  pct: number;
}) {
  return (
    <div>
      <div className="flex justify-between text-xs">
        <span>{label}</span>
        <span>{value.toFixed(0)}g{goal ? ` / ${goal}g` : ''}</span>
      </div>
      <div className="mt-0.5 h-1.5 overflow-hidden rounded-full bg-muted">
        <div className={cn('h-full rounded-full', color)} style={{ width: `${Math.min(100, pct)}%` }} />
      </div>
    </div>
  );
}
