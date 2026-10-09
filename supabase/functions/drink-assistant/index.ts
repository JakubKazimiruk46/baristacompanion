// Asystent drinków: Claude proponuje napój z katalogu aplikacji (P9). Wymaga zalogowania i pilnuje
// dziennego limitu (P8). Odpowiedź ma schemat z dozwolonymi id (structured outputs), a potem przechodzi
// reguły spójności napoju; przy błędach jest jedna próba poprawki. Aplikacja sprawdza wynik jeszcze
// raz swoimi danymi, zanim go pokaże. Logi bez treści życzenia i bez przepisu.
//
// Sekret: npx supabase secrets set ANTHROPIC_API_KEY=… (klucz nigdy nie trafia do przeglądarki).
import Anthropic from 'npm:@anthropic-ai/sdk@0.128.0';
import {
  buildDrinkPrompt,
  buildDrinkSchema,
  describeCatalog,
  DRINK_SYSTEM,
  MOOD_LIMIT,
  repairPrompt,
  type AssistantCatalog,
  type DrinkWish,
  type ShelfInfo,
} from '../_shared/drinkAssistant.ts';
import { normalizeDrink, validateDrinkWith } from '../_shared/drinkRules.ts';
import { adminClient, fail, json, preflight, requestUser } from '../_shared/http.ts';
import { consumeQuota, releaseQuota } from '../_shared/quota.ts';

const anthropic = new Anthropic();

/** Id na czas sprawdzania: ostateczne nadaje aplikacja przy zapisie w „Moich napojach”. */
const DRAFT_ID = 'propozycja';

const MAX_BODY = 100_000;
const isObj = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v);
const shortText = (v: unknown, max = 80) => typeof v === 'string' && v.length > 0 && v.length <= max;

/** Katalog od aplikacji: tylko pola, których potrzebujemy, w rozsądnych rozmiarach. */
function parseCatalog(value: unknown): AssistantCatalog | null {
  if (!isObj(value)) return null;
  const list = <T>(raw: unknown, max: number, item: (v: Record<string, unknown>) => T | null): T[] | null => {
    if (!Array.isArray(raw) || raw.length === 0 || raw.length > max) return null;
    const items = raw.map((v) => (isObj(v) ? item(v) : null));
    return items.every((v) => v !== null) ? (items as T[]) : null;
  };
  const methods = list(value.methods, 50, (m) => (shortText(m.id, 40) && shortText(m.name) ? { id: m.id as string, name: m.name as string } : null));
  const milks = list(value.milks, 30, (m) =>
    shortText(m.id, 40) && shortText(m.name) && typeof m.plantBased === 'boolean'
      ? { id: m.id as string, name: m.name as string, plantBased: m.plantBased }
      : null,
  );
  const ingredients = list(value.ingredients, 300, (i) =>
    shortText(i.id, 40) && shortText(i.name) && shortText(i.group, 20)
      ? { id: i.id as string, name: i.name as string, group: i.group as string }
      : null,
  );
  const vessels = list(value.vessels, 30, (v) =>
    shortText(v.id, 40) && shortText(v.name) && typeof v.capacityMl === 'number' && v.capacityMl > 0
      ? { id: v.id as string, name: v.name as string, capacityMl: v.capacityMl }
      : null,
  );
  return methods && milks && ingredients && vessels ? { methods, milks, ingredients, vessels } : null;
}

/**
 * Odpowiedź modelu do odesłania w prośbie o poprawkę. Po przełączeniu na model zapasowy (fallbacks)
 * sprzed bloku „fallback” wracają tylko teksty: bloki myślenia odrzuconej próby się pomija.
 */
function replayable(content: Anthropic.Beta.BetaContentBlock[]): Anthropic.Beta.BetaContentBlock[] {
  const boundary = content.findLastIndex((block) => block.type === 'fallback');
  return content.filter((block, i) => i > boundary || block.type === 'text');
}

function parseWish(value: unknown): DrinkWish | null {
  if (!isObj(value)) return null;
  const { mood, temperature, milk, plantBased, alcohol, onlyShelf } = value;
  if (typeof mood !== 'string' || mood.length > MOOD_LIMIT) return null;
  if (temperature !== null && temperature !== 'hot' && temperature !== 'cold') return null;
  if (milk !== null && milk !== 'with' && milk !== 'without') return null;
  if (typeof plantBased !== 'boolean' || typeof alcohol !== 'boolean' || typeof onlyShelf !== 'boolean') return null;
  return { mood, temperature, milk, plantBased, alcohol, onlyShelf };
}

