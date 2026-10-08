import { useId, useState, type FormEvent, type ReactNode } from 'react';
import { ChoiceChip } from '../../components/ChoiceChip';
import {
  BEAN_KIND_LABELS,
  FLAVOR_NOTES,
  NOTE_LABELS,
  ROAST_LABELS,
  ROASTS,
  type BeanProfile,
  type FlavorNote,
  type Roast,
} from '../../data';
import type { BeanInput } from './store';

type BeanFormProps = {
  initial?: BeanInput;
  submitLabel: string;
  onSubmit: (input: BeanInput) => void;
};

const inputClass =
  'mt-1 h-12 w-full rounded-xl border border-line bg-surface px-4 text-base focus:border-accent focus:outline-2 focus:outline-accent/40';

export function BeanForm({ initial, submitLabel, onSubmit }: BeanFormProps) {
  const [name, setName] = useState(initial?.name ?? '');
  const [roaster, setRoaster] = useState(initial?.roaster ?? '');
  const [roast, setRoast] = useState<Roast | ''>(initial?.profile.roast ?? '');
  const [notes, setNotes] = useState<FlavorNote[]>(initial?.profile.notes ?? []);
  const [origin, setOrigin] = useState(initial?.profile.origin ?? '');
  const [kind, setKind] = useState<BeanProfile['kind']>(initial?.profile.kind ?? 'blend');
  const [submitted, setSubmitted] = useState(false);
  const ids = { name: useId(), roaster: useId(), origin: useId(), nameError: useId(), roastError: useId() };

  const errors = {
    name: name.trim() ? null : 'Podaj nazwę kawy.',
    roast: roast ? null : 'Wybierz palenie.',
  };

  const submit = (event: FormEvent) => {
    event.preventDefault();
    setSubmitted(true);
    if (errors.name || errors.roast || !roast) return;
    onSubmit({
      name: name.trim(),
      ...(roaster.trim() && { roaster: roaster.trim() }),
      profile: {
        roast,
        // Kolejność nut jak na liście, niezależnie od kolejności klikania.
        notes: FLAVOR_NOTES.filter((note) => notes.includes(note)),
        ...(origin.trim() && { origin: origin.trim() }),
        kind,
      },
    });
  };

  const toggleNote = (note: FlavorNote) =>
    setNotes((current) => (current.includes(note) ? current.filter((n) => n !== note) : [...current, note]));

  return (
    <form onSubmit={submit} noValidate className="space-y-6">
      <div>
        <label htmlFor={ids.name} className="font-medium">
          Nazwa
        </label>
        <input
          id={ids.name}
          className={inputClass}
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="np. Etiopia Yirgacheffe"
          autoComplete="off"
          aria-invalid={submitted && errors.name ? true : undefined}
          aria-describedby={submitted && errors.name ? ids.nameError : undefined}
        />
        {submitted && errors.name && <ErrorText id={ids.nameError}>{errors.name}</ErrorText>}
      </div>

      <div>
        <label htmlFor={ids.roaster} className="font-medium">
          Palarnia <span className="font-normal text-ink-muted">(opcjonalnie)</span>
        </label>
        <input
          id={ids.roaster}
          className={inputClass}
          value={roaster}
          onChange={(e) => setRoaster(e.target.value)}
          autoComplete="off"
        />
      </div>

      <fieldset aria-describedby={submitted && errors.roast ? ids.roastError : undefined}>
        <legend className="font-medium">Palenie</legend>
        <div className="mt-2 flex flex-wrap gap-2">
          {ROASTS.map((value) => (
            <ChoiceChip key={value} type="radio" name="roast" checked={roast === value} onChange={() => setRoast(value)}>
              {ROAST_LABELS[value]}
            </ChoiceChip>
          ))}
        </div>
        {submitted && errors.roast && <ErrorText id={ids.roastError}>{errors.roast}</ErrorText>}
      </fieldset>

      <fieldset>
        <legend className="font-medium">
          Nuty smakowe <span className="font-normal text-ink-muted">(z opakowania)</span>
        </legend>
        <div className="mt-2 flex flex-wrap gap-2">
          {FLAVOR_NOTES.map((note) => (
            <ChoiceChip key={note} type="checkbox" checked={notes.includes(note)} onChange={() => toggleNote(note)}>
              {NOTE_LABELS[note]}
            </ChoiceChip>
          ))}
        </div>
      </fieldset>

      <div>
        <label htmlFor={ids.origin} className="font-medium">
          Pochodzenie <span className="font-normal text-ink-muted">(opcjonalnie)</span>
        </label>
        <input
          id={ids.origin}
          className={inputClass}
          value={origin}
          onChange={(e) => setOrigin(e.target.value)}
          placeholder="np. Etiopia, Brazylia"
          autoComplete="off"
        />
      </div>

      <fieldset>
        <legend className="font-medium">Rodzaj</legend>
        <div className="mt-2 flex flex-wrap gap-2">
          {(['single-origin', 'blend'] as const).map((value) => (
            <ChoiceChip key={value} type="radio" name="kind" checked={kind === value} onChange={() => setKind(value)}>
              {BEAN_KIND_LABELS[value]}
            </ChoiceChip>
          ))}
        </div>
      </fieldset>

      <button
        type="submit"
        className="flex h-12 w-full items-center justify-center rounded-full bg-accent font-semibold text-on-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
      >
        {submitLabel}
      </button>
    </form>
  );
}

function ErrorText({ id, children }: { id: string; children: ReactNode }) {
  return (
    <p id={id} className="mt-1 text-sm font-medium text-red-700 dark:text-red-300">
      {children}
    </p>
  );
}
