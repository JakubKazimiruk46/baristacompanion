import { describe, expect, it } from 'vitest';
import { drinks, getDrink } from '../../data';
import { canMake, checkDrink, shoppingIds } from './availability';
import { DEFAULT_SHELF, type Shelf } from './store';

const drink = (id: string) => getDrink(id)!;
const shelf = (ingredients: string[], methods: string[] = []): Shelf => ({ ingredients, methods });

describe('czy da się zrobić napój', () => {
  it('brakuje toniku: nie da się, a tonik trafia na listę zakupów', () => {
    const result = checkDrink(drink('espresso-tonic'), shelf(['lod']));
    expect(result.status).toBe('missing');
    expect(result.missing).toEqual([{ kind: 'ingredient', id: 'tonik' }]);
    expect(shoppingIds(result)).toEqual(['tonik']);
  });

  it('zamiennik w domu wystarcza', () => {
    const result = checkDrink(drink('espresso-tonic'), shelf(['lod', 'woda-gazowana']));
    expect(result.status).toBe('substitute');
    expect(result.substitutions).toEqual([
      expect.objectContaining({ ingredientId: 'tonik', substituteId: 'woda-gazowana' }),
    ]);
  });

  it('wszystko jest: gotowe, bez zamienników', () => {
    expect(checkDrink(drink('espresso-tonic'), shelf(['lod', 'tonik', 'woda-gazowana']))).toEqual({
      status: 'ready',
      missing: [],
      substitutions: [],
    });
  });

  it('mleko: wystarczy którekolwiek z polecanych, na listę idzie pierwsze', () => {
    const latte = drink('latte-macchiato');
    const missing = checkDrink(latte, shelf([]));
    expect(missing.missing).toEqual([{ kind: 'milk', options: latte.milk!.options }]);
    expect(shoppingIds(missing)).toEqual(['krowie']);
    expect(checkDrink(latte, shelf(['sojowe'])).status).toBe('ready');
  });

  it('dodatki opcjonalne się nie liczą', () => {
    // Kawa malinowa: syrop malinowy jest opcjonalny.
    expect(checkDrink(drink('kawa-malinowa'), shelf(['maliny', 'krowie', 'lod'])).status).toBe('ready');
  });

  it('woda jest zawsze', () => {
    expect(canMake(drink('americano'), shelf([]))).toBe(true);
  });

  it('ten sam składnik w dwóch dodatkach liczy się raz', () => {
    expect(checkDrink(drink('kawa-mrozona-z-dripa'), shelf([])).missing).toEqual([
      { kind: 'ingredient', id: 'lod' },
    ]);
  });

  it('syrop to też składnik, a jego zamiennik wystarcza', () => {
    const vanilla = drink('latte-waniliowe');
    expect(checkDrink(vanilla, shelf(['krowie'])).missing).toEqual([{ kind: 'ingredient', id: 'waniliowy' }]);
    expect(checkDrink(vanilla, shelf(['krowie', 'cukier'])).status).toBe('substitute');
  });

  it('sprzęt: sprawdzany tylko, gdy coś zaznaczono; wystarczy metoda alternatywna', () => {
    const tonic = drink('espresso-tonic');
    const ingredients = ['lod', 'tonik'];
    expect(checkDrink(tonic, shelf(ingredients, ['prasa-francuska'])).missing).toEqual([
      { kind: 'method', options: ['kawiarka', 'aeropress'] },
    ]);
    expect(canMake(tonic, shelf(ingredients, ['aeropress']))).toBe(true);
    // Sprzętu nie kupuje się w spożywczym.
    expect(shoppingIds(checkDrink(tonic, shelf(ingredients, ['prasa-francuska'])))).toEqual([]);
  });

  it('domyślna półka (lód i cukier) wystarcza do kilku napojów, ale nie do wszystkich', () => {
    const ready = drinks.filter((d) => canMake(d, DEFAULT_SHELF)).map((d) => d.id);
    expect(ready).toEqual(expect.arrayContaining(['americano', 'kawa-po-turecku']));
    expect(ready).not.toContain('latte-macchiato');
  });
});
