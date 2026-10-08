/** Pola dla treści, które musi sprawdzić autor (znawca kawy). */
export interface Reviewable {
  needsReview?: boolean;
  /** Co dokładnie trzeba sprawdzić. */
  reviewNote?: string;
}

export interface Range {
  min: number;
  max: number;
}

// ── Ziarna ──────────────────────────────────────────────────────────────

export const ROASTS = ['light', 'medium', 'dark'] as const;
export type Roast = (typeof ROASTS)[number];

export const FLAVOR_NOTES = [
  'chocolate',
  'nutty',
  'caramel',
  'fruity',
  'floral',
  'citrus',
  'spicy',
] as const;
export type FlavorNote = (typeof FLAVOR_NOTES)[number];

export interface BeanProfile {
  roast: Roast;
  notes: FlavorNote[];
  origin?: string;
  kind: 'single-origin' | 'blend';
}

// ── Metody parzenia ─────────────────────────────────────────────────────

/** Skala mielenia od najdrobniejszego. Kolejność ma znaczenie (rysujemy ją jako skalę). */
export const GRIND_SIZES = [
  'extra-fine',
  'fine',
  'medium-fine',
  'medium',
  'medium-coarse',
  'coarse',
] as const;
export type GrindSize = (typeof GRIND_SIZES)[number];

export type Difficulty = 'easy' | 'medium' | 'hard';

// ── Młynki ──────────────────────────────────────────────────────────────

/** Jak młynek liczy ustawienie: kliknięcia od zera, działki na skali albo obroty pokrętła. */
export const GRINDER_UNITS = ['click', 'mark', 'turn'] as const;
export type GrinderUnit = (typeof GRINDER_UNITS)[number];

/** Popularny model młynka z podpowiedzią ustawień. */
export interface GrinderModel extends Reviewable {
  id: string;
  name: string;
  kind: 'manual' | 'electric';
  unit: GrinderUnit;
  /** Najdrobniejsze i najgrubsze ustawienie na skali młynka. */
  scale: Range;
  /** Najmniejsza zmiana ustawienia (kliknięcie: 1, kreska na pokrętle: 0,1). */
  step: number;
  /** Jak odczytać ustawienie, np. skąd liczyć kliknięcia. */
  howTo: string;
  /** Zakres dla każdego stopnia mielenia. null: tak drobno ten młynek nie zmieli. */
  grind: Record<GrindSize, Range | null>;
}

export interface BrewStep {
  /**
   * Krótkie polecenie, czytelne z daleka. Ilości jako znaczniki, które kalkulator zamienia
   * na liczby: {coffee} (g kawy), {water} (ml wody), {water*0.6} (część wody). Tak samo w detail.
   */
  text: string;
  /** Szczegóły i wskazówki. */
  detail?: string;
  /** Odliczanie w sekundach. Krok bez czasu kończy użytkownik przyciskiem. */
  durationSec?: number;
  /** true: użytkownik coś robi (zalewa, miesza); false: tylko czeka. */
  action: boolean;
}

/** Ile da się zaparzyć naraz: granice kalkulatora ilości. */
export interface BrewScaling {
  /** Ile ml wody na jedną osobę. */
  servingMl: number;
  /** Ile wody mieści sprzęt. */
  waterMl: Range;
  /** O ile zmienia się ilość wody w kalkulatorze. */
  stepMl: number;
  /** Sprzęt w stałych rozmiarach (kawiarka): zamiast osób i mililitrów wybiera się rozmiar. */
  sizes?: { label: string; waterMl: number }[];
  /** Wskazówka przy kalkulatorze. */
  note?: string;
}

export interface BrewMethod extends Reviewable {
  id: string;
  name: string;
  /** Nazwa naparu w składnikach napoju, np. „kawa z kawiarki”. */
  brewName: string;
  /** Miejscownik do zdań, np. „w kawiarce”. */
  inMethod: string;
  description: string;
  equipment: string[];
  grind: GrindSize;
  /** Podstawowa porcja: proporcja kawa:woda. */
  dose: { coffeeG: number; waterMl: number };
  scaling: BrewScaling;
  waterTempC: Range;
  totalTimeSec: number;
  difficulty: Difficulty;
  /** Do jakich ziaren pasuje i dlaczego. */
  suits: { roasts: Roast[]; notes: FlavorNote[]; why: string };
  steps: BrewStep[];
}

// ── Mleko i spienianie ──────────────────────────────────────────────────

export type MilkType = 'cow' | 'oat' | 'plant' | 'condensed';
export type FrothQuality = 'great' | 'good' | 'poor' | 'none';

export interface Milk extends Reviewable {
  id: string;
  name: string;
  type: MilkType;
  plantBased: boolean;
  flavored: boolean;
  frothing: FrothQuality;
  note: string;
  color: string;
}

export type FrothingKind = 'manual' | 'handheld' | 'electric';

export interface FrothingMethod extends Reviewable {
  id: string;
  name: string;
  kind: FrothingKind;
  equipment: string[];
  milkTempC: Range;
  timeSec: number;
  steps: string[];
  /** Jaki efekt daje ta metoda. */
  result: string;
  tip?: string;
}

