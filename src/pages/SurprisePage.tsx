import { useEffect } from 'react';
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router';
import type { FromState } from '../components/BackLink';
import { Chip } from '../components/Chip';
import { EmptyState } from '../components/EmptyState';
import { ColdIcon, DiceIcon, HotIcon, PantryIcon, SparklesIcon } from '../components/icons';
import { PageHeader } from '../components/PageHeader';
import { useAllDrinks } from '../features/assistant/myDrinks';
import { DrinkFigure } from '../features/drinks/DrinkFigure';
import { DrinkMeta } from '../features/drinks/DrinkMeta';
import { filterDrinks, filtersFromParams, filtersToParams, type DrinkFilters } from '../features/drinks/filters';
import { pickRandom } from '../features/drinks/random';
import { MENU_PATH, startFromDrink, stepPath } from '../features/flow/flow';
import { flowStore } from '../features/flow/store';
import { useShelf } from '../features/shelf/store';
import { count } from '../lib/format';

const DRINK_PARAM = 'napoj';

/**
 * „Zaskocz mnie” (/mam-kawe/zaskocz): losowy napój z katalogu i „Moich napojów”. Wylosowany napój
 * i szybkie filtry (?temp=, ?mam=1) są w adresie, więc odświeżenie i „wstecz” go nie zmieniają.
 */
export function SurprisePage() {
  const [params, setParams] = useSearchParams();
  const navigate = useNavigate();
  const location = useLocation();
  const shelf = useShelf();
  const all = useAllDrinks();
  // Z filtrów katalogu tylko szybkie: temperatura i „mogę zrobić”.
  const { temperature, available } = filtersFromParams(params);
  const filters: DrinkFilters = { temperature, available };
  const pool = filterDrinks(all, filters, { shelf });
  const drink = pool.find((d) => d.id === params.get(DRINK_PARAM));

  const show = (next: DrinkFilters, drinkId?: string) => {
    const search = filtersToParams(next);
    if (drinkId) search.set(DRINK_PARAM, drinkId);
    setParams(search, { replace: true, preventScrollReset: true });
  };
  const toggle = <K extends keyof DrinkFilters>(key: K, value: DrinkFilters[K]) =>
    show({ ...filters, [key]: filters[key] === value ? undefined : value }, drink?.id);

  // Nic nie wylosowane albo wylosowany napój nie pasuje do nowych filtrów: losujemy.
  const missing = !drink && pool.length > 0;
  useEffect(() => {
    if (missing) show(filters, pickRandom(pool)?.id);
  });

  return (
    <>
      <PageHeader
        title="Zaskocz mnie"
        lead={`Losujemy spośród ${count(pool.length, ['napoju', 'napojów', 'napojów'])}.`}
        back={{ to: MENU_PATH, label: 'Mam kawę' }}
      />

      <div role="group" aria-label="Zawęź losowanie" className="flex flex-wrap gap-2">
        <Chip pressed={temperature === 'hot'} onClick={() => toggle('temperature', 'hot')}>
          <HotIcon className="size-4" />
          Na ciepło
        </Chip>
        <Chip pressed={temperature === 'cold'} onClick={() => toggle('temperature', 'cold')}>
          <ColdIcon className="size-4" />
          Na zimno
        </Chip>
        <Chip pressed={available === true} onClick={() => toggle('available', true)}>
          <PantryIcon className="size-4" />
          Mogę zrobić
        </Chip>
      </div>

      {pool.length === 0 ? (
        <div className="mt-6">
          <EmptyState icon={SparklesIcon} title="Nic nie pasuje">
            Wyłącz któryś filtr albo zaznacz w Baribarze, co masz w domu.
          </EmptyState>
        </div>
      ) : drink ? (
        <article className="mt-6">
          <DrinkFigure drink={drink} />
          <div aria-live="polite" className="mt-4 text-center">
            <h2 className="font-display text-3xl font-semibold text-balance">{drink.name}</h2>
            <p className="mt-1 text-ink-muted">{drink.tagline}</p>
          </div>
          <div className="mt-3 flex justify-center">
            <DrinkMeta drink={drink} />
          </div>
          <div className="mt-6 space-y-3">
            <button
              type="button"
              onClick={() => {
                flowStore.set(startFromDrink(drink, 'surprise'));
                navigate(stepPath('metoda'));
              }}
              className="flex h-12 w-full items-center justify-center rounded-full bg-accent px-6 font-semibold text-on-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
            >
              Robię ten napój
            </button>
            <button
              type="button"
              onClick={() => show(filters, pickRandom(pool, drink.id)?.id)}
              disabled={pool.length < 2}
              className="flex h-12 w-full items-center justify-center gap-2 rounded-full border border-line bg-surface px-6 font-semibold focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent disabled:opacity-50"
            >
              <DiceIcon className="size-5" />
              Losuj jeszcze raz
            </button>
            <Link
              to={`/napoje/${drink.id}`}
              state={{ from: location.pathname + location.search } satisfies FromState}
              className="flex h-11 items-center justify-center text-sm font-medium text-accent"
            >
              Zobacz cały przepis
            </Link>
          </div>
        </article>
      ) : (
        <p role="status" className="mt-6 text-ink-muted">
          Losuję…
        </p>
      )}
    </>
  );
}
