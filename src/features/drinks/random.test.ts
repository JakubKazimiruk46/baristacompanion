import { describe, expect, it } from 'vitest';
import { pickRandom } from './random';

const items = [{ id: 'a' }, { id: 'b' }, { id: 'c' }];

describe('losowanie', () => {
  it('wybiera według liczby losowej, także na samym końcu zakresu', () => {
    expect(pickRandom(items, undefined, () => 0)?.id).toBe('a');
    expect(pickRandom(items, undefined, () => 0.5)?.id).toBe('b');
    expect(pickRandom(items, undefined, () => 0.999999)?.id).toBe('c');
  });

  it('nie powtarza tego, co jest na ekranie, chyba że nie ma innego wyboru', () => {
    expect(pickRandom(items, 'a', () => 0)?.id).toBe('b');
    expect(pickRandom([{ id: 'a' }], 'a')?.id).toBe('a');
  });

  it('pusta lista: nic', () => {
    expect(pickRandom([], undefined)).toBeUndefined();
  });
});
