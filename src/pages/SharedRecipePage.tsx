import { useMemo } from 'react';
import { Link, useLocation, useNavigate } from 'react-router';
import { EmptyState } from '../components/EmptyState';
import { BrewIcon } from '../components/icons';
import { MethodIcon } from '../components/MethodIcon';
import { PageHeader } from '../components/PageHeader';
import { Section } from '../components/Section';
import { getMethod, GRIND_LABELS } from '../data';
import { formatGrams, scaleMethod } from '../features/brewing/dose';
import { formatRatio, formatWaterTemp } from '../features/brewing/format';
import { StepList } from '../features/brewing/StepList';
import { recipePath, recipeToMethod } from '../features/recipes/recipe';
import { decodeRecipe, sameRecipe } from '../features/recipes/share';
import { recipesStore, useRecipes } from '../features/recipes/store';
import { capitalize } from '../lib/format';

const primary =
  'flex h-12 w-full items-center justify-center rounded-full bg-accent px-6 font-semibold text-on-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent';

/** Przepis z linku (/przepis#dane): podgląd i „Zapisz u siebie”. Uszkodzony link nie psuje aplikacji. */
export function SharedRecipePage() {
  const { hash } = useLocation();
  const navigate = useNavigate();
  const recipes = useRecipes();
  const recipe = useMemo(() => decodeRecipe(hash.slice(1)), [hash]);

  if (!recipe) {
    return (
      <>
        <PageHeader title="Nie da się otworzyć przepisu" back={{ to: '/parzenie', label: 'Parzenie' }} />
        <EmptyState icon={BrewIcon} title="Link jest niepełny albo uszkodzony">
          Poproś o wysłanie przepisu jeszcze raz. Komunikatory czasem ucinają długie linki.
        </EmptyState>
      </>
    );
  }

  const base = getMethod(recipe.methodId)!;
  const method = scaleMethod(recipeToMethod(recipe, base));
  const saved = recipes.find((r) => sameRecipe(r, recipe));

  return (
    <article>
      <PageHeader
        title={recipe.name}
        lead={`Przepis na: ${base.name}. Ktoś podzielił się z Tobą swoją wersją.`}
        back={{ to: `/parzenie/${base.id}`, label: base.name }}
        icon={<MethodIcon methodId={base.id} className="size-9" />}
      >
        {recipe.note && <p className="mt-3 rounded-2xl bg-accent-soft p-3 text-sm">{recipe.note}</p>}
      </PageHeader>

      {saved ? (
        <div role="status" className="rounded-2xl bg-surface p-4">
          <p className="font-semibold">Masz już ten przepis</p>
          <Link to={recipePath(saved)} className={`mt-3 ${primary}`}>
            Otwórz swój przepis
          </Link>
        </div>
      ) : (
        <button
          type="button"
          className={primary}
          onClick={() => navigate(recipePath(recipesStore.add(recipe)), { replace: true })}
        >
          Zapisz u siebie
        </button>
      )}

      <dl className="mt-6 grid grid-cols-2 gap-3">
        <Fact label="Kawa i woda" value={`${formatGrams(recipe.dose.coffeeG)} g · ${recipe.dose.waterMl} ml`} />
        <Fact label="Proporcja" value={formatRatio(recipe)} />
        <Fact label="Woda" value={formatWaterTemp(method)} />
        <Fact label="Mielenie" value={capitalize(GRIND_LABELS[recipe.grind])} />
      </dl>

      <Section title="Kroki">
        <StepList steps={method.steps} />
      </Section>
    </article>
  );
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-line bg-surface p-3">
      <dt className="text-xs font-medium text-ink-muted">{label}</dt>
      <dd className="mt-0.5 font-semibold">{value}</dd>
    </div>
  );
}
