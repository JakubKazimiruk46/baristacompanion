import { describe, expect, it } from 'vitest';
import {
  drinks,
  drinksForMethod,
  frothingMethods,
  getIngredient,
  getMethod,
  getMilk,
  getSyrup,
  ingredients,
  isPlantBasedPossible,
  methods,
  milks,
  syrups,
  vessels,
} from '.';

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
    ['składniki (z mlekami i syropami)', ingredients],
  ])('%s mają unikalne id w formacie slug', (_, items) => {
    expectUniqueIds(items);
    for (const item of items) expect(item.id).toMatch(/^[a-z0-9]+(-[a-z0-9]+)*$/);
  });

  it('id nie zajmują adresów innych ekranów', () => {
    const drinkPages = ['mleko', 'spienianie', 'syropy', 'co-mam', 'zakupy'];
    for (const drink of drinks) expect(drinkPages).not.toContain(drink.id);
    for (const method of methods) expect(method.id).not.toBe('dziennik');
  });
});

describe('odwołania', () => {
  it.each(drinks.map((d) => [d.id, d] as const))('%s: metody bazy istnieją', (_, drink) => {
    expect(getMethod(drink.base.methodId)).toBeDefined();
    for (const id of drink.base.alternativeMethodIds ?? []) expect(getMethod(id)).toBeDefined();
  });

  it.each(drinks.filter((d) => d.milk).map((d) => [d.id, d] as const))(
    '%s: mleka istnieją',
    (_, drink) => {
      expect(drink.milk!.options.length).toBeGreaterThan(0);
      for (const id of drink.milk!.options) expect(getMilk(id), id).toBeDefined();
    },
  );

  it.each(drinks.map((d) => [d.id, d] as const))('%s: syropy istnieją', (_, drink) => {
    for (const extra of drink.extras) {
      if (extra.kind === 'syrup') expect(getSyrup(extra.syrupId), extra.syrupId).toBeDefined();
    }
  });

  it('każdy syrop jest użyty w co najmniej jednym napoju', () => {
    const used = new Set(
      drinks.flatMap((d) => d.extras.flatMap((e) => (e.kind === 'syrup' ? [e.syrupId] : []))),
    );
    for (const syrup of syrups) expect(used, syrup.id).toContain(syrup.id);
  });

  it.each(drinks.map((d) => [d.id, d] as const))('%s: dodatki wskazują składniki z katalogu', (_, drink) => {
    for (const extra of drink.extras) {
      if (extra.kind === 'syrup') continue;
      const ingredient = getIngredient(extra.ingredientId);
      expect(ingredient, extra.ingredientId).toBeDefined();
      // Mleko idzie przez drink.milk, a syropy przez syrupId.
      expect(['milk', 'syrup']).not.toContain(ingredient!.group);
    }
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

  it('jest 12 metod, w tym kawiarka i cold brew', () => {
    expect(methods).toHaveLength(12);
    expect(getMethod('kawiarka')).toBeDefined();
    expect(getMethod('cold-brew')).toBeDefined();
  });
});

describe('napoje', () => {
  it('jest co najmniej 12 napojów, ciepłych i zimnych', () => {
    expect(drinks.length).toBeGreaterThanOrEqual(12);
    expect(drinks.some((d) => d.temperature === 'hot')).toBe(true);
    expect(drinks.some((d) => d.temperature === 'cold')).toBe(true);
  });

  it.each(drinks.map((d) => [d.id, d] as const))('%s: warstwy mają dodatnie objętości', (_, drink) => {
    expect(drink.layers.length).toBeGreaterThan(0);
    for (const layer of drink.layers) {
      expect(layer.volumeMl).toBeGreaterThan(0);
      expect(layer.color).toMatch(HEX);
    }
  });

  it.each(drinks.map((d) => [d.id, d] as const))('%s: mieści się w naczyniu', (_, drink) => {
    const total = drink.layers.reduce((sum, layer) => sum + layer.volumeMl, 0);
    expect(total).toBeLessThanOrEqual(vessels[drink.serving.vessel].capacityMl);
  });

  it.each(drinks.map((d) => [d.id, d] as const))('%s: ma sposób podania', (_, drink) => {
    expect(vessels[drink.serving.vessel]).toBeDefined();
    expect(drink.serving.why.length).toBeGreaterThan(0);
    for (const decoration of drink.serving.decorations) {
      expect(decoration.instruction.length).toBeGreaterThan(0);
      expect(decoration.color).toMatch(HEX);
    }
  });

  it.each(drinks.map((d) => [d.id, d] as const))('%s: ilości dodatków są dodatnie', (_, drink) => {
    for (const extra of drink.extras) {
      if (extra.kind === 'syrup') {
        expect(extra.amountMl).toBeGreaterThan(0);
      } else if (typeof extra.amount === 'string') {
        expect(extra.amount.length, extra.name).toBeGreaterThan(0);
      } else {
        expect(extra.amount.value, extra.name).toBeGreaterThan(0);
        if (extra.amount.max !== undefined) expect(extra.amount.max).toBeGreaterThan(extra.amount.value);
      }
    }
  });

  it.each(drinks.map((d) => [d.id, d] as const))('%s: ma kroki i czas', (_, drink) => {
    expect(drink.steps.length).toBeGreaterThan(0);
    expect(drink.prepTimeMin).toBeGreaterThan(0);
  });

  it('napoje na bazie espresso używają kawiarki', () => {
    for (const id of ['espresso-tonic', 'latte-macchiato', 'cafe-bombon', 'cappuccino']) {
      expect(drinks.find((d) => d.id === id)?.base.methodId).toBe('kawiarka');
    }
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

  it('kolory mlek i syropów są poprawne', () => {
    for (const item of [...milks, ...syrups]) expect(item.color).toMatch(HEX);
  });
});
