import { describe, expect, it } from 'vitest';
import { normalizeDrink } from '../../supabase/functions/_shared/drinkRules.ts';
import { getDrink, type Drink } from '.';
import { validateDrink } from './validate';

const base = (): Drink => structuredClone(getDrink('espresso-tonic')!);
const broken = (change: (drink: Record<string, unknown> & Drink) => void) => {
  const drink = base() as Record<string, unknown> & Drink;
  change(drink);
  return validateDrink(drink);
};

describe('validateDrink: reguły spójności napoju', () => {
  it('napój z katalogu jest poprawny', () => {
    expect(validateDrink(base())).toEqual([]);
  });

  it('nieznane odwołania (metoda, mleko, składnik, syrop, naczynie)', () => {
    expect(broken((d) => (d.base.methodId = 'ekspres'))).toContain('base.methodId: nieznana metoda „ekspres”.');
    expect(broken((d) => (d.milk = { options: ['kozie'], amountMl: 100, prep: 'froth' }))).toContain(
      'milk.options: nieznane mleko „kozie”.',
    );
    expect(broken((d) => d.extras.push({ kind: 'fruit', ingredientId: 'durian', name: 'durian', amount: '1' }))).toContain(
      'extras[2].ingredientId: nieznany składnik „durian”.',
    );
    expect(broken((d) => d.extras.push({ kind: 'syrup', syrupId: 'krowie', amountMl: 10 }))).toContain(
      'extras[2].syrupId: nieznany syrop „krowie”.',
    );
    expect(broken((d) => (d.serving.vessel = 'kufel' as Drink['serving']['vessel']))).toContain(
      'serving.vessel: nieznane naczynie „kufel”.',
    );
  });

  it('mleko i syrop nie mogą być zwykłym dodatkiem, a alkohol musi być oznaczony', () => {
    expect(broken((d) => d.extras.push({ kind: 'other', ingredientId: 'krowie', name: 'mleko', amount: '1' }))).toContain(
      'extras[2].ingredientId: mleko idzie przez milk, a syrop przez kind „syrup”.',
    );
    expect(broken((d) => d.extras.push({ kind: 'mixer', ingredientId: 'wodka', name: 'wódka', amount: '1' }))).toContain(
      'extras[2]: alkohol tylko jako kind „alcohol” i odwrotnie.',
    );
  });

  it('objętości, kolory, ilości i naczynie', () => {
    expect(broken((d) => (d.layers[0]!.volumeMl = 900))).toContain('Warstwy (950 ml) nie mieszczą się w naczyniu (400 ml).');
    expect(broken((d) => (d.layers[0]!.color = 'błękit'))).toContain('layers[0].color: kolor #rrggbb.');
    expect(broken((d) => (d.layers[1]!.name = d.layers[0]!.name))).toContain('layers[1].name: nazwy warstw bez powtórzeń.');
    expect(broken((d) => (d.extras[1] = { kind: 'ice', ingredientId: 'lod', name: 'lód', amount: { value: 4, max: 3, unit: 'cube' } }))).toContain(
      'extras[1].amount.max: większe niż value.',
    );
    expect(broken((d) => (d.extras[0] = { ...d.extras[0]!, amount: { value: 1, unit: 'beczka' } } as unknown as Drink['extras'][number]))).toContain(
      'extras[0].amount.unit: jedno z: ml, g, cube, scoop, tsp, piece.',
    );
  });

  it('baza: metody alternatywne albo każda metoda (anyMethod), nie jedno i drugie', () => {
    const any = (change: (base: Record<string, unknown>) => void) =>
      broken((d) => {
        delete d.base.alternativeMethodIds;
        change(d.base as unknown as Record<string, unknown>);
      });
    expect(any((b) => (b.anyMethod = true))).toEqual([]);
    expect(any((b) => (b.anyMethod = 'tak'))).toContain('base.anyMethod: tylko true.');
    expect(broken((d) => (d.base.anyMethod = true))).toContain(
      'base.alternativeMethodIds: zbędne, gdy pasuje każda metoda (anyMethod).',
    );
    expect(normalizeDrink({ ...base(), base: { methodId: 'drip', amountMl: 50, anyMethod: true } })).toMatchObject({
      base: { methodId: 'drip', amountMl: 50, anyMethod: true },
    });
  });

  it('teksty i listy w granicach, a id nie zajmuje adresu innego ekranu', () => {
    expect(broken((d) => (d.name = 'x'.repeat(61)))).toContain('Nazwa: najwyżej 60 znaków.');
    expect(broken((d) => (d.steps = []))).toContain('steps: co najmniej jeden krok.');
    expect(broken((d) => (d.steps = Array.from({ length: 13 }, (_, i) => `krok ${i}`)))).toContain('steps: najwyżej 12.');
    expect(broken((d) => (d.id = 'asystent'))).toContain('id „asystent” zajmuje adres innego ekranu.');
    expect(broken((d) => (d.id = 'Zła Nazwa'))).toContain('id: slug z małych liter, cyfr i myślników.');
  });

  it('niezaufane dane nie wywracają walidacji', () => {
    for (const junk of [null, 'napój', [], { layers: 'dużo', serving: [], extras: [null, 5] }, { base: { alternativeMethodIds: 'drip' } }]) {
      expect(validateDrink(junk).length).toBeGreaterThan(0);
    }
  });
});

describe('normalizeDrink', () => {
  it('usuwa null (pola opcjonalne od AI) i pola, których schemat nie zna', () => {
    const raw = {
      ...base(),
      needsReview: true,
      html: '<script>',
      milk: null,
      base: { methodId: 'kawiarka', amountMl: 50, alternativeMethodIds: [], note: null, extra: 1 },
      extras: [{ kind: 'mixer', ingredientId: 'tonik', name: 'tonik', amount: { value: 150, max: null, unit: 'ml' }, optional: null, blended: null, dairy: null }],
    };
    const drink = normalizeDrink(raw) as Record<string, unknown>;
    expect(drink).not.toHaveProperty('needsReview');
    expect(drink).not.toHaveProperty('html');
    expect(drink).not.toHaveProperty('milk');
    expect(drink.base).toEqual({ methodId: 'kawiarka', amountMl: 50, alternativeMethodIds: [] });
    expect(drink.extras).toEqual([{ kind: 'mixer', ingredientId: 'tonik', name: 'tonik', amount: { value: 150, unit: 'ml' } }]);
    expect(validateDrink(drink)).toEqual([]);
  });
});
