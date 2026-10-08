import { drinksForMethod, getDrink, getMethod, type BeanProfile } from '../../data';
import type { SavedBean } from '../beans/store';

/** Kroki ścieżki „Mam kawę” w kolejności. */
export const FLOW_STEPS = ['ziarna', 'metody', 'metoda', 'napoje', 'parzenie', 'napoj', 'podanie'] as const;
export type FlowStep = (typeof FLOW_STEPS)[number];

export const STEP_TITLES: Record<FlowStep, string> = {
  ziarna: 'Jakie masz ziarna?',
  metody: 'Polecane metody',
  metoda: 'Metoda i mielenie',
  napoje: 'Co z tego zrobić?',
  parzenie: 'Parzenie',
  napoj: 'Złóż napój',
  podanie: 'Podanie',
};

export interface FlowState {
  /** Zapisane ziarna albo opis nowych. */
  beanId?: string;
  described?: BeanProfile;
  methodId?: string;
  /** Wybrany napój; null = czysta kawa bez dodatków. */
  drinkId?: string | null;
  /** Wpis w dzienniku z parzenia w tej ścieżce (ocena na ostatnim kroku). */
  entryId?: string;
}

export const stepPath = (step: FlowStep) => (step === 'ziarna' ? '/mam-kawe' : `/mam-kawe/${step}`);

export function stepNumber(step: FlowStep): number {
  return FLOW_STEPS.indexOf(step) + 1;
}

/** Profil ziaren: z zapisanych ziaren albo z opisu. */
export function flowProfile(state: FlowState, beans: SavedBean[]): BeanProfile | undefined {
  if (state.beanId) return beans.find((bean) => bean.id === state.beanId)?.profile;
  return state.described;
}

/** Czy krok ma wszystko, czego potrzebuje z wcześniejszych kroków. */
function ready(step: FlowStep, state: FlowState, beans: SavedBean[]): boolean {
  switch (step) {
    case 'ziarna':
      return true;
    case 'metody':
      return flowProfile(state, beans) !== undefined;
    case 'metoda':
    case 'napoje':
      return state.methodId !== undefined && getMethod(state.methodId) !== undefined;
    case 'parzenie':
    case 'podanie':
      return state.drinkId === null || (state.drinkId !== undefined && getDrink(state.drinkId) !== undefined);
    case 'napoj':
      return typeof state.drinkId === 'string' && getDrink(state.drinkId) !== undefined;
  }
}

/**
 * Pierwszy krok, którego wymagań brakuje, żeby otworzyć `target` (np. ktoś wszedł prosto
 * na /mam-kawe/napoje). null = można otwierać.
 */
export function missingStep(target: FlowStep, state: FlowState, beans: SavedBean[]): FlowStep | null {
  const index = FLOW_STEPS.indexOf(target);
  for (let i = 1; i <= index; i++) {
    const step = FLOW_STEPS[i]!;
    // Czysta kawa nie ma czego składać: krok „Złóż napój” pomijamy.
    if (step === 'napoj' && state.drinkId === null && target !== 'napoj') continue;
    if (!ready(step, state, beans)) return FLOW_STEPS[i - 1]!;
  }
  return null;
}

/** Zmiana metody kasuje wybrany napój, jeśli nie da się go zrobić tą metodą. */
export function chooseMethod(state: FlowState, methodId: string): FlowState {
  const drinkFits =
    typeof state.drinkId === 'string' && drinksForMethod(methodId).some((d) => d.id === state.drinkId);
  const { drinkId: _, ...rest } = state;
  return { ...rest, methodId, ...(drinkFits ? { drinkId: state.drinkId } : {}) };
}

/** Dokąd po parzeniu: do składania napoju albo prosto do podania czystej kawy. */
export function afterBrewing(state: FlowState): FlowStep {
  return state.drinkId ? 'napoj' : 'podanie';
}

export function previousStep(step: FlowStep, state: FlowState): FlowStep | null {
  if (step === 'podanie' && state.drinkId === null) return 'parzenie';
  const index = FLOW_STEPS.indexOf(step);
  return index > 0 ? FLOW_STEPS[index - 1]! : null;
}
