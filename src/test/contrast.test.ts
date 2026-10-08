import { describe, expect, it } from 'vitest';

// Kontrast tokenów kolorów wg WCAG 2.x, w obu motywach. Tokeny czytamy prosto z index.css,
// więc test pilnuje palety przy każdej zmianie. Vitest podmienia importy CSS na pusty tekst,
// dlatego czytamy plik z dysku (dynamiczny import, bo projekt nie ma @types/node).
// Ścieżka względem katalogu projektu (Vitest uruchamia się w nim).
const fs: { readFileSync(path: string, encoding: 'utf8'): string } = await import(/* @vite-ignore */ 'node:' + 'fs');
const css = fs.readFileSync('src/index.css', 'utf8');

const palette = Object.fromEntries(
  [...css.matchAll(/--color-([a-z]+-\d+):\s*(#[0-9a-f]{6})/gi)].map((m) => [m[1]!, m[2]!]),
);

function themeTokens(block: string): Record<string, string> {
  return Object.fromEntries(
    [...block.matchAll(/--([a-z-]+):\s*([^;]+);/g)].map(([, name, value]) => {
      const ref = value!.match(/var\(--color-([a-z]+-\d+)\)/);
      return [name!, ref ? palette[ref[1]!]! : value!.trim()];
    }),
  );
}

const lightBlock = css.slice(css.indexOf(':root {'), css.indexOf('@media (prefers-color-scheme: dark)'));
const darkBlock = css.slice(css.indexOf('@media (prefers-color-scheme: dark)'), css.indexOf('@theme inline'));
const themes = { jasny: themeTokens(lightBlock), ciemny: themeTokens(darkBlock) };

function luminance(hex: string): number {
  const [r, g, b] = [1, 3, 5].map((i) => {
    const c = parseInt(hex.slice(i, i + 2), 16) / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r! + 0.7152 * g! + 0.0722 * b!;
}

export function contrast(a: string, b: string): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi! + 0.05) / (lo! + 0.05);
}

// [tekst, tło]: pary, które występują w interfejsie.
const PAIRS: [string, string][] = [
  ['ink', 'canvas'],
  ['ink', 'surface'],
  ['ink', 'surface-muted'],
  ['ink', 'accent-soft'],
  ['ink-muted', 'canvas'],
  ['ink-muted', 'surface'],
  ['ink-muted', 'surface-muted'],
  ['accent', 'canvas'],
  ['accent', 'surface'],
  ['accent', 'accent-soft'],
  ['on-accent', 'accent'],
];

describe.each(Object.entries(themes))('motyw %s: kontrast WCAG AA (≥ 4,5:1)', (_, tokens) => {
  it.each(PAIRS)('%s na %s', (text, background) => {
    const fg = tokens[text]!;
    const bg = tokens[background]!;
    expect(fg).toMatch(/^#[0-9a-f]{6}$/i);
    expect(bg).toMatch(/^#[0-9a-f]{6}$/i);
    expect(contrast(fg, bg)).toBeGreaterThanOrEqual(4.5);
  });
});

it('kontrast liczy się poprawnie', () => {
  expect(contrast('#000000', '#ffffff')).toBeCloseTo(21);
  expect(contrast('#777777', '#ffffff')).toBeCloseTo(4.48, 1);
});
