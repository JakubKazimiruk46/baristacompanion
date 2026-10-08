import { GRINDER_UNIT_FORMS, type GrinderUnit, type Range } from '../../data';
import { plural } from '../../lib/format';

const decimal = new Intl.NumberFormat('pl-PL', { maximumFractionDigits: 2 });

/** Odmiana jednostki: ułamki biorą dopełniacz liczby pojedynczej („2,5 obrotu”). */
function unitFor(value: number, unit: GrinderUnit): string {
  const [one, few, many, fraction] = GRINDER_UNIT_FORMS[unit];
  return Number.isInteger(value) ? plural(value, [one, few, many]) : fraction;
}

/** „24 kliknięcia”, „2,5 obrotu”, „15 działek” */
export function formatSetting(value: number, unit: GrinderUnit): string {
  return `${decimal.format(value)} ${unitFor(value, unit)}`;
}

/** „18–24 kliknięcia”: jednostka odmienia się po drugiej liczbie. */
export function formatSettingRange(range: Range, unit: GrinderUnit): string {
  if (range.min === range.max) return formatSetting(range.min, unit);
  return `${decimal.format(range.min)}–${decimal.format(range.max)} ${unitFor(range.max, unit)}`;
}

/** Liczba do pola formularza, z przecinkiem jak w polskim zapisie. */
export const settingInputValue = (value: number) => decimal.format(value).replace(/\s/g, '');

/** Tekst z pola („24”, „2,5”, „2.5”) na liczbę. null: to nie jest liczba. */
export function parseSetting(text: string): number | null {
  const normalized = text.trim().replace(',', '.');
  if (!/^\d+(\.\d+)?$/.test(normalized)) return null;
  return Number(normalized);
}

/** Zaokrąglenie do kroku młynka bez ogonów z ułamków dwójkowych (0,1 + 0,2). */
export function roundToStep(value: number, step: number): number {
  return Number((Math.round(value / step) * step).toFixed(2));
}
