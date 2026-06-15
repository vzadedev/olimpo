'use client';

import { X, CheckCircle, AlertCircle, AlertTriangle } from 'lucide-react';
import { useToastStore } from '@/store/toast';
import { cn } from '@/lib/utils';

const icons = {
  success: CheckCircle,
  error: AlertCircle,
  warning: AlertTriangle,
};

const styles = {
  success: 'border-primary/40 bg-primary/10 text-primary',
  error: 'border-destructive/40 bg-destructive/10 text-destructive',
  warning: 'border-yellow-500/40 bg-yellow-500/10 text-yellow-500',
};

export function Toaster() {
  const toasts = useToastStore((s) => s.toasts);
  const remove = useToastStore((s) => s.remove);

  return (
    <div className="fixed top-4 left-1/2 z-[100] flex w-full max-w-sm -translate-x-1/2 flex-col gap-2 px-4">
      {toasts.map((t) => {
        const Icon = icons[t.type];
        return (
          <div
            key={t.id}
            className={cn(
              'flex items-center gap-3 rounded-xl border px-4 py-3 shadow-lg backdrop-blur-md',
              styles[t.type],
            )}
          >
            <Icon size={20} className="shrink-0" />
            <p className="flex-1 text-sm font-medium text-foreground">{t.message}</p>
            <button type="button" onClick={() => remove(t.id)}>
              <X size={16} />
            </button>
          </div>
        );
      })}
    </div>
  );
}
