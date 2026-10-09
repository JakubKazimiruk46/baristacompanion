import type { BrewMethod } from '../../data';

/** Widoki listy metod: alfabetycznie, ostatnio parzone (z dziennika), tylko ulubione. */
export const METHOD_VIEWS = ['az', 'ostatnie', 'ulubione'] as const;
export type MethodView = (typeof METHOD_VIEWS)[number];

export const METHOD_VIEW_LABELS: Record<MethodView, string> = {
  az: 'A–Z',
  ostatnie: 'Ostatnio parzone',
  ulubione: 'Ulubione',
};

/** Widok z adresu (?widok=); nieznany albo brak: alfabetycznie. */
export function methodViewFrom(params: URLSearchParams): MethodView {
  const value = params.get('widok');
  return (METHOD_VIEWS as readonly string[]).includes(value ?? '') ? (value as MethodView) : 'az';
}

/** Kiedy ostatnio parzono każdą metodą (z wpisów dziennika). */
export function lastBrewed(entries: { methodId: string; brewedAt: number }[]): Map<string, number> {
  const last = new Map<string, number>();
  for (const entry of entries) {
    if (entry.brewedAt > (last.get(entry.methodId) ?? -Infinity)) last.set(entry.methodId, entry.brewedAt);
  }
  return last;
}

const byName = (a: BrewMethod, b: BrewMethod) => a.name.localeCompare(b.name, 'pl');

/**
 * Metody w danym widoku. „Ostatnio parzone”: najpierw parzone (od najświeższej), potem reszta
 * alfabetycznie. „Ulubione”: tylko ulubione, alfabetycznie.
 */
export function methodsInView(
  methods: BrewMethod[],
  view: MethodView,
  context: { favorites: string[]; lastBrewed: Map<string, number> },
): BrewMethod[] {
  const sorted = [...methods].sort(byName);
  if (view === 'ulubione') return sorted.filter((method) => context.favorites.includes(method.id));
  if (view === 'ostatnie') {
    const at = (method: BrewMethod) => context.lastBrewed.get(method.id) ?? -Infinity;
    // Sortowanie jest stabilne: metody bez parzenia zostają w kolejności alfabetycznej.
    return sorted.sort((a, b) => (at(a) === at(b) ? 0 : at(b) > at(a) ? 1 : -1));
  }
  return sorted;
}
