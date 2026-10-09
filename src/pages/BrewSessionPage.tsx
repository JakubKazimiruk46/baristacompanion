import { useParams, useSearchParams } from 'react-router';
import { getMethod, type BrewMethod } from '../data';
import { BrewSession } from '../features/brewing/BrewSession';
import { scaleMethod } from '../features/brewing/dose';
import { recipeDoseKey, useWaterMl } from '../features/brewing/doseStore';
import { ColdBrewSession } from '../features/coldbrew/ColdBrewSession';
import { recipeToMethod, type UserRecipe } from '../features/recipes/recipe';
import { useRecipe } from '../features/recipes/store';
import { NotFoundPage } from './NotFoundPage';

export const isLongBrew = (steps: { durationSec?: number }[]) =>
  steps.some((step) => (step.durationSec ?? 0) >= 3600);

/** /parzenie/:methodId/start, a z własnym przepisem ?przepis=id. */
export function BrewSessionPage() {
  const { methodId } = useParams();
  const [params] = useSearchParams();
  const recipeId = params.get('przepis');
  const recipe = useRecipe(recipeId);
  const method = methodId ? getMethod(methodId) : undefined;
  if (!method || (recipeId !== null && recipe?.methodId !== method.id)) return <NotFoundPage />;
  return <ScaledSession key={recipe?.id ?? method.id} method={method} recipe={recipe} />;
}

/** Parzenie z ilościami z kalkulatora na ekranie metody (albo przepisu). */
function ScaledSession({ method: base, recipe }: { method: BrewMethod; recipe?: UserRecipe }) {
  const raw = recipe ? recipeToMethod(recipe, base) : base;
  const method = scaleMethod(raw, useWaterMl(raw, recipe ? recipeDoseKey(recipe.id) : base.id));
  // Maceracja liczona w godzinach (cold brew) ma osobny ekran z zapisanym startem.
  if (isLongBrew(method.steps)) return <ColdBrewSession method={method} recipe={recipe} />;
  return <BrewSession method={method} recipe={recipe} />;
}
