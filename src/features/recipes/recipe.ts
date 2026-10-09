import { getMethod, GRIND_SIZES, type BrewMethod, type BrewStep, type GrindSize, type Range } from '../../data';
import { invalidTokens } from '../brewing/dose';
import { isGrindRecord, type GrindRecord } from '../grinder/store';

/**
 * Własna wersja przepisu metody. Kroki jak w metodzie: ilości jako znaczniki {coffee}, {water},
 * {water*0.6}, które kalkulator zamienia na liczby.
 */
export interface UserRecipe {
  id: string;
  methodId: string;
  name: string;
  /** Podstawowa porcja: proporcja i ilość na start kalkulatora. */
  dose: { coffeeG: number; waterMl: number };
  waterTempC: Range;
  grind: GrindSize;
  /** Ustawienie młynka do tego przepisu (młynek z „Mojego młynka” w chwili zapisu). */
  grinder?: GrindRecord;
  steps: BrewStep[];
  note?: string;
  createdAt: number;
  updatedAt: number;
}

export type RecipeInput = Omit<UserRecipe, 'id' | 'createdAt' | 'updatedAt'>;

export const RECIPE_LIMITS = {
  name: 60,
  note: 500,
  steps: 20,
  stepText: 120,
  stepDetail: 400,
  /** Najdłuższy stoper w kroku: doba (cold brew). */
  stepSec: 24 * 3600,
  coffeeG: { min: 1, max: 250 },
  tempC: { min: 0, max: 100 },
  /** Ile ml wody na gram kawy: od koncentratu po bardzo lekki napar. */
  ratio: { min: 3, max: 25 },
  /** Kawa rozpuszczalna to ekstrakt: łyżeczka na cały kubek. */
  instantRatio: { min: 3, max: 150 },
} as const;

const isNumber = (value: unknown): value is number => typeof value === 'number' && Number.isFinite(value);
const within = (value: number, range: Range) => value >= range.min && value <= range.max;

/** Polecenie albo szczegóły kroku: błąd po polsku albo null. */
export function stepTextError(text: string, limit: number, required: boolean): string | null {
  if (!text.trim()) return required ? 'Wpisz polecenie.' : null;
  if (text.length > limit) return `Najwyżej ${limit} znaków.`;
  const invalid = invalidTokens(text)[0];
  return invalid ? `Nieznany znacznik ${invalid}. Ilości wstawiaj przyciskami.` : null;
}

export function waterError(method: BrewMethod, waterMl: number): string | null {
  const { min, max } = method.scaling.waterMl;
  return within(waterMl, method.scaling.waterMl) ? null : `Ten sprzęt mieści od ${min} do ${max} ml.`;
}

export function ratioError(method: BrewMethod, coffeeG: number, waterMl: number): string | null {
  const range = method.instant ? RECIPE_LIMITS.instantRatio : RECIPE_LIMITS.ratio;
  return within(waterMl / coffeeG, range)
    ? null
    : `Proporcja kawy do wody musi być od 1:${range.min} do 1:${range.max}.`;
}

function isStep(value: unknown): value is BrewStep {
  if (typeof value !== 'object' || value === null) return false;
  const s = value as Record<string, unknown>;
  return (
    typeof s.text === 'string' &&
    stepTextError(s.text, RECIPE_LIMITS.stepText, true) === null &&
    (s.detail === undefined ||
      (typeof s.detail === 'string' && s.detail.trim() !== '' && stepTextError(s.detail, RECIPE_LIMITS.stepDetail, false) === null)) &&
    (s.durationSec === undefined ||
      (Number.isInteger(s.durationSec) && within(s.durationSec as number, { min: 1, max: RECIPE_LIMITS.stepSec }))) &&
    typeof s.action === 'boolean'
  );
}

/** Tylko pola kroku, bez nadmiarowych danych (np. z linku). */
const cleanStep = (step: BrewStep): BrewStep => ({
  text: step.text,
  ...(step.detail !== undefined && { detail: step.detail }),
  ...(step.durationSec !== undefined && { durationSec: step.durationSec }),
  action: step.action,
});

