import { useState } from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router';
import { ChoiceChip } from '../../components/ChoiceChip';
import { PageHeader } from '../../components/PageHeader';
import { ReviewNote } from '../../components/ReviewNote';
import { Section } from '../../components/Section';
import { Sheet } from '../../components/Sheet';
import {
  COLD_BREW_HOURS,
  coldBrewVariants,
  DEFAULT_COLD_BREW_HOURS,
  drinksForMethod,
  getColdBrewVariant,
  getDrink,
  type BrewMethod,
  type BrewStep,
  type ColdBrewVariant,
} from '../../data';
import { useNow } from '../../lib/useNow';
import { formatRatio } from '../brewing/format';
import { DrinkCard } from '../drinks/DrinkCard';
import { createIcs, downloadIcs } from './ics';
import { coldBrewStore, useColdBrew, type ColdBrewRun } from './store';
import { dayAndTime, formatRemaining, isReady, progress, readyAt } from './time';

const primary =
  'flex h-12 w-full items-center justify-center rounded-full bg-accent px-6 font-semibold text-on-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent';
const secondary =
  'flex h-12 flex-1 items-center justify-center rounded-full border border-line bg-surface px-4 font-semibold focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent';

/** Kroki przed maceracją, sama maceracja i kroki po niej. */
function splitSteps(method: BrewMethod) {
  const index = method.steps.findIndex((step) => (step.durationSec ?? 0) >= 3600);
  return { before: method.steps.slice(0, index), after: method.steps.slice(index + 1) };
}

export const variantTitle = (variant: ColdBrewVariant) =>
  variant.spice ? `Cold brew ${variant.name.toLowerCase()}` : 'Cold brew';

/** Cold brew maceruje się 12–24 h: zamiast stopera zapisujemy start i pokazujemy godzinę gotowości. */
export function ColdBrewSession({ method }: { method: BrewMethod }) {
  const run = useColdBrew();
  return run ? <ColdBrewStatus method={method} run={run} /> : <ColdBrewSetup method={method} />;
}

function ColdBrewSetup({ method }: { method: BrewMethod }) {
  const [params] = useSearchParams();
  const [variantId, setVariantId] = useState(
    () => getColdBrewVariant(params.get('wariant') ?? '')?.id ?? 'klasyczne',
  );
  const [hours, setHours] = useState<number>(DEFAULT_COLD_BREW_HOURS);
  const now = useNow(60_000);
  const variant = getColdBrewVariant(variantId)!;
  const { before } = splitSteps(method);

  // Przyprawy idą do słoika razem z kawą, przed zalaniem wodą.
  const steps: BrewStep[] = variant.spice
    ? [before[0]!, { text: `Dodaj przyprawę: ${variant.spice.amount}`, detail: variant.spice.when, action: true }, ...before.slice(1)]
    : before;

  return (
    <>
      <PageHeader
        title="Cold brew"
        lead="Wybierz wariant i czas maceracji. Aplikacja zapamięta start, nawet jeśli ją zamkniesz."
        back={{ to: `/parzenie/${method.id}`, label: method.name }}
      />

      <dl className="grid grid-cols-2 gap-3">
        <Fact label="Kawa" value={`${method.dose.coffeeG} g, grubo`} />
        <Fact label="Woda" value={`${method.dose.waterMl} ml, zimna`} />
        <Fact label="Koncentrat" value={formatRatio(method)} />
        <Fact label="Do picia" value="rozcieńcz 1:1" />
      </dl>

      <fieldset className="mt-6">
        <legend className="font-display text-xl font-semibold">Wariant</legend>
        <div className="mt-3 flex flex-wrap gap-2">
          {coldBrewVariants.map((v) => (
            <ChoiceChip key={v.id} type="radio" name="variant" checked={variantId === v.id} onChange={() => setVariantId(v.id)}>
              {v.name}
            </ChoiceChip>
          ))}
        </div>
        {variant.spice && (
          <div className="mt-3 rounded-2xl bg-accent-soft p-4 text-sm">
            <p className="font-semibold">{variant.spice.amount}</p>
            <p className="mt-1">{variant.spice.when}</p>
            <p className="mt-1 text-ink-muted">{variant.spice.tip}</p>
            <ReviewNote item={variant} />
          </div>
        )}
      </fieldset>

      <fieldset className="mt-6">
        <legend className="font-display text-xl font-semibold">Czas maceracji</legend>
        <div className="mt-3 flex flex-wrap gap-2">
          {COLD_BREW_HOURS.map((h) => (
            <ChoiceChip key={h} type="radio" name="hours" checked={hours === h} onChange={() => setHours(h)}>
              {h} h
            </ChoiceChip>
          ))}
        </div>
        <p className="mt-2 text-sm text-ink-muted">
          W lodówce. 16 h to dobry początek: dłużej znaczy mocniej.
        </p>
      </fieldset>

      <Section title="Przygotuj">
        <ol className="space-y-3">
          {steps.map((step, index) => (
            <li key={step.text} className="flex gap-3">
              <span
                aria-hidden="true"
                className="flex size-7 shrink-0 items-center justify-center rounded-full bg-accent-soft text-sm font-semibold text-accent"
              >
                {index + 1}
              </span>
              <div className="pt-0.5">
                <p className="font-medium">{step.text}</p>
                {step.detail && <p className="text-sm text-ink-muted">{step.detail}</p>}
              </div>
            </li>
          ))}
        </ol>
      </Section>

      <p className="mt-8 text-center text-ink-muted">
        Jeśli zalejesz teraz, gotowe będzie{' '}
        <strong className="text-ink">{dayAndTime(readyAt(now, hours), now)}</strong>.
      </p>
      <button
        type="button"
        className={`mt-3 ${primary}`}
        onClick={() => coldBrewStore.set({ startedAt: Date.now(), hours, variantId })}
      >
        Zalane, zaczynam macerację
      </button>
    </>
  );
}

