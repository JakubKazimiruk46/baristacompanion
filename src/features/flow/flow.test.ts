import { describe, expect, it } from 'vitest';
import type { BeanProfile } from '../../data';
import type { SavedBean } from '../beans/store';
import { afterBrewing, chooseMethod, flowProfile, missingStep, previousStep, stepPath, type FlowState } from './flow';

const bean: SavedBean = {
  id: 'b1',
  name: 'Kenia',
  profile: { roast: 'light', notes: ['fruity'], kind: 'single-origin' },
  createdAt: 1,
};
const described: BeanProfile = { roast: 'dark', notes: [], kind: 'blend' };

describe('ścieżka „Mam kawę”', () => {
  it('profil z zapisanych ziaren albo z opisu', () => {
    expect(flowProfile({ beanId: 'b1' }, [bean])).toEqual(bean.profile);
    expect(flowProfile({ described }, [])).toEqual(described);
    expect(flowProfile({ beanId: 'usuniete' }, [bean])).toBeUndefined();
  });

  it('wejście prosto na późny krok cofa do pierwszego brakującego', () => {
    expect(missingStep('napoje', {}, [])).toBe('ziarna');
    expect(missingStep('napoje', { described }, [])).toBe('metody');
    expect(missingStep('napoje', { described, methodId: 'drip' }, [])).toBeNull();
    expect(missingStep('podanie', { described, methodId: 'drip' }, [])).toBe('napoje');
    expect(missingStep('podanie', { described, methodId: 'drip', drinkId: 'kawa-mrozona-z-dripa' }, [])).toBeNull();
  });

  it('czysta kawa pomija składanie napoju', () => {
    const state: FlowState = { described, methodId: 'zalewajka', drinkId: null };
    expect(missingStep('podanie', state, [])).toBeNull();
    expect(missingStep('napoj', state, [])).toBe('parzenie');
    expect(afterBrewing(state)).toBe('podanie');
    expect(previousStep('podanie', state)).toBe('parzenie');
    expect(afterBrewing({ ...state, drinkId: 'mocha' })).toBe('napoj');
  });

  it('zmiana metody zostawia napój tylko wtedy, gdy da się go nią zrobić', () => {
    const state: FlowState = { described, methodId: 'kawiarka', drinkId: 'mocha' };
    expect(chooseMethod(state, 'aeropress').drinkId).toBe('mocha');
    expect(chooseMethod(state, 'drip')).toEqual({ described, methodId: 'drip' });
  });

  it('adresy kroków', () => {
    expect(stepPath('ziarna')).toBe('/mam-kawe/ziarna');
    expect(stepPath('podanie')).toBe('/mam-kawe/podanie');
    expect(previousStep('ziarna', {})).toBeNull();
    expect(previousStep('metody', {})).toBe('ziarna');
  });
});
