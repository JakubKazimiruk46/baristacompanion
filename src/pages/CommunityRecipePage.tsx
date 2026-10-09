import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router';
import { EmptyState } from '../components/EmptyState';
import { BrewIcon } from '../components/icons';
import { MethodIcon } from '../components/MethodIcon';
import { PageHeader } from '../components/PageHeader';
import { Section } from '../components/Section';
import { Sheet } from '../components/Sheet';
import { getMethod, GRIND_LABELS } from '../data';
import { useAuth } from '../features/account/auth';
import { formatGrams, scaleMethod } from '../features/brewing/dose';
import { formatRatio, formatWaterTemp } from '../features/brewing/format';
import { StepList } from '../features/brewing/StepList';
import {
  countSave,
  getRecipe,
  reportRecipe,
  toUserRecipeInput,
  type CommunityRecipe,
} from '../features/community/api';
import { SAVES } from '../features/community/CommunitySection';
import { ReportForm } from '../features/community/ReportForm';
import { recipePath, recipeToMethod } from '../features/recipes/recipe';
import { recipesStore, useRecipes } from '../features/recipes/store';
import { capitalize, count } from '../lib/format';
import { backendEnabled } from '../lib/supabase';
import { useOnline } from '../lib/useOnline';
import { NotFoundPage } from './NotFoundPage';

const primary =
  'flex h-12 w-full items-center justify-center rounded-full bg-accent px-6 font-semibold text-on-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent disabled:opacity-50';
const secondary =
  'flex h-12 w-full items-center justify-center rounded-full border border-line bg-surface px-4 font-semibold focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent disabled:opacity-50';

type Loaded = { status: 'loading' } | { status: 'missing' } | { status: 'error'; message: string } | { status: 'ready'; item: CommunityRecipe };

/**
 * Przepis społeczności: /parzenie/:methodId/spolecznosc/:recipeId (z ekranu metody) albo
 * /spolecznosc/przepisy/:recipeId (z zakładki Społeczność). Podgląd, zapis, parzenie, zgłoszenie.
 */
export function CommunityRecipePage() {
  const { methodId, recipeId } = useParams();
  // Z zakładki Społeczność metody nie ma w adresie: każda pasuje, a powrót prowadzi do zakładki.
  const fromTab = methodId === undefined;
  const method = methodId ? getMethod(methodId) : undefined;
  const online = useOnline();
  const [loaded, setLoaded] = useState<Loaded>({ status: 'loading' });

  useEffect(() => {
    if (!recipeId || !online || !backendEnabled()) return;
    let cancelled = false;
    setLoaded({ status: 'loading' });
    getRecipe(recipeId)
      .then((item) => {
        const fits = item && (fromTab || item.recipe.methodId === methodId);
        if (!cancelled) setLoaded(fits ? { status: 'ready', item } : { status: 'missing' });
      })
      .catch((error: Error) => {
        if (!cancelled) setLoaded({ status: 'error', message: error.message });
      });
    return () => {
      cancelled = true;
    };
  }, [recipeId, methodId, fromTab, online]);

  if ((!fromTab && !method) || !backendEnabled()) return <NotFoundPage />;
  const back = method ? { to: `/parzenie/${method.id}`, label: method.name } : { to: '/spolecznosc?sekcja=przepisy', label: 'Społeczność' };

  if (!online) {
    return (
      <>
        <PageHeader title="Przepis społeczności" back={back} />
        <EmptyState icon={BrewIcon} title="Brak internetu">
          Przepisy społeczności wymagają połączenia. Twoje przepisy i reszta aplikacji działają bez niego.
        </EmptyState>
      </>
    );
  }
  if (loaded.status === 'loading') {
    return (
      <>
        <PageHeader title="Przepis społeczności" back={back} />
        <p role="status" className="text-ink-muted">
          Wczytuję przepis…
        </p>
      </>
    );
  }
  if (loaded.status !== 'ready') {
    return (
      <>
        <PageHeader title="Przepis społeczności" back={back} />
        <EmptyState icon={BrewIcon} title={loaded.status === 'missing' ? 'Tego przepisu już nie ma' : 'Nie udało się wczytać'}>
          {loaded.status === 'missing'
            ? 'Autor go wycofał albo przepis czeka na decyzję moderatora.'
            : loaded.message}
        </EmptyState>
      </>
    );
  }
  return <CommunityRecipeView item={loaded.item} back={back} />;
}

