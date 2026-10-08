import type { ReactNode } from 'react';

type ChoiceChipProps = {
  type: 'radio' | 'checkbox';
  name?: string;
  checked: boolean;
  onChange: () => void;
  children: ReactNode;
};

/** Pole wyboru w kształcie pigułki: natywny radio/checkbox ukryty wizualnie, dostępny dla czytników. */
export function ChoiceChip({ type, name, checked, onChange, children }: ChoiceChipProps) {
  return (
    <label className="inline-flex h-10 cursor-pointer items-center rounded-full border border-line bg-surface px-4 text-sm font-medium select-none has-checked:border-accent has-checked:bg-accent has-checked:text-on-accent has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-accent">
      <input type={type} name={name} className="sr-only" checked={checked} onChange={onChange} />
      {children}
    </label>
  );
}
