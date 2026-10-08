import {
  getIngredient,
  getMethod,
  getMilk,
  getSyrup,
  TEMPERATURE_LABELS,
  vessels,
  type Drink,
} from '../../data';
import { chroma, contrastRatio, hexToHsl, hslToHex } from '../../lib/color';
import { capitalize, formatMinutes } from '../../lib/format';
import { formatAmount } from '../drinks/amounts';

// Karta do udostępnienia w stylu karty ze Spotify: tło w kolorze napoju, duży rysunek jak
// okładka, pod nim nazwa, hasło i najważniejsze informacje. Format relacji (9:16).

export const CARD_WIDTH = 1080;
export const CARD_HEIGHT = 1920;
export const CARD_MARGIN = 160;
export const PANEL = { x: 160, y: 150, size: 760 };
export const FOOTER_Y = 1830;

/** Kolory napisów na karcie: biały na tle, ciemny brąz na jasnym panelu z rysunkiem. */
export const CARD_TEXT = '#ffffff';
export const PANEL_INK = '#2f221b';
export const PANEL_INK_MUTED = '#614634';

export interface CardColors {
  /** Góra gradientu tła. */
  top: string;
  /** Dół gradientu tła. */
  bottom: string;
  /** Jasny panel pod rysunkiem. */
  panel: string;
}

/** Kolor przewodni: najbardziej wyrazisty z warstw i dekoracji, jak dominujący kolor okładki. */
export function accentColor(drink: Drink): string {
  const colors = [...drink.layers.map((l) => l.color), ...drink.serving.decorations.map((d) => d.color)];
  return colors.reduce((best, color) => (chroma(color) > chroma(best) ? color : best));
}

/** Tło w odcieniu napoju, na tyle ciemne, żeby biały tekst miał kontrast ≥ 4,5:1. */
export function cardColors(drink: Drink): CardColors {
  const { h, s } = hexToHsl(accentColor(drink));
  // Bure kolory kawy też mają mieć charakter, a jaskrawe nie mogą krzyczeć.
  const sat = Math.min(0.7, Math.max(0.3, s));
  let l = 0.45;
  let top = hslToHex({ h, s: sat, l });
  while (contrastRatio(CARD_TEXT, top) < 4.6 && l > 0.05) {
    l -= 0.02;
    top = hslToHex({ h, s: sat, l });
  }
  return {
    top,
    bottom: hslToHex({ h, s: sat * 0.9, l: l * 0.4 }),
    panel: hslToHex({ h, s: Math.min(sat, 0.45), l: 0.94 }),
  };
}

/** Szerokość wiersza na karcie (od marginesu do marginesu). */
export const LINE_WIDTH = CARD_WIDTH - 2 * CARD_MARGIN;

/** Rozmiary czcionek (px w układzie 1080×1920). */
export const FONT = { title: 84, tagline: 40, meta: 34, row: 36, serving: 32 } as const;

export type CardFont = 'display' | 'sans' | 'sans-bold';

// Przybliżone szerokości znaków (w em) dla fontów systemowych: szeryfowego pogrubionego
// (nazwa) i bezszeryfowego. Zmierzone na wyrenderowanych kartach, z małym zapasem.
const WIDTHS: Record<'display' | 'sans', Record<'space' | 'thin' | 'narrow' | 'wide' | 'upper' | 'digit' | 'other', number>> = {
  display: { space: 0.27, thin: 0.36, narrow: 0.42, wide: 0.95, upper: 0.75, digit: 0.62, other: 0.61 },
  sans: { space: 0.27, thin: 0.27, narrow: 0.37, wide: 0.82, upper: 0.63, digit: 0.56, other: 0.53 },
};

function charClass(ch: string): keyof (typeof WIDTHS)['sans'] {
  if (ch === ' ') return 'space';
  if ("iljI.,:;!|'·".includes(ch)) return 'thin';
  if ('ftr()'.includes(ch)) return 'narrow';
  if ('mwMW%'.includes(ch)) return 'wide';
  if (/[0-9]/.test(ch)) return 'digit';
  if (ch !== ch.toLowerCase()) return 'upper';
  return 'other';
}

/** Szacowana szerokość tekstu w px. Wystarczy do zawijania: kanwy w danych nie mamy. */
export function textWidth(text: string, size: number, font: CardFont): number {
  const widths = WIDTHS[font === 'display' ? 'display' : 'sans'];
  let em = 0;
  for (const ch of text) em += widths[charClass(ch)];
  return em * size * (font === 'sans-bold' ? 1.06 : 1);
}

/** Skraca tekst z wielokropkiem, aż zmieści się w szerokości. */
export function fitText(text: string, maxWidth: number, size: number, font: CardFont): string {
  if (textWidth(text, size, font) <= maxWidth) return text;
  let cut = text;
  while (cut.length > 1 && textWidth(`${cut}…`, size, font) > maxWidth) cut = cut.slice(0, -1).trimEnd();
  return `${cut}…`;
}

