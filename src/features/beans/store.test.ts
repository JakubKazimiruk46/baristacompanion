import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { beansStore, loadBeans, STORAGE_KEY, type BeanInput } from './store';

const input: BeanInput = {
  name: 'Etiopia Yirgacheffe',
  roaster: 'Palarnia testowa',
  profile: { roast: 'light', notes: ['floral', 'citrus'], kind: 'single-origin', origin: 'Etiopia' },
};

beforeEach(() => {
  localStorage.clear();
  beansStore.reset();
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('zapis ziaren', () => {
  it('dodane ziarna trafiają do localStorage i wracają po „odświeżeniu”', () => {
    const bean = beansStore.add(input);
    beansStore.reset(); // jak po przeładowaniu strony
    expect(beansStore.getSnapshot()).toEqual([bean]);
    expect(JSON.parse(localStorage.getItem(STORAGE_KEY)!)).toHaveLength(1);
  });

  it('edycja i usuwanie', () => {
    const bean = beansStore.add(input);
    beansStore.update(bean.id, { ...input, name: 'Kenia' });
    expect(beansStore.getSnapshot()[0]!.name).toBe('Kenia');
    beansStore.remove(bean.id);
    expect(beansStore.getSnapshot()).toEqual([]);
  });

  it('nowe ziarna są na górze listy', () => {
    beansStore.add(input);
    beansStore.add({ ...input, name: 'Brazylia' });
    expect(beansStore.getSnapshot().map((b) => b.name)).toEqual(['Brazylia', 'Etiopia Yirgacheffe']);
  });

  it('uszkodzone dane nie wysypują aplikacji', () => {
    localStorage.setItem(STORAGE_KEY, '{nie-json');
    expect(loadBeans()).toEqual({ beans: [], ok: true });

    localStorage.setItem(STORAGE_KEY, JSON.stringify([{ id: 1 }, { foo: 'bar' }]));
    expect(loadBeans().beans).toEqual([]);
  });

  it('bez dostępu do localStorage działa w pamięci i to zgłasza', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new DOMException('SecurityError');
    });
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new DOMException('QuotaExceededError');
    });

    expect(beansStore.getSnapshot()).toEqual([]);
    expect(beansStore.isPersistent()).toBe(false);
    const bean = beansStore.add(input);
    expect(beansStore.getSnapshot()).toEqual([bean]);
    expect(beansStore.isPersistent()).toBe(false);
  });
});
