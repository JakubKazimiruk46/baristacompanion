import type { AssistantCatalog, DrinkWish, ShelfInfo } from '../../../supabase/functions/_shared/drinkAssistant.ts';
import { normalizeDrink } from '../../../supabase/functions/_shared/drinkRules.ts';
import { ingredients, methods, milks, vessels, type Drink } from '../../data';
import { validateDrink } from '../../data/validate';
import { getSupabase } from '../../lib/supabase';
import type { Shelf } from '../shelf/store';

export type { DrinkWish };

/** Dzienny limit z decyzji P8 (pilnuje go serwer; tu do wyjaśnienia na ekranie). */
export const DAILY_DRINKS = 10;

/** Id propozycji przed zapisem w „Moich napojach”. */
export const DRAFT_ID = 'moj-propozycja';

export type AssistantResult =
  | { ok: true; drink: Drink; remaining: number | null }
  | { ok: false; reason: 'limit' | 'invalid' | 'error'; message: string };

/** Katalog aplikacji dla asystenta: tylko te id są dozwolone (P9). */
export function assistantCatalog(): AssistantCatalog {
  return {
    methods: methods.map(({ id, name }) => ({ id, name })),
    milks: milks.map(({ id, name, plantBased }) => ({ id, name, plantBased })),
    ingredients: ingredients.map(({ id, name, group }) => ({ id, name, group })),
    vessels: Object.values(vessels).map(({ id, name, capacityMl }) => ({ id, name, capacityMl })),
  };
}

const MESSAGES = {
  limit: `Dzisiejszy limit propozycji od AI (${DAILY_DRINKS}) się wyczerpał. Wróć jutro.`,
  invalid: 'AI nie ułożyło poprawnego przepisu. Spróbuj inaczej opisać, na co masz ochotę.',
  error: 'Nie udało się połączyć z AI. Sprawdź internet i spróbuj ponownie.',
};

async function errorCode(error: unknown): Promise<string | null> {
  const context = (error as { context?: unknown } | null)?.context;
  if (!(context instanceof Response)) return null;
  try {
    const body = (await context.json()) as { error?: { code?: unknown } };
    return typeof body.error?.code === 'string' ? body.error.code : null;
  } catch {
    return null;
  }
}

/**
 * Prosi asystenta o napój. Propozycja przechodzi te same reguły co napoje z katalogu
 * (validateDrink), zanim cokolwiek ją narysuje.
 */
export async function requestDrink(wish: DrinkWish, shelf: Shelf | null): Promise<AssistantResult> {
  const shelfInfo: ShelfInfo = {
    ingredients: shelf ? shelf.ingredients : null,
    methods: shelf?.methods ?? [],
  };
  try {
    const supabase = await getSupabase();
    const { data, error } = await supabase.functions.invoke('drink-assistant', {
      body: { wish, shelf: shelfInfo, catalog: assistantCatalog() },
    });
    if (error) {
      const code = await errorCode(error);
      const reason = code === 'limit' ? 'limit' : code === 'invalid' ? 'invalid' : 'error';
      return { ok: false, reason, message: MESSAGES[reason] };
    }
    const payload = data as { drink?: unknown; remaining?: unknown } | null;
    const drink = normalizeDrink({ ...(payload?.drink as object), id: DRAFT_ID });
    if (validateDrink(drink).length > 0) return { ok: false, reason: 'invalid', message: MESSAGES.invalid };
    return {
      ok: true,
      drink: drink as Drink,
      remaining: typeof payload?.remaining === 'number' ? payload.remaining : null,
    };
  } catch {
    return { ok: false, reason: 'error', message: MESSAGES.error };
  }
}
