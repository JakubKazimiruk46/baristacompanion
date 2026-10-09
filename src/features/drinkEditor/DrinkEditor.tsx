import { useId, useMemo, useRef, useState, type FormEvent, type ReactNode } from 'react';
import { ChoiceChip } from '../../components/ChoiceChip';
import { ChevronDownIcon, ChevronUpIcon, PlusIcon, SparklesIcon, TrashIcon } from '../../components/icons';
import { Sheet } from '../../components/Sheet';
import {
  AMOUNT_UNITS,
  DECORATION_LABELS,
  getIngredient,
  getSyrup,
  ingredients,
  INGREDIENT_GROUP_LABELS,
  INGREDIENT_GROUPS,
  MILK_PREP_LABELS,
  milks,
  UNIT_FORMS,
  vessels,
  type DecorationKind,
  type Drink,
  type LayerKind,
  type MilkPrep,
  type VesselId,
} from '../../data';
import { DRINK_LIMITS } from '../../../supabase/functions/_shared/drinkRules.ts';
import { validateDrink } from '../../data/validate';
import { capitalize } from '../../lib/format';
import { DrinkGlass } from '../glass/DrinkGlass';
import {
  BASE_METHODS,
  DECORATION_LOOK_LABELS,
  draftErrors,
  draftToDrink,
  hasErrors,
  LAYER_COLORS,
  LAYER_KIND_LABELS,
  layersTotal,
  LOOKS_FOR,
  move,
  newExtra,
  newKey,
  previewDrink,
  suggestLayers,
  type DecorationDraft,
  type DrinkDraft,
  type DrinkDraftErrors,
  type ExtraDraft,
  type LayerDraft,
} from './draft';

const inputClass =
  'mt-1 h-12 w-full min-w-0 rounded-xl border border-line bg-surface px-4 text-base focus:border-accent focus:outline-2 focus:outline-accent/40 aria-invalid:border-red-700';
const smallInput =
  'h-11 w-20 min-w-0 rounded-xl border border-line bg-surface px-2 text-center text-base tabular-nums focus:border-accent focus:outline-2 focus:outline-accent/40';
const textareaClass =
  'mt-1 w-full rounded-xl border border-line bg-surface px-4 py-3 text-base focus:border-accent focus:outline-2 focus:outline-accent/40';
const selectClass =
  'h-11 min-w-0 rounded-xl border border-line bg-surface px-3 text-base focus:border-accent focus:outline-2 focus:outline-accent/40';
const iconButton =
  'flex size-11 shrink-0 items-center justify-center rounded-full border border-line bg-surface text-accent hover:bg-surface-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent disabled:opacity-40';
const addButton =
  'inline-flex h-11 items-center gap-1 rounded-full bg-accent-soft px-4 text-sm font-semibold text-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent disabled:opacity-40';
const card = 'rounded-2xl border border-line bg-surface p-3';

// Składniki do dodatków: syropy i reszta katalogu bez mleka (ma osobne pole) i wody (jest zawsze).
const EXTRA_GROUPS = INGREDIENT_GROUPS.filter((group) => group !== 'milk')
  .map((group) => ({ group, items: ingredients.filter((i) => i.group === group && !i.always) }))
  .filter(({ items }) => items.length > 0);

const DECORATION_KINDS: DecorationKind[] = ['topping', 'garnish', 'rim', 'wall-pattern'];
const MILK_PREPS: MilkPrep[] = ['froth', 'warm', 'blend', 'plain'];

type DrinkEditorProps = {
  initial: DrinkDraft;
  submitLabel: string;
  /** Napój z formularza, sprawdzony regułami katalogu (id nadaje zapis). */
  onSubmit: (drink: Drink) => void;
};

/**
 * Kreator napoju: składniki, naczynie, warstwy od dołu, dekoracje i kroki, z podglądem
 * szklanki na żywo. Listy przesuwa się przyciskami, a błędy pokazują się przy polach.
 */
