import { useEffect, useRef } from 'react';
import { Link, useLocation, useSearchParams } from 'react-router';
import { EmptyState } from '../components/EmptyState';
import {
  BarIcon,
  BookmarkIcon,
  CartIcon,
  CloseIcon,
  DrinkIcon,
  FrothIcon,
  HeartIcon,
  MilkIcon,
  PantryIcon,
  SearchIcon,
  SlidersIcon,
  SyrupIcon,
} from '../components/icons';
import { PageHeader } from '../components/PageHeader';
import { Section } from '../components/Section';
import { Sheet } from '../components/Sheet';
import { useAllDrinks, useMyDrinks } from '../features/assistant/myDrinks';
import { DrinkTile } from '../features/drinks/DrinkTile';
import { ActiveFilterPills, FilterSheetBody, QuickFilters } from '../features/drinks/DrinkFiltersBar';
import {
  filterDrinks,
  filtersFromParams,
  filtersToParams,
  hasActiveFilters,
  searchDrinks,
  sheetFilterCount,
  type DrinkFilters,
} from '../features/drinks/filters';
import { useRandomDrink } from '../features/drinks/RandomDrinkSheet';
import { useFavorites } from '../features/favorites/store';
import { canMake } from '../features/shelf/availability';
import { useShopping } from '../features/shelf/shopping';
import { useShelf } from '../features/shelf/store';
import { useWishlist } from '../features/wishlist/store';
import { count } from '../lib/format';
import { aiEnabled } from '../lib/supabase';
import { useDialogParam } from '../lib/useDialogParam';

const GUIDES = [
  { to: '/napoje/mleko', label: 'Mleko', Icon: MilkIcon },
  { to: '/napoje/spienianie', label: 'Spienianie', Icon: FrothIcon },
  { to: '/napoje/syropy', label: 'Syropy', Icon: SyrupIcon },
];

const QUERY = 'q';

export function DrinksPage() {
  const location = useLocation();
  const [params, setParams] = useSearchParams();
  const favoriteIds = useFavorites();
  const wishlistIds = useWishlist();
  const shelf = useShelf();
  const mine = useMyDrinks();
  const drinks = useAllDrinks();
  const filters = filtersFromParams(params);
  const query = params.get(QUERY) ?? '';
  const context = { favoriteIds, wishlistIds, shelf };
  const results = searchDrinks(filterDrinks(drinks, filters, context), query);
  const narrowedBy = { filters: hasActiveFilters(filters), query: query.trim() !== '' };
  const narrowed = narrowedBy.filters || narrowedBy.query;

  // Lista bez okien: do niej wraca ekran napoju i od niej liczy się „wstecz”.
  const listParams = (next: DrinkFilters, q = query) => {
    const search = filtersToParams(next);
    if (q) search.set(QUERY, q);
    return search;
  };
  // replace: zmiana filtra nie dokłada wpisu w historii, więc „wstecz” wychodzi z listy.
  // preventScrollReset: lista nie skacze na górę po każdym tapnięciu filtra.
  const update = (next: DrinkFilters, q = query) =>
    setParams(listParams(next, q), { replace: true, preventScrollReset: true });
  const listSearch = listParams(filters).toString();
  const from = location.pathname + (listSearch ? `?${listSearch}` : '');

  // Okno „Filtry”: zmiany wchodzą po zamknięciu okna (wpis okna w historii znika, potem replace).
  const filterSheet = useDialogParam('filtry');
  const pending = useRef<DrinkFilters | null>(null);
  useEffect(() => {
    if (filterSheet.value === null && pending.current) {
      update(pending.current);
      pending.current = null;
    }
  });

  const random = useRandomDrink({ pool: results, all: drinks, narrowedBy, from });
  const sheetCount = sheetFilterCount(filters);

  return (
    <>
      <PageHeader
        title="Napoje"
        lead="Drinki kawowe na ciepło i na zimno, z pomysłem na efektowne podanie."
      />

      <div className="sticky top-0 z-[5] -mx-4 bg-canvas/95 px-4 pt-[max(0.5rem,env(safe-area-inset-top))] pb-2 backdrop-blur-md">
        <div className="flex gap-2">
          <div className="relative min-w-0 flex-1">
            <SearchIcon className="pointer-events-none absolute top-1/2 left-3.5 size-5 -translate-y-1/2 text-ink-muted" />
            <input
              type="search"
              aria-label="Szukaj napoju"
              placeholder="Szukaj po nazwie"
              enterKeyHint="search"
              value={query}
              onChange={(event) => update(filters, event.target.value)}
              className="h-11 w-full rounded-full border border-line bg-surface pr-11 pl-11 text-base placeholder:text-ink-muted focus:border-accent focus:outline-2 focus:outline-accent/40 [&::-webkit-search-cancel-button]:appearance-none"
            />
            {query && (
              <button
                type="button"
                onClick={() => update(filters, '')}
                className="absolute top-0 right-0 flex size-11 items-center justify-center rounded-full text-ink-muted"
              >
                <CloseIcon className="size-5" />
                <span className="sr-only">Wyczyść wyszukiwanie</span>
              </button>
            )}
          </div>
          <button
            type="button"
            aria-haspopup="dialog"
            onClick={() => filterSheet.open('1')}
            className={`inline-flex h-11 shrink-0 items-center gap-1.5 rounded-full border px-4 text-sm font-medium focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent ${
              sheetCount > 0 ? 'border-accent bg-accent-soft text-accent' : 'border-line bg-surface'
            }`}
          >
            <SlidersIcon className="size-5" />
            Filtry
            {sheetCount > 0 && <span className="tabular-nums"> ({sheetCount})</span>}
          </button>
        </div>
        <div className="mt-2">
          <QuickFilters filters={filters} onChange={update} showMine={mine.length > 0} />
        </div>
      </div>

      <div className="mt-2 flex min-h-11 items-center justify-between gap-3">
        <p role="status" className="text-sm text-ink-muted">
          {count(results.length, ['napój', 'napoje', 'napojów'])}
        </p>
        {random.button}
      </div>
      {narrowed && (
        <div className="mt-1 flex flex-wrap items-center gap-2">
          <ActiveFilterPills filters={filters} onChange={update} />
          <button
            type="button"
            onClick={() => update({}, '')}
            className="h-10 rounded-full px-3 text-sm font-medium text-accent"
          >
            Wyczyść filtry
          </button>
        </div>
      )}

      {results.length > 0 ? (
        <ul className="mt-3 grid grid-cols-2 gap-3">
          {results.map((drink) => (
            <li key={drink.id}>
              <DrinkTile drink={drink} from={from} />
            </li>
          ))}
        </ul>
      ) : (
        <div className="mt-3">
          <NoResults filters={filters} query={query} favorites={favoriteIds.length} wishlist={wishlistIds.length} />
        </div>
      )}

      <Section title="Więcej o napojach">
        <KitchenLinks />
        {aiEnabled() && (
          <Link
            to="/napoje/asystent"
            className="mb-3 flex min-h-16 items-center gap-3 rounded-2xl border border-accent bg-surface p-3 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
          >
            <DrinkIcon className="size-7 shrink-0 text-accent" />
            <span className="min-w-0">
              <span className="block leading-tight font-semibold">Asystent drinków</span>
              <span className="block text-xs text-ink-muted">Opisz, na co masz ochotę, a AI ułoży nowy napój</span>
            </span>
          </Link>
        )}
        <nav aria-label="Poradniki" className="grid grid-cols-3 gap-2">
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
      </Section>

      <Sheet title="Filtry" open={filterSheet.value !== null} onClose={filterSheet.close}>
        <FilterSheetBody
          initial={filters}
          countFor={(next) => searchDrinks(filterDrinks(drinks, next, context), query).length}
          onApply={(next) => {
            pending.current = next;
            filterSheet.close();
          }}
        />
      </Sheet>
      {random.sheet}
    </>
  );
}

