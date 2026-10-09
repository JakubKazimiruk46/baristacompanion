// Reguły spójności napoju (schemat Drink z src/data/types.ts). Czysty moduł bez importów, z katalogiem
// w parametrze: korzysta z niego aplikacja (src/data/validate.ts, test danych, „Moje napoje”) i funkcja
// drink-assistant (Deno), która sprawdza propozycję AI, zanim ją odeśle.

export const TEMPERATURES = ['hot', 'cold'] as const;
export const MILK_PREPS = ['froth', 'warm', 'blend', 'plain'] as const;
export const LAYER_KINDS = ['liquid', 'foam', 'solid'] as const;
export const EXTRA_KINDS = ['fruit', 'ice-cream', 'cream', 'spice', 'mixer', 'alcohol', 'ice', 'other'] as const;
export const AMOUNT_UNITS = ['ml', 'g', 'cube', 'scoop', 'tsp', 'piece'] as const;
export const DECORATION_KINDS = ['wall-pattern', 'rim', 'topping', 'garnish'] as const;
export const DECORATION_LOOKS = ['dust', 'drizzle', 'pieces', 'slice', 'peel', 'berries', 'stick', 'beans'] as const;

/** Granice tekstów i list: katalog się w nich mieści, a odpowiedź AI nie może ich przekroczyć. */
export const DRINK_LIMITS = {
  name: 60,
  tagline: 120,
  description: 500,
  note: 300,
  why: 300,
  step: 300,
  steps: 12,
  layers: 6,
  layerName: 40,
  extras: 12,
  extraName: 80,
  amountText: 60,
  decorations: 4,
  decorationName: 60,
  instruction: 400,
  equipment: 10,
  equipmentItem: 80,
  /** ml bazy, mleka i warstwy. */
  volume: 1000,
  /** Minuty, razem z maceracją cold brew. */
  prepTime: 2000,
} as const;

/** Dane, które reguły muszą znać: same id i to, co potrzebne do sprawdzenia. */
export interface DrinkCatalog {
  methods: { id: string }[];
  milks: { id: string; plantBased: boolean }[];
  /** Cały katalog składników: mleka (milk), syropy (syrup) i dodatki. */
  ingredients: { id: string; group: string }[];
  vessels: { id: string; capacityMl: number }[];
  /** Adresy innych ekranów pod /napoje/: id napoju nie może ich zająć. */
  reservedIds?: string[];
}

const HEX = /^#[0-9a-f]{6}$/i;
const SLUG = /^[a-z0-9]+(-[a-z0-9]+)*$/;

type Obj = Record<string, unknown>;
const isObj = (value: unknown): value is Obj => typeof value === 'object' && value !== null && !Array.isArray(value);
const isNum = (value: unknown): value is number => typeof value === 'number' && Number.isFinite(value);
const oneOf = (list: readonly string[], value: unknown) => typeof value === 'string' && list.includes(value);

/**
 * Sprawdza napój. Zwraca listę błędów po polsku (pusta: napój jest poprawny). Działa na danych
 * z katalogu i na niezaufanych danych z AI albo z zapisu: nigdy nie rzuca wyjątku.
 */
