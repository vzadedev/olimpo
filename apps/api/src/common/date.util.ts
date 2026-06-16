/** OLIMPO — utilitários de data com fuso horário do usuário (padrão: Brasil). */

export const OLIMPO_DEFAULT_TIMEZONE = 'America/Sao_Paulo';

function parseCalendarDate(dateStr: string) {
  const [y, m, d] = dateStr.split('-').map(Number);
  if (!y || !m || !d) throw new Error(`Data inválida: ${dateStr}`);
  return { y, m, d };
}

/** Converte instante UTC para componentes no fuso informado. */
function zonedParts(instant: Date, timeZone: string) {
  const fmt = new Intl.DateTimeFormat('en-US', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });
  const parts = Object.fromEntries(
    fmt.formatToParts(instant).map((p) => [p.type, p.value]),
  );
  return {
    year: Number(parts.year),
    month: Number(parts.month),
    day: Number(parts.day),
    hour: Number(parts.hour),
    minute: Number(parts.minute),
    second: Number(parts.second),
  };
}

/** Encontra o instante UTC em que o relógio local = dateStr + time no fuso. */
function zonedLocalToUtc(
  dateStr: string,
  time: string,
  timeZone = OLIMPO_DEFAULT_TIMEZONE,
): Date {
  const { y, m, d } = parseCalendarDate(dateStr);
  const [hh, mm, rest] = time.split(':');
  const [ss, ms = '0'] = (rest ?? '0').split('.');
  const target = Date.UTC(y, m - 1, d, Number(hh), Number(mm), Number(ss), Number(ms));

  let guess = target;
  for (let i = 0; i < 4; i++) {
    const p = zonedParts(new Date(guess), timeZone);
    const localAsUtc = Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute, p.second);
    guess += target - localAsUtc;
  }
  return new Date(guess);
}

export function getDayBoundsInTimeZone(
  dateStr: string,
  timeZone = OLIMPO_DEFAULT_TIMEZONE,
): { start: Date; end: Date } {
  return {
    start: zonedLocalToUtc(dateStr, '00:00:00.000', timeZone),
    end: zonedLocalToUtc(dateStr, '23:59:59.999', timeZone),
  };
}

export function getLocalCalendarDate(
  instant = new Date(),
  timeZone = OLIMPO_DEFAULT_TIMEZONE,
): string {
  const p = zonedParts(instant, timeZone);
  return `${p.year}-${String(p.month).padStart(2, '0')}-${String(p.day).padStart(2, '0')}`;
}
