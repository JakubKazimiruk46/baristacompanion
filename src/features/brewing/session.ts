import type { BrewStep } from '../../data';
import { createTimer, pause, reset, start, type TimerState } from './timer';

/** Stan prowadzonego parzenia. Czysty reducer: czas przychodzi w akcjach. */
export interface SessionState {
  steps: BrewStep[];
  stepIndex: number;
  /** Stoper bieżącego kroku (tylko krok z czasem). */
  timer: TimerState | null;
  /** Czy sygnał końca kroku już zabrzmiał. */
  alerted: boolean;
  finished: boolean;
}

export type SessionAction =
  | { type: 'next'; now: number }
  | { type: 'prev' }
  | { type: 'start'; now: number }
  | { type: 'pause'; now: number }
  | { type: 'reset' }
  | { type: 'alerted' }
  | { type: 'restart' };

function enterStep(steps: BrewStep[], index: number, now: number | null): SessionState {
  const step = steps[index]!;
  let timer = step.durationSec ? createTimer(step.durationSec * 1000) : null;
  // Krok „tylko czekasz” rusza sam po przejściu dalej. Przy kroku z działaniem
  // użytkownik najpierw coś robi (zalewa, przykrywa) i sam uruchamia stoper.
  if (timer && !step.action && now !== null) timer = start(timer, now);
  return { steps, stepIndex: index, timer, alerted: false, finished: false };
}

export function initSession(steps: BrewStep[]): SessionState {
  return enterStep(steps, 0, null);
}

export function sessionReducer(state: SessionState, action: SessionAction): SessionState {
  switch (action.type) {
    case 'next':
      if (state.stepIndex >= state.steps.length - 1) return { ...state, finished: true, timer: null };
      return enterStep(state.steps, state.stepIndex + 1, action.now);
    case 'prev':
      if (state.finished) return enterStep(state.steps, state.steps.length - 1, null);
      return enterStep(state.steps, Math.max(0, state.stepIndex - 1), null);
    case 'start':
      return state.timer ? { ...state, timer: start(state.timer, action.now) } : state;
    case 'pause':
      return state.timer ? { ...state, timer: pause(state.timer, action.now) } : state;
    case 'reset':
      return state.timer ? { ...state, timer: reset(state.timer), alerted: false } : state;
    case 'alerted':
      return { ...state, alerted: true };
    case 'restart':
      return initSession(state.steps);
  }
}
