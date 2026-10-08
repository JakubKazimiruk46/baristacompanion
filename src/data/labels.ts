import type {
  BeanProfile,
  DecorationKind,
  Difficulty,
  FlavorNote,
  FrothingKind,
  FrothQuality,
  GrindSize,
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

export const DECORATION_LABELS: Record<DecorationKind, string> = {
  'wall-pattern': 'wzór na ściankach',
  rim: 'obtoczony brzeg',
  topping: 'posypka',
  garnish: 'dekoracja na górze',
};
