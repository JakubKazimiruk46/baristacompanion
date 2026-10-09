import { describe, expect, it } from 'vitest';
import { beanMethods as methods, type BeanProfile, type FlavorNote, type Roast } from '../../data';
import { rankMethods, scoreMethod } from './matching';

const profile = (roast: Roast, notes: FlavorNote[] = [], kind: BeanProfile['kind'] = 'blend'): BeanProfile => ({
  roast,
  notes,
  kind,
});

const ids = (p: BeanProfile) => rankMethods(p).map((m) => m.method.id);
const top = (p: BeanProfile, n: number) => ids(p).slice(0, n);
const last = (p: BeanProfile, n: number) => ids(p).slice(-n);
const reasonsFor = (p: BeanProfile, methodId: string) =>
  rankMethods(p).find((m) => m.method.id === methodId)!.reasons.join(' ');
/** Metody, które nie pasują do palenia: powinny zamykać ranking. */
const notFor = (roast: Roast) =>
  methods.filter((m) => !m.suits.roasts.includes(roast)).map((m) => m.id).sort();

describe('jasne palenie', () => {
  it.each<[string, FlavorNote[]]>([
    ['owocowe i kwiatowe', ['fruity', 'floral']],
    ['cytrusowe', ['citrus']],
    ['bez nut', []],
  ])('%s: wygrywa przelew, kawiarka na końcu', (_, notes) => {
    const p = profile('light', notes, 'single-origin');
    expect(top(p, 3)).toEqual(expect.arrayContaining(['drip', 'chemex']));
    expect(notFor('light')).toContain('kawiarka');
    expect(last(p, notFor('light').length).sort()).toEqual(notFor('light'));
  });

  it('w kawiarce ostrzega przed kwaśnym smakiem', () => {
    expect(reasonsFor(profile('light', ['fruity']), 'kawiarka')).toContain(
      'Jasne palenie jest kwaśniejsze: w kawiarce może wyjść kwaśno i ostro.',
    );
  });

  it('w dripie wyjaśnia, że kwasowość staje się owocowością', () => {
    expect(reasonsFor(profile('light', ['fruity']), 'drip')).toContain(
      'w dripie ta kwasowość zamienia się w owocowość',
    );
  });

  it('jasne, ale czekoladowe: wygrywa uniwersalny AeroPress', () => {
    expect(top(profile('light', ['chocolate']), 1)).toEqual(['aeropress']);
  });
});

describe('średnie palenie', () => {
  it.each<[string, FlavorNote[]]>([
    ['karmelowe', ['caramel']],
    ['czekoladowe i orzechowe', ['chocolate', 'nutty']],
  ])('%s: na górze kawiarka, prasa lub AeroPress', (_, notes) => {
    const p = profile('medium', notes);
    expect(['kawiarka', 'prasa-francuska', 'aeropress']).toContain(top(p, 1)[0]);
  });

  it('owocowe: na górze przelew', () => {
    expect(top(profile('medium', ['fruity'], 'single-origin'), 2)).toEqual(
      expect.arrayContaining(['drip']),
    );
  });

  it('pasuje do każdej metody, więc żadna nie jest odradzana przez palenie', () => {
    for (const match of rankMethods(profile('medium'))) {
      expect(match.reasons[0]).toMatch(/^Średnie palenie to bezpieczny środek/);
    }
  });
});

describe('ciemne palenie', () => {
  it.each<[string, FlavorNote[]]>([
    ['czekoladowe', ['chocolate']],
    ['orzechowe i karmelowe', ['nutty', 'caramel']],
    ['bez nut', []],
  ])('%s: kawiarka i prasa wysoko, przelew na końcu', (_, notes) => {
    const p = profile('dark', notes);
    expect(top(p, 4)).toEqual(expect.arrayContaining(['kawiarka', 'prasa-francuska']));
    expect(notFor('dark')).toEqual(expect.arrayContaining(['drip', 'chemex']));
    expect(last(p, notFor('dark').length).sort()).toEqual(notFor('dark'));
  });

  it('w dripie ostrzega przed goryczą', () => {
    expect(reasonsFor(profile('dark'), 'drip')).toContain('Ciemne palenie w dripie bywa płaskie i gorzkie.');
  });

  it('ciemne, ale owocowe: wygrywa AeroPress', () => {
    expect(top(profile('dark', ['fruity']), 1)).toEqual(['aeropress']);
  });
});

describe('reguły ogólne', () => {
  it('ranking zawiera każdą metodę raz i jest posortowany malejąco', () => {
    const ranking = rankMethods(profile('medium', ['fruity', 'chocolate']));
    expect(ranking.map((m) => m.method.id).sort()).toEqual(methods.map((m) => m.id).sort());
    for (let i = 1; i < ranking.length; i++) {
      expect(ranking[i - 1]!.score).toBeGreaterThanOrEqual(ranking[i]!.score);
    }
  });

  it('każda metoda ma uzasadnienie, a werdykt wynika z punktów', () => {
    for (const match of rankMethods(profile('light', ['floral']))) {
      expect(match.reasons.length).toBeGreaterThan(0);
      const expected = match.score >= 4 ? 'great' : match.score >= 2 ? 'good' : 'poor';
      expect(match.verdict).toBe(expected);
    }
  });

  it('nuty w uzasadnieniu są wymienione po polsku', () => {
    const drip = methods.find((m) => m.id === 'drip')!;
    expect(scoreMethod(profile('light', ['fruity', 'floral', 'citrus']), drip).reasons).toContain(
      'Owocowe, kwiatowe i cytrusowe nuty w dripie dobrze wybrzmią.',
    );
  });

  it('single origin dostaje plus w czystym naparze, mieszanka w mocnym', () => {
    const drip = methods.find((m) => m.id === 'drip')!;
    const moka = methods.find((m) => m.id === 'kawiarka')!;
    const so = profile('medium', [], 'single-origin');
    const blend = profile('medium', [], 'blend');
    expect(scoreMethod(so, drip).score).toBeGreaterThan(scoreMethod(blend, drip).score);
    expect(scoreMethod(blend, moka).score).toBeGreaterThan(scoreMethod(so, moka).score);
  });

  it('niedopasowane nuty obniżają wynik', () => {
    const moka = methods.find((m) => m.id === 'kawiarka')!;
    expect(scoreMethod(profile('medium', ['floral']), moka).score).toBeLessThan(
      scoreMethod(profile('medium', []), moka).score,
    );
  });
});
