import type { ReactNode } from 'react';
import { Link, useLocation } from 'react-router';
import type { FromState } from '../../components/BackLink';
import { ChevronRightIcon } from '../../components/icons';
import { getMilk, getSyrup, MILK_PREP_LABELS, type Drink, type Extra } from '../../data';
import { capitalize } from '../../lib/format';
import { formatAmount } from './amounts';

type DrinkIngredientsProps = {
  drink: Drink;
  /** Tapnięcie syropu: okno „Kup albo zrób sam”. */
  onSyrupClick: (syrupId: string) => void;
  /** Ilości mnożą się przez liczbę porcji. */
  servings?: number;
};

/** Lista składników poza bazą kawową: mleko i dodatki. */
export function DrinkIngredients({ drink, onSyrupClick, servings = 1 }: DrinkIngredientsProps) {
  const location = useLocation();
  const from = location.pathname + location.search;
  if (!drink.milk && drink.extras.length === 0) return null;

  return (
    <ul className="divide-y divide-line rounded-2xl border border-line bg-surface">
      {drink.milk && <MilkRow drink={drink} from={from} servings={servings} />}
      {drink.extras.map((extra, index) =>
        extra.kind === 'syrup' ? (
          <SyrupRow
            key={extra.syrupId}
            extra={extra}
            servings={servings}
            onClick={() => onSyrupClick(extra.syrupId)}
          />
        ) : (
          <Row
            key={`${extra.kind}-${index}`}
            name={capitalize(extra.name) + (extra.blended ? ', do zmiksowania' : '') + optional(extra)}
            amount={formatAmount(extra.amount, servings)}
          />
        ),
      )}
    </ul>
  );
}

const optional = (extra: Extra) => (extra.optional ? ' (opcjonalnie)' : '');

function Row({ name, amount, children }: { name: string; amount: string; children?: ReactNode }) {
  return (
    <li className="px-4 py-3">
      <div className="flex items-baseline justify-between gap-4">
        <p className="min-w-0">{name}</p>
        <p className="shrink-0 text-sm font-medium text-ink-muted tabular-nums">{amount}</p>
      </div>
      {children}
    </li>
  );
}

function MilkRow({ drink, from, servings }: { drink: Drink; from: string; servings: number }) {
  const milk = drink.milk!;
  const [first, ...rest] = milk.options.map((id) => getMilk(id)!);
  const linkClass =
    'inline-flex h-9 items-center gap-0.5 rounded-full bg-accent-soft px-3 text-sm font-medium text-accent';

  return (
    <Row name={`${first!.name}, ${MILK_PREP_LABELS[milk.prep]}`} amount={`${milk.amountMl * servings} ml`}>
      {rest.length > 0 && (
        <p className="mt-0.5 text-sm text-ink-muted">albo: {rest.map((m) => m.name).join(', ')}</p>
      )}
      <div className="mt-2 flex flex-wrap gap-2">
        <Link to="/napoje/mleko" state={{ from } satisfies FromState} className={linkClass}>
          Które mleko?
          <ChevronRightIcon className="size-4" />
        </Link>
        {milk.prep === 'froth' && (
          <Link to="/napoje/spienianie" state={{ from } satisfies FromState} className={linkClass}>
            Jak spienić?
            <ChevronRightIcon className="size-4" />
          </Link>
        )}
      </div>
    </Row>
  );
}

function SyrupRow({
  extra,
  servings,
  onClick,
}: {
  extra: Extract<Extra, { kind: 'syrup' }>;
  servings: number;
  onClick: () => void;
}) {
  const syrup = getSyrup(extra.syrupId)!;
  return (
    <li>
      <button
        type="button"
        onClick={onClick}
        aria-haspopup="dialog"
        className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-surface-muted"
      >
        <span
          aria-hidden="true"
          className="size-3 shrink-0 rounded-full"
          style={{ backgroundColor: syrup.color }}
        />
        <span className="min-w-0 flex-1">
          <span className="block">{syrup.name + optional(extra)}</span>
          <span className="block text-sm font-medium text-accent">Kup albo zrób sam</span>
        </span>
        <span className="shrink-0 text-sm font-medium text-ink-muted tabular-nums">
          {extra.amountMl * servings} ml
        </span>
        <ChevronRightIcon className="size-5 shrink-0 text-ink-muted" />
      </button>
    </li>
  );
}
