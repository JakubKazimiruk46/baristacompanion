import { Link } from 'react-router';
import { ChevronRightIcon, LeafIcon, SyrupIcon } from '../components/icons';
import { PageHeader } from '../components/PageHeader';
import { ReviewNote } from '../components/ReviewNote';
import { Section } from '../components/Section';
import { FROTH_LABELS, milks, type Milk } from '../data';

const frothsWell = (milk: Milk) => milk.frothing === 'great' || milk.frothing === 'good';

export function MilkPage() {
  return (
    <>
      <PageHeader
        title="Mleko"
        lead="Które mleko dobrze się pieni, które jest smakowe i czym je zastąpić."
        back={{ to: '/napoje', label: 'Napoje' }}
      />

      <aside className="rounded-2xl bg-accent-soft p-4">
        <p className="flex items-center gap-2 font-semibold">
          <SyrupIcon className="size-5 text-accent" />
          Mleko smakowe? Zwykłe plus syrop
        </p>
        <p className="mt-1 text-sm">
          Zamiast kupować mleko waniliowe czy karmelowe, dodaj do zwykłego 10–15 ml syropu na porcję.
          Sam decydujesz o słodyczy, a syrop zrobisz w domu w kwadrans.
        </p>
        <Link
          to="/napoje/syropy"
          className="mt-2 inline-flex h-10 items-center gap-1 font-medium text-accent"
        >
          Syropy domowe
          <ChevronRightIcon className="size-5" />
        </Link>
      </aside>

      <Section title="Dobrze się pienią">
        <MilkList items={milks.filter(frothsWell)} />
      </Section>

      <Section title="Słabo albo wcale">
        <MilkList items={milks.filter((milk) => !frothsWell(milk))} />
      </Section>

      <Link
        to="/napoje/spienianie"
        className="mt-8 flex h-14 items-center justify-between rounded-2xl border border-line bg-surface px-4 font-medium"
      >
        Jak spienić mleko
        <ChevronRightIcon className="size-5 text-ink-muted" />
      </Link>
    </>
  );
}

function MilkList({ items }: { items: Milk[] }) {
  return (
    <ul className="space-y-3">
      {items.map((milk) => (
        <li key={milk.id} className="rounded-2xl border border-line bg-surface p-4">
          <div className="flex items-start gap-3">
            <span
              aria-hidden="true"
              className="mt-1 size-4 shrink-0 rounded-full border border-line"
              style={{ backgroundColor: milk.color }}
            />
            <div className="min-w-0">
              <h3 className="font-semibold">{milk.name}</h3>
              <ul className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-xs font-medium text-ink-muted">
                <li>{FROTH_LABELS[milk.frothing]}</li>
                {milk.plantBased && (
                  <li className="inline-flex items-center gap-1">
                    <LeafIcon className="size-3.5" />
                    roślinne
                  </li>
                )}
                {milk.flavored && <li>smakowe</li>}
              </ul>
              <p className="mt-2 text-sm">{milk.note}</p>
              <ReviewNote item={milk} />
            </div>
          </div>
        </li>
      ))}
    </ul>
  );
}
