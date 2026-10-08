import { Link } from 'react-router';
import { MethodIcon } from '../../components/MethodIcon';
import { capitalize } from '../../lib/format';
import { dayAndTime } from '../coldbrew/time';
import { entryDose, entryTitle } from './format';
import { Stars } from './StarRating';
import type { JournalEntry } from './store';

type EntryCardProps = {
  entry: JournalEntry;
  now: number;
  /** Na liście dziennika h2, w sekcji innego ekranu h3. */
  heading?: 'h2' | 'h3';
};

/** Wpis z dziennika na liście: metoda, kiedy, ile, ocena i początek notatki. */
export function EntryCard({ entry, now, heading: Heading = 'h2' }: EntryCardProps) {
  return (
    <Link
      to={`/parzenie/dziennik/${entry.id}`}
      viewTransition
      className="flex gap-3 rounded-2xl border border-line bg-surface p-4 transition-colors hover:bg-surface-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
    >
      <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-accent-soft text-accent">
        <MethodIcon methodId={entry.methodId} className="size-6" />
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center justify-between gap-x-2">
          <Heading className="font-display text-lg leading-tight font-semibold">{entryTitle(entry)}</Heading>
          {entry.rating && <Stars rating={entry.rating} />}
        </div>
        <p className="mt-0.5 text-sm text-ink-muted">
          {capitalize(dayAndTime(entry.brewedAt, now))} · {entryDose(entry)}
        </p>
        {entry.beanName && <p className="mt-0.5 text-sm">{entry.beanName}</p>}
        {entry.note && <p className="mt-1 line-clamp-2 text-sm">{entry.note}</p>}
      </div>
    </Link>
  );
}
