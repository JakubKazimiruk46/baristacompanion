import { Link } from 'react-router';
import { CartIcon, CheckIcon, PantryIcon } from '../../components/icons';
import { getIngredient, getMethod, type Drink } from '../../data';
import { capitalize } from '../../lib/format';
import { checkDrink, shoppingIds, type Availability, type Missing } from './availability';
import { shoppingStore, useShopping } from './shopping';
import { useSavedShelf } from './store';

const name = (id: string) => getIngredient(id)!.name;

/** „tonik”, „mleko krowie 3,2% albo inne z listy”, „sprzęt: Kawiarka albo AeroPress” */
export function missingLabel(missing: Missing): string {
  switch (missing.kind) {
    case 'ingredient':
      return name(missing.id);
    case 'milk':
      return name(missing.options[0]!).toLowerCase() + (missing.options.length > 1 ? ' albo inne z listy' : '');
    case 'method':
      return `sprzęt: ${missing.options.map((id) => getMethod(id)!.name).join(' albo ')}`;
  }
}

/** Czego brakuje i przycisk dokładający braki do listy zakupów. */
export function MissingItems({ drinkId, availability }: { drinkId: string; availability: Availability }) {
  const shopping = useShopping();
  const ids = shoppingIds(availability);
  const onList = ids.length > 0 && ids.every((id) => shopping.some((item) => item.id === id && !item.bought));

  return (
    <div>
      <p>
        <span className="font-semibold">Brakuje: </span>
        {availability.missing.map(missingLabel).join(', ')}
      </p>
      {ids.length > 0 &&
        (onList ? (
          <Link to="/napoje/zakupy" className="mt-2 inline-flex h-10 items-center gap-2 font-medium text-accent">
            <CheckIcon className="size-5" />
            Na liście zakupów
          </Link>
        ) : (
          <button
            type="button"
            onClick={() => shoppingStore.addForDrink(drinkId, ids)}
            className="mt-2 inline-flex h-10 items-center gap-2 rounded-full bg-accent px-4 text-sm font-semibold text-on-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
          >
            <CartIcon className="size-5" />
            Dodaj do listy zakupów
          </button>
        ))}
    </div>
  );
}

/**
 * Na ekranie napoju: czy masz wszystko w domu. Bez ustawionej półki tylko zachęta,
 * żeby ją uzupełnić (inaczej prawie każdy napój „czegoś by nie miał”).
 */
export function DrinkAvailability({ drink }: { drink: Drink }) {
  const shelf = useSavedShelf();
  if (!shelf) {
    return (
      <Link
        to="/napoje/co-mam"
        className="mb-3 flex h-12 items-center gap-2 rounded-2xl border border-dashed border-line px-4 text-sm font-medium text-accent"
      >
        <PantryIcon className="size-5" />
        Sprawdź, czy masz wszystko w domu
      </Link>
    );
  }

  const availability = checkDrink(drink, shelf);
  return (
    <div role="status" className="mb-3 rounded-2xl bg-surface-muted p-4 text-sm">
      {availability.status === 'missing' ? (
        <MissingItems drinkId={drink.id} availability={availability} />
      ) : (
        <>
          <p className="flex items-center gap-2 font-semibold">
            <CheckIcon className="size-5 text-accent" />
            {availability.status === 'ready' ? 'Masz wszystko, co trzeba.' : 'Masz wszystko, z zamiennikiem.'}
          </p>
          {availability.substitutions.map((s) => (
            <p key={s.ingredientId} className="mt-1">
              <span className="font-medium">
                {capitalize(name(s.ingredientId))}: użyj „{name(s.substituteId)}”.
              </span>{' '}
              {s.note}
            </p>
          ))}
        </>
      )}
    </div>
  );
}
