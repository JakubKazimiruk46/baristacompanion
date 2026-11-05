import { describe, expect, it } from 'vitest';
import { count, foldText, formatMinutes, formatSeconds, matchesQuery, plural } from './format';

const FORMS: [string, string, string] = ['napój', 'napoje', 'napojów'];

describe('plural', () => {
  it.each([
    [0, 'napojów'],
    [1, 'napój'],
    [2, 'napoje'],
    [4, 'napoje'],
    [5, 'napojów'],
    [11, 'napojów'],
    [12, 'napojów'],
    [14, 'napojów'],
    [21, 'napojów'],
    [22, 'napoje'],
    [112, 'napojów'],
    [124, 'napoje'],
  ])('%i → %s', (n, form) => {
    expect(plural(n, FORMS)).toBe(form);
  });

  it('count skleja liczbę z formą', () => {
    expect(count(3, FORMS)).toBe('3 napoje');
  });
});

describe('formatowanie czasu', () => {
  it.each([
    [8, '8 min'],
    [60, '1 h'],
    [75, '1 h 15 min'],
    [965, '16 h'],
  ])('%i min → %s', (min, text) => {
    expect(formatMinutes(min)).toBe(text);
  });

  it.each([
    [30, '30 s'],
    [240, '4 min'],
    [16 * 3600, '16 h'],
  ])('%i s → %s', (sec, text) => {
    expect(formatSeconds(sec)).toBe(text);
  });
});

describe('wyszukiwanie', () => {
  it('bez wielkości liter i polskich znaków', () => {
    expect(foldText('Kawa POMARAŃCZOWA z łyżką')).toBe('kawa pomaranczowa z lyzka');
  });

  it('każde słowo musi gdzieś wystąpić', () => {
    expect(matchesQuery('pomarancz kawa', ['Kawa pomarańczowa'])).toBe(true);
    expect(matchesQuery('mrożona', ['Kawa mrożona z lodami', 'deser'])).toBe(true);
    expect(matchesQuery('kawa lody', ['Kawa pomarańczowa'])).toBe(false);
    expect(matchesQuery('  ', ['cokolwiek'])).toBe(true);
  });
});
