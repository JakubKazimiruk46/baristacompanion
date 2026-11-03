import { describe, expect, it } from 'vitest';
import {
  baseMethodIds,
  beanMethods,
  drinks,
  drinksForMethod,
  hasAlcohol,
  frothingMethods,
  getIngredient,
  getMethod,
  grinderModels,
  GRIND_SIZES,
  ingredients,
  isPlantBasedPossible,
  methods,
  milks,
  syrups,
  vessels,
} from '.';
import { validateDrink } from './validate';

const HEX = /^#[0-9a-f]{6}$/i;

function expectUniqueIds(items: { id: string }[]) {
  const ids = items.map((item) => item.id);
  expect(new Set(ids).size).toBe(ids.length);
}

describe('identyfikatory', () => {
  it.each([
    ['metody', methods],
    ['napoje', drinks],
    ['mleka', milks],
    ['syropy', syrups],
    ['spienianie', frothingMethods],
    ['młynki', grinderModels],
    ['składniki (z mlekami i syropami)', ingredients],
  ])('%s mają unikalne id w formacie slug', (_, items) => {
    expectUniqueIds(items);
    for (const item of items) expect(item.id).toMatch(/^[a-z0-9]+(-[a-z0-9]+)*$/);
  });

  it('id metod nie zajmują adresów innych ekranów (napoje sprawdza validateDrink)', () => {
    for (const method of methods) expect(method.id).not.toBe('dziennik');
  });
});

describe('odwołania', () => {
  it('każdy syrop jest użyty w co najmniej jednym napoju', () => {
    const used = new Set(
      drinks.flatMap((d) => d.extras.flatMap((e) => (e.kind === 'syrup' ? [e.syrupId] : []))),
    );
    for (const syrup of syrups) expect(used, syrup.id).toContain(syrup.id);
  });

  it.each(ingredients.filter((i) => i.substitutes).map((i) => [i.id, i] as const))(
    '%s: zamienniki istnieją i mają opis',
    (_, ingredient) => {
      for (const substitute of ingredient.substitutes!) {
        expect(getIngredient(substitute.id), substitute.id).toBeDefined();
        expect(substitute.id).not.toBe(ingredient.id);
        expect(substitute.note.length).toBeGreaterThan(0);
      }
    },
  );

  it('każdy składnik z katalogu jest w jakimś napoju albo zastępuje inny', () => {
    const used = new Set([
      ...milks.map((m) => m.id),
      ...syrups.map((s) => s.id),
      ...drinks.flatMap((d) => d.extras.flatMap((e) => (e.kind === 'syrup' ? [] : [e.ingredientId]))),
      ...ingredients.flatMap((i) => i.substitutes?.map((s) => s.id) ?? []),
    ]);
    for (const ingredient of ingredients) expect(used, ingredient.id).toContain(ingredient.id);
  });
});

