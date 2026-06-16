'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery } from '@apollo/client';
import Link from 'next/link';
import { Crown, Medal, Trophy } from 'lucide-react';
import { useAuthStore } from '@/store/auth';
import { CITY_RANKINGS, ME, MY_RANKING_POSITIONS } from '@/lib/graphql';
import { mediaUrl } from '@/lib/media';
import { cn } from '@/lib/utils';

const CATEGORIES = [
  { id: 'bench', label: '💪 Maior Supinista', emoji: '💪' },
  { id: 'deadlift', label: '🏋️ Maior Levantador Terra', emoji: '🏋️' },
  { id: 'squat', label: '🦵 Rei do Agachamento', emoji: '🦵' },
  { id: 'overall', label: '🥇 Mais Forte Geral', emoji: '🥇' },
  { id: 'consistency', label: '🔥 Mais Consistente', emoji: '🔥' },
  { id: 'evolution', label: '📈 Maior Evolução', emoji: '📈' },
  { id: 'reels', label: '🎬 Rei dos Reels', emoji: '🎬' },
] as const;

const PODIUM_STYLES = [
  'border-yellow-400/60 bg-yellow-400/10',
  'border-slate-300/60 bg-slate-300/10',
  'border-amber-700/60 bg-amber-700/10',
];

export default function RankingsPage() {
  const router = useRouter();
  const token = useAuthStore((s) => s.token);
  const [category, setCategory] = useState<string>('bench');

  const { data: meData } = useQuery(ME, { skip: !token });
  const { data, loading, error } = useQuery(CITY_RANKINGS, {
    variables: { category: category.toUpperCase() },
    skip: !token,
    fetchPolicy: 'cache-and-network',
  });
  const { data: positionsData } = useQuery(MY_RANKING_POSITIONS, { skip: !token });

  useEffect(() => {
    if (!token) router.replace('/login');
  }, [token, router]);

  const city = meData?.me?.city;
  const result = data?.cityRankings;
  const entries = result?.entries ?? [];
  const top3 = entries.slice(0, 3);
  const rest = entries.slice(3);
  const topOneCategories =
    positionsData?.myRankingPositions
      ?.filter((p: { isTopOne: boolean }) => p.isTopOne)
      .map((p: { category: string }) => p.category) ?? [];

  if (!token) return null;

  return (
    <div className="px-2 pt-4 pb-24">
      <header className="mb-4">
        <h1 className="text-2xl font-bold">Rankings da Cidade</h1>
        <p className="text-sm text-muted-foreground">
          {city ? `🏙️ ${city}` : 'Defina sua cidade em Configurações'}
        </p>
        {topOneCategories.length > 0 && (
          <div className="mt-2 inline-flex animate-pulse items-center gap-2 rounded-full border border-yellow-400/50 bg-yellow-400/10 px-3 py-1 text-xs font-bold text-yellow-500">
            <Crown size={14} /> #1 em {topOneCategories.length} categoria(s)!
          </div>
        )}
      </header>

      {!city && (
        <Link
          href="/settings"
          className="mb-4 block rounded-xl border border-primary/40 bg-primary/10 p-4 text-sm font-semibold text-primary"
        >
          Adicionar cidade no perfil →
        </Link>
      )}

      <div className="mb-4 flex gap-2 overflow-x-auto pb-2">
        {CATEGORIES.map((cat) => (
          <button
            key={cat.id}
            type="button"
            onClick={() => setCategory(cat.id)}
            className={cn(
              'shrink-0 rounded-full px-3 py-1.5 text-xs font-semibold transition-colors',
              category === cat.id
                ? 'bg-primary text-black'
                : 'border border-border bg-surface text-muted-foreground',
            )}
          >
            {cat.emoji}
          </button>
        ))}
      </div>

      {loading && <p className="text-sm text-muted-foreground">Carregando ranking...</p>}
      {error && (
        <p className="rounded-xl border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
          {(error as Error).message}
        </p>
      )}

      {top3.length > 0 && (
        <div className="mb-6 grid grid-cols-3 gap-2">
          {[1, 0, 2].map((idx) => {
            const entry = top3[idx];
            if (!entry) return <div key={idx} />;
            const medals = [Medal, Crown, Trophy];
            const Icon = medals[idx];
            return (
              <div
                key={entry.userId}
                className={cn(
                  'flex flex-col items-center rounded-2xl border p-3 text-center',
                  PODIUM_STYLES[idx],
                  idx === 0 && 'order-2 -mt-2',
                  idx === 1 && 'order-1',
                  idx === 2 && 'order-3',
                )}
              >
                <Icon size={18} className="mb-1" />
                <div className="mb-2 h-12 w-12 overflow-hidden rounded-full bg-muted">
                  {entry.avatarUrl ? (
                    <img
                      src={mediaUrl(entry.avatarUrl)!}
                      alt=""
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center text-lg font-bold">
                      {entry.name?.[0] ?? '?'}
                    </div>
                  )}
                </div>
                <p className="line-clamp-1 text-xs font-bold">{entry.name ?? 'Atleta'}</p>
                <p className="text-lg font-black text-primary">
                  {entry.value}
                  <span className="text-[10px] font-normal text-muted-foreground">
                    {' '}
                    {entry.unit}
                  </span>
                </p>
                <p className="text-[10px] text-muted-foreground">#{entry.rank}</p>
              </div>
            );
          })}
        </div>
      )}

      {rest.length > 0 && (
        <ul className="mb-4 space-y-2">
          {rest.map((entry: {
            rank: number;
            userId: string;
            name?: string;
            avatarUrl?: string;
            value: number;
            unit?: string;
          }) => (
            <li
              key={entry.userId}
              className="flex items-center gap-3 rounded-xl border border-border bg-surface px-3 py-2"
            >
              <span className="w-6 text-sm font-bold text-muted-foreground">{entry.rank}º</span>
              <div className="h-8 w-8 overflow-hidden rounded-full bg-muted">
                {entry.avatarUrl ? (
                  <img src={mediaUrl(entry.avatarUrl)!} alt="" className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full items-center justify-center text-xs font-bold">
                    {entry.name?.[0] ?? '?'}
                  </div>
                )}
              </div>
              <span className="flex-1 truncate text-sm font-semibold">{entry.name ?? 'Atleta'}</span>
              <span className="text-sm font-bold text-primary">
                {entry.value} {entry.unit}
              </span>
            </li>
          ))}
        </ul>
      )}

      {result?.myRank && result.myRank > 10 && (
        <div className="rounded-xl border border-primary/30 bg-primary/5 p-4 text-center">
          <p className="text-sm text-muted-foreground">Sua posição</p>
          <p className="text-2xl font-black text-primary">
            Você está em {result.myRank}º
          </p>
          {result.myValue != null && (
            <p className="text-sm text-muted-foreground">
              {result.myValue} {entries[0]?.unit ?? ''}
            </p>
          )}
        </div>
      )}

      {!loading && entries.length === 0 && city && (
        <p className="text-center text-sm text-muted-foreground">
          Nenhum dado nesta categoria ainda.
        </p>
      )}
    </div>
  );
}
