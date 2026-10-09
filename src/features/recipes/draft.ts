import type { BrewMethod, BrewStep, GrindSize } from '../../data';
import { settingInputValue } from '../grinder/format';
import type { GrindRecord, SavedGrinder } from '../grinder/store';
import { ratioError, RECIPE_LIMITS, stepTextError, waterError, type RecipeInput } from './recipe';

/** Krok w edytorze: pola jako tekst, key do list Reacta (kroki się przesuwa). */
export interface StepDraft {
  key: number;
  text: string;
  detail: string;
  minutes: string;
  seconds: string;
  action: boolean;
}

/** Stan edytora przepisu. Liczby jako tekst z pól, żeby dało się pokazać błąd wpisu. */
export interface RecipeDraft {
  name: string;
  coffeeG: string;
  waterMl: string;
  tempMin: string;
  tempMax: string;
  grind: GrindSize;
  /** Ustawienie używanego młynka (pusty: bez ustawienia). */
  grinderSetting: string;
  steps: StepDraft[];
  note: string;
}

export interface StepErrors {
  text?: string;
  detail?: string;
  time?: string;
}

export interface DraftErrors {
  name?: string;
  coffeeG?: string;
  waterMl?: string;
  temp?: string;
  grinderSetting?: string;
  steps?: string;
  note?: string;
  /** Błędy kroków według key. */
  step: Record<number, StepErrors>;
}

const number = new Intl.NumberFormat('pl-PL', { maximumFractionDigits: 1, useGrouping: false });
const toText = (value: number) => number.format(value);

/** „15”, „15,5”, „15.5” → liczba. null: to nie jest liczba. */
export function parseNumber(text: string): number | null {
  const normalized = text.trim().replace(',', '.');
  return /^\d+(\.\d+)?$/.test(normalized) ? Number(normalized) : null;
}

let nextKey = 1;
export const newStepKey = () => nextKey++;

export function stepDraft(step?: BrewStep): StepDraft {
  const sec = step?.durationSec ?? 0;
  return {
    key: newStepKey(),
    text: step?.text ?? '',
    detail: step?.detail ?? '',
    minutes: sec ? String(Math.floor(sec / 60)) : '',
    seconds: sec ? String(sec % 60) : '',
    action: step?.action ?? true,
  };
}

/** Edytor dla przepisu (edycja) albo kopii przepisu metody (nowy). */
export function recipeDraft(recipe: RecipeInput, grinderSetting?: number): RecipeDraft {
  return {
    name: recipe.name,
    coffeeG: toText(recipe.dose.coffeeG),
    waterMl: toText(recipe.dose.waterMl),
    tempMin: toText(recipe.waterTempC.min),
    tempMax: toText(recipe.waterTempC.max),
    grind: recipe.grind,
    grinderSetting: grinderSetting === undefined ? '' : settingInputValue(grinderSetting),
    steps: recipe.steps.map(stepDraft),
    note: recipe.note ?? '',
  };
}

/** Przepis metody jako punkt wyjścia: ze znacznikami ilości, nie z liczbami. */
export function methodAsRecipe(method: BrewMethod): RecipeInput {
  return {
    methodId: method.id,
    name: `${method.name}: moja wersja`,
    dose: method.dose,
    waterTempC: method.waterTempC,
    grind: method.grind,
    steps: method.steps,
  };
}

function stepTime(step: StepDraft): { sec?: number; error?: string } {
  const [minutesText, secondsText] = [step.minutes.trim(), step.seconds.trim()];
  if (!minutesText && !secondsText) return {};
  if (!/^\d*$/.test(minutesText) || !/^\d*$/.test(secondsText)) return { error: 'Wpisz pełne minuty i sekundy.' };
  const minutes = Number(minutesText);
  const seconds = Number(secondsText);
  if (seconds > 59) return { error: 'Sekund może być najwyżej 59.' };
  const sec = minutes * 60 + seconds;
  if (sec === 0) return { error: 'Wpisz czas albo zostaw oba pola puste.' };
  if (sec > RECIPE_LIMITS.stepSec) return { error: 'Najwyżej 24 godziny.' };
  return { sec };
}

/** Granice ustawienia młynka: skala modelu albo rozsądne granice własnego młynka. */
export type SettingLimits = { min: number; max: number };

/**
 * Sprawdza formularz. Bez błędów zwraca gotowy przepis, a ustawienie młynka zapisuje dla
 * używanego młynka.
 */
