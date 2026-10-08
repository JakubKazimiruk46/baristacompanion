import type { ReactNode } from 'react';
import type { IconComponent } from './icons';

type EmptyStateProps = {
  icon: IconComponent;
  title: string;
  children: ReactNode;
};

export function EmptyState({ icon: Icon, title, children }: EmptyStateProps) {
  return (
    <section className="flex flex-col items-center rounded-3xl border border-dashed border-line bg-surface px-6 py-10 text-center">
      <span className="mb-4 flex size-16 items-center justify-center rounded-full bg-accent-soft text-accent">
        <Icon className="size-8" />
      </span>
      <h2 className="font-display text-xl font-semibold">{title}</h2>
      <p className="mt-2 text-sm text-ink-muted">{children}</p>
    </section>
  );
}
