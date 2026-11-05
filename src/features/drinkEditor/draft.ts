import { DRINK_LIMITS } from '../../../supabase/functions/_shared/drinkRules.ts';
import {
  getIngredient,
  getMethod,
  getMilk,
  getSyrup,
  methods,
  vessels,
  type AmountUnit,
  type DecorationKind,
  type DecorationLook,
  type Drink,
  type Extra,
  type ExtraKind,
  type LayerKind,
  type MilkPrep,
  type Temperature,
  type VesselId,
} from '../../data';
import { capitalize } from '../../lib/format';

/**
 * Kreator napoju: formularz jako czyste funkcje. Pola liczbowe są tekstem (żeby pokazać błąd
 * wpisu), a listy mają key (przesuwa się je przyciskami). Gotowy napój i tak przechodzi
 * validateDrink, te same reguły co katalog i propozycje AI.
 */

export interface ExtraDraft {
  key: number;
  ingredientId: string;
  /** Nazwa w napoju (dla syropu nazwa syropu). */
  name: string;
  /** Ilość: liczba (ml syropu albo w jednostce) albo opis, gdy unit === 'text'. */
  amount: string;
  unit: AmountUnit | 'text';
  optional: boolean;
  /** Zmiksuj z mlekiem (frappé, smoothie). */
  blended: boolean;
  /** Rodzaj dodatku (rysunek, mleko, alkohol). Nowy dodatek: z grupy składnika (extraKindFor). */
  kind: ExtraKind;
  /** Nabiał bez roślinnego zamiennika: wyklucza wersję roślinną. */
  dairy: boolean;
}

export interface LayerDraft {
  key: number;
  name: string;
  kind: LayerKind;
  color: string;
  ml: string;
}

export interface DecorationDraft {
  key: number;
  kind: DecorationKind;
  look: DecorationLook | '';
  name: string;
  color: string;
  instruction: string;
  optional: boolean;
}

export interface StepDraft {
  key: number;
  text: string;
}

export interface DrinkDraft {
  name: string;
  tagline: string;
  description: string;
  temperature: Temperature;
  prepTimeMin: string;
  methodId: string;
  alternativeMethodIds: string[];
  /** „Wszystkie metody”: bazę da się zrobić każdą metodą (alternativeMethodIds się wtedy nie liczy). */
  anyMethod: boolean;
  baseMl: string;
  baseNote: string;
  milkOn: boolean;
  /** Pierwsze mleko jest polecane. */
  milkOptions: string[];
  milkMl: string;
  milkPrep: MilkPrep;
  extras: ExtraDraft[];
  /** Sprzęt, każda rzecz w osobnej linii. */
  equipment: string;
  vessel: VesselId;
  why: string;
  /** Od dołu naczynia. */
  layers: LayerDraft[];
  decorations: DecorationDraft[];
  steps: StepDraft[];
}

let nextKey = 1;
export const newKey = () => nextKey++;

const number = new Intl.NumberFormat('pl-PL', { maximumFractionDigits: 1, useGrouping: false });
const toText = (value: number) => number.format(value);

/** „15”, „15,5”, „15.5” → liczba. null: to nie jest liczba. */
export function parseNumber(text: string): number | null {
  const normalized = text.trim().replace(',', '.');
  return /^\d+(\.\d+)?$/.test(normalized) ? Number(normalized) : null;
}

/** Ilość dodatku: „4” albo zakres „4–5” (też „4-5”). null: nieczytelna. */
export function parseAmount(text: string): { value: number; max?: number } | null {
  const [from, to, ...rest] = text.split(/[–-]/);
  if (rest.length > 0 || from === undefined) return null;
  const value = parseNumber(from);
  if (value === null) return null;
  if (to === undefined) return { value };
  const max = parseNumber(to);
  return max !== null && max > value ? { value, max } : null;
}

// ── Podpowiedzi ─────────────────────────────────────────────────────────

/** Kolory warstw na szybki wybór (nazwa dla czytnika ekranu). */
export const LAYER_COLORS: { color: string; name: string }[] = [
  { color: '#2b1a10', name: 'kawa' },
  { color: '#6b4226', name: 'kawa z mlekiem' },
  { color: '#b07a4f', name: 'latte' },
  { color: '#f7f1e6', name: 'mleko' },
  { color: '#fbf6ee', name: 'pianka' },
  { color: '#c98a3d', name: 'karmel' },
  { color: '#4a2717', name: 'czekolada' },
  { color: '#f29a2e', name: 'pomarańcza' },
  { color: '#c2334d', name: 'malina' },
  { color: '#e8f0ee', name: 'tonik' },
  { color: '#f3e3b5', name: 'wanilia' },
  { color: '#9fb36a', name: 'matcha' },
];

