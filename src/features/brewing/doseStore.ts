import { getMethod, type BrewMethod } from '../../data';
import { createLocalStore, useLocalStore } from '../../lib/localStore';

/** Ostatnio wybrana ilość wody dla każdej metody i własnego przepisu (kalkulator ilości). */
export const DOSES_KEY = 'barista-companion.doses.v1';

const RECIPE_PREFIX = 'przepis:';

/** Klucz ilości dla własnego przepisu: ma własną ilość, niezależną od metody. */
export const recipeDoseKey = (recipeId: string) => `${RECIPE_PREFIX}${recipeId}`;

// Granice sprzętu przepisu sprawdza clampWater przy odczycie, tu tylko rozsądny zakres.
const RECIPE_WATER = { min: 1, max: 5000 };

// Tylko znane metody i ilości, które mieści ich sprzęt.
function parseDoses(value: unknown): Record<string, number> {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) return {};
  return Object.fromEntries(
    Object.entries(value).filter(([key, waterMl]) => {
      const range = key.startsWith(RECIPE_PREFIX) ? RECIPE_WATER : getMethod(key)?.scaling.waterMl;
      return range !== undefined && typeof waterMl === 'number' && waterMl >= range.min && waterMl <= range.max;
    }),
  );
}

const store = createLocalStore<Record<string, number>>(DOSES_KEY, parseDoses, {});

export const dosesStore = {
  subscribe: store.subscribe,
  getSnapshot: store.getSnapshot,
  reset: store.reset,
  /** key: id metody albo recipeDoseKey(id przepisu). */
  set(key: string, waterMl: number) {
    store.set({ ...store.getSnapshot(), [key]: waterMl });
  },
  /** Powrót do ilości z przepisu. */
  clear(key: string) {
    const { [key]: _, ...rest } = store.getSnapshot();
    store.set(rest);
  },
};

/** Ilość wody do parzenia tą metodą (albo przepisem): ostatnio wybrana albo z przepisu. */
export function useWaterMl(method: BrewMethod, key = method.id): number {
  return useLocalStore(store)[key] ?? method.dose.waterMl;
}
