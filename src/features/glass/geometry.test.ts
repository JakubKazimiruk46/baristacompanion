import { describe, expect, it } from 'vitest';
import type { Layer, VesselId } from '../../data';
import {
  fillFraction,
  halfWidthAt,
  layoutBands,
  layoutLabels,
  lighten,
  outlinePath,
  VESSEL_SHAPES,
  wrapLabel,
} from './geometry';

const layer = (name: string, volumeMl: number): Layer => ({
  name,
  volumeMl,
  color: '#000000',
  kind: 'liquid',
});

describe('kształty naczyń', () => {
  it.each(Object.keys(VESSEL_SHAPES) as VesselId[])('%s: poprawny obrys', (id) => {
    const shape = VESSEL_SHAPES[id];
    expect(shape.top).toBeLessThan(shape.bottom);
    expect(shape.hw(0)).toBeGreaterThan(0);
    expect(outlinePath(shape)).toMatch(/^M[\d. L-]+ Z$/);
  });

  it('szerokość liczy się od brzegu do dna', () => {
    const glass = VESSEL_SHAPES['tall-glass'];
    expect(halfWidthAt(glass, glass.top)).toBe(50);
    expect(halfWidthAt(glass, glass.bottom)).toBe(42);
    // Poza naczyniem: wartości brzegowe.
    expect(halfWidthAt(glass, 0)).toBe(50);
  });
});

describe('layoutBands', () => {
  const shape = VESSEL_SHAPES['tall-glass'];

  it('warstwy leżą od dna, jedna na drugiej, w proporcjach', () => {
    const { bands, liquidTop } = layoutBands([layer('mleko', 150), layer('kawa', 50)], shape, 0.5);
    expect(bands[0]!.bottom).toBe(shape.bottom);
    expect(bands[0]!.top).toBeCloseTo(bands[1]!.bottom);
    expect(bands[1]!.top).toBeCloseTo(liquidTop);
    const h = (i: number) => bands[i]!.bottom - bands[i]!.top;
    expect(h(0) / h(1)).toBeCloseTo(3);
    expect(shape.bottom - liquidTop).toBeCloseTo((shape.bottom - shape.top) * 0.5);
  });

  it('cienka warstwa dostaje minimalną wysokość', () => {
    const { bands } = layoutBands([layer('syrop', 5), layer('mleko', 500)], shape, 0.8);
    const total = (shape.bottom - shape.top) * 0.8;
    expect(bands[0]!.bottom - bands[0]!.top).toBeGreaterThanOrEqual(total * 0.06);
  });
});

describe('fillFraction', () => {
  it('lód podnosi poziom, ale nie ponad 90%', () => {
    expect(fillFraction(200, 400, false)).toBe(0.5);
    expect(fillFraction(200, 400, true)).toBeCloseTo(0.6);
    expect(fillFraction(400, 400, true)).toBe(0.9);
    expect(fillFraction(10, 400, false)).toBe(0.3);
  });
});

describe('podpisy', () => {
  it('wrapLabel dzieli po słowach', () => {
    expect(wrapLabel('kawa')).toEqual(['kawa']);
    expect(wrapLabel('kawa z mlekiem i czekoladą')).toEqual(['kawa z mlekiem i', 'czekoladą']);
  });

  it('layoutLabels rozsuwa nachodzące bloki i trzyma je w obszarze', () => {
    const blocks = [
      { center: 100, height: 26 },
      { center: 104, height: 26 },
      { center: 108, height: 39 },
    ];
    const tops = layoutLabels(blocks, 0, 300, 6);
    const sorted = blocks.map((b, i) => ({ top: tops[i]!, bottom: tops[i]! + b.height })).sort((a, b) => a.top - b.top);
    for (let i = 1; i < sorted.length; i++) {
      expect(sorted[i]!.top).toBeGreaterThanOrEqual(sorted[i - 1]!.bottom + 6 - 1e-9);
    }
  });

  it('layoutLabels przesuwa bloki w górę przy dolnej krawędzi', () => {
    const tops = layoutLabels(
      [
        { center: 250, height: 26 },
        { center: 252, height: 26 },
      ],
      0,
      260,
      6,
    );
    expect(Math.max(...tops) + 26).toBeLessThanOrEqual(260);
  });
});

it('lighten miesza z bielą', () => {
  expect(lighten('#000000', 0.5)).toBe('#808080');
  expect(lighten('#ffffff', 0.3)).toBe('#ffffff');
});
