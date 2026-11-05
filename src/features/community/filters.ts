import { getMethod, type Temperature } from '../../data';
import { foldText } from '../../lib/format';
import type { CommunitySort } from './api';

/**
 * Wyszukiwanie i filtry zakładki Społeczność. Trzymamy je w adresie (te same nazwy co w katalogu:
 * ?q=&temp=zimne&mleko=bez&alkohol=bez, do tego &metoda=id&kolejnosc=popularne), więc po powrocie
 * z napoju albo przepisu lista wygląda tak samo. Filtruje serwer (lista wczytuje się stronami).
 */
export interface CommunityFilters {
  query: string;
  sort: CommunitySort;
  methodId?: string;
  /** Tylko napoje. */
  temperature?: Temperature;
  /** Tylko napoje. */
  milk?: 'with' | 'without';
  /** Tylko napoje. */
  noAlcohol?: boolean;
}

const TEMP_PARAM: Record<Temperature, string> = { hot: 'cieple', cold: 'zimne' };
const MILK_PARAM = { with: 'z', without: 'bez' } as const;

const keyOf = <V extends string>(record: Record<string, V>, value: string | null) =>
  Object.keys(record).find((key) => record[key] === value);

export function filtersFromParams(params: URLSearchParams): CommunityFilters {
  const methodId = params.get('metoda');
  const temperature = keyOf(TEMP_PARAM, params.get('temp')) as Temperature | undefined;
  const milk = keyOf(MILK_PARAM, params.get('mleko')) as CommunityFilters['milk'];
  return {
    query: params.get('q') ?? '',
    sort: params.get('kolejnosc') === 'popularne' ? 'popular' : 'newest',
    ...(methodId && getMethod(methodId) && { methodId }),
    ...(temperature && { temperature }),
    ...(milk && { milk }),
    ...(params.get('alkohol') === 'bez' && { noAlcohol: true }),
  };
}

/** Adres sekcji z filtrami (sekcja „napoje” jest domyślna, więc bez parametru). */
export function filtersToParams(section: string, filters: CommunityFilters): URLSearchParams {
  const params = new URLSearchParams();
  if (section !== 'napoje') params.set('sekcja', section);
  if (filters.query) params.set('q', filters.query);
  if (filters.methodId) params.set('metoda', filters.methodId);
  if (filters.temperature) params.set('temp', TEMP_PARAM[filters.temperature]);
  if (filters.milk) params.set('mleko', MILK_PARAM[filters.milk]);
  if (filters.noAlcohol) params.set('alkohol', 'bez');
  if (filters.sort === 'popular') params.set('kolejnosc', 'popularne');
  return params;
}

/** Czy coś zawęża listę (kolejność się nie liczy). */
export const isNarrowed = (filters: CommunityFilters) =>
  searchWords(filters.query).length > 0 ||
  filters.methodId !== undefined ||
  filters.temperature !== undefined ||
  filters.milk !== undefined ||
  filters.noAlcohol === true;

/**
 * Słowa zapytania do wyszukiwania na serwerze, złożone jak foldText (tak jak kolumna search_text
 * w bazie): tylko litery i cyfry, bez powtórzeń, najwyżej 6. Każde słowo musi wystąpić.
 */
export function searchWords(query: string): string[] {
  return [...new Set(foldText(query).split(/[^a-z0-9]+/).filter(Boolean))].slice(0, 6);
}
