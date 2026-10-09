import { describe, expect, it } from 'vitest';
import { findDuplicates, mergeRecords, pruneTombstones } from './merge';
import { sameData, stableStringify, type SyncRecord } from './records';

const live = (id: string, updatedAt: number, data: unknown, dirty?: boolean): SyncRecord => ({
  id,
  updatedAt,
  data,
  ...(dirty && { dirty }),
});
const gone = (id: string, updatedAt: number, deletedAt: number, dirty?: boolean): SyncRecord => ({
  id,
  updatedAt,
  deletedAt,
  ...(dirty && { dirty }),
});
const ids = (records: SyncRecord[]) => records.map((r) => r.id).sort();
const find = (records: SyncRecord[], id: string) => records.find((r) => r.id === id);

describe('scalanie: wygrywa nowsza zmiana każdego rekordu', () => {
  it('nowsza wersja z serwera zastępuje lokalną, a nowsza lokalna idzie na serwer', () => {
    const local = [live('a', 100, { name: 'stare A' }), live('b', 300, { name: 'nowe B' }, true)];
    const remote = [live('a', 200, { name: 'nowe A' }), live('b', 250, { name: 'stare B' })];
    const result = mergeRecords(local, remote, false);
    expect(find(result.records, 'a')!.data).toEqual({ name: 'nowe A' });
    expect(find(result.records, 'b')!.data).toEqual({ name: 'nowe B' });
    expect(ids(result.toPush)).toEqual(['b']);
    expect(result.changed).toBe(true);
  });

  it('niewysłana lokalna zmiana przegrywa z nowszą z innego urządzenia', () => {
    const result = mergeRecords([live('a', 100, 'tu', true)], [live('a', 200, 'tam')], false);
    expect(find(result.records, 'a')).toEqual(live('a', 200, 'tam'));
    expect(result.toPush).toEqual([]);
  });

  it('remis: wygrywa wersja z serwera (ta sama na każdym urządzeniu)', () => {
    const result = mergeRecords([live('a', 100, 'tu')], [live('a', 100, 'tam')], false);
    expect(find(result.records, 'a')!.data).toBe('tam');
    expect(result.toPush).toEqual([]);
  });

  it('ta sama treść: nic do zapisania ani wysłania', () => {
    const result = mergeRecords([live('a', 100, { x: 1, y: 2 })], [live('a', 100, { y: 2, x: 1 })], false);
    expect(result.changed).toBe(false);
    expect(result.toPush).toEqual([]);
  });

  it('nowe rekordy z serwera dochodzą, a lokalne trafiają na serwer tylko jako zmiany', () => {
    const local = [live('mine-dirty', 50, 1, true), live('mine-synced', 40, 2)];
    const result = mergeRecords(local, [live('theirs', 60, 3)], false);
    expect(ids(result.records)).toEqual(['mine-dirty', 'mine-synced', 'theirs']);
    expect(ids(result.toPush)).toEqual(['mine-dirty']);
  });

  it('pierwsza synchronizacja wysyła wszystko, czego serwer nie ma', () => {
    const result = mergeRecords([live('a', 0, 1), gone('b', 0, 10)], [], true);
    expect(ids(result.toPush)).toEqual(['a', 'b']);
  });
});

describe('scalanie: usunięcia', () => {
  it('nowsze usunięcie wygrywa ze starszą wersją z drugiej strony', () => {
    const fromHere = mergeRecords([gone('a', 100, 300, true)], [live('a', 200, 'tam')], false);
    expect(find(fromHere.records, 'a')!.deletedAt).toBe(300);
    expect(ids(fromHere.toPush)).toEqual(['a']);

    const fromThere = mergeRecords([live('a', 200, 'tu')], [gone('a', 300, 300)], false);
    expect(find(fromThere.records, 'a')!.deletedAt).toBe(300);
    expect(fromThere.changed).toBe(true);
  });

  it('nowsza zmiana po usunięciu przywraca rekord', () => {
    const result = mergeRecords([gone('a', 100, 200)], [live('a', 300, 'wrócił')], false);
    expect(find(result.records, 'a')).toEqual(live('a', 300, 'wrócił'));
  });

  it('usunięcie z serwera rekordu, którego tu nie było, niczego nie dodaje', () => {
    const result = mergeRecords([], [gone('a', 300, 300)], false);
    expect(result.records).toEqual([]);
    expect(result.changed).toBe(false);
  });

  it('stare znaczniki usunięcia znikają, niewysłane zostają', () => {
    const records = [live('a', 1, 1), gone('b', 1, 10), gone('c', 1, 500), gone('d', 1, 10, true)];
    expect(ids(pruneTombstones(records, 100))).toEqual(['a', 'c', 'd']);
  });
});

describe('scalanie: stare zapisy .v1 (sprzed synchronizacji)', () => {
  it('rekord bez czasu (0) przegrywa z każdą wersją z konta, ale nie ginie, jeśli konto go nie ma', () => {
    const local = [live('znany', 0, 'stary zapis'), live('tylko-tu', 0, 'tylko lokalnie')];
    const remote = [live('znany', 5, 'z konta')];
    const result = mergeRecords(local, remote, true);
    expect(find(result.records, 'znany')!.data).toBe('z konta');
    expect(find(result.records, 'tylko-tu')!.data).toBe('tylko lokalnie');
    expect(ids(result.toPush)).toEqual(['tylko-tu']);
  });
});

describe('duplikaty przy pierwszym logowaniu', () => {
  const key = (data: unknown) => (data as { name: string }).name.toLowerCase();

  it('lokalny rekord o tej samej treści co rekord z konta wskazuje na niego', () => {
    const local = [live('b-tu', 0, { name: 'Etiopia' }), live('c-tu', 0, { name: 'Kenia' }), live('wspolny', 0, { name: 'Brazylia' })];
    const remote = [live('a-tam', 5, { name: 'etiopia' }), live('wspolny', 5, { name: 'Brazylia' }), gone('kenia', 5, 6)];
    const duplicates = findDuplicates(local, remote, key);
    expect([...duplicates]).toEqual([['b-tu', 'a-tam']]);
  });
});

describe('stableStringify', () => {
  it('ta sama treść w innej kolejności kluczy daje ten sam tekst', () => {
    expect(stableStringify({ b: 1, a: [{ d: 1, c: 2 }] })).toBe('{"a":[{"c":2,"d":1}],"b":1}');
    expect(sameData({ a: 1, b: undefined }, { a: 1 })).toBe(true);
  });
});
