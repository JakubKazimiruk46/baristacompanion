import type { ReactNode } from 'react';
import { Link, useLocation, useParams } from 'react-router';
import { MethodIcon } from '../components/MethodIcon';
import { PageHeader } from '../components/PageHeader';
import { ReviewNote } from '../components/ReviewNote';
import { Section } from '../components/Section';
import {
  DIFFICULTY_LABELS,
  drinksForMethod,
  getMethod,
  NOTE_LABELS,
  ROAST_LABELS,
  ROASTS,
  type BrewMethod,
} from '../data';
import { DoseCalculator } from '../features/brewing/DoseCalculator';
import { formatGrams, scaleMethod } from '../features/brewing/dose';
import { useWaterMl } from '../features/brewing/doseStore';
import { formatRatio, formatWaterTemp } from '../features/brewing/format';
import { GrindScale } from '../features/brewing/GrindScale';
import { StepList } from '../features/brewing/StepList';
import { ColdBrewVariantsSection } from '../features/coldbrew/ColdBrewLinks';
import { useColdBrew } from '../features/coldbrew/store';
import { DrinkCard } from '../features/drinks/DrinkCard';
import { EntryCard } from '../features/journal/EntryCard';
import { useJournal } from '../features/journal/store';
import { RecipesSection } from '../features/recipes/RecipesSection';
import { formatSeconds } from '../lib/format';
import { useNow } from '../lib/useNow';
import { NotFoundPage } from './NotFoundPage';

export function MethodPage() {
  const { methodId } = useParams();
  const method = methodId ? getMethod(methodId) : undefined;
  if (!method) return <NotFoundPage />;
  return <MethodDetails key={method.id} method={method} />;
}

function MethodDetails({ method: base }: { method: BrewMethod }) {
  const location = useLocation();
  // Kroki z ilościami z kalkulatora (ostatnio wybranymi dla tej metody).
  const method = scaleMethod(base, useWaterMl(base));
  const drinks = drinksForMethod(method.id);
  const from = location.pathname + location.search;

  return (
    <article>
      <PageHeader
        title={method.name}
        lead={method.description}
        back={{ to: '/parzenie', label: 'Parzenie' }}
        icon={<MethodIcon methodId={method.id} className="size-9" />}
      >
        <ReviewNote item={method} />
      </PageHeader>

      <StartButton method={method} />

      <dl className="mt-6 grid grid-cols-2 gap-3">
        <Fact label="Proporcja" value={formatRatio(base)}>
          {formatGrams(method.dose.coffeeG)} g kawy na {method.dose.waterMl} ml wody
        </Fact>
        <Fact label="Woda" value={formatWaterTemp(method)} />
        <Fact label="Czas" value={formatSeconds(method.totalTimeSec)} />
        <Fact label="Trudność" value={DIFFICULTY_LABELS[method.difficulty]} />
      </dl>

      <Section title="Ile zaparzyć">
        <DoseCalculator method={base} />
      </Section>

      <LastBrew methodId={method.id} />

      <Section title="Mielenie">
        <GrindScale method={method} />
      </Section>

      <Section title="Sprzęt">
        <ul className="flex flex-wrap gap-2">
          {method.equipment.map((item) => (
            <li key={item} className="rounded-full bg-surface-muted px-3 py-1.5 text-sm">
              {item}
            </li>
          ))}
        </ul>
      </Section>

      <Section title="Do jakich ziaren">
        <div className="rounded-2xl border border-line bg-surface p-4">
          <ul aria-label="Palenie" className="flex gap-2">
            {ROASTS.map((roast) => {
              const fits = method.suits.roasts.includes(roast);
              return (
                <li
                  key={roast}
                  className={`rounded-full px-3 py-1 text-sm font-medium ${
                    fits ? 'bg-accent text-on-accent' : 'bg-surface-muted text-ink-muted line-through'
                  }`}
                >
                  {ROAST_LABELS[roast]}
                  <span className="sr-only">{fits ? ' (pasuje)' : ' (nie pasuje)'}</span>
                </li>
              );
            })}
          </ul>
          <p className="mt-3 text-sm text-ink-muted">
            Nuty: {method.suits.notes.map((note) => NOTE_LABELS[note]).join(', ')}
          </p>
          <p className="mt-2">{method.suits.why}</p>
        </div>
      </Section>

      <Section title="Kroki">
        <StepList steps={method.steps} />
      </Section>

      <RecipesSection method={method} />

      {isLongBrew(method) && <ColdBrewVariantsSection methodId={method.id} />}

      <Section title="Co z tego zrobić">
        {drinks.length > 0 ? (
          <ul className="space-y-3">
            {drinks.map((drink) => (
              <li key={drink.id}>
                <DrinkCard drink={drink} from={from} />
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-ink-muted">
            Tę kawę pije się po prostu tak, jak wyjdzie. Do drinków lepsza jest kawiarka albo
            AeroPress.
          </p>
        )}
      </Section>

      <div className="mt-8">
        <StartButton method={method} />
      </div>
    </article>
  );
}

const isLongBrew = (method: BrewMethod) => method.steps.some((step) => (step.durationSec ?? 0) >= 3600);

function StartButton({ method }: { method: BrewMethod }) {
  const coldBrew = useColdBrew();
  const running = isLongBrew(method) && coldBrew !== null;
  return (
    <Link
      to={`/parzenie/${method.id}/start`}
      className="flex h-12 items-center justify-center rounded-full bg-accent px-6 font-semibold text-on-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
    >
      {running ? 'Zobacz macerację' : 'Zacznij parzenie'}
    </Link>
  );
}

function Fact({ label, value, children }: { label: string; value: string; children?: ReactNode }) {
  return (
    <div className="rounded-2xl border border-line bg-surface p-3">
      <dt className="text-xs font-medium text-ink-muted">{label}</dt>
      <dd className="mt-0.5 text-lg font-semibold">{value}</dd>
      {children && <dd className="text-xs text-ink-muted">{children}</dd>}
    </div>
  );
}

/** Ostatnie parzenie tą metodą z dziennika: ocena i notatka pomagają poprawić następne. */
function LastBrew({ methodId }: { methodId: string }) {
  const entries = useJournal().filter((entry) => entry.methodId === methodId);
  const now = useNow(60_000);
  const last = entries[0];
  if (!last) return null;
  return (
    <Section
      title="Ostatnio"
      action={
        <Link to="/parzenie/dziennik" className="text-sm font-medium text-accent">
          Dziennik
        </Link>
      }
    >
      <EntryCard entry={last} now={now} heading="h3" />
    </Section>
  );
}
