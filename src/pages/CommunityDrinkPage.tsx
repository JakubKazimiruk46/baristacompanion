import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router';
import { EmptyState } from '../components/EmptyState';
import { DrinkIcon, LinkIcon, ShareIcon } from '../components/icons';
import { PageHeader } from '../components/PageHeader';
import { Sheet } from '../components/Sheet';
import { hasAlcohol } from '../data';
import { useAuth } from '../features/account/auth';
import { myDrinksStore, useMyDrinks } from '../features/assistant/myDrinks';
import { SAVES } from '../features/community/CommunitySection';
import { countDrinkSave, getCommunityDrink, reportDrink, type CommunityDrink } from '../features/community/drinks';
import { ReportForm } from '../features/community/ReportForm';
import { DrinkBody } from '../features/drinks/DrinkBody';
import { DrinkMeta } from '../features/drinks/DrinkMeta';
import { useShareCard } from '../features/share/ShareSheet';
import { count } from '../lib/format';
import { backendEnabled } from '../lib/supabase';
import { useOnline } from '../lib/useOnline';
import { NotFoundPage } from './NotFoundPage';

const BACK = { to: '/spolecznosc', label: 'Społeczność' };
const button =
  'inline-flex h-11 items-center gap-2 rounded-full border border-line bg-surface px-4 font-medium transition-colors hover:bg-surface-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent disabled:opacity-50';
const primary =
  'inline-flex h-11 items-center gap-2 rounded-full bg-accent px-4 font-semibold text-on-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent disabled:opacity-50';

type Loaded = { status: 'loading' } | { status: 'missing' } | { status: 'error'; message: string } | { status: 'ready'; item: CommunityDrink };

/** Napój społeczności (/spolecznosc/napoje/:id): rysunek, składniki, kroki, zapis u siebie, udostępnianie, zgłoszenie. */
export function CommunityDrinkPage() {
  const { communityId } = useParams();
  const online = useOnline();
  const [loaded, setLoaded] = useState<Loaded>({ status: 'loading' });

  useEffect(() => {
    if (!communityId || !online || !backendEnabled()) return;
    let cancelled = false;
    setLoaded({ status: 'loading' });
    getCommunityDrink(communityId)
      .then((item) => {
        if (!cancelled) setLoaded(item ? { status: 'ready', item } : { status: 'missing' });
      })
      .catch((error: Error) => {
        if (!cancelled) setLoaded({ status: 'error', message: error.message });
      });
    return () => {
      cancelled = true;
    };
  }, [communityId, online]);

  if (!backendEnabled()) return <NotFoundPage />;
  if (!online) {
    return (
      <>
        <PageHeader title="Napój społeczności" back={BACK} />
        <EmptyState icon={DrinkIcon} title="Brak internetu">
          Napoje społeczności wymagają połączenia. Twoje napoje i reszta aplikacji działają bez niego.
        </EmptyState>
      </>
    );
  }
  if (loaded.status === 'loading') {
    return (
      <>
        <PageHeader title="Napój społeczności" back={BACK} />
        <p role="status" className="text-ink-muted">
          Wczytuję napój…
        </p>
      </>
    );
  }
  if (loaded.status !== 'ready') {
    return (
      <>
        <PageHeader title="Napój społeczności" back={BACK} />
        <EmptyState icon={DrinkIcon} title={loaded.status === 'missing' ? 'Tego napoju już nie ma' : 'Nie udało się wczytać'}>
          {loaded.status === 'missing' ? 'Autor go wycofał albo napój czeka na decyzję moderatora.' : loaded.message}
        </EmptyState>
      </>
    );
  }
  return <CommunityDrinkView key={loaded.item.id} item={loaded.item} />;
}