export function DrinkEditor({ initial, submitLabel, onSubmit }: DrinkEditorProps) {
  const [draft, setDraft] = useState(initial);
  const [submitted, setSubmitted] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [undoLayers, setUndoLayers] = useState<LayerDraft[] | null>(null);
  const [failure, setFailure] = useState<string[] | null>(null);
  const summaryRef = useRef<HTMLDivElement>(null);
  const errors = draftErrors(draft);
  const shown: DrinkDraftErrors = submitted ? errors : { item: {} };
  const preview = useMemo(() => previewDrink(draft), [draft]);
  const total = layersTotal(draft);
  const capacity = vessels[draft.vessel].capacityMl;

  const set = (patch: Partial<DrinkDraft>) => setDraft((d) => ({ ...d, ...patch }));
  const setItem = <K extends 'extras' | 'layers' | 'decorations' | 'steps'>(
    list: K,
    key: number,
    patch: Partial<DrinkDraft[K][number]>,
  ) => setDraft((d) => ({ ...d, [list]: (d[list] as { key: number }[]).map((item) => (item.key === key ? { ...item, ...patch } : item)) }));
  const removeItem = (list: 'extras' | 'layers' | 'decorations' | 'steps', key: number) =>
    setDraft((d) => ({ ...d, [list]: (d[list] as { key: number }[]).filter((item) => item.key !== key) }));
  const moveItem = (list: 'layers' | 'decorations' | 'steps', key: number, direction: -1 | 1) =>
    setDraft((d) => ({ ...d, [list]: move(d[list] as { key: number }[], key, direction) }));

  const submit = (event: FormEvent) => {
    event.preventDefault();
    setSubmitted(true);
    if (hasErrors(errors)) {
      setFailure(null);
      requestAnimationFrame(() => summaryRef.current?.focus());
      return;
    }
    const drink = draftToDrink(draft, 'moj-nowy');
    // Formularz pilnuje tych samych granic, ale ostatnie słowo mają reguły katalogu.
    const rules = validateDrink(drink);
    if (rules.length > 0) {
      setFailure(rules);
      requestAnimationFrame(() => summaryRef.current?.focus());
      return;
    }
    onSubmit(drink);
  };

  const errorCount = Object.entries(errors).filter(([key, value]) => key !== 'item' && value).length + Object.keys(errors.item).length;

  return (
    <form noValidate onSubmit={submit}>
      {/* Podgląd na żywo: zawsze widać szklankę i ile się w niej mieści. */}
      <div className="sticky top-0 z-[5] -mx-4 flex items-center gap-3 border-b border-line bg-canvas/95 px-4 pt-[max(0.5rem,env(safe-area-inset-top))] pb-2 backdrop-blur-md">
        <DrinkGlass drink={preview} variant="thumb" className="h-20 w-14 shrink-0" />
        <div className="min-w-0 flex-1">
          <p className="truncate font-display text-lg font-semibold">{preview.name}</p>
          <Meter total={total} capacity={capacity} />
        </div>
        <button type="button" aria-haspopup="dialog" onClick={() => setPreviewOpen(true)} className={addButton}>
          Podgląd
        </button>
      </div>

      {submitted && (hasErrors(errors) || failure) && (
        <div ref={summaryRef} tabIndex={-1} role="alert" className="mt-4 rounded-2xl border border-red-700/40 bg-red-700/10 p-4 text-sm outline-none">
          {failure ? (
            <>
              <p className="font-semibold">Napój nie przeszedł sprawdzenia:</p>
              <ul className="mt-1 list-disc pl-5">
                {failure.slice(0, 5).map((message) => (
                  <li key={message}>{message}</li>
                ))}
              </ul>
            </>
          ) : (
            <p className="font-semibold">Popraw {errorCount === 1 ? 'jedno pole' : `pola (${errorCount})`} zaznaczone niżej.</p>
          )}
        </div>
      )}

      <Group title="Napój">
        <Field label="Nazwa napoju" error={shown.name}>
          {(props) => <input {...props} className={inputClass} value={draft.name} maxLength={DRINK_LIMITS.name} onChange={(e) => set({ name: e.target.value })} />}
        </Field>
        <Field label="Hasło (krótko, na liście napojów)" error={shown.tagline}>
          {(props) => <input {...props} className={inputClass} value={draft.tagline} maxLength={DRINK_LIMITS.tagline} placeholder="np. Gorzko-cytrusowe orzeźwienie" onChange={(e) => set({ tagline: e.target.value })} />}
        </Field>
        <Field label="Opis (opcjonalnie)" error={shown.description}>
          {(props) => <textarea {...props} rows={3} className={textareaClass} value={draft.description} maxLength={DRINK_LIMITS.description} onChange={(e) => set({ description: e.target.value })} />}
        </Field>
        <fieldset className="mt-4">
          <legend className="font-medium">Temperatura</legend>
          <div className="mt-2 flex gap-2">
            <ChoiceChip type="radio" name="drink-temperature" checked={draft.temperature === 'hot'} onChange={() => set({ temperature: 'hot' })}>
              Na ciepło
            </ChoiceChip>
            <ChoiceChip type="radio" name="drink-temperature" checked={draft.temperature === 'cold'} onChange={() => set({ temperature: 'cold' })}>
              Na zimno
            </ChoiceChip>
          </div>
        </fieldset>
        <Field label="Czas przygotowania (min, razem z parzeniem)" error={shown.prepTimeMin}>
          {(props) => <input {...props} inputMode="numeric" className={`${inputClass} max-w-32`} value={draft.prepTimeMin} onChange={(e) => set({ prepTimeMin: e.target.value })} />}
        </Field>
      </Group>

      <Group title="Baza kawowa">
        <Field label="Czym zaparzyć">
          {(props) => (
            <select {...props} className={`${selectClass} mt-1 w-full`} value={draft.methodId} onChange={(e) => set({ methodId: e.target.value })}>
              {BASE_METHODS.map((method) => (
                <option key={method.id} value={method.id}>
                  {method.name}
                </option>
              ))}
            </select>
          )}
        </Field>
        <Field label="Ile kawy (ml)" error={shown.baseMl}>
          {(props) => <input {...props} inputMode="decimal" className={`${inputClass} max-w-32`} value={draft.baseMl} onChange={(e) => set({ baseMl: e.target.value })} />}
        </Field>
        <Field label="Wskazówka do bazy (opcjonalnie)" error={shown.baseNote}>
          {(props) => <input {...props} className={inputClass} value={draft.baseNote} maxLength={DRINK_LIMITS.note} placeholder="np. Zaparz mocniej, bo rozcieńczy ją lód." onChange={(e) => set({ baseNote: e.target.value })} />}
        </Field>
      </Group>

      <Group title="Mleko">
        <label className="flex min-h-11 cursor-pointer items-center gap-3">
          <input type="checkbox" className="size-5 accent-accent" checked={draft.milkOn} onChange={(e) => set({ milkOn: e.target.checked })} />
          <span className="font-medium">Napój z mlekiem</span>
        </label>
        {draft.milkOn && (
          <>
            <fieldset className="mt-3" aria-describedby={shown.milk ? 'milk-error' : undefined}>
              <legend className="font-medium">Jakie mleko (pierwsze zaznaczone jest polecane)</legend>
              <div className="mt-2 flex flex-wrap gap-2">
                {milks.map((milk) => (
                  <ChoiceChip
                    key={milk.id}
                    type="checkbox"
                    checked={draft.milkOptions.includes(milk.id)}
                    onChange={() =>
                      set({
                        milkOptions: draft.milkOptions.includes(milk.id)
                          ? draft.milkOptions.filter((id) => id !== milk.id)
                          : [...draft.milkOptions, milk.id],
                      })
                    }
                  >
                    {capitalize(milk.name)}
                  </ChoiceChip>
                ))}
              </div>
            </fieldset>
            <Field label="Ile mleka (ml)" error={shown.milk} errorId="milk-error">
              {(props) => <input {...props} inputMode="decimal" className={`${inputClass} max-w-32`} value={draft.milkMl} onChange={(e) => set({ milkMl: e.target.value })} />}
            </Field>
            <fieldset className="mt-4">
              <legend className="font-medium">Przygotowanie</legend>
              <div className="mt-2 flex flex-wrap gap-2">
                {MILK_PREPS.map((prep) => (
                  <ChoiceChip key={prep} type="radio" name="milk-prep" checked={draft.milkPrep === prep} onChange={() => set({ milkPrep: prep })}>
                    {capitalize(MILK_PREP_LABELS[prep])}
                  </ChoiceChip>
                ))}
              </div>
            </fieldset>
          </>
        )}
      </Group>

      <Group title="Dodatki" error={shown.extras}>
        <ul className="space-y-3">
          {draft.extras.map((extra) => (
            <li key={extra.key}>
              <ExtraRow
                extra={extra}
                error={shown.item[extra.key]}
                blendable={draft.milkOn && draft.milkPrep === 'blend'}
                onChange={(patch) => setItem('extras', extra.key, patch)}
                onRemove={() => removeItem('extras', extra.key)}
              />
            </li>
          ))}
        </ul>
        <AddExtra disabled={draft.extras.length >= DRINK_LIMITS.extras} onAdd={(id) => set({ extras: [...draft.extras, newExtra(id)] })} />
      </Group>

      <Group title="Naczynie">
        <fieldset>
          <legend className="sr-only">Naczynie</legend>
          <div className="grid grid-cols-4 gap-2">
            {(Object.keys(vessels) as VesselId[]).map((id) => (
              <label
                key={id}
                className="relative flex cursor-pointer flex-col items-center gap-1 rounded-2xl border border-line bg-surface p-1.5 text-center text-[11px] leading-tight has-checked:border-accent has-checked:bg-accent-soft has-focus-visible:outline-2 has-focus-visible:outline-accent"
              >
                <input type="radio" name="drink-vessel" className="sr-only" checked={draft.vessel === id} onChange={() => set({ vessel: id })} />
                <DrinkGlass drink={{ ...preview, serving: { ...preview.serving, vessel: id } }} variant="thumb" className="h-14 w-11" />
                <span>
                  {vessels[id].name} <span className="text-ink-muted">({vessels[id].capacityMl} ml)</span>
                </span>
              </label>
            ))}
          </div>
        </fieldset>
        <Field label="Dlaczego to naczynie (opcjonalnie)" error={shown.why}>
          {(props) => <input {...props} className={inputClass} value={draft.why} maxLength={DRINK_LIMITS.why} placeholder="np. W wysokiej szklance widać warstwy." onChange={(e) => set({ why: e.target.value })} />}
        </Field>
      </Group>

      <Group title="Warstwy od dołu" error={shown.layers}>
        <p className="text-sm text-ink-muted">Tak napój wygląda w szklance: pierwsza warstwa leży na dnie.</p>
        <div className="mt-3 flex flex-wrap gap-2">
          <button
            type="button"
            className={addButton}
            onClick={() => {
              setUndoLayers(draft.layers);
              set({ layers: suggestLayers(draft) });
            }}
          >
            <SparklesIcon className="size-5" />
            Podpowiedz ze składników
          </button>
          {undoLayers && (
            <button
              type="button"
              className="h-11 rounded-full px-3 text-sm font-medium text-accent"
              onClick={() => {
                set({ layers: undoLayers });
                setUndoLayers(null);
              }}
            >
              Cofnij podpowiedź
            </button>
          )}
        </div>
        <ol className="mt-3 space-y-3">
          {draft.layers.map((layer, index) => (
            <li key={layer.key}>
              <LayerRow
                layer={layer}
                number={index + 1}
                first={index === 0}
                last={index === draft.layers.length - 1}
                error={shown.item[layer.key]}
                onChange={(patch) => setItem('layers', layer.key, patch)}
                onMove={(direction) => moveItem('layers', layer.key, direction)}
                onRemove={() => removeItem('layers', layer.key)}
              />
            </li>
          ))}
        </ol>
        <button
          type="button"
          className={`mt-3 ${addButton}`}
          disabled={draft.layers.length >= DRINK_LIMITS.layers}
          onClick={() => set({ layers: [...draft.layers, { key: newKey(), name: '', kind: 'liquid', color: '#f7f1e6', ml: '50' }] })}
        >
          <PlusIcon className="size-5" />
          Dodaj warstwę na górze
        </button>
      </Group>

      <Group title="Dekoracje" error={shown.decorations}>
        <ul className="space-y-3">
          {draft.decorations.map((decoration, index) => (
            <li key={decoration.key}>
              <DecorationRow
                decoration={decoration}
                first={index === 0}
                last={index === draft.decorations.length - 1}
                error={shown.item[decoration.key]}
                onChange={(patch) => setItem('decorations', decoration.key, patch)}
                onMove={(direction) => moveItem('decorations', decoration.key, direction)}
                onRemove={() => removeItem('decorations', decoration.key)}
              />
            </li>
          ))}
        </ul>
        <button
          type="button"
          className={`mt-3 ${addButton}`}
          disabled={draft.decorations.length >= DRINK_LIMITS.decorations}
          onClick={() =>
            set({
              decorations: [
                ...draft.decorations,
                { key: newKey(), kind: 'topping', look: 'dust', name: '', color: '#5a3220', instruction: '', optional: false },
              ],
            })
          }
        >
          <PlusIcon className="size-5" />
          Dodaj dekorację
        </button>
      </Group>

      <Group title="Przygotowanie" error={shown.steps}>
        <ol className="space-y-3">
          {draft.steps.map((step, index) => (
            <li key={step.key} className={card}>
              <Field label={`Krok ${index + 1}`} error={shown.item[step.key]}>
                {(props) => (
                  <textarea {...props} rows={2} className={textareaClass} value={step.text} maxLength={DRINK_LIMITS.step} onChange={(e) => setItem('steps', step.key, { text: e.target.value })} />
                )}
              </Field>
              <ItemButtons
                label={`krok ${index + 1}`}
                first={index === 0}
                last={index === draft.steps.length - 1}
                onMove={(direction) => moveItem('steps', step.key, direction)}
                onRemove={() => removeItem('steps', step.key)}
              />
            </li>
          ))}
        </ol>
        <button
          type="button"
          className={`mt-3 ${addButton}`}
          disabled={draft.steps.length >= DRINK_LIMITS.steps}
          onClick={() => set({ steps: [...draft.steps, { key: newKey(), text: '' }] })}
        >
          <PlusIcon className="size-5" />
          Dodaj krok
        </button>
      </Group>

      <Group title="Sprzęt (opcjonalnie)" error={shown.equipment}>
        <Field label="Każda rzecz w osobnej linii">
          {(props) => <textarea {...props} rows={3} className={textareaClass} value={draft.equipment} placeholder={'shaker\nwysoka szklanka'} onChange={(e) => set({ equipment: e.target.value })} />}
        </Field>
      </Group>

      <button
        type="submit"
        className="mt-8 flex h-12 w-full items-center justify-center rounded-full bg-accent px-6 font-semibold text-on-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
      >
        {submitLabel}
      </button>

      <Sheet title={preview.name} subtitle="Podgląd" open={previewOpen} onClose={() => setPreviewOpen(false)}>
        <DrinkGlass key={JSON.stringify(preview.layers)} drink={preview} className="mx-auto w-full max-w-xs" />
        <p className="mt-2 text-center text-sm text-ink-muted">{capitalize(vessels[draft.vessel].name)}</p>
      </Sheet>
    </form>
  );
}

