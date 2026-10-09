import { FLAVOR_NOTES, ROASTS, type BeanProfile } from '../../data';
import { createLocalStore, useLocalStore } from '../../lib/localStore';

export interface SavedBean {
  id: string;
  name: string;
  roaster?: string;
  profile: BeanProfile;
  createdAt: number;
}

export type BeanInput = Omit<SavedBean, 'id' | 'createdAt'>;

export const STORAGE_KEY = 'barista-companion.beans.v1';

function isSavedBean(value: unknown): value is SavedBean {
  if (typeof value !== 'object' || value === null) return false;
  const bean = value as Partial<SavedBean>;
  const profile = bean.profile as Partial<BeanProfile> | undefined;
  return (
    typeof bean.id === 'string' &&
    typeof bean.name === 'string' &&
    typeof bean.createdAt === 'number' &&
    profile !== undefined &&
    ROASTS.includes(profile.roast as BeanProfile['roast']) &&
    Array.isArray(profile.notes) &&
    profile.notes.every((note) => FLAVOR_NOTES.includes(note)) &&
    (profile.kind === 'single-origin' || profile.kind === 'blend')
  );
}

// Uszkodzone wpisy pomijamy, zamiast wysypywać całą listę.
export const parseBeans = (value: unknown): SavedBean[] => (Array.isArray(value) ? value.filter(isSavedBean) : []);

const store = createLocalStore<SavedBean[]>(STORAGE_KEY, parseBeans, []);

// crypto.randomUUID działa tylko w bezpiecznym kontekście (HTTPS), a przez http na adresie
// w sieci lokalnej (test na telefonie) go nie ma.
const newId = () =>
  globalThis.crypto?.randomUUID?.() ?? `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;

export const beansStore = {
  subscribe: store.subscribe,
  getSnapshot: store.getSnapshot,
  isPersistent: store.isPersistent,
  reset: store.reset,
  add(input: BeanInput): SavedBean {
    const bean: SavedBean = { ...input, id: newId(), createdAt: Date.now() };
    store.set([bean, ...store.getSnapshot()]);
    return bean;
  },
  update(id: string, input: BeanInput) {
    store.set(store.getSnapshot().map((bean) => (bean.id === id ? { ...bean, ...input } : bean)));
  },
  remove(id: string) {
    store.set(store.getSnapshot().filter((bean) => bean.id !== id));
  },
  /** Całość naraz (synchronizacja, kopia zapasowa). */
  replaceAll: store.set,
};

/** Do testów zapisu i odczytu w izolacji. */
export function loadBeans(): { beans: SavedBean[]; ok: boolean } {
  store.reset();
  return { beans: store.getSnapshot(), ok: store.isPersistent() };
}

export function useBeans(): SavedBean[] {
  return useLocalStore(store);
}

export function useBeansPersistent(): boolean {
  useBeans();
  return store.isPersistent();
}
