import { BEAN_KIND_LABELS, NOTE_LABELS, ROAST_LABELS, type BeanProfile } from '../../data';

/** Cechy ziaren w jednej linii: palenie, rodzaj, pochodzenie, nuty. */
export function BeanSummary({ profile }: { profile: BeanProfile }) {
  return (
    <ul className="flex flex-wrap gap-1.5 text-xs font-medium">
      <li className="rounded-full bg-accent-soft px-2.5 py-1 text-accent">
        palenie {ROAST_LABELS[profile.roast]}
      </li>
      <li className="rounded-full bg-surface-muted px-2.5 py-1">{BEAN_KIND_LABELS[profile.kind]}</li>
      {profile.origin && <li className="rounded-full bg-surface-muted px-2.5 py-1">{profile.origin}</li>}
      {profile.notes.map((note) => (
        <li key={note} className="rounded-full bg-surface-muted px-2.5 py-1">
          {NOTE_LABELS[note]}
        </li>
      ))}
    </ul>
  );
}
