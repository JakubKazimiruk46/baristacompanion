import { describe, expect, it } from 'vitest';
import {
  drinks,
  drinksForMethod,
  frothingMethods,
  getMethod,
  getMilk,
  getSyrup,
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
  ])('%s mają unikalne id w formacie slug', (_, items) => {
    expectUniqueIds(items);
    for (const item of items) expect(item.id).toMatch(/^[a-z0-9]+(-[a-z0-9]+)*$/);
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

  it('jest 7 metod, w tym kawiarka i cold brew', () => {
    expect(methods).toHaveLength(7);
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
