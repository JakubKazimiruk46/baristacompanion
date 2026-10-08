import { describe, expect, it } from 'vitest';
import {
  createTimer,
  elapsed,
  formatClock,
  isDone,
  isRunning,
  overtime,
  pause,
  remaining,
  reset,
  start,
} from './timer';

// „Zegar” to zwykłe liczby: każdy test sam decyduje, która jest godzina.
const T0 = 1_700_000_000_000;

describe('stoper', () => {
  it('nowy stoper stoi i ma pełny czas', () => {
    const timer = createTimer(240_000);
    expect(isRunning(timer)).toBe(false);
    expect(remaining(timer, T0 + 99_999)).toBe(240_000);
  });

  it('liczy od znacznika startu', () => {
    const timer = start(createTimer(240_000), T0);
    expect(elapsed(timer, T0 + 1_500)).toBe(1_500);
    expect(remaining(timer, T0 + 60_000)).toBe(180_000);
  });

  it('30 s w innej karcie: bez żadnych ticków czas i tak jest poprawny', () => {
    const timer = start(createTimer(240_000), T0);
    // Między T0 a T0 + 30 s nie wywołujemy niczego (przeglądarka dławi interwały w tle).
    expect(remaining(timer, T0 + 30_000)).toBe(210_000);
  });

  it('pauza zatrzymuje czas, wznowienie liczy dalej', () => {
    let timer = start(createTimer(30_000), T0);
    timer = pause(timer, T0 + 10_000);
    expect(isRunning(timer)).toBe(false);
    expect(remaining(timer, T0 + 70_000)).toBe(20_000);
    timer = start(timer, T0 + 70_000);
    expect(remaining(timer, T0 + 80_000)).toBe(10_000);
  });

  it('start na chodzącym stoperze i pauza na stojącym nic nie zmieniają', () => {
    const running = start(createTimer(10_000), T0);
    expect(start(running, T0 + 5_000)).toBe(running);
    const stopped = createTimer(10_000);
    expect(pause(stopped, T0)).toBe(stopped);
  });

  it('koniec, nadgodziny i reset', () => {
    const timer = start(createTimer(30_000), T0);
    expect(isDone(timer, T0 + 29_999)).toBe(false);
    expect(isDone(timer, T0 + 30_000)).toBe(true);
    expect(remaining(timer, T0 + 45_000)).toBe(0);
    expect(overtime(timer, T0 + 45_000)).toBe(15_000);
    expect(reset(timer)).toEqual(createTimer(30_000));
  });

  it('czas sprzed startu (np. przestawiony zegar) nie jest ujemny', () => {
    const timer = start(createTimer(30_000), T0);
    expect(elapsed(timer, T0 - 5_000)).toBe(0);
  });
});

describe('formatClock', () => {
  it.each([
    [240_000, '4:00'],
    [239_001, '4:00'],
    [239_000, '3:59'],
    [7_000, '0:07'],
    [0, '0:00'],
    [16 * 3600_000, '16:00:00'],
  ])('%i ms → %s', (ms, text) => {
    expect(formatClock(ms)).toBe(text);
  });
});
