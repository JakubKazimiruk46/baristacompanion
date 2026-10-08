import { ClockIcon } from '../components/icons';
import { PageHeader } from '../components/PageHeader';
import { ReviewNote } from '../components/ReviewNote';
import { Section } from '../components/Section';
import { FROTHING_KIND_LABELS, frothingMethods, frothingSummary } from '../data';
import { formatSeconds } from '../lib/format';

export function FrothingPage() {
  return (
    <>
      <PageHeader
        title="Spienianie mleka"
        lead="Ręcznie, spieniaczem ręcznym albo elektrycznym. Krok po kroku."
        back={{ to: '/napoje', label: 'Napoje' }}
      />

      <aside className="space-y-3 rounded-2xl bg-accent-soft p-4 text-sm">
        <div>
          <p className="font-semibold">Czy metoda ma znaczenie?</p>
          <p className="mt-1">{frothingSummary.text}</p>
          <ReviewNote item={frothingSummary} />
        </div>
        <div>
          <p className="font-semibold">Temperatura: 55–65°C</p>
          <p className="mt-1">
            Bez termometru: dzbanek jest gorący, ale da się go utrzymać w dłoni przez kilka sekund.
            Gotowane mleko traci słodycz, a pianka szybko opada.
          </p>
        </div>
      </aside>

      {frothingMethods.map((method) => (
        <Section key={method.id} id={method.id} title={method.name}>
          <article className="rounded-2xl border border-line bg-surface p-4">
            <ul className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-ink-muted">
              <li className="font-medium text-accent">{FROTHING_KIND_LABELS[method.kind]}</li>
              <li>
                mleko {method.milkTempC.min}–{method.milkTempC.max}°C
              </li>
              <li className="inline-flex items-center gap-1">
                <ClockIcon className="size-4" />
                {formatSeconds(method.timeSec)}
              </li>
            </ul>
            <p className="mt-3 text-sm">
              <span className="font-medium">Potrzebujesz: </span>
              {method.equipment.join(', ')}
            </p>
            <ol className="mt-3 space-y-2">
              {method.steps.map((step, index) => (
                <li key={step} className="flex gap-3">
                  <span
                    aria-hidden="true"
                    className="flex size-6 shrink-0 items-center justify-center rounded-full bg-accent-soft text-xs font-semibold text-accent"
                  >
                    {index + 1}
                  </span>
                  <span>{step}</span>
                </li>
              ))}
            </ol>
            <p className="mt-3 rounded-xl bg-surface-muted px-3 py-2 text-sm">
              <span className="font-semibold">Efekt: </span>
              {method.result}
            </p>
            {method.tip && <p className="mt-2 text-sm text-ink-muted">{method.tip}</p>}
            <ReviewNote item={method} />
          </article>
        </Section>
      ))}
    </>
  );
}
