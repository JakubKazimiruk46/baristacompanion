import { describe, expect, it } from 'vitest';
import { describeGuess, normalize, parseLabel } from './parseLabel';

describe('etykiety po polsku', () => {
  it('specialty: nazwa z pochodzeniem, jasne palenie, nuty i single origin', () => {
    const text = `PALARNIA KAWY PRZYKŁADOWA
ETIOPIA YIRGACHEFFE
Kawa ziarnista 250 g
Stopień palenia: jasny
Nuty: jaśmin, bergamotka, brzoskwinia
Proces: myty  |  Wysokość: 1900-2100 m n.p.m.
Data palenia: 12.09.2026`;
    expect(parseLabel(text)).toEqual({
      name: 'Etiopia Yirgacheffe',
      roaster: 'Palarnia Kawy Przykładowa',
      roast: 'light',
      notes: ['fruity', 'floral', 'citrus'],
      origin: 'Etiopia',
      kind: 'single-origin',
    });
  });

  it('mieszanka do kawiarki: średnie palenie, czekolada i orzechy', () => {
    const text = `Poranna Mieszanka
Brazylia + Kolumbia
średnio palona
Smak: mleczna czekolada, orzech laskowy, karmel
1 kg`;
    const guess = parseLabel(text);
    expect(guess).toMatchObject({
      name: 'Poranna Mieszanka',
      roast: 'medium',
      notes: ['chocolate', 'nutty', 'caramel'],
      origin: 'Brazylia, Kolumbia',
      kind: 'blend',
    });
  });

  it('OCR gubi polskie znaki: dalej rozpoznaje', () => {
    const guess = parseLabel('KOSTARYKA TARRAZU\nciemno palona\nnuty: gorzka czekolada, zurawina, sliwka');
    expect(guess.roast).toBe('dark');
    expect(guess.origin).toBe('Kostaryka');
    expect(guess.notes).toEqual(['chocolate', 'fruity']);
  });

  it('bez wprost podanego palenia: „do filtra” to jasne, „do espresso” średnie', () => {
    expect(parseLabel('Kenia Nyeri\nkawa do przelewu').roast).toBe('light');
    expect(parseLabel('Brazylia Cerrado\nidealna do espresso i kawiarki').roast).toBe('medium');
  });
});

describe('etykiety po angielsku', () => {
  it('light roast, tasting notes, single origin', () => {
    const text = `COLOMBIA EL PARAÍSO
Single Origin · Washed
LIGHT ROAST
Tasting notes: red apple, honey, lime
340g`;
    expect(parseLabel(text)).toEqual({
      name: 'Colombia El Paraíso',
      roast: 'light',
      notes: ['caramel', 'fruity', 'citrus'],
      origin: 'Kolumbia',
      kind: 'single-origin',
    });
  });

  it('„dark chocolate” i „body: medium” nie są paleniem', () => {
    const guess = parseLabel('House Blend\nNotes: dark chocolate, almond\nBody: medium\nAcidity: low');
    expect(guess.roast).toBeUndefined();
    expect(guess.notes).toEqual(['chocolate', 'nutty']);
    expect(guess.kind).toBe('blend');
  });

  it('„nutmeg” to przyprawa, a nie orzech', () => {
    expect(parseLabel('Notes: nutmeg, plum').notes).toEqual(['fruity', 'spicy']);
  });
});

describe('słaby odczyt', () => {
  it('sam szum nie daje nic', () => {
    const guess = parseLabel('|| ~~ 250 g 12/09\n@@@\n');
    expect(guess).toEqual({ notes: [] });
    expect(describeGuess(guess)).toBeNull();
  });

  it('podsumowanie po polsku', () => {
    expect(
      describeGuess({ name: 'Kenia AA', roast: 'light', notes: ['fruity', 'citrus'], origin: 'Kenia' }),
    ).toBe('Z etykiety: nazwa „Kenia AA”; palenie jasne; nuty: owocowe, cytrusowe; pochodzenie: Kenia.');
  });

  it('normalize usuwa polskie znaki', () => {
    expect(normalize('Średnio PALONA, żurawina, łąka')).toBe('srednio palona, zurawina, laka');
  });
});