function Meter({ total, capacity }: { total: number; capacity: number }) {
  const over = total > capacity;
  const percent = Math.min(100, Math.round((total / capacity) * 100));
  return (
    <div>
      <p className={`text-xs font-medium tabular-nums ${over ? 'text-red-700' : 'text-ink-muted'}`}>
        Warstwy: {total} ml z {capacity} ml{over && ' (za dużo)'}
      </p>
      <div aria-hidden="true" className="mt-1 h-1.5 overflow-hidden rounded-full bg-line">
        <div className={`h-full rounded-full ${over ? 'bg-red-700' : 'bg-accent'}`} style={{ width: `${percent}%` }} />
      </div>
    </div>
  );
}

function Group({ title, error, children }: { title: string; error?: string; children: ReactNode }) {
  const id = useId();
  return (
    <section aria-labelledby={id} className="mt-8">
      <h2 id={id} className="font-display text-xl font-semibold">
        {title}
      </h2>
      {error && <p className="mt-1 text-sm font-medium text-red-700">{error}</p>}
      <div className="mt-3">{children}</div>
    </section>
  );
}

type FieldProps = {
  label: string;
  error?: string;
  errorId?: string;
  children: (props: { id: string; 'aria-invalid'?: true; 'aria-describedby'?: string }) => ReactNode;
};