export function validateDraft(
  draft: RecipeDraft,
  method: BrewMethod,
  grinder: { grinder: SavedGrinder; limits: SettingLimits } | null,
): { errors: DraftErrors; input: RecipeInput | null } {
  const errors: DraftErrors = { step: {} };

  if (!draft.name.trim()) errors.name = 'Podaj nazwę przepisu.';

  const coffeeG = parseNumber(draft.coffeeG);
  const waterMl = parseNumber(draft.waterMl);
  if (coffeeG === null) errors.coffeeG = 'Wpisz ilość kawy w gramach, np. 15.';
  else if (coffeeG < RECIPE_LIMITS.coffeeG.min || coffeeG > RECIPE_LIMITS.coffeeG.max) {
    errors.coffeeG = `Wpisz od ${RECIPE_LIMITS.coffeeG.min} do ${RECIPE_LIMITS.coffeeG.max} g.`;
  }
  if (waterMl === null) errors.waterMl = 'Wpisz ilość wody w mililitrach, np. 250.';
  else errors.waterMl = waterError(method, waterMl) ?? undefined;
  if (coffeeG !== null && waterMl !== null && !errors.coffeeG && !errors.waterMl) {
    errors.coffeeG = ratioError(method, coffeeG, waterMl) ?? undefined;
  }

  const tempMin = parseNumber(draft.tempMin);
  const tempMax = parseNumber(draft.tempMax);
  const { min, max } = RECIPE_LIMITS.tempC;
  if (tempMin === null || tempMax === null || tempMin > max || tempMax > max) {
    errors.temp = `Wpisz temperaturę od ${min} do ${max}°C.`;
  } else if (tempMin > tempMax) {
    errors.temp = 'Temperatura „od” nie może być wyższa niż „do”.';
  }

  let grinderRecord: GrindRecord | undefined;
  if (grinder && draft.grinderSetting.trim()) {
    const setting = parseNumber(draft.grinderSetting);
    const { limits } = grinder;
    if (setting === null) errors.grinderSetting = 'Wpisz samą liczbę, np. 24 albo 2,5.';
    else if (setting < limits.min || setting > limits.max) {
      errors.grinderSetting = `Wpisz liczbę od ${settingInputValue(limits.min)} do ${settingInputValue(limits.max)}.`;
    } else {
      grinderRecord = {
        grinderId: grinder.grinder.id,
        grinderName: grinder.grinder.name,
        unit: grinder.grinder.unit,
        setting,
      };
    }
  }

  if (draft.steps.length === 0) errors.steps = 'Dodaj co najmniej jeden krok.';
  if (draft.steps.length > RECIPE_LIMITS.steps) errors.steps = `Najwyżej ${RECIPE_LIMITS.steps} kroków.`;

  const steps: BrewStep[] = [];
  for (const step of draft.steps) {
    const stepErrors: StepErrors = {};
    const text = stepTextError(step.text, RECIPE_LIMITS.stepText, true);
    const detail = stepTextError(step.detail, RECIPE_LIMITS.stepDetail, false);
    const time = stepTime(step);
    if (text) stepErrors.text = text;
    if (detail) stepErrors.detail = detail;
    if (time.error) stepErrors.time = time.error;
    if (Object.keys(stepErrors).length > 0) errors.step[step.key] = stepErrors;
    steps.push({
      text: step.text.trim(),
      ...(step.detail.trim() && { detail: step.detail.trim() }),
      ...(time.sec !== undefined && { durationSec: time.sec }),
      action: step.action,
    });
  }

  if (draft.note.length > RECIPE_LIMITS.note) errors.note = `Najwyżej ${RECIPE_LIMITS.note} znaków.`;

  if (hasErrors(errors) || coffeeG === null || waterMl === null || tempMin === null || tempMax === null) {
    return { errors, input: null };
  }
  return {
    errors,
    input: {
      methodId: method.id,
      name: draft.name.trim(),
      dose: { coffeeG, waterMl },
      waterTempC: { min: tempMin, max: tempMax },
      grind: draft.grind,
      ...(grinderRecord && { grinder: grinderRecord }),
      steps,
      ...(draft.note.trim() && { note: draft.note.trim() }),
    },
  };
}

export function hasErrors(errors: DraftErrors): boolean {
  const { step, ...fields } = errors;
  return Object.values(fields).some(Boolean) || Object.keys(step).length > 0;
}

/** Przesuwa krok o jedno miejsce. */
export function moveStep(steps: StepDraft[], index: number, direction: -1 | 1): StepDraft[] {
  const target = index + direction;
  if (target < 0 || target >= steps.length) return steps;
  const next = [...steps];
  [next[index], next[target]] = [next[target]!, next[index]!];
  return next;
}

/** Wstawia znacznik w miejscu kursora (albo na końcu). Zwraca tekst i nową pozycję kursora. */
export function insertToken(text: string, token: string, at = text.length): { text: string; caret: number } {
  const before = text.slice(0, at);
  const after = text.slice(at);
  // Odstęp przed znacznikiem, jeśli wstawiamy go zaraz za słowem.
  const pad = before && !/\s$/.test(before) ? ' ' : '';
  const value = `${before}${pad}${token}${after}`;
  return { text: value, caret: before.length + pad.length + token.length };
}
