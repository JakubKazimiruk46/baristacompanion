import { Link, useLocation, useSearchParams } from 'react-router';
import { EmptyState } from '../components/EmptyState';
import { DrinkIcon, FrothIcon, HeartIcon, MilkIcon, SyrupIcon } from '../components/icons';
import { PageHeader } from '../components/PageHeader';
import { drinks } from '../data';
import { DrinkCard } from '../features/drinks/DrinkCard';
import { DrinkFiltersBar } from '../features/drinks/DrinkFiltersBar';
import {
  filterDrinks,
  filtersFromParams,
  filtersToParams,
  hasActiveFilters,
  type DrinkFilters,
} from '../features/drinks/filters';
import { useFavorites } from '../features/favorites/store';
import { count } from '../lib/format';

const GUIDES = [
  { to: '/napoje/mleko', label: 'Mleko', Icon: MilkIcon },
  { to: '/napoje/spienianie', label: 'Spienianie', Icon: FrothIcon },
  { to: '/napoje/syropy', label: 'Syropy', Icon: SyrupIcon },
];

export function DrinksPage() {
  const location = useLocation();
  const [params, setParams] = useSearchParams();
  const favoriteIds = useFavorites();
  const filters = filtersFromParams(params);
  const results = filterDrinks(drinks, filters, { favoriteIds });
  const active = hasActiveFilters(filters);

  // replace: zmiana filtra nie dokłada wpisu w historii, więc „wstecz” wychodzi z listy.
  // preventScrollReset: lista nie skacze na górę po każdym tapnięciu filtra.
  const update = (next: DrinkFilters) =>
    setParams(filtersToParams(next), { replace: true, preventScrollReset: true });
  const from = location.pathname + location.search;

  return (
    <>
      <PageHeader
        title="Napoje"
        lead="Drinki kawowe na ciepło i na zimno, z pomysłem na efektowne podanie."
      />

      <nav aria-label="Poradniki" className="mb-6 grid grid-cols-3 gap-2">
        {GUIDES.map(({ to, label, Icon }) => (
          <Link
            key={to}
            to={to}
            className="flex flex-col items-center gap-1 rounded-2xl border border-line bg-surface px-2 py-3 text-sm font-medium hover:bg-surface-muted"
          >
            <Icon className="size-6 text-accent" />
            {label}
          </Link>
        ))}
      </nav>

      <DrinkFiltersBar filters={filters} onChange={update} />

      <div className="mt-4 flex h-10 items-center justify-between">
        <p role="status" className="text-sm text-ink-muted">
          {count(results.length, ['napój', 'napoje', 'napojów'])}
        </p>
        {active && (
          <button
            type="button"
            onClick={() => update({})}
            className="h-10 rounded-full px-3 text-sm font-medium text-accent"
          >
            Wyczyść filtry
          </button>
        )}
      </div>

      {results.length > 0 ? (
        <ul className="mt-2 space-y-3">
          {results.map((drink) => (
            <li key={drink.id}>
              <DrinkCard drink={drink} from={from} />
            </li>
          ))}
        </ul>
      ) : filters.favorites && favoriteIds.length === 0 ? (
        <EmptyState icon={HeartIcon} title="Nie masz jeszcze ulubionych">
          Na ekranie napoju tapnij „Ulubiony”, a napój pojawi się tutaj i na ekranie startowym.
        </EmptyState>
      ) : (
        <EmptyState icon={DrinkIcon} title="Żaden napój nie pasuje">
          Spróbuj wyłączyć któryś filtr.
        </EmptyState>
      )}
    </>
  );
}
