/**
 * Wspólny format danych do synchronizacji i kopii zapasowej. Każdy rekord ma czas ostatniej
 * zmiany, a usunięty zostaje jako znacznik usunięcia (bez danych), żeby usunięcie też było
 * zmianą, która wygrywa ze starszą wersją z innego urządzenia.
 */

export const COLLECTIONS = [
  'beans',
  'journal',
  'favorites',
  'shelf',
  'shopping',
  'doses',
  'grinders',
  'recipes',
  'drinks',
  'wishlist',
  'method-favorites',
] as const;
export type CollectionName = (typeof COLLECTIONS)[number];

export const COLLECTION_LABELS: Record<CollectionName, string> = {
  beans: 'ziarna',
  journal: 'dziennik',
  favorites: 'ulubione',
  shelf: 'półka',
  shopping: 'lista zakupów',
  doses: 'ilości z kalkulatora',
  grinders: 'młynki',
  recipes: 'własne przepisy',
  drinks: 'moje napoje',
  wishlist: 'do spróbowania',
  'method-favorites': 'ulubione metody',
};

export interface SyncRecord {
  id: string;
  /** Ostatnia zmiana (ms od epoki). 0: zapis sprzed synchronizacji (stary .v1), najstarszy możliwy. */
  updatedAt: number;
  /** Kiedy usunięto. Usunięty rekord nie ma danych. */
  deletedAt?: number;
  data?: unknown;
  /** Tylko na urządzeniu: zmieniony tutaj i jeszcze niewysłany. */
  dirty?: boolean;
}

/** Czas ostatniej zmiany, z usunięciem włącznie. */
export const changedAt = (record: SyncRecord) => Math.max(record.updatedAt, record.deletedAt ?? 0);

export const isDeleted = (record: SyncRecord) => record.deletedAt !== undefined;

/** JSON z kluczami w stałej kolejności: ta sama treść daje ten sam tekst. */
export function stableStringify(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(',')}]`;
  if (value !== null && typeof value === 'object') {
    const entries = Object.entries(value as Record<string, unknown>)
      .filter(([, v]) => v !== undefined)
      .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0));
    return `{${entries.map(([k, v]) => `${JSON.stringify(k)}:${stableStringify(v)}`).join(',')}}`;
  }
  return JSON.stringify(value) ?? 'null';
}

export const sameData = (a: unknown, b: unknown) => stableStringify(a) === stableStringify(b);

/** Ta sama wersja rekordu (dane i usunięcie). Czas nie ma znaczenia. */
export const sameRecord = (a: SyncRecord, b: SyncRecord) =>
  isDeleted(a) === isDeleted(b) && (isDeleted(a) || sameData(a.data, b.data));
