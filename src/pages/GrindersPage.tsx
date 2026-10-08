import { useId, useState, type FormEvent } from 'react';
import { Link } from 'react-router';
import { ChoiceChip } from '../components/ChoiceChip';
import { EmptyState } from '../components/EmptyState';
import { GrinderIcon } from '../components/icons';
import { MethodIcon } from '../components/MethodIcon';
import { PageHeader } from '../components/PageHeader';
import { ReviewNote } from '../components/ReviewNote';
import { Section } from '../components/Section';
import { Sheet } from '../components/Sheet';
import { GRIND_LABELS, GRINDER_UNIT_LABELS, methods } from '../data';
import { formatSetting, formatSettingRange } from '../features/grinder/format';
import { useGrindSettingDialog } from '../features/grinder/GrindSettingSheet';
import {
  activeGrinder,
  grinderModel,
  grindersStore,
  MAX_NAME_LENGTH,
  useGrinders,
  type SavedGrinder,
} from '../features/grinder/store';
import { capitalize } from '../lib/format';
import { addButtonClass } from './BeansPage';

const secondary =
  'flex h-12 flex-1 items-center justify-center rounded-full border border-line bg-surface px-4 font-semibold focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent';

/** Mój młynek (/ziarna/mlynek): ustawienie dla każdej metody, wybór używanego młynka. */
export function GrindersPage() {
  const state = useGrinders();
  const grinder = activeGrinder(state);
  const dialog = useGrindSettingDialog(grinder);
  const [renaming, setRenaming] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const header = (
    <PageHeader
      title={state.grinders.length > 1 ? 'Moje młynki' : 'Mój młynek'}
      lead="Zapisz, jak mielisz do każdej metody, a dobrą kawę łatwo powtórzysz."
      back={{ to: '/ziarna', label: 'Moje ziarna' }}
    />
  );

  if (!grinder) {
    return (
      <>
        {header}
        <EmptyState icon={GrinderIcon} title="Nie masz jeszcze młynka">
          Wybierz model z listy albo dodaj własny. Przy znanych modelach podpowiemy, od jakiego ustawienia zacząć.
        </EmptyState>
        <Link to="/ziarna/mlynek/nowy" className={`mt-6 ${addButtonClass}`}>
          Dodaj młynek
        </Link>
      </>
    );
  }

  const model = grinderModel(grinder);

  return (
    <>
      {header}

      {state.grinders.length > 1 && (
        <fieldset className="mb-6">
          <legend className="font-medium">Którego młynka używasz?</legend>
          <div className="mt-2 flex flex-wrap gap-2">
            {state.grinders.map((g) => (
              <ChoiceChip
                key={g.id}
                type="radio"
                name="active-grinder"
                checked={g.id === grinder.id}
                onChange={() => grindersStore.setActive(g.id)}
              >
                {g.name}
              </ChoiceChip>
            ))}
          </div>
        </fieldset>
      )}

      <div className="rounded-3xl bg-surface p-5">
        <div className="flex items-center gap-3">
          <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-accent-soft text-accent">
            <GrinderIcon className="size-6" />
          </span>
          <div className="min-w-0">
            <h2 className="font-display text-xl leading-tight font-semibold">{grinder.name}</h2>
            <p className="text-sm text-ink-muted">
              {model ? (model.kind === 'manual' ? 'Młynek ręczny' : 'Młynek elektryczny') : 'Własny młynek'},
              ustawienie: {GRINDER_UNIT_LABELS[grinder.unit]}
            </p>
          </div>
        </div>
        {model && <p className="mt-3 text-sm">{model.howTo}</p>}
        {model && <ReviewNote item={model} />}
      </div>

      <Section title="Ustawienia dla metod">
        <ul className="space-y-2">
          {methods.map((method) => {
            const setting = grinder.settings[method.id];
            const range = model?.grind[method.grind];
            return (
              <li key={method.id}>
                <button
                  type="button"
                  onClick={() => dialog.open(method.id)}
                  className="flex min-h-16 w-full items-center gap-3 rounded-2xl border border-line bg-surface px-4 py-2 text-left hover:bg-surface-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
                >
                  <MethodIcon methodId={method.id} className="size-6 shrink-0 text-accent" />
                  <span className="min-w-0 flex-1">
                    <span className="block font-medium">{method.name}</span>
                    <span className="block text-sm text-ink-muted">
                      {capitalize(GRIND_LABELS[method.grind])}
                      {model && (
                        <>
                          {' · podpowiedź: '}
                          <span className="whitespace-nowrap">
                            {range ? formatSettingRange(range, grinder.unit) : 'za drobno'}
                          </span>
                        </>
                      )}
                    </span>
                  </span>
                  <span
                    className={`shrink-0 text-right ${setting !== undefined ? 'font-semibold tabular-nums' : 'text-sm font-medium text-accent'}`}
                  >
                    {setting !== undefined ? formatSetting(setting, grinder.unit) : 'Ustaw'}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      </Section>

      <div className="mt-8 flex flex-col gap-3">
        <Link to="/ziarna/mlynek/nowy" className={addButtonClass}>
          Dodaj inny młynek
        </Link>
        <div className="flex gap-3">
          <button type="button" className={secondary} onClick={() => setRenaming(true)}>
            Zmień nazwę
          </button>
          <button type="button" className={secondary} onClick={() => setConfirmDelete(true)}>
            Usuń młynek
          </button>
        </div>
      </div>

      {dialog.sheet}

      <Sheet title="Zmień nazwę" open={renaming} onClose={() => setRenaming(false)}>
        <RenameForm grinder={grinder} onDone={() => setRenaming(false)} />
      </Sheet>

      <Sheet title={`Usunąć „${grinder.name}”?`} open={confirmDelete} onClose={() => setConfirmDelete(false)}>
        <p className="text-ink-muted">
          Ustawienia dla metod znikną. Wpisy w dzienniku zachowają nazwę młynka i ustawienie.
        </p>
        <div className="mt-5 flex gap-3">
          <button type="button" className={secondary} onClick={() => setConfirmDelete(false)}>
            Anuluj
          </button>
          <button
            type="button"
            className="flex h-12 flex-1 items-center justify-center rounded-full bg-red-700 font-semibold text-white"
            onClick={() => {
              grindersStore.remove(grinder.id);
              setConfirmDelete(false);
            }}
          >
            Usuń młynek
          </button>
        </div>
      </Sheet>
    </>
  );
}

function RenameForm({ grinder, onDone }: { grinder: SavedGrinder; onDone: () => void }) {
  const [name, setName] = useState(grinder.name);
  const [submitted, setSubmitted] = useState(false);
  const ids = { input: useId(), error: useId() };
  const error = name.trim() ? null : 'Podaj nazwę młynka.';

  const submit = (event: FormEvent) => {
    event.preventDefault();
    setSubmitted(true);
    if (error) return;
    grindersStore.rename(grinder.id, name);
    onDone();
  };

  return (
    <form onSubmit={submit} noValidate>
      <label htmlFor={ids.input} className="font-medium">
        Nazwa
      </label>
      <input
        id={ids.input}
        className="mt-1 h-12 w-full rounded-xl border border-line bg-surface px-4 text-base focus:border-accent focus:outline-2 focus:outline-accent/40"
        value={name}
        maxLength={MAX_NAME_LENGTH}
        autoComplete="off"
        onChange={(event) => setName(event.target.value)}
        aria-invalid={submitted && error ? true : undefined}
        aria-describedby={submitted && error ? ids.error : undefined}
      />
      {submitted && error && (
        <p id={ids.error} className="mt-1 text-sm font-medium text-red-700 dark:text-red-300">
          {error}
        </p>
      )}
      <button
        type="submit"
        className="mt-5 flex h-12 w-full items-center justify-center rounded-full bg-accent font-semibold text-on-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
      >
        Zapisz
      </button>
    </form>
  );
}
