import { useId } from 'react';

type SegmentedProps<T extends string> = {
  /** Nazwa grupy dla czytnika ekranu. */
  label: string;
  options: readonly T[];
  labels: Record<T, string>;
  value: T;
  onChange: (value: T) => void;
};

/** Przełącznik kilku widoków w jednej pigułce (natywne pola radio, dostępne z klawiatury). */
export function Segmented<T extends string>({ label, options, labels, value, onChange }: SegmentedProps<T>) {
  const name = useId();
  return (
    <fieldset className="min-w-0">
      <legend className="sr-only">{label}</legend>
      <div className="flex rounded-full bg-surface-muted p-1">
        {options.map((option) => (
          <label
            key={option}
            className="flex min-h-10 min-w-0 flex-1 cursor-pointer items-center justify-center rounded-full px-2 py-1 text-center text-sm leading-tight font-medium text-ink-muted select-none has-checked:bg-surface has-checked:text-ink has-checked:shadow-sm has-focus-visible:outline-2 has-focus-visible:outline-accent"
          >
            <input
              type="radio"
              name={name}
              className="sr-only"
              checked={value === option}
              onChange={() => onChange(option)}
            />
            {labels[option]}
          </label>
        ))}
      </div>
    </fieldset>
  );
}
