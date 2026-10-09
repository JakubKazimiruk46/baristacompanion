import { useMemo } from 'react';
import { normalizeDrink } from '../../../supabase/functions/_shared/drinkRules.ts';
import { drinks, getDrink, type Drink } from '../../data';
import { isValidDrink } from '../../data/validate';
import { createLocalStore, useLocalStore } from '../../lib/localStore';

/**
 * „Moje napoje”: propozycje asystenta, napoje z kreatora i kopie ze społeczności zapisane
 * u siebie. Mają id z przedrostkiem moj-, więc nigdy nie zderzą się z napojami z katalogu,
 * a lista zakupów rozpozna je po id.
 */
export type MyDrinkSource = 'ai' | 'own' | 'community';

export interface MyDrink {
  drink: Drink;
  savedAt: number;
  /** Skąd jest: asystent AI, kreator albo kopia ze społeczności. Zapisy sprzed kreatora: AI. */
  source: MyDrinkSource;
  /** Kopia ze społeczności: od kogo (takiej kopii nie da się opublikować jako własnej). */
  origin?: { communityId: string; author: string };
}

const SOURCES: MyDrinkSource[] = ['ai', 'own', 'community'];

function parseOrigin(value: unknown): MyDrink['origin'] | undefined {
  if (typeof value !== 'object' || value === null) return undefined;
  const v = value as Record<string, unknown>;
  return typeof v.communityId === 'string' && v.communityId.length <= 100 && typeof v.author === 'string' && v.author.length <= 40
    ? { communityId: v.communityId, author: v.author }
    : undefined;
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
  const source = SOURCES.includes(v.source as MyDrinkSource) ? (v.source as MyDrinkSource) : 'ai';
  const origin = parseOrigin(v.origin);
  return { drink, savedAt: v.savedAt, source, ...(origin && { origin }) };
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
  /** Zapisuje napój pod nowym id (moj-nazwa-xxxx). Domyślnie jako propozycję AI. */
  add(drink: Drink, now = Date.now(), meta: Pick<MyDrink, 'source' | 'origin'> = { source: 'ai' }): Drink {
    const id = `${MY_DRINK_PREFIX}${slugify(drink.name) || 'napoj'}-${suffix()}`;
    const saved = { ...drink, id };
    const item: MyDrink = { drink: saved, savedAt: now, source: meta.source, ...(meta.origin && { origin: meta.origin }) };
    store.set([item, ...store.getSnapshot()].slice(0, MAX_MY_DRINKS));
    return saved;
  },
  /** Zmiana w kreatorze. Poprawiona propozycja AI staje się własnym napojem. */
  update(id: string, drink: Drink) {
    store.set(
      store.getSnapshot().map((item) =>
        item.drink.id === id ? { ...item, drink: { ...drink, id }, source: item.source === 'ai' ? 'own' : item.source } : item,
      ),
    );
  },
  record(id: string): MyDrink | undefined {
    return store.getSnapshot().find((item) => item.drink.id === id);
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

/** Zapis „Mojego napoju” (źródło, od kogo) albo undefined dla napoju z katalogu. */
export function useMyDrinkRecord(id: string | undefined): MyDrink | undefined {
  const mine = useMyDrinks();
  return id ? mine.find((item) => item.drink.id === id) : undefined;
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

/** Napój z katalogu albo z „Moich napojów” poza Reactem (np. w logice ścieżki „Mam kawę”). */
export function findDrink(id: string): Drink | undefined {
  return getDrink(id) ?? myDrinksStore.get(id);
}

/** Nazwa napoju z katalogu albo z „Moich napojów” (np. na liście zakupów). */
export function drinkName(id: string): string | undefined {
  return findDrink(id)?.name;
}
