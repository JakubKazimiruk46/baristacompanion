import { describe, expect, it } from 'vitest';
import { getMethod, methods } from '../../data';
import { invalidTokens, scaleMethod } from '../brewing/dose';
import { insertToken, methodAsRecipe, moveStep, recipeDraft, stepDraft, validateDraft, type RecipeDraft } from './draft';
import { parseRecipe, parseRecipeInput, recipeToMethod, type RecipeInput } from './recipe';
import { decodeRecipe, encodeRecipe, sameRecipe, shareUrl } from './share';

const drip = getMethod('drip')!;
const comandante = { id: 'g1', name: 'Comandante C40 MK4', unit: 'click' as const, settings: {}, createdAt: 1, modelId: 'comandante-c40' };

const validDraft = (patch: Partial<RecipeDraft> = {}): RecipeDraft => ({ ...recipeDraft(methodAsRecipe(drip)), ...patch });

describe('znaczniki ilości', () => {
  it('wykrywa nieznane znaczniki', () => {
    expect(invalidTokens('Wsyp {coffee} g, zalej {water*0.5} ml i {water} ml')).toEqual([]);
    expect(invalidTokens('Wsyp {kawa} g i {water*pół}')).toEqual(['{kawa}', '{water*pół}']);
  });

  it('wstawia znacznik w miejscu kursora, z odstępem po słowie', () => {
    expect(insertToken('Wsyp g kawy', '{coffee}', 5)).toEqual({ text: 'Wsyp {coffee}g kawy', caret: 13 });
    expect(insertToken('Zalej', '{water}')).toEqual({ text: 'Zalej {water}', caret: 13 });
    expect(insertToken('', '{water}')).toEqual({ text: '{water}', caret: 7 });
  });
});

describe('kopia przepisu metody', () => {
  it.each(methods.map((m) => [m.id] as const))('%s: kopia przechodzi walidację bez zmian', (id) => {
    const method = getMethod(id)!;
    const { errors, input } = validateDraft(recipeDraft(methodAsRecipe(method)), method, null);
    expect(errors).toEqual({ step: {} });
    expect(input).toMatchObject({ methodId: id, steps: method.steps, dose: method.dose, grind: method.grind });
  });

  it('przepis jako metoda przelicza znaczniki jak metoda', () => {
    const recipe: RecipeInput = {
      ...methodAsRecipe(drip),
      dose: { coffeeG: 20, waterMl: 300 },
      steps: [{ text: 'Wsyp {coffee} g i zalej {water*0.2} ml', action: true }],
    };
    const scaled = scaleMethod(recipeToMethod(recipe, drip), 450);
    expect(scaled.dose).toEqual({ coffeeG: 30, waterMl: 450 });
    expect(scaled.steps[0]!.text).toBe('Wsyp 30 g i zalej 90 ml');
    expect(scaled.id).toBe('drip');
    expect(scaled.scaling).toBe(drip.scaling);
  });
});

describe('walidacja formularza', () => {
  it('pokazuje błędy po polsku', () => {
    const step = { ...stepDraft(), text: '', minutes: '1', seconds: '75' };
    const { errors, input } = validateDraft(
      validDraft({ name: ' ', coffeeG: 'dużo', waterMl: '5000', tempMin: '96', tempMax: '90', steps: [step] }),
      drip,
      null,
    );
    expect(input).toBeNull();
    expect(errors).toMatchObject({
      name: 'Podaj nazwę przepisu.',
      coffeeG: 'Wpisz ilość kawy w gramach, np. 15.',
      waterMl: 'Ten sprzęt mieści od 150 do 500 ml.',
      temp: 'Temperatura „od” nie może być wyższa niż „do”.',
      step: { [step.key]: { text: 'Wpisz polecenie.', time: 'Sekund może być najwyżej 59.' } },
    });
  });

  it('pilnuje proporcji, znaczników, kroków i czasu', () => {
    const bad = { ...stepDraft(), text: 'Wsyp {kawa} g', minutes: '1500' };
    const result = validateDraft(validDraft({ coffeeG: '100', waterMl: '250', steps: [bad] }), drip, null);
    expect(result.errors.coffeeG).toBe('Proporcja kawy do wody musi być od 1:3 do 1:25.');
    expect(result.errors.step[bad.key]).toEqual({
      text: 'Nieznany znacznik {kawa}. Ilości wstawiaj przyciskami.',
      time: 'Najwyżej 24 godziny.',
    });
    expect(validateDraft(validDraft({ steps: [] }), drip, null).errors.steps).toBe('Dodaj co najmniej jeden krok.');
  });

  it('czas z minut i sekund, puste pola: bez stopera', () => {
    const steps = [
      { ...stepDraft(), text: 'Bloom', minutes: '0', seconds: '45', action: false },
      { ...stepDraft(), text: 'Czekaj', minutes: '2' },
      { ...stepDraft(), text: 'Nalej' },
    ];
    const { input } = validateDraft(validDraft({ steps }), drip, null);
    expect(input!.steps).toEqual([
      { text: 'Bloom', durationSec: 45, action: false },
      { text: 'Czekaj', durationSec: 120, action: true },
      { text: 'Nalej', action: true },
    ]);
  });

  it('zapisuje ustawienie używanego młynka w granicach jego skali', () => {
    const grinder = { grinder: comandante, limits: { min: 0, max: 45 } };
    expect(validateDraft(validDraft({ grinderSetting: '50' }), drip, grinder).errors.grinderSetting).toBe(
      'Wpisz liczbę od 0 do 45.',
    );
    expect(validateDraft(validDraft({ grinderSetting: '22,5' }), drip, grinder).input!.grinder).toEqual({
      grinderId: 'g1',
      grinderName: 'Comandante C40 MK4',
      unit: 'click',
      setting: 22.5,
    });
    expect(validateDraft(validDraft({ grinderSetting: '' }), drip, grinder).input).not.toHaveProperty('grinder');
  });

  it('przesuwanie kroków', () => {
    const [a, b, c] = [stepDraft(), stepDraft(), stepDraft()];
    expect(moveStep([a, b, c], 0, 1)).toEqual([b, a, c]);
    expect(moveStep([a, b, c], 2, -1)).toEqual([a, c, b]);
    expect(moveStep([a, b, c], 0, -1)).toEqual([a, b, c]);
  });
});