export function validateDrinkWith(value: unknown, catalog: DrinkCatalog): string[] {
  const errors: string[] = [];
  const err = (message: string) => errors.push(message);
  const text = (v: unknown, label: string, max: number, required = true) => {
    if (v === undefined && !required) return;
    if (typeof v !== 'string' || !v.trim()) err(`${label}: brak tekstu.`);
    else if (v.length > max) err(`${label}: najwyżej ${max} znaków.`);
  };
  const positive = (v: unknown, label: string, max: number) => {
    if (!isNum(v) || v <= 0) err(`${label}: liczba większa od zera.`);
    else if (v > max) err(`${label}: najwyżej ${max}.`);
  };
  const flag = (v: unknown, label: string) => {
    if (v !== undefined && typeof v !== 'boolean') err(`${label}: true albo false.`);
  };

  if (!isObj(value)) return ['Napój musi być obiektem.'];
  const d = value;
  const methodIds = new Set(catalog.methods.map((m) => m.id));
  const milkIds = new Set(catalog.milks.map((m) => m.id));
  const groups = new Map(catalog.ingredients.map((i) => [i.id, i.group]));
  const vessel = catalog.vessels.find((v) => v.id === (isObj(d.serving) ? d.serving.vessel : undefined));

  if (typeof d.id !== 'string' || !SLUG.test(d.id)) err('id: slug z małych liter, cyfr i myślników.');
  else if (catalog.reservedIds?.includes(d.id)) err(`id „${d.id}” zajmuje adres innego ekranu.`);
  text(d.name, 'Nazwa', DRINK_LIMITS.name);
  text(d.tagline, 'Hasło', DRINK_LIMITS.tagline);
  text(d.description, 'Opis', DRINK_LIMITS.description);
  if (!oneOf(TEMPERATURES, d.temperature)) err('temperature: „hot” albo „cold”.');
  if (!isNum(d.prepTimeMin) || !Number.isInteger(d.prepTimeMin) || d.prepTimeMin <= 0) {
    err('prepTimeMin: pełne minuty, więcej niż 0.');
  } else if (d.prepTimeMin > DRINK_LIMITS.prepTime) err(`prepTimeMin: najwyżej ${DRINK_LIMITS.prepTime}.`);

  // Baza kawowa
  if (!isObj(d.base)) err('base: brak bazy kawowej.');
  else {
    if (!methodIds.has(d.base.methodId as string)) err(`base.methodId: nieznana metoda „${String(d.base.methodId)}”.`);
    positive(d.base.amountMl, 'base.amountMl', DRINK_LIMITS.volume);
    const alternatives = d.base.alternativeMethodIds;
    if (alternatives !== undefined) {
      if (!Array.isArray(alternatives)) err('base.alternativeMethodIds: lista id metod.');
      else {
        for (const id of alternatives) if (!methodIds.has(id as string)) err(`base.alternativeMethodIds: nieznana metoda „${String(id)}”.`);
        if (alternatives.includes(d.base.methodId)) err('base.alternativeMethodIds: bez metody głównej.');
        if (new Set(alternatives).size !== alternatives.length) err('base.alternativeMethodIds: bez powtórzeń.');
      }
    }
    text(d.base.note, 'base.note', DRINK_LIMITS.note, false);
  }

  // Mleko
  if (d.milk !== undefined) {
    if (!isObj(d.milk)) err('milk: obiekt albo brak.');
    else {
      const options = d.milk.options;
      if (!Array.isArray(options) || options.length === 0) err('milk.options: co najmniej jedno mleko.');
      else {
        for (const id of options) if (!milkIds.has(id as string)) err(`milk.options: nieznane mleko „${String(id)}”.`);
        if (new Set(options).size !== options.length) err('milk.options: bez powtórzeń.');
      }
      positive(d.milk.amountMl, 'milk.amountMl', DRINK_LIMITS.volume);
      if (!oneOf(MILK_PREPS, d.milk.prep)) err(`milk.prep: jedno z: ${MILK_PREPS.join(', ')}.`);
    }
  }

  // Dodatki
  if (!Array.isArray(d.extras)) err('extras: lista (może być pusta).');
  else {
    if (d.extras.length > DRINK_LIMITS.extras) err(`extras: najwyżej ${DRINK_LIMITS.extras}.`);
    d.extras.forEach((extra, i) => {
      const label = `extras[${i}]`;
      if (!isObj(extra)) {
        err(`${label}: obiekt.`);
        return;
      }
      flag(extra.optional, `${label}.optional`);
      if (extra.kind === 'syrup') {
        if (groups.get(extra.syrupId as string) !== 'syrup') err(`${label}.syrupId: nieznany syrop „${String(extra.syrupId)}”.`);
        positive(extra.amountMl, `${label}.amountMl`, DRINK_LIMITS.volume);
        return;
      }
      if (!oneOf(EXTRA_KINDS, extra.kind)) err(`${label}.kind: jedno z: syrup, ${EXTRA_KINDS.join(', ')}.`);
      const group = groups.get(extra.ingredientId as string);
      if (!group) err(`${label}.ingredientId: nieznany składnik „${String(extra.ingredientId)}”.`);
      else if (group === 'milk' || group === 'syrup') err(`${label}.ingredientId: mleko idzie przez milk, a syrop przez kind „syrup”.`);
      else if ((extra.kind === 'alcohol') !== (group === 'alcohol')) err(`${label}: alkohol tylko jako kind „alcohol” i odwrotnie.`);
      text(extra.name, `${label}.name`, DRINK_LIMITS.extraName);
      const amount = extra.amount;
      if (typeof amount === 'string') text(amount, `${label}.amount`, DRINK_LIMITS.amountText);
      else if (!isObj(amount)) err(`${label}.amount: ilość albo opis.`);
      else {
        positive(amount.value, `${label}.amount.value`, DRINK_LIMITS.volume);
        if (amount.max !== undefined && (!isNum(amount.max) || !isNum(amount.value) || amount.max <= amount.value)) {
          err(`${label}.amount.max: większe niż value.`);
        }
        if (!oneOf(AMOUNT_UNITS, amount.unit)) err(`${label}.amount.unit: jedno z: ${AMOUNT_UNITS.join(', ')}.`);
      }
      flag(extra.blended, `${label}.blended`);
      flag(extra.dairy, `${label}.dairy`);
    });
  }

  // Sprzęt i kroki
  if (!Array.isArray(d.equipment)) err('equipment: lista (może być pusta).');
  else {
    if (d.equipment.length > DRINK_LIMITS.equipment) err(`equipment: najwyżej ${DRINK_LIMITS.equipment}.`);
    d.equipment.forEach((item, i) => text(item, `equipment[${i}]`, DRINK_LIMITS.equipmentItem));
  }
  if (!Array.isArray(d.steps) || d.steps.length === 0) err('steps: co najmniej jeden krok.');
  else {
    if (d.steps.length > DRINK_LIMITS.steps) err(`steps: najwyżej ${DRINK_LIMITS.steps}.`);
    d.steps.forEach((step, i) => text(step, `steps[${i}]`, DRINK_LIMITS.step));
  }

  // Warstwy od dołu
  let total = 0;
  if (!Array.isArray(d.layers) || d.layers.length === 0) err('layers: co najmniej jedna warstwa.');
  else {
    if (d.layers.length > DRINK_LIMITS.layers) err(`layers: najwyżej ${DRINK_LIMITS.layers}.`);
    const names = new Set<string>();
    d.layers.forEach((layer, i) => {
      const label = `layers[${i}]`;
      if (!isObj(layer)) {
        err(`${label}: obiekt.`);
        return;
      }
      text(layer.name, `${label}.name`, DRINK_LIMITS.layerName);
      if (typeof layer.name === 'string') {
        // Nazwy warstw są kluczami w rysunku szklanki.
        if (names.has(layer.name)) err(`${label}.name: nazwy warstw bez powtórzeń.`);
        names.add(layer.name);
      }
      positive(layer.volumeMl, `${label}.volumeMl`, DRINK_LIMITS.volume);
      if (isNum(layer.volumeMl)) total += layer.volumeMl;
      if (typeof layer.color !== 'string' || !HEX.test(layer.color)) err(`${label}.color: kolor #rrggbb.`);
      if (!oneOf(LAYER_KINDS, layer.kind)) err(`${label}.kind: jedno z: ${LAYER_KINDS.join(', ')}.`);
    });
  }

  // Podanie
  if (!isObj(d.serving)) err('serving: brak podania.');
  else {
    if (!vessel) err(`serving.vessel: nieznane naczynie „${String(d.serving.vessel)}”.`);
    else if (total > vessel.capacityMl) err(`Warstwy (${total} ml) nie mieszczą się w naczyniu (${vessel.capacityMl} ml).`);
    text(d.serving.why, 'serving.why', DRINK_LIMITS.why);
    const decorations = d.serving.decorations;
    if (!Array.isArray(decorations)) err('serving.decorations: lista (może być pusta).');
    else {
      if (decorations.length > DRINK_LIMITS.decorations) err(`serving.decorations: najwyżej ${DRINK_LIMITS.decorations}.`);
      const names = new Set<string>();
      decorations.forEach((decoration, i) => {
        const label = `serving.decorations[${i}]`;
        if (!isObj(decoration)) {
          err(`${label}: obiekt.`);
          return;
        }
        if (!oneOf(DECORATION_KINDS, decoration.kind)) err(`${label}.kind: jedno z: ${DECORATION_KINDS.join(', ')}.`);
        text(decoration.name, `${label}.name`, DRINK_LIMITS.decorationName);
        if (typeof decoration.name === 'string') {
          if (names.has(decoration.name)) err(`${label}.name: nazwy dekoracji bez powtórzeń.`);
          names.add(decoration.name);
        }
        if (typeof decoration.color !== 'string' || !HEX.test(decoration.color)) err(`${label}.color: kolor #rrggbb.`);
        text(decoration.instruction, `${label}.instruction`, DRINK_LIMITS.instruction);
        flag(decoration.optional, `${label}.optional`);
        if (decoration.look !== undefined && !oneOf(DECORATION_LOOKS, decoration.look)) {
          err(`${label}.look: jedno z: ${DECORATION_LOOKS.join(', ')}.`);
        }
      });
    }
  }

  return errors;
}

