import { Section } from '../../components/Section';
import { Stepper } from '../../components/Stepper';
import type { Drink } from '../../data';
import { count } from '../../lib/format';
import { DrinkAvailability } from '../shelf/DrinkAvailability';
import { useSyrupDialog } from '../syrups/SyrupSheet';
import { MAX_SERVINGS, useServings } from './amounts';
import { BaseCard } from './BaseCard';
import { DrinkFigure } from './DrinkFigure';
import { DrinkIngredients } from './DrinkIngredients';
import { DrinkSteps } from './DrinkSteps';
import { ServingSection } from './ServingSection';

const SERVINGS: [string, string, string] = ['porcja', 'porcje', 'porcji'];

/**
 * Treść ekranu napoju: rysunek, składniki (z liczbą porcji i tym, czego brakuje w domu), sprzęt,
 * przygotowanie i podanie. Ta sama dla napojów z katalogu, „Moich napojów” i propozycji asystenta.
 */
export function DrinkBody({ drink }: { drink: Drink }) {
  const syrupDialog = useSyrupDialog();
  const [servings, setServings] = useServings();

  return (
    <>
      <DrinkFigure drink={drink} />

      <Section title="Składniki">
        <div className="mb-3 flex items-center justify-between gap-3">
          <p className="text-sm font-medium text-ink-muted">Na ile porcji?</p>
          <Stepper
            label="Liczba porcji"
            value={count(servings, SERVINGS)}
            onDecrement={() => setServings(servings - 1)}
            onIncrement={() => setServings(servings + 1)}
            canDecrement={servings > 1}
            canIncrement={servings < MAX_SERVINGS}
            decrementLabel="Mniej porcji"
            incrementLabel="Więcej porcji"
          />
        </div>
        <DrinkAvailability drink={drink} />
        <BaseCard drink={drink} servings={servings} />
        <div className="mt-3">
          <DrinkIngredients drink={drink} servings={servings} onSyrupClick={syrupDialog.open} />
        </div>
      </Section>

      <Section title="Sprzęt">
        <ul className="flex flex-wrap gap-2">
          {drink.equipment.map((item) => (
            <li key={item} className="rounded-full bg-surface-muted px-3 py-1.5 text-sm">
              {item}
            </li>
          ))}
        </ul>
      </Section>

      <Section title="Przygotowanie">
        {servings > 1 && (
          <p className="mb-4 rounded-2xl bg-surface-muted p-4 text-sm">
            Kroki opisują jedną porcję. Ilości na {count(servings, SERVINGS)} masz w składnikach.
          </p>
        )}
        <DrinkSteps drink={drink} />
      </Section>

      <ServingSection drink={drink} />

      {syrupDialog.sheet}
    </>
  );
}
