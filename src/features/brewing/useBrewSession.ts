import { useEffect, useReducer, useState } from 'react';
import type { BrewMethod } from '../../data';
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