function CommunityRecipeView({ item, back }: { item: CommunityRecipe; back: { to: string; label: string } }) {
  const base = getMethod(item.recipe.methodId)!;
  const method = scaleMethod(recipeToMethod(item.recipe, base));
  const recipes = useRecipes();
  const auth = useAuth();
  const navigate = useNavigate();
  const [saves, setSaves] = useState(item.savesCount);
  const [reporting, setReporting] = useState(false);
  const [reported, setReported] = useState(false);
  const saved = recipes.find((r) => r.origin?.communityId === item.id);
  const signedIn = auth.status === 'signed-in';
  const mine = signedIn && auth.user.id === item.authorId;

  /** Kopia u siebie (raz) i zliczenie zapisu na serwerze, jeśli ktoś jest zalogowany. */
  const saveLocally = () => {
    if (saved) return saved;
    const copy = recipesStore.add(toUserRecipeInput(item));
    if (signedIn) {
      countSave(item.id)
        .then((total) => total !== null && setSaves(total))
        .catch(() => {});
    }
    return copy;
  };

  return (
    <article>
      <PageHeader
        title={item.recipe.name}
        lead={`Przepis od ${item.author} na: ${base.name}.`}
        back={back}
        icon={<MethodIcon methodId={base.id} className="size-9" />}
      >
        <p className="mt-2 text-sm text-ink-muted">{count(saves, SAVES)}</p>
        {item.recipe.note && <p className="mt-3 rounded-2xl bg-accent-soft p-3 text-sm whitespace-pre-line">{item.recipe.note}</p>}
      </PageHeader>

      {reported && (
        <p role="status" className="mb-4 rounded-2xl bg-accent-soft p-4 text-sm font-medium">
          Dziękujemy. Przepis jest ukryty do decyzji moderatora.
        </p>
      )}

      <div className="flex flex-col gap-3">
        <button
          type="button"
          className={primary}
          onClick={() => navigate(`/parzenie/${base.id}/start?przepis=${saveLocally().id}`)}
        >
          Parz według tego przepisu
        </button>
        {saved ? (
          <Link to={recipePath(saved)} className={secondary}>
            Masz go u siebie: otwórz
          </Link>
        ) : (
          <button type="button" className={secondary} onClick={() => navigate(recipePath(saveLocally()), { replace: true })}>
            Zapisz u siebie
          </button>
        )}
        <p className="text-center text-xs text-ink-muted">Parzenie zapisze kopię przepisu w Twoich przepisach.</p>
      </div>

      <dl className="mt-6 grid grid-cols-2 gap-3">
        <Fact label="Kawa i woda" value={`${formatGrams(item.recipe.dose.coffeeG)} g · ${item.recipe.dose.waterMl} ml`} />
        <Fact label="Proporcja" value={formatRatio(item.recipe)} />
        <Fact label="Woda" value={formatWaterTemp(method)} />
        <Fact label="Mielenie" value={capitalize(GRIND_LABELS[item.recipe.grind])} />
      </dl>

      <Section title="Kroki">
        <StepList steps={method.steps} />
      </Section>

      {!mine && !reported && (
        <div className="mt-8">
          {signedIn ? (
            <button type="button" className="h-10 text-sm font-medium text-accent underline" onClick={() => setReporting(true)}>
              Zgłoś przepis
            </button>
          ) : (
            <p className="text-sm text-ink-muted">
              Coś jest nie tak z tym przepisem?{' '}
              <Link to="/konto" className="font-medium text-accent underline">
                Zaloguj się
              </Link>
              , żeby go zgłosić.
            </p>
          )}
        </div>
      )}

      <Sheet title="Zgłoś przepis" subtitle={item.recipe.name} open={reporting} onClose={() => setReporting(false)}>
        <ReportForm
          what="przepis"
          onReport={(reason, comment) => reportRecipe(item.id, reason, comment)}
          onDone={() => {
            setReporting(false);
            setReported(true);
          }}
        />
      </Sheet>
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
