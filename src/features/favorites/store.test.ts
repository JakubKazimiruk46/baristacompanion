import { beforeEach, describe, expect, it } from 'vitest';
import { FAVORITES_KEY, favoritesStore } from './store';

beforeEach(() => {
  localStorage.clear();
  favoritesStore.reset();
});

describe('ulubione', () => {
  it('przełącznik dodaje i usuwa, a ostatnio dodane są pierwsze', () => {
    favoritesStore.toggle('espresso-tonic');
    favoritesStore.toggle('mocha');
    expect(favoritesStore.getSnapshot()).toEqual(['mocha', 'espresso-tonic']);
    favoritesStore.toggle('espresso-tonic');
    expect(favoritesStore.getSnapshot()).toEqual(['mocha']);
  });

  it('zapis przetrwa odświeżenie', () => {
    favoritesStore.toggle('affogato');
    favoritesStore.reset();
    expect(favoritesStore.getSnapshot()).toEqual(['affogato']);
    expect(JSON.parse(localStorage.getItem(FAVORITES_KEY)!)).toEqual(['affogato']);
  });

  it('pomija nieznane napoje, powtórzenia i śmieci', () => {
    localStorage.setItem(FAVORITES_KEY, JSON.stringify(['mocha', 'nie-ma-takiego', 'mocha', 7, null]));
    expect(favoritesStore.getSnapshot()).toEqual(['mocha']);
  });

  it('uszkodzony zapis daje pustą listę', () => {
    localStorage.setItem(FAVORITES_KEY, '{nie json');
    expect(favoritesStore.getSnapshot()).toEqual([]);
  });
});