function Field({ label, error, errorId, children }: FieldProps) {
  const id = useId();
  const describedBy = errorId ?? `${id}-error`;
  return (
    <div className="mt-3 first:mt-0">
      <label htmlFor={id} className="block font-medium">
        {label}
      </label>
      {children({ id, ...(error && { 'aria-invalid': true as const, 'aria-describedby': describedBy }) })}
      {error && (
        <p id={describedBy} className="mt-1 text-sm text-red-700">
          {error}
        </p>
      )}
    </div>
  );
}

type ItemButtonsProps = {
  label: string;
  first: boolean;
  last: boolean;
  onMove: (direction: -1 | 1) => void;
  onRemove: () => void;
  /** Słowa dla czytnika: „niżej”/„wyżej” dla warstw (pierwsza leży na dnie). */
  moveLabels?: [string, string];
};

function ItemButtons({ label, first, last, onMove, onRemove, moveLabels = ['w górę', 'w dół'], inline = false }: ItemButtonsProps & { inline?: boolean }) {
  return (
    <div className={`flex justify-end gap-2 ${inline ? '' : 'mt-2'}`}>
      <button type="button" className={iconButton} disabled={first} onClick={() => onMove(-1)}>
        <ChevronUpIcon className="size-5" />
        <span className="sr-only">
          Przesuń {label} {moveLabels[0]}
        </span>
      </button>
      <button type="button" className={iconButton} disabled={last} onClick={() => onMove(1)}>
        <ChevronDownIcon className="size-5" />
        <span className="sr-only">
          Przesuń {label} {moveLabels[1]}
        </span>
      </button>
      <button type="button" className={iconButton} onClick={onRemove}>
        <TrashIcon className="size-5" />
        <span className="sr-only">Usuń {label}</span>
      </button>
    </div>
  );
}

