import { parseRecipeInput, type RecipeInput } from './recipe';

/**
 * Przepis w linku: /przepis#1.<base64url z JSON>. Dane są po znaku #, więc nie trafiają na serwer.
 * Ustawienie młynka zostaje u nadawcy: każdy ma inny młynek.
 */
export const SHARE_VERSION = 1;
export const SHARE_PATH = '/przepis';

/** Dłuższego linku nie wygeneruje żaden poprawny przepis (limity w RECIPE_LIMITS). */
const MAX_CODE_LENGTH = 30_000;

/** Krok w linku: [polecenie, szczegóły albo 0, sekundy albo 0, 1 = działanie]. */
type PackedStep = [string, string | 0, number, 0 | 1];

interface Packed {
  m: string;
  n: string;
  c: number;
  w: number;
  t: [number, number];
  g: string;
  s: PackedStep[];
  o?: string;
}

function toBase64Url(text: string): string {
  const bytes = new TextEncoder().encode(text);
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function fromBase64Url(code: string): string {
  const binary = atob(code.replace(/-/g, '+').replace(/_/g, '/'));
  const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
  return new TextDecoder('utf-8', { fatal: true }).decode(bytes);
}

export function encodeRecipe(recipe: RecipeInput): string {
  const packed: Packed = {
    m: recipe.methodId,
    n: recipe.name,
    c: recipe.dose.coffeeG,
    w: recipe.dose.waterMl,
    t: [recipe.waterTempC.min, recipe.waterTempC.max],
    g: recipe.grind,
    s: recipe.steps.map((step) => [step.text, step.detail ?? 0, step.durationSec ?? 0, step.action ? 1 : 0]),
    ...(recipe.note && { o: recipe.note }),
  };
  return `${SHARE_VERSION}.${toBase64Url(JSON.stringify(packed))}`;
}

function unpackStep(value: unknown) {
  if (!Array.isArray(value) || value.length !== 4) return null;
  const [text, detail, durationSec, action] = value as unknown[];
  return {
    text,
    ...(detail !== 0 && { detail }),
    ...(durationSec !== 0 && { durationSec }),
    action: action === 1 ? true : action === 0 ? false : null,
  };
}

/** Przepis z linku. null: link jest uszkodzony, z innej wersji albo przepis jest błędny. */
export function decodeRecipe(code: string): RecipeInput | null {
  const [version, data] = code.split('.', 2);
  if (version !== String(SHARE_VERSION) || !data || code.length > MAX_CODE_LENGTH) return null;
  try {
    const packed = JSON.parse(fromBase64Url(data)) as Partial<Packed>;
    if (typeof packed !== 'object' || packed === null || !Array.isArray(packed.s) || !Array.isArray(packed.t)) {
      return null;
    }
    return parseRecipeInput({
      methodId: packed.m,
      name: packed.n,
      dose: { coffeeG: packed.c, waterMl: packed.w },
      waterTempC: { min: packed.t[0], max: packed.t[1] },
      grind: packed.g,
      steps: packed.s.map(unpackStep),
      ...(packed.o !== undefined && { note: packed.o }),
    });
  } catch {
    return null;
  }
}

/** Pełny link do przepisu. */
export function shareUrl(recipe: RecipeInput, origin = window.location.origin): string {
  return `${origin}${SHARE_PATH}#${encodeRecipe(recipe)}`;
}

/** Ten sam przepis bez względu na młynek (np. już zapisany z tego samego linku). */
export const sameRecipe = (a: RecipeInput, b: RecipeInput) => encodeRecipe(a) === encodeRecipe(b);
