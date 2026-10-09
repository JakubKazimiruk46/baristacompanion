import { describe, expect, it } from 'vitest';
import { formatAmount } from './amounts';

describe('formatAmount', () => {
  it('liczba z jednostką, pomnożona przez porcje', () => {
    expect(formatAmount({ value: 150, unit: 'ml' })).toBe('150 ml');
    expect(formatAmount({ value: 150, unit: 'ml' }, 2)).toBe('300 ml');
    expect(formatAmount({ value: 60, unit: 'g' }, 3)).toBe('180 g');
  });

  it('odmiana jednostek', () => {
    expect(formatAmount({ value: 1, unit: 'tsp' })).toBe('1 łyżeczka');
    expect(formatAmount({ value: 1, unit: 'tsp' }, 2)).toBe('2 łyżeczki');
    expect(formatAmount({ value: 1, unit: 'tsp' }, 5)).toBe('5 łyżeczek');
    expect(formatAmount({ value: 2, unit: 'scoop' }, 3)).toBe('6 gałek');
    expect(formatAmount({ value: 2, unit: 'scoop' }, 11)).toBe('22 gałki');
  });

  it('zakres odmienia się według górnej liczby', () => {
    expect(formatAmount({ value: 3, max: 4, unit: 'cube' })).toBe('3–4 kostki');
    expect(formatAmount({ value: 4, max: 5, unit: 'cube' })).toBe('4–5 kostek');
    expect(formatAmount({ value: 4, max: 5, unit: 'cube' }, 2)).toBe('8–10 kostek');
    expect(formatAmount({ value: 1, max: 2, unit: 'scoop' })).toBe('1–2 gałki');
  });

  it('ułamki z przecinkiem i w dopełniaczu', () => {
    expect(formatAmount({ value: 0.5, unit: 'tsp' })).toBe('0,5 łyżeczki');
    expect(formatAmount({ value: 0.5, unit: 'tsp' }, 3)).toBe('1,5 łyżeczki');
  });

  it('sztuki (banan, żółtko)', () => {
    expect(formatAmount({ value: 1, unit: 'piece' })).toBe('1 sztuka');
    expect(formatAmount({ value: 1, unit: 'piece' }, 3)).toBe('3 sztuki');
    expect(formatAmount({ value: 1, unit: 'piece' }, 5)).toBe('5 sztuk');
  });

  it('opis słowny się nie mnoży', () => {
    expect(formatAmount('pełna szklanka', 3)).toBe('pełna szklanka');
  });
});
