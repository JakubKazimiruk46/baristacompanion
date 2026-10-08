import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router';
import { PageHeader } from '../components/PageHeader';
import { Section } from '../components/Section';
import { Sheet } from '../components/Sheet';
import { BeanSummary } from '../features/beans/BeanSummary';
import { MethodRanking } from '../features/beans/MethodRanking';
import { beansStore, useBeans } from '../features/beans/store';
import { EntryCard } from '../features/journal/EntryCard';
import { useJournal } from '../features/journal/store';
import { useNow } from '../lib/useNow';
import { NotFoundPage } from './NotFoundPage';

const secondary =
  'flex h-12 flex-1 items-center justify-center rounded-full border border-line bg-surface px-4 font-semibold focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent';

export function BeanPage() {
  const { beanId } = useParams();
  const navigate = useNavigate();
  const beans = useBeans();
  const [showRanking, setShowRanking] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const bean = beans.find((b) => b.id === beanId);
  if (!bean) return <NotFoundPage />;

  return (
    <>
      <PageHeader title={bean.name} lead={bean.roaster} back={{ to: '/ziarna', label: 'Moje ziarna' }}>
        <div className="mt-3">
          <BeanSummary profile={bean.profile} />
        </div>
      </PageHeader>

      <button
        type="button"
        aria-expanded={showRanking}
        aria-controls="ranking"
        onClick={() => setShowRanking((v) => !v)}
        className="flex h-12 w-full items-center justify-center rounded-full bg-accent font-semibold text-on-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
      >
        {showRanking ? 'Ukryj podpowiedź' : 'Jak zaparzyć?'}
      </button>

      <section id="ranking" aria-label="Jak zaparzyć" hidden={!showRanking} className="mt-4">
        {showRanking && <MethodRanking profile={bean.profile} />}
      </section>

      <BeanBrews beanId={bean.id} />

      <div className="mt-6 flex gap-3">
        <Link to={`/ziarna/${bean.id}/edycja`} className={secondary}>
          Edytuj
        </Link>
        <button type="button" className={secondary} onClick={() => setConfirmDelete(true)}>
          Usuń
        </button>
      </div>

      <Sheet title={`Usunąć „${bean.name}”?`} open={confirmDelete} onClose={() => setConfirmDelete(false)}>
        <p className="text-ink-muted">Tej operacji nie da się cofnąć.</p>
        <div className="mt-5 flex gap-3">
          <button type="button" className={secondary} onClick={() => setConfirmDelete(false)}>
            Anuluj
          </button>
          <button
            type="button"
            className="flex h-12 flex-1 items-center justify-center rounded-full bg-red-700 font-semibold text-white"
            onClick={() => {
              beansStore.remove(bean.id);
              navigate('/ziarna', { replace: true });
            }}
          >
            Usuń ziarna
          </button>
        </div>
      </Sheet>
    </>
  );
}

const BREWS_SHOWN = 5;

/** Parzenia tych ziaren z dziennika (wybrane na ekranie końcowym albo w ścieżce „Mam kawę”). */
function BeanBrews({ beanId }: { beanId: string }) {
  const entries = useJournal().filter((entry) => entry.beanId === beanId);
  const now = useNow(60_000);
  if (entries.length === 0) return null;
  return (
    <Section title="Z dziennika parzeń">
      <ul className="space-y-3">
        {entries.slice(0, BREWS_SHOWN).map((entry) => (
          <li key={entry.id}>
            <EntryCard entry={entry} now={now} heading="h3" />
          </li>
        ))}
      </ul>
    </Section>
  );
}
