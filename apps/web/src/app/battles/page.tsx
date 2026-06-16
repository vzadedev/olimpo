'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation, useQuery } from '@apollo/client';
import Link from 'next/link';
import { ChevronLeft, Swords } from 'lucide-react';
import { useAuthStore } from '@/store/auth';
import {
  ACCEPT_BATTLE,
  ACTIVE_BATTLES,
  CREATE_BATTLE,
  DECLINE_BATTLE,
  EXERCISE_CATALOG,
  MY_BATTLES,
  PENDING_BATTLES_SUMMARY,
  SEARCH_USERS,
} from '@/lib/graphql';
import { toast } from '@/store/toast';
import { getGraphQLErrorMessage } from '@/lib/apollo-utils';
import { mediaUrl } from '@/lib/media';
import {
  formatBattleDateTime,
  formatBattleStatus,
  formatTimeRemaining,
  getBattleRelationLabel,
  getBattleStatusBadgeClass,
  getModalityLabel,
  getUserHandle,
} from '@/lib/battles';
import { Sheet } from '@/components/ui/overlay';
import { DateTimePicker } from '@/components/DateTimePicker';
import { cn } from '@/lib/utils';

export default function BattlesPage() {
  const router = useRouter();
  const token = useAuthStore((s) => s.token);
  const userId = useAuthStore((s) => s.user?.id);
  const [showCreate, setShowCreate] = useState(false);
  const [userQuery, setUserQuery] = useState('');
  const [challengedId, setChallengedId] = useState('');
  const [exerciseId, setExerciseId] = useState('');
  const [deadline, setDeadline] = useState<Date | null>(null);
  const [windowDurationMinutes, setWindowDurationMinutes] = useState(60);
  const [modality, setModality] = useState('max_weight');
  const [message, setMessage] = useState('');

  const battleRefetch = [
    { query: MY_BATTLES },
    { query: ACTIVE_BATTLES },
    { query: PENDING_BATTLES_SUMMARY },
  ];

  const { data, refetch } = useQuery(MY_BATTLES, { skip: !token });
  const { data: activeData, refetch: refetchActive } = useQuery(ACTIVE_BATTLES, {
    skip: !token,
  });
  const { data: usersData } = useQuery(SEARCH_USERS, {
    variables: { q: userQuery },
    skip: userQuery.length < 2,
  });
  const { data: exercisesData } = useQuery(EXERCISE_CATALOG, {
    variables: { search: undefined },
  });

  const [createBattle] = useMutation(CREATE_BATTLE, {
    refetchQueries: battleRefetch,
    awaitRefetchQueries: true,
  });
  const [acceptBattle] = useMutation(ACCEPT_BATTLE, {
    refetchQueries: battleRefetch,
    awaitRefetchQueries: true,
  });
  const [declineBattle] = useMutation(DECLINE_BATTLE, {
    refetchQueries: battleRefetch,
    awaitRefetchQueries: true,
  });

  useEffect(() => {
    if (!token) router.replace('/login');
  }, [token, router]);

  const battles = data?.myBattles ?? [];
  const active = activeData?.activeBattles ?? [];
  const users = usersData?.searchUsers ?? [];
  const exercises = exercisesData?.exerciseCatalog ?? [];

  const handleCreate = async () => {
    if (!challengedId || !exerciseId || !deadline) {
      toast.error('Preencha usuário, exercício e data/hora');
      return;
    }
    if (deadline.getTime() <= Date.now()) {
      toast.error('A janela deve começar no futuro');
      return;
    }
    try {
      await createBattle({
        variables: {
          input: {
            challengedId,
            exerciseId,
            windowStart: deadline.toISOString(),
            windowDurationMinutes,
            modality,
            provocationMessage: message.trim() || undefined,
          },
        },
      });
      toast.success('Desafio enviado!');
      setShowCreate(false);
      setDeadline(null);
      refetch();
      refetchActive();
    } catch (err) {
      toast.error(getGraphQLErrorMessage(err, 'Erro ao criar duelo'));
    }
  };

  if (!token) return null;

  return (
    <div className="px-2 pt-4 pb-24">
      <header className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/settings" className="flex h-10 w-10 items-center justify-center rounded-full bg-surface">
            <ChevronLeft size={20} />
          </Link>
          <div>
            <h1 className="text-2xl font-bold">Duelos</h1>
            <p className="text-sm text-muted-foreground">Desafie outros atletas</p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setShowCreate(true)}
          className="rounded-full bg-primary px-4 py-2 text-sm font-bold text-black"
        >
          ⚔️ Desafiar
        </button>
      </header>

      {active.length > 0 && (
        <section className="mb-6">
          <h2 className="mb-2 font-bold">Duelos ativos</h2>
          <ul className="space-y-3">
            {active.map((b: {
              id: string;
              exerciseName: string;
              windowStart: string;
              windowEnd: string;
              challengerBestKg: number;
              challengedBestKg: number;
              challengerAttemptCount: number;
              challengedAttemptCount: number;
              challenger: { id: string; name?: string; avatarUrl?: string };
              challenged: { id: string; name?: string; avatarUrl?: string };
            }) => (
              <li key={b.id} className="rounded-2xl border border-primary/30 bg-primary/5 p-4">
                <p className="mb-2 font-bold">{b.exerciseName}</p>
                <div className="flex items-center justify-between gap-2 text-sm">
                  <BattleSide
                    user={b.challenger}
                    kg={b.challengerBestKg}
                    highlight={b.challenger.id === userId}
                  />
                  <Swords size={16} className="text-primary" />
                  <BattleSide
                    user={b.challenged}
                    kg={b.challengedBestKg}
                    highlight={b.challenged.id === userId}
                  />
                </div>
                <p className="mt-2 text-xs text-muted-foreground">
                  Janela: {formatBattleDateTime(b.windowStart)} — {formatBattleDateTime(b.windowEnd)}
                </p>
                <p className="text-xs text-muted-foreground">
                  Restante: {formatTimeRemaining(b.windowEnd)}
                </p>
                <p className="text-xs text-muted-foreground">
                  {b.challenger.name}: {b.challengerAttemptCount} tent. · melhor {b.challengerBestKg}kg
                  {' · '}
                  {b.challenged.name}: {b.challengedAttemptCount} tent. · melhor {b.challengedBestKg}kg
                </p>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section>
        <h2 className="mb-2 font-bold">Histórico e convites</h2>
        {battles.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nenhum duelo ainda.</p>
        ) : (
          <ul className="space-y-3">
            {battles.map((b: {
              id: string;
              status: string;
              exerciseName: string;
              windowStart: string;
              windowEnd: string;
              modality: string;
              createdAt: string;
              provocationMessage?: string | null;
              challengerBestKg: number;
              challengedBestKg: number;
              challenged: { id: string; name?: string; avatarUrl?: string };
              challenger: { id: string; name?: string; avatarUrl?: string };
              winner?: { id: string; name?: string } | null;
            }) => {
              const isPendingInvite = b.status === 'pending' && b.challenged.id === userId;
              const isPendingSent = b.status === 'pending' && b.challenger.id === userId;

              return (
              <li key={b.id} className="rounded-xl border border-border bg-surface p-4">
                <div className="mb-3 flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold">{b.exerciseName}</p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {getBattleRelationLabel(b, userId)}
                    </p>
                  </div>
                  <span
                    className={cn(
                      'shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold',
                      getBattleStatusBadgeClass(b.status),
                    )}
                  >
                    {formatBattleStatus(b.status)}
                  </span>
                </div>

                <div className="space-y-1 text-xs text-muted-foreground">
                  <p>Prazo final: {formatBattleDateTime(b.windowEnd)}</p>
                  <p>Início da janela: {formatBattleDateTime(b.windowStart)}</p>
                  <p>Modalidade: {getModalityLabel(b.modality)}</p>
                  <p>Enviado em: {formatBattleDateTime(b.createdAt)}</p>
                  {b.provocationMessage && (
                    <p className="italic text-foreground/80">
                      &ldquo;{b.provocationMessage}&rdquo;
                    </p>
                  )}
                  {b.status === 'active' && (
                    <p className="pt-1 font-medium text-foreground">
                      Placar: {b.challenger.name ?? 'Desafiante'} {b.challengerBestKg}kg vs{' '}
                      {b.challenged.name ?? 'Desafiado'} {b.challengedBestKg}kg
                    </p>
                  )}
                  {b.status === 'completed' && b.winner && (
                    <p className="pt-1 font-medium text-emerald-600 dark:text-emerald-400">
                      Vencedor: {b.winner.name ?? 'Atleta'}
                    </p>
                  )}
                  {isPendingSent && (
                    <p className="pt-1 text-amber-600 dark:text-amber-400">
                      Aguardando {b.challenged.name ?? 'o atleta'} aceitar o desafio
                    </p>
                  )}
                </div>

                {isPendingInvite && (
                  <div className="mt-3 flex gap-2 border-t border-border pt-3">
                    <button
                      type="button"
                      onClick={async () => {
                        await acceptBattle({ variables: { battleId: b.id } });
                        toast.success('Duelo aceito!');
                        refetch();
                        refetchActive();
                      }}
                      className="flex-1 rounded-lg bg-primary px-3 py-2 text-xs font-bold text-black"
                    >
                      Aceitar desafio
                    </button>
                    <button
                      type="button"
                      onClick={async () => {
                        await declineBattle({ variables: { battleId: b.id } });
                        toast.success('Desafio recusado');
                        refetch();
                      }}
                      className="flex-1 rounded-lg border border-border px-3 py-2 text-xs"
                    >
                      Recusar
                    </button>
                  </div>
                )}
              </li>
              );
            })}
          </ul>
        )}
      </section>

      <Sheet open={showCreate} onClose={() => setShowCreate(false)} title="Novo duelo">
        <div className="space-y-3 p-4">
          <input
            value={userQuery}
            onChange={(e) => setUserQuery(e.target.value)}
            placeholder="Buscar usuário (@nome)"
            className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm"
          />
          {users.length > 0 && (
            <ul className="max-h-32 overflow-y-auto rounded-xl border border-border">
              {users.map((u: { id: string; name?: string; instagramUsername?: string }) => (
                <li key={u.id}>
                  <button
                    type="button"
                    onClick={() => {
                      setChallengedId(u.id);
                      setUserQuery(u.instagramUsername ?? u.name ?? '');
                    }}
                    className="w-full px-3 py-2 text-left text-sm hover:bg-muted/50"
                  >
                    @{u.instagramUsername ?? u.name}
                  </button>
                </li>
              ))}
            </ul>
          )}
          <select
            value={exerciseId}
            onChange={(e) => setExerciseId(e.target.value)}
            className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm"
          >
            <option value="">Exercício</option>
            {exercises.map((ex: { id: string; name: string }) => (
              <option key={ex.id} value={ex.id}>{ex.name}</option>
            ))}
          </select>
          <DateTimePicker value={deadline} onChange={setDeadline} minDate={new Date()} label="Início da janela de gravação" />
          <select
            value={windowDurationMinutes}
            onChange={(e) => setWindowDurationMinutes(Number(e.target.value))}
            className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm"
          >
            <option value={30}>Janela: 30 minutos</option>
            <option value={60}>Janela: 1 hora</option>
            <option value={120}>Janela: 2 horas</option>
            <option value={1440}>Janela: 24 horas</option>
          </select>
          <select
            value={modality}
            onChange={(e) => setModality(e.target.value)}
            className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm"
          >
            <option value="max_weight">Modalidade: Maior peso (1RM)</option>
            <option value="max_volume">Modalidade: Maior volume (peso × reps)</option>
          </select>
          <input
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            maxLength={100}
            placeholder="Provocação (opcional)"
            className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm"
          />
          <button
            type="button"
            onClick={handleCreate}
            className="w-full rounded-xl bg-primary py-3 font-bold text-black"
          >
            Enviar desafio
          </button>
        </div>
      </Sheet>
    </div>
  );
}

function BattleSide({
  user,
  kg,
  highlight,
}: {
  user: { name?: string; avatarUrl?: string };
  kg: number;
  highlight?: boolean;
}) {
  return (
    <div className={cn('flex flex-col items-center', highlight && 'text-primary')}>
      <div className="mb-1 h-8 w-8 overflow-hidden rounded-full bg-muted">
        {user.avatarUrl ? (
          <img src={mediaUrl(user.avatarUrl)!} alt="" className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full items-center justify-center text-xs font-bold">
            {user.name?.[0] ?? '?'}
          </div>
        )}
      </div>
      <span className="max-w-[4rem] truncate text-xs">{user.name ?? 'Atleta'}</span>
      <span className="font-bold">{kg}kg</span>
    </div>
  );
}
