import { describe, expect, it } from 'vitest';
import {
  buildDrinkPrompt,
  buildDrinkSchema,
  describeCatalog,
  MOOD_LIMIT,
} from '../../../supabase/functions/_shared/drinkAssistant.ts';
import { ingredients, methods, milks, syrups, vessels } from '../../data';
import { assistantCatalog } from './api';

const catalog = assistantCatalog();

type Schema = Record<string, unknown>;

/** Wszystkie obiekty w schemacie (structured outputs: każdy z additionalProperties: false). */
function objects(schema: unknown, found: Schema[] = []): Schema[] {
  if (Array.isArray(schema)) schema.forEach((item) => objects(item, found));
  else if (typeof schema === 'object' && schema !== null) {
    const s = schema as Schema;
    if (s.type === 'object') found.push(s);
    Object.values(s).forEach((value) => objects(value, found));
  }
  return found;
}

/** Wszystkie listy dozwolonych wartości w schemacie. */
function enums(schema: unknown, found: string[][] = []): string[][] {
  if (Array.isArray(schema)) schema.forEach((item) => enums(item, found));
  else if (typeof schema === 'object' && schema !== null) {
    const s = schema as Schema;
    if (Array.isArray(s.enum)) found.push(s.enum as string[]);
    Object.values(s).forEach((value) => enums(value, found));
  }
  return found;
}

describe('schemat odpowiedzi asystenta (P9: tylko katalog)', () => {
  const schema = buildDrinkSchema(catalog, { alcohol: false });
  const all = enums(schema).flat();

  it('każdy obiekt ma wszystkie pola wymagane i bez dodatkowych', () => {
    for (const object of objects(schema)) {
      expect(object.additionalProperties).toBe(false);
      expect([...(object.required as string[])].sort()).toEqual(Object.keys(object.properties as Schema).sort());
    }
    expect(JSON.stringify(schema)).not.toMatch(/minLength|maxLength|minimum|maximum|"pattern"/);
  });

  it('metody, mleka, syropy, składniki i naczynia tylko z katalogu', () => {
    const known = new Set([
      ...methods.map((m) => m.id),
      ...milks.map((m) => m.id),
      ...syrups.map((s) => s.id),
      ...ingredients.map((i) => i.id),
      ...Object.keys(vessels),
    ]);
    const ids = enums(schema).filter((list) => list.some((value) => known.has(value)));
    for (const list of ids) for (const value of list) expect(known, value).toContain(value);
    expect(all).toEqual(expect.arrayContaining(['kawiarka', 'owsiane-barista', 'karmelowy', 'tonik', 'martini-glass']));
  });

  it('bez zgody na alkohol nie ma składników z alkoholem ani rodzaju „alcohol”', () => {
    expect(all).not.toContain('wodka');
    expect(all).not.toContain('alcohol');
    const withAlcohol = enums(buildDrinkSchema(catalog, { alcohol: true })).flat();
    expect(withAlcohol).toEqual(expect.arrayContaining(['wodka', 'alcohol']));
  });
});

describe('instrukcja dla asystenta', () => {
  it('katalog z nazwami i pojemnością naczyń', () => {
    const text = describeCatalog(catalog);
    expect(text).toContain('- kawiarka: Kawiarka');
    expect(text).toContain('- owsiane-barista: Mleko owsiane barista (roślinne)');
    expect(text).toContain('- tall-glass: wysoka szklanka, 400 ml');
  });

  it('preferencje, półka i życzenie w znacznikach (dane, nie polecenia), przycięte', () => {
    const prompt = buildDrinkPrompt(
      {
        mood: `coś z cytrusami ${'x'.repeat(400)}`,
        temperature: 'cold',
        milk: 'without',
        plantBased: true,
        alcohol: false,
        onlyShelf: true,
      },
      { ingredients: ['tonik', 'lod'], methods: ['kawiarka'] },
      catalog,
    );
    expect(prompt).toContain('Preferencje: na zimno, bez mleka, w wersji roślinnej, bez alkoholu.');
    expect(prompt).toContain('W domu jest: tonik, lód (woda zawsze). Użyj tylko tych składników i mleka z tej listy.');
    expect(prompt).toContain('Sprzęt do parzenia w domu: Kawiarka.');
    const wish = prompt.match(/<zyczenie>([\s\S]*)<\/zyczenie>/)![1]!;
    expect(wish.startsWith('coś z cytrusami')).toBe(true);
    expect(wish.length).toBe(MOOD_LIMIT);
  });

  it('bez półki: składniki łatwe do kupienia', () => {
    const prompt = buildDrinkPrompt(
      { mood: '', temperature: null, milk: null, plantBased: false, alcohol: true, onlyShelf: false },
      { ingredients: null, methods: [] },
      catalog,
    );
    expect(prompt).toContain('Nie wiadomo, co jest w domu');
    expect(prompt).toContain('alkohol dozwolony');
    expect(prompt).toContain('<zyczenie>brak, zaproponuj coś ciekawego</zyczenie>');
  });
});
