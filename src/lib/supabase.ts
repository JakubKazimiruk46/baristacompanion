import type { SupabaseClient } from '@supabase/supabase-js';

/**
 * Klient Supabase (konto, synchronizacja). Biblioteka ładuje się dynamicznie dopiero wtedy, gdy
 * jest potrzebna (logowanie, zapisana sesja), więc nie obciąża startu aplikacji. Bez zmiennych
 * VITE_SUPABASE_* (np. lokalnie bez .env.local) konta po prostu nie ma.
 */

/** Klucz sesji w localStorage. Po nim poznajemy, że ktoś jest zalogowany, bez ładowania biblioteki. */
export const AUTH_STORAGE_KEY = 'barista-companion.auth';

export function backendConfig(): { url: string; anonKey: string } | null {
  const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
  const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;
  return url && anonKey ? { url, anonKey } : null;
}

export const backendEnabled = () => backendConfig() !== null;

let client: Promise<SupabaseClient> | null = null;

export function getSupabase(): Promise<SupabaseClient> {
  const config = backendConfig();
  if (!config) return Promise.reject(new Error('Backend nie jest skonfigurowany.'));
  client ??= import('@supabase/supabase-js').then(({ createClient }) =>
    createClient(config.url, config.anonKey, {
      auth: {
        storageKey: AUTH_STORAGE_KEY,
        persistSession: true,
        autoRefreshToken: true,
        // Link z e-maila i powrót z Google wracają na /konto z ?code= (PKCE).
        detectSessionInUrl: true,
        flowType: 'pkce',
      },
    }),
  );
  return client;
}

/** Czy w tej przeglądarce jest zapisana sesja (bez ładowania biblioteki). */
export function hasStoredSession(): boolean {
  try {
    return localStorage.getItem(AUTH_STORAGE_KEY) !== null;
  } catch {
    return false;
  }
}

/** Dla testów: zapomnij klienta. */
export function resetSupabaseForTests() {
  client = null;
}
