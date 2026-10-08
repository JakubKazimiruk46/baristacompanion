import { beforeEach, describe, expect, it } from 'vitest';
import { activeGrinder, GRINDERS_KEY, grindersStore, grindRecordFor } from './store';

beforeEach(() => {
  localStorage.clear();
  grindersStore.reset();
});

const comandante = { modelId: 'comandante-c40', name: 'Comandante C40 MK4', unit: 'click' } as const;

describe('zapis młynków', () => {
  it('młynek i ustawienia wracają po „odświeżeniu”', () => {
    const grinder = grindersStore.add(comandante);
    grindersStore.setSetting(grinder.id, 'drip', 22);
    grindersStore.reset();

    const state = grindersStore.getSnapshot();
    expect(state.activeId).toBe(grinder.id);
    expect(state.grinders[0]).toMatchObject({ name: 'Comandante C40 MK4', settings: { drip: 22 } });
    expect(JSON.parse(localStorage.getItem(GRINDERS_KEY)!).grinders).toHaveLength(1);
  });

  it('nowy młynek staje się używanym, a po usunięciu używany jest pierwszy z pozostałych', () => {
    const first = grindersStore.add(comandante);
    const second = grindersStore.add({ name: 'Młynek w pracy', unit: 'mark' });
    expect(grindersStore.getSnapshot().activeId).toBe(second.id);

    grindersStore.setActive(first.id);
    expect(activeGrinder(grindersStore.getSnapshot())?.id).toBe(first.id);

    grindersStore.remove(first.id);
    expect(grindersStore.getSnapshot().activeId).toBe(second.id);
    grindersStore.remove(second.id);
    expect(grindersStore.getSnapshot()).toEqual({ grinders: [], activeId: null });
  });

  it('ustawienie da się zmienić i usunąć', () => {
    const grinder = grindersStore.add(comandante);
    grindersStore.setSetting(grinder.id, 'kawiarka', 15);
    grindersStore.setSetting(grinder.id, 'kawiarka', 14);
    grindersStore.setSetting(grinder.id, 'drip', 20);
    grindersStore.setSetting(grinder.id, 'kawiarka', null);
    expect(grindersStore.getSnapshot().grinders[0]!.settings).toEqual({ drip: 20 });
  });

  it('ustawienie do dziennika pochodzi z używanego młynka', () => {
    expect(grindRecordFor(grindersStore.getSnapshot(), 'drip')).toBeUndefined();
    const grinder = grindersStore.add(comandante);
    expect(grindRecordFor(grindersStore.getSnapshot(), 'drip')).toBeUndefined();
    grindersStore.setSetting(grinder.id, 'drip', 22);
    expect(grindRecordFor(grindersStore.getSnapshot(), 'drip')).toEqual({
      grinderId: grinder.id,
      grinderName: 'Comandante C40 MK4',
      unit: 'click',
      setting: 22,
    });
  });

  it('„Zaparz tak samo” przywraca ustawienie i młynek, jeśli jeszcze istnieje', () => {
    const grinder = grindersStore.add(comandante);
    grindersStore.add({ name: 'Drugi', unit: 'click' });
    const record = { grinderId: grinder.id, grinderName: grinder.name, unit: 'click', setting: 21 } as const;

    expect(grindersStore.restore(record, 'drip')).toBe(true);
    expect(activeGrinder(grindersStore.getSnapshot())?.settings).toEqual({ drip: 21 });

    grindersStore.remove(grinder.id);
    expect(grindersStore.restore(record, 'drip')).toBe(false);
  });

  it('uszkodzone dane: złe młynki i ustawienia odpadają, reszta zostaje', () => {
    localStorage.setItem(
      GRINDERS_KEY,
      JSON.stringify({
        activeId: 'nie-ma',
        grinders: [
          { id: 'a', name: 'Dobry', unit: 'click', createdAt: 1, settings: { drip: 20, 'ekspres-kolbowy': 5, kawiarka: -1, chemex: '30' } },
          { id: 'b', name: '', unit: 'click', createdAt: 1, settings: {} },
          { id: 'c', name: 'Zła jednostka', unit: 'cale', createdAt: 1, settings: {} },
          { id: 'd', name: 'Stary model', modelId: 'nie-ma-takiego', unit: 'mark', createdAt: 2 },
        ],
      }),
    );
    grindersStore.reset();
    const state = grindersStore.getSnapshot();
    expect(state.grinders.map((g) => g.id)).toEqual(['a', 'd']);
    expect(state.grinders[0]!.settings).toEqual({ drip: 20 });
    expect(state.grinders[1]).not.toHaveProperty('modelId');
    expect(state.activeId).toBe('a');

    localStorage.setItem(GRINDERS_KEY, '{nie-json');
    grindersStore.reset();
    expect(grindersStore.getSnapshot()).toEqual({ grinders: [], activeId: null });
  });
});
