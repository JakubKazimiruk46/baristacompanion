import { ClockIcon } from '../../components/icons';
import { ReviewNote } from '../../components/ReviewNote';
import type { Syrup } from '../../data';

/** Kup albo zrób sam: gdzie kupić i szybki przepis domowy. */
export function SyrupRecipe({ syrup }: { syrup: Syrup }) {
  const { recipe } = syrup;
  return (
    <div className="space-y-5">
      <section>
        <h3 className="font-semibold">Kup</h3>
        <p className="mt-1 text-sm text-ink-muted">
          <span className="font-medium text-ink">
            {syrup.easyToBuy ? 'Łatwo dostać. ' : 'Trudno dostać. '}
          </span>
          {syrup.buyNote}
        </p>
      </section>

      <section>
        <div className="flex items-baseline justify-between gap-3">
          <h3 className="font-semibold">Zrób sam</h3>
          <p className="inline-flex items-center gap-1 text-sm text-ink-muted">
            <ClockIcon className="size-4" />
            {recipe.timeMin} min · ok. {recipe.yieldMl} ml
          </p>
        </div>
        <ul className="mt-2 space-y-1 rounded-2xl bg-surface-muted px-4 py-3 text-sm">
          {recipe.ingredients.map((item) => (
            <li key={item} className="flex gap-2">
              <span aria-hidden="true" className="text-accent">•</span>
              {item}
            </li>
          ))}
        </ul>
        <ol className="mt-3 space-y-2 text-sm">
          {recipe.steps.map((step, index) => (
            <li key={step} className="flex gap-3">
              <span aria-hidden="true" className="w-4 shrink-0 font-semibold text-accent">
                {index + 1}.
              </span>
              {step}
            </li>
          ))}
        </ol>
        <p className="mt-3 text-sm text-ink-muted">{recipe.storage}</p>
      </section>
      <ReviewNote item={syrup} />
    </div>
  );
}
