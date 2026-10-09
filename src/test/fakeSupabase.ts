import { vi } from 'vitest';
import { AUTH_STORAGE_KEY } from '../lib/supabase';

/**
 * Supabase w pamięci do testów: tabele z prostym zapytaniem (select, filtry, sortowanie,
 * insert/update/upsert/delete), logowanie i funkcje serwerowe. Reguł RLS nie udaje: te
 * sprawdza skrypt SQL w supabase/tests.
 *
 * Użycie w teście:
 *   vi.mock('@supabase/supabase-js', () => import('../test/fakeSupabase').then((m) => m.fakeSupabaseModule));
 *   beforeEach(() => { fake = installFakeSupabase(); });
 */

type Row = Record<string, unknown>;
type Filter = (row: Row) => boolean;
type Result = { data: unknown; error: FakeError | null; count?: number | null };

export interface FakeError {
  message: string;
  code?: string;
  status?: number;
}

export interface FakeUser {
  id: string;
  email: string;
  app_metadata: { provider: string };
  created_at: string;
}

type Session = { user: FakeUser; access_token: string };
type AuthListener = (event: string, session: Session | null) => void;

/** Błąd funkcji serwerowej z odpowiedzią HTTP (jak FunctionsHttpError w supabase-js). */
export class FakeFunctionError extends Error {
  constructor(
    public status: number,
    public body: unknown,
  ) {
    super(`HTTP ${status}`);
  }
}

const like = (pattern: string) =>
  new RegExp(`^${pattern.replace(/[.+?^${}()|[\]\\]/g, '\\$&').replace(/%/g, '.*').replace(/_/g, '.')}$`, 'i');

