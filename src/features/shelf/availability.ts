import { baseMethodIds, getIngredient, type Drink } from '../../data';
import type { Shelf } from './store';

/** Czego brakuje do napoju. Mleko i metoda: wystarczy dowolna z opcji. */
export type Missing =
  | { kind: 'ingredient'; id: string }
  | { kind: 'milk'; options: string[] }
  | { kind: 'method'; options: string[] };

/** Składnik zastąpiony innym, który jest w domu. */
export interface Substitution {
  ingredientId: string;
  substituteId: string;
  note: string;
}

export type AvailabilityStatus = 'ready' | 'substitute' | 'missing';

export interface Availability {
  status: AvailabilityStatus;
  missing: Missing[];
  substitutions: Substitution[];
}

/**
 * Czy napój da się zrobić z tego, co jest w domu. Liczą się niezbędne składniki (dodatki
 * opcjonalne nie), mleko (dowolne z polecanych) i sprzęt, jeśli jest zaznaczony. Kawę zakładamy.
 */
export function checkDrink(drink: Drink, shelf: Shelf): Availability {
  const has = (id: string) => shelf.ingredients.includes(id) || getIngredient(id)?.always === true;
  const missing: Missing[] = [];
  const substitutions: Substitution[] = [];

  if (shelf.methods.length > 0) {
    const options = baseMethodIds(drink);
    if (!options.some((id) => shelf.methods.includes(id))) missing.push({ kind: 'method', options });
  }

  if (drink.milk && !drink.milk.options.some(has)) {
    missing.push({ kind: 'milk', options: drink.milk.options });
  }

  for (const extra of drink.extras) {
    if (extra.optional) continue;
    const id = extra.kind === 'syrup' ? extra.syrupId : extra.ingredientId;
    // Ten sam składnik dwa razy (lód do dzbanka i do szklanki) liczymy raz.
    const seen =
      missing.some((m) => m.kind === 'ingredient' && m.id === id) ||
      substitutions.some((s) => s.ingredientId === id);
    if (has(id) || seen) continue;
    const substitute = getIngredient(id)?.substitutes?.find((s) => has(s.id));
    if (substitute) {
      substitutions.push({ ingredientId: id, substituteId: substitute.id, note: substitute.note });
    } else {
      missing.push({ kind: 'ingredient', id });
    }
  }

  const status: AvailabilityStatus =
    missing.length > 0 ? 'missing' : substitutions.length > 0 ? 'substitute' : 'ready';
  return { status, missing, substitutions };
}

export const canMake = (drink: Drink, shelf: Shelf) => checkDrink(drink, shelf).status !== 'missing';

/** Składniki do kupienia: brakujące dodatki i polecane mleko (sprzętu nie kupujemy w sklepie). */
export function shoppingIds(availability: Availability): string[] {
  return availability.missing.flatMap((m) =>
    m.kind === 'ingredient' ? [m.id] : m.kind === 'milk' ? [m.options[0]!] : [],
  );
}
