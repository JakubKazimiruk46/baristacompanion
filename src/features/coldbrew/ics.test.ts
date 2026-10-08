import { describe, expect, it } from 'vitest';
import { createIcs, escapeText, foldLine } from './ics';

const event = {
  uid: '1791489600000-cold-brew@barista-companion',
  start: Date.UTC(2026, 9, 9, 6, 30),
  durationMin: 15,
  title: 'Cold brew gotowe: przecedź',
  description: 'Przecedź przez sitko, potem przez filtr.\nRozcieńcz 1:1 wodą lub mlekiem; podawaj z lodem.',
  now: Date.UTC(2026, 9, 8, 14, 30),
};

const bytes = (text: string) => new TextEncoder().encode(text).length;

describe('plik .ics', () => {
  const ics = createIcs(event);
  const lines = ics.split('\r\n');

  it('ma strukturę kalendarza z jednym wydarzeniem i alarmem', () => {
    expect(lines[0]).toBe('BEGIN:VCALENDAR');
    expect(lines).toContain('VERSION:2.0');
    expect(lines).toContain('BEGIN:VEVENT');
    expect(lines).toContain('BEGIN:VALARM');
    expect(lines).toContain('TRIGGER:PT0M');
    expect(ics.endsWith('END:VCALENDAR\r\n')).toBe(true);
  });

  it('czasy w UTC', () => {
    expect(lines).toContain('DTSTART:20261009T063000Z');
    expect(lines).toContain('DTEND:20261009T064500Z');
    expect(lines).toContain('DTSTAMP:20261008T143000Z');
    expect(lines).toContain(`UID:${event.uid}`);
  });

  it('wszystkie linie kończą się CRLF i mają najwyżej 75 bajtów', () => {
    expect(ics.replace(/\r\n/g, '')).not.toMatch(/[\r\n]/);
    for (const line of lines) expect(bytes(line)).toBeLessThanOrEqual(75);
  });

  it('po rozwinięciu linii opis jest kompletny i poprawnie zakodowany', () => {
    const unfolded = ics.replace(/\r\n /g, '');
    expect(unfolded).toContain(
      'DESCRIPTION:Przecedź przez sitko\\, potem przez filtr.\\nRozcieńcz 1:1 wodą lub mlekiem\\; podawaj z lodem.',
    );
  });
});

describe('kodowanie tekstu', () => {
  it('escapeText', () => {
    expect(escapeText('a,b;c\\d\ne')).toBe('a\\,b\\;c\\\\d\\ne');
  });

  it('foldLine nie przecina polskich znaków', () => {
    const long = 'DESCRIPTION:' + 'źdźbło '.repeat(20);
    const folded = foldLine(long);
    const parts = folded.split('\r\n ');
    expect(parts.length).toBeGreaterThan(1);
    for (const [i, part] of parts.entries()) expect(bytes(part) + (i > 0 ? 1 : 0)).toBeLessThanOrEqual(75);
    expect(parts.join('')).toBe(long);
  });

  it('krótka linia zostaje bez zmian', () => {
    expect(foldLine('SUMMARY:Kawa')).toBe('SUMMARY:Kawa');
  });
});