export const LAYER_KIND_LABELS: Record<LayerKind, string> = {
  liquid: 'płyn',
  foam: 'pianka',
  solid: 'gęste (lody, bita śmietana)',
};

export const DECORATION_LOOK_LABELS: Record<DecorationLook, string> = {
  dust: 'pył (kakao, cynamon)',
  drizzle: 'polewa',
  pieces: 'kawałki',
  slice: 'plaster owocu',
  peel: 'skórka',
  berries: 'owoce jagodowe',
  stick: 'laska (cynamon)',
  beans: 'ziarna kawy',
};

/** Jak może wyglądać dekoracja danego rodzaju (wzór na ściankach i brzeg mają jeden wygląd). */
export const LOOKS_FOR: Record<DecorationKind, DecorationLook[]> = {
  topping: ['dust', 'drizzle', 'pieces'],
  garnish: ['slice', 'peel', 'berries', 'stick', 'beans'],
  'wall-pattern': [],
  rim: [],
};

const DEFAULT_COLORS: Partial<Record<string, string>> = {
  tonik: '#e8f0ee',
  'woda-gazowana': '#e3eef2',
  'sok-pomaranczowy': '#f29a2e',
  'smietanka-30': '#fffaf0',
  'lody-waniliowe': '#f3e3b5',
  'lody-smietankowe': '#f6eedd',
  whiskey: '#b5651d',
  'likier-kawowy': '#3a1f12',
  wodka: '#eef2f3',
  maliny: '#c2334d',
};

/** Rodzaj dodatku z grupy składnika: od niego zależy rysunek (lód) i cechy (mleko, alkohol). */
export function extraKindFor(ingredientId: string): ExtraKind {
  if (ingredientId === 'lod') return 'ice';
  const group = getIngredient(ingredientId)?.group;
  switch (group) {
    case 'dairy':
      return ingredientId.startsWith('lody') ? 'ice-cream' : 'cream';
    case 'fruit':
      return 'fruit';
    case 'mixer':
      return 'mixer';
    case 'alcohol':
      return 'alcohol';
    case 'spice':
      return 'spice';
    default:
      return 'other';
  }
}

// ── Napój ↔ formularz ───────────────────────────────────────────────────

export function emptyDraft(): DrinkDraft {
  return {
    name: '',
    tagline: '',
    description: '',
    temperature: 'hot',
    prepTimeMin: '10',
    methodId: 'kawiarka',
    alternativeMethodIds: [],
    anyMethod: false,
    baseMl: '50',
    baseNote: '',
    milkOn: false,
    milkOptions: [],
    milkMl: '150',
    milkPrep: 'froth',
    extras: [],
    equipment: '',
    vessel: 'cup',
    why: '',
    layers: [{ key: newKey(), name: 'kawa', kind: 'liquid', color: '#2b1a10', ml: '50' }],
    decorations: [],
    steps: [{ key: newKey(), text: '' }],
  };
}

function extraDraft(extra: Extra): ExtraDraft {
  if (extra.kind === 'syrup') {
    return {
      key: newKey(),
      ingredientId: extra.syrupId,
      name: getSyrup(extra.syrupId)?.name ?? extra.syrupId,
      amount: toText(extra.amountMl),
      unit: 'ml',
      optional: extra.optional ?? false,
      blended: false,
      kind: 'other',
      dairy: false,
    };
  }
  const amount = extra.amount;
  return {
    key: newKey(),
    ingredientId: extra.ingredientId,
    name: extra.name,
    amount:
      typeof amount === 'string'
        ? amount
        : amount.max !== undefined
          ? `${toText(amount.value)}–${toText(amount.max)}`
          : toText(amount.value),
    unit: typeof amount === 'string' ? 'text' : amount.unit,
    optional: extra.optional ?? false,
    blended: extra.blended ?? false,
    kind: extra.kind,
    dairy: extra.dairy ?? false,
  };
}

