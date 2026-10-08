import type { ButtonHTMLAttributes } from 'react';

type ChipProps = Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'type'> & {
  pressed: boolean;
};

/** Przełącznik w kształcie pigułki (filtry, wybory). */
export function Chip({ pressed, className = '', children, ...props }: ChipProps) {
  return (
    <button
      type="button"
      aria-pressed={pressed}
      className={`inline-flex h-10 items-center gap-1.5 rounded-full border px-4 text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent ${
        pressed
          ? 'border-accent bg-accent text-on-accent'
          : 'border-line bg-surface text-ink hover:bg-surface-muted'
      } ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
