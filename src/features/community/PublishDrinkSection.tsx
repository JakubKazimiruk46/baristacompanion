import { useEffect, useState, type ReactNode } from 'react';
import { Link } from 'react-router';
import { Section } from '../../components/Section';
import { Sheet } from '../../components/Sheet';
import { count } from '../../lib/format';
import { backendEnabled } from '../../lib/supabase';
import { useDialogParam } from '../../lib/useDialogParam';
import { useOnline } from '../../lib/useOnline';
import { useAuth } from '../account/auth';
import { loadProfile } from '../account/profile';
import type { MyDrink } from '../assistant/myDrinks';
import { SAVES } from './CommunitySection';
import {
  canPublishDrink,
  communityDrinkPath,
  myPublishedDrinks,
  publishDrink,
  PUBLISH_STEP_PARAM,
  withdrawDrink,
  type PublishedDrink,
} from './drinks';

const primary =
  'flex h-12 w-full items-center justify-center rounded-full bg-accent px-6 font-semibold text-on-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent disabled:opacity-50';
const secondary =
  'flex h-12 w-full items-center justify-center rounded-full border border-line bg-surface px-4 font-semibold focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent disabled:opacity-50';

type State =
  | { status: 'loading' }
  | { status: 'ready'; nick: string | null; published: PublishedDrink | null }
  | { status: 'error'; message: string };

/** Okno „Napój zapisany” po kreatorze (?opublikuj=1): otwarcie i zamknięcie. */
interface Step {
  open: boolean;
  close: () => void;
}

/**
 * Publikowanie „Mojego napoju” w społeczności (ekran napoju). Wymaga konta i nicku; publikować
 * można tylko własne napoje z kreatora (nie kopie ze społeczności i nie niepoprawione propozycje AI).
 * Ostatni krok kreatora to okno „Napój zapisany” z tym samym stanem co sekcja.
 */
export function PublishDrinkSection({ item }: { item: MyDrink }) {
  const auth = useAuth();
  const online = useOnline();
  const dialog = useDialogParam(PUBLISH_STEP_PARAM);
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

  const step: Step = { open: dialog.value !== null, close: dialog.close };
  const path = `/napoje/${item.drink.id}`;

  return (
    <Section title="Społeczność">
      {!online ? (
        <>
          <p className="text-sm text-ink-muted">Publikowanie wymaga internetu.</p>
          <StepSheet step={step}>
            <p className="text-ink-muted">
              Napój jest w „Moich napojach”. Publikowanie wymaga internetu: opublikujesz go później na dole ekranu
              napoju.
            </p>
            <StepClose step={step} label="Zamknij" />
          </StepSheet>
        </>
      ) : auth.status !== 'signed-in' ? (
        <>
          <p className="text-sm text-ink-muted">
            Pokaż napój innym w zakładce Społeczność.{' '}
            <Link to={`/konto?wroc=${encodeURIComponent(path)}`} className="font-medium text-accent underline">
              Zaloguj się
            </Link>
            , żeby publikować.
          </p>
          <StepSheet step={step}>
            {auth.status === 'loading' ? (
              <p role="status" className="text-ink-muted">
                Sprawdzam…
              </p>
            ) : (
              <>
                <p className="text-ink-muted">
                  Napój jest w „Moich napojach”. Zaloguj się, żeby pokazać go innym w zakładce Społeczność.
                </p>
                {/* Po zalogowaniu wraca tu z otwartym oknem. */}
                <Link to={`/konto?wroc=${encodeURIComponent(`${path}?${PUBLISH_STEP_PARAM}=1`)}`} className={`mt-5 ${primary}`}>
                  Zaloguj się
                </Link>
                <StepClose step={step} />
              </>
            )}
          </StepSheet>
        </>
      ) : (
        <SignedIn key={auth.user.id} userId={auth.user.id} item={item} step={step} />
      )}
    </Section>
  );
}

