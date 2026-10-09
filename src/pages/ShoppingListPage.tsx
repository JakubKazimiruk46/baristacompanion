import { useState } from 'react';
import { Link } from 'react-router';
import { EmptyState } from '../components/EmptyState';
import { CartIcon, ShareIcon } from '../components/icons';
import { PageHeader } from '../components/PageHeader';
import { getIngredient, getSyrup } from '../data';
import { drinkName } from '../features/assistant/myDrinks';
import { shoppingStore, useShopping, type ShoppingItem } from '../features/shelf/shopping';
import { capitalize } from '../lib/format';

const secondary =
  'flex h-12 flex-1 items-center justify-center gap-2 rounded-full border border-line bg-surface px-4 font-semibold focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent';

/** Lista do wysłania albo skopiowania: „Kupić: tonik, maliny”. */
export function shoppingText(items: ShoppingItem[]): string {
  return `Kupić do kawy:\n${items.map((item) => `- ${getIngredient(item.id)!.name}`).join('\n')}`;
}

export function ShoppingListPage() {
  const items = useShopping();
  const toBuy = items.filter((item) => !item.bought);
  const bought = items.filter((item) => item.bought);
  const [copied, setCopied] = useState(false);

  const share = async () => {
    const text = shoppingText(toBuy);
    try {
      if (navigator.share) {
        await navigator.share({ title: 'Lista zakupów', text });
        return;
      }
      await navigator.clipboard.writeText(text);
      setCopied(true);
    } catch {
      // Użytkownik zamknął okno udostępniania albo schowek jest zablokowany.
    }
  };

  return (
    <>
      <PageHeader
        title="Lista zakupów"
        lead="Odhacz, co kupisz: składnik trafi do „Co mam w domu”."
        back={{ to: '/napoje', label: 'Napoje' }}
      />

      {items.length === 0 ? (
        <EmptyState icon={CartIcon} title="Lista jest pusta">
          Na ekranie napoju albo w{' '}
          <Link to="/napoje/co-mam" className="font-medium text-accent underline">
            Co mam w domu
          </Link>{' '}
          dodasz brakujące składniki jednym tapnięciem.
        </EmptyState>
      ) : (
        <>
          <ul className="divide-y divide-line rounded-2xl border border-line bg-surface">
            {[...toBuy, ...bought].map((item) => (
              <Item key={item.id} item={item} />
            ))}
          </ul>

          <div className="mt-6 flex gap-3">
            {toBuy.length > 0 && (
              <button type="button" className={secondary} onClick={share}>
                <ShareIcon className="size-5" />
                Wyślij listę
              </button>
            )}
            {bought.length > 0 && (
              <button type="button" className={secondary} onClick={shoppingStore.clearBought}>
                Usuń kupione
              </button>
            )}
          </div>
          {copied && (
            <p role="status" className="mt-2 text-center text-sm text-ink-muted">
              Skopiowano listę do schowka.
            </p>
          )}
        </>
      )}
    </>
  );
}

function Item({ item }: { item: ShoppingItem }) {
  const ingredient = getIngredient(item.id)!;
  const syrup = getSyrup(item.id);
  const drinkNames = item.drinkIds.flatMap((id) => drinkName(id) ?? []);
  return (
    <li className="flex items-start gap-3 px-4 py-3">
      <label className="flex min-h-11 flex-1 cursor-pointer items-start gap-3">
        <input
          type="checkbox"
          className="mt-1 size-5 shrink-0 accent-accent"
          checked={item.bought}
          onChange={() => shoppingStore.toggleBought(item.id)}
        />
        <span className="min-w-0">
          <span className={`block font-medium ${item.bought ? 'text-ink-muted line-through' : ''}`}>
            {capitalize(ingredient.name)}
          </span>
          {drinkNames.length > 0 && (
            <span className="block text-sm text-ink-muted">do: {drinkNames.join(', ')}</span>
          )}
        </span>
      </label>
      {syrup && !item.bought && (
        <Link
          to={`/napoje/syropy#${syrup.id}`}
          className="inline-flex h-11 shrink-0 items-center text-sm font-medium text-accent"
        >
          albo zrób sam
        </Link>
      )}
    </li>
  );
}
