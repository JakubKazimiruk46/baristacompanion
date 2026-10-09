import { Link } from 'react-router';
import type { FromState } from '../../components/BackLink';
import { BookmarkIcon, ClockIcon, ColdIcon, HeartIcon, HotIcon, LeafIcon } from '../../components/icons';
import { hasAlcohol, isPlantBasedPossible, TEMPERATURE_LABELS, type Drink } from '../../data';
import { formatMinutes } from '../../lib/format';
import { useFavorites } from '../favorites/store';
import { DrinkGlass } from '../glass/DrinkGlass';
import { useWishlist } from '../wishlist/store';

type DrinkTileProps = {
  drink: Drink;
  /** Adres listy, do której wraca „wstecz” z ekranu napoju. */
  from?: string;
};

/** Kafelek napoju w siatce katalogu: duży rysunek szklanki, nazwa i najkrótsze cechy. */
export function DrinkTile({ drink, from }: DrinkTileProps) {
  const favorite = useFavorites().includes(drink.id);
  const wanted = useWishlist().includes(drink.id);
  const TempIcon = drink.temperature === 'hot' ? HotIcon : ColdIcon;

  return (
    <Link
      to={`/napoje/${drink.id}`}
      viewTransition
      state={from ? ({ from } satisfies FromState) : undefined}
      className="relative flex h-full flex-col rounded-3xl border border-line bg-surface p-3 transition-colors hover:bg-surface-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
    >
      <span className="flex justify-center rounded-2xl bg-surface-muted py-2">
        <DrinkGlass drink={drink} variant="thumb" className="h-28 w-20" />
      </span>
      <h2 className="mt-3 font-display text-base leading-tight font-semibold text-balance break-words">{drink.name}</h2>
      <p className="mt-1 line-clamp-2 text-xs text-ink-muted">{drink.tagline}</p>
      <ul className="mt-auto flex flex-wrap items-center gap-x-2 gap-y-1 pt-2 text-xs font-medium text-ink-muted">
        <li className="inline-flex items-center gap-0.5">
          <TempIcon className="size-4" />
          <span className="sr-only">{TEMPERATURE_LABELS[drink.temperature]}</span>
        </li>
        <li className="inline-flex items-center gap-0.5 tabular-nums">
          <ClockIcon className="size-4" />
          {formatMinutes(drink.prepTimeMin)}
        </li>
        {isPlantBasedPossible(drink) && (
          <li className="inline-flex items-center">
            <LeafIcon className="size-4" />
            <span className="sr-only">wersja roślinna</span>
          </li>
        )}
        {hasAlcohol(drink) && (
          <li className="rounded-full border border-current px-1.5 leading-4">
            18+<span className="sr-only"> z alkoholem</span>
          </li>
        )}
      </ul>
      {(favorite || wanted) && (
        <span className="absolute top-4 right-4 flex flex-col gap-1 text-accent">
          {favorite && (
            <span>
              <HeartIcon className="size-5" fill="currentColor" />
              <span className="sr-only">Ulubiony</span>
            </span>
          )}
          {wanted && (
            <span>
              <BookmarkIcon className="size-5" fill="currentColor" />
              <span className="sr-only">Do spróbowania</span>
            </span>
          )}
        </span>
      )}
    </Link>
  );
}
