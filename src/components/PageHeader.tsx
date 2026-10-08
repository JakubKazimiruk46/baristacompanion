import type { ReactNode } from 'react';
import { BackLink } from './BackLink';

type PageHeaderProps = {
  title: string;
  lead?: ReactNode;
  back?: { to: string; label: string };
  /** Ilustracja nad tytułem (np. ikona metody). */
  icon?: ReactNode;
  children?: ReactNode;
};

export function PageHeader({ title, lead, back, icon, children }: PageHeaderProps) {
  return (
    <header className="mb-6">
      {/* React 19 przenosi <title> do <head>, więc każda strona ma własny tytuł karty. */}
      <title>{`${title} · Barista Companion`}</title>
      {back && (
        <div className="mb-2">
          <BackLink to={back.to} label={back.label} />
        </div>
      )}
      {icon && (
        <div className="mb-3 flex size-16 items-center justify-center rounded-3xl bg-accent-soft text-accent">
          {icon}
        </div>
      )}
      {/* tabIndex -1: po zmianie ekranu AppLayout przenosi tu fokus, a czytnik odczytuje tytuł. */}
      <h1 tabIndex={-1} className="font-display text-3xl font-semibold tracking-tight text-balance outline-none">
        {title}
      </h1>
      {lead && <p className="mt-2 text-ink-muted">{lead}</p>}
      {children}
    </header>
  );
}
