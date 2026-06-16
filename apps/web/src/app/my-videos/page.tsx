'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation, useQuery } from '@apollo/client';
import Link from 'next/link';
import { ChevronLeft, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuthStore } from '@/store/auth';
import { DELETE_REEL, REELS } from '@/lib/graphql';
import { mediaUrl } from '@/lib/media';
import { toast } from '@/store/toast';
import { Modal } from '@/components/ui/overlay';

export default function MyVideosPage() {
  const router = useRouter();
  const token = useAuthStore((s) => s.token);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [removedIds, setRemovedIds] = useState<string[]>([]);

  const { data, loading, refetch } = useQuery(REELS, {
    variables: { mineOnly: true },
    skip: !token,
  });

  const [deleteReel, { loading: deleting }] = useMutation(DELETE_REEL);

  useEffect(() => {
    if (!token) router.replace('/login');
  }, [token, router]);

  const reels = (data?.getReels ?? []).filter(
    (r: { id: string }) => !removedIds.includes(r.id),
  );

  const confirmDelete = async () => {
    if (!deleteId) return;
    try {
      await deleteReel({ variables: { submissionId: deleteId } });
      setRemovedIds((ids) => [...ids, deleteId]);
      setDeleteId(null);
      toast.success('Vídeo excluído');
      refetch();
    } catch {
      toast.error('Erro ao excluir vídeo');
    }
  };

  if (!token) return null;

  return (
    <div className="px-2 pt-4 pb-24">
      <header className="mb-6 flex items-center gap-3">
        <Link href="/settings" className="flex h-10 w-10 items-center justify-center rounded-full bg-surface">
          <ChevronLeft size={20} />
        </Link>
        <h1 className="text-2xl font-bold">Meus Vídeos</h1>
      </header>

      {loading && <p className="text-muted-foreground">Carregando...</p>}

      <AnimatePresence>
        <ul className="space-y-3">
          {reels.map((reel: {
            id: string;
            videoUrl: string;
            exerciseName: string;
            gymName: string;
            weight: number;
            viewCount?: number;
          }) => (
            <motion.li
              key={reel.id}
              layout
              exit={{ opacity: 0, x: -100 }}
              className="flex gap-3 rounded-2xl border border-border bg-surface p-3"
            >
              <video
                src={mediaUrl(reel.videoUrl)!}
                className="h-24 w-20 rounded-lg object-cover bg-black"
                muted
                playsInline
              />
              <div className="flex flex-1 flex-col justify-between">
                <div>
                  <p className="font-bold">{reel.exerciseName}</p>
                  <p className="text-xs text-muted-foreground">{reel.gymName}</p>
                  <p className="text-sm text-primary">{reel.weight}kg · {reel.viewCount ?? 0} views</p>
                </div>
                <button
                  type="button"
                  onClick={() => setDeleteId(reel.id)}
                  className="flex items-center gap-1 text-sm text-destructive"
                >
                  <Trash2 size={14} /> Excluir
                </button>
              </div>
            </motion.li>
          ))}
        </ul>
      </AnimatePresence>

      {!loading && reels.length === 0 && (
        <p className="text-center text-muted-foreground">Você ainda não publicou vídeos.</p>
      )}

      <Modal
        open={!!deleteId}
        onClose={() => setDeleteId(null)}
        title="Excluir vídeo"
      >
        <p className="mb-4 text-sm text-muted-foreground">
          Tem certeza que deseja excluir este vídeo? Esta ação não pode ser desfeita.
        </p>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setDeleteId(null)}
            className="flex-1 rounded-xl border border-border py-3 font-medium"
          >
            Cancelar
          </button>
          <button
            type="button"
            disabled={deleting}
            onClick={confirmDelete}
            className="flex-1 rounded-xl bg-destructive py-3 font-semibold text-white disabled:opacity-50"
          >
            {deleting ? 'Excluindo...' : 'Excluir'}
          </button>
        </div>
      </Modal>
    </div>
  );
}
