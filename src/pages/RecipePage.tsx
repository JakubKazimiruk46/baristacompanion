import { useState, type ReactNode } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router';
import { PencilIcon, ShareIcon, TrashIcon } from '../components/icons';
import { MethodIcon } from '../components/MethodIcon';
import { PageHeader } from '../components/PageHeader';
import { Section } from '../components/Section';
import { Sheet } from '../components/Sheet';
import { getMethod, type BrewMethod } from '../data';
import { DoseCalculator } from '../features/brewing/DoseCalculator';
import { formatGrams, scaleMethod } from '../features/brewing/dose';
import { recipeDoseKey, useWaterMl } from '../features/brewing/doseStore';
import { formatRatio, formatWaterTemp } from '../features/brewing/format';
import { GrindScale } from '../features/brewing/GrindScale';
import { StepList } from '../features/brewing/StepList';
import { useColdBrew } from '../features/coldbrew/store';
import { formatSetting } from '../features/grinder/format';
import { recipePath, recipeToMethod, type UserRecipe } from '../features/recipes/recipe';
import { ShareRecipeSheet } from '../features/recipes/ShareRecipeSheet';
import { recipesStore, useRecipe } from '../features/recipes/store';
import { formatSeconds } from '../lib/format';
import { isLongBrew } from './BrewSessionPage';
import { NotFoundPage } from './NotFoundPage';

const secondary =
  'flex h-12 flex-1 items-center justify-center gap-2 rounded-full border border-line bg-surface px-4 font-semibold focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent';

/** Własny przepis (/parzenie/:methodId/przepisy/:recipeId): kalkulator, mielenie, kroki i parzenie. */
export function RecipePage() {
  const { methodId, recipeId } = useParams();
  const method = methodId ? getMethod(methodId) : undefined;
  const recipe = useRecipe(recipeId);
  if (!method || recipe?.methodId !== method.id) return <NotFoundPage />;
  return <RecipeDetails key={recipe.id} base={method} recipe={recipe} />;
}

function RecipeDetails({ base, recipe }: { base: BrewMethod; recipe: UserRecipe }) {
  const location = useLocation();
  const navigate = useNavigate();
  const [sharing, setSharing] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const raw = recipeToMethod(recipe, base);
  const doseKey = recipeDoseKey(recipe.id);
  // Kroki z ilościami z kalkulatora (ostatnio wybranymi dla tego przepisu).
  const method = scaleMethod(raw, useWaterMl(raw, doseKey));
  const from = location.pathname + location.search;

  return (
    <article>
      <PageHeader
        title={recipe.name}
        lead={`Twoja wersja przepisu: ${base.name}.`}
        back={{ to: `/parzenie/${base.id}`, label: base.name }}
        icon={<MethodIcon methodId={base.id} className="size-9" />}
      >
        {recipe.note && <p className="mt-3 rounded-2xl bg-accent-soft p-3 text-sm">{recipe.note}</p>}
      </PageHeader>

      <StartButton recipe={recipe} long={isLongBrew(method.steps)} />

      <dl className="mt-6 grid grid-cols-2 gap-3">
        <Fact label="Proporcja" value={formatRatio(recipe)}>
          {formatGrams(recipe.dose.coffeeG)} g kawy na {recipe.dose.waterMl} ml wody
        </Fact>
        <Fact label="Woda" value={formatWaterTemp(method)} />
        <Fact label="Ze stoperem" value={method.totalTimeSec ? formatSeconds(method.totalTimeSec) : 'bez stopera'} />
        <Fact label="Kroki" value={String(method.steps.length)} />
      </dl>

      <Section title="Ile zaparzyć">
        <DoseCalculator method={raw} doseKey={doseKey} />
      </Section>

      <Section title="Mielenie">
        <GrindScale method={method} panel={<RecipeGrinder recipe={recipe} from={from} />} />
      </Section>

      <Section title="Kroki">
        <StepList steps={method.steps} />
      </Section>

      <div className="mt-8 flex flex-col gap-3">
        <StartButton recipe={recipe} long={isLongBrew(method.steps)} />
        <div className="flex gap-3">
          <Link to={`${recipePath(recipe)}/edycja`} state={{ from }} className={secondary}>
            <PencilIcon className="size-5" />
            Edytuj
          </Link>
          <button type="button" className={secondary} onClick={() => setSharing(true)}>
            <ShareIcon className="size-5" />
            Wyślij
          </button>
        </div>
        <button type="button" className={`${secondary} flex-none`} onClick={() => setConfirmDelete(true)}>
          <TrashIcon className="size-5" />
          Usuń przepis
        </button>
      </div>

      <ShareRecipeSheet recipe={recipe} open={sharing} onClose={() => setSharing(false)} />

      <Sheet title={`Usunąć „${recipe.name}”?`} open={confirmDelete} onClose={() => setConfirmDelete(false)}>
        <p className="text-ink-muted">
          Przepis zniknie z listy. Wpisy w dzienniku zachowają jego nazwę. Tej operacji nie da się cofnąć.
        </p>
        <div className="mt-5 flex gap-3">
          <button type="button" className={secondary} onClick={() => setConfirmDelete(false)}>
            Anuluj
          </button>
          <button
            type="button"
            className="flex h-12 flex-1 items-center justify-center rounded-full bg-red-700 font-semibold text-white"
            onClick={() => {
              recipesStore.remove(recipe.id);
              navigate(`/parzenie/${base.id}`, { replace: true });
            }}
          >
            Usuń
          </button>
        </div>
      </Sheet>
    </article>
  );
}

function StartButton({ recipe, long }: { recipe: UserRecipe; long: boolean }) {
  const coldBrew = useColdBrew();
  return (
    <Link
      to={`/parzenie/${recipe.methodId}/start?przepis=${recipe.id}`}
      className="flex h-12 items-center justify-center rounded-full bg-accent px-6 font-semibold text-on-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
    >
      {long && coldBrew ? 'Zobacz macerację' : 'Parz według przepisu'}
    </Link>
  );
}

/** Ustawienie młynka zapisane w przepisie (zmienia się w edycji przepisu). */
function RecipeGrinder({ recipe, from }: { recipe: UserRecipe; from: string }) {
  return (
    <div className="mt-4 border-t border-line pt-4">
      {recipe.grinder ? (
        <>
          <p className="text-sm text-ink-muted">
            Ustawienie z przepisu: <span className="font-medium text-ink">{recipe.grinder.grinderName}</span>
          </p>
          <p className="mt-1 text-xl font-semibold tabular-nums">
            {formatSetting(recipe.grinder.setting, recipe.grinder.unit)}
          </p>
        </>
      ) : (
        <p className="text-sm text-ink-muted">
          Bez ustawienia młynka. Dopiszesz je w{' '}
          <Link to={`${recipePath(recipe)}/edycja`} state={{ from }} className="font-medium text-accent underline">
            edycji przepisu
          </Link>
          .
        </p>
      )}
    </div>
  );
}

function Fact({ label, value, children }: { label: string; value: string; children?: ReactNode }) {
  return (
    <div className="rounded-2xl border border-line bg-surface p-3">
      <dt className="text-xs font-medium text-ink-muted">{label}</dt>
      <dd className="mt-0.5 text-lg font-semibold">{value}</dd>
      {children && <dd className="text-xs text-ink-muted">{children}</dd>}
    </div>
  );
}