describe('metody parzenia', () => {
  it.each(methods.map((m) => [m.id, m] as const))('%s: kroki z czasem mają czas > 0', (_, method) => {
    expect(method.steps.length).toBeGreaterThan(0);
    for (const step of method.steps) {
      if (step.durationSec !== undefined) expect(step.durationSec).toBeGreaterThan(0);
    }
  });

  it.each(methods.map((m) => [m.id, m] as const))('%s: sensowne liczby', (_, method) => {
    expect(method.dose.coffeeG).toBeGreaterThan(0);
    expect(method.dose.waterMl).toBeGreaterThan(method.dose.coffeeG);
    expect(method.waterTempC.min).toBeLessThanOrEqual(method.waterTempC.max);
    expect(method.totalTimeSec).toBeGreaterThan(0);
    expect(method.suits.roasts.length).toBeGreaterThan(0);
  });

  it.each(methods.map((m) => [m.id, m] as const))('%s: kalkulator obejmuje ilość z przepisu', (_, method) => {
    const { waterMl, stepMl, servingMl, sizes } = method.scaling;
    expect(waterMl.min).toBeLessThanOrEqual(method.dose.waterMl);
    expect(waterMl.max).toBeGreaterThanOrEqual(method.dose.waterMl);
    expect(stepMl).toBeGreaterThan(0);
    expect(servingMl).toBeGreaterThan(0);
    if (sizes) {
      expect(sizes.map((s) => s.waterMl)).toContain(method.dose.waterMl);
      for (const size of sizes) {
        expect(size.waterMl).toBeGreaterThanOrEqual(waterMl.min);
        expect(size.waterMl).toBeLessThanOrEqual(waterMl.max);
      }
    }
  });

  it.each(methods.map((m) => [m.id, m] as const))('%s: znaczniki ilości są poprawne', (_, method) => {
    for (const step of method.steps) {
      for (const text of [step.text, step.detail ?? '']) {
        // Każdy nawias klamrowy to znacznik {coffee}, {water} albo {water*ułamek}.
        const rest = text.replace(/\{(coffee|water)(\*\d+(\.\d+)?)?\}/g, '');
        expect(rest, text).not.toMatch(/[{}]/);
      }
    }
  });

  it('jest 13 metod, w tym kawiarka, cold brew i kawa rozpuszczalna (jedyny wyjątek bez mielenia)', () => {
    expect(methods).toHaveLength(13);
    expect(getMethod('kawiarka')).toBeDefined();
    expect(getMethod('cold-brew')).toBeDefined();
    expect(methods.filter((m) => m.instant).map((m) => m.id)).toEqual(['kawa-rozpuszczalna']);
    expect(beanMethods).toHaveLength(12);
  });
});

describe('młynki', () => {
  const onStep = (value: number, step: number) => Math.abs(value / step - Math.round(value / step)) < 1e-9;

  it('jest co najmniej 8 popularnych modeli, ręcznych i elektrycznych', () => {
    expect(grinderModels.length).toBeGreaterThanOrEqual(8);
    expect(grinderModels.some((g) => g.kind === 'manual')).toBe(true);
    expect(grinderModels.some((g) => g.kind === 'electric')).toBe(true);
  });

  it.each(grinderModels.map((g) => [g.id, g] as const))('%s: ma zakres dla każdego stopnia mielenia', (_, model) => {
    expect(Object.keys(model.grind).sort()).toEqual([...GRIND_SIZES].sort());
    expect(model.scale.min).toBeLessThan(model.scale.max);
    expect(model.step).toBeGreaterThan(0);
    expect(model.howTo.length).toBeGreaterThan(0);
    for (const size of GRIND_SIZES) {
      const range = model.grind[size];
      if (!range) continue;
      expect(range.min, size).toBeLessThanOrEqual(range.max);
      expect(range.min, size).toBeGreaterThanOrEqual(model.scale.min);
      expect(range.max, size).toBeLessThanOrEqual(model.scale.max);
      expect(onStep(range.min, model.step) && onStep(range.max, model.step), size).toBe(true);
    }
  });

  it.each(grinderModels.map((g) => [g.id, g] as const))('%s: grubsze mielenie to wyższe ustawienie', (_, model) => {
    const ranges = GRIND_SIZES.map((size) => model.grind[size]);
    // Brak zakresu („tak drobno nie zmieli”) tylko na drobnym końcu skali.
    const firstRange = ranges.findIndex((range) => range !== null);
    expect(firstRange).toBeGreaterThanOrEqual(0);
    expect(ranges.slice(firstRange)).not.toContain(null);
    const defined = ranges.filter((range) => range !== null);
    for (let i = 1; i < defined.length; i++) {
      expect(defined[i]!.min).toBeGreaterThanOrEqual(defined[i - 1]!.min);
      expect(defined[i]!.max).toBeGreaterThanOrEqual(defined[i - 1]!.max);
    }
  });

  it.each(grinderModels.map((g) => [g.id, g] as const))('%s: podpowiedzi czekają na sprawdzenie', (_, model) => {
    expect(model.needsReview).toBe(true);
    expect(model.reviewNote?.length).toBeGreaterThan(0);
  });
});

