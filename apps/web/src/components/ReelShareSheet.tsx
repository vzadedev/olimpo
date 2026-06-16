'use client';

import { APP_URL } from '@/lib/config';
import { toast } from '@/store/toast';
import { Copy, MessageCircle, Share2 } from 'lucide-react';
import { Sheet } from '@/components/ui/overlay';

type Props = {
  reelId: string;
  open: boolean;
  onClose: () => void;
};

export function ReelShareSheet({ reelId, open, onClose }: Props) {
  const url = `${APP_URL}/reels/${reelId}`;
  const text = `Confira este vídeo no OLIMPO: ${url}`;

  const copyLink = async (message?: string) => {
    await navigator.clipboard.writeText(url);
    toast.success(message ?? 'Link copiado!');
    onClose();
  };

  const shareNative = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ title: 'OLIMPO', text, url });
        onClose();
      } catch {
        /* cancelled */
      }
    } else {
      toast.warning('Compartilhamento nativo não disponível neste dispositivo');
    }
  };

  return (
    <Sheet open={open} onClose={onClose} title="Compartilhar">
      <div className="space-y-2 px-4 pb-safe">
        <button
          type="button"
          onClick={shareNative}
          className="flex w-full items-center gap-3 rounded-xl border border-border px-4 py-3 text-left"
        >
          <Share2 size={18} /> Compartilhar (nativo)
        </button>
        <a
          href={`https://wa.me/?text=${encodeURIComponent(text)}`}
          target="_blank"
          rel="noreferrer"
          className="flex w-full items-center gap-3 rounded-xl border border-border px-4 py-3"
          onClick={onClose}
        >
          <MessageCircle size={18} /> WhatsApp
        </a>
        <button
          type="button"
          onClick={() => copyLink('Link copiado! Cole nos Stories do Instagram')}
          className="flex w-full items-center gap-3 rounded-xl border border-border px-4 py-3 text-left"
        >
          <Copy size={18} /> Instagram (copiar link)
        </button>
        <button
          type="button"
          onClick={() => copyLink('Link copiado! Cole no TikTok')}
          className="flex w-full items-center gap-3 rounded-xl border border-border px-4 py-3 text-left"
        >
          <Copy size={18} /> TikTok (copiar link)
        </button>
        <button
          type="button"
          onClick={() => copyLink()}
          className="flex w-full items-center gap-3 rounded-xl bg-primary px-4 py-3 font-semibold text-black"
        >
          <Copy size={18} /> Copiar link
        </button>
      </div>
    </Sheet>
  );
}
