import { getIngredient, NOTE_LABELS, ROASTS, type BeanProfile, type Drink, type Roast } from '../../data';
import { matchesQuery } from '../../lib/format';
import type { SavedBean } from '../beans/store';

/** Sekcje Baribaru w adresie (?sekcja=). */
export const BAR_SECTIONS = ['ziarna', 'mleka', 'syropy', 'dodatki', 'sprzet'] as const;
export type BarSection = (typeof BAR_SECTIONS)[number];

export const BAR_SECTION_LABELS: Record<BarSection, string> = {
  ziarna: 'Ziarna',
  mleka: 'Mleka',
  syropy: 'Syropy',
  dodatki: 'Dodatki',
  sprzet: 'Sprzęt',
};

export function barSectionFrom(params: URLSearchParams): BarSection {
  const value = params.get('sekcja');
  return (BAR_SECTIONS as readonly string[]).includes(value ?? '') ? (value as BarSection) : 'ziarna';
}

/** Adres sekcji Baribaru, w której zaznacza się ten składnik (np. z listy braków). */
export function barPathFor(ingredientId?: string): string {
  const group = ingredientId ? getIngredient(ingredientId)?.group : undefined;
  const section: BarSection = group === 'syrup' ? 'syropy' : group && group !== 'milk' ? 'dodatki' : 'mleka';
  return `/baribar?sekcja=${section}`;
}

// ── Ziarna ──────────────────────────────────────────────────────────────

export interface BeanFilters {
  query?: string;
  roast?: Roast;
  kind?: BeanProfile['kind'];
}

/** Szukanie po nazwie, palarni, pochodzeniu i nutach; palenie i rodzaj zawężają. */
export function filterBeans(beans: SavedBean[], filters: BeanFilters): SavedBean[] {
  return beans.filter(
    (bean) =>
      (!filters.roast || bean.profile.roast === filters.roast) &&
      (!filters.kind || bean.profile.kind === filters.kind) &&
      matchesQuery(filters.query ?? '', [
        bean.name,
        bean.roaster,
        bean.profile.origin,
        ...bean.profile.notes.map((note) => NOTE_LABELS[note]),
      ]),
  );
}

/** Ziarna w grupach według palenia (od jasnego), bez pustych grup. Kolejność w grupie zostaje. */
export function groupByRoast(beans: SavedBean[]): { roast: Roast; beans: SavedBean[] }[] {
  return ROASTS.map((roast) => ({ roast, beans: beans.filter((bean) => bean.profile.roast === roast) })).filter(
    (group) => group.beans.length > 0,
  );
}

const ROAST_PARAM: Record<Roast, string> = { light: 'jasne', medium: 'srednie', dark: 'ciemne' };
const KIND_PARAM: Record<BeanProfile['kind'], string> = { 'single-origin': 'single', blend: 'blend' };

const invert = <K extends string>(record: Record<K, string>, value: string | null) =>
  (Object.keys(record) as K[]).find((key) => record[key] === value);

export function beanFiltersFrom(params: URLSearchParams): BeanFilters {
  const filters: BeanFilters = {};
  const query = params.get('q');
  const roast = invert(ROAST_PARAM, params.get('palenie'));
  const kind = invert(KIND_PARAM, params.get('rodzaj'));
  if (query) filters.query = query;
  if (roast) filters.roast = roast;
  if (kind) filters.kind = kind;
  return filters;
}

export function beanFiltersToParams(filters: BeanFilters, section: BarSection = 'ziarna'): URLSearchParams {
  const params = new URLSearchParams();
  if (section !== 'ziarna') params.set('sekcja', section);
  if (filters.query) params.set('q', filters.query);
  if (filters.roast) params.set('palenie', ROAST_PARAM[filters.roast]);
  if (filters.kind) params.set('rodzaj', KIND_PARAM[filters.kind]);
  return params;
}

// ── Półka ───────────────────────────────────────────────────────────────

/** W ilu napojach jest ten składnik (mleko w opcjach, syrop albo dodatek). */
export function drinksUsing(ingredientId: string, drinks: Drink[]): number {
  return drinks.filter(
    (drink) =>
      drink.milk?.options.includes(ingredientId) ||
      drink.extras.some((extra) => (extra.kind === 'syrup' ? extra.syrupId : extra.ingredientId) === ingredientId),
  ).length;
}
