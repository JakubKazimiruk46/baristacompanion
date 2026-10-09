import { useLocation, useNavigate, useParams } from 'react-router';
import type { FromState } from '../components/BackLink';
import { PageHeader } from '../components/PageHeader';
import { getMethod } from '../data';
import { useActiveGrinder } from '../features/grinder/store';
import { methodAsRecipe } from '../features/recipes/draft';
import { recipePath } from '../features/recipes/recipe';
import { RecipeEditor } from '../features/recipes/RecipeEditor';
import { recipesStore, useRecipe } from '../features/recipes/store';
import { NotFoundPage } from './NotFoundPage';

/**
 * Nowy przepis (/parzenie/:methodId/przepisy/nowy, kopia przepisu metody) albo edycja
 * (/parzenie/:methodId/przepisy/:recipeId/edycja).
 */
export function RecipeFormPage() {
  const { methodId, recipeId } = useParams();
  const method = methodId ? getMethod(methodId) : undefined;
  const recipe = useRecipe(recipeId);
  const grinder = useActiveGrinder();
  const navigate = useNavigate();
  const from = (useLocation().state as FromState | null)?.from;

  if (!method || (recipeId !== undefined && recipe?.methodId !== method.id)) return <NotFoundPage />;

  if (recipe) {
    // Ustawienie używanego młynka: z przepisu, jeśli zapisano je dla tego młynka.
    const setting = recipe.grinder && recipe.grinder.grinderId === grinder?.id ? recipe.grinder.setting : undefined;
    return (
      <>
        <PageHeader title="Edycja przepisu" lead={recipe.name} back={{ to: recipePath(recipe), label: recipe.name }} />
        <RecipeEditor
          key={recipe.id}
          method={method}
          initial={recipe}
          initialSetting={setting}
          submitLabel="Zapisz zmiany"
          onSubmit={(input) => {
            recipesStore.update(recipe.id, input);
            // Z ekranu przepisu cofamy się do niego, a z linku z zewnątrz otwieramy go zamiast formularza.
            if (from) navigate(-1);
            else navigate(recipePath(recipe), { replace: true });
          }}
        />
      </>
    );
  }

  return (
    <>
      <PageHeader
        title="Własna wersja"
        lead={`Kopia przepisu: ${method.name}. Zmień, co chcesz, i zapisz jako swój przepis.`}
        back={{ to: `/parzenie/${method.id}`, label: method.name }}
      />
      <RecipeEditor
        method={method}
        initial={methodAsRecipe(method)}
        initialSetting={grinder?.settings[method.id]}
        submitLabel="Zapisz przepis"
        onSubmit={(input) => {
          const saved = recipesStore.add(input);
          // Formularz znika z historii, a „wstecz” z przepisu wraca tam, skąd przyszedł formularz.
          navigate(recipePath(saved), { replace: true, state: from ? { from } : undefined });
        }}
      />
    </>
  );
}
