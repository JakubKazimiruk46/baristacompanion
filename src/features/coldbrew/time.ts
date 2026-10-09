// Czyste funkcje długiego timera cold brew. „Teraz” zawsze przychodzi z zewnątrz,
// a etykiety liczymy w lokalnym czasie telefonu (dni kalendarzowe, nie doby po 24 h).

const HOUR = 3600_000;

export function readyAt(startedAt: number, hours: number): number {
  return startedAt + hours * HOUR;
}

export function progress(startedAt: number, hours: number, now: number): number {
  return Math.min(1, Math.max(0, (now - startedAt) / (hours * HOUR)));
}

export function isReady(startedAt: number, hours: number, now: number): boolean {
  return now >= readyAt(startedAt, hours);
}

const WEEKDAYS = ['w niedzielę', 'w poniedziałek', 'we wtorek', 'w środę', 'w czwartek', 'w piątek', 'w sobotę'];

/** Ile dni kalendarzowych dzieli dwie chwile (północ do północy). */
function calendarDaysBetween(from: Date, to: Date): number {
  const a = new Date(from.getFullYear(), from.getMonth(), from.getDate());
  const b = new Date(to.getFullYear(), to.getMonth(), to.getDate());
  // Math.round chroni przed dobami 23- i 25-godzinnymi przy zmianie czasu.
  return Math.round((b.getTime() - a.getTime()) / (24 * HOUR));
}

export function clockTime(date: Date): string {
  return `${date.getHours()}:${String(date.getMinutes()).padStart(2, '0')}`;
}

/** „dziś o 22:15”, „jutro o 8:30”, „pojutrze o 6:00”, „w czwartek o 8:30”. */
export function dayAndTime(at: number, now: number): string {
  const date = new Date(at);
  const days = calendarDaysBetween(new Date(now), date);
  const day =
    days === 0
      ? 'dziś'
      : days === 1
        ? 'jutro'
        : days === 2
          ? 'pojutrze'
          : days === -1
            ? 'wczoraj'
            : days > 0 && days < 7
              ? WEEKDAYS[date.getDay()]!
              : `${date.getDate()}.${String(date.getMonth() + 1).padStart(2, '0')}`;
  return `${day} o ${clockTime(date)}`;
}

/** Krótko, kiedy coś było: „dziś”, „wczoraj”, „3 dni temu”, „12.09”. */
export function shortDay(at: number, now: number): string {
  const date = new Date(at);
  const days = calendarDaysBetween(date, new Date(now));
  if (days <= 0) return 'dziś';
  if (days === 1) return 'wczoraj';
  if (days < 7) return `${days} dni temu`;
  return `${date.getDate()}.${String(date.getMonth() + 1).padStart(2, '0')}`;
}

/** „11 h 20 min”, „45 min”, „mniej niż minuta”. */
export function formatRemaining(ms: number): string {
  const totalMin = Math.ceil(ms / 60_000);
  if (totalMin <= 0) return 'mniej niż minuta';
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  if (h === 0) return `${m} min`;
  return m === 0 ? `${h} h` : `${h} h ${m} min`;
}
