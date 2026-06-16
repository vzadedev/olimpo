'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation, useQuery } from '@apollo/client';
import Link from 'next/link';
import { ChevronLeft, Shield } from 'lucide-react';
import { useAuthStore } from '@/store/auth';
import {
  ME,
  PENDING_REEL_REPORTS,
  UPDATE_REEL_REPORT_STATUS,
} from '@/lib/graphql';
import { toast } from '@/store/toast';

export default function AdminReportsPage() {
  const router = useRouter();
  const token = useAuthStore((s) => s.token);
  const { data: meData } = useQuery(ME, { skip: !token });
  const { data, loading, refetch } = useQuery(PENDING_REEL_REPORTS, {
    skip: !token || meData?.me?.role !== 'admin',
  });
  const [updateStatus] = useMutation(UPDATE_REEL_REPORT_STATUS);

  useEffect(() => {
    if (!token) router.replace('/login');
    else if (meData && meData.me?.role !== 'admin') router.replace('/');
  }, [token, meData, router]);

  if (!token || meData?.me?.role !== 'admin') return null;

  const reports = data?.pendingReelReports ?? [];

  const moderate = async (reportId: string, status: string) => {
    try {
      await updateStatus({ variables: { reportId, status } });
      toast.success(`Denúncia ${status}`);
      refetch();
    } catch {
      toast.error('Erro ao moderar');
    }
  };

  return (
    <div className="px-2 pt-4 pb-24">
      <header className="mb-6 flex items-center gap-3">
        <Link href="/settings" className="flex h-10 w-10 items-center justify-center rounded-full bg-surface">
          <ChevronLeft size={20} />
        </Link>
        <Shield className="text-primary" size={22} />
        <h1 className="text-2xl font-bold">Moderação</h1>
      </header>

      {loading && <p className="text-muted-foreground">Carregando...</p>}

      <ul className="space-y-3">
        {reports.map((r: {
          id: string;
          reason: string;
          description?: string;
          reporterName: string;
          reelExerciseName: string;
          createdAt: string;
        }) => (
          <li key={r.id} className="rounded-2xl border border-border bg-surface p-4">
            <p className="font-bold">{r.reason}</p>
            <p className="text-sm text-muted-foreground">
              {r.reelExerciseName} · por {r.reporterName}
            </p>
            {r.description && (
              <p className="mt-2 text-sm">{r.description}</p>
            )}
            <p className="mt-1 text-xs text-muted-foreground">
              {new Date(r.createdAt).toLocaleString('pt-BR')}
            </p>
            <div className="mt-3 flex gap-2">
              <button
                type="button"
                onClick={() => moderate(r.id, 'resolved')}
                className="flex-1 rounded-xl bg-primary py-2 text-sm font-semibold text-black"
              >
                Resolver
              </button>
              <button
                type="button"
                onClick={() => moderate(r.id, 'dismissed')}
                className="flex-1 rounded-xl border border-border py-2 text-sm"
              >
                Descartar
              </button>
            </div>
          </li>
        ))}
      </ul>

      {!loading && reports.length === 0 && (
        <p className="text-center text-muted-foreground">Nenhuma denúncia pendente.</p>
      )}
    </div>
  );
}