describe('zapis i odczyt', () => {
  const saved = { ...methodAsRecipe(drip), id: 'r1', createdAt: 1, updatedAt: 2 };

  it('poprawny przepis przechodzi, uszkodzony jest odrzucany', () => {
    expect(parseRecipe(saved)).toEqual(saved);
    expect(parseRecipe({ ...saved, methodId: 'ekspres' })).toBeNull();
    expect(parseRecipe({ ...saved, steps: [] })).toBeNull();
    expect(parseRecipe({ ...saved, steps: [{ text: 'X', action: 'tak' }] })).toBeNull();
    expect(parseRecipe({ ...saved, dose: { coffeeG: 15, waterMl: 10_000 } })).toBeNull();
    expect(parseRecipe({ ...saved, grinder: { grinderId: 'g', grinderName: 'G', unit: 'click', setting: -1 } })).toBeNull();
    expect(parseRecipe({ ...saved, id: 7 })).toBeNull();
  });

  it('nadmiarowe pola kroków nie przechodzą dalej', () => {
    const input = parseRecipeInput({ ...saved, steps: [{ text: 'Zalej', action: true, html: '<b>x</b>' }] });
    expect(input!.steps).toEqual([{ text: 'Zalej', action: true }]);
  });
});

describe('przepis w linku', () => {
  const recipe: RecipeInput = {
    ...methodAsRecipe(drip),
    name: 'Mój V60 — słodszy, z „cudzysłowem” 😊',
    note: 'Do etiopskich ziaren',
    grinder: { grinderId: 'g1', grinderName: 'Comandante', unit: 'click', setting: 22 },
  };

  it('wraca z linku taki sam, bez ustawienia młynka', () => {
    const { grinder: _, ...withoutGrinder } = recipe;
    expect(decodeRecipe(encodeRecipe(recipe))).toEqual(withoutGrinder);
    expect(sameRecipe(recipe, withoutGrinder)).toBe(true);
  });

  it('pełny link prowadzi do /przepis z danymi po #', () => {
    expect(shareUrl(recipe, 'https://example.com')).toMatch(/^https:\/\/example\.com\/przepis#1\.[\w-]+$/);
  });

  it('uszkodzony, obcięty albo z innej wersji link daje null', () => {
    const code = encodeRecipe(recipe);
    expect(decodeRecipe(code.slice(0, code.length - 20))).toBeNull();
    expect(decodeRecipe(code.replace(/^1\./, '2.'))).toBeNull();
    expect(decodeRecipe('')).toBeNull();
    expect(decodeRecipe('1.@@@')).toBeNull();
    expect(decodeRecipe(`1.${btoa('{"m":"drip"}')}`)).toBeNull();
    expect(decodeRecipe(`1.${btoa('null')}`)).toBeNull();
  });

  it('przepis z linku przechodzi tę samą walidację co zapis', () => {
    const tampered = encodeRecipe({ ...recipe, steps: [{ text: 'Wsyp {kawa}', action: true }] });
    expect(decodeRecipe(tampered)).toBeNull();
  });
});