function ExtraRow({
  extra,
  error,
  blendable,
  onChange,
  onRemove,
}: {
  extra: ExtraDraft;
  error?: string;
  blendable: boolean;
  onChange: (patch: Partial<ExtraDraft>) => void;
  onRemove: () => void;
}) {
  const syrup = getSyrup(extra.ingredientId);
  const id = useId();
  return (
    <div className={card} aria-invalid={error ? true : undefined}>
      <div className="flex items-center gap-2">
        <p className="min-w-0 flex-1 font-semibold">{capitalize(syrup?.name ?? getIngredient(extra.ingredientId)?.name ?? extra.name)}</p>
        <button type="button" className={iconButton} onClick={onRemove}>
          <TrashIcon className="size-5" />
          <span className="sr-only">Usuń dodatek {syrup?.name ?? extra.name}</span>
        </button>
      </div>
      {!syrup && (
        <div className="mt-2">
          <label htmlFor={`${id}-name`} className="text-sm font-medium">
            Nazwa w przepisie<span className="sr-only"> ({getIngredient(extra.ingredientId)?.name})</span>
          </label>
          <input id={`${id}-name`} className={inputClass} value={extra.name} maxLength={DRINK_LIMITS.extraName} onChange={(e) => onChange({ name: e.target.value })} />
        </div>
      )}
      <div className="mt-2 flex flex-wrap items-end gap-2">
        <div>
          <label htmlFor={`${id}-amount`} className="block text-sm font-medium">
            Ilość
          </label>
          <input
            id={`${id}-amount`}
            inputMode={extra.unit === 'text' ? 'text' : 'decimal'}
            className={extra.unit === 'text' ? `${inputClass} mt-1` : `${smallInput} mt-1`}
            value={extra.amount}
            onChange={(e) => onChange({ amount: e.target.value })}
          />
        </div>
        {syrup ? (
          <span className="pb-3 text-sm">ml</span>
        ) : (
          <div>
            <label htmlFor={`${id}-unit`} className="block text-sm font-medium">
              Jednostka
            </label>
            <select id={`${id}-unit`} className={`${selectClass} mt-1`} value={extra.unit} onChange={(e) => onChange({ unit: e.target.value as ExtraDraft['unit'] })}>
              {AMOUNT_UNITS.map((unit) => (
                <option key={unit} value={unit}>
                  {UNIT_FORMS[unit][2]}
                </option>
              ))}
              <option value="text">opis (np. do pełna)</option>
            </select>
          </div>
        )}
      </div>
      <div className="mt-2 flex flex-wrap gap-x-4">
        <label className="flex min-h-11 cursor-pointer items-center gap-2 text-sm">
          <input type="checkbox" className="size-5 accent-accent" checked={extra.optional} onChange={(e) => onChange({ optional: e.target.checked })} />
          opcjonalnie
        </label>
        {blendable && !syrup && (
          <label className="flex min-h-11 cursor-pointer items-center gap-2 text-sm">
            <input type="checkbox" className="size-5 accent-accent" checked={extra.blended} onChange={(e) => onChange({ blended: e.target.checked })} />
            zmiksuj z mlekiem
          </label>
        )}
      </div>
      {error && <p className="mt-1 text-sm text-red-700">{error}</p>}
    </div>
  );
}

