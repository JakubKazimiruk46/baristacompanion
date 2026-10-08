import { Link, useLocation } from 'react-router';
import { ChevronRightIcon } from '../../components/icons';
import { GRIND_HINTS, GRIND_LABELS, type BrewMethod } from '../../data';
import { formatSetting, formatSettingRange } from './format';
import { useGrindSettingDialog } from './GrindSettingSheet';
import { grinderModel, useActiveGrinder } from './store';

const smallButton =
  'flex h-10 shrink-0 items-center justify-center rounded-full border border-line bg-surface px-4 text-sm font-semibold focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent';

/** Ustawienie Twojego młynka pod skalą mielenia (ekran metody, ścieżka „Mam kawę”). */
export function GrinderPanel({ method }: { method: BrewMethod }) {
  const grinder = useActiveGrinder();
  const dialog = useGrindSettingDialog(grinder);
  const location = useLocation();

  if (!grinder) {
    return (
      <div className="mt-4 border-t border-line pt-3">
        <p className="text-sm text-ink-muted">Zapisz swój młynek, a zapamiętamy ustawienie dla każdej metody.</p>
        <Link
          to="/ziarna/mlynek/nowy"
          state={{ from: location.pathname + location.search }}
          className="inline-flex h-10 items-center gap-1 font-medium text-accent"
        >
          Dodaj swój młynek
          <ChevronRightIcon className="size-5" />
        </Link>
      </div>
    );
  }

  const setting = grinder.settings[method.id];
  const model = grinderModel(grinder);
  const range = model?.grind[method.grind];

  return (
    <div className="mt-4 border-t border-line pt-4">
      <p className="text-sm text-ink-muted">
        Twój młynek: <span className="font-medium text-ink">{grinder.name}</span>
      </p>
      <div className="mt-1 flex flex-wrap items-center justify-between gap-x-3 gap-y-2">
        {setting !== undefined ? (
          <p className="text-xl font-semibold tabular-nums">{formatSetting(setting, grinder.unit)}</p>
        ) : (
          <p className="text-ink-muted">Bez zapisanego ustawienia</p>
        )}
        <button type="button" className={smallButton} onClick={() => dialog.open(method.id)}>
          <span aria-hidden="true">{setting !== undefined ? 'Zmień' : 'Zapisz ustawienie'}</span>
          <span className="sr-only">{setting !== undefined ? 'Zmień ustawienie młynka' : 'Zapisz ustawienie młynka'}</span>
        </button>
      </div>
      {model && (
        <p className="mt-1 text-sm text-ink-muted">
          {range ? (
            <>
              Podpowiedź: <span className="whitespace-nowrap">{formatSettingRange(range, grinder.unit)}</span>
            </>
          ) : (
            'Ten młynek tak drobno nie zmieli.'
          )}
        </p>
      )}
      {dialog.sheet}
    </div>
  );
}

/** Mielenie w jednym wierszu, z ustawieniem Twojego młynka (prowadzone parzenie, cold brew). */
export function GrinderLine({ method }: { method: BrewMethod }) {
  const grinder = useActiveGrinder();
  const dialog = useGrindSettingDialog(grinder);
  const setting = grinder?.settings[method.id];

  return (
    <div className="flex min-h-14 items-center justify-between gap-3 rounded-2xl border border-line bg-surface px-4 py-2">
      <p className="text-sm">
        <span className="text-ink-muted">Mielenie: </span>
        <span className="font-semibold">{GRIND_LABELS[method.grind]}</span>
        {grinder ? (
          <>
            {' · '}
            {grinder.name}:{' '}
            <span className="font-semibold whitespace-nowrap tabular-nums">
              {setting !== undefined ? formatSetting(setting, grinder.unit) : 'bez ustawienia'}
            </span>
          </>
        ) : (
          <span className="text-ink-muted">, {GRIND_HINTS[method.grind]}</span>
        )}
      </p>
      {grinder && (
        <button type="button" className={smallButton} onClick={() => dialog.open(method.id)}>
          <span aria-hidden="true">{setting !== undefined ? 'Zmień' : 'Ustaw'}</span>
          <span className="sr-only">{setting !== undefined ? 'Zmień ustawienie młynka' : 'Zapisz ustawienie młynka'}</span>
        </button>
      )}
      {dialog.sheet}
    </div>
  );
}