/** Dzieli tekst na linie po słowach, w szerokości karty; nadmiar kończy wielokropkiem. */
export function wrapText(text: string, maxLines: number, size: number, font: CardFont): string[] {
  const fits = (line: string) => textWidth(line, size, font) <= LINE_WIDTH;
  const lines: string[] = [];
  let line = '';
  for (const word of text.split(/\s+/)) {
    if (line && !fits(`${line} ${word}`)) {
      lines.push(line);
      line = word;
    } else {
      line = line ? `${line} ${word}` : word;
    }
  }
  if (line) lines.push(line);
  const kept = lines.slice(0, maxLines).map((l) => fitText(l, LINE_WIDTH, size, font));
  if (lines.length > maxLines && !kept[maxLines - 1]!.endsWith('…')) {
    kept[maxLines - 1] = fitText(`${kept[maxLines - 1]!}…`, LINE_WIDTH, size, font);
  }
  return kept;
}

export interface CardRow {
  name: string;
  amount: string;
}

export const MAX_ROWS = 4;

/** Składniki na kartę: baza, mleko i niezbędne dodatki, krótkimi nazwami z katalogu. */
export function cardIngredients(drink: Drink): CardRow[] {
  const method = getMethod(drink.base.methodId)!;
  const rows: CardRow[] = [{ name: capitalize(method.brewName), amount: `${drink.base.amountMl} ml` }];
  if (drink.milk) rows.push({ name: getMilk(drink.milk.options[0]!)!.name, amount: `${drink.milk.amountMl} ml` });
  for (const extra of drink.extras) {
    if (extra.optional) continue;
    if (extra.kind === 'syrup') {
      rows.push({ name: getSyrup(extra.syrupId)!.name, amount: `${extra.amountMl} ml` });
      continue;
    }
    const name = capitalize(getIngredient(extra.ingredientId)!.name);
    // Ten sam składnik dwa razy (lód do dzbanka i do szklanki) pokazujemy raz.
    if (rows.some((row) => row.name === name)) continue;
    rows.push({ name, amount: typeof extra.amount === 'string' ? '' : formatAmount(extra.amount) });
  }
  if (rows.length <= MAX_ROWS) return rows;
  const rest = rows.length - (MAX_ROWS - 1);
  return [...rows.slice(0, MAX_ROWS - 1), { name: `i ${rest} inne`, amount: '' }];
}

export interface CardLine {
  text: string;
  y: number;
}

export interface CardLayout {
  /** Górna krawędź panelu z rysunkiem. */
  panelY: number;
  title: CardLine[];
  tagline: CardLine[];
  meta: CardLine;
  rows: (CardRow & { y: number })[];
  serving: CardLine[];
  /** Dolna krawędź treści (przed stopką). */
  bottom: number;
}

/**
 * Rozkład karty z góry na dół. Treść jest wyśrodkowana w pionie nad stopką, więc krótki
 * opis nie zostawia pustego dołu. Rozmiary czcionek są w ShareCard.
 */
export function layoutCard(drink: Drink): CardLayout {
  const layout = stackCard(drink);
  const dy = Math.max(0, Math.round((FOOTER_Y - 130 - layout.bottom) / 2));
  const move = <T extends { y: number }>(item: T): T => ({ ...item, y: item.y + dy });
  return {
    panelY: layout.panelY + dy,
    title: layout.title.map(move),
    tagline: layout.tagline.map(move),
    meta: move(layout.meta),
    rows: layout.rows.map(move),
    serving: layout.serving.map(move),
    bottom: layout.bottom + dy,
  };
}

/** Treść ułożona od górnej krawędzi panelu. */
function stackCard(drink: Drink): CardLayout {
  let y = PANEL.y + PANEL.size + 110;
  const lines = (texts: string[], step: number) =>
    texts.map((text, i) => ({ text, y: (i === 0 ? y : (y += step)) }));

  const title = lines(wrapText(drink.name, 2, FONT.title, 'display'), 96);
  y += 70;
  const tagline = lines(wrapText(drink.tagline, 2, FONT.tagline, 'sans'), 54);
  y += 70;
  const method = getMethod(drink.base.methodId)!;
  const meta = {
    text: fitText(
      `${capitalize(TEMPERATURE_LABELS[drink.temperature])} · ${formatMinutes(drink.prepTimeMin)} · ${method.name}`,
      LINE_WIDTH,
      FONT.meta,
      'sans-bold',
    ),
    y,
  };
  y += 84;
  const rows = cardIngredients(drink).map((row, i) => ({
    ...row,
    // Nazwa nie może wejść na ilość wyrównaną do prawej.
    name: fitText(row.name, LINE_WIDTH - textWidth(row.amount, FONT.row, 'sans-bold') - 40, FONT.row, 'sans'),
    y: i === 0 ? y : (y += 56),
  }));
  y += 76;
  const decorations = drink.serving.decorations.filter((d) => !d.optional).map((d) => d.name);
  const serving = lines(
    wrapText(
      `Podanie: ${[vessels[drink.serving.vessel].name, ...decorations.slice(0, 2)].join(' · ')}`,
      2,
      FONT.serving,
      'sans',
    ),
    44,
  );
  return { panelY: PANEL.y, title, tagline, meta, rows, serving, bottom: y + 12 };
}
