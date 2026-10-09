import { useEffect, useState } from 'react';
import {
  exactAlarmsAllowed,
  isNativeApp,
  markAsked,
  notificationPermission,
  openExactAlarmSettings,
  requestNotificationPermission,
  useNotificationsState,
} from '../lib/notifications';

type Step = 'hidden' | 'ask' | 'exact';

const primary =
  'flex h-11 flex-1 items-center justify-center rounded-full bg-accent px-4 text-sm font-semibold text-on-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent';
const secondary =
  'flex h-11 items-center justify-center rounded-full border border-line bg-surface px-4 text-sm font-semibold focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent';

/**
 * Prośba o zgodę na powiadomienia, zanim Android zapyta: najpierw wyjaśnienie, potem systemowe
 * okno. Po zgodzie: prośba o dokładny czas (Android 12+). Tylko w aplikacji natywnej. Po odmowie
 * aplikacja działa jak PWA (sygnał w aplikacji, ekran nie gaśnie).
 */
export function NotificationPrompt() {
  const { asked, exactAsked } = useNotificationsState();
  const [step, setStep] = useState<Step>('hidden');

  useEffect(() => {
    if (!isNativeApp()) return;
    let cancelled = false;
    void (async () => {
      const permission = await notificationPermission();
      let next: Step = 'hidden';
      if (permission === 'prompt' && !asked) next = 'ask';
      else if (permission === 'granted' && !exactAsked && !(await exactAlarmsAllowed())) next = 'exact';
      if (!cancelled) setStep(next);
    })();
    return () => {
      cancelled = true;
    };
  }, [asked, exactAsked]);

  if (step === 'hidden') return null;

  if (step === 'ask') {
    return (
      <section aria-labelledby="powiadomienia" className="mb-4 rounded-2xl bg-accent-soft p-4">
        <h2 id="powiadomienia" className="font-semibold">
          Powiadomienie, gdy minie czas
        </h2>
        <p className="mt-1 text-sm">
          Koniec kroku ze stoperem i gotowe cold brew przyjdą jako powiadomienie z dźwiękiem, także przy
          zablokowanym ekranie. Android zapyta o zgodę.
        </p>
        <div className="mt-3 flex gap-2">
          <button
            type="button"
            className={primary}
            onClick={async () => {
              const granted = await requestNotificationPermission();
              if (!granted) setStep('hidden');
            }}
          >
            Włącz powiadomienia
          </button>
          <button type="button" className={secondary} onClick={() => markAsked('asked')}>
            Nie teraz
          </button>
        </div>
      </section>
    );
  }

  return (
    <section aria-labelledby="dokladny-czas" className="mb-4 rounded-2xl bg-accent-soft p-4">
      <h2 id="dokladny-czas" className="font-semibold">
        Powiadomienie co do sekundy
      </h2>
      <p className="mt-1 text-sm">
        Bez zgody na dokładny czas Android przy zablokowanym ekranie może opóźnić powiadomienie nawet o kilka minut.
        Włącz „Alarmy i przypomnienia” dla Barista Companion.
      </p>
      <div className="mt-3 flex gap-2">
        <button type="button" className={primary} onClick={() => void openExactAlarmSettings()}>
          Otwórz ustawienia
        </button>
        <button type="button" className={secondary} onClick={() => markAsked('exactAsked')}>
          Nie teraz
        </button>
      </div>
    </section>
  );
}
