import { useState, type ChangeEvent } from 'react';
import { CameraIcon } from '../../../components/icons';
import { Sheet } from '../../../components/Sheet';
import { aiEnabled } from '../../../lib/supabase';
import { useOnline } from '../../../lib/useOnline';
import { useAuth } from '../../account/auth';
import { DAILY_LABEL_SCANS, scanWithAi, setLabelScanConsent, useLabelScanConsent } from './aiScan';
import { readLabel, type ScanStage } from './ocr';
import { describeGuess, parseLabel, type LabelGuess } from './parseLabel';

type Source = 'ai' | 'phone';

type ScanState =
  | { status: 'idle' }
  | { status: 'working'; stage: ScanStage | 'ai'; percent: number }
  | { status: 'done'; summary: string; source: Source; note?: string }
  | { status: 'empty'; note?: string }
  | { status: 'error' };

const STAGE_TEXT: Record<ScanStage | 'ai', string> = {
  ai: 'AI czyta etykietę…',
  loading: 'Pobieram rozpoznawanie tekstu (tylko za pierwszym razem)…',
  reading: 'Czytam etykietę…',
};

const FALLBACK_NOTES = {
  limit: 'Dzisiejszy limit rozpoznawania przez AI się wyczerpał, więc etykietę odczytał telefon.',
  unreadable: 'AI nie odczytało tej etykiety, więc spróbował telefon.',
  error: 'AI nie odpowiedziało, więc etykietę odczytał telefon.',
} as const;

/**
 * Zdjęcie etykiety → podpowiedzi do formularza ziaren. Zalogowany online (za zgodą) dostaje
 * rozpoznawanie przez AI, a pozostali, i każdy po błędzie albo limicie, rozpoznawanie w telefonie.
 */
export function LabelScan({ onResult }: { onResult: (guess: LabelGuess) => void }) {
  const [state, setState] = useState<ScanState>({ status: 'idle' });
  const [pending, setPending] = useState<File | null>(null);
  const [askingConsent, setAskingConsent] = useState(false);
  const auth = useAuth();
  const online = useOnline();
  const consent = useLabelScanConsent();
  const aiAvailable = aiEnabled() && auth.status === 'signed-in' && online;
  const working = state.status === 'working';

  const scanOnPhone = async (file: File, note?: string) => {
    setState({ status: 'working', stage: 'loading', percent: 0 });
    try {
      const text = await readLabel(file, (stage, fraction) =>
        setState({ status: 'working', stage, percent: Math.round(fraction * 100) }),
      );
      const guess = parseLabel(text);
      const summary = describeGuess(guess);
      if (!summary) {
        setState({ status: 'empty', ...(note && { note }) });
        return;
      }
      onResult(guess);
      setState({ status: 'done', summary, source: 'phone', ...(note && { note }) });
    } catch {
      setState({ status: 'error' });
    }
  };

  const scanWithAiFirst = async (file: File) => {
    setState({ status: 'working', stage: 'ai', percent: 0 });
    const result = await scanWithAi(file);
    if (result.ok) {
      onResult(result.guess);
      setState({ status: 'done', summary: describeGuess(result.guess)!, source: 'ai' });
      return;
    }
    await scanOnPhone(file, FALLBACK_NOTES[result.reason]);
  };

  const start = (file: File, useAi: boolean) => {
    if (useAi) void scanWithAiFirst(file);
    else void scanOnPhone(file);
  };

  const scan = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    // To samo zdjęcie można wybrać jeszcze raz.
    event.target.value = '';
    if (!file) return;
    if (aiAvailable && consent === undefined) {
      // Przed pierwszym wysłaniem zdjęcia: zgoda z informacją, dokąd trafia.
      setPending(file);
      setAskingConsent(true);
      return;
    }
    start(file, aiAvailable && consent === true);
  };

  const decide = (agree: boolean) => {
    setLabelScanConsent(agree);
    setAskingConsent(false);
    if (pending) start(pending, agree);
    setPending(null);
  };

  const usesAi = aiAvailable && consent !== false;

  return (
    <div className="rounded-2xl border border-dashed border-line p-4">
      <p className="font-medium">Masz opakowanie pod ręką?</p>
      <p className="mt-1 text-sm text-ink-muted">
        Zrób zdjęcie etykiety, a uzupełnimy, co się da.{' '}
        {usesAi ? 'Odczyta ją AI (zdjęcie trafia na chwilę na serwer).' : 'Zdjęcie zostaje w telefonie.'}
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
      {aiAvailable && consent !== undefined && (
        <button
          type="button"
          className="mt-1 block h-10 text-sm font-medium text-accent underline"
          onClick={() => (consent ? setLabelScanConsent(false) : setAskingConsent(true))}
        >
          {consent ? 'Odczytuj w telefonie zamiast przez AI' : 'Odczytuj przez AI'}
        </button>
      )}

      {working && (
        <div role="status" className="mt-3 text-sm">
          <p>{STAGE_TEXT[state.stage]}</p>
          {state.stage !== 'ai' && (
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
          )}
        </div>
      )}
      {state.status === 'done' && (
        <div role="status" className="mt-3 text-sm">
          {state.note && <p className="mb-1 text-ink-muted">{state.note}</p>}
          <p>
            {state.summary} {state.source === 'ai' ? 'Odczytało AI.' : 'Odczytał telefon.'}{' '}
            <span className="font-medium">Sprawdź i popraw, zanim zapiszesz.</span>
          </p>
        </div>
      )}
      {state.status === 'empty' && (
        <div role="status" className="mt-3 text-sm">
          {state.note && <p className="mb-1 text-ink-muted">{state.note}</p>}
          <p>Nie udało się nic odczytać. Zrób zdjęcie z bliska, przy dobrym świetle, albo wpisz dane ręcznie.</p>
        </div>
      )}
      {state.status === 'error' && (
        <p role="alert" className="mt-3 text-sm">
          Nie udało się odczytać zdjęcia. Pierwszy skan potrzebuje internetu, żeby pobrać rozpoznawanie
          tekstu.
        </p>
      )}

      <Sheet
        title="Odczyt etykiety przez AI"
        open={askingConsent}
        onClose={() => {
          // Zamknięcie bez wyboru: tym razem w telefonie, a zapytamy następnym razem.
          setAskingConsent(false);
          if (pending) start(pending, false);
          setPending(null);
        }}
      >
        <p>
          AI odczytuje etykiety dokładniej niż telefon. Zdjęcie etykiety trafi na nasz serwer (Supabase, Unia
          Europejska), a stamtąd do Anthropic (dostawca modelu Claude, USA) tylko po to, żeby je odczytać. Nie
          zapisujemy zdjęcia.
        </p>
        <p className="mt-2 text-sm text-ink-muted">
          Dziennie AI odczyta do {DAILY_LABEL_SCANS} etykiet; potem robi to telefon. Zmienisz to w każdej chwili pod
          przyciskiem skanu.
        </p>
        <div className="mt-5 flex flex-col gap-3">
          <button
            type="button"
            className="flex h-12 w-full items-center justify-center rounded-full bg-accent font-semibold text-on-accent"
            onClick={() => decide(true)}
          >
            Zgadzam się, odczytaj przez AI
          </button>
          <button
            type="button"
            className="flex h-12 w-full items-center justify-center rounded-full border border-line bg-surface font-semibold"
            onClick={() => decide(false)}
          >
            Odczytaj w telefonie
          </button>
        </div>
      </Sheet>
    </div>
  );
}
