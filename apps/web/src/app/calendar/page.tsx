'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation, useQuery } from '@apollo/client';
import Link from 'next/link';
import { ChevronLeft, Flame } from 'lucide-react';
import { useAuthStore } from '@/store/auth';
import {
  DELETE_WORKOUT_SCHEDULE,
  MY_WORKOUT_PLANS,
  SCHEDULE_WORKOUT,
  SCHEDULES_FOR_DATE,
  START_WORKOUT_SESSION,
  WORKOUT_CALENDAR,
  WORKOUT_STREAK,
} from '@/lib/graphql';
import { toast } from '@/store/toast';
import { cn } from '@/lib/utils';

type DayIndicator = { planName: string; status: string };

type CalendarDay = {
  date: string;
  status: string;
  scheduledCount: number;
  indicators: DayIndicator[];
};

const DOT_COLORS: Record<string, string> = {
  scheduled: 'bg-blue-500',
  completed: 'bg-green-500',
  missed: 'bg-red-500',
};

const WEEKDAYS = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'];

function CalendarDayButton({
  day,
  selected,
  onSelect,
  onLongPress,
}: {
  day: CalendarDay;
  selected: boolean;
  onSelect: () => void;
  onLongPress: (plans: string[]) => void;
}) {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const longPressRef = useRef(false);
  const dayNum = parseInt(day.date.slice(8, 10), 10);

  const clearTimer = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  };

  const startLongPress = () => {
    if (!day.indicators?.length) return;
    clearTimer();
    longPressRef.current = false;
    timerRef.current = setTimeout(() => {
      longPressRef.current = true;
      onLongPress(day.indicators.map((i) => i.planName));
      if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
        navigator.vibrate(10);
      }
    }, 500);
  };

  const handleClick = () => {
    if (longPressRef.current) {
      longPressRef.current = false;
      return;
    }
    onSelect();
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      onTouchStart={startLongPress}
      onTouchEnd={clearTimer}
      onTouchMove={clearTimer}
      onMouseDown={startLongPress}
      onMouseUp={clearTimer}
      onMouseLeave={clearTimer}
      onContextMenu={(e) => {
        if (day.indicators?.length) {
          e.preventDefault();
          onLongPress(day.indicators.map((i) => i.planName));
        }
      }}
      className={cn(
        'relative flex min-h-[4rem] flex-col items-center justify-start rounded-2xl border border-white/5 bg-black/40 backdrop-blur-md py-2 transition-all',
        selected ? 'ring-2 ring-primary border-transparent shadow-sm' : 'hover:border-primary/50',
        day.indicators?.length ? 'bg-black/60 shadow-lg' : 'bg-black/20'
      )}
    >
      <span className={cn('text-sm font-semibold flex items-center justify-center h-6 w-6 rounded-full', selected ? 'bg-primary text-black' : '')}>
        {dayNum}
      </span>
      {day.indicators?.length > 0 && (
        <div className="mt-1.5 flex max-w-full flex-wrap items-center justify-center gap-1 px-1">
          {day.indicators.slice(0, 3).map((ind, idx) => (
            <span
              key={`${day.date}-${idx}`}
              className={cn(
                'h-1.5 w-full max-w-[12px] shrink-0 rounded-full',
                DOT_COLORS[ind.status] ?? DOT_COLORS.scheduled,
              )}
              title={ind.planName}
            />
          ))}
          {day.indicators.length > 3 && (
            <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-muted-foreground" />
          )}
        </div>
      )}
    </button>
  );
}

