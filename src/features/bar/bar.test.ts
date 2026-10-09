import { describe, expect, it } from 'vitest';
import { drinks } from '../../data';
import type { SavedBean } from '../beans/store';
import {
  barPathFor,
  barSectionFrom,
  beanFiltersFrom,
  beanFiltersToParams,
  drinksUsing,
  filterBeans,
  groupByRoast,
} from './bar';

const bean = (id: string, name: string, profile: Partial<SavedBean['profile']>, roaster?: string): SavedBean => ({
  id,
  name,
  ...(roaster && { roaster }),
  profile: { roast: 'medium', notes: [], kind: 'blend', ...profile },
  createdAt: 1,
});

const beans = [
  bean('a', 'Kenia Kiambu', { roast: 'light', kind: 'single-origin', notes: ['fruity'], origin: 'Kenia' }, 'Palarnia Słoneczna'),
  bean('b', 'Espresso Classico', { roast: 'dark', notes: ['chocolate'] }, 'Kawowy Dom'),
  bean('c', 'Brazylia Santos', { roast: 'medium', notes: ['nutty'], origin: 'Brazylia' }),
  bean('d', 'Etiopia Guji', { roast: 'light', kind: 'single-origin', notes: ['floral'] }),
];

describe('Baribar: ziarna', () => {
  it('szuka po nazwie, palarni, pochodzeniu i nutach bez polskich znaków', () => {
    expect(filterBeans(beans, { query: 'sloneczna' }).map((b) => b.id)).toEqual(['a']);
    expect(filterBeans(beans, { query: 'czekoladowe' }).map((b) => b.id)).toEqual(['b']);
    expect(filterBeans(beans, { query: 'brazylia' }).map((b) => b.id)).toEqual(['c']);
  });

  it('palenie i rodzaj zawężają', () => {
    expect(filterBeans(beans, { roast: 'light' }).map((b) => b.id)).toEqual(['a', 'd']);
    expect(filterBeans(beans, { kind: 'blend' }).map((b) => b.id)).toEqual(['b', 'c']);
  });

  it('grupy według palenia od jasnego, bez pustych', () => {
    expect(groupByRoast(beans).map((g) => [g.roast, g.beans.map((b) => b.id)])).toEqual([
      ['light', ['a', 'd']],
      ['medium', ['c']],
      ['dark', ['b']],
    ]);
    expect(groupByRoast([beans[1]!]).map((g) => g.roast)).toEqual(['dark']);
  });

  it('filtry w adresie w obie strony', () => {
    const params = beanFiltersToParams({ query: 'kenia', roast: 'light', kind: 'single-origin' });
    expect(params.toString()).toBe('q=kenia&palenie=jasne&rodzaj=single');
    expect(beanFiltersFrom(params)).toEqual({ query: 'kenia', roast: 'light', kind: 'single-origin' });
    expect(beanFiltersFrom(new URLSearchParams('palenie=zielone'))).toEqual({});
  });
});

describe('Baribar: sekcje i półka', () => {
  it('sekcja z adresu, domyślnie ziarna', () => {
    expect(barSectionFrom(new URLSearchParams('sekcja=syropy'))).toBe('syropy');
    expect(barSectionFrom(new URLSearchParams('sekcja=bar'))).toBe('ziarna');
  });

  it('składnik prowadzi do swojej sekcji', () => {
    expect(barPathFor('waniliowy')).toBe('/baribar?sekcja=syropy');
    expect(barPathFor('tonik')).toBe('/baribar?sekcja=dodatki');
    expect(barPathFor('krowie')).toBe('/baribar?sekcja=mleka');
    expect(barPathFor()).toBe('/baribar?sekcja=mleka');
  });

  it('liczy napoje z danym składnikiem', () => {
    expect(drinksUsing('tonik', drinks)).toBeGreaterThan(0);
    expect(drinksUsing('krowie', drinks)).toBeGreaterThan(drinksUsing('tonik', drinks));
    expect(drinksUsing('nie-ma', drinks)).toBe(0);
  });
});
