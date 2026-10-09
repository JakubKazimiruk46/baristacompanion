import { useMemo } from 'react';
import { normalizeDrink } from '../../../supabase/functions/_shared/drinkRules.ts';
import { drinks, getDrink, type Drink } from '../../data';
import { isValidDrink } from '../../data/validate';
import { createLocalStore, useLocalStore } from '../../lib/localStore';

/**
 * „Moje napoje”: propozycje asystenta drinków zapisane u siebie. Mają id z przedrostkiem moj-,
 * więc nigdy nie zderzą się z napojami z katalogu, a lista zakupów rozpozna je po id.
 */
export interface MyDrink {
  drink: Drink;
  savedAt: number;
}

export const MY_DRINKS_KEY = 'barista-companion.my-drinks.v1';
export const MY_DRINK_PREFIX = 'moj-';
export const MAX_MY_DRINKS = 100;

export const isMyDrinkId = (id: string) => id.startsWith(MY_DRINK_PREFIX);

/** Zapisany napój sprawdzony jak napój z katalogu (uszkodzone pomijamy). */
export function parseMyDrink(value: unknown): MyDrink | null {
  if (typeof value !== 'object' || value === null) return null;
  const v = value as Record<string, unknown>;
  const drink = normalizeDrink(v.drink);
  if (typeof v.savedAt !== 'number' || !Number.isFinite(v.savedAt) || !isValidDrink(drink) || !isMyDrinkId(drink.id)) {
    return null;
  }
  return { drink, savedAt: v.savedAt };
}

export const parseMyDrinks = (value: unknown): MyDrink[] =>
  Array.isArray(value) ? value.map(parseMyDrink).filter((d): d is MyDrink => d !== null) : [];

const store = createLocalStore<MyDrink[]>(MY_DRINKS_KEY, parseMyDrinks, []);

/** „Kawa Pomarańczowa z Miodem” → „kawa-pomaranczowa-z-miodem”. */
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/ł/g, 'l')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40)
    .replace(/-+$/g, '');
}

const suffix = () => Math.random().toString(36).slice(2, 6);

export const myDrinksStore = {
  subscribe: store.subscribe,
  getSnapshot: store.getSnapshot,
  isPersistent: store.isPersistent,
  reset: store.reset,
  /** Zapisuje propozycję pod nowym id (moj-nazwa-xxxx). */
  add(drink: Drink, now = Date.now()): Drink {
    const id = `${MY_DRINK_PREFIX}${slugify(drink.name) || 'napoj'}-${suffix()}`;
    const saved = { ...drink, id };
    store.set([{ drink: saved, savedAt: now }, ...store.getSnapshot()].slice(0, MAX_MY_DRINKS));
    return saved;
  },
  remove(id: string) {
    store.set(store.getSnapshot().filter((item) => item.drink.id !== id));
  },
  get(id: string): Drink | undefined {
    return store.getSnapshot().find((item) => item.drink.id === id)?.drink;
  },
  /** Całość naraz (synchronizacja, kopia zapasowa). */
  replaceAll: store.set,
};

export function useMyDrinks(): MyDrink[] {
  return useLocalStore(store);
}

/** „Moje napoje” na początku, potem katalog (lista napojów, półka). */
export function useAllDrinks(): Drink[] {
  const mine = useMyDrinks();
  return useMemo(() => [...mine.map((item) => item.drink), ...drinks], [mine]);
}

/** Napój z katalogu albo z „Moich napojów”. */
export function useDrink(id: string | undefined): Drink | undefined {
  const mine = useMyDrinks();
  if (!id) return undefined;
  return getDrink(id) ?? mine.find((item) => item.drink.id === id)?.drink;
}

/** Nazwa napoju z katalogu albo z „Moich napojów” (np. na liście zakupów). */
export function drinkName(id: string): string | undefined {
  return getDrink(id)?.name ?? myDrinksStore.get(id)?.name;
}
