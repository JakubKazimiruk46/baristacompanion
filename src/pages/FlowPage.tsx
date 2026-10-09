import { useState, type ReactNode } from 'react';
import { Link, Navigate, useNavigate, useParams } from 'react-router';
import { ChoiceChip } from '../components/ChoiceChip';
import { ChevronRightIcon } from '../components/icons';
import { PageHeader } from '../components/PageHeader';
import { Section } from '../components/Section';
import {
  BEAN_KIND_LABELS,
  drinksForMethod,
  FLAVOR_NOTES,
  getDrink,
  getMethod,
  NOTE_LABELS,
  ROAST_LABELS,
  ROASTS,
  type BeanProfile,
  type FlavorNote,
  type Roast,
} from '../data';
import { BeanSummary } from '../features/beans/BeanSummary';
import { LabelScan } from '../features/beans/scan/LabelScan';
import type { LabelGuess } from '../features/beans/scan/parseLabel';
import { MethodRanking } from '../features/beans/MethodRanking';
import { useBeans } from '../features/beans/store';
import { BrewSession, doseLine } from '../features/brewing/BrewSession';
import { DoseCalculator } from '../features/brewing/DoseCalculator';
import { scaleMethod } from '../features/brewing/dose';
import { useWaterMl } from '../features/brewing/doseStore';
import { formatRatio, formatWaterTemp } from '../features/brewing/format';
import { GrindScale } from '../features/brewing/GrindScale';
import { DrinkCard } from '../features/drinks/DrinkCard';
import { DrinkFigure } from '../features/drinks/DrinkFigure';
import { DrinkIngredients } from '../features/drinks/DrinkIngredients';
import { DrinkSteps } from '../features/drinks/DrinkSteps';
import { ServingSection } from '../features/drinks/ServingSection';
import {
  afterBrewing,
  chooseMethod,
  FLOW_STEPS,
  flowProfile,
  missingStep,
  previousStep,
  STEP_TITLES,
  stepNumber,
  stepPath,
  type FlowStep,
} from '../features/flow/flow';
import { flowStore, updateFlow, useFlow } from '../features/flow/store';
import { StarRating } from '../features/journal/StarRating';
import { journalStore, useJournal } from '../features/journal/store';
import { useSyrupDialog } from '../features/syrups/SyrupSheet';
import { formatSeconds } from '../lib/format';
import { isLongBrew } from './BrewSessionPage';
import { NotFoundPage } from './NotFoundPage';

const primary =
  'flex h-12 w-full items-center justify-center gap-1 rounded-full bg-accent px-6 font-semibold text-on-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent aria-disabled:pointer-events-none aria-disabled:opacity-40';
const secondary =
  'flex h-12 w-full items-center justify-center rounded-full border border-line bg-surface px-6 font-semibold focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent';

/** Ścieżka „Mam kawę”: /mam-kawe (ziarna), /mam-kawe/metody … /mam-kawe/podanie. */
export function FlowPage() {
  const { step: param } = useParams();
  const flow = useFlow();
  const beans = useBeans();

  const step: FlowStep | null =
    param === undefined
      ? 'ziarna'
      : (FLOW_STEPS as readonly string[]).includes(param) && param !== 'ziarna'
        ? (param as FlowStep)
        : null;
  if (!step) return <NotFoundPage />;

  // Ktoś wszedł prosto na dalszy krok: cofamy do pierwszego, w którym czegoś brakuje.
  const missing = missingStep(step, flow, beans);
  if (missing) return <Navigate to={stepPath(missing)} replace />;

  switch (step) {
    case 'ziarna':
      return <BeansStep />;
    case 'metody':
      return <MethodsStep />;
    case 'metoda':
      return <MethodStep />;
    case 'napoje':
      return <DrinksStep />;
    case 'parzenie':
      return <BrewStep />;
    case 'napoj':
      return <AssembleStep />;
    case 'podanie':
      return <ServeStep />;
  }
}

function FlowHeader({ step, children }: { step: FlowStep; children?: ReactNode }) {
  const flow = useFlow();
  const prev = previousStep(step, flow);
  return (
    <PageHeader
      title={STEP_TITLES[step]}
      back={prev ? { to: stepPath(prev), label: 'Wstecz' } : { to: '/', label: 'Start' }}
    >
      <p className="mt-2 text-sm font-medium text-ink-muted">
        Mam kawę · krok {stepNumber(step)} z {FLOW_STEPS.length}
      </p>
      <div aria-hidden="true" className="mt-2 flex gap-1">
        {FLOW_STEPS.map((s, i) => (
          <span key={s} className={`h-1.5 flex-1 rounded-full ${i < stepNumber(step) ? 'bg-accent' : 'bg-line'}`} />
        ))}
      </div>
      {children}
    </PageHeader>
  );
}

