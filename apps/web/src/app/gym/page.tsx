'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery } from '@apollo/client';
import Link from 'next/link';
import { ChevronLeft, Dumbbell } from 'lucide-react';
import type { Gym } from '@gymrank/types';
import { useAuthStore } from '@/store/auth';
import { GYMS } from '@/lib/graphql';
import { mediaUrl } from '@/lib/media';

export default function TrainGymsPage() {
  const router = useRouter();
  const token = useAuthStore((s) => s.token);
  const { data, loading, error } = useQuery<{ gyms: Gym[] }>(GYMS);

  useEffect(() => {
    if (!token) router.replace('/login');
  }, [token, router]);

  if (!token) return null;

  return (
    <div className="px-2 pt-4 pb-20">
      <header className="mb-6 flex items-center gap-3">
        <h1 className="text-2xl font-bold">Competir</h1>
      </header>

      {loading && <p className="text-muted-foreground">Carregando...</p>}
      {error && <p className="text-destructive">Erro ao carregar academias</p>}

      <ul className="space-y-3">
        {data?.gyms.map((gym) => (
          <li key={gym.id}>
            <Link
              href={`/gym/${gym.id}`}
              className="flex items-center gap-4 rounded-2xl border border-border bg-surface p-4 transition active:scale-[0.98]"
            >
              <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-primary/10">
                {gym.photoUrl ? (
                  <img
                    src={mediaUrl(gym.photoUrl)!}
                    alt={gym.name}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <Dumbbell className="text-primary" size={24} />
                )}
              </div>
              <div>
                <p className="font-bold">{gym.name}</p>
                <p className="text-sm text-muted-foreground">Escolha um exercício →</p>
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
