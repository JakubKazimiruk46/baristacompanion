import { getMethod } from '../../data';
import { createLocalStore, useLocalStore } from '../../lib/localStore';

/** Ulubione metody parzenia: lista id, ostatnio dodane pierwsze. */
export const METHOD_FAVORITES_KEY = 'barista-companion.method-favorites.v1';

export const parseMethodFavorites = (value: unknown): string[] =>
  Array.isArray(value)
    ? [...new Set(value.filter((id): id is string => typeof id === 'string' && getMethod(id) !== undefined))]
    : [];

const store = createLocalStore<string[]>(METHOD_FAVORITES_KEY, parseMethodFavorites, []);

export const methodFavoritesStore = {
  subscribe: store.subscribe,
  getSnapshot: store.getSnapshot,
  reset: store.reset,
  toggle(methodId: string) {
    const current = store.getSnapshot();
    store.set(current.includes(methodId) ? current.filter((id) => id !== methodId) : [methodId, ...current]);
  },
  /** Całość naraz (synchronizacja, kopia zapasowa). */
  replaceAll: store.set,
};

export function useMethodFavorites(): string[] {
  return useLocalStore(store);
}
