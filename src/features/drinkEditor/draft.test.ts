import { describe, expect, it } from 'vitest';
import { drinks, getDrink, methods } from '../../data';
import { validateDrink } from '../../data/validate';
import {
  draftErrors,
  draftToDrink,
  drinkToDraft,
  emptyDraft,
  extraKindFor,
  hasErrors,
  move,
  newExtra,
  parseAmount,
  previewDrink,
  suggestLayers,
  toggleAlternative,
  type DrinkDraft,
} from './draft';

const valid = (draft: DrinkDraft) => validateDrink(draftToDrink(draft, 'moj-test-abcd'));

describe('kreator napoju: napój ↔ formularz', () => {
  it.each(drinks.map((d) => [d.name, d] as const))('%s wraca z formularza bez zmian', (_, drink) => {
    const draft = drinkToDraft(drink);
    expect(hasErrors(draftErrors(draft))).toBe(false);
    const { needsReview: _review, reviewNote: _note, ...plain } = drink;
    expect(draftToDrink(draft, drink.id)).toEqual(plain);
  });

  it('pusty formularz wymaga nazwy, hasła i kroku', () => {
    const errors = draftErrors(emptyDraft());
    expect(errors.name).toBe('Nazwij napój.');
    expect(errors.tagline).toBe('Opisz napój w kilku słowach.');
    expect(errors.steps).toBe('Dodaj co najmniej jeden krok.');
  });

  it('uzupełniony formularz daje napój, który przechodzi reguły katalogu', () => {
    const draft: DrinkDraft = {
      ...emptyDraft(),
      name: 'Kawa z syropem',
      tagline: 'Słodko i szybko',
      steps: [{ key: 1, text: 'Zaparz kawę i wlej syrop.' }],
      extras: [newExtra('waniliowy'), newExtra('lod')],
    };
    expect(hasErrors(draftErrors(draft))).toBe(false);
    expect(valid(draft)).toEqual([]);
    const drink = draftToDrink(draft, 'moj-x');
    // Opis i „dlaczego to naczynie” mają rozsądne zastępstwa, gdy są puste.
    expect(drink.description).toBe('Słodko i szybko');
    expect(drink.serving.why).toBe('Filiżanka pasuje do tego napoju.');
    expect(drink.extras).toEqual([
      { kind: 'syrup', syrupId: 'waniliowy', amountMl: 15 },
      { kind: 'ice', ingredientId: 'lod', name: 'lód', amount: { value: 4, unit: 'cube' } },
    ]);
  });

  it('warstwy muszą się zmieścić w naczyniu i mieć różne nazwy', () => {
    const draft: DrinkDraft = {
      ...emptyDraft(),
      vessel: 'espresso-cup',
      layers: [
        { key: 1, name: 'kawa', kind: 'liquid', color: '#2b1a10', ml: '60' },
        { key: 2, name: 'kawa', kind: 'liquid', color: '#2b1a10', ml: '40' },
      ],
    };
    const errors = draftErrors(draft);
    expect(errors.layers).toMatch(/nie mieszczą się w naczyniu \(90 ml\)/);
    expect(errors.item[2]).toBe('Dwie warstwy mają tę samą nazwę.');
  });

  it('dodatek: nazwa, ilość albo zakres, albo opis ilości', () => {
    expect(parseAmount('4–5')).toEqual({ value: 4, max: 5 });
    expect(parseAmount('2,5')).toEqual({ value: 2.5 });
    expect(parseAmount('5-4')).toBeNull();
    const extra = { ...newExtra('tonik'), amount: '' };
    expect(draftErrors({ ...emptyDraft(), extras: [extra] }).item[extra.key]).toMatch(/Podaj ilość/);
    const text = { ...newExtra('tonik'), unit: 'text' as const, amount: 'do pełna' };
    expect(draftErrors({ ...emptyDraft(), extras: [text] }).item[text.key]).toBeUndefined();
  });

  it('rodzaj dodatku z grupy składnika', () => {
    expect(extraKindFor('lod')).toBe('ice');
    expect(extraKindFor('lody-waniliowe')).toBe('ice-cream');
    expect(extraKindFor('smietanka-30')).toBe('cream');
    expect(extraKindFor('whiskey')).toBe('alcohol');
    expect(extraKindFor('miod')).toBe('other');
    expect(newExtra('smietanka-30').dairy).toBe(true);
  });
});

