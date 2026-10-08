import { getDrink } from '../../data';
import { createLocalStore, useLocalStore } from '../../lib/localStore';

/** Ulubione napoje: lista id, ostatnio dodane pierwsze. */
export const FAVORITES_KEY = 'barista-companion.favorites.v1';

// Bez powtórzeń i tylko napoje, które wciąż są w danych.
const parseFavorites = (value: unknown): string[] =>
  Array.isArray(value)
    ? [...new Set(value.filter((id): id is string => typeof id === 'string' && getDrink(id) !== undefined))]
    : [];

const store = createLocalStore<string[]>(FAVORITES_KEY, parseFavorites, []);

export const favoritesStore = {
  subscribe: store.subscribe,
  getSnapshot: store.getSnapshot,
  reset: store.reset,
  toggle(drinkId: string) {
    const current = store.getSnapshot();
    store.set(current.includes(drinkId) ? current.filter((id) => id !== drinkId) : [drinkId, ...current]);
  },
};

export function useFavorites(): string[] {
  return useLocalStore(store);
}
