import { getColdBrewVariant, getMethod } from '../../data';
import { createLocalStore, useLocalStore } from '../../lib/localStore';
import { isGrindRecord, type GrindRecord } from '../grinder/store';

export const RATINGS = [1, 2, 3, 4, 5] as const;
export type Rating = (typeof RATINGS)[number];

/** Wpis w dzienniku parzeń. Powstaje sam po zakończeniu parzenia. */
export interface JournalEntry {
  id: string;
  methodId: string;
  /** Kiedy skończyło się parzenie. */
  brewedAt: number;
  coffeeG: number;
  waterMl: number;
  /** Wariant cold brew (np. z cynamonem). */
  variantId?: string;
  /** Ziarna z „Moich ziaren”. Nazwa zostaje, nawet gdy ziarna zostaną usunięte. */
  beanId?: string;
  beanName?: string;
  /** Napój wybrany w ścieżce „Mam kawę”. */
  drinkId?: string;
  /** Własny przepis. Nazwa zostaje, nawet gdy przepis zostanie usunięty. */
  recipeId?: string;
  recipeName?: string;
  /** Młynek i jego ustawienie w chwili parzenia. */
  grind?: GrindRecord;
  rating?: Rating;
  note?: string;
}

export type JournalInput = Omit<JournalEntry, 'id' | 'brewedAt'>;
export type JournalPatch = Partial<Pick<JournalEntry, 'rating' | 'note' | 'beanId' | 'beanName'>>;

export const JOURNAL_KEY = 'barista-companion.journal.v1';

/** Najstarsze wpisy ponad limit wypadają, żeby zapis nie rósł bez końca. */
export const MAX_ENTRIES = 500;

const isNumber = (value: unknown): value is number => typeof value === 'number' && Number.isFinite(value);
const optionalString = (value: unknown) => value === undefined || typeof value === 'string';

function isEntry(value: unknown): value is JournalEntry {
  if (typeof value !== 'object' || value === null) return false;
  const e = value as Record<string, unknown>;
  return (
    typeof e.id === 'string' &&
    typeof e.methodId === 'string' &&
    getMethod(e.methodId) !== undefined &&
    isNumber(e.brewedAt) &&
    isNumber(e.coffeeG) &&
    isNumber(e.waterMl) &&
    (e.rating === undefined || (RATINGS as readonly unknown[]).includes(e.rating)) &&
    (e.variantId === undefined || (typeof e.variantId === 'string' && getColdBrewVariant(e.variantId) !== undefined)) &&
    optionalString(e.beanId) &&
    optionalString(e.beanName) &&
    optionalString(e.drinkId) &&
    optionalString(e.recipeId) &&
    optionalString(e.recipeName) &&
    (e.grind === undefined || isGrindRecord(e.grind)) &&
    optionalString(e.note)
  );
}

// Uszkodzone wpisy pomijamy, zamiast tracić cały dziennik.
const parseJournal = (value: unknown): JournalEntry[] => (Array.isArray(value) ? value.filter(isEntry) : []);

const store = createLocalStore<JournalEntry[]>(JOURNAL_KEY, parseJournal, []);

// crypto.randomUUID działa tylko przez HTTPS (patrz beans/store.ts).
const newId = () =>
  globalThis.crypto?.randomUUID?.() ?? `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;

export const journalStore = {
  subscribe: store.subscribe,
  getSnapshot: store.getSnapshot,
  isPersistent: store.isPersistent,
  reset: store.reset,
  add(input: JournalInput, now = Date.now()): JournalEntry {
    const entry: JournalEntry = { ...input, id: newId(), brewedAt: now };
    store.set([entry, ...store.getSnapshot()].slice(0, MAX_ENTRIES));
    return entry;
  },
  update(id: string, patch: JournalPatch) {
    store.set(
      store.getSnapshot().map((entry) => {
        if (entry.id !== id) return entry;
        const next = { ...entry, ...patch };
        // Puste pola usuwamy, zamiast zapisywać undefined albo pusty tekst.
        if (!next.note?.trim()) delete next.note;
        if (!next.beanId) {
          delete next.beanId;
          delete next.beanName;
        }
        return next;
      }),
    );
  },
  remove(id: string) {
    store.set(store.getSnapshot().filter((entry) => entry.id !== id));
  },
  get(id: string): JournalEntry | undefined {
    return store.getSnapshot().find((entry) => entry.id === id);
  },
};

/** Wszystkie wpisy, najnowsze pierwsze. */
export function useJournal(): JournalEntry[] {
  return useLocalStore(store);
}
