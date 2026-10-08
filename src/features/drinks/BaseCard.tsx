import { Link } from 'react-router';
import { BrewIcon, ChevronRightIcon } from '../../components/icons';
import { getMethod, type Drink } from '../../data';
import { capitalize } from '../../lib/format';
import { ColdBrewDrinkLink } from '../coldbrew/ColdBrewLinks';

/** Baza kawowa napoju: czym ją zaparzyć, z linkiem do metody i alternatywami. */
export function BaseCard({ drink }: { drink: Drink }) {
  const method = getMethod(drink.base.methodId)!;
  const alternatives = (drink.base.alternativeMethodIds ?? []).map((id) => getMethod(id)!);

  return (
    <div className="rounded-2xl bg-accent-soft p-4">
      <p className="text-xs font-semibold tracking-wide text-accent uppercase">Baza kawowa</p>
      <p className="mt-1 flex items-baseline justify-between gap-4">
        <span className="font-semibold">{capitalize(method.brewName)}</span>
        <span className="text-sm font-medium tabular-nums">{drink.base.amountMl} ml</span>
      </p>
      {drink.base.note && <p className="mt-1 text-sm text-ink-muted">{drink.base.note}</p>}
      <ColdBrewDrinkLink drinkId={drink.id} />
      <Link
        to={`/parzenie/${method.id}`}
        className="mt-3 flex h-11 items-center justify-between rounded-xl bg-surface px-3 font-medium text-accent"
      >
        <span className="inline-flex items-center gap-2">
          <BrewIcon className="size-5" />
          Jak zaparzyć: {method.name}
        </span>
        <ChevronRightIcon className="size-5" />
      </Link>
      {alternatives.length > 0 && (
        <p className="mt-2 text-sm text-ink-muted">
          Możesz też użyć:{' '}
          {alternatives.map((alt, index) => (
            <span key={alt.id}>
              {index > 0 && ', '}
              <Link to={`/parzenie/${alt.id}`} className="font-medium text-accent underline">
                {alt.name}
              </Link>
            </span>
          ))}
        </p>
      )}
    </div>
  );
}
