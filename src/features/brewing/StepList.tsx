import { ClockIcon } from '../../components/icons';
import type { BrewStep } from '../../data';
import { formatSeconds } from '../../lib/format';

/** Kroki parzenia z numerami: działanie na pełnym kolorze, czekanie na jasnym, czas w pigułce. */
export function StepList({ steps }: { steps: BrewStep[] }) {
  return (
    <ol className="space-y-4">
      {steps.map((step, index) => (
        // Własne przepisy mogą mieć dwa takie same kroki, więc klucz z numerem.
        <li key={`${index}-${step.text}`} className="flex gap-3">
          <span
            aria-hidden="true"
            className={`flex size-7 shrink-0 items-center justify-center rounded-full text-sm font-semibold ${
              step.action ? 'bg-accent text-on-accent' : 'bg-accent-soft text-accent'
            }`}
          >
            {index + 1}
          </span>
          <div className="pt-0.5">
            <p className="font-medium">
              {step.text}
              {step.durationSec && (
                <span className="ml-2 inline-flex items-center gap-1 rounded-full bg-surface-muted px-2 py-0.5 align-middle text-xs font-medium text-ink-muted">
                  <ClockIcon className="size-3.5" />
                  {formatSeconds(step.durationSec)}
                </span>
              )}
            </p>
            {step.detail && <p className="mt-0.5 text-sm text-ink-muted">{step.detail}</p>}
          </div>
        </li>
      ))}
    </ol>
  );
}
