import { describe, expect, it } from 'vitest';
import { getMethod } from '../../data';
import { initSession, sessionReducer, type SessionAction, type SessionState } from './session';
import { isRunning, remaining } from './timer';

const frenchPress = getMethod('prasa-francuska')!;
const T0 = 1_700_000_000_000;

const run = (state: SessionState, ...actions: SessionAction[]) => actions.reduce(sessionReducer, state);

describe('sesja parzenia', () => {
  it('zaczyna od pierwszego kroku ze stojącym stoperem', () => {
    const state = initSession(frenchPress.steps);
    expect(state.stepIndex).toBe(0);
    expect(state.timer).not.toBeNull();
    expect(isRunning(state.timer!)).toBe(false);
  });

  it('krok „tylko czekasz” rusza sam po przejściu dalej', () => {
    const state = run(
      initSession(frenchPress.steps),
      { type: 'next', now: T0 },
      { type: 'next', now: T0 },
      { type: 'next', now: T0 },
    );
    expect(state.steps[state.stepIndex]!.text).toBe('Odczekaj 4 minuty');
    expect(isRunning(state.timer!)).toBe(true);
    expect(remaining(state.timer!, T0 + 60_000)).toBe(180_000);
  });

  it('krok z działaniem czeka na start użytkownika', () => {
    const state = run(initSession(frenchPress.steps), { type: 'start', now: T0 });
    expect(isRunning(state.timer!)).toBe(true);
    const back = run(state, { type: 'next', now: T0 }, { type: 'prev' });
    expect(back.stepIndex).toBe(0);
    expect(isRunning(back.timer!)).toBe(false);
  });

  it('przechodzi wszystkie kroki i kończy', () => {
    let state = initSession(frenchPress.steps);
    for (let i = 0; i < frenchPress.steps.length; i++) state = sessionReducer(state, { type: 'next', now: T0 });
    expect(state.finished).toBe(true);
    expect(run(state, { type: 'restart' })).toEqual(initSession(frenchPress.steps));
  });

  it('reset zeruje stoper i pozwala zasygnalizować koniec ponownie', () => {
    const state = run(
      initSession(frenchPress.steps),
      { type: 'start', now: T0 },
      { type: 'alerted' },
      { type: 'reset' },
    );
    expect(state.alerted).toBe(false);
    expect(isRunning(state.timer!)).toBe(false);
  });

  it('krok bez czasu nie ma stopera', () => {
    const state = run(initSession(frenchPress.steps), { type: 'next', now: T0 });
    expect(state.timer).toBeNull();
    expect(run(state, { type: 'start', now: T0 })).toBe(state);
  });
});
