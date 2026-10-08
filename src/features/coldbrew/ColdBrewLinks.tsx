import { Link } from 'react-router';
import { ChevronRightIcon } from '../../components/icons';
import { Section } from '../../components/Section';
import { coldBrewVariants, getDrink } from '../../data';
import { useNow } from '../../lib/useNow';
import { useColdBrew } from './store';
import { dayAndTime, isReady, readyAt } from './time';

/** Na ekranie metody: warianty z przyprawami, każdy z napojem i startem maceracji. */
export function ColdBrewVariantsSection({ methodId }: { methodId: string }) {
  return (
    <Section title="Warianty z przyprawami">
      <ul className="space-y-3">
        {coldBrewVariants
          .filter((variant) => variant.spice)
          .map((variant) => (
            <li key={variant.id} className="rounded-2xl border border-line bg-surface p-4">
              <h3 className="font-semibold">{variant.name}</h3>
              <p className="mt-1 text-sm">{variant.spice!.amount}</p>
              <p className="text-sm text-ink-muted">{variant.spice!.when}</p>
              <div className="mt-3 flex flex-wrap gap-2">
                <Link
                  to={`/parzenie/${methodId}/start?wariant=${variant.id}`}
                  className="inline-flex h-10 items-center rounded-full bg-accent px-4 text-sm font-semibold text-on-accent"
                >
                  Zacznij: {variant.name.toLowerCase()}
                </Link>
                {variant.drinkIds.map((id) => (
                  <Link
                    key={id}
                    to={`/napoje/${id}`}
                    className="inline-flex h-10 items-center gap-1 rounded-full bg-accent-soft px-4 text-sm font-medium text-accent"
                  >
                    {getDrink(id)!.name}
                    <ChevronRightIcon className="size-4" />
                  </Link>
                ))}
              </div>
            </li>
          ))}
      </ul>
    </Section>
  );
}

/**
 * Status rozpoczętego cold brew (np. na liście metod). Nic, jeśli nic się nie maceruje.
 * Z `link` cały status prowadzi do ekranu maceracji.
 */
export function ColdBrewBadge({ link = false }: { link?: boolean }) {
  const run = useColdBrew();
  const now = useNow(60_000);
  if (!run) return null;
  const ready = isReady(run.startedAt, run.hours, now);
  const text = ready
    ? 'Cold brew gotowe do przecedzenia'
    : `Cold brew maceruje się, gotowe ${dayAndTime(readyAt(run.startedAt, run.hours), now)}`;
  const className = 'mt-2 inline-flex rounded-full bg-accent px-3 py-1 text-xs font-semibold text-on-accent';
  return link ? (
    <Link to="/parzenie/cold-brew/start" className={`${className} min-h-8 items-center`}>
      {text}
    </Link>
  ) : (
    <p className={className}>{text}</p>
  );
}

/** Na ekranie napoju z cold brew: start maceracji od razu z właściwą przyprawą. */
export function ColdBrewDrinkLink({ drinkId }: { drinkId: string }) {
  const variant = coldBrewVariants.find((v) => v.drinkIds.includes(drinkId));
  if (!variant) return null;
  return (
    <Link
      to={`/parzenie/cold-brew/start?wariant=${variant.id}`}
      className="mt-2 flex h-11 items-center justify-between rounded-xl bg-surface px-3 font-medium text-accent"
    >
      Zacznij macerację: {variant.name.toLowerCase()}
      <ChevronRightIcon className="size-5" />
    </Link>
  );
}
