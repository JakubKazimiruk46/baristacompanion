import { Section } from '../../components/Section';
import { DECORATION_LABELS, vessels, type Decoration, type Drink } from '../../data';
import { capitalize } from '../../lib/format';

// Brzeg i wzory na ściankach robi się na pustej szklance, posypkę i owoce na końcu.
const BEFORE: Decoration['kind'][] = ['rim', 'wall-pattern'];

export function ServingSection({ drink }: { drink: Drink }) {
  const { serving } = drink;
  const vessel = vessels[serving.vessel];
  const before = serving.decorations.filter((d) => BEFORE.includes(d.kind));
  const after = serving.decorations.filter((d) => !BEFORE.includes(d.kind));

  return (
    <Section title="Jak podać" id="podanie">
      <div className="rounded-2xl bg-accent-soft p-4">
        <p className="text-xs font-semibold tracking-wide text-accent uppercase">W czym podać</p>
        <p className="mt-1 font-semibold">
          {capitalize(vessel.name)}
          {vessel.transparent && <span className="font-normal text-ink-muted">, przezroczysta</span>}
        </p>
        <p className="mt-1 text-sm">{serving.why}</p>
      </div>

      {serving.decorations.length === 0 ? (
        <p className="mt-4 text-sm text-ink-muted">
          Bez dekoracji: tu całą robotę robi naczynie i to, co w nim widać.
        </p>
      ) : (
        <>
          <DecorationGroup title="Zanim nalejesz" items={before} />
          <DecorationGroup title="Na koniec" items={after} />
        </>
      )}
    </Section>
  );
}

function DecorationGroup({ title, items }: { title: string; items: Decoration[] }) {
  if (items.length === 0) return null;
  return (
    <div className="mt-4">
      <h3 className="text-sm font-semibold text-ink-muted">{title}</h3>
      <ul className="mt-2 space-y-3">
        {items.map((decoration) => (
          <li key={decoration.name} className="flex gap-3 rounded-2xl border border-line bg-surface p-4">
            <span
              aria-hidden="true"
              className="mt-1 size-4 shrink-0 rounded-full border border-line"
              style={{ backgroundColor: decoration.color }}
            />
            <div>
              <p className="text-xs font-medium text-ink-muted">
                {capitalize(DECORATION_LABELS[decoration.kind])}
                {decoration.optional && ' · opcjonalnie'}
              </p>
              <p className="font-semibold">{capitalize(decoration.name)}</p>
              <p className="mt-1 text-sm">{decoration.instruction}</p>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
