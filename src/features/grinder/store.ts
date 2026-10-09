import { getGrinderModel, getMethod, GRINDER_UNITS, type GrinderModel, type GrinderUnit } from '../../data';
import { createLocalStore, useLocalStore } from '../../lib/localStore';

/** Młynek użytkownika: model z listy (z podpowiedziami) albo własny. */
export interface SavedGrinder {
  id: string;
  /** Model z src/data/grinders.ts. Brak: własny młynek bez podpowiedzi. */
  modelId?: string;
  name: string;
  unit: GrinderUnit;
  /** Ustawienie dla każdej metody: id metody → wartość na skali młynka. */
  settings: Record<string, number>;
  createdAt: number;
}

export interface GrindersState {
  grinders: SavedGrinder[];
  /** Młynek, którego używasz: jego ustawienie widać przy skali mielenia. */
  activeId: string | null;
}

export type GrinderInput = Pick<SavedGrinder, 'modelId' | 'name' | 'unit'>;

/** Ustawienie młynka zapisane przy parzeniu (dziennik, cold brew). Nazwa zostaje po usunięciu młynka. */
export interface GrindRecord {
  grinderId: string;
  grinderName: string;
  unit: GrinderUnit;
  setting: number;
}

export const GRINDERS_KEY = 'barista-companion.grinders.v1';

/** Własny młynek nie ma skali, więc pilnujemy tylko rozsądnych granic. */
export const SETTING_LIMITS = { min: 0, max: 999 };

export const MAX_NAME_LENGTH = 60;

const EMPTY: GrindersState = { grinders: [], activeId: null };

export const isSettingValue = (value: unknown): value is number =>
  typeof value === 'number' && Number.isFinite(value) && value >= SETTING_LIMITS.min && value <= SETTING_LIMITS.max;

const isUnit = (value: unknown): value is GrinderUnit => (GRINDER_UNITS as readonly unknown[]).includes(value);

export function isGrindRecord(value: unknown): value is GrindRecord {
  if (typeof value !== 'object' || value === null) return false;
  const r = value as Record<string, unknown>;
  return (
    typeof r.grinderId === 'string' &&
    typeof r.grinderName === 'string' &&
    isUnit(r.unit) &&
    isSettingValue(r.setting)
  );
}

function parseGrinder(value: unknown): SavedGrinder | null {
  if (typeof value !== 'object' || value === null) return null;
  const g = value as Record<string, unknown>;
  if (
    typeof g.id !== 'string' ||
    typeof g.name !== 'string' ||
    !g.name.trim() ||
    !isUnit(g.unit) ||
    typeof g.createdAt !== 'number'
  ) {
    return null;
  }
  const rawSettings = typeof g.settings === 'object' && g.settings !== null ? g.settings : {};
  // Ustawienia dla nieistniejących metod i błędne liczby pomijamy, a młynek zostaje.
  const settings = Object.fromEntries(
    Object.entries(rawSettings).filter(([methodId, setting]) => getMethod(methodId) && isSettingValue(setting)),
  ) as Record<string, number>;
  // Model zniknął z listy: zostaje własny młynek z tą samą nazwą i jednostką.
  const model = typeof g.modelId === 'string' ? getGrinderModel(g.modelId) : undefined;
  return {
    id: g.id,
    ...(model && model.unit === g.unit && { modelId: model.id }),
    name: g.name,
    unit: g.unit,
    settings,
    createdAt: g.createdAt,
  };
}

/** Wskazany młynek musi istnieć. Inaczej używany jest pierwszy z listy. */
function normalize(grinders: SavedGrinder[], activeId: unknown): GrindersState {
  const active = grinders.find((g) => g.id === activeId) ?? grinders[0];
  return { grinders, activeId: active?.id ?? null };
}

export function parseGrinders(value: unknown): GrindersState {
  if (typeof value !== 'object' || value === null) return EMPTY;
  const state = value as Record<string, unknown>;
  const grinders = Array.isArray(state.grinders)
    ? state.grinders.map(parseGrinder).filter((g): g is SavedGrinder => g !== null)
    : [];
  return normalize(grinders, state.activeId);
}

const store = createLocalStore<GrindersState>(GRINDERS_KEY, parseGrinders, EMPTY);

// crypto.randomUUID działa tylko przez HTTPS (patrz beans/store.ts).
const newId = () =>
  globalThis.crypto?.randomUUID?.() ?? `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;

function updateGrinder(id: string, change: (grinder: SavedGrinder) => SavedGrinder) {
  const state = store.getSnapshot();
  store.set({ ...state, grinders: state.grinders.map((g) => (g.id === id ? change(g) : g)) });
}

export const grindersStore = {
  subscribe: store.subscribe,
  getSnapshot: store.getSnapshot,
  isPersistent: store.isPersistent,
  reset: store.reset,
  /** Nowy młynek od razu staje się używanym. */
  add(input: GrinderInput): SavedGrinder {
    const grinder: SavedGrinder = {
      id: newId(),
      ...(input.modelId && { modelId: input.modelId }),
      name: input.name.trim(),
      unit: input.unit,
      settings: {},
      createdAt: Date.now(),
    };
    store.set({ grinders: [...store.getSnapshot().grinders, grinder], activeId: grinder.id });
    return grinder;
  },
  rename(id: string, name: string) {
    updateGrinder(id, (g) => ({ ...g, name: name.trim() }));
  },
  remove(id: string) {
    const state = store.getSnapshot();
    store.set(normalize(state.grinders.filter((g) => g.id !== id), state.activeId));
  },
  setActive(id: string) {
    store.set(normalize(store.getSnapshot().grinders, id));
  },
  /** null usuwa ustawienie dla metody. */
  setSetting(id: string, methodId: string, value: number | null) {
    updateGrinder(id, (g) => {
      const { [methodId]: _, ...rest } = g.settings;
      return { ...g, settings: value === null ? rest : { ...g.settings, [methodId]: value } };
    });
  },
  /**
   * „Zaparz tak samo”: ustawienie z dziennika wraca do młynka, a młynek staje się używanym.
   * false: tego młynka już nie ma.
   */
  restore(record: GrindRecord, methodId: string): boolean {
    if (!store.getSnapshot().grinders.some((g) => g.id === record.grinderId)) return false;
    grindersStore.setSetting(record.grinderId, methodId, record.setting);
    grindersStore.setActive(record.grinderId);
    return true;
  },
  /** Całość naraz (synchronizacja, kopia zapasowa). */
  replaceAll: store.set,
};

export function activeGrinder(state: GrindersState): SavedGrinder | null {
  return state.grinders.find((g) => g.id === state.activeId) ?? null;
}

export function grinderModel(grinder: SavedGrinder): GrinderModel | undefined {
  return grinder.modelId ? getGrinderModel(grinder.modelId) : undefined;
}

/** Ustawienie używanego młynka dla metody, do zapisania przy parzeniu. Brak: nie ma czego zapisać. */
export function grindRecordFor(state: GrindersState, methodId: string): GrindRecord | undefined {
  const grinder = activeGrinder(state);
  const setting = grinder?.settings[methodId];
  if (!grinder || setting === undefined) return undefined;
  return { grinderId: grinder.id, grinderName: grinder.name, unit: grinder.unit, setting };
}

export function useGrinders(): GrindersState {
  return useLocalStore(store);
}

export function useActiveGrinder(): SavedGrinder | null {
  return activeGrinder(useGrinders());
}
