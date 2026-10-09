import { getIngredient, getMethod, ingredients } from '../../data';
import { createLocalStore, useLocalStore } from '../../lib/localStore';

/** Co jest w domu: składniki z katalogu i sprzęt do parzenia. */
export interface Shelf {
  ingredients: string[];
  /** Metody, którymi da się parzyć. Pusto = nie wiadomo, więc sprzętu nie sprawdzamy. */
  methods: string[];
}

export const SHELF_KEY = 'barista-companion.shelf.v1';

/** Zanim użytkownik coś zaznaczy: tylko to, co prawie każdy ma w kuchni (lód, cukier). */
export const DEFAULT_SHELF: Shelf = {
  ingredients: ingredients.filter((i) => i.staple).map((i) => i.id),
  methods: [],
};

const knownIds = (value: unknown, known: (id: string) => unknown): string[] =>
  Array.isArray(value)
    ? [...new Set(value.filter((id): id is string => typeof id === 'string' && known(id) !== undefined))]
    : [];

export function parseShelf(value: unknown): Shelf | null {
  if (typeof value !== 'object' || value === null) return null;
  const v = value as Record<string, unknown>;
  return { ingredients: knownIds(v.ingredients, getIngredient), methods: knownIds(v.methods, getMethod) };
}

// null: półka jeszcze nieustawiona (ekran napoju nie pokazuje wtedy braków).
const store = createLocalStore<Shelf | null>(SHELF_KEY, parseShelf, null);

const current = () => store.getSnapshot() ?? DEFAULT_SHELF;
const toggle = (list: string[], id: string) => (list.includes(id) ? list.filter((x) => x !== id) : [...list, id]);

export const shelfStore = {
  subscribe: store.subscribe,
  getSnapshot: store.getSnapshot,
  reset: store.reset,
  set: store.set,
  toggleIngredient(id: string) {
    const shelf = current();
    store.set({ ...shelf, ingredients: toggle(shelf.ingredients, id) });
  },
  toggleMethod(id: string) {
    const shelf = current();
    store.set({ ...shelf, methods: toggle(shelf.methods, id) });
  },
  addIngredient(id: string) {
    const shelf = current();
    if (!shelf.ingredients.includes(id)) store.set({ ...shelf, ingredients: [...shelf.ingredients, id] });
  },
  removeIngredient(id: string) {
    const shelf = current();
    store.set({ ...shelf, ingredients: shelf.ingredients.filter((x) => x !== id) });
  },
};

/** Zapisana półka albo null, jeśli użytkownik jej jeszcze nie ustawił. */
export function useSavedShelf(): Shelf | null {
  return useLocalStore(store);
}

/** Półka do sprawdzania napojów: zapisana albo domyślna. */
export function useShelf(): Shelf {
  return useSavedShelf() ?? DEFAULT_SHELF;
}
