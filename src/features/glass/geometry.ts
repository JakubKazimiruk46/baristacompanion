import type { Layer, VesselId } from '../../data';

// Układ współrzędnych rysunku: naczynie po lewej (środek CX), podpisy po prawej.
export const VIEW_W = 320;
export const VIEW_H = 260;
export const CX = 95;
/** Szerokość wycinka z samym naczyniem (miniatura bez podpisów). */
export const VESSEL_VIEW_W = 190;

export type VesselKind = 'glass' | 'cup' | 'stemmed';

export interface VesselShape {
  /** Górna krawędź wnętrza (brzeg). */
  top: number;
  /** Dno wnętrza. */
  bottom: number;
  /** Połowa szerokości wnętrza; t = 0 przy brzegu, t = 1 na dnie. */
  hw: (t: number) => number;
  wall: number;
  /** Grubość szklanego dna pod wnętrzem. */
  base: number;
  kind: VesselKind;
}

/** Profil filiżanki: proste ścianki, a niżej zaokrąglenie do węższego dna. */
const cupProfile = (top: number, bottom: number, curveFrom: number) => (t: number) => {
  const k = Math.max(0, (t - curveFrom) / (1 - curveFrom));
  return (bottom + (top - bottom) * Math.sqrt(1 - k * k)) * (1 - 0.05 * t);
};

export const VESSEL_SHAPES: Record<VesselId, VesselShape> = {
  'tall-glass': { top: 26, bottom: 232, hw: (t) => 50 - 8 * t, wall: 4, base: 14, kind: 'glass' },
  'low-glass': { top: 112, bottom: 232, hw: (t) => 62 - 6 * t, wall: 4.5, base: 16, kind: 'glass' },
  'small-glass': { top: 150, bottom: 234, hw: (t) => 38 - 5 * t, wall: 3.5, base: 12, kind: 'glass' },
  'dessert-glass': {
    top: 128,
    bottom: 196,
    hw: (t) => 70 * Math.sqrt(Math.max(0, 1 - t * t)),
    wall: 4,
    base: 0,
    kind: 'stemmed',
  },
  cup: { top: 136, bottom: 226, hw: cupProfile(64, 28, 0.4), wall: 6, base: 0, kind: 'cup' },
  'espresso-cup': {
    top: 172,
    bottom: 226,
    hw: cupProfile(42, 20, 0.35),
    wall: 5,
    base: 0,
    kind: 'cup',
  },
};

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));
const round = (n: number) => Math.round(n * 10) / 10;

export function tAt(shape: VesselShape, y: number): number {
  return clamp((y - shape.top) / (shape.bottom - shape.top), 0, 1);
}

export function halfWidthAt(shape: VesselShape, y: number): number {
  return shape.hw(tAt(shape, y));
}

/**
 * Obrys naczynia jako ścieżka SVG: lewa ścianka z góry na dół, dno, prawa ścianka w górę.
 * offset poszerza obrys (ścianka), extraBottom obniża dno (grube szklane dno).
 */
export function outlinePath(shape: VesselShape, offset = 0, extraBottom = 0, steps = 32): string {
  const left: string[] = [];
  const right: string[] = [];
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const y = shape.top + t * (shape.bottom - shape.top);
    const w = shape.hw(t) + offset;
    left.push(`${round(CX - w)} ${round(y)}`);
    right.unshift(`${round(CX + w)} ${round(y)}`);
  }
  const bottomW = shape.hw(1) + offset;
  const floor = shape.bottom + extraBottom;
  const base = extraBottom
    ? [`${round(CX - bottomW)} ${round(floor)}`, `${round(CX + bottomW)} ${round(floor)}`]
    : [];
  return `M${[...left, ...base, ...right].join(' L')} Z`;
}

/** Ile wysokości wnętrza zajmuje napój. Lód wypycha płyn wyżej. */
export function fillFraction(totalMl: number, capacityMl: number, withIce: boolean): number {
  return clamp((totalMl / capacityMl) * (withIce ? 1.2 : 1), 0.3, 0.9);
}

export interface LayerBand {
  layer: Layer;
  top: number;
  bottom: number;
}

