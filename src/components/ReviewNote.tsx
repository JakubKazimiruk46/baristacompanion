import type { Reviewable } from '../data';

/** Notatka dla autora o treści do sprawdzenia. Widać ją tylko w trybie deweloperskim. */
export function ReviewNote({ item }: { item: Reviewable }) {
  if (!import.meta.env.DEV || !item.needsReview) return null;
  return (
    <p className="mt-3 rounded-xl border border-amber-500/60 bg-amber-500/10 px-3 py-2 text-sm">
      <strong className="font-semibold">Do sprawdzenia: </strong>
      {item.reviewNote ?? 'treść wymaga weryfikacji.'}
    </p>
  );
}