function AddExtra({ disabled, onAdd }: { disabled: boolean; onAdd: (ingredientId: string) => void }) {
  const [choice, setChoice] = useState('');
  const id = useId();
  return (
    <div className="mt-3 flex items-end gap-2">
      <div className="min-w-0 flex-1">
        <label htmlFor={id} className="block font-medium">
          Składnik do dodania
        </label>
        <select id={id} className={`${selectClass} mt-1 w-full`} value={choice} onChange={(e) => setChoice(e.target.value)}>
          <option value="">Wybierz…</option>
          {EXTRA_GROUPS.map(({ group, items }) => (
            <optgroup key={group} label={INGREDIENT_GROUP_LABELS[group]}>
              {items.map((item) => (
                <option key={item.id} value={item.id}>
                  {capitalize(item.name)}
                </option>
              ))}
            </optgroup>
          ))}
        </select>
      </div>
      <button
        type="button"
        className={addButton}
        disabled={disabled || !choice}
        onClick={() => {
          onAdd(choice);
          setChoice('');
        }}
      >
        <PlusIcon className="size-5" />
        Dodaj
      </button>
    </div>
  );
}

function LayerRow({
  layer,
  number,
  first,
  last,
  error,
  onChange,
  onMove,
  onRemove,
}: {
  layer: LayerDraft;
  number: number;
  first: boolean;
  last: boolean;
  error?: string;
  onChange: (patch: Partial<LayerDraft>) => void;
  onMove: (direction: -1 | 1) => void;
  onRemove: () => void;
}) {
  const id = useId();
  return (
    <div className={card}>
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs font-semibold text-ink-muted uppercase">
          Warstwa {number}
          {first && ' (na dnie)'}
        </p>
        <ItemButtons
          inline
          label={`warstwę ${number}`}
          first={first}
          last={last}
          onMove={onMove}
          onRemove={onRemove}
          moveLabels={['niżej', 'wyżej']}
        />
      </div>
      <div className="mt-1 flex items-end gap-2">
        <div className="min-w-0 flex-1">
          <label htmlFor={`${id}-name`} className="text-sm font-medium">
            Nazwa<span className="sr-only"> warstwy {number}</span>
          </label>
          <input id={`${id}-name`} className={inputClass} value={layer.name} maxLength={DRINK_LIMITS.layerName} placeholder="np. mleko" onChange={(e) => onChange({ name: e.target.value })} />
        </div>
        <div>
          <label htmlFor={`${id}-ml`} className="block text-sm font-medium">
            ml<span className="sr-only"> w warstwie {number}</span>
          </label>
          <input id={`${id}-ml`} inputMode="decimal" className={`${smallInput} mt-1 h-12`} value={layer.ml} onChange={(e) => onChange({ ml: e.target.value })} />
        </div>
      </div>
      <div className="mt-2 flex flex-wrap items-end gap-2">
        <div>
          <label htmlFor={`${id}-kind`} className="block text-sm font-medium">
            Rodzaj<span className="sr-only"> warstwy {number}</span>
          </label>
          <select id={`${id}-kind`} className={`${selectClass} mt-1`} value={layer.kind} onChange={(e) => onChange({ kind: e.target.value as LayerKind })}>
            {(Object.keys(LAYER_KIND_LABELS) as LayerKind[]).map((kind) => (
              <option key={kind} value={kind}>
                {LAYER_KIND_LABELS[kind]}
              </option>
            ))}
          </select>
        </div>
        <ColorPicker of={`warstwy ${number}`} value={layer.color} onChange={(color) => onChange({ color })} />
      </div>
      {error && <p className="mt-2 text-sm text-red-700">{error}</p>}
    </div>
  );
}

