/** Polska odmiana rzeczownika po liczebniku: 1 napój, 2 napoje, 5 napojów, 22 napoje. */
export function plural(n: number, [one, few, many]: [string, string, string]): string {
  const abs = Math.abs(n);
  if (abs === 1) return one;
  const mod10 = abs % 10;
  const mod100 = abs % 100;
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return few;
  return many;
}

export function count(n: number, forms: [string, string, string]): string {
  return `${n} ${plural(n, forms)}`;
}

/** Czas w minutach: „8 min”, „1 h 15 min”, a powyżej 2 godzin w pełnych godzinach: „16 h”. */
export function formatMinutes(min: number): string {
  if (min < 60) return `${min} min`;
  if (min >= 120) return `${Math.round(min / 60)} h`;
  const rest = min % 60;
  return rest ? `1 h ${rest} min` : '1 h';
}

export function formatSeconds(sec: number): string {
  if (sec < 60) return `${sec} s`;
  return formatMinutes(Math.round(sec / 60));
}

export function capitalize(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1);
}

/** Tekst do wyszukiwania: małe litery, bez polskich znaków („Pomarańczowa” → „pomaranczowa”). */
export function foldText(text: string): string {
  return text
    .toLowerCase()
    .replace(/ł/g, 'l')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '');
}

/** Czy każde słowo zapytania występuje w którymś z tekstów (puste zapytanie pasuje do wszystkiego). */
export function matchesQuery(query: string, texts: (string | undefined)[]): boolean {
  const words = foldText(query).split(/\s+/).filter(Boolean);
  if (words.length === 0) return true;
  const haystack = foldText(texts.filter(Boolean).join(' '));
  return words.every((word) => haystack.includes(word));
}
