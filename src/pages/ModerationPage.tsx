import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router';
import { EmptyState } from '../components/EmptyState';
import { ShieldIcon } from '../components/icons';
import { PageHeader } from '../components/PageHeader';
import { getMethod } from '../data';
import { useAuth } from '../features/account/auth';
import { isModerator, moderateRecipe, moderationQueue, REPORT_REASONS, type QueueItem } from '../features/community/api';
import { communityDrinkPath, moderateDrink } from '../features/community/drinks';

const itemPath = (item: QueueItem) =>
  item.kind === 'drink' ? communityDrinkPath(item.id) : `/spolecznosc/przepisy/${item.id}`;

const STATUS_LABELS: Record<QueueItem['status'], string> = {
  published: 'widoczny',
  reported: 'ukryty po zgłoszeniu',
  hidden: 'ukryty przez moderatora',
};

const button =
  'flex h-11 flex-1 items-center justify-center rounded-full border border-line bg-surface px-4 text-sm font-semibold focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent disabled:opacity-50';

type State = { status: 'loading' } | { status: 'denied' } | { status: 'ready'; items: QueueItem[] } | { status: 'error'; message: string };

/** Moderacja społeczności (/moderacja): zgłoszone i ukryte przepisy i napoje, decyzja: ukryj albo przywróć. */
export function ModerationPage() {
  const auth = useAuth({ load: true });
  const [state, setState] = useState<State>({ status: 'loading' });
  const [busy, setBusy] = useState<string | null>(null);
  const signedIn = auth.status === 'signed-in';

  const load = useCallback(async () => {
    try {
      if (!(await isModerator())) {
        setState({ status: 'denied' });
        return;
      }
      setState({ status: 'ready', items: await moderationQueue() });
    } catch (error) {
      setState({ status: 'error', message: error instanceof Error ? error.message : 'Nie udało się wczytać.' });
    }
  }, []);

  useEffect(() => {
    if (signedIn) void load();
  }, [signedIn, load]);

  const decide = async (item: QueueItem, decision: 'hide' | 'restore') => {
    setBusy(item.id);
    try {
      await (item.kind === 'drink' ? moderateDrink(item.id, decision) : moderateRecipe(item.id, decision));
      await load();
    } catch (error) {
      setState({ status: 'error', message: error instanceof Error ? error.message : 'Nie udało się.' });
    } finally {
      setBusy(null);
    }
  };

  const header = (
    <PageHeader
      title="Moderacja"
      lead="Zgłoszone przepisy i napoje społeczności. Przywrócone po kolejnym zgłoszeniu już nie znikają, tylko wracają tutaj."
      back={{ to: '/konto', label: 'Konto' }}
    />
  );

  if (!signedIn || state.status === 'denied') {
    return (
      <>
        {header}
        <EmptyState icon={ShieldIcon} title="Tylko dla moderatora">
          {auth.status === 'loading' ? 'Sprawdzam logowanie…' : 'Ta strona jest dostępna dla moderatora przepisów.'}
        </EmptyState>
      </>
    );
  }

  return (
    <>
      {header}
      {state.status === 'loading' && (
        <p role="status" className="text-ink-muted">
          Wczytuję zgłoszenia…
        </p>
      )}
      {state.status === 'error' && (
        <p role="alert" className="rounded-2xl border border-red-700/40 bg-red-700/10 p-4 text-sm">
          {state.message}
        </p>
      )}
      {state.status === 'ready' &&
        (state.items.length === 0 ? (
          <EmptyState icon={ShieldIcon} title="Nic do sprawdzenia">
            Nie ma nowych zgłoszeń.
          </EmptyState>
        ) : (
          <ul className="space-y-4">
            {state.items.map((item) => (
              <li key={`${item.kind}-${item.id}`} className="rounded-2xl border border-line bg-surface p-4">
                <h2 className="font-display text-lg font-semibold">
                  <Link to={itemPath(item)} className="underline">
                    {item.name}
                  </Link>
                </h2>
                <p className="text-sm text-ink-muted">
                  od {item.author} · {item.kind === 'drink' ? 'napój' : (getMethod(item.methodId ?? '')?.name ?? item.methodId)} ·{' '}
                  {STATUS_LABELS[item.status]}
                  {item.approved && ' · wcześniej przywrócony'}
                </p>
                <ul aria-label="Zgłoszenia" className="mt-2 space-y-1 text-sm">
                  {item.reports.map((report, index) => (
                    <li key={index}>
                      <span className="font-medium">{REPORT_REASONS[report.reason] ?? report.reason}</span>
                      {report.comment && <>: {report.comment}</>}
                    </li>
                  ))}
                </ul>
                <div className="mt-3 flex gap-2">
                  <button type="button" className={button} disabled={busy === item.id} onClick={() => void decide(item, 'hide')}>
                    Ukryj
                  </button>
                  <button type="button" className={button} disabled={busy === item.id} onClick={() => void decide(item, 'restore')}>
                    Przywróć
                  </button>
                </div>
              </li>
            ))}
          </ul>
        ))}
    </>
  );
}
