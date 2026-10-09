import { useEffect, useId, useRef, useState, type FormEvent, type ReactNode } from 'react';
import { ChoiceChip } from '../../components/ChoiceChip';
import { ChevronDownIcon, ChevronUpIcon, PlusIcon, TrashIcon } from '../../components/icons';
import { GRIND_HINTS, GRIND_LABELS, GRIND_SIZES, GRINDER_UNIT_LABELS, type BrewMethod } from '../../data';
import { capitalize } from '../../lib/format';
import { fillAmounts } from '../brewing/dose';
import { formatSetting, formatSettingRange } from '../grinder/format';
import { grinderModel, SETTING_LIMITS, useActiveGrinder } from '../grinder/store';
import {
  hasErrors,
  insertToken,
  moveStep,
  parseNumber,
  recipeDraft,
  stepDraft,
  validateDraft,
  type DraftErrors,
  type RecipeDraft,
  type StepDraft,
} from './draft';
import { RECIPE_LIMITS, type RecipeInput } from './recipe';

const inputClass =
  'mt-1 h-12 w-full min-w-0 rounded-xl border border-line bg-surface px-4 text-base focus:border-accent focus:outline-2 focus:outline-accent/40';
const shortInputClass =
  'h-12 w-20 min-w-0 rounded-xl border border-line bg-surface px-2 text-center text-base tabular-nums focus:border-accent focus:outline-2 focus:outline-accent/40';
const textareaClass =
  'mt-1 w-full rounded-xl border border-line bg-surface px-4 py-3 text-base focus:border-accent focus:outline-2 focus:outline-accent/40';
const iconButton =
  'flex size-11 shrink-0 items-center justify-center rounded-full border border-line bg-surface text-accent hover:bg-surface-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent disabled:opacity-40';
const smallButton =
  'inline-flex h-10 items-center gap-1 rounded-full bg-accent-soft px-3 text-sm font-semibold text-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent';

type RecipeEditorProps = {
  /** Metoda bez przeliczenia (granice kalkulatora, sprzęt). */
  method: BrewMethod;
  /** Kopia przepisu metody albo zapisany przepis. */
  initial: RecipeInput;
  /** Ustawienie używanego młynka na start. */
  initialSetting?: number;
  submitLabel: string;
  onSubmit: (input: RecipeInput) => void;
};

type FieldName = 'text' | 'detail';

/**
 * Edytor własnego przepisu: nazwa, ilości, temperatura, mielenie, ustawienie młynka i kroki.
 * Kroki dodaje się, usuwa i przesuwa przyciskami (bez przeciągania), a ilości wstawia jako
 * znaczniki, które kalkulator zamienia na liczby.
 */
