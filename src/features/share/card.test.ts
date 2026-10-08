import { describe, expect, it } from 'vitest';
import { drinks, getDrink } from '../../data';
import { contrastRatio } from '../../lib/color';
import {
  accentColor,
  CARD_TEXT,
  cardColors,
  cardIngredients,
  FONT,
  FOOTER_Y,
  layoutCard,
  LINE_WIDTH,
  PANEL_INK,
  PANEL_INK_MUTED,
  textWidth,
  wrapText,
} from './card';

const all = drinks.map((d) => [d.id, d] as const);

describe('kolory karty', () => {
  it.each(all)('%s: biały tekst na tle i ciemne podpisy na panelu mają kontrast ≥ 4,5', (_, drink) => {
    const colors = cardColors(drink);
    expect(contrastRatio(CARD_TEXT, colors.top)).toBeGreaterThanOrEqual(4.5);
    expect(contrastRatio(CARD_TEXT, colors.bottom)).toBeGreaterThanOrEqual(4.5);
    expect(contrastRatio(PANEL_INK, colors.panel)).toBeGreaterThanOrEqual(4.5);
    expect(contrastRatio(PANEL_INK_MUTED, colors.panel)).toBeGreaterThanOrEqual(4.5);
  });

  it('kolor przewodni to najbardziej wyrazisty kolor napoju, także z dekoracji', () => {
    expect(accentColor(getDrink('espresso-tonic')!)).toBe('#f08a24'); // skórka pomarańczy
    expect(accentColor(getDrink('kawa-malinowa')!)).toBe('#c7283f'); // maliny
  });
});

describe('układ karty', () => {
  it.each(all)('%s: żaden tekst nie wychodzi poza kartę ani na stopkę', (_, drink) => {
    const layout = layoutCard(drink);
    expect(layout.title.length).toBeLessThanOrEqual(2);
    for (const line of layout.title) expect(textWidth(line.text, FONT.title, 'display')).toBeLessThanOrEqual(LINE_WIDTH);
    for (const line of layout.tagline) expect(textWidth(line.text, FONT.tagline, 'sans')).toBeLessThanOrEqual(LINE_WIDTH);
    for (const line of layout.serving) expect(textWidth(line.text, FONT.serving, 'sans')).toBeLessThanOrEqual(LINE_WIDTH);
    expect(textWidth(layout.meta.text, FONT.meta, 'sans-bold')).toBeLessThanOrEqual(LINE_WIDTH);
    for (const row of layout.rows) {
      const width = textWidth(row.name, FONT.row, 'sans') + textWidth(row.amount, FONT.row, 'sans-bold');
      expect(width, row.name).toBeLessThanOrEqual(LINE_WIDTH);
    }
    expect(layout.bottom).toBeLessThan(FOOTER_Y - 60);
  });

  it('długa nazwa przechodzi do drugiej linii', () => {
    expect(layoutCard(getDrink('kawa-pomaranczowa')!).title.map((l) => l.text)).toEqual(['Kawa', 'pomarańczowa']);
    expect(layoutCard(getDrink('espresso-tonic')!).title.map((l) => l.text)).toEqual(['Espresso tonic']);
  });

  it('za długi tekst kończy się wielokropkiem', () => {
    const lines = wrapText('słowo '.repeat(60), 2, FONT.tagline, 'sans');
    expect(lines).toHaveLength(2);
    expect(lines[1]).toMatch(/…$/);
  });
});

describe('składniki na karcie', () => {
  it('baza, mleko i dodatki krótkimi nazwami; opcjonalne pominięte', () => {
    expect(cardIngredients(getDrink('kawa-malinowa')!)).toEqual([
      { name: 'Kawa z kawiarki', amount: '50 ml' },
      { name: 'Mleko krowie 3,2%', amount: '150 ml' },
      { name: 'Maliny', amount: '60 g' },
      { name: 'Lód', amount: '3–4 kostki' },
    ]);
  });

  it('ten sam składnik raz, a nadmiar jako „i N inne”', () => {
    expect(cardIngredients(getDrink('kawa-mrozona-z-dripa')!).map((r) => r.name)).toEqual(['Kawa z dripa', 'Lód']);
    const many = cardIngredients(getDrink('cold-brew-z-cynamonem')!);
    expect(many.length).toBeLessThanOrEqual(4);
  });
});
