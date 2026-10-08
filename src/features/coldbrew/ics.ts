// Plik kalendarza (.ics, RFC 5545) z przypomnieniem o gotowym cold brew.
// Telefon otwiera go w aplikacji kalendarza i proponuje dodanie wydarzenia.

export interface CalendarEvent {
  uid: string;
  start: number;
  durationMin: number;
  title: string;
  description: string;
  /** Kiedy utworzono plik (DTSTAMP). */
  now: number;
}

/** Czas w UTC: 20261009T063000Z. */
function utc(ms: number): string {
  return new Date(ms).toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
}

/** Tekst w polu: ukośnik, przecinek, średnik i nowa linia muszą być poprzedzone „\”. */
export function escapeText(text: string): string {
  return text.replace(/\\/g, '\\\\').replace(/([,;])/g, '\\$1').replace(/\r?\n/g, '\\n');
}

const encoder = new TextEncoder();

/**
 * Linie dłuższe niż 75 bajtów dzielimy, a kontynuacja zaczyna się od spacji.
 * Liczymy bajty UTF-8 (polskie znaki to 2 bajty) i nie przecinamy znaku w połowie.
 */
export function foldLine(line: string): string {
  const parts: string[] = [];
  let current = '';
  let bytes = 0;
  for (const char of line) {
    const size = encoder.encode(char).length;
    const limit = parts.length === 0 ? 75 : 74; // kontynuacja ma jeszcze spację na początku
    if (bytes + size > limit) {
      parts.push(current);
      current = '';
      bytes = 0;
    }
    current += char;
    bytes += size;
  }
  parts.push(current);
  return parts.join('\r\n ');
}

export function createIcs(event: CalendarEvent): string {
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Barista Companion//PL',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:${event.uid}`,
    `DTSTAMP:${utc(event.now)}`,
    `DTSTART:${utc(event.start)}`,
    `DTEND:${utc(event.start + event.durationMin * 60_000)}`,
    `SUMMARY:${escapeText(event.title)}`,
    `DESCRIPTION:${escapeText(event.description)}`,
    'BEGIN:VALARM',
    'ACTION:DISPLAY',
    `DESCRIPTION:${escapeText(event.title)}`,
    'TRIGGER:PT0M',
    'END:VALARM',
    'END:VEVENT',
    'END:VCALENDAR',
  ];
  return lines.map(foldLine).join('\r\n') + '\r\n';
}

/** Pobiera plik .ics: na telefonie otwiera się w kalendarzu. */
export function downloadIcs(content: string, fileName: string): void {
  const blob = new Blob([content], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  document.body.append(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
