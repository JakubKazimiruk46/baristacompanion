import { describe, expect, it } from 'vitest';
import { chroma, contrastRatio, hexToHsl, hslToHex } from './color';

describe('kolory', () => {
  it('kontrast wg WCAG', () => {
    expect(contrastRatio('#000000', '#ffffff')).toBeCloseTo(21);
    expect(contrastRatio('#777777', '#ffffff')).toBeCloseTo(4.48, 1);
  });

  it('HSL tam i z powrotem', () => {
    for (const hex of ['#f08a24', '#4a2a1a', '#e4ecee', '#c7283f', '#808080']) {
      expect(hslToHex(hexToHsl(hex))).toBe(hex);
    }
    expect(hexToHsl('#ff0000')).toEqual({ h: 0, s: 1, l: 0.5 });
  });

  it('nasycenie: szarość 0, czysty kolor 1', () => {
    expect(chroma('#808080')).toBe(0);
    expect(chroma('#ff0000')).toBe(1);
  });
});