export function createFakeSupabase() {
  const tables = new Map<string, Row[]>();
  const forced = new Map<string, FakeError>();
  const functions = new Map<string, (body: unknown, user: FakeUser | null) => unknown>();
  const rpcs = new Map<string, (args: Record<string, unknown>, user: FakeUser | null) => unknown>();
  /** Jak DEFAULT i triggery „before insert” w bazie. */
  const beforeInsert = new Map<string, (row: Row) => Row>();
  const listeners = new Set<AuthListener>();
  let session: Session | null = null;
  let nextId = 1;

  const table = (name: string) => {
    if (!tables.has(name)) tables.set(name, []);
    return tables.get(name)!;
  };

  const takeError = (key: string) => {
    const error = forced.get(key);
    if (error) forced.delete(key);
    return error ?? null;
  };

  function emit(event: string) {
    listeners.forEach((listener) => listener(event, session));
  }

  function signIn(email: string, provider = 'email') {
    let user = [...table('_users')].find((u) => u.email === email) as FakeUser | undefined;
    if (!user) {
      user = { id: `user-${nextId++}`, email, app_metadata: { provider }, created_at: '2026-10-09T10:00:00.000Z' };
      table('_users').push(user as unknown as Row);
      // Jak trigger handle_new_user w bazie.
      table('profiles').push({ id: user.id, nick: null, created_at: user.created_at });
    }
    session = { user, access_token: `token-${user.id}` };
    try {
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify({ access_token: session.access_token }));
    } catch {
      // jw.
    }
    emit('SIGNED_IN');
    return user;
  }

  function signOutLocal() {
    session = null;
    try {
      localStorage.removeItem(AUTH_STORAGE_KEY);
    } catch {
      // jw.
    }
    emit('SIGNED_OUT');
  }

  const prepare = (row: Row) => {
    const hook = beforeInsert.get(currentTable);
    return hook ? hook(row) : row;
  };
  let currentTable = '';

  class Query implements PromiseLike<Result> {
    private filters: Filter[] = [];
    private op: 'select' | 'insert' | 'update' | 'upsert' | 'delete' = 'select';
    private payload: Row | Row[] | undefined;
    private orderBy: { column: string; ascending: boolean }[] = [];
    private limitTo: number | undefined;
    private rangeOf: [number, number] | undefined;
    private one: 'single' | 'maybe' | undefined;
    private conflict = 'id';
    private wantCount = false;

    constructor(private name: string) {}

    select(_columns?: string, options?: { count?: string; head?: boolean }) {
      if (options?.count) this.wantCount = true;
      return this;
    }
    insert(values: Row | Row[]) {
      this.op = 'insert';
      this.payload = values;
      return this;
    }
    update(values: Row) {
      this.op = 'update';
      this.payload = values;
      return this;
    }
    upsert(values: Row | Row[], options?: { onConflict?: string }) {
      this.op = 'upsert';
      this.payload = values;
      if (options?.onConflict) this.conflict = options.onConflict;
      return this;
    }
    delete() {
      this.op = 'delete';
      return this;
    }
    eq(column: string, value: unknown) {
      this.filters.push((row) => row[column] === value);
      return this;
    }
    neq(column: string, value: unknown) {
      this.filters.push((row) => row[column] !== value);
      return this;
    }
    in(column: string, values: unknown[]) {
      this.filters.push((row) => values.includes(row[column]));
      return this;
    }
    is(column: string, value: unknown) {
      this.filters.push((row) => (row[column] ?? null) === value);
      return this;
    }
    gt(column: string, value: string | number) {
      this.filters.push((row) => (row[column] as string | number) > value);
      return this;
    }
    gte(column: string, value: string | number) {
      this.filters.push((row) => (row[column] as string | number) >= value);
      return this;
    }
    lt(column: string, value: string | number) {
      this.filters.push((row) => (row[column] as string | number) < value);
      return this;
    }
    ilike(column: string, pattern: string) {
      this.filters.push((row) => like(pattern).test(String(row[column] ?? '')));
      return this;
    }
    /** Proste „or”: kolumna.ilike.wzorzec, rozdzielone przecinkami. */
    or(expression: string) {
      const parts = expression.split(',').map((part) => {
        const [column, operator, ...rest] = part.split('.');
        const value = rest.join('.');
        return (row: Row) =>
          operator === 'ilike' ? like(value).test(String(row[column!] ?? '')) : String(row[column!]) === value;
      });
      this.filters.push((row) => parts.some((test) => test(row)));
      return this;
    }
    order(column: string, options: { ascending?: boolean } = {}) {
      this.orderBy.push({ column, ascending: options.ascending ?? true });
      return this;
    }
    limit(count: number) {
      this.limitTo = count;
      return this;
    }
    range(from: number, to: number) {
      this.rangeOf = [from, to];
      return this;
    }
    single() {
      this.one = 'single';
      return this;
    }
    maybeSingle() {
      this.one = 'maybe';
      return this;
    }

    then<A = Result, B = never>(
      resolve?: ((value: Result) => A | PromiseLike<A>) | null,
      reject?: ((reason: unknown) => B | PromiseLike<B>) | null,
    ): PromiseLike<A | B> {
      return Promise.resolve()
        .then(() => this.run())
        .then(resolve, reject);
    }

    private matching(): Row[] {
      return table(this.name).filter((row) => this.filters.every((test) => test(row)));
    }

    private run(): Result {
      currentTable = this.name;
      const error = takeError(`${this.name}.${this.op}`);
      if (error) return { data: null, error };
      const rows = table(this.name);
      let result: Row[];
      switch (this.op) {
        case 'select':
          result = this.matching();
          break;
        case 'insert': {
          const values = (Array.isArray(this.payload) ? this.payload : [this.payload!]).map((row) =>
            prepare({
              id: row.id ?? `${this.name}-${nextId++}`,
              created_at: row.created_at ?? new Date().toISOString(),
              ...row,
            }),
          );
          rows.push(...values);
          result = values;
          break;
        }
        case 'update':
          result = this.matching();
          for (const row of result) Object.assign(row, this.payload);
          break;
        case 'upsert': {
          const keys = this.conflict.split(',').map((key) => key.trim());
          result = [];
          for (const value of Array.isArray(this.payload) ? this.payload : [this.payload!]) {
            const existing = rows.find((row) => keys.every((key) => row[key] === value[key]));
            if (existing) {
              Object.assign(existing, value);
              result.push(existing);
            } else {
              const inserted = prepare({ id: value.id ?? `${this.name}-${nextId++}`, created_at: new Date().toISOString(), ...value });
              rows.push(inserted);
              result.push(inserted);
            }
          }
          break;
        }
        case 'delete':
          result = this.matching();
          tables.set(
            this.name,
            rows.filter((row) => !result.includes(row)),
          );
          break;
      }
      const count = result.length;
      for (const { column, ascending } of [...this.orderBy].reverse()) {
        result = [...result].sort((a, b) => {
          const x = a[column] as string | number;
          const y = b[column] as string | number;
          return (x < y ? -1 : x > y ? 1 : 0) * (ascending ? 1 : -1);
        });
      }
      if (this.rangeOf) result = result.slice(this.rangeOf[0], this.rangeOf[1] + 1);
      if (this.limitTo !== undefined) result = result.slice(0, this.limitTo);
      const copy = result.map((row) => ({ ...row }));
      if (this.one) {
        if (copy.length === 0 && this.one === 'single') {
          return { data: null, error: { message: 'No rows', code: 'PGRST116' } };
        }
        return { data: copy[0] ?? null, error: null };
      }
      return { data: copy, error: null, ...(this.wantCount && { count }) };
    }
  }

  const user = () => session?.user ?? null;

  const client = {
    auth: {
      getSession: vi.fn(async () => ({ data: { session }, error: null })),
      getUser: vi.fn(async () => ({ data: { user: user() }, error: null })),
      onAuthStateChange: vi.fn((listener: AuthListener) => {
        listeners.add(listener);
        queueMicrotask(() => listener('INITIAL_SESSION', session));
        return { data: { subscription: { unsubscribe: () => listeners.delete(listener) } } };
      }),
      signInWithOtp: vi.fn(async (_options: { email: string; options?: Record<string, unknown> }) => ({
        data: {},
        error: takeError('auth.signInWithOtp'),
      })),
      verifyOtp: vi.fn(async ({ email, token }: { email: string; token: string }) => {
        if (token !== fake.validCode) {
          return { data: {}, error: { message: 'Token has expired or is invalid', code: 'otp_expired', status: 403 } };
        }
        signIn(email);
        return { data: { session }, error: null };
      }),
      signInWithOAuth: vi.fn(async (options: { provider: string; options?: Record<string, unknown> }) => ({
        data: { provider: options.provider, url: `https://test.supabase.co/auth/v1/authorize?provider=${options.provider}` },
        error: null,
      })),
      // Powrót z logowania z kodem (PKCE): poprawny kod loguje użytkownika z fake.codeEmail.
      exchangeCodeForSession: vi.fn(async (code: string) => {
        if (code !== fake.validAuthCode) {
          return { data: { session: null }, error: { message: 'invalid flow state', code: 'bad_code_verifier', status: 400 } };
        }
        signIn(fake.codeEmail);
        return { data: { session }, error: null };
      }),
      signOut: vi.fn(async (_options?: { scope?: string }) => {
        signOutLocal();
        return { error: null };
      }),
    },
    from: (name: string) => new Query(name),
    rpc: vi.fn(async (name: string, args: Record<string, unknown> = {}) => {
      const handler = rpcs.get(name);
      if (!handler) return { data: null, error: { message: `Brak funkcji ${name}`, code: '42883' } };
      try {
        return { data: await handler(args, user()), error: null };
      } catch (error) {
        return { data: null, error: error as FakeError };
      }
    }),
    functions: {
      invoke: vi.fn(async (name: string, options: { body?: unknown } = {}) => {
        const handler = functions.get(name);
        if (!handler) return { data: null, error: { name: 'FunctionsHttpError', message: 'Not found', context: new Response('{}', { status: 404 }) } };
        try {
          return { data: await handler(options.body, user()), error: null };
        } catch (error) {
          if (error instanceof FakeFunctionError) {
            return {
              data: null,
              error: {
                name: 'FunctionsHttpError',
                message: error.message,
                context: new Response(JSON.stringify(error.body), { status: error.status }),
              },
            };
          }
          return { data: null, error: { name: 'FunctionsFetchError', message: 'Failed to fetch' } };
        }
      }),
    },
  };

  // Jak funkcja sync_push w bazie: zapisuje tylko wersje nowsze (albo równe) od tych w tabeli.
  let syncedSeq = 0;
  rpcs.set('sync_push', (args, current) => {
    if (!current) throw { message: 'not authenticated', code: '42501' } satisfies FakeError;
    const rows = table('user_data');
    const written: Row[] = [];
    for (const r of args.records as Row[]) {
      const existing = rows.find(
        (row) => row.user_id === current.id && row.collection === r.collection && row.record_id === r.record_id,
      );
      if (existing && (r.updated_at as string) < (existing.updated_at as string)) continue;
      const row: Row = {
        user_id: current.id,
        collection: r.collection,
        record_id: r.record_id,
        payload: r.deleted ? null : r.payload,
        updated_at: r.updated_at,
        deleted: r.deleted,
        synced_at: new Date(Date.now() + syncedSeq++).toISOString(),
      };
      if (existing) Object.assign(existing, row);
      else rows.push(row);
      written.push(row);
    }
    return written;
  });

  const fake = {
    client,
    tables,
    table,
    /** Kod z e-maila, który przechodzi weryfikację. */
    validCode: '123456',
    /** Kod z adresu powrotu (link z e-maila, Google), który exchangeCodeForSession przyjmuje. */
    validAuthCode: 'kod-pkce',
    codeEmail: 'ania@example.com',
    signIn,
    signOutLocal,
    get session() {
      return session;
    },
    /** Następna operacja (np. „profiles.update”, „auth.signInWithOtp”) zwróci błąd. */
    failNext(key: string, error: FakeError) {
      forced.set(key, error);
    },
    onFunction(name: string, handler: (body: unknown, user: FakeUser | null) => unknown) {
      functions.set(name, handler);
    },
    onRpc(name: string, handler: (args: Record<string, unknown>, user: FakeUser | null) => unknown) {
      rpcs.set(name, handler);
    },
    /** Wartości domyślne i trigger „before insert” tabeli. */
    onBeforeInsert(name: string, hook: (row: Row) => Row) {
      beforeInsert.set(name, hook);
    },
  };
  return fake;
}

export type FakeSupabase = ReturnType<typeof createFakeSupabase>;

let current: FakeSupabase | null = null;

/** Nowa atrapa dla testu, ze zmiennymi środowiskowymi backendu. */
export function installFakeSupabase(): FakeSupabase {
  current = createFakeSupabase();
  vi.stubEnv('VITE_SUPABASE_URL', 'https://test.supabase.co');
  vi.stubEnv('VITE_SUPABASE_ANON_KEY', 'anon-key');
  return current;
}

export const createClientMock = vi.fn(() => {
  if (!current) throw new Error('Najpierw installFakeSupabase()');
  return current.client;
});

/** Moduł podstawiany za @supabase/supabase-js. */
export const fakeSupabaseModule = { createClient: createClientMock };
