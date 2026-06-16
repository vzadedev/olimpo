'use client';

import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useQuery } from '@apollo/client';
import { ChevronLeft, Swords, Trophy } from 'lucide-react';
import { BATTLE_HISTORY, USER_BATTLE_STATS, USER_PROFILE } from '@/lib/graphql';
import {
  formatBattleDateTime,
  getBattleResultLabel,
  getModalityLabel,
  getUserHandle,
} from '@/lib/battles';
import { mediaUrl } from '@/lib/media';
import { useAuthStore } from '@/store/auth';
export default function UserProfilePage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const me = useAuthStore((s) => s.user?.id);
  const { data, loading, error } = useQuery(USER_PROFILE, {
    variables: { userId: params.id },
  });
  const { data: statsData } = useQuery(USER_BATTLE_STATS, {
    variables: { userId: params.id },
  });
  const { data: historyData } = useQuery(BATTLE_HISTORY, {
    variables: { userId: params.id },
  });

  const profile = data?.userProfile;
  const battleStats = statsData?.userBattleStats;
  const battleHistory = historyData?.battleHistory ?? [];
  if (loading) {
    return <p className="px-4 py-8 text-muted-foreground">Carregando perfil...</p>;
  }

  if (error || !profile) {
    return (
      <div className="px-4 py-8">
        <p className="text-destructive">Perfil não encontrado ou privado.</p>
        <button type="button" onClick={() => router.back()} className="mt-4 text-primary">
          Voltar
        </button>
      </div>
    );
  }

  const handle = profile.instagramUsername
    ? `@${profile.instagramUsername}`
    : profile.name ?? 'Atleta';

  return (
    <div className="px-2 pt-4 pb-24">
      <header className="mb-6 flex items-center gap-3">
        <button
          type="button"
          onClick={() => router.back()}
          className="flex h-10 w-10 items-center justify-center rounded-full bg-surface"
        >
          <ChevronLeft size={20} />
        </button>
        <h1 className="text-xl font-bold">Perfil</h1>
      </header>

      <div className="mb-6 flex items-center gap-4 rounded-2xl border border-border bg-surface p-4">
        <div className="h-16 w-16 shrink-0 overflow-hidden rounded-full bg-muted">
          {profile.avatarUrl ? (
            <img src={mediaUrl(profile.avatarUrl)!} alt="" className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full items-center justify-center text-xl font-bold">
              {profile.name?.[0]?.toUpperCase() ?? '?'}
            </div>
          )}
        </div>
        <div>
          <p className="text-lg font-bold">{profile.name ?? 'Atleta'}</p>
          <p className="text-sm text-primary">{handle}</p>
          {profile.city && <p className="text-xs text-muted-foreground">{profile.city}</p>}
          {profile.globalRank && (
            <p className="mt-1 text-xs font-semibold text-primary">
              {profile.globalRank} · {profile.globalScore} pts
            </p>
          )}
          {profile.bmi != null && (
            <p className="text-xs text-muted-foreground">IMC: {profile.bmi}</p>
          )}
        </div>
      </div>

      <section className="mb-6 grid grid-cols-2 gap-3">
        <div className="rounded-xl border border-border bg-surface p-3 text-center">
          <p className="text-2xl font-black text-primary">{profile.submissionsCount}</p>
          <p className="text-xs text-muted-foreground">Levantamentos</p>
        </div>
        <div className="rounded-xl border border-border bg-surface p-3 text-center">
          <p className="text-2xl font-black text-primary">{profile.badges?.length ?? 0}</p>
          <p className="text-xs text-muted-foreground">Conquistas</p>
        </div>
      </section>

      {profile.exerciseTitles?.length > 0 && (
        <section className="mb-6 rounded-xl border border-primary/30 bg-primary/5 p-4">
          <p className="mb-2 flex items-center gap-2 text-sm font-bold text-primary">
            <Trophy size={16} /> Títulos
          </p>
          <ul className="space-y-1 text-sm">
            {profile.exerciseTitles.map((t: {
              gymId: string;
              exerciseId: string;
              title: string;
              gymName: string;
            }) => (
              <li key={`${t.gymId}-${t.exerciseId}`}>
                🏆 {t.title} — {t.gymName}
              </li>
            ))}
          </ul>
        </section>
      )}

      {battleStats && battleStats.totalBattles > 0 && (
        <section className="mb-6 rounded-2xl border border-border bg-surface p-4">
          <p className="mb-3 flex items-center gap-2 font-bold">
            <Swords size={16} className="text-primary" /> Histórico de batalhas — OLIMPO
          </p>
          <div className="mb-3 grid grid-cols-3 gap-2 text-center text-sm">
            <div>
              <p className="text-xl font-black text-emerald-500">{battleStats.wins}</p>
              <p className="text-xs text-muted-foreground">🏆 Vitórias</p>
            </div>
            <div>
              <p className="text-xl font-black text-destructive">{battleStats.losses}</p>
              <p className="text-xs text-muted-foreground">😤 Derrotas</p>
            </div>
            <div>
              <p className="text-xl font-black">{battleStats.draws}</p>
              <p className="text-xs text-muted-foreground">🤝 Empates</p>
            </div>
          </div>
          <p className="text-xs text-muted-foreground">Taxa de vitória: {battleStats.winRate}%</p>
          {battleStats.winStreak > 0 && (
            <p className="text-xs text-muted-foreground">
              Sequência: 🔥 {battleStats.winStreak} vitória{battleStats.winStreak > 1 ? 's' : ''} seguida{battleStats.winStreak > 1 ? 's' : ''}
            </p>
          )}
          {battleStats.favoriteExerciseName && (
            <p className="text-xs text-muted-foreground">
              Exercício favorito: {battleStats.favoriteExerciseName}
            </p>
          )}
        </section>
      )}

      {battleHistory.length > 0 && (
        <section className="mb-6">
          <h2 className="mb-3 font-bold">Duelos recentes</h2>
          <ul className="space-y-2">
            {battleHistory.slice(0, 8).map((b: {
              id: string;
              exerciseName: string;
              modality: string;
              windowStart: string;
              windowEnd: string;
              challenger: { id: string; name?: string; instagramUsername?: string };
              challenged: { id: string; name?: string; instagramUsername?: string };
              winner?: { id: string } | null;
              challengerBestKg: number;
              challengedBestKg: number;
              challengerBestVolume: number;
              challengedBestVolume: number;
            }) => {
              const opponent = b.challenger.id === params.id ? b.challenged : b.challenger;
              return (
                <li key={b.id} className="rounded-xl border border-border bg-surface p-3 text-sm">
                  <p className="font-semibold">
                    vs {getUserHandle(opponent)} · {b.exerciseName}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {getModalityLabel(b.modality)} · {formatBattleDateTime(b.windowStart)} — {formatBattleDateTime(b.windowEnd)}
                  </p>
                  <p className="mt-1 text-xs font-medium">
                    {getBattleResultLabel(b, params.id, b.challenger.id)}
                  </p>
                </li>
              );
            })}
          </ul>
          {battleHistory.length > 8 && (
            <Link href="/battles" className="mt-2 inline-block text-xs font-semibold text-primary">
              Ver histórico completo
            </Link>
          )}
        </section>
      )}

      <section>
        <h2 className="mb-3 font-bold">Badges & conquistas</h2>
        {profile.badges?.length ? (          <div className="flex flex-wrap gap-2">
            {profile.badges.map((b: { id: string; title: string; description: string }) => (
              <span
                key={b.id}
                title={b.description}
                className="rounded-full border border-primary/40 bg-primary/10 px-3 py-1.5 text-xs font-semibold text-primary"
              >
                {b.title}
              </span>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">Nenhuma conquista ainda.</p>
        )}
      </section>

      {me === profile.id && (
        <Link
          href="/settings"
          className="mt-6 block rounded-xl bg-primary py-3 text-center font-bold text-black"
        >
          Editar meu perfil
        </Link>
      )}
    </div>
  );
}
