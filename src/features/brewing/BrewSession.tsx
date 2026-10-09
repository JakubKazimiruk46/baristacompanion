import { useState, type ReactNode } from 'react';
import { Link, useLocation } from 'react-router';
import { ChevronRightIcon } from '../../components/icons';
import { PageHeader } from '../../components/PageHeader';
import { drinksForMethod, type BrewMethod } from '../../data';
import { useWakeLock } from '../../lib/useWakeLock';
import { useBeans } from '../beans/store';
import { DrinkCard } from '../drinks/DrinkCard';
import { GrinderLine } from '../grinder/GrinderSetting';
import { grindersStore, grindRecordFor } from '../grinder/store';
import { EntryEditor } from '../journal/EntryEditor';
import { entryGrind } from '../journal/format';
import { journalStore, useJournal } from '../journal/store';
import { recipePath, type UserRecipe } from '../recipes/recipe';
import { formatGrams } from './dose';
import { formatClock } from './timer';
import { useBrewSession } from './useBrewSession';

const primary =
  'flex h-14 flex-1 items-center justify-center rounded-full bg-accent px-6 text-lg font-semibold text-on-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent';
const secondary =
  'flex h-14 items-center justify-center rounded-full border border-line bg-surface px-5 font-semibold focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent disabled:opacity-40';

/** Własny przepis, według którego się parzy (method to wtedy przepis przeliczony na metodę). */
export type SessionRecipe = Pick<UserRecipe, 'id' | 'methodId' | 'name' | 'grinder'>;

type BrewSessionProps = {
  method: BrewMethod;
  recipe?: SessionRecipe;
  /** Własny nagłówek (np. w ścieżce „Mam kawę”). Domyślnie: nazwa metody z powrotem do niej. */
  header?: ReactNode;
  /** Ziarna i napój do wpisu w dzienniku (ścieżka „Mam kawę”). */
  journal?: { beanId?: string; drinkId?: string };
  /** Co po ostatnim kroku. Domyślnie: ekran „Gotowe” z oceną i propozycjami napojów. */
  onFinish?: (entryId: string) => void;
};

export function BrewSession({ method, recipe, header, journal, onFinish }: BrewSessionProps) {
  const session = useBrewSession(method);
  const { state, step, nextStep } = session;
  const beans = useBeans();
  // Wpis z tego parzenia. „Wstecz” z ekranu końcowego i ponowne „Zakończ” nie tworzą drugiego.
  const [entryId, setEntryId] = useState<string | null>(null);
  useWakeLock(!state.finished);

  const finish = () => {
    let id = entryId;
    if (!id || !journalStore.get(id)) {
      const bean = beans.find((b) => b.id === journal?.beanId);
      // Przepis ma własne mielenie i ustawienie młynka, więc ustawienie dla metody go nie dotyczy.
      const grind = recipe ? recipe.grinder : grindRecordFor(grindersStore.getSnapshot(), method.id);
      id = journalStore.add({
        methodId: method.id,
        coffeeG: method.dose.coffeeG,
        waterMl: method.dose.waterMl,
        ...(recipe && { recipeId: recipe.id, recipeName: recipe.name }),
        ...(bean && { beanId: bean.id, beanName: bean.name }),
        ...(grind && { grind }),
        ...(journal?.drinkId && { drinkId: journal.drinkId }),
      }).id;
      setEntryId(id);
    }
    if (onFinish) onFinish(id);
    else session.next();
  };

  const restart = () => {
    setEntryId(null);
    session.restart();
  };

  if (state.finished) return <Finished method={method} recipe={recipe} entryId={entryId} onRestart={restart} />;

  const total = method.steps.length;
  const isLast = state.stepIndex === total - 1;

  return (
    <>
      {header ?? (
        <PageHeader
          title={method.name}
          lead={doseLine(method)}
          back={recipe ? { to: recipePath(recipe), label: recipe.name } : { to: `/parzenie/${method.id}`, label: method.name }}
        />
      )}
      <div className="-mt-2 mb-4">
        <p className="text-sm font-medium text-ink-muted">
          Krok {state.stepIndex + 1} z {total}
        </p>
        <div aria-hidden="true" className="mt-2 flex gap-1">
          {method.steps.map((s, i) => (
            <span
              key={`${i}-${s.text}`}
              className={`h-1.5 flex-1 rounded-full ${i <= state.stepIndex ? 'bg-accent' : 'bg-line'}`}
            />
          ))}
        </div>
      </div>

      {/* Mieli się na początku, więc ustawienie młynka widać przy pierwszym kroku. */}
      {state.stepIndex === 0 && (
        <div className="mb-4">
          <GrinderLine method={method} {...(recipe && { fixed: recipe.grinder ?? null })} />
        </div>
      )}

      <section aria-labelledby="krok" className="rounded-3xl bg-surface p-6">
        <h2 id="krok" className="font-display text-3xl leading-tight font-semibold text-balance">
          {step.text}
        </h2>
        {step.detail && <p className="mt-3 text-lg text-ink-muted">{step.detail}</p>}

        {state.timer && (
          <div className="mt-6">
            <p
              className={`text-center text-7xl font-semibold tracking-tight tabular-nums ${session.done ? 'text-accent' : ''}`}
              aria-label="Pozostały czas"
            >
              {formatClock(session.remainingMs ?? 0)}
            </p>
            <div className="mt-3 h-2 overflow-hidden rounded-full bg-line" aria-hidden="true">
              <div
                className="h-full rounded-full bg-accent transition-[width] duration-200"
                style={{ width: `${Math.min(100, session.progress * 100)}%` }}
              />
            </div>
            {session.overtimeMs >= 1000 && (
              <p className="mt-2 text-center text-sm text-ink-muted">
                +{formatClock(session.overtimeMs)} ponad czas
              </p>
            )}
            {!session.done && (
              <div className="mt-4 flex justify-center gap-3">
                {session.running ? (
                  <button type="button" className={secondary} onClick={session.pause}>
                    Pauza
                  </button>
                ) : (
                  <button type="button" className={secondary} onClick={session.start}>
                    {state.timer.elapsedBeforeMs > 0 ? 'Wznów' : 'Start'}
                  </button>
                )}
                <button
                  type="button"
                  className={secondary}
                  onClick={session.reset}
                  disabled={!session.running && state.timer.elapsedBeforeMs === 0}
                >
                  Reset
                </button>
              </div>
            )}
          </div>
        )}

        {session.done && (
          <div role="alert" className="mt-5 rounded-2xl bg-accent p-4 text-on-accent">
            <p className="font-semibold">Czas minął!</p>
            <p className="mt-1 text-xl font-semibold">
              {nextStep ? `Teraz: ${nextStep.text}` : 'Gotowe. Możesz nalewać.'}
            </p>
          </div>
        )}

        {nextStep && !session.done && (
          <p className="mt-5 text-ink-muted">
            {state.timer && session.running
              ? `Za ${formatClock(session.remainingMs ?? 0)}: `
              : 'Potem: '}
            <span className="font-medium text-ink">{nextStep.text}</span>
          </p>
        )}
      </section>

      <div className="mt-6 flex gap-3">
        <button
          type="button"
          className={secondary}
          onClick={session.prev}
          disabled={state.stepIndex === 0}
        >
          Wstecz
        </button>
        <button type="button" className={primary} onClick={isLast ? finish : session.next}>
          {isLast ? 'Zakończ' : 'Dalej'}
        </button>
      </div>
    </>
  );
}

