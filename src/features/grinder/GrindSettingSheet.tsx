import { useId, useState, type FormEvent } from 'react';
import { MinusIcon, PlusIcon } from '../../components/icons';
import { ReviewNote } from '../../components/ReviewNote';
import { Sheet } from '../../components/Sheet';
import { getMethod, GRIND_HINTS, GRIND_LABELS, GRINDER_UNIT_LABELS, type BrewMethod } from '../../data';
import { useDialogParam } from '../../lib/useDialogParam';
import { formatSettingRange, parseSetting, roundToStep, settingInputValue } from './format';
import { grinderModel, grindersStore, SETTING_LIMITS, type SavedGrinder } from './store';

const primary =
  'flex h-12 w-full items-center justify-center rounded-full bg-accent px-6 font-semibold text-on-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent';
const secondary =
  'flex h-12 w-full items-center justify-center rounded-full border border-line bg-surface px-4 font-semibold focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent';
const stepButton =
  'flex size-12 shrink-0 items-center justify-center rounded-full border border-line bg-surface text-accent hover:bg-surface-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent';

/**
 * Okno „Ustawienie młynka” dla metody, sterowane parametrem ?mielenie=id-metody w adresie
 * (gest „wstecz” je zamyka). Zmienia ustawienie podanego młynka.
 */
export function useGrindSettingDialog(grinder: SavedGrinder | null) {
  const dialog = useDialogParam('mielenie');
  const method = dialog.value ? getMethod(dialog.value) : undefined;

  const sheet = (
    <Sheet
      title={method?.name ?? ''}
      subtitle="Ustawienie młynka"
      open={grinder !== null && method !== undefined}
      onClose={dialog.close}
    >
      {grinder && method && (
        <GrindSettingForm key={`${grinder.id}-${method.id}`} grinder={grinder} method={method} onDone={dialog.close} />
      )}
    </Sheet>
  );

  return { open: dialog.open, sheet };
}

function GrindSettingForm({
  grinder,
  method,
  onDone,
}: {
  grinder: SavedGrinder;
  method: BrewMethod;
  onDone: () => void;
}) {
  const model = grinderModel(grinder);
  const range = model?.grind[method.grind];
  const current = grinder.settings[method.id];
  const step = model?.step ?? (grinder.unit === 'turn' ? 0.1 : 1);
  const limits = model?.scale ?? SETTING_LIMITS;
  // Na start: zapisane ustawienie albo środek podpowiedzi dla znanego modelu.
  const start = current ?? (range ? roundToStep((range.min + range.max) / 2, step) : undefined);
  const [text, setText] = useState(start === undefined ? '' : settingInputValue(start));
  const [submitted, setSubmitted] = useState(false);
  const ids = { input: useId(), error: useId() };

  const value = parseSetting(text);
  const error = !text.trim()
    ? 'Wpisz ustawienie.'
    : value === null
      ? 'Wpisz samą liczbę, np. 24 albo 2,5.'
      : value < limits.min || value > limits.max
        ? `Wpisz liczbę od ${settingInputValue(limits.min)} do ${settingInputValue(limits.max)}.`
        : null;

  const bump = (direction: 1 | -1) => {
    const next = value === null ? (start ?? limits.min) : roundToStep(value + direction * step, step);
    setText(settingInputValue(Math.min(limits.max, Math.max(limits.min, next))));
  };

  const submit = (event: FormEvent) => {
    event.preventDefault();
    setSubmitted(true);
    if (error || value === null) return;
    grindersStore.setSetting(grinder.id, method.id, value);
    onDone();
  };

  return (
    <form onSubmit={submit} noValidate>
      <p className="text-ink-muted">
        {grinder.name}. Mielenie: <span className="font-medium text-ink">{GRIND_LABELS[method.grind]}</span>,{' '}
        {GRIND_HINTS[method.grind]}.
      </p>

      {model && (
        <div className="mt-3 rounded-2xl bg-accent-soft p-3 text-sm">
          {range ? (
            <p>
              Podpowiedź na start: <strong className="font-semibold whitespace-nowrap">{formatSettingRange(range, grinder.unit)}</strong>.
              Potem poprawiaj po smaku: kwaśna i wodnista kawa to za grubo, gorzka to za drobno.
            </p>
          ) : (
            <p>
              Ten młynek tak drobno nie zmieli. Spróbuj najdrobniejszego ustawienia albo poproś o zmielenie kawy w
              palarni.
            </p>
          )}
          <ReviewNote item={model} />
        </div>
      )}

      <label htmlFor={ids.input} className="mt-5 block font-medium">
        Ustawienie <span className="font-normal text-ink-muted">({GRINDER_UNIT_LABELS[grinder.unit]})</span>
      </label>
      <div className="mt-1 flex items-center gap-2">
        <button type="button" className={stepButton} onClick={() => bump(-1)}>
          <MinusIcon className="size-5" />
          <span className="sr-only">Zmniejsz ustawienie</span>
        </button>
        <input
          id={ids.input}
          inputMode="decimal"
          autoComplete="off"
          className="h-12 w-full min-w-0 flex-1 rounded-xl border border-line bg-surface px-4 text-center text-xl font-semibold tabular-nums focus:border-accent focus:outline-2 focus:outline-accent/40"
          value={text}
          onChange={(event) => setText(event.target.value)}
          aria-invalid={submitted && error ? true : undefined}
          aria-describedby={submitted && error ? ids.error : undefined}
        />
        <button type="button" className={stepButton} onClick={() => bump(1)}>
          <PlusIcon className="size-5" />
          <span className="sr-only">Zwiększ ustawienie</span>
        </button>
      </div>
      {submitted && error && (
        <p id={ids.error} className="mt-1 text-sm font-medium text-red-700 dark:text-red-300">
          {error}
        </p>
      )}
      {model && <p className="mt-2 text-sm text-ink-muted">{model.howTo}</p>}

      <div className="mt-6 flex flex-col-reverse gap-3">
        {current !== undefined && (
          <button
            type="button"
            className={secondary}
            onClick={() => {
              grindersStore.setSetting(grinder.id, method.id, null);
              onDone();
            }}
          >
            Usuń ustawienie
          </button>
        )}
        <button type="submit" className={primary}>
          Zapisz
        </button>
      </div>
    </form>
  );
}
