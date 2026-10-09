import type { SupabaseClient } from '@supabase/supabase-js';
import { useSyncExternalStore } from 'react';
import { getSupabase } from '../../lib/supabase';
import { currentUser } from '../account/auth';
import { collections, type Remaps } from './collections';
import { applyRecords, localRecords, markPushed, syncLocalStore, updateSyncState } from './local';
import { findDuplicates, mergeRecords, pruneTombstones } from './merge';
import { changedAt, COLLECTIONS, isDeleted, type CollectionName, type SyncRecord } from './records';

/** Wiersz tabeli user_data. */
interface RemoteRow {
  collection: string;
  record_id: string;
  payload: unknown;
  updated_at: string;
  deleted: boolean;
  synced_at: string;
}

export type SyncStatus =
  | { state: 'idle'; lastSyncAt: number | null }
  | { state: 'syncing'; lastSyncAt: number | null }
  | { state: 'error'; lastSyncAt: number | null; message: string };

const PAGE = 1000;
const PUSH_BATCH = 200;
/** Pobieramy z zakładką: zapis z innego urządzenia mógł się zatwierdzić chwilę później. */
const CURSOR_OVERLAP_MS = 10_000;
/** Znaczniki usunięcia trzymamy kwartał: tyle mają inne urządzenia, żeby je pobrać. */
const TOMBSTONE_TTL_MS = 90 * 24 * 3600 * 1000;

// ── Stan do wyświetlenia ───────────────────────────────────────────────

let status: SyncStatus = { state: 'idle', lastSyncAt: null };
const listeners = new Set<() => void>();

function setStatus(next: SyncStatus) {
  status = next;
  listeners.forEach((listener) => listener());
}

const statusStore = {
  subscribe(listener: () => void) {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },
  getSnapshot(): SyncStatus {
    // Czas ostatniej synchronizacji przetrwa zamknięcie aplikacji.
    if (status.state === 'idle' && status.lastSyncAt === null) {
      const saved = syncLocalStore.getSnapshot().lastSyncAt;
      if (saved !== null) status = { state: 'idle', lastSyncAt: saved };
    }
    return status;
  },
};

export function useSyncStatus(): SyncStatus {
  return useSyncExternalStore(statusStore.subscribe, statusStore.getSnapshot);
}

// ── Synchronizacja ─────────────────────────────────────────────────────

let running: Promise<void> | null = null;
let again = false;

/**
 * Synchronizuje teraz: pobiera zmiany z konta, scala je z danymi na urządzeniu i wysyła
 * lokalne zmiany. Naraz działa jedna synchronizacja; wywołanie w trakcie zaplanuje kolejną.
 */
export function syncNow(): Promise<void> {
  if (running) {
    again = true;
    return running;
  }
  running = run().finally(() => {
    running = null;
    if (again) {
      again = false;
      void syncNow();
    }
  });
  return running;
}

async function run() {
  const user = currentUser();
  if (!user) return;
  const lastSyncAt = syncLocalStore.getSnapshot().lastSyncAt;
  if (!navigator.onLine) {
    setStatus({ state: 'error', lastSyncAt, message: 'Brak internetu. Zmiany zostają na urządzeniu i wyślą się później.' });
    return;
  }
  setStatus({ state: 'syncing', lastSyncAt });
  try {
    const supabase = await getSupabase();
    const local = syncLocalStore.getSnapshot();
    const firstSync = local.userId !== user.id;
    const rows = await pull(supabase, user.id, firstSync ? null : local.cursor);
    const remote = groupRows(rows);

    // Pierwsze logowanie: te same rzeczy dodane na dwóch urządzeniach łączymy w jedną.
    const remaps: Remaps = {};
    if (firstSync) {
      for (const collection of collections) {
        if (!collection.dedupeKey) continue;
        remaps[collection.name] = findDuplicates(localRecords(collection), remote[collection.name], collection.dedupeKey);
      }
    }

    const toPush: { collection: CollectionName; record: SyncRecord }[] = [];
    for (const collection of collections) {
      let mine = localRecords(collection);
      if (firstSync) mine = prepareFirstSync(collection.name, mine, remote[collection.name], remaps);
      const result = mergeRecords(mine, remote[collection.name], firstSync);
      if (result.changed || firstSync) applyRecords(collection, result.records);
      toPush.push(...result.toPush.map((record) => ({ collection: collection.name, record })));
    }

    await push(supabase, toPush);
    for (const name of COLLECTIONS) {
      markPushed(
        name,
        toPush.filter((item) => item.collection === name).map((item) => item.record),
      );
    }
    pruneOldTombstones();

    const cursor = rows.reduce<string | null>((max, row) => (max === null || row.synced_at > max ? row.synced_at : max), firstSync ? null : local.cursor);
    const now = Date.now();
    updateSyncState({ userId: user.id, cursor, lastSyncAt: now });
    setStatus({ state: 'idle', lastSyncAt: now });
  } catch (error) {
    setStatus({
      state: 'error',
      lastSyncAt,
      message: navigator.onLine
        ? 'Nie udało się zsynchronizować. Spróbujemy ponownie przy następnej zmianie.'
        : 'Brak internetu. Zmiany zostają na urządzeniu i wyślą się później.',
    });
    // W konsoli bez danych użytkownika: tylko rodzaj błędu.
    console.warn('sync', error instanceof Error ? error.message : 'error');
  }
}