function NextLink({ to, disabled, children }: { to: string; disabled?: boolean; children: ReactNode }) {
  return (
    <Link to={to} viewTransition aria-disabled={disabled || undefined} tabIndex={disabled ? -1 : undefined} className={`mt-8 ${primary}`}>
      {children}
      <ChevronRightIcon className="size-5" />
    </Link>
  );
}

// ── 1. Ziarna ───────────────────────────────────────────────────────────

function BeansStep() {
  const flow = useFlow();
  const beans = useBeans();
  const profile = flowProfile(flow, beans);
  const describing = flow.beanId === undefined;

  return (
    <>
      <FlowHeader step="ziarna" />
      {beans.length > 0 && (
        <fieldset>
          <legend className="font-display text-xl font-semibold">Twoje ziarna</legend>
          <div className="mt-3 space-y-2">
            {beans.map((bean) => (
              <label
                key={bean.id}
                className="flex cursor-pointer gap-3 rounded-2xl border border-line bg-surface p-4 has-checked:border-accent has-checked:bg-accent-soft"
              >
                <input
                  type="radio"
                  name="bean"
                  className="mt-1 accent-accent"
                  checked={flow.beanId === bean.id}
                  onChange={() => updateFlow({ beanId: bean.id })}
                />
                <span className="min-w-0">
                  <span className="block font-semibold">{bean.name}</span>
                  <span className="mt-1 block">
                    <BeanSummary profile={bean.profile} />
                  </span>
                </span>
              </label>
            ))}
            <label className="flex cursor-pointer gap-3 rounded-2xl border border-line bg-surface p-4 has-checked:border-accent has-checked:bg-accent-soft">
              <input
                type="radio"
                name="bean"
                className="accent-accent"
                checked={describing}
                onChange={() =>
                  updateFlow(({ beanId: _, ...rest }) => rest)
                }
              />
              <span className="font-semibold">Inne ziarna: opiszę je</span>
            </label>
          </div>
        </fieldset>
      )}

      {describing && <DescribeBeans initial={flow.described} />}

      <NextLink to={stepPath('metody')} disabled={!profile}>
        Dalej: polecane metody
      </NextLink>
      {!profile && <p className="mt-2 text-center text-sm text-ink-muted">Wybierz palenie, żeby przejść dalej.</p>}
    </>
  );
}

/** Szybki opis ziaren z opakowania. Zapisuje się w ścieżce, gdy wybrane jest palenie. */
function DescribeBeans({ initial }: { initial?: BeanProfile }) {
  const [roast, setRoast] = useState<Roast | undefined>(initial?.roast);
  const [notes, setNotes] = useState<FlavorNote[]>(initial?.notes ?? []);
  const [kind, setKind] = useState<BeanProfile['kind']>(initial?.kind ?? 'blend');

  const save = (next: { roast?: Roast; notes?: FlavorNote[]; kind?: BeanProfile['kind'] }) => {
    const value = { roast, notes, kind, ...next };
    if (next.roast !== undefined) setRoast(next.roast);
    if (next.notes) setNotes(next.notes);
    if (next.kind) setKind(next.kind);
    if (value.roast) {
      updateFlow({
        described: {
          roast: value.roast,
          notes: FLAVOR_NOTES.filter((n) => value.notes.includes(n)),
          kind: value.kind,
        },
      });
    }
  };

  // Skan etykiety: palenie tylko, jeśli jeszcze nie wybrane; nuty się dokładają.
  const applyScan = (guess: LabelGuess) =>
    save({
      roast: roast ?? guess.roast,
      notes: [...new Set([...notes, ...guess.notes])],
      kind: guess.kind ?? kind,
    });

  return (
    <div className="mt-6 space-y-6">
      <p className="text-ink-muted">Palenie i nuty znajdziesz na opakowaniu.</p>
      <LabelScan onResult={applyScan} />
      <fieldset>
        <legend className="font-medium">Palenie</legend>
        <div className="mt-2 flex flex-wrap gap-2">
          {ROASTS.map((value) => (
            <ChoiceChip key={value} type="radio" name="flow-roast" checked={roast === value} onChange={() => save({ roast: value })}>
              {ROAST_LABELS[value]}
            </ChoiceChip>
          ))}
        </div>
      </fieldset>
      <fieldset>
        <legend className="font-medium">Nuty smakowe</legend>
        <div className="mt-2 flex flex-wrap gap-2">
          {FLAVOR_NOTES.map((note) => (
            <ChoiceChip
              key={note}
              type="checkbox"
              checked={notes.includes(note)}
              onChange={() => save({ notes: notes.includes(note) ? notes.filter((n) => n !== note) : [...notes, note] })}
            >
              {NOTE_LABELS[note]}
            </ChoiceChip>
          ))}
        </div>
      </fieldset>
      <fieldset>
        <legend className="font-medium">Rodzaj</legend>
        <div className="mt-2 flex flex-wrap gap-2">
          {(['single-origin', 'blend'] as const).map((value) => (
            <ChoiceChip key={value} type="radio" name="flow-kind" checked={kind === value} onChange={() => save({ kind: value })}>
              {BEAN_KIND_LABELS[value]}
            </ChoiceChip>
          ))}
        </div>
      </fieldset>
    </div>
  );
}

