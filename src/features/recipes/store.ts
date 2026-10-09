import { createLocalStore, useLocalStore } from '../../lib/localStore';
import { dosesStore, recipeDoseKey } from '../brewing/doseStore';
import { parseRecipe, type RecipeInput, type UserRecipe } from './recipe';

export const RECIPES_KEY = 'barista-companion.recipes.v1';

/** Więcej przepisów nikt nie potrzebuje, a zapis nie może rosnąć bez końca. */
export const MAX_RECIPES = 200;

// Uszkodzone przepisy pomijamy, zamiast tracić wszystkie.
export const parseRecipes = (value: unknown): UserRecipe[] =>
  Array.isArray(value) ? value.map(parseRecipe).filter((r): r is UserRecipe => r !== null) : [];

const store = createLocalStore<UserRecipe[]>(RECIPES_KEY, parseRecipes, []);

// crypto.randomUUID działa tylko przez HTTPS (patrz beans/store.ts).
const newId = () =>
  globalThis.crypto?.randomUUID?.() ?? `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;

export const recipesStore = {
  subscribe: store.subscribe,
  getSnapshot: store.getSnapshot,
  isPersistent: store.isPersistent,
  reset: store.reset,
  /** Nowy przepis trafia na początek listy. */
  add(input: RecipeInput, now = Date.now()): UserRecipe {
    const recipe: UserRecipe = { ...input, id: newId(), createdAt: now, updatedAt: now };
    store.set([recipe, ...store.getSnapshot()].slice(0, MAX_RECIPES));
    return recipe;
  },
  update(id: string, input: RecipeInput, now = Date.now()) {
    store.set(
      store
        .getSnapshot()
        .map((recipe) =>
          recipe.id === id ? { ...input, id, createdAt: recipe.createdAt, updatedAt: now } : recipe,
        ),
    );
  },
  remove(id: string) {
    store.set(store.getSnapshot().filter((recipe) => recipe.id !== id));
    dosesStore.clear(recipeDoseKey(id));
  },
  get(id: string): UserRecipe | undefined {
    return store.getSnapshot().find((recipe) => recipe.id === id);
  },
  /** Całość naraz (synchronizacja, kopia zapasowa). */
  replaceAll: store.set,
};

export function useRecipes(): UserRecipe[] {
  return useLocalStore(store);
}

export function useRecipe(id: string | null | undefined): UserRecipe | undefined {
  return useRecipes().find((recipe) => recipe.id === id);
}

/** Własne przepisy jednej metody, najnowsze pierwsze. */
export function useMethodRecipes(methodId: string): UserRecipe[] {
  return useRecipes().filter((recipe) => recipe.methodId === methodId);
}