export function RecipeEditor({ method, initial, initialSetting, submitLabel, onSubmit }: RecipeEditorProps) {
  const grinder = useActiveGrinder();
  const model = grinder ? grinderModel(grinder) : undefined;
  const [draft, setDraft] = useState<RecipeDraft>(() => recipeDraft(initial, initialSetting));
  const [submitted, setSubmitted] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const [announcement, setAnnouncement] = useState('');
  const fields = useRef(new Map<string, HTMLInputElement | HTMLTextAreaElement>());
  const lastField = useRef(new Map<number, FieldName>());
  const pendingFocus = useRef<(() => void) | null>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const ids = {
    name: useId(),
    coffee: useId(),
    water: useId(),
    temp: useId(),
    setting: useId(),
    note: useId(),
    error: useId(),
  };

  const limits = model?.scale ?? SETTING_LIMITS;
  const { errors, input } = validateDraft(draft, method, grinder ? { grinder, limits } : null);
  const shown: DraftErrors = submitted ? errors : { step: {} };

  // Po przesunięciu, dodaniu albo usunięciu kroku fokus idzie tam, gdzie trafił krok.
  useEffect(() => {
    pendingFocus.current?.();
    pendingFocus.current = null;
  });

  // Po nieudanym zapisie fokus trafia na pierwsze błędne pole.
  useEffect(() => {
    if (attempt === 0) return;
    formRef.current?.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus();
  }, [attempt]);

  const update = (patch: Partial<RecipeDraft>) => setDraft((current) => ({ ...current, ...patch }));
  const updateStep = (key: number, patch: Partial<StepDraft>) =>
    setDraft((current) => ({
      ...current,
      steps: current.steps.map((step) => (step.key === key ? { ...step, ...patch } : step)),
    }));

  const focusLater = (selector: string) => {
    pendingFocus.current = () => formRef.current?.querySelector<HTMLElement>(selector)?.focus();
  };

  const move = (index: number, direction: -1 | 1) => {
    const step = draft.steps[index]!;
    setDraft((current) => ({ ...current, steps: moveStep(current.steps, index, direction) }));
    const target = index + direction;
    setAnnouncement(`Krok ${index + 1} jest teraz krokiem ${target + 1}.`);
    // Na skraju listy przycisk w tę stronę się wyłącza, więc fokus przechodzi na drugi.
    const atEdge = target === 0 || target === draft.steps.length - 1;
    const which = atEdge ? (direction === -1 ? 'down' : 'up') : direction === -1 ? 'up' : 'down';
    focusLater(`[data-step="${step.key}"] [data-move="${which}"]`);
  };

  const remove = (index: number) => {
    const next = draft.steps[index + 1] ?? draft.steps[index - 1];
    setDraft((current) => ({ ...current, steps: current.steps.filter((_, i) => i !== index) }));
    setAnnouncement(`Usunięto krok ${index + 1}.`);
    focusLater(next ? `[data-step="${next.key}"] [data-heading]` : '[data-add-step]');
  };

  const add = () => {
    const step = stepDraft();
    setDraft((current) => ({ ...current, steps: [...current.steps, step] }));
    setAnnouncement(`Dodano krok ${draft.steps.length + 1}.`);
    focusLater(`[data-step="${step.key}"] [data-field="text"]`);
  };

  const insert = (step: StepDraft, token: string) => {
    const field = lastField.current.get(step.key) ?? 'text';
    const element = fields.current.get(`${step.key}-${field}`);
    const result = insertToken(step[field], token, element?.selectionStart ?? undefined);
    updateStep(step.key, { [field]: result.text });
    pendingFocus.current = () => {
      element?.focus();
      element?.setSelectionRange(result.caret, result.caret);
    };
  };

  const submit = (event: FormEvent) => {
    event.preventDefault();
    setSubmitted(true);
    setAttempt((n) => n + 1);
    if (!input) return;
    // Ustawienie innego młynka (zapisane wcześniej) zostaje, dopóki nie wpiszesz nowego.
    const keepOther = !input.grinder && initial.grinder && initial.grinder.grinderId !== grinder?.id;
    onSubmit(keepOther ? { ...input, grinder: initial.grinder } : input);
  };

  const coffee = parseNumber(draft.coffeeG);
  const water = parseNumber(draft.waterMl);
  const preview = coffee !== null && water !== null ? { coffeeG: coffee, waterMl: water } : null;
  const range = model?.grind[draft.grind];
  const otherGrinder = initial.grinder && initial.grinder.grinderId !== grinder?.id ? initial.grinder : null;

  return (
    <form ref={formRef} onSubmit={submit} noValidate className="space-y-6">
      <Field label="Nazwa" id={ids.name} error={shown.name}>
        <input
          id={ids.name}
          className={inputClass}
          value={draft.name}
          maxLength={RECIPE_LIMITS.name}
          autoComplete="off"
          onChange={(e) => update({ name: e.target.value })}
          {...invalid(shown.name, ids.name)}
        />
      </Field>

      <fieldset>
        <legend className="font-medium">Ilości na jedno parzenie</legend>
        <div className="mt-1 grid grid-cols-2 gap-3">
          <Field label="Kawa (g)" id={ids.coffee} error={shown.coffeeG} small>
            <input
              id={ids.coffee}
              inputMode="decimal"
              autoComplete="off"
              className={`${inputClass} tabular-nums`}
              value={draft.coffeeG}
              onChange={(e) => update({ coffeeG: e.target.value })}
              {...invalid(shown.coffeeG, ids.coffee)}
            />
          </Field>
          <Field label="Woda (ml)" id={ids.water} error={shown.waterMl} small>
            <input
              id={ids.water}
              inputMode="numeric"
              autoComplete="off"
              className={`${inputClass} tabular-nums`}
              value={draft.waterMl}
              onChange={(e) => update({ waterMl: e.target.value })}
              {...invalid(shown.waterMl, ids.water)}
            />
          </Field>
        </div>
        <p className="mt-2 text-sm text-ink-muted">
          {preview && preview.coffeeG > 0 && `Proporcja 1:${ratioText(preview.waterMl / preview.coffeeG)}. `}
          Sprzęt mieści od {method.scaling.waterMl.min} do {method.scaling.waterMl.max} ml. Na ekranie przepisu
          przeliczysz ilości na więcej osób.
        </p>
      </fieldset>

      <fieldset aria-describedby={shown.temp ? `${ids.temp}-error` : undefined}>
        <legend className="font-medium">Temperatura wody (°C)</legend>
        <div className="mt-1 flex items-center gap-2">
          <label htmlFor={`${ids.temp}-min`} className="text-sm text-ink-muted">
            od
          </label>
          <input
            id={`${ids.temp}-min`}
            inputMode="numeric"
            autoComplete="off"
            className={shortInputClass}
            value={draft.tempMin}
            onChange={(e) => update({ tempMin: e.target.value })}
            aria-invalid={shown.temp ? true : undefined}
          />
          <label htmlFor={`${ids.temp}-max`} className="text-sm text-ink-muted">
            do
          </label>
          <input
            id={`${ids.temp}-max`}
            inputMode="numeric"
            autoComplete="off"
            className={shortInputClass}
            value={draft.tempMax}
            onChange={(e) => update({ tempMax: e.target.value })}
            aria-invalid={shown.temp ? true : undefined}
          />
        </div>
        {shown.temp && <ErrorText id={`${ids.temp}-error`}>{shown.temp}</ErrorText>}
      </fieldset>

      <fieldset>
        <legend className="font-medium">Mielenie</legend>
        <div className="mt-2 flex flex-wrap gap-2">
          {GRIND_SIZES.map((size) => (
            <ChoiceChip key={size} type="radio" name="grind" checked={draft.grind === size} onChange={() => update({ grind: size })}>
              {GRIND_LABELS[size]}
            </ChoiceChip>
          ))}
        </div>
        <p className="mt-2 text-sm text-ink-muted">{capitalize(GRIND_HINTS[draft.grind])}.</p>
      </fieldset>

      {grinder ? (
        <Field
          label={
            <>
              Ustawienie młynka {grinder.name}{' '}
              <span className="font-normal text-ink-muted">({GRINDER_UNIT_LABELS[grinder.unit]}, opcjonalnie)</span>
            </>
          }
          id={ids.setting}
          error={shown.grinderSetting}
        >
          <input
            id={ids.setting}
            inputMode="decimal"
            autoComplete="off"
            className={`${inputClass} tabular-nums`}
            value={draft.grinderSetting}
            onChange={(e) => update({ grinderSetting: e.target.value })}
            {...invalid(shown.grinderSetting, ids.setting)}
          />
          {model && (
            <p className="mt-1 text-sm text-ink-muted">
              {range ? `Podpowiedź dla tego mielenia: ${formatSettingRange(range, grinder.unit)}.` : 'Ten młynek tak drobno nie zmieli.'}
            </p>
          )}
          {otherGrinder && (
            <p className="mt-1 text-sm text-ink-muted">
              Zapisane ustawienie: {otherGrinder.grinderName} · {formatSetting(otherGrinder.setting, otherGrinder.unit)}.
              Zostanie, jeśli nie wpiszesz nowego.
            </p>
          )}
        </Field>
      ) : (
        otherGrinder && (
          <p className="text-sm text-ink-muted">
            Ustawienie młynka: {otherGrinder.grinderName} · {formatSetting(otherGrinder.setting, otherGrinder.unit)}.
          </p>
        )
      )}

      <section aria-labelledby="kroki-przepisu">
        <h2 id="kroki-przepisu" className="font-display text-xl font-semibold">
          Kroki
        </h2>
        <p className="mt-1 text-sm text-ink-muted">
          Przyciski „+ ilość” wstawiają znaczniki <code>{'{coffee}'}</code> i <code>{'{water}'}</code>: przy parzeniu
          zamienią się na gramy i mililitry z kalkulatora. Część wody wpisz jako <code>{'{water*0.5}'}</code>.
        </p>
        {shown.steps && <ErrorText id={`${ids.error}-steps`}>{shown.steps}</ErrorText>}
        <ol className="mt-4 space-y-4">
          {draft.steps.map((step, index) => (
            <li key={step.key} data-step={step.key}>
              <StepEditor
                step={step}
                index={index}
                total={draft.steps.length}
                errors={shown.step[step.key]}
                preview={preview}
                onChange={(patch) => updateStep(step.key, patch)}
                onMove={(direction) => move(index, direction)}
                onRemove={() => remove(index)}
                onInsert={(token) => insert(step, token)}
                registerField={(field, element) => {
                  const key = `${step.key}-${field}`;
                  if (element) fields.current.set(key, element);
                  else fields.current.delete(key);
                }}
                onFieldFocus={(field) => lastField.current.set(step.key, field)}
              />
            </li>
          ))}
        </ol>
        <button
          type="button"
          data-add-step
          onClick={add}
          disabled={draft.steps.length >= RECIPE_LIMITS.steps}
          className="mt-4 flex h-12 w-full items-center justify-center gap-2 rounded-full border border-dashed border-line bg-surface font-semibold text-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent disabled:opacity-40"
        >
          <PlusIcon className="size-5" />
          Dodaj krok
        </button>
        <p role="status" className="sr-only">
          {announcement}
        </p>
      </section>

      <Field
        label={
          <>
            Notatka <span className="font-normal text-ink-muted">(opcjonalnie)</span>
          </>
        }
        id={ids.note}
        error={shown.note}
      >
        <textarea
          id={ids.note}
          rows={3}
          maxLength={RECIPE_LIMITS.note}
          className={textareaClass}
          placeholder="np. do etiopskich ziaren, wychodzi słodsza"
          value={draft.note}
          onChange={(e) => update({ note: e.target.value })}
          {...invalid(shown.note, ids.note)}
        />
      </Field>

      {submitted && hasErrors(errors) && (
        <p role="alert" className="rounded-2xl border border-red-700/40 bg-red-700/10 p-3 text-sm font-medium">
          Popraw zaznaczone pola, żeby zapisać przepis.
        </p>
      )}
      <button
        type="submit"
        className="flex h-12 w-full items-center justify-center rounded-full bg-accent font-semibold text-on-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
      >
        {submitLabel}
      </button>
    </form>
  );
}

