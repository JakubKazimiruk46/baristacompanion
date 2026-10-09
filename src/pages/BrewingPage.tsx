import { Link } from 'react-router';
import { ChevronRightIcon, ClockIcon, JournalIcon } from '../components/icons';
import { MethodIcon } from '../components/MethodIcon';
import { PageHeader } from '../components/PageHeader';
import { DIFFICULTY_LABELS, GRIND_LABELS, methods } from '../data';
import { ColdBrewBadge } from '../features/coldbrew/ColdBrewLinks';
import { dayAndTime } from '../features/coldbrew/time';
import { useJournal } from '../features/journal/store';
import { count, formatSeconds } from '../lib/format';
import { useNow } from '../lib/useNow';

export function BrewingPage() {
  return (
    <>
      <PageHeader
        title="Parzenie"
        lead="Metody alternatywne krok po kroku: od mielenia po stoper."
      />
      <JournalLink />
      <ul className="mt-4 space-y-3">
        {methods.map((method) => (
          <li key={method.id}>
            <Link
              to={`/parzenie/${method.id}`}
              viewTransition
              className="flex items-center gap-3 rounded-2xl border border-line bg-surface p-4 transition-colors hover:bg-surface-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
            >
              <span className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-accent-soft text-accent">
                <MethodIcon methodId={method.id} className="size-7" />
              </span>
              <div className="min-w-0 flex-1">
                <h2 className="font-display text-lg leading-tight font-semibold">{method.name}</h2>
                <ul className="mt-1.5 flex flex-wrap gap-x-3 gap-y-1 text-xs font-medium text-ink-muted">
                  <li className="inline-flex items-center gap-1">
                    <ClockIcon className="size-4" />
                    {formatSeconds(method.totalTimeSec)}
                  </li>
                  <li>trudność: {DIFFICULTY_LABELS[method.difficulty]}</li>
                  <li>{method.instant ? 'bez mielenia' : `mielenie: ${GRIND_LABELS[method.grind]}`}</li>
                </ul>
                <p className="mt-2 text-sm text-ink-muted">
                  <span className="sr-only">Sprzęt: </span>
                  {method.equipment.slice(0, 3).join(' · ')}
                </p>
                {method.id === 'cold-brew' && <ColdBrewBadge />}
              </div>
              <ChevronRightIcon className="size-5 shrink-0 text-ink-muted" />
            </Link>
          </li>
        ))}
      </ul>
    </>
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
