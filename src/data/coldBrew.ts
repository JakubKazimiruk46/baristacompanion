import type { Reviewable } from './types';

export interface ColdBrewVariant extends Reviewable {
  id: string;
  name: string;
  /** Przyprawa dodawana do maceracji. */
  spice?: {
    amount: string;
    when: string;
    tip: string;
  };
  /** Napoje, do których pasuje ten wariant. */
  drinkIds: string[];
}

export const coldBrewVariants: ColdBrewVariant[] = [
  { id: 'klasyczne', name: 'Klasyczne', drinkIds: [] },
  {
    id: 'cynamon',
    name: 'Z cynamonem',
    spice: {
      amount: '1 laska cynamonu (ok. 8 cm) na 800 ml wody',
      when: 'Na początku: połam laskę i wsyp ją razem z kawą, zanim zalejesz wodą.',
      tip: 'Cynamon cejloński jest delikatniejszy niż kasja. Jeśli wolisz subtelniej, wyjmij laskę po 8 godzinach.',
    },
    drinkIds: ['cold-brew-z-cynamonem'],
    needsReview: true,
    reviewNote: 'Ilość cynamonu i czas jego maceracji do sprawdzenia w praktyce.',
  },
  {
    id: 'kardamon',
    name: 'Z kardamonem',
    spice: {
      amount: '4–5 strąków zielonego kardamonu na 800 ml wody',
      when: 'Na początku: zgnieć strąki płaską stroną noża, żeby pękły, i wsyp razem z kawą.',
      tip: 'Kardamon jest intensywny. Zacznij od 4 strąków, a następnym razem dodaj więcej.',
    },
    drinkIds: ['cold-brew-z-kardamonem'],
    needsReview: true,
    reviewNote: 'Ilość kardamonu do sprawdzenia w praktyce.',
  },
];

/** Do wyboru: ile godzin maceracji. */
export const COLD_BREW_HOURS = [12, 16, 20, 24] as const;
export const DEFAULT_COLD_BREW_HOURS = 16;

export const getColdBrewVariant = (id: string) => coldBrewVariants.find((v) => v.id === id);

/** „Cold brew z cynamonem”, a klasyczne po prostu „Cold brew”. */
export const variantTitle = (variant: ColdBrewVariant) =>
  variant.spice ? `Cold brew ${variant.name.toLowerCase()}` : 'Cold brew';
