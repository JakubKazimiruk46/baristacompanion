import { useEffect, useReducer, useState } from 'react';
import type { BrewMethod } from '../../data';
import {
  cancelNotification,
  NOTIFICATION_IDS,
  removeDeliveredNotification,
  scheduleNotification,
} from '../../lib/notifications';
import { initSession, sessionReducer } from './session';
import { signalStepDone, unlockAudio } from './signals';
import { isDone, isRunning, overtime, remaining } from './timer';

/** Łączy czysty reducer sesji z zegarem przeglądarki i sygnałem końca kroku. */
export function useBrewSession(method: BrewMethod) {
  const [state, dispatch] = useReducer(sessionReducer, method.steps, initSession);
  const [now, setNow] = useState(() => Date.now());
  const running = state.timer !== null && isRunning(state.timer);

  // Odświeżanie ekranu. Sam czas liczymy z Date.now(), więc dławienie interwału
  // w tle nic nie psuje, a po powrocie na kartę od razu widać właściwą wartość.
  useEffect(() => {
    if (!running) return;
    const tick = () => setNow(Date.now());
    tick();
    const id = setInterval(tick, 250);
    document.addEventListener('visibilitychange', tick);
    return () => {
      clearInterval(id);
      document.removeEventListener('visibilitychange', tick);
    };
  }, [running]);

  const done = state.timer !== null && isDone(state.timer, now);

  useEffect(() => {
    if (done && !state.alerted) {
      signalStepDone();
      dispatch({ type: 'alerted' });
    }
  }, [done, state.alerted]);

  // Aplikacja na Androida: koniec kroku jako powiadomienie, które przyjdzie też przy zablokowanym
  // ekranie. Pauza, reset, przejście do innego kroku i wyjście z ekranu je odwołują.
  const { timer } = state;
  const endAt = timer?.startedAt != null ? timer.startedAt + timer.durationMs - timer.elapsedBeforeMs : null;
  const nextText = method.steps[state.stepIndex + 1]?.text;
  useEffect(() => {
    if (endAt === null || state.alerted) return;
    void scheduleNotification({
      id: NOTIFICATION_IDS.brewStep,
      at: endAt,
      title: 'Czas minął',
      body: nextText ? `Teraz: ${nextText}` : 'Gotowe. Możesz nalewać.',
    });
    return () => void cancelNotification(NOTIFICATION_IDS.brewStep);
  }, [endAt, nextText, state.alerted]);

  // Po powrocie do aplikacji powiadomienie, które już przyszło, znika z ekranu.
  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState === 'visible') void removeDeliveredNotification(NOTIFICATION_IDS.brewStep);
    };
    document.addEventListener('visibilitychange', onVisible);
    return () => document.removeEventListener('visibilitychange', onVisible);
  }, []);

  const withGesture = (fn: () => void) => () => {
    unlockAudio();
    fn();
  };

  return {
    state,
    step: method.steps[state.stepIndex]!,
    nextStep: method.steps[state.stepIndex + 1],
    running,
    done,
    remainingMs: state.timer ? remaining(state.timer, now) : null,
    overtimeMs: state.timer ? overtime(state.timer, now) : 0,
    progress: state.timer ? 1 - remaining(state.timer, now) / state.timer.durationMs : 0,
    next: withGesture(() => dispatch({ type: 'next', now: Date.now() })),
    prev: () => dispatch({ type: 'prev' }),
    start: withGesture(() => dispatch({ type: 'start', now: Date.now() })),
    pause: () => dispatch({ type: 'pause', now: Date.now() }),
    reset: () => dispatch({ type: 'reset' }),
    restart: () => dispatch({ type: 'restart' }),
  };
}
