import { Link } from 'react-router';
import type { FromState } from '../../components/BackLink';
import { ChevronRightIcon } from '../../components/icons';
import type { Drink } from '../../data';
import { DrinkGlass } from '../glass/DrinkGlass';
import { DrinkMeta } from './DrinkMeta';

type DrinkCardProps = {
  drink: Drink;
  /** Adres listy, do której wraca „wstecz” z ekranu napoju. */
  from?: string;
  /** Inny cel niż ekran napoju (np. kolejny krok ścieżki „Mam kawę”). */
  to?: string;
  onSelect?: () => void;
};

export function DrinkCard({ drink, from, to, onSelect }: DrinkCardProps) {
  return (
    <Link
      to={to ?? `/napoje/${drink.id}`}
      viewTransition
      state={from ? ({ from } satisfies FromState) : undefined}
      onClick={onSelect}
      className="flex items-center gap-3 rounded-2xl border border-line bg-surface py-3 pr-4 pl-2 transition-colors hover:bg-surface-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
    >
      <DrinkGlass drink={drink} variant="thumb" className="h-20 w-16 shrink-0" />
      <div className="min-w-0 flex-1">
        <h2 className="font-display text-lg leading-tight font-semibold">{drink.name}</h2>
        <p className="mt-1 text-sm text-ink-muted">{drink.tagline}</p>
        <div className="mt-2">
          <DrinkMeta drink={drink} />
        </div>
      </div>
      <ChevronRightIcon className="size-5 shrink-0 text-ink-muted" />
    </Link>
  );
}
