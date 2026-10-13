import { describe, expect, it } from 'vitest';
import { filtersFromParams, filtersToParams, isNarrowed, searchWords, type CommunityFilters } from './filters';

describe('filtry Społeczności w adresie', () => {
  it('adres → filtry → adres bez zmian', () => {
    const search = 'sekcja=przepisy&q=Pomara%C5%84czowa&metoda=drip&temp=zimne&mleko=bez&alkohol=bez&kolejnosc=popularne';
    const filters = filtersFromParams(new URLSearchParams(search));
    expect(filters).toEqual({
      query: 'Pomarańczowa',
      sort: 'popular',
      methodId: 'drip',
      temperature: 'cold',
      milk: 'without',
      noAlcohol: true,
    });
    expect(filtersToParams('przepisy', filters).toString()).toBe(search);
  });

  it('nieznane wartości pomija, a domyślna sekcja i kolejność nie trafiają do adresu', () => {
    const filters = filtersFromParams(new URLSearchParams('metoda=ekspres&temp=letnie&mleko=dużo&alkohol=tak'));
    expect(filters).toEqual({ query: '', sort: 'newest' });
    expect(isNarrowed(filters)).toBe(false);
    expect(filtersToParams('napoje', filters).toString()).toBe('');
  });

  it('zawężenie: słowa i filtry tak, sama kolejność albo puste słowa nie', () => {
    const base: CommunityFilters = { query: '', sort: 'popular' };
    expect(isNarrowed(base)).toBe(false);
    expect(isNarrowed({ ...base, query: ' ,. ' })).toBe(false);
    expect(isNarrowed({ ...base, query: 'miód' })).toBe(true);
    expect(isNarrowed({ ...base, methodId: 'drip' })).toBe(true);
    expect(isNarrowed({ ...base, noAlcohol: true })).toBe(true);
  });

  it('słowa wyszukiwania bez polskich znaków, tylko litery i cyfry, bez powtórzeń', () => {
    expect(searchWords('  Kawa POMARAŃCZOWA, łódź!  kawa ')).toEqual(['kawa', 'pomaranczowa', 'lodz']);
    expect(searchWords('café-au-lait 50%')).toEqual(['cafe', 'au', 'lait', '50']);
    expect(searchWords('a b c d e f g h')).toHaveLength(6);
    expect(searchWords('')).toEqual([]);
  });
});
