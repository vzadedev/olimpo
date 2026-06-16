'use client';

import { useMutation } from '@apollo/client';
import { useState } from 'react';
import { REPORT_REEL } from '@/lib/graphql';
import { toast } from '@/store/toast';
import { Modal } from '@/components/ui/overlay';

const REASONS = [
  'Conteúdo inapropriado',
  'Spam',
  'Violência',
  'Nudez',
  'Outros',
];

type Props = {
  submissionId: string;
  open: boolean;
  onClose: () => void;
};

export function ReelReportModal({ submissionId, open, onClose }: Props) {
  const [reason, setReason] = useState(REASONS[0]);
  const [description, setDescription] = useState('');
  const [reportReel, { loading }] = useMutation(REPORT_REEL);

  const submit = async () => {
    try {
      await reportReel({
        variables: {
          input: { submissionId, reason, description: description || undefined },
        },
      });
      toast.success('Denúncia enviada. Obrigado!');
      onClose();
    } catch {
      toast.error('Não foi possível enviar a denúncia');
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="Denunciar vídeo">
      <div className="space-y-3">
        {REASONS.map((r) => (
          <label key={r} className="flex items-center gap-2 text-sm">
            <input
              type="radio"
              name="reason"
              checked={reason === r}
              onChange={() => setReason(r)}
            />
            {r}
          </label>
        ))}
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Descreva o problema (opcional)"
          className="w-full rounded-xl border border-border bg-background p-3 text-sm outline-none focus:ring-2 focus:ring-primary"
          rows={3}
        />
        <div className="flex gap-2 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 rounded-xl border border-border py-3 font-medium"
          >
            Cancelar
          </button>
          <button
            type="button"
            disabled={loading}
            onClick={submit}
            className="flex-1 rounded-xl bg-destructive py-3 font-semibold text-white disabled:opacity-50"
          >
            Enviar denúncia
          </button>
        </div>
      </div>
    </Modal>
  );
}
