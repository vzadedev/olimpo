'use client';

import { useEffect, useState } from 'react';
import { searchCities, type CityOption } from '@/lib/cities';
import { cn } from '@/lib/utils';

export function CityPicker({
  value,
  onChange,
  className,
  placeholder = 'Buscar cidade...',
}: {
  value: string;
  onChange: (city: string) => void;
  className?: string;
  placeholder?: string;
}) {
  const [query, setQuery] = useState(value);
  const [options, setOptions] = useState<CityOption[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setQuery(value);
  }, [value]);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    setLoading(true);
    searchCities(query)
      .then((list) => {
        if (!cancelled) setOptions(list);
      })
      .catch(() => {
        if (!cancelled) setOptions([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [query, open]);

  return (
    <div className="relative">
      <input
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        placeholder={placeholder}
        className={cn(
          'w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary',
          className,
        )}
      />
      {open && (
        <ul className="absolute z-30 mt-1 max-h-48 w-full overflow-y-auto rounded-xl border border-border bg-surface shadow-lg">
          {loading && (
            <li className="px-3 py-2 text-sm text-muted-foreground">Carregando...</li>
          )}
          {!loading && options.length === 0 && (
            <li className="px-3 py-2 text-sm text-muted-foreground">Nenhuma cidade encontrada</li>
          )}
          {options.map((c) => (
            <li key={c.id}>
              <button
                type="button"
                className="w-full px-3 py-2 text-left text-sm hover:bg-muted/50"
                onMouseDown={(e) => {
                  e.preventDefault();
                  onChange(c.label);
                  setQuery(c.label);
                  setOpen(false);
                }}
              >
                {c.label}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
