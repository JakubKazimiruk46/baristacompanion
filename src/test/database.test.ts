// @vitest-environment node
import { PGlite } from '@electric-sql/pglite';
import { pgtap } from '@electric-sql/pglite-pgtap';
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * Prawdziwa baza w testach: Postgres w WASM (PGlite) z pgTAP. Każdy plik z supabase/tests dostaje
 * świeżą bazę z atrapą tego, co daje Supabase (role, schemat auth, auth.uid() z JWT, domyślne
 * uprawnienia), i wszystkimi migracjami po kolei. Bez Dockera i bez projektu Supabase; to samo
 * uruchamia `npx supabase test db` na prawdziwym projekcie.
 */

const ROOT = join(import.meta.dirname, '..', '..', 'supabase');
const MIGRATIONS = join(ROOT, 'migrations');
const TESTS = join(ROOT, 'tests');

/** To, co w projekcie Supabase jest od początku, a czego migracje nie tworzą. */
const SUPABASE_STUB = `
  create role anon nologin;
  create role authenticated nologin;
  create role service_role nologin bypassrls;
  grant usage on schema public to anon, authenticated, service_role;
  alter default privileges in schema public grant all on tables to anon, authenticated, service_role;
  alter default privileges in schema public grant all on sequences to anon, authenticated, service_role;
  alter default privileges in schema public grant all on functions to anon, authenticated, service_role;

  create schema auth;
  grant usage on schema auth to anon, authenticated, service_role;
  create table auth.users (
    id uuid primary key default gen_random_uuid(),
    email text,
    raw_app_meta_data jsonb not null default '{}',
    raw_user_meta_data jsonb not null default '{}',
    created_at timestamptz not null default now()
  );
  -- Jak w Supabase: użytkownik z JWT (request.jwt.claims albo starsze request.jwt.claim.sub).
  create function auth.uid() returns uuid language sql stable as $$
    select coalesce(
      nullif(current_setting('request.jwt.claim.sub', true), ''),
      nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'sub'
    )::uuid
  $$;
  create function auth.role() returns text language sql stable as $$
    select coalesce(
      nullif(current_setting('request.jwt.claim.role', true), ''),
      nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'role'
    )
  $$;
`;

const sqlFiles = (dir: string) =>
  readdirSync(dir)
    .filter((name) => name.endsWith('.sql'))
    .sort();

async function freshDatabase(): Promise<PGlite> {
  const db = await PGlite.create({ extensions: { pgtap } });
  await db.exec(SUPABASE_STUB);
  for (const file of sqlFiles(MIGRATIONS)) {
    try {
      await db.exec(readFileSync(join(MIGRATIONS, file), 'utf8'));
    } catch (error) {
      throw new Error(`Migracja ${file}: ${(error as Error).message}`);
    }
  }
  await db.exec('create extension if not exists pgtap;');
  return db;
}

/** Linie TAP („1..13”, „ok 1 - …”, „not ok 2 - …”, „# …”) ze wszystkich wyników. */
function tapLines(results: { rows: Record<string, unknown>[] }[]): string[] {
  return results.flatMap((result) =>
    result.rows.flatMap((row) =>
      Object.values(row).filter((value): value is string => typeof value === 'string' && /^(\d+\.\.\d+|ok |not ok |#)/.test(value)),
    ),
  );
}

describe('baza danych (PGlite + pgTAP)', () => {
  it('migracje wchodzą po kolei na czystą bazę', { timeout: 60_000 }, async () => {
    const db = await freshDatabase();
    const tables = await db.query<{ name: string }>(
      "select table_name as name from information_schema.tables where table_schema = 'public' order by 1",
    );
    expect(tables.rows.map((r) => r.name)).toEqual(
      expect.arrayContaining(['profiles', 'user_data', 'public_recipes', 'public_drinks', 'drink_saves', 'drink_reports', 'ai_usage']),
    );
    // Każda tabela w public ma włączone RLS.
    const withoutRls = await db.query<{ name: string }>(
      "select relname as name from pg_class where relnamespace = 'public'::regnamespace and relkind = 'r' and not relrowsecurity",
    );
    expect(withoutRls.rows).toEqual([]);
    await db.close();
  });

  it.each(sqlFiles(TESTS))('%s', { timeout: 60_000 }, async (file) => {
    const db = await freshDatabase();
    const results = await db.exec(readFileSync(join(TESTS, file), 'utf8'));
    await db.close();
    const lines = tapLines(results);
    const failed = lines.filter((line) => line.startsWith('not ok') || /Looks like you (failed|planned)/.test(line));
    expect(failed, lines.join('\n')).toEqual([]);
    const planned = Number(/^1\.\.(\d+)$/.exec(lines.find((line) => /^1\.\.\d+$/.test(line)) ?? '')?.[1] ?? 0);
    expect(planned).toBeGreaterThan(0);
    expect(lines.filter((line) => line.startsWith('ok ')).length).toBe(planned);
  });
});
