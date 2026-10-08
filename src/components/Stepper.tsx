import { MinusIcon, PlusIcon } from './icons';

type StepperProps = {
  /** Nazwa grupy dla czytnika, np. „Liczba porcji”. */
  label: string;
  /** Wartość do wyświetlenia, np. „2 porcje”. */
  value: string;
  onDecrement: () => void;
  onIncrement: () => void;
  canDecrement: boolean;
  canIncrement: boolean;
  decrementLabel: string;
  incrementLabel: string;
};

const button =
  'flex size-11 shrink-0 items-center justify-center rounded-full border border-line bg-surface text-accent hover:bg-surface-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent disabled:opacity-40';

/** Przyciski −/+ z wartością pośrodku. Zmiana wartości jest ogłaszana czytnikowi ekranu. */
export function Stepper({
  label,
  value,
  onDecrement,
  onIncrement,
  canDecrement,
  canIncrement,
  decrementLabel,
  incrementLabel,
}: StepperProps) {
  return (
    <div role="group" aria-label={label} className="flex items-center gap-2">
      <button type="button" className={button} onClick={onDecrement} disabled={!canDecrement}>
        <MinusIcon className="size-5" />
        <span className="sr-only">{decrementLabel}</span>
      </button>
      <output aria-live="polite" className="min-w-24 text-center font-semibold tabular-nums">
        {value}
      </output>
      <button type="button" className={button} onClick={onIncrement} disabled={!canIncrement}>
        <PlusIcon className="size-5" />
        <span className="sr-only">{incrementLabel}</span>
      </button>
    </div>
  );
}
