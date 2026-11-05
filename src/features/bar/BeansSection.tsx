import { Link } from 'react-router';
import { Chip } from '../../components/Chip';
import { EmptyState } from '../../components/EmptyState';
import { BeanIcon, ChevronRightIcon, CloseIcon, GrinderIcon, PlusIcon, SearchIcon } from '../../components/icons';
import { Section } from '../../components/Section';
import { BEAN_KIND_LABELS, ROAST_LABELS, ROASTS } from '../../data';
import { capitalize, count } from '../../lib/format';
import { BeanSummary } from '../beans/BeanSummary';
import { useBeans, useBeansPersistent } from '../beans/store';
import { activeGrinder, useGrinders } from '../grinder/store';
import { filterBeans, groupByRoast, type BeanFilters } from './bar';

export const addButtonClass =
  'flex h-12 items-center justify-center rounded-full bg-accent px-6 font-semibold text-on-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent';

const chip = 'shrink-0 whitespace-nowrap';
const BEANS: [string, string, string] = ['kawa', 'kawy', 'kaw'];

type BeansSectionProps = {
  filters: BeanFilters;
  onChange: (filters: BeanFilters) => void;
};

/** Ziarna w Baribarze: wyszukiwanie, palenie i rodzaj, grupy według palenia. */
export function BeansSection({ filters, onChange }: BeansSectionProps) {
  const beans = useBeans();
  const persistent = useBeansPersistent();
  const results = filterBeans(beans, filters);
  const narrowed = Boolean(filters.query || filters.roast || filters.kind);
  const toggle = <K extends keyof BeanFilters>(key: K, value: BeanFilters[K]) =>
    onChange({ ...filters, [key]: filters[key] === value ? undefined : value });

  return (
    <>
      {!persistent && <StorageWarning />}

      {beans.length === 0 ? (
        <>
          <EmptyState icon={BeanIcon} title="Nie masz jeszcze zapisanych ziaren">
            Dodaj kawę, którą masz w domu: palenie i nuty znajdziesz na opakowaniu. Podpowiemy, którą
            metodą najlepiej ją zaparzyć.
          </EmptyState>
          <Link to="/ziarna/nowe" className={`mt-6 ${addButtonClass}`}>
            Dodaj ziarna
          </Link>
        </>
      ) : (
        <>
          <div className="flex gap-2">
            <div className="relative min-w-0 flex-1">
              <SearchIcon className="pointer-events-none absolute top-1/2 left-3.5 size-5 -translate-y-1/2 text-ink-muted" />
              <input
                type="search"
                aria-label="Szukaj ziaren"
                placeholder="Szukaj ziaren"
                enterKeyHint="search"
                value={filters.query ?? ''}
                onChange={(event) => onChange({ ...filters, query: event.target.value || undefined })}
                className="h-11 w-full rounded-full border border-line bg-surface pr-11 pl-11 text-base placeholder:text-ink-muted focus:border-accent focus:outline-2 focus:outline-accent/40 [&::-webkit-search-cancel-button]:appearance-none"
              />
              {filters.query && (
                <button
                  type="button"
                  onClick={() => onChange({ ...filters, query: undefined })}
                  className="absolute top-0 right-0 flex size-11 items-center justify-center rounded-full text-ink-muted"
                >
                  <CloseIcon className="size-5" />
                  <span className="sr-only">Wyczyść wyszukiwanie</span>
                </button>
              )}
            </div>
            <Link
              to="/ziarna/nowe"
              className="inline-flex h-11 shrink-0 items-center gap-1 rounded-full bg-accent pr-4 pl-3 text-sm font-semibold text-on-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
            >
              <PlusIcon className="size-5" />
              Dodaj
            </Link>
          </div>

          <div className="-mx-4 mt-2 flex gap-2 overflow-x-auto px-4 py-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            <div role="group" aria-label="Palenie" className="flex shrink-0 gap-2">
              {ROASTS.map((roast) => (
                <Chip key={roast} className={chip} pressed={filters.roast === roast} onClick={() => toggle('roast', roast)}>
                  {capitalize(ROAST_LABELS[roast])}
                </Chip>
              ))}
            </div>
            <div role="group" aria-label="Rodzaj" className="flex shrink-0 gap-2">
              {(['single-origin', 'blend'] as const).map((kind) => (
                <Chip key={kind} className={chip} pressed={filters.kind === kind} onClick={() => toggle('kind', kind)}>
                  {capitalize(BEAN_KIND_LABELS[kind])}
                </Chip>
              ))}
            </div>
          </div>

          <div className="mt-1 flex min-h-11 items-center justify-between gap-3">
            <p className="text-sm text-ink-muted">
              {narrowed ? `${count(results.length, BEANS)} z ${beans.length}` : count(beans.length, BEANS)}
            </p>
            {narrowed && (
              <button type="button" onClick={() => onChange({})} className="h-10 rounded-full px-3 text-sm font-medium text-accent">
                Wyczyść filtry
              </button>
            )}
          </div>

          {results.length === 0 ? (
            <EmptyState icon={SearchIcon} title="Żadne ziarna nie pasują">
              Zmień wyszukiwanie albo wyłącz któryś filtr.
            </EmptyState>
          ) : (
            groupByRoast(results).map(({ roast, beans: group }) => (
              <Section key={roast} title={`${capitalize(ROAST_LABELS[roast])} palenie`}>
                <ul className="space-y-3">
                  {group.map((bean) => (
                    <li key={bean.id}>
                      <Link
                        to={`/ziarna/${bean.id}`}
                        viewTransition
                        className="flex items-center gap-3 rounded-2xl border border-line bg-surface p-4 hover:bg-surface-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
                      >
                        <div className="min-w-0 flex-1">
                          <h3 className="font-display text-lg leading-tight font-semibold">{bean.name}</h3>
                          {bean.roaster && <p className="text-sm text-ink-muted">{bean.roaster}</p>}
                          <div className="mt-2">
                            <BeanSummary profile={bean.profile} />
                          </div>
                        </div>
                        <ChevronRightIcon className="size-5 shrink-0 text-ink-muted" />
                      </Link>
                    </li>
                  ))}
                </ul>
              </Section>
            ))
          )}
        </>
      )}

      <GrinderLink />
    </>
  );
}

