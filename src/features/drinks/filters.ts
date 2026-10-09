import { hasAlcohol, hasMilk, isPlantBasedPossible, type Drink, type Temperature } from '../../data';
import { isMyDrinkId } from '../assistant/myDrinks';
import { canMake } from '../shelf/availability';
import { matchesQuery } from '../../lib/format';
import { DEFAULT_SHELF, type Shelf } from '../shelf/store';

export const TIME_LIMITS = [10, 15, 30] as const;
export type TimeLimit = (typeof TIME_LIMITS)[number];

export interface DrinkFilters {
  favorites?: boolean;
  /** Tylko napoje z listy „Do spróbowania”. */
  toTry?: boolean;
  /** Tylko „Moje napoje” (od asystenta). */
  mine?: boolean;
  /** Tylko napoje, które da się zrobić z tego, co jest w domu. */
  available?: boolean;
  temperature?: Temperature;
  milk?: 'with' | 'without';
  plantBased?: boolean;
  /** Tylko napoje bez alkoholu. */
  noAlcohol?: boolean;
  maxTimeMin?: TimeLimit;
}

/** Stan użytkownika, którego potrzebują niektóre filtry. */
export interface FilterContext {
  favoriteIds?: string[];
  wishlistIds?: string[];
  shelf?: Shelf;
}

/** Wszystkie filtry działają razem (AND). */
export function filterDrinks(list: Drink[], filters: DrinkFilters, context: FilterContext = {}): Drink[] {
  return list.filter((drink) => {
    if (filters.favorites && !context.favoriteIds?.includes(drink.id)) return false;
    if (filters.toTry && !context.wishlistIds?.includes(drink.id)) return false;
    if (filters.mine && !isMyDrinkId(drink.id)) return false;
    if (filters.available && !canMake(drink, context.shelf ?? DEFAULT_SHELF)) return false;
    if (filters.temperature && drink.temperature !== filters.temperature) return false;
    if (filters.milk === 'with' && !hasMilk(drink)) return false;
    if (filters.milk === 'without' && hasMilk(drink)) return false;
    if (filters.plantBased && !isPlantBasedPossible(drink)) return false;
    if (filters.noAlcohol && hasAlcohol(drink)) return false;
    if (filters.maxTimeMin && drink.prepTimeMin > filters.maxTimeMin) return false;
    return true;
  });
}

export function hasActiveFilters(filters: DrinkFilters): boolean {
  return Object.values(filters).some((value) => value !== undefined && value !== false);
}

// Filtry trzymamy w adresie (?ulubione=1&sprobuj=1&moje=1&mam=1&temp=zimne&mleko=bez&roslinne=1&alkohol=bez&czas=10),
// więc po powrocie z ekranu napoju lista wygląda tak samo.

const TEMP_PARAM: Record<Temperature, string> = { hot: 'cieple', cold: 'zimne' };
const MILK_PARAM = { with: 'z', without: 'bez' } as const;

const invert = <K extends string, V extends string>(record: Record<K, V>) =>
  Object.fromEntries(Object.entries(record).map(([k, v]) => [v, k])) as Record<string, K>;

export function filtersFromParams(params: URLSearchParams): DrinkFilters {
  const temperature = invert(TEMP_PARAM)[params.get('temp') ?? ''];
  const milk = invert(MILK_PARAM)[params.get('mleko') ?? ''];
  const time = Number(params.get('czas'));
  const filters: DrinkFilters = {};
  if (params.get('ulubione') === '1') filters.favorites = true;
  if (params.get('sprobuj') === '1') filters.toTry = true;
  if (params.get('moje') === '1') filters.mine = true;
  if (params.get('mam') === '1') filters.available = true;
  if (temperature) filters.temperature = temperature;
  if (milk) filters.milk = milk;
  if (params.get('roslinne') === '1') filters.plantBased = true;
  if (params.get('alkohol') === 'bez') filters.noAlcohol = true;
  if ((TIME_LIMITS as readonly number[]).includes(time)) filters.maxTimeMin = time as TimeLimit;
  return filters;
}

export function filtersToParams(filters: DrinkFilters): URLSearchParams {
  const params = new URLSearchParams();
  if (filters.favorites) params.set('ulubione', '1');
  if (filters.toTry) params.set('sprobuj', '1');
  if (filters.mine) params.set('moje', '1');
  if (filters.available) params.set('mam', '1');
  if (filters.temperature) params.set('temp', TEMP_PARAM[filters.temperature]);
  if (filters.milk) params.set('mleko', MILK_PARAM[filters.milk]);
  if (filters.plantBased) params.set('roslinne', '1');
  if (filters.noAlcohol) params.set('alkohol', 'bez');
  if (filters.maxTimeMin) params.set('czas', String(filters.maxTimeMin));
  return params;
}

/** Wyszukiwanie po nazwie i haśle napoju (bez polskich znaków i wielkości liter). */
export function searchDrinks(list: Drink[], query: string): Drink[] {
  return query.trim() ? list.filter((drink) => matchesQuery(query, [drink.name, drink.tagline])) : list;
}

/** Filtry z okna „Filtry” (szybkie są w rzędzie nad listą): ile z nich jest włączonych. */
export const SHEET_FILTERS = ['milk', 'plantBased', 'noAlcohol', 'maxTimeMin'] as const satisfies readonly (keyof DrinkFilters)[];

export function sheetFilterCount(filters: DrinkFilters): number {
  return SHEET_FILTERS.filter((key) => filters[key] !== undefined && filters[key] !== false).length;
}