/**
 * Kolor: przycisk z próbką, a po rozwinięciu paleta gotowych kolorów i dowolny (natywny wybór
 * koloru). Zwinięta paleta nie wydłuża każdej karty o dwa rzędy kółek.
 */
function ColorPicker({ of, value, onChange }: { of: string; value: string; onChange: (color: string) => void }) {
  const name = useId();
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        type="button"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        className="inline-flex h-11 items-center gap-2 rounded-full border border-line bg-surface pr-4 pl-1.5 text-sm font-medium focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent aria-expanded:border-accent"
      >
        <span aria-hidden="true" className="size-8 rounded-full border border-line" style={{ backgroundColor: value }} />
        Kolor<span className="sr-only"> {of}</span>
      </button>
      {open && (
        <fieldset className="min-w-0 basis-full">
          <legend className="sr-only">Kolor {of}</legend>
          <div className="mt-1 flex flex-wrap items-center gap-1.5">
            {LAYER_COLORS.map(({ color, name: colorName }) => (
              <label
                key={color}
                className="relative flex size-10 cursor-pointer items-center justify-center rounded-full has-checked:ring-2 has-checked:ring-accent has-focus-visible:outline-2 has-focus-visible:outline-accent"
              >
                <input type="radio" name={name} className="sr-only" checked={value.toLowerCase() === color} onChange={() => onChange(color)} />
                <span aria-hidden="true" className="size-8 rounded-full border border-line" style={{ backgroundColor: color }} />
                <span className="sr-only">{colorName}</span>
              </label>
            ))}
            <label className="relative flex h-10 cursor-pointer items-center gap-1 rounded-full border border-line px-2 text-xs font-medium">
              <input
                type="color"
                className="size-7 cursor-pointer rounded-full border-0 bg-transparent p-0"
                value={value}
                onChange={(e) => onChange(e.target.value)}
              />
              inny
            </label>
          </div>
        </fieldset>
      )}
    </>
  );
}