type NoResultsProps = { filters: DrinkFilters; query: string; favorites: number; wishlist: number };

/** Pusty wynik: mówi, dlaczego, i podpowiada, co zmienić. */
function NoResults({ filters, query, favorites, wishlist }: NoResultsProps) {
  if (filters.favorites && favorites === 0) {
    return (
      <EmptyState icon={HeartIcon} title="Nie masz jeszcze ulubionych">
        Na ekranie napoju tapnij „Ulubiony”, a napój pojawi się tutaj i na ekranie startowym.
      </EmptyState>
    );
  }
  if (filters.toTry && wishlist === 0) {
    return (
      <EmptyState icon={BookmarkIcon} title="Lista „Do spróbowania” jest pusta">
        Na ekranie napoju tapnij „Chcę spróbować”. Napoje z listy znajdziesz też pod „Mam kawę”.
      </EmptyState>
    );
  }
  if (filters.available) {
    return (
      <EmptyState icon={PantryIcon} title="Z tego, co masz, nic nie wyjdzie">
        Zaznacz w <Link to="/baribar?sekcja=mleka" className="font-medium text-accent underline">Baribarze</Link>,
        co masz w kuchni, albo wyłącz któryś filtr.
      </EmptyState>
    );
  }
  if (query.trim()) {
    return (
      <EmptyState icon={SearchIcon} title={`Nic nie pasuje do „${query.trim()}”`}>
        Sprawdź pisownię albo wpisz krótszy fragment nazwy.
      </EmptyState>
    );
  }
  return (
    <EmptyState icon={DrinkIcon} title="Żaden napój nie pasuje">
      Spróbuj wyłączyć któryś filtr.
    </EmptyState>
  );
}

const kitchenLink =
  'flex min-h-16 items-center gap-3 rounded-2xl bg-accent-soft p-3 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent';

/** Baribar i lista zakupów: ile napojów zrobisz teraz, ile rzeczy kupić. */
function KitchenLinks() {
  const shelf = useShelf();
  const shopping = useShopping().filter((item) => !item.bought);
  const ready = useAllDrinks().filter((drink) => canMake(drink, shelf)).length;
  return (
    <nav aria-label="Twoja kuchnia" className="mb-3 grid grid-cols-2 gap-2">
      <Link to="/baribar?sekcja=mleka" className={kitchenLink}>
        <BarIcon className="size-7 shrink-0 text-accent" />
        <span className="min-w-0">
          <span className="block leading-tight font-semibold">Baribar</span>
          <span className="block text-xs">zrobisz {count(ready, ['napój', 'napoje', 'napojów'])}</span>
        </span>
      </Link>
      <Link to="/napoje/zakupy" className={kitchenLink}>
        <CartIcon className="size-7 shrink-0 text-accent" />
        <span className="min-w-0">
          <span className="block leading-tight font-semibold">Lista zakupów</span>
          <span className="block text-xs">
            {shopping.length > 0 ? `do kupienia: ${shopping.length}` : 'pusta'}
          </span>
        </span>
      </Link>
    </nav>
  );
}