function parseShelf(value: unknown, catalog: AssistantCatalog): ShelfInfo {
  const ids = (raw: unknown, known: Set<string>) =>
    Array.isArray(raw) ? raw.filter((id): id is string => typeof id === 'string' && known.has(id)) : [];
  const ingredientIds = new Set(catalog.ingredients.map((i) => i.id));
  const methodIds = new Set(catalog.methods.map((m) => m.id));
  if (!isObj(value)) return { ingredients: null, methods: [] };
  return {
    ingredients: value.ingredients === null ? null : ids(value.ingredients, ingredientIds),
    methods: ids(value.methods, methodIds),
  };
}

Deno.serve(async (request) => {
  const early = preflight(request);
  if (early) return early;

  const user = await requestUser(request);
  if (!user) return fail(401, 'unauthorized', 'Zaloguj się, żeby korzystać z asystenta drinków.');

  const raw = await request.text();
  if (raw.length > MAX_BODY) return fail(413, 'too_large', 'Zapytanie jest za duże.');
  let body: Record<string, unknown>;
  try {
    body = JSON.parse(raw);
  } catch {
    return fail(400, 'bad_request', 'Niepoprawne zapytanie.');
  }
  const catalog = parseCatalog(body.catalog);
  const wish = parseWish(body.wish);
  if (!catalog || !wish) return fail(400, 'bad_request', 'Niepoprawne zapytanie.');
  const shelf = parseShelf(body.shelf, catalog);

  const admin = adminClient();
  const remaining = await consumeQuota(admin, user.id, 'drink_assistant');
  if (remaining === null) return fail(429, 'limit', 'Dzisiejszy limit propozycji od AI się wyczerpał.');

  const schema = buildDrinkSchema(catalog, { alcohol: wish.alcohol });
  const messages: Anthropic.Beta.BetaMessageParam[] = [{ role: 'user', content: buildDrinkPrompt(wish, shelf, catalog) }];

  const ask = () =>
    anthropic.beta.messages.create({
      model: 'claude-opus-5-5',
      max_tokens: 16000,
      output_config: { effort: 'medium', format: { type: 'json_schema', schema } },
      betas: ['server-side-fallback-2026-07-01'],
      fallbacks: 'default',
      system: [
        { type: 'text', text: DRINK_SYSTEM },
        // Katalog jest taki sam dla wszystkich: stały początek zapytania da się cache'ować.
        { type: 'text', text: describeCatalog(catalog), cache_control: { type: 'ephemeral' } },
      ],
      messages,
    });

  try {
    for (let attempt = 0; attempt < 2; attempt++) {
      const response = await ask();
      console.log('drink-assistant', user.id, attempt, response.stop_reason, response.usage.input_tokens, response.usage.output_tokens);
      if (response.stop_reason === 'refusal' || response.stop_reason === 'max_tokens') break;
      const text = response.content.find((block) => block.type === 'text');
      let drink: unknown = null;
      try {
        drink = text && text.type === 'text' ? normalizeDrink({ ...JSON.parse(text.text), id: DRAFT_ID }) : null;
      } catch {
        drink = null;
      }
      const errors = drink ? validateDrinkWith(drink, catalog) : ['Odpowiedź nie jest poprawnym JSON.'];
      if (errors.length === 0) return json({ drink, remaining });
      // Jedna próba poprawki: odpowiedź modelu wraca do rozmowy bez zmian (rozmowa tylko rośnie).
      messages.push({ role: 'assistant', content: replayable(response.content) }, { role: 'user', content: repairPrompt(errors) });
    }
    await releaseQuota(admin, user.id, 'drink_assistant');
    return fail(422, 'invalid', 'AI nie ułożyło poprawnego przepisu. Spróbuj inaczej opisać, na co masz ochotę.');
  } catch (error) {
    await releaseQuota(admin, user.id, 'drink_assistant');
    if (error instanceof Anthropic.RateLimitError) return fail(503, 'busy', 'AI jest teraz zajęte. Spróbuj za chwilę.');
    console.error('drink-assistant', user.id, error instanceof Anthropic.APIError ? error.status : 'error');
    return fail(502, 'ai_failed', 'Nie udało się połączyć z AI.');
  }
});
