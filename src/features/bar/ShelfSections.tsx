import { Link, useLocation } from 'react-router';
import { ChoiceChip } from '../../components/ChoiceChip';
import { Section } from '../../components/Section';
import {
  FROTH_LABELS,
  getIngredient,
  ingredients,
  INGREDIENT_GROUP_LABELS,
  INGREDIENT_GROUPS,
  methods,
  milks,
  syrups,
  type Drink,
} from '../../data';
import { capitalize, count } from '../../lib/format';
import { useAllDrinks } from '../assistant/myDrinks';
import { DrinkCard } from '../drinks/DrinkCard';
import { checkDrink } from '../shelf/availability';
import { MissingItems } from '../shelf/DrinkAvailability';
import { shelfStore, useShelf } from '../shelf/store';
import { useSyrupDialog } from '../syrups/SyrupSheet';
import { GrinderLink } from './BeansSection';
import { drinksUsing } from './bar';

const IN_DRINKS: [string, string, string] = ['napoju', 'napojów', 'napojów'];

const card =
  'flex min-h-16 min-w-0 flex-1 cursor-pointer items-center gap-3 rounded-2xl border border-line bg-surface p-3 has-checked:border-accent has-checked:bg-accent-soft has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-accent';

/** Kolorowe kółko: jak wygląda mleko albo syrop. */
function Swatch({ color }: { color: string }) {
  return <span aria-hidden="true" className="size-8 shrink-0 rounded-full border border-line" style={{ backgroundColor: color }} />;
}

/** Mleka: zaznacz, które masz, z informacją, jak się pienią i do ilu napojów pasują. */
export function MilksSection() {
  const shelf = useShelf();
  const drinks = useAllDrinks();
  return (
    <>
      <p className="text-sm text-ink-muted">
        Zaznacz mleka, które masz.{' '}
        <Link to="/napoje/mleko" className="font-medium text-accent underline">
          Które mleko do czego
        </Link>
      </p>
      <ul aria-label="Mleka" className="mt-3 space-y-2">
        {milks.map((milk) => (
          <li key={milk.id}>
            <label className={card}>
              <input
                type="checkbox"
                className="size-5 shrink-0 accent-accent"
                checked={shelf.ingredients.includes(milk.id)}
                onChange={() => shelfStore.toggleIngredient(milk.id)}
              />
              <Swatch color={milk.color} />
              <span className="min-w-0">
                <span className="block font-semibold">{capitalize(milk.name)}</span>
                <span className="block text-xs text-ink-muted">
                  {FROTH_LABELS[milk.frothing]} · w {count(drinksUsing(milk.id, drinks), IN_DRINKS)}
                </span>
              </span>
            </label>
          </li>
        ))}
      </ul>
    </>
  );
}

/** Syropy: zaznacz, które masz; każdy da się też zrobić samemu (okno z przepisem). */
export function SyrupsSection() {
  const shelf = useShelf();
  const drinks = useAllDrinks();
  const syrupDialog = useSyrupDialog();
  return (
    <>
      <p className="text-sm text-ink-muted">
        Zaznacz syropy, które masz. Każdy zrobisz też sam w kwadrans.{' '}
        <Link to="/napoje/syropy" className="font-medium text-accent underline">
          Przepisy
        </Link>
      </p>
      <ul aria-label="Syropy" className="mt-3 space-y-2">
        {syrups.map((syrup) => (
          <li key={syrup.id} className="flex items-stretch gap-2">
            <label className={card}>
              <input
                type="checkbox"
                className="size-5 shrink-0 accent-accent"
                checked={shelf.ingredients.includes(syrup.id)}
                onChange={() => shelfStore.toggleIngredient(syrup.id)}
              />
              <Swatch color={syrup.color} />
              <span className="min-w-0">
                <span className="block font-semibold">{capitalize(syrup.name)}</span>
                <span className="block text-xs text-ink-muted">w {count(drinksUsing(syrup.id, drinks), IN_DRINKS)}</span>
              </span>
            </label>
            <button
              type="button"
              aria-haspopup="dialog"
              onClick={() => syrupDialog.open(syrup.id)}
              className="flex w-20 shrink-0 flex-col items-center justify-center rounded-2xl border border-line bg-surface px-2 text-xs leading-tight font-medium text-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
            >
              Zrób sam
              <span className="sr-only">: {syrup.name}</span>
            </button>
          </li>
        ))}
      </ul>
      {syrupDialog.sheet}
    </>
  );
}

// Mleka i syropy mają swoje sekcje, a wody nie trzeba zaznaczać (jest zawsze).
const EXTRA_GROUPS = INGREDIENT_GROUPS.filter((group) => group !== 'milk' && group !== 'syrup')
  .map((group) => ({ group, items: ingredients.filter((i) => i.group === group && !i.always) }))
  .filter(({ items }) => items.length > 0);

/** Dodatki: owoce, napoje, przyprawy, słodkie, alkohol… jako pola wyboru w grupach. */
export function ExtrasSection() {
  const shelf = useShelf();
  return (
    <>
      <p className="text-sm text-ink-muted">Lód i cukier są zaznaczone od początku: prawie każdy je ma.</p>
      {EXTRA_GROUPS.map(({ group, items }) => (
        <fieldset key={group} className="mt-6">
          <legend className="font-display text-xl font-semibold">{INGREDIENT_GROUP_LABELS[group]}</legend>
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
    </>
  );
}

/** Sprzęt: czym parzysz kawę (zawęża napoje) i młynek. */
export function EquipmentSection() {
  const shelf = useShelf();
  return (
    <>
      <fieldset>
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
      <GrinderLink />
    </>
  );
}

/** Napoje, do których brakuje jednej rzeczy: zmienia się na żywo przy zaznaczaniu. */
export function AlmostSection() {
  const shelf = useShelf();
  const location = useLocation();
  const almost = useAllDrinks()
    .map((drink) => ({ drink, availability: checkDrink(drink, shelf) }))
    .filter(({ availability }) => availability.missing.length === 1);
  if (almost.length === 0) return null;
  return (
    <Section title="Brakuje jednej rzeczy">
      <ul className="space-y-5">
        {almost.map(({ drink, availability }) => (
          <li key={drink.id}>
            <DrinkCard drink={drink} from={location.pathname + location.search} />
            <div className="mt-2 px-1 text-sm">
              <MissingItems drinkId={drink.id} availability={availability} />
            </div>
          </li>
        ))}
      </ul>
    </Section>
  );
}

/** Ile napojów zrobisz z tego, co jest w barku, i do ilu brakuje jednej rzeczy. */
export function readiness(drinks: Drink[], shelf: ReturnType<typeof useShelf>) {
  const checked = drinks.map((drink) => checkDrink(drink, shelf));
  return {
    ready: checked.filter((a) => a.status !== 'missing').length,
    almost: checked.filter((a) => a.missing.length === 1).length,
  };
}

/** Ile rzeczy z grupy jest w barku (do etykiet sekcji). */
export function shelfCount(shelf: ReturnType<typeof useShelf>, group: 'milk' | 'syrup' | 'extras'): number {
  return shelf.ingredients.filter((id) => {
    const g = getIngredient(id)?.group;
    return group === 'extras' ? g !== 'milk' && g !== 'syrup' : g === group;
  }).length;
}
