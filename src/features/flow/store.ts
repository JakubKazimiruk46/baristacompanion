import { FLAVOR_NOTES, ROASTS, type BeanProfile } from '../../data';
import { createLocalStore, useLocalStore } from '../../lib/localStore';
import type { FlowState } from './flow';

export const FLOW_KEY = 'barista-companion.flow.v1';

function parseProfile(value: unknown): BeanProfile | undefined {
  if (typeof value !== 'object' || value === null) return undefined;
  const p = value as Partial<BeanProfile>;
  const valid =
    ROASTS.includes(p.roast as BeanProfile['roast']) &&
    Array.isArray(p.notes) &&
    p.notes.every((note) => FLAVOR_NOTES.includes(note)) &&
    (p.kind === 'single-origin' || p.kind === 'blend');
  return valid ? (p as BeanProfile) : undefined;
}

function parseFlow(value: unknown): FlowState {
  if (typeof value !== 'object' || value === null) return {};
  const v = value as Record<string, unknown>;
  const state: FlowState = {};
  if (typeof v.beanId === 'string') state.beanId = v.beanId;
  const described = parseProfile(v.described);
  if (described) state.described = described;
  if (typeof v.methodId === 'string') state.methodId = v.methodId;
  if (typeof v.drinkId === 'string' || v.drinkId === null) state.drinkId = v.drinkId;
  if (typeof v.entryId === 'string') state.entryId = v.entryId;
  return state;
}

// sessionStorage: wybory przetrwają odświeżenie i cofanie, ale nie zostają na zawsze.
export const flowStore = createLocalStore<FlowState>(FLOW_KEY, parseFlow, {}, () => sessionStorage);

export function useFlow(): FlowState {
  return useLocalStore(flowStore);
}

export function updateFlow(patch: Partial<FlowState> | ((state: FlowState) => FlowState)) {
  const current = flowStore.getSnapshot();
  flowStore.set(typeof patch === 'function' ? patch(current) : { ...current, ...patch });
}
