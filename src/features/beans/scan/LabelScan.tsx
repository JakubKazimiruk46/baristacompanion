import { useState, type ChangeEvent } from 'react';
import { CameraIcon } from '../../../components/icons';
import { readLabel, type ScanStage } from './ocr';
import { describeGuess, parseLabel, type LabelGuess } from './parseLabel';

type ScanState =
  | { status: 'idle' }
  | { status: 'working'; stage: ScanStage; percent: number }
  | { status: 'done'; summary: string }
  | { status: 'empty' }
  | { status: 'error' };

const STAGE_TEXT: Record<ScanStage, string> = {
  loading: 'Pobieram rozpoznawanie tekstu (tylko za pierwszym razem)…',
  reading: 'Czytam etykietę…',
};

/** Zdjęcie etykiety → podpowiedzi do formularza ziaren. Zdjęcie nie opuszcza telefonu. */
export function LabelScan({ onResult }: { onResult: (guess: LabelGuess) => void }) {
  const [state, setState] = useState<ScanState>({ status: 'idle' });
  const working = state.status === 'working';

  const scan = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    // To samo zdjęcie można wybrać jeszcze raz.
    event.target.value = '';
    if (!file) return;
    setState({ status: 'working', stage: 'loading', percent: 0 });
    try {
      const text = await readLabel(file, (stage, fraction) =>
        setState({ status: 'working', stage, percent: Math.round(fraction * 100) }),
      );
      const guess = parseLabel(text);
      const summary = describeGuess(guess);
      if (!summary) {
        setState({ status: 'empty' });
        return;
      }
      onResult(guess);
      setState({ status: 'done', summary });
    } catch {
      setState({ status: 'error' });
    }
  };

  return (
    <div className="rounded-2xl border border-dashed border-line p-4">
      <p className="font-medium">Masz opakowanie pod ręką?</p>
      <p className="mt-1 text-sm text-ink-muted">
        Zrób zdjęcie etykiety, a uzupełnimy, co się da. Zdjęcie zostaje w telefonie.
      </p>
      <label
        className={`mt-3 inline-flex h-11 cursor-pointer items-center gap-2 rounded-full bg-accent-soft px-4 font-semibold text-accent has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-accent ${working ? 'pointer-events-none opacity-60' : ''}`}
      >
        <CameraIcon className="size-5" />
        Zeskanuj etykietę
        <input
          type="file"
          accept="image/*"
          capture="environment"
          className="sr-only"
          disabled={working}
          onChange={scan}
        />
      </label>

      {working && (
        <div role="status" className="mt-3 text-sm">
          <p>{STAGE_TEXT[state.stage]}</p>
          <div
            role="progressbar"
            aria-label="Postęp odczytu"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={state.percent}
            className="mt-2 h-2 overflow-hidden rounded-full bg-line"
          >
            <div className="h-full rounded-full bg-accent" style={{ width: `${state.percent}%` }} />
          </div>
        </div>
      )}
      {state.status === 'done' && (
        <p role="status" className="mt-3 text-sm">
          {state.summary} <span className="font-medium">Sprawdź i popraw, zanim zapiszesz.</span>
        </p>
      )}
      {state.status === 'empty' && (
        <p role="status" className="mt-3 text-sm">
          Nie udało się nic odczytać. Zrób zdjęcie z bliska, przy dobrym świetle, albo wpisz dane ręcznie.
        </p>
      )}
      {state.status === 'error' && (
        <p role="alert" className="mt-3 text-sm">
          Nie udało się odczytać zdjęcia. Pierwszy skan potrzebuje internetu, żeby pobrać rozpoznawanie
          tekstu.
        </p>
      )}
    </div>
  );
}