/** Pierwsze logowanie: usuń lokalne duplikaty, podmień odwołania do nich i połącz półki. */
function prepareFirstSync(name: CollectionName, mine: SyncRecord[], theirs: SyncRecord[], remaps: Remaps) {
  const collection = collections.find((c) => c.name === name)!;
  const duplicates = remaps[name];
  const now = Date.now();
  return mine
    .filter((record) => !duplicates?.has(record.id))
    .map((record) => {
      if (isDeleted(record)) return record;
      let data = collection.remap ? collection.remap(record.id, record.data, remaps) : record.data;
      const remote = theirs.find((r) => r.id === record.id && !isDeleted(r));
      if (collection.combine && remote) {
        data = collection.combine(data, remote.data);
        return { id: record.id, updatedAt: now, data, dirty: true };
      }
      return data === record.data ? record : { ...record, data, updatedAt: now, dirty: true };
    });
}

function pruneOldTombstones() {
  const before = Date.now() - TOMBSTONE_TTL_MS;
  for (const collection of collections) {
    const records = localRecords(collection);
    const kept = pruneTombstones(records, before);
    if (kept.length !== records.length) applyRecords(collection, kept);
  }
}

async function pull(supabase: SupabaseClient, userId: string, cursor: string | null): Promise<RemoteRow[]> {
  const rows: RemoteRow[] = [];
  const since = cursor === null ? null : new Date(Date.parse(cursor) - CURSOR_OVERLAP_MS).toISOString();
  for (let from = 0; ; from += PAGE) {
    let query = supabase
      .from('user_data')
      .select('collection, record_id, payload, updated_at, deleted, synced_at')
      .eq('user_id', userId)
      .order('synced_at', { ascending: true })
      .range(from, from + PAGE - 1);
    if (since !== null) query = query.gt('synced_at', since);
    const { data, error } = await query;
    if (error) throw new Error(error.message);
    rows.push(...((data ?? []) as RemoteRow[]));
    if (!data || data.length < PAGE) return rows;
  }
}

/** Wiersze z serwera jako rekordy, sprawdzone parserem kolekcji. Nieznane i uszkodzone pomijamy. */
function groupRows(rows: RemoteRow[]): Record<CollectionName, SyncRecord[]> {
  const grouped = Object.fromEntries(COLLECTIONS.map((name) => [name, [] as SyncRecord[]])) as Record<
    CollectionName,
    SyncRecord[]
  >;
  for (const row of rows) {
    const collection = collections.find((c) => c.name === row.collection);
    const time = Date.parse(row.updated_at);
    if (!collection || !Number.isFinite(time)) continue;
    if (row.deleted) {
      grouped[collection.name].push({ id: row.record_id, updatedAt: time, deletedAt: time });
      continue;
    }
    const data = collection.parse(row.record_id, row.payload);
    if (data !== null) grouped[collection.name].push({ id: row.record_id, updatedAt: time, data });
  }
  // Ten sam rekord dwa razy (zakładka przy pobieraniu): zostaje nowsza wersja.
  for (const name of COLLECTIONS) {
    const latest = new Map<string, SyncRecord>();
    for (const record of grouped[name]) {
      const seen = latest.get(record.id);
      if (!seen || changedAt(record) >= changedAt(seen)) latest.set(record.id, record);
    }
    grouped[name] = [...latest.values()];
  }
  return grouped;
}

/** Wysyła rekordy przez sync_push: baza zapisuje tylko wersje nowsze niż te, które już ma. */
async function push(supabase: SupabaseClient, items: { collection: CollectionName; record: SyncRecord }[]) {
  for (let i = 0; i < items.length; i += PUSH_BATCH) {
    const batch = items.slice(i, i + PUSH_BATCH).map(({ collection, record }) => ({
      collection,
      record_id: record.id,
      payload: isDeleted(record) ? null : record.data,
      updated_at: new Date(changedAt(record)).toISOString(),
      deleted: isDeleted(record),
    }));
    const { error } = await supabase.rpc('sync_push', { records: batch });
    if (error) throw new Error(error.message);
  }
}

/** Dla testów: zapomnij stan synchronizacji w pamięci. */
export function resetSyncEngineForTests() {
  status = { state: 'idle', lastSyncAt: null };
  running = null;
  again = false;
}
