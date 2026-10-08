import { COLD_BREW_HOURS, getColdBrewVariant } from '../../data/coldBrew';
import { createLocalStore, useLocalStore } from '../../lib/localStore';

/** Rozpoczęte cold brew. Zapisane w localStorage, więc przetrwa zamknięcie aplikacji. */
export interface ColdBrewRun {
  startedAt: number;
  hours: number;
  variantId: string;
}

export const COLD_BREW_KEY = 'barista-companion.cold-brew.v1';

function parseRun(value: unknown): ColdBrewRun | null {
  if (typeof value !== 'object' || value === null) return null;
  const run = value as Partial<ColdBrewRun>;
  const valid =
    typeof run.startedAt === 'number' &&
    Number.isFinite(run.startedAt) &&
    (COLD_BREW_HOURS as readonly number[]).includes(run.hours as number) &&
    typeof run.variantId === 'string' &&
    getColdBrewVariant(run.variantId) !== undefined;
  return valid ? (run as ColdBrewRun) : null;
}

export const coldBrewStore = createLocalStore<ColdBrewRun | null>(COLD_BREW_KEY, parseRun, null);

export function useColdBrew(): ColdBrewRun | null {
  return useLocalStore(coldBrewStore);
}
