import { ColdIcon } from '../../components/icons';
import type { Drink } from '../../data';

/** Kroki przygotowania napoju. Przy dodatkach miksowanych przypomina o schłodzeniu kawy. */
export function DrinkSteps({ drink }: { drink: Drink }) {
  const hasBlended = drink.extras.some((extra) => extra.kind !== 'syrup' && extra.blended);
  return (
    <>
      {hasBlended && (
        <p className="mb-4 flex gap-3 rounded-2xl bg-surface-muted p-4 text-sm">
          <ColdIcon className="size-5 shrink-0 text-accent" />
          <span>
            <strong className="font-semibold">Schłodź kawę przed dodaniem.</strong> Gorąca kawa
            roztopi lody i może zwarzyć mleko zmiksowane z owocami.
          </span>
        </p>
      )}
      <ol className="space-y-4">
        {drink.steps.map((step, index) => (
          <li key={step} className="flex gap-3">
            <span
              aria-hidden="true"
              className="flex size-7 shrink-0 items-center justify-center rounded-full bg-accent-soft text-sm font-semibold text-accent"
            >
              {index + 1}
            </span>
            <p className="pt-0.5">{step}</p>
          </li>
        ))}
      </ol>
    </>
  );
}
