import { beforeEach, describe, expect, it } from 'vitest';
import { SHOPPING_KEY, shoppingStore } from './shopping';
import { DEFAULT_SHELF, SHELF_KEY, shelfStore } from './store';

beforeEach(() => {
  localStorage.clear();
  shelfStore.reset();
  shoppingStore.reset();
});

describe('półka', () => {
  it('na start nie jest zapisana; pierwsza zmiana zaczyna od lodu i cukru', () => {
    expect(shelfStore.getSnapshot()).toBeNull();
    expect(DEFAULT_SHELF.ingredients).toEqual(['cukier', 'lod']);

    shelfStore.toggleIngredient('tonik');
    expect(shelfStore.getSnapshot()).toEqual({ ingredients: ['cukier', 'lod', 'tonik'], methods: [] });
    shelfStore.toggleIngredient('lod');
    shelfStore.toggleMethod('kawiarka');
    shelfStore.reset();
    expect(shelfStore.getSnapshot()).toEqual({ ingredients: ['cukier', 'tonik'], methods: ['kawiarka'] });
  });

  it('pomija nieznane składniki i metody', () => {
    localStorage.setItem(SHELF_KEY, JSON.stringify({ ingredients: ['tonik', 'whisky', 3], methods: ['ekspres'] }));
    expect(shelfStore.getSnapshot()).toEqual({ ingredients: ['tonik'], methods: [] });
  });
});

describe('lista zakupów', () => {
  it('składnik potrzebny do dwóch napojów jest na liście raz', () => {
    shoppingStore.addForDrink('espresso-tonic', ['tonik']);
    shoppingStore.addForDrink('kawa-malinowa', ['maliny', 'krowie']);
    shoppingStore.addForDrink('latte-macchiato', ['krowie']);
    expect(shoppingStore.getSnapshot()).toEqual([
      { id: 'tonik', drinkIds: ['espresso-tonic'], bought: false },
      { id: 'maliny', drinkIds: ['kawa-malinowa'], bought: false },
      { id: 'krowie', drinkIds: ['kawa-malinowa', 'latte-macchiato'], bought: false },
    ]);
  });

  it('kupione trafia na półkę, odznaczone z niej znika', () => {
    shoppingStore.addForDrink('espresso-tonic', ['tonik']);
    shoppingStore.toggleBought('tonik');
    expect(shelfStore.getSnapshot()!.ingredients).toContain('tonik');
    shoppingStore.toggleBought('tonik');
    expect(shelfStore.getSnapshot()!.ingredients).not.toContain('tonik');
  });

  it('„Usuń kupione” zostawia resztę', () => {
    shoppingStore.addForDrink('kawa-malinowa', ['maliny', 'krowie']);
    shoppingStore.toggleBought('maliny');
    shoppingStore.clearBought();
    expect(shoppingStore.getSnapshot().map((i) => i.id)).toEqual(['krowie']);
  });

  it('uszkodzony zapis: zostają poprawne pozycje', () => {
    localStorage.setItem(
      SHOPPING_KEY,
      JSON.stringify([
        { id: 'tonik', drinkIds: ['espresso-tonic', 'nie-ma'], bought: false },
        { id: 'whisky', drinkIds: [], bought: false },
        { id: 'maliny' },
      ]),
    );
    expect(shoppingStore.getSnapshot()).toEqual([{ id: 'tonik', drinkIds: ['espresso-tonic'], bought: false }]);
  });
});