function DecorationRow({
  decoration,
  first,
  last,
  error,
  onChange,
  onMove,
  onRemove,
}: {
  decoration: DecorationDraft;
  first: boolean;
  last: boolean;
  error?: string;
  onChange: (patch: Partial<DecorationDraft>) => void;
  onMove: (direction: -1 | 1) => void;
  onRemove: () => void;
}) {
  const id = useId();
  const looks = LOOKS_FOR[decoration.kind];
  const label = decoration.name || DECORATION_LABELS[decoration.kind];
  return (
    <div className={card}>
      <div className="flex items-center justify-between gap-2">
        <p className="min-w-0 truncate text-xs font-semibold text-ink-muted uppercase">{label}</p>
        <ItemButtons inline label={`dekorację ${label}`} first={first} last={last} onMove={onMove} onRemove={onRemove} />
      </div>
      <div className="mt-1 flex flex-wrap gap-2">
        <div className="min-w-0 flex-1">
          <label htmlFor={`${id}-kind`} className="block text-sm font-medium">
            Rodzaj
          </label>
          <select
            id={`${id}-kind`}
            className={`${selectClass} mt-1 w-full`}
            value={decoration.kind}
            onChange={(e) => {
              const kind = e.target.value as DecorationKind;
              onChange({ kind, look: LOOKS_FOR[kind][0] ?? '' });
            }}
          >
            {DECORATION_KINDS.map((kind) => (
              <option key={kind} value={kind}>
                {DECORATION_LABELS[kind]}
              </option>
            ))}
          </select>
        </div>
        {looks.length > 0 && (
          <div className="min-w-0 flex-1">
            <label htmlFor={`${id}-look`} className="block text-sm font-medium">
              Wygląd
            </label>
            <select id={`${id}-look`} className={`${selectClass} mt-1 w-full`} value={decoration.look} onChange={(e) => onChange({ look: e.target.value as DecorationDraft['look'] })}>
              {looks.map((look) => (
                <option key={look} value={look}>
                  {DECORATION_LOOK_LABELS[look]}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>
      <div className="mt-2">
        <label htmlFor={`${id}-name`} className="text-sm font-medium">
          Nazwa dekoracji
        </label>
        <input id={`${id}-name`} className={inputClass} value={decoration.name} maxLength={DRINK_LIMITS.decorationName} placeholder="np. kakao" onChange={(e) => onChange({ name: e.target.value })} />
      </div>
      <div className="mt-2 flex flex-wrap gap-2">
        <ColorPicker of={`dekoracji ${label}`} value={decoration.color} onChange={(color) => onChange({ color })} />
      </div>
      <div className="mt-2">
        <label htmlFor={`${id}-instruction`} className="text-sm font-medium">
          Jak to zrobić
        </label>
        <textarea id={`${id}-instruction`} rows={2} className={textareaClass} value={decoration.instruction} maxLength={DRINK_LIMITS.instruction} onChange={(e) => onChange({ instruction: e.target.value })} />
      </div>
      <label className="mt-1 flex min-h-11 cursor-pointer items-center gap-2 text-sm">
        <input type="checkbox" className="size-5 accent-accent" checked={decoration.optional} onChange={(e) => onChange({ optional: e.target.checked })} />
        opcjonalna
      </label>
      {error && <p className="text-sm text-red-700">{error}</p>}
    </div>
  );
}
