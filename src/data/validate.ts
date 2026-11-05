import { validateDrinkWith, type DrinkCatalog } from '../../supabase/functions/_shared/drinkRules.ts';
import { ingredients, methods, milks, vessels } from '.';
import type { Drink } from './types';

/** Adresy innych ekranów pod /napoje/: napój nie może mieć takiego id. */
export const DRINK_PAGES = ['mleko', 'spienianie', 'syropy', 'co-mam', 'zakupy', 'asystent', 'nowy'];

/** Katalog aplikacji dla reguł napoju (i dla asystenta drinków: tylko te id są dozwolone, P9). */
export const appCatalog: DrinkCatalog = {
  methods,
  milks,
  ingredients,
  vessels: Object.values(vessels),
  reservedIds: DRINK_PAGES,
};

/**
 * Reguły spójności napoju (odwołania, objętości, kolory, długości) dla danych aplikacji. Lista
 * błędów po polsku; pusta znaczy, że napój jest poprawny. Używają jej test danych, „Moje napoje”
 * i propozycje asystenta.
 */
export function validateDrink(drink: unknown): string[] {
  return validateDrinkWith(drink, appCatalog);
}

export const isValidDrink = (drink: unknown): drink is Drink => validateDrink(drink).length === 0;
