import { getColdBrewVariant, getMethod, variantTitle } from '../../data';
import { formatGrams } from '../brewing/dose';
import { formatSetting } from '../grinder/format';
import type { JournalEntry } from './store';

/** Nazwa wpisu: metoda albo wariant cold brew („Cold brew z cynamonem”). */
export function entryTitle(entry: JournalEntry): string {
  const variant = entry.variantId ? getColdBrewVariant(entry.variantId) : undefined;
  if (variant) return variantTitle(variant);
  return getMethod(entry.methodId)!.name;
}

/** „17 g kawy · 150 ml wody” */
export function entryDose(entry: JournalEntry): string {
  return `${formatGrams(entry.coffeeG)} g kawy · ${entry.waterMl} ml wody`;
}

/** „Comandante C40 MK4 · 24 kliknięcia” */
export function entryGrind(entry: JournalEntry): string | null {
  if (!entry.grind) return null;
  return `${entry.grind.grinderName} · ${formatSetting(entry.grind.setting, entry.grind.unit)}`;
}