/**
 * Napój z niezaufanych danych (AI, zapis) bez pól, których schemat nie zna, i bez null
 * (AI zwraca null tam, gdzie pole jest opcjonalne). Wynik i tak trzeba sprawdzić validateDrinkWith.
 */
export function normalizeDrink(value: unknown): unknown {
  if (!isObj(value)) return value;
  const pick = (source: unknown, keys: string[]): Obj | unknown => {
    if (!isObj(source)) return source;
    const out: Obj = {};
    for (const key of keys) {
      const v = source[key];
      if (v !== null && v !== undefined) out[key] = v;
    }
    return out;
  };
  const list = (source: unknown, map: (item: unknown) => unknown) => (Array.isArray(source) ? source.map(map) : source);
  const d = pick(value, [
    'id',
    'name',
    'tagline',
    'description',
    'temperature',
    'prepTimeMin',
    'base',
    'milk',
    'extras',
    'equipment',
    'layers',
    'steps',
    'serving',
  ]) as Obj;
  if (d.base !== undefined) d.base = pick(d.base, ['methodId', 'amountMl', 'alternativeMethodIds', 'note']);
  if (d.milk !== undefined) d.milk = pick(d.milk, ['options', 'amountMl', 'prep']);
  d.extras = list(d.extras, (extra) => {
    if (isObj(extra) && extra.kind === 'syrup') return pick(extra, ['kind', 'syrupId', 'amountMl', 'optional']);
    const out = pick(extra, ['kind', 'ingredientId', 'name', 'amount', 'optional', 'blended', 'dairy']);
    if (isObj(out) && isObj(out.amount)) out.amount = pick(out.amount, ['value', 'max', 'unit']);
    return out;
  });
  d.layers = list(d.layers, (layer) => pick(layer, ['name', 'volumeMl', 'color', 'kind']));
  if (isObj(d.serving)) {
    const serving = pick(d.serving, ['vessel', 'why', 'decorations']) as Obj;
    serving.decorations = list(serving.decorations, (decoration) =>
      pick(decoration, ['kind', 'name', 'color', 'instruction', 'optional', 'look']),
    );
    d.serving = serving;
  }
  return d;
}
