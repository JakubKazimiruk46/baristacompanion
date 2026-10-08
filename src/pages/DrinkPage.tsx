import { useParams } from 'react-router';
import { PageHeader } from '../components/PageHeader';
import { ReviewNote } from '../components/ReviewNote';
import { Section } from '../components/Section';
import { getDrink } from '../data';
import { BaseCard } from '../features/drinks/BaseCard';
import { DrinkIngredients } from '../features/drinks/DrinkIngredients';
import { DrinkFigure } from '../features/drinks/DrinkFigure';
import { DrinkMeta } from '../features/drinks/DrinkMeta';
import { DrinkSteps } from '../features/drinks/DrinkSteps';
import { ServingSection } from '../features/drinks/ServingSection';
import { FavoriteButton } from '../features/favorites/FavoriteButton';
import { useSyrupDialog } from '../features/syrups/SyrupSheet';
import { NotFoundPage } from './NotFoundPage';

export function DrinkPage() {
  const { drinkId } = useParams();
  const syrupDialog = useSyrupDialog();
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
        <BaseCard drink={drink} />
        <div className="mt-3">
          <DrinkIngredients drink={drink} onSyrupClick={syrupDialog.open} />
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
        <DrinkSteps drink={drink} />
      </Section>

      <ServingSection drink={drink} />

      {syrupDialog.sheet}
    </article>
  );
}
