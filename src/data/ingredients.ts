import type { Ingredient } from './types';

/**
 * Składniki dodatków w napojach i ich zamienniki. Mleka i syropy dokłada do katalogu index.ts
 * (z milks.ts i syrups.ts), więc tu ich nie ma.
 */
export const extraIngredients: Ingredient[] = [
  // Śmietanka i lody
  { id: 'smietanka-30', name: 'śmietanka 30%', group: 'dairy' },
  {
    id: 'lody-waniliowe',
    name: 'lody waniliowe',
    group: 'dairy',
    substitutes: [{ id: 'lody-smietankowe', note: 'Mniej waniliowe, ale tak samo kremowe.' }],
  },
  { id: 'lody-smietankowe', name: 'lody śmietankowe', group: 'dairy' },

  // Owoce i soki
  {
    id: 'sok-pomaranczowy',
    name: 'sok pomarańczowy',
    group: 'fruit',
    substitutes: [{ id: 'pomarancze', note: 'Wyciśnij sok z 1–2 pomarańczy: wyjdzie nawet lepiej.' }],
  },
  { id: 'pomarancze', name: 'pomarańcze', group: 'fruit' },
  {
    id: 'maliny',
    name: 'maliny',
    group: 'fruit',
    substitutes: [{ id: 'truskawki', note: 'Kolor bardziej czerwony, smak słodszy i mniej kwaskowy.' }],
  },
  { id: 'truskawki', name: 'truskawki', group: 'fruit' },
  { id: 'banany', name: 'banany', group: 'fruit' },
  {
    id: 'cytryny',
    name: 'cytryny',
    group: 'fruit',
    substitutes: [{ id: 'limonki', note: 'Kwaśniejsza i bardziej aromatyczna. Weź trochę mniej soku.' }],
  },
  { id: 'limonki', name: 'limonki', group: 'fruit' },

  // Napoje
  {
    id: 'tonik',
    name: 'tonik',
    group: 'mixer',
    substitutes: [
      {
        id: 'woda-gazowana',
        note: 'Bez goryczki toniku wyjdzie łagodniej. Dodaj odrobinę soku z cytryny albo skórkę.',
      },
    ],
  },
  { id: 'woda-gazowana', name: 'woda gazowana', group: 'mixer' },

  // Alkohol (napoje „z alkoholem”: oznaczenie i filtr „Bez alkoholu”)
  { id: 'whiskey', name: 'whiskey irlandzka', group: 'alcohol' },
  { id: 'wodka', name: 'wódka', group: 'alcohol' },
  { id: 'likier-kawowy', name: 'likier kawowy', group: 'alcohol' },

  // Przyprawy
  {
    id: 'laska-cynamonu',
    name: 'laska cynamonu',
    group: 'spice',
    substitutes: [
      {
        id: 'cynamon-mielony',
        note: 'Pół łyżeczki na 800 ml wody. Koncentrat przecedź przez filtr papierowy, bo zmętnieje.',
      },
    ],
  },
  { id: 'cynamon-mielony', name: 'cynamon mielony', group: 'spice' },
  {
    id: 'kardamon',
    name: 'kardamon w strąkach',
    group: 'spice',
    substitutes: [{ id: 'kardamon-mielony', note: 'Wystarczy szczypta. Aromat będzie mniej świeży.' }],
  },
  { id: 'kardamon-mielony', name: 'kardamon mielony', group: 'spice' },
  {
    id: 'przyprawa-do-piernika',
    name: 'przyprawa do piernika',
    group: 'spice',
    substitutes: [{ id: 'cynamon-mielony', note: 'Sam cynamon: mniej korzennie, ale w tym samym klimacie.' }],
  },

  // Słodkie
  { id: 'cukier', name: 'cukier', group: 'sweet', staple: true },
  {
    id: 'cukier-puder',
    name: 'cukier puder',
    group: 'sweet',
    substitutes: [{ id: 'cukier', note: 'Zmiel zwykły cukier w młynku albo blenderze na pył.' }],
  },
  {
    id: 'gorzka-czekolada',
    name: 'gorzka czekolada',
    group: 'sweet',
    substitutes: [
      {
        id: 'kakao',
        note: '2 łyżeczki kakao i łyżeczka cukru zamiast 30 g czekolady. Wyjdzie mniej gęsto.',
      },
    ],
  },
  { id: 'kakao', name: 'kakao', group: 'sweet' },
  { id: 'biala-czekolada', name: 'biała czekolada', group: 'sweet' },
  {
    id: 'miod',
    name: 'miód',
    group: 'sweet',
    substitutes: [{ id: 'cukier', note: 'Łyżeczka cukru, najlepiej brązowego. Słodko, ale bez miodowego aromatu.' }],
  },
  { id: 'maslo-orzechowe', name: 'masło orzechowe', group: 'sweet' },

  // Podstawy
  { id: 'lod', name: 'lód', group: 'basic', staple: true },
  { id: 'jajka', name: 'jajka', group: 'basic' },
  { id: 'woda', name: 'woda', group: 'basic', always: true },
];
