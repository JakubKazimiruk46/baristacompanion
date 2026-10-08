import { useParams } from 'react-router';
import { PageHeader } from '../components/PageHeader';
import { ReviewNote } from '../components/ReviewNote';
import { Section } from '../components/Section';
import { Stepper } from '../components/Stepper';
import { getDrink } from '../data';
import { MAX_SERVINGS, useServings } from '../features/drinks/amounts';
import { BaseCard } from '../features/drinks/BaseCard';
import { DrinkIngredients } from '../features/drinks/DrinkIngredients';
import { DrinkFigure } from '../features/drinks/DrinkFigure';
import { DrinkMeta } from '../features/drinks/DrinkMeta';
import { DrinkSteps } from '../features/drinks/DrinkSteps';
import { ServingSection } from '../features/drinks/ServingSection';
import { FavoriteButton } from '../features/favorites/FavoriteButton';
import { useSyrupDialog } from '../features/syrups/SyrupSheet';
import { count } from '../lib/format';
import { NotFoundPage } from './NotFoundPage';

const SERVINGS: [string, string, string] = ['porcja', 'porcje', 'porcji'];

export function DrinkPage() {
  const { drinkId } = useParams();
  const syrupDialog = useSyrupDialog();
  const [servings, setServings] = useServings();
  const drink = drinkId ? getDrink(drinkId) : undefined;
  if (!drink) return <NotFoundPage />;

  return (
    <article>
      <PageHeader title={drink.name} lead={drink.description} back={{ to: '/napoje', label: 'Napoje' }}>
        <div className="mt-3">
          <DrinkMeta drink={drink} />
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          <FavoriteButton drinkId={drink.id} />
        </div>
        <ReviewNote item={drink} />
      </PageHeader>

      <DrinkFigure drinkId={drink.id} />

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
    </article>
  );
}
