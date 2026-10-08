import type {
  AmountUnit,
  BeanProfile,
  DecorationKind,
  Difficulty,
  FlavorNote,
  FrothingKind,
  FrothQuality,
  GrinderUnit,
  GrindSize,
  IngredientGroup,
  MilkPrep,
  Roast,
  Temperature,
} from './types';

export const ROAST_LABELS: Record<Roast, string> = {
  light: 'jasne',
  medium: 'średnie',
  dark: 'ciemne',
};

export const BEAN_KIND_LABELS: Record<BeanProfile['kind'], string> = {
  'single-origin': 'single origin',
  blend: 'mieszanka',
};

export const NOTE_LABELS: Record<FlavorNote, string> = {
  chocolate: 'czekoladowe',
  nutty: 'orzechowe',
  caramel: 'karmelowe',
  fruity: 'owocowe',
  floral: 'kwiatowe',
  citrus: 'cytrusowe',
  spicy: 'korzenne',
};

export const GRIND_LABELS: Record<GrindSize, string> = {
  'extra-fine': 'bardzo drobno',
  fine: 'drobno',
  'medium-fine': 'średnio-drobno',
  medium: 'średnio',
  'medium-coarse': 'średnio-grubo',
  coarse: 'grubo',
};

/** Do czego porównać zmieloną kawę. */
export const GRIND_HINTS: Record<GrindSize, string> = {
  'extra-fine': 'jak mąka',
  fine: 'jak drobny cukier',
  'medium-fine': 'jak drobny piasek',
  medium: 'jak piasek na plaży',
  'medium-coarse': 'jak cukier trzcinowy',
  coarse: 'jak gruba sól',
};

export const GRINDER_UNIT_LABELS: Record<GrinderUnit, string> = {
  click: 'kliknięcia',
  mark: 'działki na skali',
  turn: 'obroty pokrętła',
};

/** Odmiana jednostki młynka: 1 kliknięcie, 2 kliknięcia, 5 kliknięć, 2,5 kliknięcia (ułamek). */
export const GRINDER_UNIT_FORMS: Record<GrinderUnit, [string, string, string, string]> = {
  click: ['kliknięcie', 'kliknięcia', 'kliknięć', 'kliknięcia'],
  mark: ['działka', 'działki', 'działek', 'działki'],
  turn: ['obrót', 'obroty', 'obrotów', 'obrotu'],
};

export const DIFFICULTY_LABELS: Record<Difficulty, string> = {
  easy: 'łatwa',
  medium: 'średnia',
  hard: 'trudna',
};

export const TEMPERATURE_LABELS: Record<Temperature, string> = {
  hot: 'na ciepło',
  cold: 'na zimno',
};

export const FROTH_LABELS: Record<FrothQuality, string> = {
  great: 'pieni się świetnie',
  good: 'pieni się dobrze',
  poor: 'pieni się słabo',
  none: 'nie do spieniania',
};

export const FROTHING_KIND_LABELS: Record<FrothingKind, string> = {
  manual: 'ręcznie',
  handheld: 'spieniacz ręczny',
  electric: 'spieniacz elektryczny',
};

export const MILK_PREP_LABELS: Record<MilkPrep, string> = {
  froth: 'spienione',
  warm: 'podgrzane',
  blend: 'zmiksowane',
  plain: 'prosto z lodówki',
};

export const INGREDIENT_GROUP_LABELS: Record<IngredientGroup, string> = {
  milk: 'Mleko',
  syrup: 'Syropy',
  dairy: 'Śmietanka i lody',
  fruit: 'Owoce i soki',
  mixer: 'Napoje',
  spice: 'Przyprawy',
  sweet: 'Słodkie',
  basic: 'Podstawy',
};

/** Jednostki ilości w trzech formach: 1 kostka, 2 kostki, 5 kostek. */
export const UNIT_FORMS: Record<AmountUnit, [string, string, string]> = {
  ml: ['ml', 'ml', 'ml'],
  g: ['g', 'g', 'g'],
  cube: ['kostka', 'kostki', 'kostek'],
  scoop: ['gałka', 'gałki', 'gałek'],
  tsp: ['łyżeczka', 'łyżeczki', 'łyżeczek'],
};

export const DECORATION_LABELS: Record<DecorationKind, string> = {
  'wall-pattern': 'wzór na ściankach',
  rim: 'obtoczony brzeg',
  topping: 'posypka',
  garnish: 'dekoracja na górze',
};
