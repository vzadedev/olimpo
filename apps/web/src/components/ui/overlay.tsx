'use client';

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

type SheetProps = {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  className?: string;
};

export function Sheet({ open, onClose, title, children, className }: SheetProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  if (!mounted || !open) return null;

  return createPortal(
    <div className="fixed inset-0 z-[200] flex items-end justify-center">
      <button
        type="button"
        aria-label="Fechar"
        className="absolute inset-0 bg-black/60"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        className={cn(
          'relative z-[201] flex max-h-[min(85vh,100dvh)] w-full max-w-md flex-col rounded-t-[36px] bg-black/60 backdrop-blur-2xl border-t border-white/10 shadow-[0_-10px_50px_rgba(0,0,0,0.8)]',
          className,
        )}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="absolute top-3 left-1/2 -translate-x-1/2 h-1.5 w-12 rounded-full bg-white/20" />
        {title && (
          <div className="flex shrink-0 items-center justify-between border-b border-white/10 px-5 pt-8 pb-4">
            <h3 className="text-xl font-bold tracking-tight text-white/90">{title}</h3>
            <button
              type="button"
              onClick={onClose}
              className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-white/70 hover:bg-white/20 hover:text-white transition-colors"
            >
              <X size={16} />
            </button>
          </div>
        )}
        {children}
      </div>
    </div>,
    document.body,
  );
}

type ModalProps = {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  className?: string;
};

export function Modal({ open, onClose, title, children, className }: ModalProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  if (!mounted || !open) return null;

  return createPortal(
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      <button
        type="button"
        aria-label="Fechar"
        className="absolute inset-0 bg-black/70"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        className={cn(
          'relative z-[201] w-full max-w-md rounded-3xl bg-black/60 backdrop-blur-2xl border border-white/10 p-6 shadow-2xl',
          className,
        )}
        onClick={(e) => e.stopPropagation()}
      >
        {title && (
          <div className="mb-5 flex items-center justify-between">
            <h3 className="text-xl font-bold tracking-tight text-white/90">{title}</h3>
            <button
              type="button"
              onClick={onClose}
              className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-white/70 hover:bg-white/20 hover:text-white transition-colors"
            >
              <X size={16} />
            </button>
          </div>
        )}
        {children}
      </div>
    </div>,
    document.body,
  );
}
