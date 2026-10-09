import { changedAt, isDeleted, sameRecord, type SyncRecord } from './records';

/**
 * Scalanie jednej kolekcji: dla każdego rekordu osobno wygrywa nowsza zmiana, a usunięcie
 * też jest zmianą. Remis wygrywa wersja z serwera (ta sama na wszystkich urządzeniach).
 * Czyste funkcje, bez magazynów i sieci.
 */
export interface MergeResult {
  /** Rekordy po scaleniu, razem z usuniętymi. */
  records: SyncRecord[];
  /** Lokalne wersje, których serwer nie ma: do wysłania. */
  toPush: SyncRecord[];
  /** Czy po scaleniu coś się zmieniło na urządzeniu (trzeba zapisać magazyn). */
  changed: boolean;
}

/**
 * local: wszystkie rekordy z urządzenia (z usuniętymi). remote: rekordy z serwera (wszystkie
 * przy pierwszej synchronizacji, a potem tylko zmienione od ostatniej). Na serwer idą lokalne
 * zmiany (dirty), a przy pierwszej synchronizacji (firstSync) wszystko, czego serwer nie ma.
 */
export function mergeRecords(local: SyncRecord[], remote: SyncRecord[], firstSync: boolean): MergeResult {
  const localById = new Map(local.map((record) => [record.id, record]));
  const remoteById = new Map(remote.map((record) => [record.id, record]));
  const records: SyncRecord[] = [];
  const toPush: SyncRecord[] = [];
  let changed = false;

  for (const [id, mine] of localById) {
    const theirs = remoteById.get(id);
    if (!theirs) {
      records.push(mine);
      if (firstSync || mine.dirty) toPush.push(mine);
      continue;
    }
    if (changedAt(mine) > changedAt(theirs)) {
      if (!sameRecord(mine, theirs)) {
        records.push(mine);
        toPush.push(mine);
      } else {
        // Serwer ma już tę treść: nie ma czego wysyłać.
        const { dirty: _, ...clean } = mine;
        records.push(clean);
        if (mine.dirty) changed = true;
      }
    } else {
      // Wersja z serwera zastępuje lokalną, także jej niewysłaną zmianę (starszą).
      records.push(theirs);
      if (!sameRecord(mine, theirs) || changedAt(mine) !== changedAt(theirs) || mine.dirty) changed = true;
    }
  }

  for (const [id, theirs] of remoteById) {
    if (localById.has(id)) continue;
    // Usunięty na serwerze, a tu go nigdy nie było: nie ma czego usuwać.
    if (isDeleted(theirs)) continue;
    records.push(theirs);
    changed = true;
  }

  return { records, toPush, changed };
}

/**
 * Pierwsze logowanie: lokalne rekordy, które mają inne id, ale tę samą treść co rekord na
 * koncie (np. te same ziarna dodane na dwóch telefonach). Zwraca mapę: id lokalne → id z konta.
 */
export function findDuplicates(
  local: SyncRecord[],
  remote: SyncRecord[],
  keyOf: (data: unknown) => string | null,
): Map<string, string> {
  const remoteIds = new Set(remote.map((record) => record.id));
  const remoteByKey = new Map<string, string>();
  for (const record of remote) {
    if (isDeleted(record)) continue;
    const key = keyOf(record.data);
    if (key !== null && !remoteByKey.has(key)) remoteByKey.set(key, record.id);
  }
  const duplicates = new Map<string, string>();
  for (const record of local) {
    if (isDeleted(record) || remoteIds.has(record.id)) continue;
    const key = keyOf(record.data);
    const target = key === null ? undefined : remoteByKey.get(key);
    if (target) duplicates.set(record.id, target);
  }
  return duplicates;
}

/**
 * Znaczniki usunięcia starsze niż `before` nie są już potrzebne (inne urządzenia zdążyły je
 * pobrać). Niewysłane zostają.
 */
export function pruneTombstones(records: SyncRecord[], before: number): SyncRecord[] {
  return records.filter((record) => !isDeleted(record) || record.dirty || (record.deletedAt ?? 0) >= before);
}