// ── 2. Polecane metody ──────────────────────────────────────────────────

function MethodsStep() {
  const flow = useFlow();
  const beans = useBeans();
  const profile = flowProfile(flow, beans)!;

  return (
    <>
      <FlowHeader step="metody">
        <p className="mt-3 text-ink-muted">Od najlepiej pasującej do Twoich ziaren. Wybierz jedną.</p>
        <div className="mt-2">
          <BeanSummary profile={profile} />
        </div>
      </FlowHeader>
      <MethodRanking
        profile={profile}
        selectedId={flow.methodId}
        linkTo={() => stepPath('metoda')}
        onChoose={(methodId) => updateFlow((state) => chooseMethod(state, methodId))}
      />
    </>
  );
}

// ── 3. Metoda i mielenie ────────────────────────────────────────────────

function MethodStep() {
  const flow = useFlow();
  const method = getMethod(flow.methodId!)!;

  return (
    <>
      <FlowHeader step="metoda">
        <p className="mt-3 font-display text-2xl font-semibold">{method.name}</p>
      </FlowHeader>
      <GrindScale method={method} />
      <dl className="mt-4 grid grid-cols-3 gap-2 text-center">
        <div className="rounded-2xl border border-line bg-surface p-3">
          <dt className="text-xs text-ink-muted">Proporcja</dt>
          <dd className="font-semibold">{formatRatio(method)}</dd>
        </div>
        <div className="rounded-2xl border border-line bg-surface p-3">
          <dt className="text-xs text-ink-muted">Woda</dt>
          <dd className="font-semibold">{formatWaterTemp(method)}</dd>
        </div>
        <div className="rounded-2xl border border-line bg-surface p-3">
          <dt className="text-xs text-ink-muted">Czas</dt>
          <dd className="font-semibold">{formatSeconds(method.totalTimeSec)}</dd>
        </div>
      </dl>
      <p className="mt-4 text-sm">
        <span className="font-medium">Potrzebujesz: </span>
        {method.equipment.join(', ')}
      </p>
      <Section title="Ile zaparzyć">
        <DoseCalculator method={method} />
      </Section>
      <NextLink to={stepPath('napoje')}>Dalej: co z tego zrobić</NextLink>
    </>
  );
}

// ── 4. Napoje do tej metody ─────────────────────────────────────────────