function StepSheet({ step, children }: { step: Step; children: ReactNode }) {
  return (
    <Sheet title="Napój zapisany" open={step.open} onClose={step.close}>
      {children}
    </Sheet>
  );
}

function StepClose({ step, label = 'Nie teraz' }: { step: Step; label?: string }) {
  return (
    <button type="button" className={`mt-3 ${secondary}`} onClick={step.close}>
      {label}
    </button>
  );
}

function SignedIn({ userId, item, step }: { userId: string; item: MyDrink; step: Step }) {
  const [state, setState] = useState<State>({ status: 'loading' });
  const [dialog, setDialog] = useState<'publish' | 'withdraw' | null>(null);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const [stepDone, setStepDone] = useState(false);
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

  const act = async (action: () => Promise<void>, success: string): Promise<boolean> => {
    setBusy(true);
    try {
      await action();
      setMessage({ ok: true, text: success });
      await refresh();
      return true;
    } catch (error) {
      setMessage({ ok: false, text: error instanceof Error ? error.message : 'Nie udało się.' });
      return false;
    } finally {
      setBusy(false);
      setDialog(null);
    }
  };

  const messageLine = message && (
    <p role={message.ok ? 'status' : 'alert'} className="mt-3 text-sm font-medium">
      {message.text}
    </p>
  );

  return (
    <>
      {sectionBody()}
      <StepSheet step={step}>{stepBody()}</StepSheet>
    </>
  );

  // Zwykłe funkcje, nie komponenty: okna w środku nie mogą się montować od nowa przy każdym renderze.
  function sectionBody(): ReactNode {
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
        {!step.open && messageLine}

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

  /** Ostatni krok kreatora: publikacja nowego napoju albo aktualizacja już opublikowanego. */
  function stepBody(): ReactNode {
    if (state.status === 'loading') {
      return (
        <p role="status" className="text-ink-muted">
          Sprawdzam…
        </p>
      );
    }
    if (state.status === 'error') {
      return (
        <>
          <p role="alert">{state.message}</p>
          <StepClose step={step} label="Zamknij" />
        </>
      );
    }
    if (!state.nick) {
      return (
        <>
          <p className="text-ink-muted">
            Napój jest w „Moich napojach”. Żeby go opublikować, ustaw nick: widać go przy opublikowanym napoju.
          </p>
          <Link to="/konto" className={`mt-5 ${primary}`}>
            Ustaw nick
          </Link>
          <StepClose step={step} />
        </>
      );
    }

    const { published, nick } = state;
    if (stepDone && published) {
      return (
        <>
          {messageLine}
          <Link to={communityDrinkPath(published.id)} className={`mt-5 ${secondary}`}>
            Zobacz w Społeczności
          </Link>
          <button type="button" className={`mt-3 ${primary}`} onClick={step.close}>
            Gotowe
          </button>
        </>
      );
    }

    const update = published !== null;
    return (
      <>
        <p className="text-ink-muted">
          {update
            ? `Ten napój jest w Społeczności. Zaktualizuj go, żeby inni widzieli nową wersję (z Twoim nickiem „${nick}”).`
            : `Opublikuj go w Społeczności, żeby inni mogli go zrobić i zapisać u siebie. Zobaczy go każdy, z Twoim nickiem „${nick}”. Możesz go później zaktualizować albo wycofać.`}
        </p>
        {messageLine}
        <button
          type="button"
          className={`mt-5 ${primary}`}
          disabled={busy}
          onClick={() =>
            void act(
              () => publishDrink(userId, item),
              update ? 'Zaktualizowano napój w społeczności.' : 'Opublikowano. Dziękujemy!',
            ).then((ok) => ok && setStepDone(true))
          }
        >
          {update ? 'Zaktualizuj w społeczności' : 'Opublikuj'}
        </button>
        <StepClose step={step} />
      </>
    );
  }
}