function ColdBrewStatus({ method, run }: { method: BrewMethod; run: ColdBrewRun }) {
  const now = useNow(30_000);
  const navigate = useNavigate();
  const location = useLocation();
  const [finishing, setFinishing] = useState(false);
  const [confirmStop, setConfirmStop] = useState(false);
  const variant = getColdBrewVariant(run.variantId)!;
  const ready = isReady(run.startedAt, run.hours, now);
  const at = readyAt(run.startedAt, run.hours);
  const percent = Math.round(progress(run.startedAt, run.hours, now) * 100);

  const finish = () => {
    coldBrewStore.set(null);
    navigate(`/parzenie/${method.id}`, { replace: true });
  };

  if (ready || finishing) {
    const { after } = splitSteps(method);
    const drinks = variant.drinkIds.length
      ? variant.drinkIds.map((id) => getDrink(id)!)
      : drinksForMethod(method.id);
    return (
      <>
        <PageHeader
          title={ready ? 'Cold brew gotowe!' : 'Przecedź wcześniej'}
          lead={`${variantTitle(variant)}, maceracja od ${dayAndTime(run.startedAt, now)}.`}
          back={{ to: `/parzenie/${method.id}`, label: method.name }}
        />
        <ol className="space-y-3">
          {after.map((step, index) => (
            <li key={step.text} className="flex gap-3 rounded-2xl bg-surface p-4">
              <span className="font-semibold text-accent">{index + 1}.</span>
              <div>
                <p className="font-medium">{step.text}</p>
                {step.detail && <p className="text-sm text-ink-muted">{step.detail}</p>}
              </div>
            </li>
          ))}
        </ol>
        <Section title="Co z niego zrobić">
          <ul className="space-y-3">
            {drinks.map((drink) => (
              <li key={drink.id}>
                <DrinkCard drink={drink} from={location.pathname} />
              </li>
            ))}
          </ul>
        </Section>
        <button type="button" className={`mt-8 ${primary}`} onClick={finish}>
          Zakończ
        </button>
      </>
    );
  }

  return (
    <>
      <PageHeader title={variantTitle(variant)} back={{ to: `/parzenie/${method.id}`, label: method.name }} />

      <section aria-label="Maceracja" className="rounded-3xl bg-surface p-6 text-center">
        <p className="text-sm font-medium text-ink-muted">Maceruje się w lodówce</p>
        <p className="mt-2 font-display text-3xl font-semibold text-balance">
          Gotowe ok. {dayAndTime(at, now)}
        </p>
        <div
          role="progressbar"
          aria-label="Postęp maceracji"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={percent}
          className="mt-5 h-3 overflow-hidden rounded-full bg-line"
        >
          <div className="h-full rounded-full bg-accent" style={{ width: `${percent}%` }} />
        </div>
        <p className="mt-2 text-sm text-ink-muted">
          {percent}% · zostało {formatRemaining(at - now)} · zalane {dayAndTime(run.startedAt, now)}
        </p>
      </section>

      <button
        type="button"
        className={`mt-6 ${primary}`}
        onClick={() =>
          downloadIcs(
            createIcs({
              uid: `${run.startedAt}-cold-brew@barista-companion`,
              start: at,
              durationMin: 15,
              title: `${variantTitle(variant)} gotowe: przecedź`,
              description:
                'Przecedź przez sitko, a potem przez filtr papierowy. Rozcieńcz 1:1 wodą lub mlekiem i podawaj z lodem. Koncentrat trzymaj w lodówce do 7 dni.',
              now: Date.now(),
            }),
            'cold-brew.ics',
          )
        }
      >
        Dodaj przypomnienie do kalendarza
      </button>

      <div className="mt-3 flex gap-3">
        <button type="button" className={secondary} onClick={() => setFinishing(true)}>
          Przecedź teraz
        </button>
        <button type="button" className={secondary} onClick={() => setConfirmStop(true)}>
          Przerwij
        </button>
      </div>

      <Sheet title="Przerwać cold brew?" open={confirmStop} onClose={() => setConfirmStop(false)}>
        <p className="text-ink-muted">Aplikacja zapomni o tej maceracji.</p>
        <div className="mt-5 flex gap-3">
          <button type="button" className={secondary} onClick={() => setConfirmStop(false)}>
            Anuluj
          </button>
          <button
            type="button"
            className="flex h-12 flex-1 items-center justify-center rounded-full bg-red-700 font-semibold text-white"
            onClick={finish}
          >
            Przerwij macerację
          </button>
        </div>
      </Sheet>
    </>
  );
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-line bg-surface p-3">
      <dt className="text-xs font-medium text-ink-muted">{label}</dt>
      <dd className="mt-0.5 font-semibold">{value}</dd>
    </div>
  );
}
