import { downloadBlob } from '../../lib/download';
import { collections } from './collections';
import { applyRecords, localRecords } from './local';
import { mergeRecords } from './merge';
import { COLLECTIONS, isDeleted, sameRecord, type CollectionName, type SyncRecord } from './records';

/**
 * Kopia zapasowa bez konta: wszystkie dane z przeglądarki w jednym pliku JSON, w tym samym
 * formacie co synchronizacja (rekordy z czasem zmiany). Wczytanie scala kopię z danymi na
 * urządzeniu (wygrywa nowsza wersja rekordu), więc niczego nie nadpisuje na ślepo.
 */
export const BACKUP_FORMAT = 'barista-companion.backup';
export const BACKUP_VERSION = 2;

/** Rekord w pliku: tylko żywe rekordy, bez metadanych urządzenia. */
interface BackupRecord {
  id: string;
  updatedAt: number;
  data: unknown;
}

export interface Backup {
  format: typeof BACKUP_FORMAT;
  version: typeof BACKUP_VERSION;
  exportedAt: string;
  collections: Partial<Record<CollectionName, BackupRecord[]>>;
}

export function createBackup(now = new Date()): Backup {
  return {
    format: BACKUP_FORMAT,
    version: BACKUP_VERSION,
    exportedAt: now.toISOString(),
    collections: Object.fromEntries(
      collections.map((collection) => [
        collection.name,
        localRecords(collection)
          .filter((record) => !isDeleted(record))
          .map(({ id, updatedAt, data }) => ({ id, updatedAt, data })),
      ]),
    ),
  };
}

export function downloadBackup(now = new Date()) {
  const backup = createBackup(now);
  const day = now.toISOString().slice(0, 10);
  downloadBlob(new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' }), `barista-companion-kopia-${day}.json`);
}

/** Kopia z pliku, sprawdzona rekord po rekordzie. null: to nie jest kopia tej aplikacji. */
export function parseBackup(value: unknown): { records: Record<CollectionName, SyncRecord[]>; skipped: number } | null {
  if (typeof value !== 'object' || value === null) return null;
  const backup = value as Record<string, unknown>;
  if (backup.format !== BACKUP_FORMAT || backup.version !== BACKUP_VERSION) return null;
  if (typeof backup.collections !== 'object' || backup.collections === null) return null;
  const raw = backup.collections as Record<string, unknown>;
  let skipped = 0;
  const records = Object.fromEntries(
    COLLECTIONS.map((name) => {
      const collection = collections.find((c) => c.name === name)!;
      const items = Array.isArray(raw[name]) ? (raw[name] as unknown[]) : [];
      const parsed = items.flatMap((item): SyncRecord[] => {
        const r = item as Partial<BackupRecord> | null;
        const data =
          r && typeof r.id === 'string' && typeof r.updatedAt === 'number' && Number.isFinite(r.updatedAt)
            ? collection.parse(r.id, r.data)
            : null;
        if (data === null) {
          skipped++;
          return [];
        }
        // Wczytane z pliku czeka na wysłanie na konto (jeśli jest).
        return [{ id: r!.id!, updatedAt: r!.updatedAt!, data, dirty: true }];
      });
      return [name, parsed];
    }),
  ) as Record<CollectionName, SyncRecord[]>;
  return { records, skipped };
}

export interface ImportSummary {
  added: number;
  updated: number;
  /** Rekordy uszkodzone albo nieznane tej wersji aplikacji. */
  skipped: number;
}

/** Wczytuje kopię: dla każdego rekordu zostaje nowsza wersja (z kopii albo z urządzenia). */
export function importBackup(value: unknown): ImportSummary | null {
  const backup = parseBackup(value);
  if (!backup) return null;
  const summary: ImportSummary = { added: 0, updated: 0, skipped: backup.skipped };
  for (const collection of collections) {
    const mine = localRecords(collection);
    const theirs = backup.records[collection.name];
    if (theirs.length === 0) continue;
    const result = mergeRecords(mine, theirs, false);
    for (const record of result.records) {
      const before = mine.find((r) => r.id === record.id);
      if (isDeleted(record) || !theirs.some((r) => r.id === record.id && r === record)) continue;
      if (!before || isDeleted(before)) summary.added++;
      else if (!sameRecord(before, record)) summary.updated++;
    }
    if (result.changed) applyRecords(collection, result.records);
  }
  return summary;
}
