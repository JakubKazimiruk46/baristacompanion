import { Link, useLocation, useSearchParams } from 'react-router';
import type { FromState } from '../components/BackLink';
import { EmptyState } from '../components/EmptyState';
import { ChevronRightIcon, HeartIcon, JournalIcon } from '../components/icons';
import { MethodIcon } from '../components/MethodIcon';
import { PageHeader } from '../components/PageHeader';
import { Segmented } from '../components/Segmented';
import { methods, type BrewMethod } from '../data';
import {
  lastBrewed,
  METHOD_VIEW_LABELS,
  METHOD_VIEWS,
  methodsInView,
  methodViewFrom,
  type MethodView,
} from '../features/brewing/methodList';
import { ColdBrewBadge } from '../features/coldbrew/ColdBrewLinks';
import { useColdBrew } from '../features/coldbrew/store';
import { dayAndTime, shortDay } from '../features/coldbrew/time';
import { useMethodFavorites } from '../features/favorites/methods';
import { useJournal } from '../features/journal/store';
import { count } from '../lib/format';
import { useNow } from '../lib/useNow';

/** Parzenie (/parzenie): metody jako kafelki, widok A–Z / ostatnio parzone / ulubione (?widok=). */
export function BrewingPage() {
  const [params, setParams] = useSearchParams();
  const location = useLocation();
  const view = methodViewFrom(params);
  const favorites = useMethodFavorites();
  const entries = useJournal();
  const now = useNow(60_000);
  const last = lastBrewed(entries);
  const list = methodsInView(methods, view, { favorites, lastBrewed: last });
  const from = location.pathname + location.search;

  const choose = (next: MethodView) =>
    setParams(next === 'az' ? {} : { widok: next }, { replace: true, preventScrollReset: true });

  return (
    <>
      <PageHeader title="Parzenie" lead="Wybierz metodę: przepis, mielenie i stoper krok po kroku." />
      <JournalLink />
      <ColdBrewBadge link />

      <div className="mt-5">
        <Segmented label="Widok metod" options={METHOD_VIEWS} labels={METHOD_VIEW_LABELS} value={view} onChange={choose} />
      </div>

      {view === 'ostatnie' && entries.length === 0 && (
        <p className="mt-3 text-sm text-ink-muted">
          Dziennik jest pusty: metody, którymi zaparzysz kawę, pojawią się tu na początku.
        </p>
      )}

      {list.length > 0 ? (
        <ul aria-label="Metody parzenia" className="mt-4 grid grid-cols-3 gap-3">
          {list.map((method) => (
            <li key={method.id}>
              <MethodTile
                method={method}
                favorite={favorites.includes(method.id)}
                lastAt={view === 'ostatnie' ? last.get(method.id) : undefined}
                now={now}
                from={from}
              />
            </li>
          ))}
        </ul>
      ) : (
        <div className="mt-4">
          <EmptyState icon={HeartIcon} title="Nie masz jeszcze ulubionych metod">
            Na ekranie metody tapnij „Ulubiona”, a metoda pojawi się tutaj.
          </EmptyState>
        </div>
      )}
    </>
  );
}

type MethodTileProps = {
  method: BrewMethod;
  favorite: boolean;
  /** Ostatnie parzenie tą metodą (widok „Ostatnio parzone”). */
  lastAt?: number;
  now: number;
  from: string;
};

/** Kwadratowy kafelek: ikona metody i nazwa, a w razie potrzeby serce, trwające cold brew i data. */
function MethodTile({ method, favorite, lastAt, now, from }: MethodTileProps) {
  const coldBrew = useColdBrew();
  const brewing = method.id === 'cold-brew' && coldBrew !== null;
  return (
    <Link
      to={`/parzenie/${method.id}`}
      viewTransition
      state={{ from } satisfies FromState}
      className="relative flex aspect-square flex-col items-center justify-center gap-1.5 rounded-3xl border border-line bg-surface p-2 text-center transition-colors hover:bg-surface-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
    >
      <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-accent-soft text-accent">
        <MethodIcon methodId={method.id} className="size-7" />
      </span>
      <span className="line-clamp-2 text-sm leading-tight font-semibold">{method.name}</span>
      {lastAt !== undefined && <span className="text-xs leading-none text-ink-muted">{shortDay(lastAt, now)}</span>}
      {favorite && (
        <span className="absolute top-2 right-2 text-accent">
          <HeartIcon className="size-4" fill="currentColor" />
          <span className="sr-only">Ulubiona</span>
        </span>
      )}
      {brewing && (
        <span className="absolute top-2.5 left-2.5 size-2.5 rounded-full bg-accent">
          <span className="sr-only">maceruje się</span>
        </span>
      )}
    </Link>
  );
}

/** Wejście do dziennika: liczba wpisów i kiedy było ostatnie parzenie. */
function JournalLink() {
  const entries = useJournal();
  const now = useNow(60_000);
  const last = entries[0];
  return (
    <Link
      to="/parzenie/dziennik"
      viewTransition
      className="flex items-center gap-3 rounded-2xl bg-accent-soft p-4 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
    >
      <JournalIcon className="size-7 shrink-0 text-accent" />
      <span className="min-w-0 flex-1">
        <span className="block font-semibold">Dziennik parzeń</span>
        <span className="block text-sm">
          {last
            ? `${count(entries.length, ['wpis', 'wpisy', 'wpisów'])} · ostatnio ${dayAndTime(last.brewedAt, now)}`
            : 'Oceny i notatki z Twoich parzeń'}
        </span>
      </span>
      <ChevronRightIcon className="size-5 shrink-0 text-accent" />
    </Link>
  );
}
