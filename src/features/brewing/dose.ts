import type { BrewMethod, BrewStep } from '../../data';

/** Ile kawy i wody na jedno parzenie. */
export interface Dose {
  coffeeG: number;
  waterMl: number;
}

const decimal = new Intl.NumberFormat('pl-PL', { maximumFractionDigits: 1 });

/** Gramy w zapisie polskim: „17”, „5,5”. */
export const formatGrams = (grams: number) => decimal.format(grams);

/** Kawa w gramach: poniżej 10 g co pół grama, wyżej w pełnych gramach. */
export function roundCoffee(grams: number): number {
  return grams < 10 ? Math.round(grams * 2) / 2 : Math.round(grams);
}

/** Woda w krokach (bloom, kolejne nalewanie) co 5 ml: tyle da się odczytać z wagi. */
export function roundWater(ml: number): number {
  return Math.round(ml / 5) * 5;
}

export function clampWater(method: BrewMethod, waterMl: number): number {
  const { min, max } = method.scaling.waterMl;
  return Math.min(max, Math.max(min, waterMl));
}

/** Ilość kawy dla podanej ilości wody, z proporcji metody. Przy ilości z przepisu: dokładnie przepis. */
export function doseFor(method: BrewMethod, waterMl: number): Dose {
  if (waterMl === method.dose.waterMl) return { coffeeG: method.dose.coffeeG, waterMl };
  const ratio = method.dose.coffeeG / method.dose.waterMl;
  return { coffeeG: roundCoffee(waterMl * ratio), waterMl };
}

const TOKEN = /\{(coffee|water)(?:\*(\d+(?:\.\d+)?))?\}/g;

/** Podstawia ilości w tekście kroku: {coffee}, {water}, {water*0.6}. */
export function fillAmounts(text: string, dose: Dose): string {
  return text.replace(TOKEN, (_, what: string, factor?: string) => {
    if (what === 'coffee') return formatGrams(dose.coffeeG);
    return String(factor ? roundWater(dose.waterMl * Number(factor)) : dose.waterMl);
  });
}

/** Znaczniki w nawiasach klamrowych, których kalkulator nie zna (np. {kawa}). */
export function invalidTokens(text: string): string[] {
  return (text.match(/\{[^{}]*\}/g) ?? []).filter((token) => !new RegExp(`^${TOKEN.source}$`).test(token));
}

/** Metoda przeliczona na podaną ilość wody: dawka i kroki z liczbami zamiast znaczników. */
export function scaleMethod(method: BrewMethod, waterMl = method.dose.waterMl): BrewMethod {
  const dose = doseFor(method, clampWater(method, waterMl));
  const fill = (step: BrewStep): BrewStep => ({
    ...step,
    text: fillAmounts(step.text, dose),
    ...(step.detail !== undefined && { detail: fillAmounts(step.detail, dose) }),
  });
  return { ...method, dose, steps: method.steps.map(fill) };
}

/** Na ile osób wystarczy ta ilość wody (co najmniej 1). */
export function peopleFor(method: BrewMethod, waterMl: number): number {
  return Math.max(1, Math.round(waterMl / method.scaling.servingMl));
}

/** Ilu osobom da się zaparzyć naraz. */
export function maxPeople(method: BrewMethod): number {
  return Math.max(1, Math.floor(method.scaling.waterMl.max / method.scaling.servingMl));
}

/** Ilość wody dla podanej liczby osób, w granicach sprzętu. */
export function waterForPeople(method: BrewMethod, people: number): number {
  return clampWater(method, people * method.scaling.servingMl);
}
