import { getDrink, getIngredient } from '../../data';
import { isMyDrinkId } from '../assistant/myDrinks';
import { createLocalStore, useLocalStore } from '../../lib/localStore';
import { shelfStore } from './store';

/** Pozycja na liście zakupów: składnik i napoje, do których jest potrzebny. */
export interface ShoppingItem {
  id: string;
  drinkIds: string[];
  bought: boolean;
}

export const SHOPPING_KEY = 'barista-companion.shopping.v1';

function isItem(value: unknown): value is ShoppingItem {
  if (typeof value !== 'object' || value === null) return false;
  const item = value as Partial<ShoppingItem>;
  return (
    typeof item.id === 'string' &&
    getIngredient(item.id) !== undefined &&
    Array.isArray(item.drinkIds) &&
    item.drinkIds.every((id) => typeof id === 'string') &&
    typeof item.bought === 'boolean'
  );
}

export function parseShopping(value: unknown): ShoppingItem[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter(isItem)
    .map((item) => ({
      ...item,
      // Napoje z katalogu i „Moje napoje” (te mogą być jeszcze nieprzesłane z innego urządzenia).
      drinkIds: item.drinkIds.filter((id) => getDrink(id) !== undefined || isMyDrinkId(id)),
    }));
}

const store = createLocalStore<ShoppingItem[]>(SHOPPING_KEY, parseShopping, []);

export const shoppingStore = {
  subscribe: store.subscribe,
  getSnapshot: store.getSnapshot,
  reset: store.reset,
  /** Dokłada brakujące składniki napoju. Składnik już na liście dostaje tylko nazwę napoju. */
  addForDrink(drinkId: string, ingredientIds: string[]) {
    const items = [...store.getSnapshot()];
    for (const id of ingredientIds) {
      const index = items.findIndex((item) => item.id === id);
      const existing = items[index];
      if (!existing) items.push({ id, drinkIds: [drinkId], bought: false });
      else if (!existing.drinkIds.includes(drinkId)) {
        items[index] = { ...existing, drinkIds: [...existing.drinkIds, drinkId] };
      }
    }
    store.set(items);
  },
  /** Kupione trafia do „Co mam w domu”; odznaczenie zdejmuje je z półki. */
  toggleBought(id: string) {
    const item = store.getSnapshot().find((i) => i.id === id);
    if (!item) return;
    const bought = !item.bought;
    store.set(store.getSnapshot().map((i) => (i.id === id ? { ...i, bought } : i)));
    if (bought) shelfStore.addIngredient(id);
    else shelfStore.removeIngredient(id);
  },
  remove(id: string) {
    store.set(store.getSnapshot().filter((item) => item.id !== id));
  },
  clearBought() {
    store.set(store.getSnapshot().filter((item) => !item.bought));
  },
  /** Całość naraz (synchronizacja, kopia zapasowa). */
  replaceAll: store.set,
};

export function useShopping(): ShoppingItem[] {
  return useLocalStore(store);
}
