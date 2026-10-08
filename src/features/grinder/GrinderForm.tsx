import { useId, useState, type FormEvent } from 'react';
import { ChoiceChip } from '../../components/ChoiceChip';
import { getGrinderModel, grinderModels, GRINDER_UNIT_LABELS, GRINDER_UNITS, type GrinderUnit } from '../../data';
import { MAX_NAME_LENGTH, type GrinderInput } from './store';

const CUSTOM = 'inny';

const inputClass =
  'mt-1 h-12 w-full rounded-xl border border-line bg-surface px-4 text-base focus:border-accent focus:outline-2 focus:outline-accent/40';

/** Wybór młynka: model z listy (z podpowiedziami ustawień) albo własny z nazwą i jednostką. */
export function GrinderForm({ onSubmit }: { onSubmit: (input: GrinderInput) => void }) {
  const [choice, setChoice] = useState('');
  const [name, setName] = useState('');
  const [unit, setUnit] = useState<GrinderUnit>('click');
  const [submitted, setSubmitted] = useState(false);
  const ids = { name: useId(), choiceError: useId(), nameError: useId() };
  const model = getGrinderModel(choice);

  const errors = {
    choice: choice ? null : 'Wybierz młynek z listy albo „Inny młynek”.',
    name: choice === CUSTOM && !name.trim() ? 'Podaj nazwę młynka.' : null,
  };

  const submit = (event: FormEvent) => {
    event.preventDefault();
    setSubmitted(true);
    if (errors.choice || errors.name) return;
    onSubmit(model ? { modelId: model.id, name: model.name, unit: model.unit } : { name: name.trim(), unit });
  };

  return (
    <form onSubmit={submit} noValidate className="space-y-6">
      <fieldset aria-describedby={submitted && errors.choice ? ids.choiceError : undefined}>
        <legend className="font-medium">Który młynek masz?</legend>
        <div className="mt-2 flex flex-wrap gap-2">
          {grinderModels.map((m) => (
            <ChoiceChip key={m.id} type="radio" name="grinder" checked={choice === m.id} onChange={() => setChoice(m.id)}>
              {m.name}
            </ChoiceChip>
          ))}
          <ChoiceChip type="radio" name="grinder" checked={choice === CUSTOM} onChange={() => setChoice(CUSTOM)}>
            Inny młynek
          </ChoiceChip>
        </div>
        {submitted && errors.choice && <ErrorText id={ids.choiceError}>{errors.choice}</ErrorText>}
        {model && (
          <p className="mt-3 rounded-2xl bg-accent-soft p-3 text-sm">
            {model.kind === 'manual' ? 'Młynek ręczny' : 'Młynek elektryczny'}, ustawienie:{' '}
            {GRINDER_UNIT_LABELS[model.unit]}. {model.howTo}
          </p>
        )}
      </fieldset>

      {choice === CUSTOM && (
        <>
          <div>
            <label htmlFor={ids.name} className="font-medium">
              Nazwa
            </label>
            <input
              id={ids.name}
              className={inputClass}
              value={name}
              maxLength={MAX_NAME_LENGTH}
              onChange={(e) => setName(e.target.value)}
              placeholder="np. Zassenhaus Santiago"
              autoComplete="off"
              aria-invalid={submitted && errors.name ? true : undefined}
              aria-describedby={submitted && errors.name ? ids.nameError : undefined}
            />
            {submitted && errors.name && <ErrorText id={ids.nameError}>{errors.name}</ErrorText>}
          </div>
          <fieldset>
            <legend className="font-medium">Jak liczysz ustawienie?</legend>
            <div className="mt-2 flex flex-wrap gap-2">
              {GRINDER_UNITS.map((value) => (
                <ChoiceChip key={value} type="radio" name="unit" checked={unit === value} onChange={() => setUnit(value)}>
                  {GRINDER_UNIT_LABELS[value]}
                </ChoiceChip>
              ))}
            </div>
          </fieldset>
        </>
      )}

      <button
        type="submit"
        className="flex h-12 w-full items-center justify-center rounded-full bg-accent font-semibold text-on-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
      >
        Zapisz młynek
      </button>
    </form>
  );
}

function ErrorText({ id, children }: { id: string; children: string }) {
  return (
    <p id={id} className="mt-1 text-sm font-medium text-red-700 dark:text-red-300">
      {children}
    </p>
  );
}