/** Układa warstwy od dna, proporcjonalnie do objętości. Cienkie warstwy dostają minimum, żeby były widoczne. */
export function layoutBands(
  layers: Layer[],
  shape: VesselShape,
  fraction: number,
): { bands: LayerBand[]; liquidTop: number } {
  const height = (shape.bottom - shape.top) * fraction;
  const total = layers.reduce((sum, layer) => sum + layer.volumeMl, 0);
  const minH = height * 0.07;
  const raw = layers.map((layer) => Math.max((height * layer.volumeMl) / total, minH));
  const scale = height / raw.reduce((sum, h) => sum + h, 0);

  let y = shape.bottom;
  const bands = layers.map((layer, index) => {
    const h = raw[index]! * scale;
    const band = { layer, top: y - h, bottom: y };
    y -= h;
    return band;
  });
  return { bands, liquidTop: shape.bottom - height };
}

/** Gałka lodów w swojej warstwie: koło leżące na dnie warstwy. */
export function scoop(band: LayerBand, shape: VesselShape) {
  const height = band.bottom - band.top;
  const r = Math.min(halfWidthAt(shape, band.top + height / 2) * 0.75, height * 0.62);
  return { cx: CX, cy: band.bottom - r * 0.9, r };
}

/** Powierzchnia, na której leży posypka: elipsa w perspektywie. */
export interface Surface {
  cx: number;
  y: number;
  rx: number;
  ry: number;
}

/** Powtarzalny generator liczb pseudolosowych (ta sama posypka przy każdym renderze). */
export function seededRandom(seed: string): () => number {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) h = Math.imul(h ^ seed.charCodeAt(i), 16777619);
  return () => {
    h = Math.imul(h ^ (h >>> 15), 2246822507);
    h = Math.imul(h ^ (h >>> 13), 3266489909);
    return ((h ^= h >>> 16) >>> 0) / 4294967296;
  };
}

/** Kostki lodu w górnej części napoju (lód pływa). */
export function iceCubes(shape: VesselShape, liquidTop: number, count: number) {
  const pattern = [
    [-0.42, -0.06, -12],
    [0.12, -0.02, 9],
    [0.5, 0.12, -6],
    [-0.18, 0.3, 14],
    [0.32, 0.42, -10],
    [-0.5, 0.55, 7],
  ] as const;
  const fillH = shape.bottom - liquidTop;
  return pattern.slice(0, count).map(([rx, ry, rotate]) => {
    const y = liquidTop + ry * fillH;
    const hw = halfWidthAt(shape, y);
    const size = clamp(hw * 0.42, 13, 24);
    return { x: CX + rx * hw - size / 2, y, size, rotate };
  });
}

/** Dzieli podpis na linie po słowach. */
export function wrapLabel(text: string, maxChars = 16): string[] {
  const lines: string[] = [];
  let line = '';
  for (const word of text.split(' ')) {
    if (line && (line + ' ' + word).length > maxChars) {
      lines.push(line);
      line = word;
    } else {
      line = line ? `${line} ${word}` : word;
    }
  }
  if (line) lines.push(line);
  return lines;
}

/**
 * Rozsuwa podpisy w pionie, żeby się nie nakładały. Zwraca górną krawędź każdego bloku
 * (w kolejności wejścia). Bloki starają się stać na wysokości swojej warstwy.
 */
export function layoutLabels(
  blocks: { center: number; height: number }[],
  minY: number,
  maxY: number,
  gap = 6,
): number[] {
  const order = blocks.map((block, index) => ({ ...block, index })).sort((a, b) => a.center - b.center);
  const tops = order.map((block) => block.center - block.height / 2);

  // Z góry na dół: każdy blok poniżej poprzedniego.
  for (let i = 0; i < order.length; i++) {
    const prevBottom = i === 0 ? minY : tops[i - 1]! + order[i - 1]!.height + gap;
    tops[i] = Math.max(tops[i]!, prevBottom);
  }
  // Z dołu do góry: jeśli ostatni wyszedł poza obszar, przesuń całość w górę.
  for (let i = order.length - 1; i >= 0; i--) {
    const limit = i === order.length - 1 ? maxY : tops[i + 1]! - gap;
    tops[i] = Math.min(tops[i]!, limit - order[i]!.height);
  }

  const result = new Array<number>(blocks.length);
  order.forEach((block, i) => {
    result[block.index] = tops[i]!;
  });
  return result;
}

/** Miesza kolor z bielą (amount 0–1). */
export function lighten(hex: string, amount: number): string {
  const n = parseInt(hex.slice(1), 16);
  const mix = (c: number) => Math.round(c + (255 - c) * amount);
  const r = mix((n >> 16) & 255);
  const g = mix((n >> 8) & 255);
  const b = mix(n & 255);
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`;
}
