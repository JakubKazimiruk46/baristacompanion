import { useEffect, useState } from 'react';
import { Link } from 'react-router';
import { Section } from '../../components/Section';
import { Sheet } from '../../components/Sheet';
import { count } from '../../lib/format';
import { backendEnabled } from '../../lib/supabase';
import { useOnline } from '../../lib/useOnline';
import { useAuth } from '../account/auth';
import { loadProfile } from '../account/profile';
import type { UserRecipe } from '../recipes/recipe';
import { myPublished, publishRecipe, withdrawRecipe, type CommunityRecipe } from './api';
import { communityPath, SAVES } from './CommunitySection';

const primary =
  'flex h-12 w-full items-center justify-center rounded-full bg-accent px-6 font-semibold text-on-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent disabled:opacity-50';
const secondary =
  'flex h-12 w-full items-center justify-center rounded-full border border-line bg-surface px-4 font-semibold focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent disabled:opacity-50';

type Published = { id: string; status: CommunityRecipe['status']; savesCount: number } | null;
type State = { status: 'loading' } | { status: 'ready'; nick: string | null; published: Published } | { status: 'error'; message: string };

/** Publikowanie własnego przepisu w społeczności (ekran przepisu): wymaga konta i nicku. */
export function PublishSection({ recipe }: { recipe: UserRecipe }) {
  const auth = useAuth();
  const online = useOnline();
  if (!backendEnabled()) return null;

  if (recipe.origin) {
    return (
      <Section title="Społeczność">
        <p className="text-sm text-ink-muted">
          Przepis od <span className="font-medium text-ink">{recipe.origin.author}</span> z przepisów społeczności.
          Opublikować możesz tylko własne przepisy.
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
          Opublikuj przepis, żeby inni mogli parzyć według niego.{' '}
          <Link to="/konto" className="font-medium text-accent underline">
            Zaloguj się
          </Link>
          , żeby publikować.
        </p>
      ) : (
        <SignedIn key={auth.user.id} userId={auth.user.id} recipe={recipe} />
      )}
    </Section>
  );
}

function SignedIn({ userId, recipe }: { userId: string; recipe: UserRecipe }) {
  const [state, setState] = useState<State>({ status: 'loading' });
  const [dialog, setDialog] = useState<'publish' | 'withdraw' | null>(null);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);
  const [busy, setBusy] = useState(false);

  const refresh = async () => {
    try {
      const [profile, published] = await Promise.all([loadProfile(userId), myPublished(userId)]);
      setState({ status: 'ready', nick: profile?.nick ?? null, published: published.get(recipe.id) ?? null });
    } catch (error) {
      setState({ status: 'error', message: error instanceof Error ? error.message : 'Nie udało się wczytać.' });
    }
  };

  // refresh zależy tylko od userId i recipe.id.
  useEffect(() => {
    void refresh();
  }, [userId, recipe.id]);

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
        Przy opublikowanym przepisie widać Twój nick.{' '}
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
                <Link to={communityPath(recipe.methodId, published.id)} className="font-medium text-accent underline">
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
              onClick={() => void act(() => publishRecipe(userId, recipe), 'Zaktualizowano przepis w społeczności.')}
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
          <p className="text-sm text-ink-muted">Opublikuj przepis, żeby inni mogli parzyć według niego.</p>
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

      <Sheet title="Opublikować przepis?" open={dialog === 'publish'} onClose={() => setDialog(null)}>
        <p className="text-ink-muted">
          Przepis zobaczy każdy, z Twoim nickiem „{nick}”. Ustawienie młynka zostaje u Ciebie. Możesz go później
          zaktualizować albo wycofać.
        </p>
        <button
          type="button"
          className={`mt-5 ${primary}`}
          disabled={busy}
          onClick={() => void act(() => publishRecipe(userId, recipe), 'Opublikowano. Dziękujemy!')}
        >
          Opublikuj
        </button>
      </Sheet>

      <Sheet title="Wycofać przepis?" open={dialog === 'withdraw'} onClose={() => setDialog(null)}>
        <p className="text-ink-muted">
          Przepis zniknie z przepisów społeczności. U Ciebie zostaje, a osoby, które go zapisały, mają swoje kopie.
        </p>
        <button
          type="button"
          className={`mt-5 ${primary}`}
          disabled={busy}
          onClick={() => void act(() => withdrawRecipe(userId, recipe.id), 'Wycofano przepis ze społeczności.')}
        >
          Wycofaj
        </button>
      </Sheet>
    </>
  );
}
