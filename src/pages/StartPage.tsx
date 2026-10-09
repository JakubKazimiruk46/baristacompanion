import { Link } from 'react-router';
import { BarIcon, BrewIcon, ChevronRightIcon, DrinkIcon, UserIcon } from '../components/icons';
import { Section } from '../components/Section';
import { getDrink } from '../data';
import { ColdBrewBadge } from '../features/coldbrew/ColdBrewLinks';
import { DrinkCard } from '../features/drinks/DrinkCard';
import { useFavorites } from '../features/favorites/store';
import { DrinkGlass } from '../features/glass/DrinkGlass';

const HERO_DRINKS = ['espresso-tonic', 'kawa-pomaranczowa', 'latte-macchiato'];

const SHORTCUTS = [
  { to: '/napoje', label: 'Napoje', hint: 'drinki kawowe na ciepło i na zimno', Icon: DrinkIcon },
  { to: '/parzenie', label: 'Parzenie', hint: 'metody krok po kroku, ze stoperem', Icon: BrewIcon },
  { to: '/baribar', label: 'Baribar', hint: 'ziarna, mleka, syropy i dodatki, które masz', Icon: BarIcon },
  { to: '/konto', label: 'Konto', hint: 'opcjonalne: Twoje dane na wszystkich urządzeniach', Icon: UserIcon },
];

export function StartPage() {
  return (
    <>
      <title>Barista Companion</title>
      <header className="pt-2 text-center">
        <div aria-hidden="true" className="flex items-end justify-center gap-1">
          {HERO_DRINKS.map((id) => (
            <DrinkGlass key={id} drink={getDrink(id)!} variant="thumb" className="h-28 w-20" />
          ))}
        </div>
        <h1 tabIndex={-1} className="mt-4 font-display text-4xl font-semibold tracking-tight outline-none">
          Barista Companion
        </h1>
        <p className="mt-2 text-lg text-ink-muted">
          Kawa bez ekspresu: od ziaren przez parzenie po efektowne podanie.
        </p>
      </header>

      <Link
        to="/mam-kawe"
        viewTransition
        className="mt-8 flex min-h-16 items-center justify-center rounded-3xl bg-accent px-6 py-4 text-center font-display text-2xl font-semibold text-on-accent shadow-lg shadow-accent/20 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent"
      >
        Mam kawę. Co z nią zrobić?
      </Link>
      <p className="mt-3 text-center text-sm text-ink-muted">
        Napój z Twojej listy, niespodzianka albo krok po kroku od ziaren.
      </p>

      <div className="mt-2 text-center">
        <ColdBrewBadge link />
      </div>

      <FavoriteDrinks />

      <nav aria-label="Na skróty" className="mt-6">
        <ul className="space-y-3">
          {SHORTCUTS.map(({ to, label, hint, Icon }) => (
            <li key={to}>
              <Link
                to={to}
                viewTransition
                className="flex items-center gap-4 rounded-2xl border border-line bg-surface p-4 hover:bg-surface-muted"
              >
                <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-accent-soft text-accent">
                  <Icon className="size-6" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block font-semibold">{label}</span>
                  <span className="block text-sm text-ink-muted">{hint}</span>
                </span>
                <ChevronRightIcon className="size-5 shrink-0 text-ink-muted" />
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </>
  );
}

const FAVORITES_ON_START = 3;

/** Ulubione napoje na skróty: kilka ostatnio dodanych i link do wszystkich. */
function FavoriteDrinks() {
  const ids = useFavorites();
  if (ids.length === 0) return null;
  const shown = ids.slice(0, FAVORITES_ON_START).map((id) => getDrink(id)!);
  return (
    <Section
      title="Twoje ulubione"
      action={
        ids.length > FAVORITES_ON_START && (
          <Link to="/napoje?ulubione=1" className="text-sm font-medium text-accent">
            Wszystkie ({ids.length})
          </Link>
        )
      }
    >
      <ul className="space-y-3">
        {shown.map((drink) => (
          <li key={drink.id}>
            <DrinkCard drink={drink} from="/" />
          </li>
        ))}
      </ul>
    </Section>
  );
}