describe('napoje', () => {
  // Odwołania, objętości, kolory, ilości, podanie i długości tekstów: wspólne reguły z validate.ts
  // (te same sprawdzają propozycje asystenta drinków i „Moje napoje”).
  it.each(drinks.map((d) => [d.id, d] as const))('%s: przechodzi reguły spójności napoju', (_, drink) => {
    expect(validateDrink(drink)).toEqual([]);
  });

  it('jest co najmniej 35 napojów, ciepłych i zimnych', () => {
    expect(drinks.length).toBeGreaterThanOrEqual(35);
    expect(drinks.some((d) => d.temperature === 'hot')).toBe(true);
    expect(drinks.some((d) => d.temperature === 'cold')).toBe(true);
  });

  it('napoje na bazie espresso używają kawiarki', () => {
    for (const id of ['espresso-tonic', 'latte-macchiato', 'cafe-bombon', 'cappuccino']) {
      expect(drinks.find((d) => d.id === id)?.base.methodId).toBe('kawiarka');
    }
  });

  it('napoje z alkoholem (reguła kind „alcohol” ↔ grupa „alkohol” jest w validate.ts)', () => {
    expect(drinks.filter(hasAlcohol).map((d) => d.id).sort()).toEqual(['espresso-martini', 'irish-coffee']);
  });

  it('każde naczynie jest użyte w co najmniej jednym napoju', () => {
    const used = new Set(drinks.map((d) => d.serving.vessel));
    for (const id of Object.keys(vessels)) expect(used, id).toContain(id);
  });

  it('kawa rozpuszczalna jest bazą tylko napojów, które jej wymagają', () => {
    const own = drinksForMethod('kawa-rozpuszczalna').filter((d) => !d.credit);
    expect(own.map((d) => d.id).sort()).toEqual(['dalgona', 'frappe-po-grecku']);
    for (const drink of drinks) expect(drink.base.alternativeMethodIds ?? []).not.toContain('kawa-rozpuszczalna');
  });

  it('drip ma zimny napój (ścieżka „Mam kawę” z planu)', () => {
    expect(drinksForMethod('drip').some((d) => d.temperature === 'cold')).toBe(true);
  });
});

describe('pomocnicze', () => {
  it('wersja roślinna: bez mleka albo z mlekiem roślinnym i bez nabiału w dodatkach', () => {
    const byId = (id: string) => drinks.find((d) => d.id === id)!;
    expect(isPlantBasedPossible(byId('espresso-tonic'))).toBe(true);
    expect(isPlantBasedPossible(byId('latte-macchiato'))).toBe(true);
    expect(isPlantBasedPossible(byId('cafe-bombon'))).toBe(true);
    expect(isPlantBasedPossible(byId('kawa-po-wiedensku'))).toBe(false);
    expect(isPlantBasedPossible(byId('bicerin'))).toBe(false);
    expect(isPlantBasedPossible(byId('kawa-mrozona-z-lodami'))).toBe(false);
  });

  it('metody bazy: główna i alternatywne, a przy „wszystkich metodach” każda (główna pierwsza)', () => {
    const tonic = drinks.find((d) => d.id === 'espresso-tonic')!;
    expect(baseMethodIds(tonic)).toEqual([tonic.base.methodId, ...(tonic.base.alternativeMethodIds ?? [])]);
    const any = baseMethodIds({ ...tonic, base: { methodId: 'drip', amountMl: 50, anyMethod: true } });
    expect(any[0]).toBe('drip');
    expect([...any].sort()).toEqual(methods.map((m) => m.id).sort());
  });

  it('kolory mlek i syropów są poprawne', () => {
    for (const item of [...milks, ...syrups]) expect(item.color).toMatch(HEX);
  });
});
