import { useEffect, useState } from 'react';
import { Link } from 'react-router';
import { Section } from '../../components/Section';
import { Sheet } from '../../components/Sheet';
import { count } from '../../lib/format';
import { backendEnabled } from '../../lib/supabase';
import { useOnline } from '../../lib/useOnline';
import { useAuth } from '../account/auth';
import { loadProfile } from '../account/profile';
import type { MyDrink } from '../assistant/myDrinks';
import { SAVES } from './CommunitySection';
import { canPublishDrink, communityDrinkPath, myPublishedDrinks, publishDrink, withdrawDrink, type PublishedDrink } from './drinks';

const primary =
  'flex h-12 w-full items-center justify-center rounded-full bg-accent px-6 font-semibold text-on-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent disabled:opacity-50';
const secondary =
  'flex h-12 w-full items-center justify-center rounded-full border border-line bg-surface px-4 font-semibold focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent disabled:opacity-50';

type State =
  | { status: 'loading' }
  | { status: 'ready'; nick: string | null; published: PublishedDrink | null }
  | { status: 'error'; message: string };

/**
 * Publikowanie „Mojego napoju” w społeczności (ekran napoju). Wymaga konta i nicku; publikować
 * można tylko własne napoje z kreatora (nie kopie ze społeczności i nie niepoprawione propozycje AI).
 */
export function PublishDrinkSection({ item }: { item: MyDrink }) {
  const auth = useAuth();
  const online = useOnline();
  if (!backendEnabled()) return null;

  if (!canPublishDrink(item)) {
    return (
      <Section title="Społeczność">
        <p className="text-sm text-ink-muted">
          {item.origin ? (
            <>
              Napój od <span className="font-medium text-ink">{item.origin.author}</span> ze społeczności. Opublikować
              możesz tylko własne napoje.
            </>
          ) : (
            <>
              To propozycja AI. Sprawdź ją i popraw w kreatorze (<span className="font-medium text-ink">Edytuj</span>):
              wtedy stanie się Twoim napojem i będzie można ją opublikować.
            </>
          )}
        </p>
      </Section>
    );
  }

  return (
    <Section title="Społeczność">
      {!online ? (
        <p className="text-sm text-ink-muted">Publikowanie wymaga internetu.</p>
      ) : auth.status !== 'signed-in' ? (
        <p className="text-sm text-ink-muted">
          Pokaż napój innym w zakładce Społeczność.{' '}
          <Link to={`/konto?wroc=${encodeURIComponent(`/napoje/${item.drink.id}`)}`} className="font-medium text-accent underline">
            Zaloguj się
          </Link>
          , żeby publikować.
        </p>
      ) : (
        <SignedIn key={auth.user.id} userId={auth.user.id} item={item} />
      )}
    </Section>
  );
}

function SignedIn({ userId, item }: { userId: string; item: MyDrink }) {
  const [state, setState] = useState<State>({ status: 'loading' });
  const [dialog, setDialog] = useState<'publish' | 'withdraw' | null>(null);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const sourceId = item.drink.id;

  const refresh = async () => {
    try {
      const [profile, published] = await Promise.all([loadProfile(userId), myPublishedDrinks(userId)]);
      setState({ status: 'ready', nick: profile?.nick ?? null, published: published.get(sourceId) ?? null });
    } catch (error) {
      setState({ status: 'error', message: error instanceof Error ? error.message : 'Nie udało się wczytać.' });
    }
  };

  // refresh zależy tylko od userId i id napoju.
  useEffect(() => {
    void refresh();
  }, [userId, sourceId]);

  const act = async (action: () => Promise<void>, success: string) => {
    setBusy(true);
    try {
      await action();
      setMessage({ ok: true, text: success });
      await refresh();
    } catch (error) {
      setMessage({ ok: false, text: error instanceof Error ? error.message : 'Nie udało się.' });
    } finally {
      setBusy(false);
      setDialog(null);
    }
  };

  if (state.status === 'loading') {
    return (
      <p role="status" className="text-sm text-ink-muted">
        Sprawdzam…
      </p>
    );
  }
  if (state.status === 'error') {
    return (
      <p role="alert" className="text-sm">
        {state.message}
      </p>
    );
  }
  if (!state.nick) {
    return (
      <p className="text-sm text-ink-muted">
        Przy opublikowanym napoju widać Twój nick.{' '}
        <Link to="/konto" className="font-medium text-accent underline">
          Ustaw nick na ekranie konta
        </Link>
        .
      </p>
    );
  }

  const { published, nick } = state;
  return (
    <>
      {published ? (
        <>
          <p className="text-sm">
            {published.status === 'published' ? (
              <>
                <Link to={communityDrinkPath(published.id)} className="font-medium text-accent underline">
                  Opublikowany
                </Link>{' '}
                jako {nick} · {count(published.savesCount, SAVES)}
              </>
            ) : (
              'Ukryty po zgłoszeniu: czeka na decyzję moderatora.'
            )}
          </p>
          <div className="mt-3 flex flex-col gap-3">
            <button
              type="button"
              className={secondary}
              disabled={busy}
              onClick={() => void act(() => publishDrink(userId, item), 'Zaktualizowano napój w społeczności.')}
            >
              Zaktualizuj w społeczności
            </button>
            <button type="button" className={secondary} disabled={busy} onClick={() => setDialog('withdraw')}>
              Wycofaj
            </button>
          </div>
        </>
      ) : (
        <>
          <p className="text-sm text-ink-muted">Opublikuj napój, żeby inni mogli go zrobić i zapisać u siebie.</p>
          <button type="button" className={`mt-3 ${primary}`} disabled={busy} onClick={() => setDialog('publish')}>
            Opublikuj
          </button>
        </>
      )}
      {message && (
        <p role={message.ok ? 'status' : 'alert'} className="mt-3 text-sm font-medium">
          {message.text}
        </p>
      )}

      <Sheet title="Opublikować napój?" open={dialog === 'publish'} onClose={() => setDialog(null)}>
        <p className="text-ink-muted">
          Napój z rysunkiem, składnikami i krokami zobaczy każdy, z Twoim nickiem „{nick}”. Możesz go później
          zaktualizować albo wycofać.
        </p>
        <button
          type="button"
          className={`mt-5 ${primary}`}
          disabled={busy}
          onClick={() => void act(() => publishDrink(userId, item), 'Opublikowano. Dziękujemy!')}
        >
          Opublikuj
        </button>
      </Sheet>

      <Sheet title="Wycofać napój?" open={dialog === 'withdraw'} onClose={() => setDialog(null)}>
        <p className="text-ink-muted">
          Napój zniknie ze społeczności. U Ciebie zostaje, a osoby, które go zapisały, mają swoje kopie.
        </p>
        <button
          type="button"
          className={`mt-5 ${primary}`}
          disabled={busy}
          onClick={() => void act(() => withdrawDrink(userId, sourceId), 'Wycofano napój ze społeczności.')}
        >
          Wycofaj
        </button>
      </Sheet>
    </>
  );
}
