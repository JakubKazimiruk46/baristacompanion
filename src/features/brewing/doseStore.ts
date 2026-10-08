import { getMethod, type BrewMethod } from '../../data';
import { createLocalStore, useLocalStore } from '../../lib/localStore';

/** Ostatnio wybrana ilość wody dla każdej metody (kalkulator ilości). */
export const DOSES_KEY = 'barista-companion.doses.v1';

// Tylko znane metody i ilości, które mieści ich sprzęt.
function parseDoses(value: unknown): Record<string, number> {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) return {};
  return Object.fromEntries(
    Object.entries(value).filter(([methodId, waterMl]) => {
      const range = getMethod(methodId)?.scaling.waterMl;
      return range !== undefined && typeof waterMl === 'number' && waterMl >= range.min && waterMl <= range.max;
    }),
  );
}

const store = createLocalStore<Record<string, number>>(DOSES_KEY, parseDoses, {});

export const dosesStore = {
  subscribe: store.subscribe,
  getSnapshot: store.getSnapshot,
  reset: store.reset,
  set(methodId: string, waterMl: number) {
    store.set({ ...store.getSnapshot(), [methodId]: waterMl });
  },
  /** Powrót do ilości z przepisu. */
  clear(methodId: string) {
    const { [methodId]: _, ...rest } = store.getSnapshot();
    store.set(rest);
  },
};

/** Ilość wody do parzenia tą metodą: ostatnio wybrana albo z przepisu. */
export function useWaterMl(method: BrewMethod): number {
  return useLocalStore(store)[method.id] ?? method.dose.waterMl;
}