export default function CalendarPage() {
  const router = useRouter();
  const token = useAuthStore((s) => s.token);
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [planId, setPlanId] = useState('');
  const [tooltipPlans, setTooltipPlans] = useState<string[] | null>(null);

  const {
    data: calendarData,
    refetch: refetchCalendar,
  } = useQuery(WORKOUT_CALENDAR, {
    variables: { year, month },
    skip: !token,
    fetchPolicy: 'cache-and-network',
  });
  const { data: streakData, refetch: refetchStreak } = useQuery(WORKOUT_STREAK, {
    skip: !token,
  });
  const { data: plansData } = useQuery(MY_WORKOUT_PLANS, { skip: !token });
  const { data: dayData, refetch: refetchDay } = useQuery(SCHEDULES_FOR_DATE, {
    variables: { date: selectedDate! },
    skip: !token || !selectedDate,
  });

  const [scheduleWorkout] = useMutation(SCHEDULE_WORKOUT);
  const [deleteSchedule] = useMutation(DELETE_WORKOUT_SCHEDULE);
  const [startSession] = useMutation(START_WORKOUT_SESSION);

  useEffect(() => {
    if (!token) router.replace('/login');
  }, [token, router]);

  useEffect(() => {
    if (!tooltipPlans) return;
    const hide = () => setTooltipPlans(null);
    window.addEventListener('touchstart', hide);
    window.addEventListener('click', hide);
    return () => {
      window.removeEventListener('touchstart', hide);
      window.removeEventListener('click', hide);
    };
  }, [tooltipPlans]);

  const days: CalendarDay[] = calendarData?.workoutCalendar ?? [];
  const streak = streakData?.workoutStreak ?? 0;
  const plans = plansData?.myWorkoutPlans ?? [];
  const daySchedules = dayData?.schedulesForDate ?? [];

  const monthLabel = useMemo(
    () =>
      new Date(year, month - 1).toLocaleDateString('pt-BR', {
        month: 'long',
        year: 'numeric',
      }),
    [year, month],
  );

  const leadingBlanks = useMemo(() => {
    return new Date(year, month - 1, 1).getDay();
  }, [year, month]);

  const refreshCalendar = useCallback(async () => {
    await Promise.all([refetchCalendar(), refetchStreak()]);
    if (selectedDate) await refetchDay();
  }, [refetchCalendar, refetchStreak, refetchDay, selectedDate]);

  const handleSchedule = async () => {
    if (!selectedDate || !planId) return;
    try {
      await scheduleWorkout({
        variables: { input: { planId, scheduledDate: selectedDate } },
        refetchQueries: [
          { query: WORKOUT_CALENDAR, variables: { year, month } },
          { query: SCHEDULES_FOR_DATE, variables: { date: selectedDate } },
          { query: WORKOUT_STREAK },
        ],
      });
      toast.success('Treino agendado!');
      await refreshCalendar();
    } catch {
      toast.error('Erro ao agendar');
    }
  };

  const startScheduled = async (schedulePlanId: string, scheduleId: string) => {
    try {
      const { data } = await startSession({
        variables: { planId: schedulePlanId, scheduleId },
      });
      router.push(`/workouts/session/${data.startWorkoutSession.id}`);
    } catch {
      toast.error('Erro ao iniciar treino');
    }
  };

  if (!token) return null;

  return (
    <div className="px-2 pt-4 pb-24">
      <header className="mb-4 flex items-center gap-3">
        <Link
          href="/workouts"
          className="flex h-10 w-10 items-center justify-center rounded-full bg-surface"
        >
          <ChevronLeft size={20} />
        </Link>
        <h1 className="text-2xl font-bold">Calendário</h1>
      </header>

      <div className="mb-4 flex items-center gap-2 rounded-2xl border border-primary/30 bg-primary/5 p-4">
        <Flame className="text-primary" size={20} />
        <div>
          <p className="text-sm text-muted-foreground">Sequência de treinos</p>
          <p className="text-xl font-black text-primary">{streak} dias</p>
        </div>
      </div>

      <div className="mb-3 flex flex-wrap gap-3 text-xs text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-blue-500" /> Agendado
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-green-500" /> Concluído
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-red-500" /> Perdido
        </span>
      </div>

      <div className="mb-4 flex items-center justify-between">
        <button
          type="button"
          onClick={() => {
            if (month === 1) {
              setMonth(12);
              setYear((y) => y - 1);
            } else setMonth((m) => m - 1);
          }}
          className="rounded-lg px-3 py-1 text-sm"
        >
          ←
        </button>
        <p className="font-semibold capitalize">{monthLabel}</p>
        <button
          type="button"
          onClick={() => {
            if (month === 12) {
              setMonth(1);
              setYear((y) => y + 1);
            } else setMonth((m) => m + 1);
          }}
          className="rounded-lg px-3 py-1 text-sm"
        >
          →
        </button>
      </div>

      <div className="mb-2 grid grid-cols-7 gap-2 text-center text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
        {WEEKDAYS.map((w, i) => (
          <span key={`${w}-${i}`}>{w}</span>
        ))}
      </div>

      <div className="mb-6 grid grid-cols-7 gap-2">
        {Array.from({ length: leadingBlanks }).map((_, i) => (
          <div key={`blank-${i}`} />
        ))}
        {days.map((day) => (
          <CalendarDayButton
            key={day.date}
            day={day}
            selected={selectedDate === day.date}
            onSelect={() => setSelectedDate(day.date)}
            onLongPress={setTooltipPlans}
          />
        ))}
      </div>

      {tooltipPlans && (
        <div className="fixed bottom-28 left-1/2 z-[150] max-w-[90vw] -translate-x-1/2 rounded-xl border border-border bg-surface px-4 py-3 shadow-lg">
          <p className="mb-1 text-xs font-semibold text-muted-foreground">Planilhas do dia</p>
          <ul className="space-y-0.5 text-sm">
            {tooltipPlans.map((name) => (
              <li key={name}>• {name}</li>
            ))}
          </ul>
        </div>
      )}

      {selectedDate && (
        <section className="mt-2 rounded-3xl border border-white/10 bg-black/40 p-5 shadow-[0_8px_30px_rgb(0,0,0,0.4)] backdrop-blur-xl">
          <h2 className="mb-4 text-lg font-extrabold flex items-center gap-2">
            <span className="h-5 w-1.5 rounded-full bg-primary" />
            {new Date(selectedDate + 'T12:00:00').toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}
          </h2>

          {daySchedules.length > 0 ? (
            <div className="mb-6 relative border-l-2 border-muted ml-2 space-y-6 pl-5 py-2">
              {daySchedules.map((s: {
                id: string;
                planId: string;
                planName: string;
                status: string;
                completed: boolean;
              }) => (
                <div key={s.id} className="relative">
                  <div className={cn("absolute -left-[27px] top-1.5 h-3 w-3 rounded-full border-2 border-black", DOT_COLORS[s.status] ?? DOT_COLORS.scheduled)} />
                  <div className="flex flex-col gap-3 rounded-2xl border border-white/10 bg-white/5 p-4 transition-colors hover:bg-white/10 backdrop-blur-md">
                    <div>
                      <p className="font-bold text-base">{s.planName}</p>
                      <p className="text-xs font-medium text-muted-foreground mt-0.5">
                        {s.status === 'completed'
                          ? '✅ Treino concluído'
                          : s.status === 'missed'
                            ? '❌ Treino perdido'
                            : '⏳ Agendado para hoje'}
                      </p>
                    </div>
                    {!s.completed && s.status !== 'missed' && (
                      <div className="flex gap-2 pt-2 border-t border-border/50">
                        <button
                          type="button"
                          onClick={() => startScheduled(s.planId, s.id)}
                          className="flex-1 rounded-lg bg-primary px-3 py-2 text-sm font-bold text-black hover:bg-primary/90 transition-colors"
                        >
                          Iniciar agora
                        </button>
                        <button
                          type="button"
                          onClick={async () => {
                            await deleteSchedule({ variables: { scheduleId: s.id } });
                            await refreshCalendar();
                            toast.success('Agendamento removido');
                          }}
                          className="rounded-lg border border-border bg-surface px-3 py-2 text-sm font-semibold text-destructive hover:bg-destructive/10 transition-colors"
                        >
                          Cancelar
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="mb-6 flex flex-col items-center justify-center rounded-2xl border border-dashed border-white/20 py-8 text-center bg-black/20 backdrop-blur-md">
              <p className="text-sm font-medium text-muted-foreground">Seu dia está livre.</p>
              <p className="text-xs text-muted-foreground mt-1">Que tal agendar um treino?</p>
            </div>
          )}

          <div className="flex flex-col gap-2 pt-5 border-t border-white/10">
            <label className="text-xs font-bold text-muted-foreground uppercase tracking-wide">Adicionar treino à agenda</label>
            <div className="flex gap-2">
              <select
                value={planId}
                onChange={(e) => setPlanId(e.target.value)}
                className="flex-1 rounded-2xl border border-white/10 bg-black/40 px-4 py-2.5 text-sm font-medium outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all text-white"
              >
                <option value="">Escolha uma planilha...</option>
                {plans.map((p: { id: string; name: string }) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={handleSchedule}
                disabled={!planId}
                className="rounded-xl bg-primary px-5 py-2.5 text-sm font-bold text-black disabled:opacity-50 transition-transform active:scale-95 disabled:active:scale-100"
              >
                Agendar
              </button>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