/**
 * Sprawdza przepis z zapisu albo z linku: metoda musi istnieć, ilości mieścić się w sprzęcie,
 * a kroki mieć tylko znane znaczniki. null: przepis jest błędny.
 */
export function parseRecipeInput(value: unknown): RecipeInput | null {
  if (typeof value !== 'object' || value === null) return null;
  const r = value as Record<string, unknown>;
  const method = typeof r.methodId === 'string' ? getMethod(r.methodId) : undefined;
  if (!method) return null;
  const dose = r.dose as Record<string, unknown> | undefined;
  const temp = r.waterTempC as Record<string, unknown> | undefined;
  if (
    typeof r.name !== 'string' ||
    !r.name.trim() ||
    r.name.length > RECIPE_LIMITS.name ||
    typeof dose !== 'object' ||
    dose === null ||
    !isNumber(dose.coffeeG) ||
    !isNumber(dose.waterMl) ||
    !within(dose.coffeeG, RECIPE_LIMITS.coffeeG) ||
    waterError(method, dose.waterMl) !== null ||
    ratioError(method, dose.coffeeG, dose.waterMl) !== null ||
    typeof temp !== 'object' ||
    temp === null ||
    !isNumber(temp.min) ||
    !isNumber(temp.max) ||
    !within(temp.min, RECIPE_LIMITS.tempC) ||
    !within(temp.max, RECIPE_LIMITS.tempC) ||
    temp.min > temp.max ||
    !(GRIND_SIZES as readonly unknown[]).includes(r.grind) ||
    (r.grinder !== undefined && !isGrindRecord(r.grinder)) ||
    !Array.isArray(r.steps) ||
    r.steps.length === 0 ||
    r.steps.length > RECIPE_LIMITS.steps ||
    !r.steps.every(isStep) ||
    (r.note !== undefined && (typeof r.note !== 'string' || !r.note.trim() || r.note.length > RECIPE_LIMITS.note))
  ) {
    return null;
  }
  return {
    methodId: method.id,
    name: r.name,
    dose: { coffeeG: dose.coffeeG, waterMl: dose.waterMl },
    waterTempC: { min: temp.min, max: temp.max },
    grind: r.grind as GrindSize,
    ...(r.grinder !== undefined && { grinder: r.grinder as GrindRecord }),
    steps: (r.steps as BrewStep[]).map(cleanStep),
    ...(typeof r.note === 'string' && { note: r.note }),
  };
}

/** Przepis z zapisu w przeglądarce. null: uszkodzony. */
export function parseRecipe(value: unknown): UserRecipe | null {
  const input = parseRecipeInput(value);
  if (!input) return null;
  const r = value as Record<string, unknown>;
  if (typeof r.id !== 'string' || !isNumber(r.createdAt) || !isNumber(r.updatedAt)) return null;
  return { ...input, id: r.id, createdAt: r.createdAt, updatedAt: r.updatedAt };
}

/** Ekran przepisu. */
export const recipePath = (recipe: Pick<UserRecipe, 'id' | 'methodId'>) =>
  `/parzenie/${recipe.methodId}/przepisy/${recipe.id}`;

/** Łączny czas kroków ze stoperem. */
export const timedSeconds = (steps: BrewStep[]) => steps.reduce((sum, step) => sum + (step.durationSec ?? 0), 0);

/**
 * Przepis jako metoda: kalkulator, prowadzone parzenie i skala mielenia działają z nim tak samo.
 * Sprzęt, granice kalkulatora i id zostają z metody.
 */
export function recipeToMethod(recipe: RecipeInput, method: BrewMethod): BrewMethod {
  const { needsReview: _, reviewNote: __, ...base } = method;
  return {
    ...base,
    name: recipe.name,
    grind: recipe.grind,
    dose: recipe.dose,
    waterTempC: recipe.waterTempC,
    totalTimeSec: timedSeconds(recipe.steps),
    steps: recipe.steps,
  };
}
