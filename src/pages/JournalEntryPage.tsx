import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router';
import { MethodIcon } from '../components/MethodIcon';
import { PageHeader } from '../components/PageHeader';
import { Sheet } from '../components/Sheet';
import { getDrink, getMethod } from '../data';
import { clampWater } from '../features/brewing/dose';
import { dosesStore, recipeDoseKey } from '../features/brewing/doseStore';
import { dayAndTime } from '../features/coldbrew/time';
import { grindersStore } from '../features/grinder/store';
import { EntryEditor } from '../features/journal/EntryEditor';
import { entryDose, entryGrind, entryTitle } from '../features/journal/format';
import { journalStore, useJournal } from '../features/journal/store';
import { recipePath } from '../features/recipes/recipe';
import { useRecipe } from '../features/recipes/store';
import { capitalize } from '../lib/format';
import { useNow } from '../lib/useNow';
import { isLongBrew } from './BrewSessionPage';
import { NotFoundPage } from './NotFoundPage';

const primary =
  'flex h-12 w-full items-center justify-center rounded-full bg-accent px-6 font-semibold text-on-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent';
const secondary =
  'flex h-12 flex-1 items-center justify-center rounded-full border border-line bg-surface px-4 font-semibold focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent';

export function JournalEntryPage() {
  const { entryId } = useParams();
  const entry = useJournal().find((e) => e.id === entryId);
  const now = useNow(60_000);
  const navigate = useNavigate();
  const [confirmDelete, setConfirmDelete] = useState(false);
  const savedRecipe = useRecipe(entry?.recipeId);
  if (!entry) return <NotFoundPage />;

  const method = getMethod(entry.methodId)!;
  const drink = entry.drinkId ? getDrink(entry.drinkId) : undefined;
  // Przepis mógł zniknąć (usunięty): wtedy parzymy według metody.
  const recipe = savedRecipe?.methodId === method.id ? savedRecipe : undefined;
  const search = new URLSearchParams({
    ...(recipe && { przepis: recipe.id }),
    ...(isLongBrew(method.steps) && entry.variantId && { wariant: entry.variantId }),
  }).toString();
  const start = `/parzenie/${method.id}/start${search ? `?${search}` : ''}`;

  return (
    <>
      <PageHeader
        title={entryTitle(entry)}
        lead={`${capitalize(dayAndTime(entry.brewedAt, now))} · ${entryDose(entry)}`}
        back={{ to: '/parzenie/dziennik', label: 'Dziennik' }}
        icon={<MethodIcon methodId={method.id} className="size-9" />}
      >
        {entry.recipeName && (
          <p className="mt-2 text-sm">
            Przepis:{' '}
            {recipe ? (
              <Link to={recipePath(recipe)} className="font-medium text-accent underline">
                {recipe.name}
              </Link>
            ) : (
              <span className="font-medium">{entry.recipeName} (usunięty)</span>
            )}
          </p>
        )}
        {entry.grind && (
          <p className="mt-2 text-sm">
            Młynek: <span className="font-medium">{entryGrind(entry)}</span>
          </p>
        )}
        {drink && (
          <p className="mt-2 text-sm">
            Do napoju:{' '}
            <Link to={`/napoje/${drink.id}`} className="font-medium text-accent underline">
              {drink.name}
            </Link>
          </p>
        )}
      </PageHeader>

      <EntryEditor key={entry.id} entry={entry} />

      <div className="mt-8 flex flex-col gap-3">
        {/* Te same ilości i ustawienie młynka wracają do kalkulatora i młynka, więc parzenie zaczyna się od nich. */}
        <Link
          to={start}
          className={primary}
          onClick={() => {
            dosesStore.set(recipe ? recipeDoseKey(recipe.id) : method.id, clampWater(method, entry.waterMl));
            // Przepis ma własne ustawienie młynka, więc ustawienia metody nie zmieniamy.
            if (entry.grind && !recipe) grindersStore.restore(entry.grind, method.id);
          }}
        >
          Zaparz tak samo
        </Link>
        <div className="flex gap-3">
          <Link to={`/parzenie/${method.id}`} className={secondary}>
            {method.name}
          </Link>
          <button type="button" className={secondary} onClick={() => setConfirmDelete(true)}>
            Usuń wpis
          </button>
        </div>
      </div>

      <Sheet title="Usunąć wpis?" open={confirmDelete} onClose={() => setConfirmDelete(false)}>
        <p className="text-ink-muted">Ocena i notatka znikną. Tej operacji nie da się cofnąć.</p>
        <div className="mt-5 flex gap-3">
          <button type="button" className={secondary} onClick={() => setConfirmDelete(false)}>
            Anuluj
          </button>
          <button
            type="button"
            className="flex h-12 flex-1 items-center justify-center rounded-full bg-red-700 font-semibold text-white"
            onClick={() => {
              journalStore.remove(entry.id);
              navigate('/parzenie/dziennik', { replace: true });
            }}
          >
            Usuń
          </button>
        </div>
      </Sheet>
    </>
  );
}