// ── Składniki ───────────────────────────────────────────────────────────

/** Zamiennik: inny składnik z katalogu i co się zmieni po zamianie. */
export interface Substitute {
  id: string;
  note: string;
}

export const INGREDIENT_GROUPS = ['milk', 'syrup', 'dairy', 'fruit', 'mixer', 'spice', 'sweet', 'basic'] as const;
export type IngredientGroup = (typeof INGREDIENT_GROUPS)[number];

/**
 * Składnik z katalogu (półka „Co mam w domu”, lista zakupów, zamienniki). Mleka i syropy
 * są w katalogu pod swoimi id.
 */
export interface Ingredient {
  id: string;
  name: string;
  group: IngredientGroup;
  /** Prawie każdy ma go w domu (lód, cukier): na półce od początku. */
  staple?: boolean;
  /** Jest zawsze (woda): nie ma go na półce i nigdy nie brakuje. */
  always?: boolean;
  substitutes?: Substitute[];
}

// ── Syropy ──────────────────────────────────────────────────────────────

export interface Syrup extends Reviewable {
  id: string;
  name: string;
  color: string;
  easyToBuy: boolean;
  buyNote: string;
  /** Czym zastąpić syrop, gdy nie ma go w domu i nie chcesz robić. */
  substitutes?: Substitute[];
  recipe: {
    timeMin: number;
    yieldMl: number;
    ingredients: string[];
    steps: string[];
    storage: string;
  };
}

// ── Podanie ─────────────────────────────────────────────────────────────

export type VesselId =
  | 'espresso-cup'
  | 'cup'
  | 'small-glass'
  | 'low-glass'
  | 'tall-glass'
  | 'dessert-glass';

export interface Vessel {
  id: VesselId;
  name: string;
  capacityMl: number;
  transparent: boolean;
}

export type DecorationKind = 'wall-pattern' | 'rim' | 'topping' | 'garnish';

/** Jak narysować posypkę (topping) albo dekorację na górze (garnish). */
export type DecorationLook =
  | 'dust'
  | 'drizzle'
  | 'pieces'
  | 'slice'
  | 'peel'
  | 'berries'
  | 'stick';

export interface Decoration {
  kind: DecorationKind;
  name: string;
  color: string;
  instruction: string;
  optional?: boolean;
  /** Domyślnie: posypka jako „dust”, dekoracja jako „slice”. */
  look?: DecorationLook;
}

export interface Serving {
  vessel: VesselId;
  /** Dlaczego to naczynie. */
  why: string;
  decorations: Decoration[];
}

// ── Napoje ──────────────────────────────────────────────────────────────

export type Temperature = 'hot' | 'cold';

/** Jak przygotować mleko do napoju. */
export type MilkPrep = 'froth' | 'warm' | 'blend' | 'plain';

export type LayerKind = 'liquid' | 'foam' | 'solid';

export interface Layer {
  name: string;
  volumeMl: number;
  color: string;
  kind: LayerKind;
}

export type ExtraKind = 'fruit' | 'ice-cream' | 'cream' | 'spice' | 'mixer' | 'ice' | 'other';

export const AMOUNT_UNITS = ['ml', 'g', 'cube', 'scoop', 'tsp'] as const;
export type AmountUnit = (typeof AMOUNT_UNITS)[number];

/** Ilość, którą da się pomnożyć przez liczbę porcji. max: zakres, np. 4–5 kostek. */
export interface Quantity {
  value: number;
  max?: number;
  unit: AmountUnit;
}

/** Ilość dodatku: liczba (mnoży się z porcjami) albo opis, który się nie mnoży („pełna szklanka”). */
export type Amount = Quantity | string;

export type Extra =
  | { kind: 'syrup'; syrupId: string; amountMl: number; optional?: boolean }
  | {
      kind: ExtraKind;
      /** Składnik z katalogu (półka, lista zakupów, zamienniki). */
      ingredientId: string;
      /** Nazwa w tym napoju, np. „tonik, dobrze schłodzony”. */
      name: string;
      amount: Amount;
      optional?: boolean;
      /** Zmiksuj z mlekiem. */
      blended?: boolean;
      /** Nabiał bez roślinnego zamiennika (np. bita śmietana): wyklucza wersję roślinną. */
      dairy?: boolean;
    };

export interface Drink extends Reviewable {
  id: string;
  name: string;
  tagline: string;
  description: string;
  temperature: Temperature;
  /** Łączny czas, razem z zaparzeniem bazy. */
  prepTimeMin: number;
  base: {
    methodId: string;
    amountMl: number;
    /** Inne metody, którymi też da się zrobić bazę. */
    alternativeMethodIds?: string[];
    note?: string;
  };
  milk?: {
    /** Pierwsze mleko na liście jest polecane. */
    options: string[];
    amountMl: number;
    prep: MilkPrep;
  };
  extras: Extra[];
  equipment: string[];
  /** Warstwy od dołu szklanki. */
  layers: Layer[];
  steps: string[];
  serving: Serving;
}
