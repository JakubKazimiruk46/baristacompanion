import { createLocalStore } from '../../lib/localStore';
import { collections, type Collection } from './collections';
import { changedAt, COLLECTIONS, isDeleted, sameData, type CollectionName, type SyncRecord } from './records';

/**
 * Metadane synchronizacji na urządzeniu: dla każdego rekordu czas ostatniej zmiany, znacznik
 * usunięcia i czy zmiana czeka na wysłanie. Magazyny (ziarna, dziennik…) zostają bez zmian,
 * a metadane uzupełnia samo śledzenie zmian: każda zmiana magazynu to nowy czas rekordu.
 */
interface MetaEntry {
  /** updatedAt */
  u: number;
  /** deletedAt */
  d?: number;
  /** 1: zmiana z tego urządzenia, jeszcze niewysłana. */
  x?: 1;
}

type CollectionMeta = Record<string, MetaEntry>;

export interface SyncLocalState {
  /** Konto, z którym ostatnio synchronizowano. Inne konto: pierwsza synchronizacja od nowa. */
  userId: string | null;
  /** synced_at ostatniego pobranego rekordu z serwera (ISO). */
  cursor: string | null;
  lastSyncAt: number | null;
  meta: Partial<Record<CollectionName, CollectionMeta>>;
}

export const SYNC_KEY = 'barista-companion.sync.v1';

const EMPTY: SyncLocalState = { userId: null, cursor: null, lastSyncAt: null, meta: {} };

const isNumber = (value: unknown): value is number => typeof value === 'number' && Number.isFinite(value);

function parseMeta(value: unknown): CollectionMeta {
  if (typeof value !== 'object' || value === null) return {};
  const entries = Object.entries(value as Record<string, unknown>).flatMap(([id, raw]): [string, MetaEntry][] => {
    if (typeof raw !== 'object' || raw === null) return [];
    const e = raw as Record<string, unknown>;
    if (!isNumber(e.u) || (e.d !== undefined && !isNumber(e.d))) return [];
    return [[id, { u: e.u, ...(isNumber(e.d) && { d: e.d }), ...(e.x === 1 && { x: 1 as const }) }]];
  });
  return Object.fromEntries(entries);
}

function parseState(value: unknown): SyncLocalState {
  if (typeof value !== 'object' || value === null) return EMPTY;
  const v = value as Record<string, unknown>;
  const meta = typeof v.meta === 'object' && v.meta !== null ? (v.meta as Record<string, unknown>) : {};
  return {
    userId: typeof v.userId === 'string' ? v.userId : null,
    cursor: typeof v.cursor === 'string' ? v.cursor : null,
    lastSyncAt: isNumber(v.lastSyncAt) ? v.lastSyncAt : null,
    meta: Object.fromEntries(COLLECTIONS.filter((name) => name in meta).map((name) => [name, parseMeta(meta[name])])),
  };
}

export const syncLocalStore = createLocalStore<SyncLocalState>(SYNC_KEY, parseState, EMPTY);

const state = () => syncLocalStore.getSnapshot();

export function updateSyncState(patch: Partial<Omit<SyncLocalState, 'meta'>>) {
  syncLocalStore.set({ ...state(), ...patch });
}

function setMeta(name: CollectionName, meta: CollectionMeta) {
  syncLocalStore.set({ ...state(), meta: { ...state().meta, [name]: meta } });
}

// ── Śledzenie zmian ─────────────────────────────────────────────────────

let lastRecords: Partial<Record<CollectionName, Map<string, unknown>>> = {};
let applying = false;
let unsubscribers: (() => void)[] = [];
const changeListeners = new Set<() => void>();

/** Zmiana danych na tym urządzeniu (do synchronizacji po chwili). */
export function onLocalChange(listener: () => void) {
  changeListeners.add(listener);
  return () => changeListeners.delete(listener);
}

/**
 * Zaczyna śledzić magazyny. Przy pierwszym uruchomieniu (brak metadanych kolekcji) dane
 * dostają czas 0: to stare zapisy sprzed synchronizacji, każda wersja z konta jest od nich nowsza.
 */
export function startTracking() {
  if (unsubscribers.length > 0) return;
  for (const collection of collections) {
    reconcile(collection);
    unsubscribers.push(collection.subscribe(() => onStoreChange(collection)));
  }
}

