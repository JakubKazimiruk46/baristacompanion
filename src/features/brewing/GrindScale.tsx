import { GRIND_HINTS, GRIND_LABELS, GRIND_SIZES, type BrewMethod } from '../../data';
import { capitalize } from '../../lib/format';
import { GrinderPanel } from '../grinder/GrinderSetting';

/**
 * Skala mielenia od bardzo drobnego do grubego: ziarenka rosną, wybrany stopień jest wyróżniony.
 * Pod skalą ustawienie Twojego młynka dla tej metody.
 */
export function GrindScale({ method }: { method: BrewMethod }) {
  const { grind } = method;
  const active = GRIND_SIZES.indexOf(grind);

  return (
    <div className="rounded-2xl border border-line bg-surface p-4">
      <p className="text-2xl font-semibold">{capitalize(GRIND_LABELS[grind])}</p>
      <p className="text-sm text-ink-muted">{capitalize(GRIND_HINTS[grind])}</p>

      <ol aria-label="Skala mielenia" className="mt-4 grid grid-cols-6 gap-1">
        {GRIND_SIZES.map((size, index) => {
          const isActive = index === active;
          return (
            <li
              key={size}
              aria-current={isActive ? 'step' : undefined}
              className={`flex h-14 flex-col items-center justify-end gap-1 rounded-xl pb-2 ${
                isActive ? 'bg-accent text-on-accent' : 'bg-surface-muted text-ink-muted'
              }`}
            >
              <Particles level={index} />
              <span className="sr-only">{GRIND_LABELS[size]}</span>
            </li>
          );
        })}
      </ol>
      <div aria-hidden="true" className="mt-1.5 flex justify-between text-xs text-ink-muted">
        <span>bardzo drobno</span>
        <span>grubo</span>
      </div>

      <GrinderPanel method={method} />
    </div>
  );
}

/** Kilka „ziarenek” o rozmiarze zależnym od stopnia mielenia. */
function Particles({ level }: { level: number }) {
  const r = 0.8 + level * 0.75;
  const positions = level < 2 ? [-6, -2, 2, 6] : level < 4 ? [-5, 0, 5] : [-3.5, 3.5];
  return (
    <svg viewBox="-10 -6 20 12" className="h-4 w-10" aria-hidden="true">
      {positions.map((x, i) => (
        <circle key={i} cx={x} cy={i % 2 ? 1 : -1} r={r} fill="currentColor" />
      ))}
    </svg>
  );
}
