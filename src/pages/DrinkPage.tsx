import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router';
import { PageHeader } from '../components/PageHeader';
import { ReviewNote } from '../components/ReviewNote';
import { Sheet } from '../components/Sheet';
import { PencilIcon, ShareIcon, TrashIcon } from '../components/icons';
import { hasAlcohol, type Drink } from '../data';
import { AiBadge } from '../features/assistant/AiBadge';
import { isMyDrinkId, myDrinksStore, useDrink, useMyDrinkRecord, type MyDrink } from '../features/assistant/myDrinks';
import { PublishDrinkSection } from '../features/community/PublishDrinkSection';
import { DrinkBody } from '../features/drinks/DrinkBody';
import { DrinkMeta } from '../features/drinks/DrinkMeta';
import { FavoriteButton } from '../features/favorites/FavoriteButton';
import { useShareCard } from '../features/share/ShareSheet';
import { WishlistButton } from '../features/wishlist/WishlistButton';
import { NotFoundPage } from './NotFoundPage';

const buttonClass =
  'inline-flex h-11 items-center gap-2 rounded-full border border-line bg-surface px-4 font-medium transition-colors hover:bg-surface-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent';

/** Napój z katalogu albo z „Moich napojów” (/napoje/:drinkId). */
export function DrinkPage() {
  const { drinkId } = useParams();
  const drink = useDrink(drinkId);
  if (!drink) return <NotFoundPage />;
  return <DrinkView key={drink.id} drink={drink} />;
}

function DrinkView({ drink }: { drink: Drink }) {
  const mine = isMyDrinkId(drink.id);
  const record = useMyDrinkRecord(drink.id);
  return (
    <article>
      <PageHeader title={drink.name} lead={drink.description} back={{ to: '/napoje', label: 'Napoje' }}>
        {record && (
          <div className="mt-3">
            <SourceBadge record={record} />
          </div>
        )}
        <div className="mt-3">
          <DrinkMeta drink={drink} />
        </div>
        {drink.credit && <p className="mt-3 text-sm text-ink-muted">Przepis: {drink.credit.author}</p>}
        {hasAlcohol(drink) && (
          <p className="mt-3 rounded-2xl bg-surface-muted p-3 text-sm">
            Napój z alkoholem, tylko dla dorosłych. Nie podawaj go dzieciom, kobietom w ciąży ani kierowcom.
          </p>
        )}
        <div className="mt-4 flex flex-wrap gap-2">
          {!mine && <FavoriteButton drinkId={drink.id} />}
          <WishlistButton drinkId={drink.id} />
          <ShareButton drink={drink} />
          {mine ? (
            <>
              <Link to={`/napoje/${drink.id}/edycja`} className={buttonClass}>
                <PencilIcon className="size-5" />
                Edytuj
              </Link>
              <RemoveButton drink={drink} />
            </>
          ) : (
            <Link to={`/napoje/nowy?z=${drink.id}`} className={buttonClass}>
              <PencilIcon className="size-5" />
              Własna wersja
            </Link>
          )}
        </div>
        <ReviewNote item={drink} />
      </PageHeader>

      <DrinkBody drink={drink} />
      {record && <PublishDrinkSection item={record} />}
    </article>
  );
}

/** Skąd jest „Mój napój”: od AI (sprawdź proporcje), ze społeczności (od kogo) albo własny. */
function SourceBadge({ record }: { record: MyDrink }) {
  if (record.source === 'ai') return <AiBadge />;
  return (
    <p className="inline-flex items-center rounded-full bg-accent-soft px-3 py-1 text-sm font-medium text-accent">
      {record.source === 'community' && record.origin ? `Ze społeczności, od ${record.origin.author}` : 'Twój napój'}
    </p>
  );
}

/** Otwiera kartę napoju do udostępnienia (okno w adresie: ?karta=1). */
function ShareButton({ drink }: { drink: Drink }) {
  const card = useShareCard(drink);
  return (
    <>
      <button type="button" aria-haspopup="dialog" onClick={card.open} className={buttonClass}>
        <ShareIcon className="size-5" />
        Udostępnij
      </button>
      {card.sheet}
    </>
  );
}

/** „Moje napoje”: usunięcie z potwierdzeniem. */
function RemoveButton({ drink }: { drink: Drink }) {
  const [confirm, setConfirm] = useState(false);
  const navigate = useNavigate();
  return (
    <>
      <button type="button" className={buttonClass} onClick={() => setConfirm(true)}>
        <TrashIcon className="size-5" />
        Usuń
      </button>
      <Sheet title={`Usunąć „${drink.name}”?`} open={confirm} onClose={() => setConfirm(false)}>
        <p className="text-ink-muted">Napój zniknie z „Moich napojów”. Tej operacji nie da się cofnąć.</p>
        <div className="mt-5 flex gap-3">
          <button
            type="button"
            className="flex h-12 flex-1 items-center justify-center rounded-full border border-line bg-surface font-semibold"
            onClick={() => setConfirm(false)}
          >
            Anuluj
          </button>
          <button
            type="button"
            className="flex h-12 flex-1 items-center justify-center rounded-full bg-red-700 font-semibold text-white"
            onClick={() => {
              myDrinksStore.remove(drink.id);
              navigate('/napoje?moje=1', { replace: true });
            }}
          >
            Usuń
          </button>
        </div>
      </Sheet>
    </>
  );
}
