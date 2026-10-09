import { ClockIcon, ColdIcon, HotIcon, LeafIcon } from '../../components/icons';
import { hasAlcohol, isPlantBasedPossible, TEMPERATURE_LABELS, type Drink } from '../../data';
import { formatMinutes } from '../../lib/format';

/** Krótkie cechy napoju: temperatura, czas, wersja roślinna, alkohol. */
export function DrinkMeta({ drink }: { drink: Drink }) {
  const TempIcon = drink.temperature === 'hot' ? HotIcon : ColdIcon;
  return (
    <ul className="flex flex-wrap gap-x-3 gap-y-1 text-xs font-medium text-ink-muted">
      <li className="inline-flex items-center gap-1">
        <TempIcon className="size-4" />
        {TEMPERATURE_LABELS[drink.temperature]}
      </li>
      <li className="inline-flex items-center gap-1">
        <ClockIcon className="size-4" />
        {formatMinutes(drink.prepTimeMin)}
      </li>
      {isPlantBasedPossible(drink) && (
        <li className="inline-flex items-center gap-1">
          <LeafIcon className="size-4" />
          wersja roślinna
        </li>
      )}
      {hasAlcohol(drink) && (
        <li className="inline-flex items-center gap-1 rounded-full border border-current px-2">z alkoholem 18+</li>
      )}
    </ul>
  );
}