type StepEditorProps = {
  step: StepDraft;
  index: number;
  total: number;
  errors?: { text?: string; detail?: string; time?: string };
  preview: { coffeeG: number; waterMl: number } | null;
  onChange: (patch: Partial<StepDraft>) => void;
  onMove: (direction: -1 | 1) => void;
  onRemove: () => void;
  onInsert: (token: string) => void;
  registerField: (field: FieldName, element: HTMLInputElement | HTMLTextAreaElement | null) => void;
  onFieldFocus: (field: FieldName) => void;
};

function StepEditor({
  step,
  index,
  total,
  errors = {},
  preview,
  onChange,
  onMove,
  onRemove,
  onInsert,
  registerField,
  onFieldFocus,
}: StepEditorProps) {
  const ids = { heading: useId(), text: useId(), detail: useId(), time: useId() };
  const n = index + 1;
  const filled =
    preview && /\{(coffee|water)/.test(`${step.text} ${step.detail}`)
      ? [step.text, step.detail].filter(Boolean).map((text) => fillAmounts(text, preview)).join(' · ')
      : null;

  return (
    <div role="group" aria-labelledby={ids.heading} className="rounded-2xl border border-line bg-surface p-4">
      <div className="flex items-center justify-between gap-2">
        <h3 id={ids.heading} data-heading tabIndex={-1} className="font-display text-lg font-semibold outline-none">
          Krok {n}
        </h3>
        <div className="flex gap-1.5">
          <button type="button" data-move="up" className={iconButton} onClick={() => onMove(-1)} disabled={index === 0}>
            <ChevronUpIcon className="size-5" />
            <span className="sr-only">Przesuń krok {n} w górę</span>
          </button>
          <button type="button" data-move="down" className={iconButton} onClick={() => onMove(1)} disabled={index === total - 1}>
            <ChevronDownIcon className="size-5" />
            <span className="sr-only">Przesuń krok {n} w dół</span>
          </button>
          <button type="button" className={iconButton} onClick={onRemove}>
            <TrashIcon className="size-5" />
            <span className="sr-only">Usuń krok {n}</span>
          </button>
        </div>
      </div>

      <div className="mt-3 space-y-3">
        <Field label="Polecenie" id={ids.text} error={errors.text} small>
          <input
            id={ids.text}
            ref={(element) => registerField('text', element)}
            data-field="text"
            className={inputClass}
            value={step.text}
            maxLength={RECIPE_LIMITS.stepText}
            autoComplete="off"
            placeholder="np. Zalej {water} ml wody"
            onFocus={() => onFieldFocus('text')}
            onChange={(e) => onChange({ text: e.target.value })}
            {...invalid(errors.text, ids.text)}
          />
        </Field>
        <Field
          label={
            <>
              Szczegóły <span className="font-normal text-ink-muted">(opcjonalnie)</span>
            </>
          }
          id={ids.detail}
          error={errors.detail}
          small
        >
          <textarea
            id={ids.detail}
            ref={(element) => registerField('detail', element)}
            rows={2}
            maxLength={RECIPE_LIMITS.stepDetail}
            className={textareaClass}
            value={step.detail}
            onFocus={() => onFieldFocus('detail')}
            onChange={(e) => onChange({ detail: e.target.value })}
            {...invalid(errors.detail, ids.detail)}
          />
        </Field>
        <div className="flex flex-wrap gap-2">
          <button type="button" className={smallButton} onClick={() => onInsert('{coffee}')}>
            <PlusIcon className="size-4" />
            <span aria-hidden="true">ilość kawy</span>
            <span className="sr-only">Wstaw ilość kawy do kroku {n}</span>
          </button>
          <button type="button" className={smallButton} onClick={() => onInsert('{water}')}>
            <PlusIcon className="size-4" />
            <span aria-hidden="true">ilość wody</span>
            <span className="sr-only">Wstaw ilość wody do kroku {n}</span>
          </button>
        </div>
        {filled && (
          <p className="text-sm text-ink-muted">
            <span className="font-medium text-ink">Z ilościami: </span>
            {filled}
          </p>
        )}

        <fieldset aria-describedby={errors.time ? `${ids.time}-error` : undefined}>
          <legend className="text-sm font-medium">
            Stoper <span className="font-normal text-ink-muted">(puste pola: bez stopera)</span>
          </legend>
          <div className="mt-1 flex items-center gap-2">
            <input
              aria-label={`Minuty, krok ${n}`}
              inputMode="numeric"
              autoComplete="off"
              className={shortInputClass}
              value={step.minutes}
              onChange={(e) => onChange({ minutes: e.target.value })}
              aria-invalid={errors.time ? true : undefined}
            />
            <span aria-hidden="true" className="text-sm text-ink-muted">
              min
            </span>
            <input
              aria-label={`Sekundy, krok ${n}`}
              inputMode="numeric"
              autoComplete="off"
              className={shortInputClass}
              value={step.seconds}
              onChange={(e) => onChange({ seconds: e.target.value })}
              aria-invalid={errors.time ? true : undefined}
            />
            <span aria-hidden="true" className="text-sm text-ink-muted">
              s
            </span>
          </div>
          {errors.time && <ErrorText id={`${ids.time}-error`}>{errors.time}</ErrorText>}
        </fieldset>

        <fieldset>
          <legend className="text-sm font-medium">Co robisz w tym kroku?</legend>
          <div className="mt-1 flex flex-wrap gap-2">
            <ChoiceChip type="radio" name={`action-${step.key}`} checked={step.action} onChange={() => onChange({ action: true })}>
              działanie
            </ChoiceChip>
            <ChoiceChip type="radio" name={`action-${step.key}`} checked={!step.action} onChange={() => onChange({ action: false })}>
              czekanie
            </ChoiceChip>
          </div>
          <p className="mt-1 text-xs text-ink-muted">
            {step.action
              ? 'Stoper uruchamiasz sam, kiedy zaczniesz (np. zalewać).'
              : 'Stoper rusza sam po przejściu do tego kroku.'}
          </p>
        </fieldset>
      </div>
    </div>
  );
}

const ratio = new Intl.NumberFormat('pl-PL', { maximumFractionDigits: 1 });
const ratioText = (value: number) => ratio.format(value);

/** aria-invalid i opis błędu dla pola. */
function invalid(error: string | undefined, id: string) {
  return error ? { 'aria-invalid': true as const, 'aria-describedby': `${id}-error` } : {};
}

function Field({
  label,
  id,
  error,
  small,
  children,
}: {
  label: ReactNode;
  id: string;
  error?: string;
  small?: boolean;
  children: ReactNode;
}) {
  return (
    <div>
      <label htmlFor={id} className={small ? 'text-sm font-medium' : 'font-medium'}>
        {label}
      </label>
      {children}
      {error && <ErrorText id={`${id}-error`}>{error}</ErrorText>}
    </div>
  );
}

function ErrorText({ id, children }: { id: string; children: ReactNode }) {
  return (
    <p id={id} className="mt-1 text-sm font-medium text-red-700 dark:text-red-300">
      {children}
    </p>
  );
}
