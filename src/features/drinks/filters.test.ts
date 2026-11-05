import { describe, expect, it } from 'vitest';
import { drinks, type Drink } from '../../data';
import { filterDrinks, filtersFromParams, filtersToParams, hasActiveFilters, searchDrinks, sheetFilterCount } from './filters';

function drink(overrides: Partial<Drink> & Pick<Drink, 'id'>): Drink {
  return {
    name: overrides.id,
    tagline: '',
    description: '',
    temperature: 'hot',
    prepTimeMin: 10,
    base: { methodId: 'kawiarka', amountMl: 40 },
    extras: [],
    equipment: [],
    layers: [{ name: 'kawa', volumeMl: 40, color: '#000000', kind: 'liquid' }],
    steps: ['krok'],
    serving: { vessel: 'cup', why: '', decorations: [] },
    ...overrides,
  };
}

const fixtures = [
  drink({ id: 'goraca-czarna', temperature: 'hot', prepTimeMin: 8 }),
  drink({
    id: 'goraca-z-krowim',
    temperature: 'hot',
    milk: { options: ['krowie'], amountMl: 100, prep: 'froth' },
  }),
  drink({
    id: 'zimna-z-owsianym',
    temperature: 'cold',
    prepTimeMin: 15,
    milk: { options: ['krowie', 'owsiane-barista'], amountMl: 100, prep: 'plain' },
  }),
  drink({
    id: 'zimna-ze-smietana',
    temperature: 'cold',
    prepTimeMin: 25,
    extras: [
      { kind: 'cream', ingredientId: 'smietanka-30', name: 'śmietana', amount: '50 ml', dairy: true },
    ],
  }),
  drink({ id: 'zimna-czarna', temperature: 'cold', prepTimeMin: 960 }),
];

const ids = (list: Drink[]) => list.map((d) => d.id);

describe('filterDrinks', () => {
  it('bez filtrów zwraca wszystko', () => {
    expect(filterDrinks(fixtures, {})).toEqual(fixtures);
  });

  it('zimne + roślinne', () => {
    expect(ids(filterDrinks(fixtures, { temperature: 'cold', plantBased: true }))).toEqual([
      'zimna-z-owsianym',
      'zimna-czarna',
    ]);
  });

  it('ciepłe + bez mleka', () => {
    expect(ids(filterDrinks(fixtures, { temperature: 'hot', milk: 'without' }))).toEqual([
      'goraca-czarna',
    ]);
  });

  it('śmietanka liczy się jako mleko', () => {
    expect(ids(filterDrinks(fixtures, { milk: 'without' }))).toEqual(['goraca-czarna', 'zimna-czarna']);
  });

  it('z mlekiem + roślinne odrzuca napoje tylko z mlekiem krowim', () => {
    expect(ids(filterDrinks(fixtures, { milk: 'with', plantBased: true }))).toEqual([
      'zimna-z-owsianym',
    ]);
  });

  it('czas przygotowania: do 15 min', () => {
    expect(ids(filterDrinks(fixtures, { maxTimeMin: 15 }))).toEqual([
      'goraca-czarna',
      'goraca-z-krowim',
      'zimna-z-owsianym',
    ]);
  });

  it('wszystkie filtry naraz', () => {
    expect(
      ids(
        filterDrinks(fixtures, {
          temperature: 'cold',
          milk: 'with',
          plantBased: true,
          maxTimeMin: 15,
        }),
      ),
    ).toEqual(['zimna-z-owsianym']);
  });

  it('ulubione: tylko napoje z listy, razem z innymi filtrami', () => {
    const favoriteIds = ['goraca-czarna', 'zimna-czarna'];
    expect(ids(filterDrinks(fixtures, { favorites: true }, { favoriteIds }))).toEqual(favoriteIds);
    expect(ids(filterDrinks(fixtures, { favorites: true, temperature: 'cold' }, { favoriteIds }))).toEqual([
      'zimna-czarna',
    ]);
    expect(filterDrinks(fixtures, { favorites: true })).toEqual([]);
  });

  it('bez alkoholu: na prawdziwych danych wypadają irish coffee i espresso martini', () => {
    const result = ids(filterDrinks(drinks, { noAlcohol: true }));
    expect(result).toHaveLength(drinks.length - 2);
    expect(result).not.toContain('irish-coffee');
    expect(result).not.toContain('espresso-martini');
  });

  it('na prawdziwych danych: zimne + roślinne wyklucza kawę mrożoną z bitą śmietaną', () => {
    const result = ids(filterDrinks(drinks, { temperature: 'cold', plantBased: true }));
    expect(result).toContain('espresso-tonic');
    expect(result).not.toContain('kawa-mrozona-z-lodami');
    expect(result).not.toContain('latte-macchiato');
  });
});

describe('filtry w adresie', () => {
  it('zapis i odczyt dają te same filtry', () => {
    const filters = {
      favorites: true,
      available: true,
      temperature: 'cold',
      milk: 'without',
      plantBased: true,
      noAlcohol: true,
      maxTimeMin: 10,
    } as const;
    const params = filtersToParams(filters);
    expect(params.toString()).toBe('ulubione=1&mam=1&temp=zimne&mleko=bez&roslinne=1&alkohol=bez&czas=10');
    expect(filtersFromParams(params)).toEqual(filters);
  });

  it('ignoruje błędne wartości', () => {
    expect(filtersFromParams(new URLSearchParams('temp=letnie&czas=7&mleko=tak'))).toEqual({});
  });

  it('hasActiveFilters', () => {
    expect(hasActiveFilters({})).toBe(false);
    expect(hasActiveFilters({ plantBased: false })).toBe(false);
    expect(hasActiveFilters({ maxTimeMin: 10 })).toBe(true);
  });
});

describe('wyszukiwanie i licznik filtrów', () => {
  it('szuka po nazwie i haśle, bez polskich znaków', () => {
    const found = searchDrinks(drinks, 'pomaranczowa');
    expect(found.map((d) => d.id)).toContain('kawa-pomaranczowa');
    expect(searchDrinks(drinks, '')).toHaveLength(drinks.length);
    expect(searchDrinks(drinks, 'nie ma takiego napoju')).toEqual([]);
  });

  it('liczy tylko filtry z okna, nie szybkie', () => {
    expect(sheetFilterCount({ temperature: 'cold', favorites: true })).toBe(0);
    expect(sheetFilterCount({ milk: 'without', noAlcohol: true, maxTimeMin: 10, plantBased: false })).toBe(3);
  });

  it('„Do spróbowania” zostawia napoje z listy', () => {
    const found = filterDrinks(drinks, { toTry: true }, { wishlistIds: ['mocha'] });
    expect(found.map((d) => d.id)).toEqual(['mocha']);
    expect(filtersToParams({ toTry: true }).toString()).toBe('sprobuj=1');
  });
});
