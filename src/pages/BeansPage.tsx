import { Link } from 'react-router';
import { EmptyState } from '../components/EmptyState';
import { BeanIcon, ChevronRightIcon, GrinderIcon, UserIcon } from '../components/icons';
import { PageHeader } from '../components/PageHeader';
import { BeanSummary } from '../features/beans/BeanSummary';
import { useBeans, useBeansPersistent } from '../features/beans/store';
import { activeGrinder, useGrinders } from '../features/grinder/store';
import { count } from '../lib/format';

export const addButtonClass =
  'flex h-12 items-center justify-center rounded-full bg-accent px-6 font-semibold text-on-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent';

export function BeansPage() {
  const beans = useBeans();
  const persistent = useBeansPersistent();

  return (
    <>
      <PageHeader title="Moje ziarna" lead="Twoje kawy i podpowiedź, jak je zaparzyć." />

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
          <Link to="/ziarna/nowe" className={addButtonClass}>
            Dodaj ziarna
          </Link>
          <ul className="mt-4 space-y-3">
            {beans.map((bean) => (
              <li key={bean.id}>
                <Link
                  to={`/ziarna/${bean.id}`}
                  viewTransition
                  className="flex items-center gap-3 rounded-2xl border border-line bg-surface p-4 hover:bg-surface-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
                >
                  <div className="min-w-0 flex-1">
                    <h2 className="font-display text-lg leading-tight font-semibold">{bean.name}</h2>
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
        </>
      )}

      <GrinderLink />

      <Link
        to="/konto"
        viewTransition
        className="mt-3 flex items-center gap-3 rounded-2xl border border-line bg-surface p-4 hover:bg-surface-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
      >
        <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-accent-soft text-accent">
          <UserIcon className="size-6" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block font-display text-lg leading-tight font-semibold">Konto i prywatność</span>
          <span className="block text-sm text-ink-muted">Opcjonalne konto, kopia danych, polityka prywatności</span>
        </span>
        <ChevronRightIcon className="size-5 shrink-0 text-ink-muted" />
      </Link>
    </>
  );
}

/** Wejście do „Mojego młynka”: używany młynek i liczba zapisanych ustawień. */
function GrinderLink() {
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
