import { useLocation, useSearchParams } from 'react-router';
import { UNIT_FORMS, type Amount } from '../../data';
import { plural } from '../../lib/format';

const decimal = new Intl.NumberFormat('pl-PL', { maximumFractionDigits: 1 });

/** Forma jednostki: przy zakresie według górnej liczby, ułamki zawsze „1,5 łyżeczki”. */
function unit(n: number, forms: [string, string, string]): string {
  return Number.isInteger(n) ? plural(n, forms) : forms[1];
}

/** Ilość dodatku na podaną liczbę porcji: „150 ml”, „8–10 kostek”. Opis słowny się nie mnoży. */
export function formatAmount(amount: Amount, servings = 1): string {
  if (typeof amount === 'string') return amount;
  const value = amount.value * servings;
  const max = amount.max === undefined ? undefined : amount.max * servings;
  const numbers = max === undefined ? decimal.format(value) : `${decimal.format(value)}–${decimal.format(max)}`;
  return `${numbers} ${unit(max ?? value, UNIT_FORMS[amount.unit])}`;
}

export const MAX_SERVINGS = 8;

/** Liczba porcji napoju w adresie (?porcje=2). Bez parametru: 1 porcja. */
export function useServings(): [number, (servings: number) => void] {
  const [params, setParams] = useSearchParams();
  const location = useLocation();
  const raw = Number(params.get('porcje'));
  const servings = Number.isInteger(raw) && raw >= 1 && raw <= MAX_SERVINGS ? raw : 1;

  const set = (next: number) => {
    const search = new URLSearchParams(params);
    if (next === 1) search.delete('porcje');
    else search.set('porcje', String(next));
    // state: zostaje informacja, skąd przyszliśmy, więc „wstecz” dalej wraca na listę.
    setParams(search, { replace: true, preventScrollReset: true, state: location.state });
  };

  return [servings, set];
}
