import { baseMethodIds, drinksForMethod, getMethod, type BeanProfile, type Drink } from '../../data';
import { findDrink } from '../assistant/myDrinks';
import type { SavedBean } from '../beans/store';

/** Menu „Mam kawę”: do spróbowania, zaskocz mnie, wybiorę sam. */
export const MENU_PATH = '/mam-kawe';

/** Kroki ścieżki „Mam kawę” w kolejności („Wybiorę sam”: od ziaren). */
export const FLOW_STEPS = ['ziarna', 'metody', 'metoda', 'napoje', 'parzenie', 'napoj', 'podanie'] as const;
export type FlowStep = (typeof FLOW_STEPS)[number];

/** Ścieżka od wybranego napoju: napój wyznacza metodę, więc ziaren i rankingu metod nie ma. */
export const DRINK_STEPS: readonly FlowStep[] = ['metoda', 'parzenie', 'napoj', 'podanie'];

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
  /** Ścieżka od napoju: z listy „Do spróbowania” albo z „Zaskocz mnie”. Brak: od ziaren. */
  start?: 'wishlist' | 'surprise';
  /** Zapisane ziarna albo opis nowych. */
  beanId?: string;
  described?: BeanProfile;
  methodId?: string;
  /** Wybrany napój; null = czysta kawa bez dodatków. */
  drinkId?: string | null;
  /** Wpis w dzienniku z parzenia w tej ścieżce (ocena na ostatnim kroku). */
  entryId?: string;
}

export const stepPath = (step: FlowStep) => `/mam-kawe/${step}`;

export const isDrinkFirst = (state: FlowState) => state.start !== undefined;

/** Kroki tej ścieżki: od ziaren albo od napoju. */
export function flowSteps(state: FlowState): readonly FlowStep[] {
  return isDrinkFirst(state) ? DRINK_STEPS : FLOW_STEPS;
}

export function stepNumber(step: FlowStep, state: FlowState = {}): number {
  return flowSteps(state).indexOf(step) + 1;
}

/** Ścieżka od napoju: jego metoda bazy i on sam. */
export function startFromDrink(drink: Drink, start: NonNullable<FlowState['start']>): FlowState {
  return { start, drinkId: drink.id, methodId: drink.base.methodId };
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
      return state.drinkId === null || (state.drinkId !== undefined && findDrink(state.drinkId) !== undefined);
    case 'napoj':
      return typeof state.drinkId === 'string' && findDrink(state.drinkId) !== undefined;
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

/**
 * Dokąd przekierować zamiast otwierać `target`. Ścieżka od napoju bez napoju (np. usunięty
 * „Mój napój”) wraca do menu, a kroki spoza niej prowadzą do jej pierwszego kroku.
 */
export function flowRedirect(target: FlowStep, state: FlowState, beans: SavedBean[]): string | null {
  if (isDrinkFirst(state)) {
    if (!ready('metoda', state, beans) || !ready('napoj', state, beans)) return MENU_PATH;
    return DRINK_STEPS.includes(target) ? null : stepPath(DRINK_STEPS[0]!);
  }
  const missing = missingStep(target, state, beans);
  return missing ? stepPath(missing) : null;
}

/** Zmiana metody kasuje wybrany napój, jeśli nie da się go zrobić tą metodą. */
export function chooseMethod(state: FlowState, methodId: string): FlowState {
  const drinkFits =
    typeof state.drinkId === 'string' && drinksForMethod(methodId).some((d) => d.id === state.drinkId);
  const { drinkId: _, ...rest } = state;
  return { ...rest, methodId, ...(drinkFits ? { drinkId: state.drinkId } : {}) };
}

/** Metody, którymi da się zaparzyć bazę napoju w ścieżce od napoju (tylko te ze sprzętem w danych). */
export function baseMethodsFor(drink: Drink) {
  return baseMethodIds(drink).flatMap((id) => getMethod(id) ?? []);
}

/** Dokąd po parzeniu: do składania napoju albo prosto do podania czystej kawy. */
export function afterBrewing(state: FlowState): FlowStep {
  return state.drinkId ? 'napoj' : 'podanie';
}

export function previousStep(step: FlowStep, state: FlowState): FlowStep | null {
  if (step === 'podanie' && state.drinkId === null) return 'parzenie';
  const steps = flowSteps(state);
  const index = steps.indexOf(step);
  return index > 0 ? steps[index - 1]! : null;
}

/** Skąd przyszła ścieżka: tu prowadzi „wstecz” z pierwszego kroku. */
export function flowEntryPath(state: FlowState): string {
  if (state.start === 'wishlist') return '/mam-kawe/do-sprobowania';
  if (state.start === 'surprise' && state.drinkId) return `/mam-kawe/zaskocz?napoj=${state.drinkId}`;
  return MENU_PATH;
}