/** „17 g kawy · 150 ml wody” */
export const doseLine = (method: BrewMethod) =>
  `${formatGrams(method.dose.coffeeG)} g kawy · ${method.dose.waterMl} ml wody`;

function Finished({
  method,
  recipe,
  entryId,
  onRestart,
}: {
  method: BrewMethod;
  recipe?: SessionRecipe;
  entryId: string | null;
  onRestart: () => void;
}) {
  const location = useLocation();
  const drinks = drinksForMethod(method.id);
  const entry = useJournal().find((e) => e.id === entryId);
  const back = recipe ? { to: recipePath(recipe), label: recipe.name } : { to: `/parzenie/${method.id}`, label: method.name };
  return (
    <>
      <PageHeader
        title="Gotowe! Smacznej kawy"
        lead={`${recipe ? `Kawa według przepisu „${recipe.name}”` : `Kawa z metody ${method.name}`} czeka. Pij ją tak albo zrób z niej coś więcej.`}
        back={back}
      />
      {entry && (
        <section aria-labelledby="dziennik" className="mb-8 rounded-3xl bg-surface p-5">
          <h2 id="dziennik" className="font-display text-xl font-semibold">
            Zapisano w dzienniku
          </h2>
          <p className="mt-1 mb-4 text-sm text-ink-muted">
            {doseLine(method)}
            {entry.grind && ` · ${entryGrind(entry)}`}. Oceń i dopisz, co zmienić następnym razem.
          </p>
          <EntryEditor entry={entry} />
          <Link to="/parzenie/dziennik" className="mt-3 inline-flex h-10 items-center gap-1 font-medium text-accent">
            Cały dziennik parzeń
            <ChevronRightIcon className="size-5" />
          </Link>
        </section>
      )}
      {drinks.length > 0 && (
        <section aria-labelledby="napoje">
          <h2 id="napoje" className="mb-3 font-display text-xl font-semibold">
            Co z niej zrobić
          </h2>
          <ul className="space-y-3">
            {drinks.map((drink) => (
              <li key={drink.id}>
                <DrinkCard drink={drink} from={location.pathname} />
              </li>
            ))}
          </ul>
        </section>
      )}
      <div className="mt-8 flex flex-col gap-3">
        <button type="button" className={primary} onClick={onRestart}>
          Zaparz jeszcze raz
        </button>
        <Link to={back.to} className={secondary}>
          {recipe ? 'Wróć do przepisu' : 'Wróć do metody'}
        </Link>
      </div>
    </>
  );
}
