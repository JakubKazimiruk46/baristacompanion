import { COLD_BREW_HOURS, getColdBrewVariant } from '../../data/coldBrew';
import { createLocalStore, useLocalStore } from '../../lib/localStore';
import { isGrindRecord, type GrindRecord } from '../grinder/store';

/** Rozpoczęte cold brew. Zapisane w localStorage, więc przetrwa zamknięcie aplikacji. */
export interface ColdBrewRun {
  startedAt: number;
  hours: number;
  variantId: string;
  /** Ilości z kalkulatora w chwili zalania (do dziennika). Starsze zapisy ich nie mają. */
  coffeeG?: number;
  waterMl?: number;
  /** Ustawienie młynka w chwili zalania (do dziennika). */
  grind?: GrindRecord;
  /** Własny przepis, według którego zalano (do dziennika). */
  recipeId?: string;
  recipeName?: string;
}

export const COLD_BREW_KEY = 'barista-companion.cold-brew.v1';

const optionalNumber = (value: unknown) =>
  value === undefined || (typeof value === 'number' && Number.isFinite(value) && value > 0);

function parseRun(value: unknown): ColdBrewRun | null {
  if (typeof value !== 'object' || value === null) return null;
  const run = value as Partial<ColdBrewRun>;
  const valid =
    typeof run.startedAt === 'number' &&
    Number.isFinite(run.startedAt) &&
    (COLD_BREW_HOURS as readonly number[]).includes(run.hours as number) &&
    typeof run.variantId === 'string' &&
    getColdBrewVariant(run.variantId) !== undefined &&
    optionalNumber(run.coffeeG) &&
    optionalNumber(run.waterMl) &&
    (run.grind === undefined || isGrindRecord(run.grind)) &&
    (run.recipeId === undefined || typeof run.recipeId === 'string') &&
    (run.recipeName === undefined || typeof run.recipeName === 'string');
  return valid ? (run as ColdBrewRun) : null;
}

export const coldBrewStore = createLocalStore<ColdBrewRun | null>(COLD_BREW_KEY, parseRun, null);

export function useColdBrew(): ColdBrewRun | null {
  return useLocalStore(coldBrewStore);
}