/** Wejście do „Mojego młynka”: używany młynek i liczba zapisanych ustawień. */
export function GrinderLink() {
  const state = useGrinders();
  const grinder = activeGrinder(state);
  const settings = grinder ? Object.keys(grinder.settings).length : 0;

  return (
    <Link
      to="/ziarna/mlynek"
      viewTransition
      className="mt-8 flex items-center gap-3 rounded-2xl border border-line bg-surface p-4 hover:bg-surface-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
    >
      <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-accent-soft text-accent">
        <GrinderIcon className="size-6" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block font-display text-lg leading-tight font-semibold">
          {state.grinders.length > 1 ? 'Moje młynki' : 'Mój młynek'}
        </span>
        <span className="block text-sm text-ink-muted">
          {grinder ? (
            <>
              {grinder.name} ·{' '}
              <span className="whitespace-nowrap">{count(settings, ['ustawienie', 'ustawienia', 'ustawień'])}</span>
            </>
          ) : (
            'Zapisz ustawienie mielenia dla każdej metody'
          )}
        </span>
      </span>
      <ChevronRightIcon className="size-5 shrink-0 text-ink-muted" />
    </Link>
  );
}

export function StorageWarning() {
  return (
    <p role="status" className="mb-4 rounded-2xl border border-amber-500/60 bg-amber-500/10 p-4 text-sm">
      Ta przeglądarka nie pozwala zapisywać danych (np. tryb prywatny). Ziarna działają, ale znikną po
      zamknięciu aplikacji.
    </p>
  );
}
