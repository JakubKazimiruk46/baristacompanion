import { drinks } from './drinks';
import { grinderModels } from './grinders';
import { extraIngredients } from './ingredients';
import { methods } from './methods';
import { frothingMethods, frothingSummary, milks } from './milks';
import { syrups } from './syrups';
import type { BrewMethod, Drink, GrinderModel, Ingredient, Milk, Syrup } from './types';
import { vessels } from './vessels';

/** Katalog składników: mleka, syropy i dodatki napojów (półka, zakupy, zamienniki). */
const ingredients: Ingredient[] = [
  ...milks.map((milk): Ingredient => ({ id: milk.id, name: milk.name, group: 'milk' })),
  ...syrups.map(
    (syrup): Ingredient => ({
      id: syrup.id,
      name: syrup.name,
      group: 'syrup',
      ...(syrup.substitutes && { substitutes: syrup.substitutes }),
    }),
  ),
  ...extraIngredients,
];

export { drinks, frothingMethods, frothingSummary, grinderModels, ingredients, methods, milks, syrups, vessels };
export * from './coldBrew';
export * from './labels';
export * from './types';

const byId = <T extends { id: string }>(items: T[]) => new Map(items.map((item) => [item.id, item]));

const methodsById = byId(methods);
const drinksById = byId(drinks);
const milksById = byId(milks);
const syrupsById = byId(syrups);
const ingredientsById = byId(ingredients);
const grinderModelsById = byId(grinderModels);

export const getMethod = (id: string): BrewMethod | undefined => methodsById.get(id);
export const getDrink = (id: string): Drink | undefined => drinksById.get(id);
export const getMilk = (id: string): Milk | undefined => milksById.get(id);
export const getSyrup = (id: string): Syrup | undefined => syrupsById.get(id);
export const getIngredient = (id: string): Ingredient | undefined => ingredientsById.get(id);
export const getGrinderModel = (id: string): GrinderModel | undefined => grinderModelsById.get(id);

/** Metody, którymi da się zrobić bazę napoju: główna i alternatywne. */
export function baseMethodIds(drink: Drink): string[] {
  return [drink.base.methodId, ...(drink.base.alternativeMethodIds ?? [])];
}

/** Napoje, których bazę da się zaparzyć tą metodą. Najpierw te, dla których metoda jest główna. */
export function drinksForMethod(methodId: string): Drink[] {
  const main = drinks.filter((d) => d.base.methodId === methodId);
  const alternative = drinks.filter((d) => d.base.alternativeMethodIds?.includes(methodId));
  return [...main, ...alternative];
}

/** Czy napój jest „z mlekiem”: ma mleko albo nabiał w dodatkach (śmietankę, lody). */
export function hasMilk(drink: Drink): boolean {
  return (
    drink.milk !== undefined ||
    drink.extras.some((extra) => extra.kind === 'cream' || extra.kind === 'ice-cream')
  );
}

/**
 * Czy napój da się zrobić w wersji roślinnej: mleko (jeśli jest) ma roślinny wariant,
 * a w dodatkach nie ma nabiału bez zamiennika (np. bitej śmietany).
 */
export function isPlantBasedPossible(drink: Drink): boolean {
  const milkOk = !drink.milk || drink.milk.options.some((id) => getMilk(id)?.plantBased);
  const extrasOk = drink.extras.every((extra) => extra.kind === 'syrup' || !extra.dairy);
  return milkOk && extrasOk;
}

/** Syropy użyte w napoju (bez powtórzeń). */
export function drinkSyrups(drink: Drink): Syrup[] {
  return drink.extras.flatMap((extra) => {
    if (extra.kind !== 'syrup') return [];
    const syrup = getSyrup(extra.syrupId);
    return syrup ? [syrup] : [];
  });
}

/** Napój z alkoholem: ma dodatek z alkoholem (oznaczenie i filtr „Bez alkoholu”). */
export function hasAlcohol(drink: Drink): boolean {
  return drink.extras.some((extra) => extra.kind === 'alcohol');
}

/** Metody, które parzą kawę z ziaren (bez kawy rozpuszczalnej). */
export const beanMethods = methods.filter((method) => !method.instant);

export function hasIce(drink: Drink): boolean {
  return drink.extras.some((extra) => extra.kind === 'ice');
}
