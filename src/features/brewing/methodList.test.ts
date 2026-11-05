import { describe, expect, it } from 'vitest';
import { methods } from '../../data';
import { lastBrewed, methodsInView, methodViewFrom } from './methodList';

const ids = (list: { id: string }[]) => list.map((m) => m.id);
const alphabetical = (names: string[]) => [...names].sort((a, b) => a.localeCompare(b, 'pl'));

describe('lista metod', () => {
  it('alfabetycznie po polsku', () => {
    const names = methodsInView(methods, 'az', { favorites: [], lastBrewed: new Map() }).map((m) => m.name);
    expect(names).toEqual(alphabetical(names));
    expect(names).toHaveLength(methods.length);
  });

  it('ostatnio parzone najpierw, potem reszta alfabetycznie', () => {
    const last = lastBrewed([
      { methodId: 'drip', brewedAt: 100 },
      { methodId: 'kawiarka', brewedAt: 300 },
      { methodId: 'drip', brewedAt: 200 },
    ]);
    expect(last.get('drip')).toBe(200);
    const list = methodsInView(methods, 'ostatnie', { favorites: [], lastBrewed: last });
    expect(ids(list).slice(0, 2)).toEqual(['kawiarka', 'drip']);
    const rest = list.slice(2).map((m) => m.name);
    expect(rest).toEqual(alphabetical(rest));
  });

  it('ulubione: tylko one, alfabetycznie', () => {
    const list = methodsInView(methods, 'ulubione', { favorites: ['syfon', 'aeropress'], lastBrewed: new Map() });
    expect(ids(list)).toEqual(['aeropress', 'syfon']);
  });

  it('widok z adresu, domyślnie alfabetycznie', () => {
    expect(methodViewFrom(new URLSearchParams('widok=ostatnie'))).toBe('ostatnie');
    expect(methodViewFrom(new URLSearchParams('widok=cokolwiek'))).toBe('az');
    expect(methodViewFrom(new URLSearchParams())).toBe('az');
  });
});
