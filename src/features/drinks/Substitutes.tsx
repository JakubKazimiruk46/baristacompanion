import { getIngredient, type Substitute } from '../../data';
import { capitalize } from '../../lib/format';

/** Zamienniki składnika: czym zastąpić i co się zmieni. */
export function Substitutes({ substitutes }: { substitutes?: Substitute[] }) {
  if (!substitutes?.length) return null;
  return (
    <ul className="mt-1 space-y-0.5 text-sm text-ink-muted">
      {substitutes.map((substitute) => (
        <li key={substitute.id}>
          <span className="font-medium text-ink">Zamiennik: {getIngredient(substitute.id)!.name}.</span>{' '}
          {substitute.note}
        </li>
      ))}
    </ul>
  );
}

/** Zamienniki w osobnej sekcji (okno syropu). */
export function SubstitutesSection({ substitutes }: { substitutes?: Substitute[] }) {
  if (!substitutes?.length) return null;
  return (
    <section>
      <h3 className="font-semibold">Albo zamień</h3>
      <ul className="mt-1 space-y-1 text-sm">
        {substitutes.map((substitute) => (
          <li key={substitute.id}>
            <span className="font-medium">{capitalize(getIngredient(substitute.id)!.name)}:</span>{' '}
            <span className="text-ink-muted">{substitute.note}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
