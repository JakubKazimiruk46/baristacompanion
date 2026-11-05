import { beforeEach, describe, expect, it } from 'vitest';
import { WISHLIST_KEY, wishlistStore } from './store';

beforeEach(() => {
  localStorage.clear();
  wishlistStore.reset();
});

describe('do spróbowania', () => {
  it('przełącznik dodaje i usuwa, a ostatnio dodane są pierwsze', () => {
    wishlistStore.toggle('espresso-tonic');
    wishlistStore.toggle('mocha');
    expect(wishlistStore.getSnapshot()).toEqual(['mocha', 'espresso-tonic']);
    wishlistStore.toggle('espresso-tonic');
    expect(wishlistStore.getSnapshot()).toEqual(['mocha']);
    wishlistStore.remove('mocha');
    wishlistStore.remove('mocha');
    expect(wishlistStore.getSnapshot()).toEqual([]);
  });

  it('przyjmuje „Moje napoje”, pomija nieznane napoje, powtórzenia i śmieci', () => {
    localStorage.setItem(WISHLIST_KEY, JSON.stringify(['mocha', 'moj-kawa-abcd', 'nie-ma-takiego', 'mocha', 7]));
    expect(wishlistStore.getSnapshot()).toEqual(['mocha', 'moj-kawa-abcd']);
  });
});