function DrinksStep() {
  const flow = useFlow();
  const method = getMethod(flow.methodId!)!;
  const drinks = drinksForMethod(method.id);
  const next = stepPath('parzenie');

  const group = (title: string, temperature: 'hot' | 'cold') => {
    const list = drinks.filter((d) => d.temperature === temperature);
    return (
      <Section title={title}>
        {list.length > 0 ? (
          <ul className="space-y-3">
            {list.map((drink) => (
              <li key={drink.id} aria-current={flow.drinkId === drink.id ? 'true' : undefined}>
                <DrinkCard drink={drink} to={next} onSelect={() => updateFlow({ drinkId: drink.id })} />
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-ink-muted">Z tej metody nie ma napojów {title.toLowerCase()}.</p>
        )}
      </Section>
    );
  };

  return (
    <>
      <FlowHeader step="napoje">
        <p className="mt-3 text-ink-muted">Napoje, których bazę zaparzysz metodą: {method.name}.</p>
      </FlowHeader>
      {group('Na zimno', 'cold')}
      {group('Na ciepło', 'hot')}
      <Link
        to={next}
        onClick={() => updateFlow({ drinkId: null })}
        className="mt-8 flex h-14 items-center justify-between rounded-2xl border border-line bg-surface px-4 font-medium"
      >
        Wypiję czystą kawę, bez dodatków
        <ChevronRightIcon className="size-5 text-ink-muted" />
      </Link>
    </>
  );
}

// ── 5. Parzenie ─────────────────────────────────────────────────────────

function BrewStep() {
  const flow = useFlow();
  const navigate = useNavigate();
  const base = getMethod(flow.methodId!)!;
  const method = scaleMethod(base, useWaterMl(base));
  const drink = flow.drinkId ? getDrink(flow.drinkId) : undefined;
  const next = stepPath(afterBrewing(flow));

  const header = (
    <FlowHeader step="parzenie">
      <p className="mt-3 font-display text-2xl font-semibold">{method.name}</p>
      <p className="mt-1 text-sm text-ink-muted">{doseLine(method)}</p>
      {drink?.base.note && (
        <p className="mt-2 rounded-2xl bg-accent-soft p-3 text-sm">
          <span className="font-semibold">Do napoju „{drink.name}”: </span>
          {drink.base.note}
        </p>
      )}
      <Link to={next} className="mt-3 inline-flex h-10 items-center gap-1 text-sm font-medium text-accent">
        Pomiń: mam już zaparzoną kawę
        <ChevronRightIcon className="size-4" />
      </Link>
    </FlowHeader>
  );

  // Cold brew maceruje się kilkanaście godzin: tu tylko zaczynamy, a ścieżkę kończy się później.
  if (isLongBrew(method.steps)) {
    return (
      <>
        {header}
        <p>Cold brew maceruje się 12–24 godziny. Zacznij macerację i wróć tu, kiedy będzie gotowe.</p>
        <Link to={`/parzenie/${method.id}/start`} className={`mt-6 ${secondary}`}>
          Zacznij macerację
        </Link>
      </>
    );
  }

  return (
    <BrewSession
      key={method.id}
      method={method}
      header={header}
      journal={{ beanId: flow.beanId, drinkId: flow.drinkId ?? undefined }}
      onFinish={(entryId) => {
        updateFlow({ entryId });
        navigate(next);
      }}
    />
  );
}

// ── 6. Złóż napój ───────────────────────────────────────────────────────

function AssembleStep() {
  const flow = useFlow();
  const drink = getDrink(flow.drinkId!)!;
  const syrupDialog = useSyrupDialog();

  return (
    <>
      <FlowHeader step="napoj">
        <p className="mt-3 font-display text-2xl font-semibold">{drink.name}</p>
      </FlowHeader>
      <DrinkFigure drink={drink} />
      <Section title="Składniki">
        <DrinkIngredients drink={drink} onSyrupClick={syrupDialog.open} />
      </Section>
      <Section title="Przygotowanie">
        <DrinkSteps drink={drink} />
      </Section>
      <NextLink to={stepPath('podanie')}>Dalej: jak podać</NextLink>
      {syrupDialog.sheet}
    </>
  );
}

// ── 7. Podanie ──────────────────────────────────────────────────────────

function ServeStep() {
  const flow = useFlow();
  const navigate = useNavigate();
  const drink = flow.drinkId ? getDrink(flow.drinkId) : undefined;

  return (
    <>
      <FlowHeader step="podanie">
        {drink && <p className="mt-3 font-display text-2xl font-semibold">{drink.name}</p>}
      </FlowHeader>

      {drink ? (
        <>
          <DrinkFigure drink={drink} />
          <ServingSection drink={drink} />
        </>
      ) : (
        <div className="rounded-2xl bg-accent-soft p-4">
          <p className="font-semibold">Czysta kawa w ogrzanej filiżance</p>
          <p className="mt-1 text-sm">
            Przelej do filiżanki wrzątek, odczekaj minutę i wylej: kawa dłużej zostanie ciepła. Pij od
            razu, zanim ostygnie, a przy przelewie zwróć uwagę, jak smak zmienia się, gdy kawa stygnie.
          </p>
        </div>
      )}

      <div role="status" className="mt-8 rounded-3xl bg-surface p-6 text-center">
        <p className="font-display text-2xl font-semibold">Smacznego!</p>
        <p className="mt-1 text-ink-muted">Od ziaren do filiżanki. Następnym razem spróbuj czegoś nowego.</p>
      </div>
      <FlowRating entryId={flow.entryId} />
      <div className="mt-4 space-y-3">
        <button
          type="button"
          className={primary}
          onClick={() => {
            flowStore.set({});
            navigate(stepPath('ziarna'));
          }}
        >
          Zacznij od nowa
        </button>
        <Link to="/" className={secondary}>
          Wróć na start
        </Link>
      </div>
    </>
  );
}

/** Ocena parzenia z tej ścieżki. Wpis powstał sam po „Zakończ”; notatkę dopisuje się w dzienniku. */
function FlowRating({ entryId }: { entryId?: string }) {
  const entry = useJournal().find((e) => e.id === entryId);
  if (!entry) return null;
  return (
    <div className="mt-4 rounded-3xl bg-surface p-5">
      <StarRating
        legend="Jak wyszła kawa?"
        value={entry.rating}
        onChange={(rating) => journalStore.update(entry.id, { rating })}
      />
      <Link
        to={`/parzenie/dziennik/${entry.id}`}
        className="mt-2 inline-flex h-10 items-center gap-1 text-sm font-medium text-accent"
      >
        Dopisz notatkę w dzienniku
        <ChevronRightIcon className="size-4" />
      </Link>
    </div>
  );
}
