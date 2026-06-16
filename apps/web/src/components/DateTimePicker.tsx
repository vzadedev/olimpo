'use client';

import { useMemo, useState } from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Calendar as CalendarIcon, Clock } from 'lucide-react';
import { DayPicker } from 'react-day-picker';
import * as Popover from '@radix-ui/react-popover';
import { cn } from '@/lib/utils';
import 'react-day-picker/style.css';

function toLocalDateTimeValue(date: Date) {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function fromLocalDateTimeValue(value: string) {
  return new Date(value);
}

export function DateTimePicker({
  value,
  onChange,
  minDate = new Date(),
  label = 'Data e hora do duelo',
}: {
  value: Date | null;
  onChange: (date: Date | null) => void;
  minDate?: Date;
  label?: string;
}) {
  const [open, setOpen] = useState(false);
  const selected = value ?? undefined;

  const minLocal = useMemo(() => toLocalDateTimeValue(minDate), [minDate]);

  const timeValue = value
    ? `${String(value.getHours()).padStart(2, '0')}:${String(value.getMinutes()).padStart(2, '0')}`
    : '12:00';

  const applyTime = (date: Date, time: string) => {
    const [h, m] = time.split(':').map(Number);
    const next = new Date(date);
    next.setHours(h, m, 0, 0);
    return next;
  };

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium">{label}</label>
      <div className="flex gap-2">
        <Popover.Root open={open} onOpenChange={setOpen} modal>
          <Popover.Trigger asChild>
            <button
              type="button"
              className={cn(
                'flex flex-1 items-center gap-2 rounded-xl border border-border bg-background px-3 py-2 text-sm',
                !value && 'text-muted-foreground',
              )}
            >
              <CalendarIcon size={16} />
              {value
                ? format(value, "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })
                : 'Selecionar data'}
            </button>
          </Popover.Trigger>
          <Popover.Portal>
            <Popover.Content
              className="z-[300] rounded-xl border border-border bg-surface p-3 shadow-lg"
              sideOffset={8}
              onOpenAutoFocus={(e) => e.preventDefault()}
            >
              <DayPicker
                mode="single"
                selected={selected}
                disabled={{ before: minDate }}
                onSelect={(day) => {
                  if (!day) return;
                  const base = value ?? new Date(minDate.getTime() + 3600000);
                  const next = applyTime(day, timeValue);
                  if (next.getTime() <= minDate.getTime()) {
                    onChange(new Date(minDate.getTime() + 3600000));
                  } else {
                    onChange(next);
                  }
                }}
                locale={ptBR}
              />
              <div className="mt-2 flex items-center gap-2 border-t border-border pt-2">
                <Clock size={14} className="text-muted-foreground" />
                <input
                  type="time"
                  value={timeValue}
                  onChange={(e) => {
                    const day = value ?? new Date(minDate.getTime() + 3600000);
                    const next = applyTime(day, e.target.value);
                    if (next.getTime() <= minDate.getTime()) {
                      onChange(new Date(minDate.getTime() + 3600000));
                    } else {
                      onChange(next);
                    }
                  }}
                  className="rounded-lg border border-border bg-background px-2 py-1 text-sm"
                />
              </div>
              <Popover.Arrow className="fill-border" />
            </Popover.Content>
          </Popover.Portal>
        </Popover.Root>
      </div>
      <input
        type="datetime-local"
        min={minLocal}
        value={value ? toLocalDateTimeValue(value) : ''}
        onChange={(e) => {
          if (!e.target.value) {
            onChange(null);
            return;
          }
          const next = fromLocalDateTimeValue(e.target.value);
          if (next.getTime() <= minDate.getTime()) {
            onChange(new Date(minDate.getTime() + 3600000));
          } else {
            onChange(next);
          }
        }}
        className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm"
      />
    </div>
  );
}
