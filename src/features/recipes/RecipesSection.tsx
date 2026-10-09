import { Link, useLocation } from 'react-router';
import { ChevronRightIcon, PencilIcon } from '../../components/icons';
import { Section } from '../../components/Section';
import { GRIND_LABELS, type BrewMethod } from '../../data';
import { formatGrams } from '../brewing/dose';
import { formatRatio } from '../brewing/format';
import { formatSetting } from '../grinder/format';
import { recipePath, type UserRecipe } from './recipe';
import { useMethodRecipes } from './store';

/** „Twoje przepisy” na ekranie metody: lista własnych wersji i „Zrób własną wersję”. */
export function RecipesSection({ method }: { method: BrewMethod }) {
  const recipes = useMethodRecipes(method.id);
  const location = useLocation();
  const from = location.pathname + location.search;

  return (
    <Section title="Twoje przepisy">
      {recipes.length > 0 ? (
        <ul className="space-y-3">
          {recipes.map((recipe) => (
            <li key={recipe.id}>
              <RecipeCard recipe={recipe} from={from} />
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-ink-muted">
          Zmień ilości, czasy albo kroki i zapisz jako swój przepis. Potem parzysz według niego ze stoperem, tak jak
          według przepisu metody.
        </p>
      )}
      <Link
        to={`/parzenie/${method.id}/przepisy/nowy`}
        state={{ from }}
        className="mt-3 flex h-12 items-center justify-center gap-2 rounded-full border border-line bg-surface px-5 font-semibold text-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
      >
        <PencilIcon className="size-5" />
        Zrób własną wersję
      </Link>
    </Section>
  );
}

function RecipeCard({ recipe, from }: { recipe: UserRecipe; from: string }) {
  return (
    <Link
      to={recipePath(recipe)}
      state={{ from }}
      viewTransition
      className="flex items-center gap-3 rounded-2xl border border-line bg-surface p-4 transition-colors hover:bg-surface-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
    >
      <div className="min-w-0 flex-1">
        <h3 className="font-display text-lg leading-tight font-semibold">{recipe.name}</h3>
        <p className="mt-0.5 text-sm text-ink-muted">{recipeLine(recipe)}</p>
        {recipe.note && <p className="mt-1 line-clamp-2 text-sm">{recipe.note}</p>}
      </div>
      <ChevronRightIcon className="size-5 shrink-0 text-ink-muted" />
    </Link>
  );
}

/** „15 g kawy · 250 ml wody · 1:16,7 · średnio-drobno · Comandante: 22 kliknięcia” */
export function recipeLine(recipe: Pick<UserRecipe, 'dose' | 'grind' | 'grinder'>): string {
  const parts = [
    `${formatGrams(recipe.dose.coffeeG)} g kawy`,
    `${recipe.dose.waterMl} ml wody`,
    formatRatio(recipe),
    GRIND_LABELS[recipe.grind],
  ];
  if (recipe.grinder) parts.push(`${recipe.grinder.grinderName}: ${formatSetting(recipe.grinder.setting, recipe.grinder.unit)}`);
  return parts.join(' · ');
}
