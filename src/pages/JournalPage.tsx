import { Link } from 'react-router';
import { EmptyState } from '../components/EmptyState';
import { JournalIcon } from '../components/icons';
import { PageHeader } from '../components/PageHeader';
import { EntryCard } from '../features/journal/EntryCard';
import { useJournal } from '../features/journal/store';
import { count } from '../lib/format';
import { useNow } from '../lib/useNow';
import { addButtonClass } from './BeansPage';

export function JournalPage() {
  const entries = useJournal();
  const now = useNow(60_000);

  return (
    <>
      <PageHeader
        title="Dziennik parzeń"
        lead="Każde prowadzone parzenie zapisuje się tu samo. Oceniaj i notuj, co zmienić, a następna kawa wyjdzie lepiej."
        back={{ to: '/parzenie', label: 'Parzenie' }}
      />

      {entries.length === 0 ? (
        <>
          <EmptyState icon={JournalIcon} title="Dziennik jest pusty">
            Zaparz kawę z prowadzonym stoperem. Po „Zakończ” wpis pojawi się tu sam.
          </EmptyState>
          <Link to="/parzenie" className={`mt-6 ${addButtonClass}`}>
            Wybierz metodę
          </Link>
        </>
      ) : (
        <>
          <p role="status" className="mb-3 text-sm text-ink-muted">
            {count(entries.length, ['wpis', 'wpisy', 'wpisów'])}
          </p>
          <ul className="space-y-3">
            {entries.map((entry) => (
              <li key={entry.id}>
                <EntryCard entry={entry} now={now} />
              </li>
            ))}
          </ul>
        </>
      )}
    </>
  );
}
