import { Link, useLocation } from 'react-router';
import { ChoiceChip } from '../components/ChoiceChip';
import { ChevronRightIcon } from '../components/icons';
import { PageHeader } from '../components/PageHeader';
import { Section } from '../components/Section';
import { drinks, ingredients, INGREDIENT_GROUP_LABELS, INGREDIENT_GROUPS, methods } from '../data';
import { DrinkCard } from '../features/drinks/DrinkCard';
import { checkDrink } from '../features/shelf/availability';
import { MissingItems } from '../features/shelf/DrinkAvailability';
import { useShopping } from '../features/shelf/shopping';
import { shelfStore, useShelf } from '../features/shelf/store';
import { capitalize, count } from '../lib/format';

const DRINKS: [string, string, string] = ['napój', 'napoje', 'napojów'];

// Woda jest zawsze, więc nie ma jej na półce.
const GROUPS = INGREDIENT_GROUPS.map((group) => ({
  group,
  items: ingredients.filter((i) => i.group === group && !i.always),
})).filter(({ items }) => items.length > 0);

/** „Co mam w domu”: składniki i sprzęt, a pod spodem napoje, do których brakuje jednej rzeczy. */
export function ShelfPage() {
  const shelf = useShelf();
  const location = useLocation();
  const shopping = useShopping().filter((item) => !item.bought);
  const checked = drinks.map((drink) => ({ drink, availability: checkDrink(drink, shelf) }));
  const ready = checked.filter(({ availability }) => availability.status !== 'missing');
  const almost = checked.filter(({ availability }) => availability.missing.length === 1);

  return (
    <>
      <PageHeader
        title="Co mam w domu"
        lead="Zaznacz, co masz w kuchni. Pokażemy, które napoje zrobisz od razu, a czego brakuje do pozostałych."
        back={{ to: '/napoje', label: 'Napoje' }}
      />

      <div className="rounded-3xl bg-accent-soft p-5">
        <p role="status" className="font-display text-2xl font-semibold">
          Zrobisz teraz: {count(ready.length, DRINKS)}
        </p>
        {almost.length > 0 && (
          <p className="mt-1 text-sm">
            Do {count(almost.length, ['kolejnego napoju', 'kolejnych napojów', 'kolejnych napojów'])}{' '}
            brakuje jednej rzeczy.
          </p>
        )}
        <div className="mt-3 flex flex-wrap gap-2">
          <Link
            to="/napoje?mam=1"
            className="inline-flex h-11 items-center gap-1 rounded-full bg-accent px-4 font-semibold text-on-accent"
          >
            Pokaż napoje
            <ChevronRightIcon className="size-5" />
          </Link>
          {shopping.length > 0 && (
            <Link
              to="/napoje/zakupy"
              className="inline-flex h-11 items-center rounded-full bg-surface px-4 font-medium text-accent"
            >
              Lista zakupów ({shopping.length})
            </Link>
          )}
        </div>
      </div>

      {GROUPS.map(({ group, items }) => (
        <fieldset key={group} className="mt-8">
          <legend className="font-display text-xl font-semibold">{INGREDIENT_GROUP_LABELS[group]}</legend>
          {group === 'syrup' && (
            <p className="mt-1 text-sm text-ink-muted">
              Syrop zrobisz też sam w kwadrans:{' '}
              <Link to="/napoje/syropy" className="font-medium text-accent underline">
                przepisy
              </Link>
              .
            </p>
          )}
          <div className="mt-3 flex flex-wrap gap-2">
            {items.map((ingredient) => (
              <ChoiceChip
                key={ingredient.id}
                type="checkbox"
                checked={shelf.ingredients.includes(ingredient.id)}
                onChange={() => shelfStore.toggleIngredient(ingredient.id)}
              >
                {capitalize(ingredient.name)}
              </ChoiceChip>
            ))}
          </div>
        </fieldset>
      ))}

      <fieldset className="mt-8">
        <legend className="font-display text-xl font-semibold">Sprzęt do parzenia</legend>
        <p className="mt-1 text-sm text-ink-muted">
          Nic nie zaznaczysz: zakładamy, że masz czym zaparzyć kawę do każdego napoju.
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          {methods.map((method) => (
            <ChoiceChip
              key={method.id}
              type="checkbox"
              checked={shelf.methods.includes(method.id)}
              onChange={() => shelfStore.toggleMethod(method.id)}
            >
              {method.name}
            </ChoiceChip>
          ))}
        </div>
      </fieldset>

      {almost.length > 0 && (
        <Section title="Brakuje jednej rzeczy">
          <ul className="space-y-5">
            {almost.map(({ drink, availability }) => (
              <li key={drink.id}>
                <DrinkCard drink={drink} from={location.pathname} />
                <div className="mt-2 px-1 text-sm">
                  <MissingItems drinkId={drink.id} availability={availability} />
                </div>
              </li>
            ))}
          </ul>
        </Section>
      )}
    </>
  );
}