function CommunityDrinkView({ item }: { item: CommunityDrink }) {
  const { drink } = item;
  const auth = useAuth();
  const navigate = useNavigate();
  const card = useShareCard(drink);
  const myDrinks = useMyDrinks();
  const saved = myDrinks.find((mine) => mine.origin?.communityId === item.id);
  const [saves, setSaves] = useState(item.savesCount);
  const [reporting, setReporting] = useState(false);
  const [reported, setReported] = useState(false);
  const [linkStatus, setLinkStatus] = useState<string | null>(null);
  const signedIn = auth.status === 'signed-in';
  const mine = signedIn && auth.user.id === item.authorId;
  /** Autor nie zapisuje kopii swojego napoju: ma oryginał w „Moich napojach” (jeśli jest na tym urządzeniu). */
  const original = mine ? myDrinks.find((own) => own.drink.id === item.sourceId) : undefined;

  const saveLocally = () => {
    const copy = myDrinksStore.add(drink, Date.now(), {
      source: 'community',
      origin: { communityId: item.id, author: item.author },
    });
    if (signedIn) {
      countDrinkSave(item.id)
        .then((total) => total !== null && setSaves(total))
        .catch(() => {});
    }
    navigate(`/napoje/${copy.id}`);
  };

  /** Link do tego napoju: systemowe „Udostępnij” na telefonie, a gdzie go nie ma, schowek. */
  const shareLink = async () => {
    const url = `${window.location.origin}/spolecznosc/napoje/${item.id}`;
    try {
      if (navigator.share) {
        await navigator.share({ title: drink.name, text: `${drink.name} od ${item.author}`, url });
        return;
      }
      await navigator.clipboard.writeText(url);
      setLinkStatus('Skopiowano link do schowka.');
    } catch (error) {
      // Zamknięte okno udostępniania to nie błąd.
      if (error instanceof DOMException && error.name === 'AbortError') return;
      setLinkStatus(`Nie udało się udostępnić. Link: ${url}`);
    }
  };

  return (
    <article>
      <PageHeader title={drink.name} lead={drink.description} back={BACK}>
        <p className="mt-3 text-sm">
          Napój od <span className="font-semibold">{item.author}</span> · {count(saves, SAVES)}
        </p>
        <div className="mt-3">
          <DrinkMeta drink={drink} />
        </div>
        {hasAlcohol(drink) && (
          <p className="mt-3 rounded-2xl bg-surface-muted p-3 text-sm">
            Napój z alkoholem, tylko dla dorosłych. Nie podawaj go dzieciom, kobietom w ciąży ani kierowcom.
          </p>
        )}
        <p className="mt-3 rounded-2xl bg-accent-soft p-3 text-sm">Przepis od społeczności: proporcje sprawdź sam.</p>
        <div className="mt-4 flex flex-wrap gap-2">
          {mine ? (
            original ? (
              <Link to={`/napoje/${original.drink.id}`} className={button}>
                Twój napój: otwórz
              </Link>
            ) : (
              <p className="flex min-h-11 items-center text-sm font-medium">To Twój napój.</p>
            )
          ) : saved ? (
            <Link to={`/napoje/${saved.drink.id}`} className={button}>
              Masz go w „Moich napojach”
            </Link>
          ) : (
            <button type="button" className={primary} onClick={saveLocally}>
              Zapisz u siebie
            </button>
          )}
          <button type="button" aria-haspopup="dialog" onClick={card.open} className={button}>
            <ShareIcon className="size-5" />
            Karta
          </button>
          <button type="button" onClick={() => void shareLink()} className={button}>
            <LinkIcon className="size-5" />
            Wyślij link
          </button>
        </div>
        {linkStatus && (
          <p role="status" className="mt-2 text-sm text-ink-muted">
            {linkStatus}
          </p>
        )}
        {card.sheet}
      </PageHeader>

      {reported && (
        <p role="status" className="mb-4 rounded-2xl bg-accent-soft p-4 text-sm font-medium">
          Dziękujemy. Napój jest ukryty do decyzji moderatora.
        </p>
      )}

      <DrinkBody drink={drink} />

      {!mine && !reported && (
        <div className="mt-8">
          {signedIn ? (
            <button type="button" className="h-10 text-sm font-medium text-accent underline" onClick={() => setReporting(true)}>
              Zgłoś napój
            </button>
          ) : (
            <p className="text-sm text-ink-muted">
              Coś jest nie tak z tym napojem?{' '}
              <Link to={`/konto?wroc=${encodeURIComponent(`/spolecznosc/napoje/${item.id}`)}`} className="font-medium text-accent underline">
                Zaloguj się
              </Link>
              , żeby go zgłosić.
            </p>
          )}
        </div>
      )}

      <Sheet title="Zgłoś napój" subtitle={drink.name} open={reporting} onClose={() => setReporting(false)}>
        <ReportForm
          what="napój"
          onReport={(reason, comment) => reportDrink(item.id, reason, comment)}
          onDone={() => {
            setReporting(false);
            setReported(true);
          }}
        />
      </Sheet>
    </article>
  );
}