export function drinkToDraft(drink: Drink): DrinkDraft {
  return {
    name: drink.name,
    tagline: drink.tagline,
    description: drink.description,
    temperature: drink.temperature,
    prepTimeMin: String(drink.prepTimeMin),
    methodId: drink.base.methodId,
    alternativeMethodIds: drink.base.alternativeMethodIds ?? [],
    anyMethod: drink.base.anyMethod === true,
    baseMl: toText(drink.base.amountMl),
    baseNote: drink.base.note ?? '',
    milkOn: drink.milk !== undefined,
    milkOptions: drink.milk?.options ?? [],
    milkMl: toText(drink.milk?.amountMl ?? 150),
    milkPrep: drink.milk?.prep ?? 'froth',
    extras: drink.extras.map(extraDraft),
    equipment: drink.equipment.join('\n'),
    vessel: drink.serving.vessel,
    why: drink.serving.why,
    layers: drink.layers.map((layer) => ({
      key: newKey(),
      name: layer.name,
      kind: layer.kind,
      color: layer.color,
      ml: toText(layer.volumeMl),
    })),
    decorations: drink.serving.decorations.map((decoration) => ({
      key: newKey(),
      kind: decoration.kind,
      look: decoration.look ?? '',
      name: decoration.name,
      color: decoration.color,
      instruction: decoration.instruction,
      optional: decoration.optional ?? false,
    })),
    steps: drink.steps.map((text) => ({ key: newKey(), text })),
  };
}

/** Nowy dodatek ze składnika z katalogu, z rozsądną ilością na start. */
export function newExtra(ingredientId: string): ExtraDraft {
  const syrup = getSyrup(ingredientId);
  const ingredient = getIngredient(ingredientId);
  const kind = extraKindFor(ingredientId);
  const defaults: Record<string, [string, ExtraDraft['unit']]> = {
    ice: ['4', 'cube'],
    'ice-cream': ['1', 'scoop'],
    spice: ['1', 'tsp'],
    alcohol: ['30', 'ml'],
    mixer: ['120', 'ml'],
    cream: ['30', 'ml'],
  };
  const [amount, unit] = syrup ? ['15', 'ml' as const] : (defaults[kind] ?? ['1', 'piece' as const]);
  return {
    key: newKey(),
    ingredientId,
    name: syrup?.name ?? ingredient?.name ?? ingredientId,
    amount,
    unit,
    optional: false,
    blended: false,
    kind,
    // Śmietanka i lody nie mają roślinnego zamiennika w katalogu: wykluczają wersję roślinną.
    dairy: kind === 'cream' || kind === 'ice-cream',
  };
}

const lines = (text: string) =>
  text
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);

function draftExtra(extra: ExtraDraft): Extra {
  if (getSyrup(extra.ingredientId)) {
    return {
      kind: 'syrup',
      syrupId: extra.ingredientId,
      amountMl: parseNumber(extra.amount) ?? 0,
      ...(extra.optional && { optional: true }),
    };
  }
  const amount = parseAmount(extra.amount) ?? { value: 0 };
  return {
    kind: extra.kind,
    ingredientId: extra.ingredientId,
    name: extra.name.trim(),
    amount: extra.unit === 'text' ? extra.amount.trim() : { ...amount, unit: extra.unit },
    ...(extra.optional && { optional: true }),
    ...(extra.blended && { blended: true }),
    ...(extra.dairy && { dairy: true }),
  };
}

/** Napój z formularza (bez sprawdzania: to robią draftErrors i validateDrink). */
export function draftToDrink(draft: DrinkDraft, id: string): Drink {
  const description = draft.description.trim() || draft.tagline.trim();
  const note = draft.baseNote.trim();
  const alternatives = draft.alternativeMethodIds.filter((m) => m !== draft.methodId);
  return {
    id,
    name: draft.name.trim(),
    tagline: draft.tagline.trim(),
    description,
    temperature: draft.temperature,
    prepTimeMin: Math.round(parseNumber(draft.prepTimeMin) ?? 0),
    base: {
      methodId: draft.methodId,
      amountMl: parseNumber(draft.baseMl) ?? 0,
      ...(draft.anyMethod ? { anyMethod: true as const } : alternatives.length > 0 && { alternativeMethodIds: alternatives }),
      ...(note && { note }),
    },
    ...(draft.milkOn && {
      milk: { options: draft.milkOptions, amountMl: parseNumber(draft.milkMl) ?? 0, prep: draft.milkPrep },
    }),
    extras: draft.extras.map(draftExtra),
    equipment: lines(draft.equipment),
    layers: draft.layers.map((layer) => ({
      name: layer.name.trim(),
      volumeMl: parseNumber(layer.ml) ?? 0,
      color: layer.color,
      kind: layer.kind,
    })),
    steps: draft.steps.map((step) => step.text.trim()).filter(Boolean),
    serving: {
      vessel: draft.vessel,
      why: draft.why.trim() || `${capitalize(vessels[draft.vessel].name)} pasuje do tego napoju.`,
      decorations: draft.decorations.map((decoration) => ({
        kind: decoration.kind,
        name: decoration.name.trim(),
        color: decoration.color,
        instruction: decoration.instruction.trim(),
        ...(decoration.optional && { optional: true }),
        ...(decoration.look && { look: decoration.look }),
      })),
    },
  };
}

