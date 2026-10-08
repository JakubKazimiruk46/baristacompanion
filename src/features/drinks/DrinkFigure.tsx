import { getDrink, vessels } from '../../data';
import { capitalize } from '../../lib/format';
import { DrinkGlass } from '../glass/DrinkGlass';

/** Rysunek napoju z podpisem naczynia. */
export function DrinkFigure({ drinkId }: { drinkId: string }) {
  const drink = getDrink(drinkId)!;
  return (
    <figure className="-mx-2 rounded-3xl bg-surface px-2 pt-4 pb-3">
      {/* key: animacja nalewania od nowa przy zmianie napoju. */}
      <DrinkGlass key={drink.id} drink={drink} className="mx-auto w-full max-w-sm" />
      <figcaption className="mt-1 text-center text-sm text-ink-muted">
        {capitalize(vessels[drink.serving.vessel].name)}
      </figcaption>
    </figure>
  );
}