describe('kreator napoju: podgląd i podpowiedzi', () => {
  it('podgląd rysuje się z niedokończonego formularza', () => {
    const draft: DrinkDraft = {
      ...emptyDraft(),
      layers: [
        { key: 1, name: '', kind: 'liquid', color: 'zly', ml: 'abc' },
        { key: 2, name: '', kind: 'foam', color: '#ffffff', ml: '20' },
      ],
      decorations: [
        { key: 3, kind: 'topping', look: 'dust', name: '', color: '#5a3220', instruction: '', optional: false },
        { key: 4, kind: 'topping', look: 'dust', name: '', color: '#5a3220', instruction: '', optional: false },
      ],
    };
    const preview = previewDrink(draft);
    expect(preview.name).toBe('Twój napój');
    expect(preview.layers).toEqual([{ name: 'warstwa 2', kind: 'foam', color: '#ffffff', volumeMl: 20 }]);
    expect(preview.serving.decorations.map((d) => d.name)).toEqual(['dekoracja 1', 'dekoracja 2']);
  });

  it('podpowiedź warstw ze składników: od syropu na dole po piankę na górze', () => {
    const draft: DrinkDraft = {
      ...emptyDraft(),
      milkOn: true,
      milkOptions: ['krowie'],
      milkMl: '200',
      milkPrep: 'froth',
      extras: [newExtra('karmelowy')],
    };
    const layers = suggestLayers(draft);
    expect(layers.map((l) => [l.name, l.kind, l.ml])).toEqual([
      ['syrop karmelowy', 'liquid', '15'],
      ['mleko', 'liquid', '120'],
      ['kawa z kawiarki', 'liquid', '50'],
      ['pianka', 'foam', '80'],
    ]);
  });

  it('przesuwanie elementów listy', () => {
    const list = [{ key: 1 }, { key: 2 }, { key: 3 }];
    expect(move(list, 2, -1).map((i) => i.key)).toEqual([2, 1, 3]);
    expect(move(list, 3, 1)).toBe(list);
  });

  it('metody alternatywne i „wszystkie metody” wracają z formularza', () => {
    const tonic = getDrink('espresso-tonic')!;
    const draft = { ...drinkToDraft(tonic), alternativeMethodIds: ['aeropress', 'chemex', tonic.base.methodId] };
    expect(draftToDrink(draft, 'moj-test-abcd').base.alternativeMethodIds).toEqual(['aeropress', 'chemex']);

    const any = draftToDrink({ ...draft, anyMethod: true }, 'moj-test-abcd');
    expect(any.base).toMatchObject({ methodId: tonic.base.methodId, anyMethod: true });
    expect(any.base.alternativeMethodIds).toBeUndefined();
    expect(validateDrink(any)).toEqual([]);
    expect(drinkToDraft(any)).toMatchObject({ anyMethod: true, alternativeMethodIds: [] });
    expect(emptyDraft().anyMethod).toBe(false);
  });

  it('zaznaczanie metod alternatywnych: odznaczenie przy „wszystkich” zostawia resztę, wszystkie po kolei to „wszystkie”', () => {
    const draft = { ...emptyDraft(), methodId: 'kawiarka' };
    expect(toggleAlternative(draft, 'chemex')).toEqual({ anyMethod: false, alternativeMethodIds: ['chemex'] });
    expect(toggleAlternative({ ...draft, alternativeMethodIds: ['chemex'] }, 'chemex').alternativeMethodIds).toEqual([]);
    expect(toggleAlternative({ ...draft, alternativeMethodIds: ['chemex'] }, 'aeropress').alternativeMethodIds).toEqual(
      ['aeropress', 'chemex'].sort((a, b) => methods.findIndex((m) => m.id === a) - methods.findIndex((m) => m.id === b)),
    );

    const withoutChemex = toggleAlternative({ ...draft, anyMethod: true }, 'chemex');
    expect(withoutChemex.anyMethod).toBe(false);
    expect(withoutChemex.alternativeMethodIds).toHaveLength(methods.length - 2);
    expect(withoutChemex.alternativeMethodIds).not.toContain('chemex');
    expect(toggleAlternative({ ...draft, ...withoutChemex }, 'chemex')).toEqual({ anyMethod: true, alternativeMethodIds: [] });
  });

  it('własna wersja napoju z katalogu zaczyna od jego danych', () => {
    const draft = drinkToDraft(getDrink('espresso-tonic')!);
    expect(draft.vessel).toBe('tall-glass');
    expect(draft.layers.length).toBeGreaterThan(0);
  });
});