/** Łączna objętość warstw (nieczytelne liczby pomijamy). */
export function layersTotal(draft: DrinkDraft): number {
  return draft.layers.reduce((sum, layer) => sum + (parseNumber(layer.ml) ?? 0), 0);
}

/**
 * Napój do podglądu na żywo: rysuje się zawsze, także z niedokończonego formularza (puste
 * nazwy dostają zastępcze, złe liczby i kolory są pomijane).
 */
export function previewDrink(draft: DrinkDraft): Drink {
  const drink = draftToDrink(draft, 'podglad');
  const seen = new Set<string>();
  const layers = drink.layers
    .map((layer, i) => {
      let name = layer.name || `warstwa ${i + 1}`;
      if (seen.has(name)) name = `${name} (${i + 1})`;
      seen.add(name);
      return { ...layer, name, color: /^#[0-9a-f]{6}$/i.test(layer.color) ? layer.color : '#2b1a10' };
    })
    .filter((layer) => layer.volumeMl > 0);
  // Nazwy dekoracji są kluczami w rysunku: bez powtórzeń.
  const names = new Set<string>();
  const decorations = [];
  for (const [i, decoration] of drink.serving.decorations.entries()) {
    const name = decoration.name || `dekoracja ${i + 1}`;
    if (names.has(name) || !/^#[0-9a-f]{6}$/i.test(decoration.color)) continue;
    names.add(name);
    decorations.push({ ...decoration, name });
  }
  return {
    ...drink,
    name: drink.name || 'Twój napój',
    layers: layers.length > 0 ? layers : [{ name: 'pusto', volumeMl: 1, color: '#f7f1e6', kind: 'liquid' }],
    serving: { ...drink.serving, decorations },
  };
}

/**
 * Warstwy podpowiedziane ze składników, od dołu: syropy, napoje i soki, mleko (na zimno
 * pod kawą), kawa, pianka, a na górze lody i śmietanka. Użytkownik i tak może je zmienić.
 */
export function suggestLayers(draft: DrinkDraft): LayerDraft[] {
  const layers: LayerDraft[] = [];
  const add = (name: string, kind: LayerKind, color: string, ml: number) => {
    if (ml <= 0) return;
    let unique = name;
    for (let i = 2; layers.some((l) => l.name === unique); i++) unique = `${name} ${i}`;
    layers.push({ key: newKey(), name: unique, kind, color, ml: toText(ml) });
  };
  const mlOf = (extra: ExtraDraft) => (extra.unit === 'ml' ? (parseAmount(extra.amount)?.value ?? 0) : 0);

  for (const extra of draft.extras) {
    const syrup = getSyrup(extra.ingredientId);
    if (syrup) add(syrup.name.toLowerCase(), 'liquid', syrup.color, mlOf(extra));
  }
  for (const extra of draft.extras) {
    const { kind } = extra;
    if ((kind === 'mixer' || kind === 'fruit' || kind === 'alcohol') && mlOf(extra) > 0) {
      add(extra.name || 'dodatek', 'liquid', DEFAULT_COLORS[extra.ingredientId] ?? '#e9dcc6', mlOf(extra));
    }
  }
  const milkMl = draft.milkOn ? (parseNumber(draft.milkMl) ?? 0) : 0;
  const milkColor = getMilk(draft.milkOptions[0] ?? '')?.color ?? '#f7f1e6';
  const froth = draft.milkPrep === 'froth';
  const coffee = parseNumber(draft.baseMl) ?? 0;
  const coffeeName = getMethod(draft.methodId)?.brewName ?? 'kawa';
  if (milkMl > 0 && !froth) {
    add('mleko', 'liquid', milkColor, milkMl);
    add(coffeeName, 'liquid', '#2b1a10', coffee);
  } else if (milkMl > 0) {
    add('mleko', 'liquid', milkColor, Math.round(milkMl * 0.6));
    add(coffeeName, 'liquid', '#6b4226', coffee);
    add('pianka', 'foam', '#fbf6ee', Math.round(milkMl * 0.4));
  } else {
    add(coffeeName, 'liquid', '#2b1a10', coffee);
  }
  for (const extra of draft.extras) {
    const { kind } = extra;
    if (kind === 'ice-cream' || kind === 'cream') {
      const ml = mlOf(extra) || (kind === 'ice-cream' ? 60 : 30);
      add(extra.name || 'śmietanka', kind === 'ice-cream' ? 'solid' : 'foam', DEFAULT_COLORS[extra.ingredientId] ?? '#fffaf0', ml);
    }
  }
  return layers;
}

/** Przesuwa element listy o jedno miejsce (w górę: -1, w dół: 1). */
export function move<T extends { key: number }>(list: T[], key: number, direction: -1 | 1): T[] {
  const from = list.findIndex((item) => item.key === key);
  const to = from + direction;
  if (from < 0 || to < 0 || to >= list.length) return list;
  const next = [...list];
  [next[from], next[to]] = [next[to]!, next[from]!];
  return next;
}

// ── Błędy ───────────────────────────────────────────────────────────────

export interface DrinkDraftErrors {
  name?: string;
  tagline?: string;
  description?: string;
  prepTimeMin?: string;
  baseMl?: string;
  baseNote?: string;
  milk?: string;
  extras?: string;
  layers?: string;
  decorations?: string;
  steps?: string;
  equipment?: string;
  why?: string;
  /** Błędy elementów list według key. */
  item: Record<number, string>;
}

const tooLong = (text: string, max: number) => text.trim().length > max;

/** Błędy formularza po polsku. Pusty obiekt błędów (hasErrors = false): napój da się zapisać. */
export function draftErrors(draft: DrinkDraft): DrinkDraftErrors {
  const errors: DrinkDraftErrors = { item: {} };
  const L = DRINK_LIMITS;

  if (!draft.name.trim()) errors.name = 'Nazwij napój.';
  else if (tooLong(draft.name, L.name)) errors.name = `Nazwa: najwyżej ${L.name} znaków.`;
  if (!draft.tagline.trim()) errors.tagline = 'Opisz napój w kilku słowach.';
  else if (tooLong(draft.tagline, L.tagline)) errors.tagline = `Hasło: najwyżej ${L.tagline} znaków.`;
  if (tooLong(draft.description, L.description)) errors.description = `Opis: najwyżej ${L.description} znaków.`;

  const prep = parseNumber(draft.prepTimeMin);
  if (prep === null || !Number.isInteger(prep) || prep < 1 || prep > L.prepTime) {
    errors.prepTimeMin = `Czas: pełne minuty od 1 do ${L.prepTime}.`;
  }

  const base = parseNumber(draft.baseMl);
  if (base === null || base <= 0 || base > L.volume) errors.baseMl = `Ilość kawy: od 1 do ${L.volume} ml.`;
  if (tooLong(draft.baseNote, L.note)) errors.baseNote = `Wskazówka: najwyżej ${L.note} znaków.`;

  if (draft.milkOn) {
    const milk = parseNumber(draft.milkMl);
    if (draft.milkOptions.length === 0) errors.milk = 'Wybierz co najmniej jedno mleko.';
    else if (milk === null || milk <= 0 || milk > L.volume) errors.milk = `Ilość mleka: od 1 do ${L.volume} ml.`;
  }

  if (draft.extras.length > L.extras) errors.extras = `Najwyżej ${L.extras} dodatków.`;
  for (const extra of draft.extras) {
    if (!getIngredient(extra.ingredientId)) errors.item[extra.key] = 'Nieznany składnik.';
    else if (!getSyrup(extra.ingredientId) && !extra.name.trim()) errors.item[extra.key] = 'Podaj nazwę.';
    else if (tooLong(extra.name, L.extraName)) errors.item[extra.key] = `Nazwa: najwyżej ${L.extraName} znaków.`;
    else if (extra.unit === 'text') {
      if (!extra.amount.trim()) errors.item[extra.key] = 'Opisz ilość, np. „pełna szklanka”.';
      else if (tooLong(extra.amount, L.amountText)) errors.item[extra.key] = `Ilość: najwyżej ${L.amountText} znaków.`;
    } else {
      const amount = parseAmount(extra.amount);
      if (!amount || amount.value <= 0 || (amount.max ?? amount.value) > L.volume) {
        errors.item[extra.key] = 'Podaj ilość większą od zera (albo zakres, np. 4–5).';
      }
    }
  }

  const total = layersTotal(draft);
  const capacity = vessels[draft.vessel].capacityMl;
  if (draft.layers.length === 0) errors.layers = 'Dodaj co najmniej jedną warstwę.';
  else if (draft.layers.length > L.layers) errors.layers = `Najwyżej ${L.layers} warstw.`;
  else if (total > capacity) {
    errors.layers = `Warstwy (${toText(total)} ml) nie mieszczą się w naczyniu (${capacity} ml). Zmniejsz ilości albo wybierz większe naczynie.`;
  }
  const layerNames = new Set<string>();
  for (const layer of draft.layers) {
    const name = layer.name.trim();
    const ml = parseNumber(layer.ml);
    if (!name) errors.item[layer.key] = 'Nazwij warstwę.';
    else if (tooLong(name, L.layerName)) errors.item[layer.key] = `Nazwa: najwyżej ${L.layerName} znaków.`;
    else if (layerNames.has(name)) errors.item[layer.key] = 'Dwie warstwy mają tę samą nazwę.';
    else if (ml === null || ml <= 0 || ml > L.volume) errors.item[layer.key] = 'Podaj ilość w ml.';
    else if (!/^#[0-9a-f]{6}$/i.test(layer.color)) errors.item[layer.key] = 'Wybierz kolor.';
    layerNames.add(name);
  }

  if (tooLong(draft.why, L.why)) errors.why = `Najwyżej ${L.why} znaków.`;
  if (draft.decorations.length > L.decorations) errors.decorations = `Najwyżej ${L.decorations} dekoracje.`;
  const decorationNames = new Set<string>();
  for (const decoration of draft.decorations) {
    const name = decoration.name.trim();
    if (!name) errors.item[decoration.key] = 'Nazwij dekorację.';
    else if (tooLong(name, L.decorationName)) errors.item[decoration.key] = `Nazwa: najwyżej ${L.decorationName} znaków.`;
    else if (decorationNames.has(name)) errors.item[decoration.key] = 'Dwie dekoracje mają tę samą nazwę.';
    else if (!decoration.instruction.trim()) errors.item[decoration.key] = 'Napisz, jak ją zrobić.';
    else if (tooLong(decoration.instruction, L.instruction)) errors.item[decoration.key] = `Instrukcja: najwyżej ${L.instruction} znaków.`;
    decorationNames.add(name);
  }

  const steps = draft.steps.filter((step) => step.text.trim());
  if (steps.length === 0) errors.steps = 'Dodaj co najmniej jeden krok.';
  else if (steps.length > L.steps) errors.steps = `Najwyżej ${L.steps} kroków.`;
  for (const step of draft.steps) {
    if (tooLong(step.text, L.step)) errors.item[step.key] = `Krok: najwyżej ${L.step} znaków.`;
  }

  const equipment = lines(draft.equipment);
  if (equipment.length > L.equipment) errors.equipment = `Najwyżej ${L.equipment} rzeczy.`;
  else if (equipment.some((item) => item.length > L.equipmentItem)) errors.equipment = `Każda rzecz: najwyżej ${L.equipmentItem} znaków.`;

  return errors;
}

export function hasErrors(errors: DrinkDraftErrors): boolean {
  const { item, ...fields } = errors;
  return Object.values(fields).some(Boolean) || Object.keys(item).length > 0;
}

/** Metody do wyboru bazy (kawa rozpuszczalna też: baza dalgony). */
export const BASE_METHODS = methods;

/**
 * Zaznaczenie albo odznaczenie metody alternatywnej (kolejność jak na liście metod). Odznaczenie jednej
 * przy „Wszystkich metodach” zostawia pozostałe, a zaznaczenie wszystkich po kolei to „Wszystkie metody”.
 */
export function toggleAlternative(draft: DrinkDraft, methodId: string): Pick<DrinkDraft, 'anyMethod' | 'alternativeMethodIds'> {
  const others = BASE_METHODS.map((m) => m.id).filter((id) => id !== draft.methodId);
  const chosen = new Set(draft.anyMethod ? others : draft.alternativeMethodIds);
  if (chosen.has(methodId)) chosen.delete(methodId);
  else chosen.add(methodId);
  const next = others.filter((id) => chosen.has(id));
  return next.length === others.length ? { anyMethod: true, alternativeMethodIds: [] } : { anyMethod: false, alternativeMethodIds: next };
}
