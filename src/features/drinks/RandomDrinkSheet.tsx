import { Link } from 'react-router';
import type { FromState } from '../../components/BackLink';
import { DiceIcon } from '../../components/icons';
import { Sheet } from '../../components/Sheet';
import type { Drink } from '../../data';
import { count } from '../../lib/format';
import { useDialogParam } from '../../lib/useDialogParam';
import { DrinkGlass } from '../glass/DrinkGlass';
import { DrinkMeta } from './DrinkMeta';
import { pickRandom } from './random';

type RandomDrinkProps = {
  /** Z czego losujemy: wyniki filtrów i wyszukiwania. */
  pool: Drink[];
  /** Wszystkie napoje: wylosowany napój z adresu (?los=) pokazujemy, nawet gdy filtry się zmieniły. */
  all: Drink[];
  /** Czym pula jest zawężona (mówimy to wprost). */
  narrowedBy: { filters: boolean; query: boolean };
  /** Adres listy (bez okna), do którego wraca ekran napoju. */
  from: string;
};

/** „Wylosuj kawę”: przycisk i okno z wylosowanym napojem (?los=id, gest „wstecz” je zamyka). */
export function useRandomDrink({ pool, all, narrowedBy, from }: RandomDrinkProps) {
  const dialog = useDialogParam('los');
  const drawn = dialog.value ? all.find((drink) => drink.id === dialog.value) : undefined;
  const among = count(pool.length, ['napoju', 'napojów', 'napojów']);
  const by = [narrowedBy.filters && 'filtrów', narrowedBy.query && 'wyszukiwania'].filter(Boolean).join(' i ');
  const scope = by ? `Losujemy spośród ${among} pasujących do ${by}.` : `Losujemy spośród wszystkich ${among}.`;

  const button = (
    <button
      type="button"
      aria-haspopup="dialog"
      disabled={pool.length === 0}
      onClick={() => {
        const pick = pickRandom(pool);
        if (pick) dialog.open(pick.id);
      }}
      className="inline-flex h-10 shrink-0 items-center gap-2 rounded-full border border-accent px-4 text-sm font-semibold text-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent disabled:opacity-40"
    >
      <DiceIcon className="size-5" />
      Wylosuj kawę
    </button>
  );

  const sheet = (
    <Sheet title="Wylosowana kawa" open={drawn !== undefined} onClose={dialog.close}>
      {drawn && (
        <>
          <p className="text-sm text-ink-muted">{scope}</p>
          {/* key: przy każdym losowaniu warstwy nalewają się od nowa. */}
          <DrinkGlass key={drawn.id} drink={drawn} className="mx-auto mt-2 w-full max-w-xs" />
          <div aria-live="polite" className="text-center">
            <h3 className="font-display text-2xl font-semibold text-balance">{drawn.name}</h3>
            <p className="mt-1 text-sm text-ink-muted">{drawn.tagline}</p>
          </div>
          <div className="mt-3 flex justify-center">
            <DrinkMeta drink={drawn} />
          </div>
          <div className="mt-5 space-y-3">
            <Link
              to={`/napoje/${drawn.id}`}
              viewTransition
              state={{ from } satisfies FromState}
              className="flex h-12 items-center justify-center rounded-full bg-accent px-6 font-semibold text-on-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
            >
              Zobacz przepis
            </Link>
            <button
              type="button"
              disabled={pool.length < 2}
              onClick={() => {
                const pick = pickRandom(pool, drawn.id);
                if (pick) dialog.replace(pick.id);
              }}
              className="flex h-12 w-full items-center justify-center gap-2 rounded-full border border-line bg-surface px-6 font-semibold focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent disabled:opacity-40"
            >
              <DiceIcon className="size-5" />
              Losuj jeszcze raz
            </button>
          </div>
        </>
      )}
    </Sheet>
  );

  return { button, sheet };
}
