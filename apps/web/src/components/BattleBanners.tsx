'use client';

import Link from 'next/link';
import { useMutation, useQuery } from '@apollo/client';
import {
  ACCEPT_BATTLE,
  ACTIVE_BATTLES,
  DECLINE_BATTLE,
  PENDING_BATTLES_SUMMARY,
} from '@/lib/graphql';
import {
  formatTimeRemaining,
  getUserHandle,
} from '@/lib/battles';
import { mediaUrl } from '@/lib/media';
import { toast } from '@/store/toast';
import { useAuthStore } from '@/store/auth';

type BattleCard = {
  id: string;
  exerciseName: string;
  provocationMessage?: string | null;
  windowStart: string;
  windowEnd: string;
  modality: string;
  challengerBestKg: number;
  challengedBestKg: number;
  winningSide?: string | null;
  challenger: { id: string; name?: string; avatarUrl?: string; instagramUsername?: string };
  challenged: { id: string; name?: string; avatarUrl?: string; instagramUsername?: string };
};

const battleRefetch = [
  { query: PENDING_BATTLES_SUMMARY },
  { query: ACTIVE_BATTLES },
];

export function BattleBanners() {
  const userId = useAuthStore((s) => s.user?.id);
  const { data: pendingData, refetch: refetchPending } = useQuery(PENDING_BATTLES_SUMMARY, {
    fetchPolicy: 'cache-and-network',
    pollInterval: 60000,
  });
  const { data: activeData } = useQuery(ACTIVE_BATTLES, {
    fetchPolicy: 'cache-and-network',
    pollInterval: 30000,
  });

  const [acceptBattle] = useMutation(ACCEPT_BATTLE, {
    refetchQueries: battleRefetch,
    awaitRefetchQueries: true,
  });
  const [declineBattle] = useMutation(DECLINE_BATTLE, {
    refetchQueries: battleRefetch,
    awaitRefetchQueries: true,
  });

  const pending = pendingData?.pendingBattlesSummary;
  const latestPending = pending?.latest as BattleCard | undefined;
  const activeBattles = (activeData?.activeBattles ?? []) as BattleCard[];
  const primaryActive = activeBattles[0];

  const handleAccept = async (battleId: string) => {
    try {
      await acceptBattle({ variables: { battleId } });
      toast.success('Desafio aceito!');
      refetchPending();
    } catch {
      toast.error('Erro ao aceitar desafio');
    }
  };

  const handleDecline = async (battleId: string) => {
    try {
      await declineBattle({ variables: { battleId } });
      toast.success('Desafio recusado');
      refetchPending();
    } catch {
      toast.error('Erro ao recusar desafio');
    }
  };

  if (!userId) return null;

  return (
    <section className="mb-4 space-y-3">
      {latestPending && (
        <div className="rounded-2xl border border-amber-500/40 bg-amber-500/10 p-4">
          <p className="mb-3 text-sm font-bold">⚔️ Você recebeu um desafio!</p>
          <div className="mb-3 flex items-start gap-3">
            <div className="h-10 w-10 shrink-0 overflow-hidden rounded-full bg-muted">
              {latestPending.challenger.avatarUrl ? (
                <img
                  src={mediaUrl(latestPending.challenger.avatarUrl)!}
                  alt=""
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full items-center justify-center text-sm font-bold">
                  {latestPending.challenger.name?.[0] ?? '?'}
                </div>
              )}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm">
                <span className="font-semibold text-primary">
                  {getUserHandle(latestPending.challenger)}
                </span>{' '}
                te desafiou para um duelo de{' '}
                <span className="font-semibold">{latestPending.exerciseName}</span>
              </p>
              {latestPending.provocationMessage && (
                <p className="mt-1 text-sm italic text-muted-foreground">
                  &ldquo;{latestPending.provocationMessage}&rdquo;
                </p>
              )}
              <p className="mt-2 text-xs text-muted-foreground">
                Prazo para aceitar: {formatTimeRemaining(latestPending.windowStart)}
              </p>
              {(pending?.total ?? 0) > 1 && (
                <Link href="/battles" className="mt-1 inline-block text-xs font-semibold text-primary">
                  + {(pending?.total ?? 0) - 1} outros desafios
                </Link>
              )}
            </div>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => handleDecline(latestPending.id)}
              className="flex-1 rounded-xl border border-border py-2 text-sm font-medium"
            >
              Recusar
            </button>
            <button
              type="button"
              onClick={() => handleAccept(latestPending.id)}
              className="flex-1 rounded-xl bg-primary py-2 text-sm font-bold text-black"
            >
              Aceitar desafio ✓
            </button>
          </div>
        </div>
      )}

      {primaryActive && (
        <ActiveBattleBanner battle={primaryActive} userId={userId} />
      )}
    </section>
  );
}

function ActiveBattleBanner({ battle, userId }: { battle: BattleCard; userId: string }) {
  const isChallenger = battle.challenger.id === userId;
  const opponent = isChallenger ? battle.challenged : battle.challenger;
  const myKg = isChallenger ? battle.challengerBestKg : battle.challengedBestKg;
  const theirKg = isChallenger ? battle.challengedBestKg : battle.challengerBestKg;
  const winning =
    battle.winningSide === 'me'
      ? '✅ Vencendo'
      : battle.winningSide === 'them'
        ? '⚠️ Perdendo'
        : '🤝 Empate';

  return (
    <Link
      href="/battles"
      className="block rounded-2xl border border-primary/40 bg-primary/10 p-4"
    >
      <p className="mb-2 text-sm font-bold">🔥 Batalha em andamento no OLIMPO!</p>
      <p className="text-sm font-semibold">
        {battle.exerciseName} vs {getUserHandle(opponent)}
      </p>
      <p className="mt-1 text-sm text-muted-foreground">
        Você: {myKg}kg | Adversário: {theirKg}kg · {winning}
      </p>
      <p className="mt-2 text-xs text-muted-foreground">
        ⏱ Tempo restante: {formatTimeRemaining(battle.windowEnd)}
      </p>
      <p className="mt-2 text-xs font-semibold text-primary">Ver batalha →</p>
    </Link>
  );
}
