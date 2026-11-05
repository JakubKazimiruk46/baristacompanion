import { describe, expect, it } from 'vitest';
import { dayAndTime, formatRemaining, isReady, progress, readyAt, shortDay } from './time';

// Daty lokalne (tak jak na telefonie użytkownika): new Date(rok, miesiąc-1, dzień, godz, min).
const at = (day: number, h: number, m = 0) => new Date(2026, 9, day, h, m).getTime(); // październik 2026
const HOUR = 3600_000;

describe('godzina gotowości', () => {
  it('start + liczba godzin', () => {
    expect(readyAt(at(8, 20), 16)).toBe(at(9, 12));
  });

  it.each([
    ['wieczorem na 16 h: jutro w południe', at(8, 20), 16, 'jutro o 12:00'],
    ['przez północ co do minuty: 12:00 + 12 h', at(8, 12), 12, 'jutro o 0:00'],
    ['tuż przed północą: 23:30 + 12 h', at(8, 23, 30), 12, 'jutro o 11:30'],
    ['tuż po północy: 0:30 + 12 h, ten sam dzień', at(8, 0, 30), 12, 'dziś o 12:30'],
    ['rano na 12 h: dziś wieczorem', at(8, 8, 15), 12, 'dziś o 20:15'],
    ['późny wieczór na 24 h: jutro o tej samej porze', at(8, 22, 5), 24, 'jutro o 22:05'],
  ])('%s', (_, startedAt, hours, label) => {
    expect(dayAndTime(readyAt(startedAt, hours), startedAt)).toBe(label);
  });

  it('po ponownym otwarciu następnego dnia: „dziś”', () => {
    const startedAt = at(8, 20);
    expect(dayAndTime(readyAt(startedAt, 16), at(9, 7))).toBe('dziś o 12:00');
  });

  it('dalsze dni: pojutrze i dzień tygodnia', () => {
    expect(dayAndTime(at(10, 6), at(8, 20))).toBe('pojutrze o 6:00');
    expect(dayAndTime(at(15, 8, 30), at(11, 9))).toBe('w czwartek o 8:30'); // 15.10.2026 to czwartek
    expect(dayAndTime(at(30, 9), at(8, 9))).toBe('30.10 o 9:00');
  });

  it('zmiana czasu na zimowy (25.10.2026): liczymy dni kalendarzowe', () => {
    const startedAt = new Date(2026, 9, 24, 20, 0).getTime();
    const ready = readyAt(startedAt, 16);
    expect(dayAndTime(ready, startedAt)).toMatch(/^jutro o 1[12]:00$/);
  });
});

describe('postęp', () => {
  it('od 0 do 1, przycięty na brzegach', () => {
    const startedAt = at(8, 20);
    expect(progress(startedAt, 16, startedAt - HOUR)).toBe(0);
    expect(progress(startedAt, 16, startedAt + 4 * HOUR)).toBe(0.25);
    expect(progress(startedAt, 16, startedAt + 40 * HOUR)).toBe(1);
  });

  it('gotowe dokładnie po czasie', () => {
    const startedAt = at(8, 20);
    expect(isReady(startedAt, 12, startedAt + 12 * HOUR - 1)).toBe(false);
    expect(isReady(startedAt, 12, startedAt + 12 * HOUR)).toBe(true);
  });
});

describe('formatRemaining', () => {
  it.each([
    [11 * HOUR + 20 * 60_000, '11 h 20 min'],
    [16 * HOUR, '16 h'],
    [45 * 60_000, '45 min'],
    [30_000, '1 min'],
    [0, 'mniej niż minuta'],
  ])('%i ms → %s', (ms, text) => {
    expect(formatRemaining(ms)).toBe(text);
  });
});

describe('krótko, kiedy było', () => {
  it('dziś, wczoraj, kilka dni temu, data', () => {
    const now = at(9, 10);
    expect(shortDay(at(9, 7), now)).toBe('dziś');
    expect(shortDay(at(8, 23), now)).toBe('wczoraj');
    expect(shortDay(at(5, 12), now)).toBe('4 dni temu');
    expect(shortDay(at(1, 12), now)).toBe('1.10');
  });
});
