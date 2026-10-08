import { Link } from 'react-router';
import { ChevronRightIcon } from '../../components/icons';
import type { BeanProfile } from '../../data';
import { rankMethods, VERDICT_LABELS, type Verdict } from './matching';

const VERDICT_CLASS: Record<Verdict, string> = {
  great: 'bg-accent text-on-accent',
  good: 'bg-accent-soft text-accent',
  poor: 'bg-surface-muted text-ink-muted',
};

type MethodRankingProps = {
  profile: BeanProfile;
  /** Dokąd prowadzi wybór metody. Domyślnie: ekran metody. */
  linkTo?: (methodId: string) => string;
  /** Wywoływane przy wyborze, zanim link zmieni ekran. */
  onChoose?: (methodId: string) => void;
  selectedId?: string;
};

/** Ranking metod dla ziaren, z uzasadnieniem i linkami do metod. */
export function MethodRanking({ profile, linkTo, onChoose, selectedId }: MethodRankingProps) {
  const ranking = rankMethods(profile);
  return (
    <ol aria-label="Ranking metod" className="space-y-3">
      {ranking.map((match, index) => (
        <li
          key={match.method.id}
          aria-current={match.method.id === selectedId ? 'true' : undefined}
          className={`rounded-2xl border bg-surface p-4 ${
            match.method.id === selectedId ? 'border-2 border-accent' : index === 0 ? 'border-accent' : 'border-line'
          }`}
        >
          <div className="flex items-start justify-between gap-3">
            <Link
              to={linkTo ? linkTo(match.method.id) : `/parzenie/${match.method.id}`}
              viewTransition
              onClick={() => onChoose?.(match.method.id)}
              className="inline-flex min-h-10 items-baseline gap-1.5 pt-1 font-display text-lg leading-tight font-semibold"
            >
              <span className="text-ink-muted">{index + 1}.</span>
              <span>{match.method.name}</span>
              <ChevronRightIcon className="size-5 shrink-0 self-center text-ink-muted" />
            </Link>
            <span className={`mt-1.5 shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold ${VERDICT_CLASS[match.verdict]}`}>
              {VERDICT_LABELS[match.verdict]}
            </span>
          </div>
          <ul className="mt-1 space-y-1 text-sm">
            {match.reasons.map((reason) => (
              <li key={reason}>{reason}</li>
            ))}
          </ul>
        </li>
      ))}
    </ol>
  );
}
