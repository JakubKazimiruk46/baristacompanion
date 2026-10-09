import type { BrewMethod } from '../../data';

const decimal = new Intl.NumberFormat('pl-PL', { maximumFractionDigits: 1 });

/** Proporcja kawa:woda, np. „1:16,7”. */
export function formatRatio(method: Pick<BrewMethod, 'dose'>): string {
  return `1:${decimal.format(method.dose.waterMl / method.dose.coffeeG)}`;
}

/** Temperatura wody, np. „92–96°C” albo „zimna (4–22°C)”. */
export function formatWaterTemp(method: BrewMethod): string {
  const { min, max } = method.waterTempC;
  const range = min === max ? `${min}°C` : `${min}–${max}°C`;
  return max < 30 ? `zimna (${range})` : range;
}
