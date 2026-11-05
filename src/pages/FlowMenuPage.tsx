import type { ReactNode } from 'react';
import { Link } from 'react-router';
import { EmptyState } from '../components/EmptyState';
import {
  BookmarkIcon,
  ChevronRightIcon,
  SignpostIcon,
  SparklesIcon,
  type IconComponent,
} from '../components/icons';
import { PageHeader } from '../components/PageHeader';
import { useAllDrinks } from '../features/assistant/myDrinks';
import { DrinkCard } from '../features/drinks/DrinkCard';
import { MENU_PATH, startFromDrink, stepPath } from '../features/flow/flow';
import { flowStore } from '../features/flow/store';
import { useWishlist } from '../features/wishlist/store';
import { count } from '../lib/format';

const DRINKS: [string, string, string] = ['napój', 'napoje', 'napojów'];

/** Menu „Mam kawę” (/mam-kawe): napój z listy, niespodzianka albo krok po kroku od ziaren. */
export function FlowMenuPage() {
  const wanted = useWishlist().length;
  return (
    <>
      <PageHeader
        title="Co dziś robimy?"
        lead="Wybierz, od czego zaczniemy. Każda droga prowadzi przez parzenie do podania."
        back={{ to: '/', label: 'Start' }}
      />
      <nav aria-label="Jak zaczynamy">
        <ul className="space-y-3">
          <MenuOption
            to="/mam-kawe/do-sprobowania"
            Icon={BookmarkIcon}
            title="Napoje do spróbowania"
            hint={
              wanted > 0
                ? `${count(wanted, DRINKS)} na Twojej liście`
                : 'Dodasz je przyciskiem „Chcę spróbować” przy napoju'
            }
          />
          <MenuOption
            to="/mam-kawe/zaskocz"
            Icon={SparklesIcon}
            title="Zaskocz mnie"
            hint="Wylosujemy napój za Ciebie"
          />
          <MenuOption
            to={stepPath('ziarna')}
            onClick={() => flowStore.set({})}
            Icon={SignpostIcon}
            title="Wybiorę sam"
            hint="Od ziaren: metoda, mielenie, napój, parzenie i podanie"
          />
        </ul>
      </nav>
    </>
  );
}

type MenuOptionProps = {
  to: string;
  onClick?: () => void;
  Icon: IconComponent;
  title: string;
  hint: ReactNode;
};

function MenuOption({ to, onClick, Icon, title, hint }: MenuOptionProps) {
  return (
    <li>
      <Link
        to={to}
        viewTransition
        onClick={onClick}
        className="flex min-h-24 items-center gap-4 rounded-3xl border border-line bg-surface p-5 transition-colors hover:bg-surface-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
      >
        <span className="flex size-14 shrink-0 items-center justify-center rounded-2xl bg-accent-soft text-accent">
          <Icon className="size-7" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block font-display text-xl leading-tight font-semibold">{title}</span>
          <span className="mt-1 block text-sm text-ink-muted">{hint}</span>
        </span>
        <ChevronRightIcon className="size-5 shrink-0 text-ink-muted" />
      </Link>
    </li>
  );
}

/** Napoje z listy „Do spróbowania” (/mam-kawe/do-sprobowania): wybór zaczyna ścieżkę od napoju. */
export function WishlistFlowPage() {
  const ids = useWishlist();
  const all = useAllDrinks();
  // Kolejność listy (ostatnio dodane pierwsze); usunięte „Moje napoje” pomijamy.
  const drinks = ids.flatMap((id) => all.find((drink) => drink.id === id) ?? []);

  return (
    <>
      <PageHeader
        title="Napoje do spróbowania"
        lead="Wybierz napój, a poprowadzimy Cię od parzenia bazy do podania."
        back={{ to: MENU_PATH, label: 'Mam kawę' }}
      />
      {drinks.length > 0 ? (
        <ul className="space-y-3">
          {drinks.map((drink) => (
            <li key={drink.id}>
              <DrinkCard
                drink={drink}
                to={stepPath('metoda')}
                onSelect={() => flowStore.set(startFromDrink(drink, 'wishlist'))}
              />
            </li>
          ))}
        </ul>
      ) : (
        <>
          <EmptyState icon={BookmarkIcon} title="Lista jest pusta">
            Na ekranie napoju tapnij „Chcę spróbować”, a napój pojawi się tutaj.
          </EmptyState>
          <Link
            to="/napoje"
            viewTransition
            className="mt-6 flex h-12 items-center justify-center rounded-full bg-accent px-6 font-semibold text-on-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
          >
            Przeglądaj napoje
          </Link>
        </>
      )}
    </>
  );
}
