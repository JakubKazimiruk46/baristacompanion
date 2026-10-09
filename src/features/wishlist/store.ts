import { getDrink } from '../../data';
import { createLocalStore, useLocalStore } from '../../lib/localStore';
import { isMyDrinkId } from '../assistant/myDrinks';

/** „Chcę spróbować”: napoje z katalogu i z „Moich napojów”, ostatnio dodane pierwsze. */
export const WISHLIST_KEY = 'barista-companion.to-try.v1';

// Napój z katalogu musi wciąż istnieć. „Mój napój” mógł zostać usunięty: ekrany pomijają brakujące.
const known = (id: string) => getDrink(id) !== undefined || isMyDrinkId(id);

export const parseWishlist = (value: unknown): string[] =>
  Array.isArray(value)
    ? [...new Set(value.filter((id): id is string => typeof id === 'string' && known(id)))]
    : [];

const store = createLocalStore<string[]>(WISHLIST_KEY, parseWishlist, []);

export const wishlistStore = {
  subscribe: store.subscribe,
  getSnapshot: store.getSnapshot,
  reset: store.reset,
  toggle(drinkId: string) {
    const current = store.getSnapshot();
    store.set(current.includes(drinkId) ? current.filter((id) => id !== drinkId) : [drinkId, ...current]);
  },
  remove(drinkId: string) {
    const current = store.getSnapshot();
    if (current.includes(drinkId)) store.set(current.filter((id) => id !== drinkId));
  },
  /** Całość naraz (synchronizacja, kopia zapasowa). */
  replaceAll: store.set,
};

export function useWishlist(): string[] {
  return useLocalStore(store);
}