/** Zgadza metadane z magazynem (np. zmiany z czasu, gdy śledzenie nie działało). */
function reconcile(collection: Collection) {
  const records = collection.toRecords(collection.read());
  const known = state().meta[collection.name];
  const now = Date.now();
  const meta: CollectionMeta = { ...known };
  for (const id of records.keys()) {
    const entry = meta[id];
    if (!entry || entry.d !== undefined) meta[id] = known ? { u: now, x: 1 } : { u: 0 };
  }
  for (const [id, entry] of Object.entries(meta)) {
    if (entry.d === undefined && !records.has(id)) meta[id] = { u: entry.u, d: now, x: 1 };
  }
  lastRecords[collection.name] = records;
  if (!known || JSON.stringify(meta) !== JSON.stringify(known)) setMeta(collection.name, meta);
}

function onStoreChange(collection: Collection) {
  if (applying) return;
  const next = collection.toRecords(collection.read());
  const previous = lastRecords[collection.name] ?? new Map();
  const meta: CollectionMeta = { ...state().meta[collection.name] };
  const now = Date.now();
  let changed = false;
  for (const [id, data] of next) {
    if (!previous.has(id) || !sameData(previous.get(id), data)) {
      meta[id] = { u: now, x: 1 };
      changed = true;
    }
  }
  for (const id of previous.keys()) {
    if (!next.has(id)) {
      meta[id] = { u: meta[id]?.u ?? 0, d: now, x: 1 };
      changed = true;
    }
  }
  lastRecords[collection.name] = next;
  if (changed) {
    setMeta(collection.name, meta);
    changeListeners.forEach((listener) => listener());
  }
}

/** Rekordy kolekcji z metadanymi, razem ze znacznikami usunięcia. */
export function localRecords(collection: Collection): SyncRecord[] {
  const meta = state().meta[collection.name] ?? {};
  const records = collection.toRecords(collection.read());
  const live = [...records].map(([id, data]): SyncRecord => {
    const entry = meta[id];
    return { id, updatedAt: entry?.d === undefined ? (entry?.u ?? 0) : 0, data, ...(entry?.x && { dirty: true }) };
  });
  const deleted = Object.entries(meta)
    .filter(([id, entry]) => entry.d !== undefined && !records.has(id))
    .map(([id, entry]): SyncRecord => ({ id, updatedAt: entry.u, deletedAt: entry.d!, ...(entry.x && { dirty: true }) }));
  return [...live, ...deleted];
}

/** Zapisuje scalone rekordy do magazynu i metadanych, bez liczenia tego jako zmiany. */
export function applyRecords(collection: Collection, records: SyncRecord[]) {
  applying = true;
  try {
    collection.write(collection.fromRecords(records.filter((r) => !isDeleted(r)), collection.read()));
    const written = collection.toRecords(collection.read());
    lastRecords[collection.name] = written;
    const meta: CollectionMeta = {};
    for (const record of records) {
      // Magazyn mógł odrzucić rekord (np. limit wpisów dziennika): wtedy go nie pamiętamy.
      if (!isDeleted(record) && !written.has(record.id)) continue;
      meta[record.id] = {
        u: record.updatedAt,
        ...(record.deletedAt !== undefined && { d: record.deletedAt }),
        ...(record.dirty && { x: 1 as const }),
      };
    }
    setMeta(collection.name, meta);
  } finally {
    applying = false;
  }
}

/** Po wysłaniu: rekordy, które od tego czasu się nie zmieniły, przestają czekać na wysłanie. */
export function markPushed(name: CollectionName, pushed: SyncRecord[]) {
  const meta: CollectionMeta = { ...state().meta[name] };
  for (const record of pushed) {
    const entry = meta[record.id];
    if (entry && Math.max(entry.u, entry.d ?? 0) === changedAt(record)) {
      const { x: _, ...clean } = entry;
      meta[record.id] = clean;
    }
  }
  setMeta(name, meta);
}

/** Czy jakaś zmiana czeka na wysłanie. */
export function hasPendingChanges(): boolean {
  return Object.values(state().meta).some((meta) => Object.values(meta ?? {}).some((entry) => entry.x === 1));
}

/** Dla testów: zapomnij śledzenie i metadane w pamięci. */
export function resetSyncTrackingForTests() {
  unsubscribers.forEach((unsubscribe) => unsubscribe());
  unsubscribers = [];
  lastRecords = {};
  applying = false;
  changeListeners.clear();
  syncLocalStore.reset();
}
