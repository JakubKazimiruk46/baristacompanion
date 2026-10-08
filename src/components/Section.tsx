import { useId, type ReactNode } from 'react';

type SectionProps = {
  title: string;
  /** Kotwica w adresie, np. #podanie. */
  id?: string;
  action?: ReactNode;
  children: ReactNode;
};

export function Section({ title, id, action, children }: SectionProps) {
  const headingId = useId();
  return (
    <section id={id} aria-labelledby={headingId} className="mt-8 scroll-mt-6">
      <div className="mb-3 flex items-baseline justify-between gap-3">
        <h2 id={headingId} className="font-display text-xl font-semibold">
          {title}
        </h2>
        {action}
      </div>
      {children}
    </section>
  );
}
