import { beforeEach, describe, expect, it } from 'vitest';
import { JOURNAL_KEY, journalStore, MAX_ENTRIES, type JournalInput } from './store';

const input: JournalInput = { methodId: 'drip', coffeeG: 15, waterMl: 250 };

beforeEach(() => {
  localStorage.clear();
  journalStore.reset();
});

describe('dziennik parzeń', () => {
  it('nowy wpis ma id i czas, jest na górze i przetrwa odświeżenie', () => {
    const first = journalStore.add(input, 1000);
    const second = journalStore.add({ ...input, methodId: 'kawiarka' }, 2000);
    expect(second.brewedAt).toBe(2000);
    journalStore.reset();
    expect(journalStore.getSnapshot().map((e) => e.id)).toEqual([second.id, first.id]);
  });

  it('ocena, notatka i ziarna; puste pola znikają z zapisu', () => {
    const entry = journalStore.add(input);
    journalStore.update(entry.id, { rating: 4, note: 'za kwaśna', beanId: 'b1', beanName: 'Etiopia' });
    expect(journalStore.get(entry.id)).toMatchObject({ rating: 4, note: 'za kwaśna', beanName: 'Etiopia' });

    journalStore.update(entry.id, { note: '   ', beanId: undefined, beanName: undefined });
    const saved = JSON.parse(localStorage.getItem(JOURNAL_KEY)!)[0];
    expect(saved).not.toHaveProperty('note');
    expect(saved).not.toHaveProperty('beanId');
    expect(saved).not.toHaveProperty('beanName');
    expect(saved.rating).toBe(4);
  });

  it('usuwanie', () => {
    const entry = journalStore.add(input);
    journalStore.remove(entry.id);
    expect(journalStore.getSnapshot()).toEqual([]);
  });

  it('najstarsze wpisy wypadają ponad limit', () => {
    for (let i = 0; i < MAX_ENTRIES + 3; i++) journalStore.add(input, i);
    const entries = journalStore.getSnapshot();
    expect(entries).toHaveLength(MAX_ENTRIES);
    expect(entries.at(-1)!.brewedAt).toBe(3);
  });

  it('pomija uszkodzone wpisy i nieznane metody', () => {
    localStorage.setItem(
      JOURNAL_KEY,
      JSON.stringify([
        { id: 'a', methodId: 'drip', brewedAt: 1, coffeeG: 15, waterMl: 250, rating: 5 },
        { id: 'b', methodId: 'ekspres', brewedAt: 1, coffeeG: 15, waterMl: 250 },
        { id: 'c', methodId: 'drip', brewedAt: 1, coffeeG: 15, waterMl: 250, rating: 7 },
        { id: 'd', methodId: 'cold-brew', brewedAt: 1, coffeeG: 100, waterMl: 800, variantId: 'wanilia' },
        {
          id: 'e',
          methodId: 'drip',
          brewedAt: 1,
          coffeeG: 15,
          waterMl: 250,
          grind: { grinderId: 'g', grinderName: 'Comandante', unit: 'click', setting: 22 },
        },
        { id: 'f', methodId: 'drip', brewedAt: 1, coffeeG: 15, waterMl: 250, grind: { setting: 22 } },
        'śmieci',
      ]),
    );
    expect(journalStore.getSnapshot().map((e) => e.id)).toEqual(['a', 'e']);
  });
});
