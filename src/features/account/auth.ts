import type { AuthError, User } from '@supabase/supabase-js';
import { useEffect, useSyncExternalStore } from 'react';
import { backendEnabled, getSupabase, hasStoredSession } from '../../lib/supabase';

/** Zalogowany użytkownik: tylko to, czego potrzebuje aplikacja. */
export interface AccountUser {
  id: string;
  email: string | null;
  /** Jak się logował: „email” albo „google”. */
  provider: string;
  createdAt: string;
}

export type AuthState =
  | { status: 'disabled' }
  | { status: 'loading' }
  | { status: 'signed-out' }
  | { status: 'signed-in'; user: AccountUser };

export type ActionResult = { ok: true } | { ok: false; message: string };

let state: AuthState | null = null;
let started: Promise<void> | null = null;
const listeners = new Set<() => void>();

/** Bez zapisanej sesji nie ładujemy biblioteki: wiadomo, że nikt nie jest zalogowany. */
function initial(): AuthState {
  if (!backendEnabled()) return { status: 'disabled' };
  return hasStoredSession() ? { status: 'loading' } : { status: 'signed-out' };
}

function setState(next: AuthState) {
  state = next;
  listeners.forEach((listener) => listener());
}

const toUser = (user: User): AccountUser => ({
  id: user.id,
  email: user.email ?? null,
  provider: typeof user.app_metadata.provider === 'string' ? user.app_metadata.provider : 'email',
  createdAt: user.created_at,
});

/** Ładuje klienta i słucha zmian sesji (logowanie, wylogowanie, odświeżenie tokenu). Raz. */
export function startAuth(): Promise<void> {
  if (!backendEnabled()) return Promise.resolve();
  started ??= getSupabase()
    .then((supabase) => {
      supabase.auth.onAuthStateChange((_event, session) => {
        setState(session ? { status: 'signed-in', user: toUser(session.user) } : { status: 'signed-out' });
      });
    })
    .catch(() => setState({ status: 'signed-out' }));
  return started;
}

export const authStore = {
  subscribe(listener: () => void) {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },
  getSnapshot(): AuthState {
    state ??= initial();
    return state;
  },
};

/**
 * Stan konta. load: załaduj klienta (ekran konta). Zapisana sesja ładuje go zawsze, żeby
 * odnowić logowanie.
 */
export function useAuth(options: { load?: boolean } = {}): AuthState {
  const snapshot = useSyncExternalStore(authStore.subscribe, authStore.getSnapshot);
  const load = (options.load ?? false) || snapshot.status === 'loading';
  useEffect(() => {
    if (load) void startAuth();
  }, [load]);
  return snapshot;
}

/** Zalogowany użytkownik albo null. */
export function currentUser(): AccountUser | null {
  const snapshot = authStore.getSnapshot();
  return snapshot.status === 'signed-in' ? snapshot.user : null;
}

/** Błąd z Supabase po polsku. */
export function errorMessage(error: Pick<AuthError, 'message'> & { code?: string; status?: number }): string {
  if (!navigator.onLine) return 'Brak połączenia z internetem.';
  switch (error.code) {
    case 'over_email_send_rate_limit':
    case 'over_request_rate_limit':
      return 'Za dużo prób. Odczekaj chwilę i spróbuj ponownie.';
    case 'otp_expired':
      return 'Kod jest nieprawidłowy albo wygasł. Wyślij nowy.';
    case 'email_address_invalid':
    case 'validation_failed':
      return 'Sprawdź adres e-mail.';
    default:
      return 'Coś poszło nie tak. Spróbuj ponownie za chwilę.';
  }
}

const redirectTo = () => `${window.location.origin}/konto`;

async function run(action: () => Promise<{ error: AuthError | null }>): Promise<ActionResult> {
  try {
    const { error } = await action();
    return error ? { ok: false, message: errorMessage(error) } : { ok: true };
  } catch {
    return { ok: false, message: errorMessage({ message: 'network' }) };
  }
}

/** Wiadomość z linkiem i kodem do logowania. Konto powstaje przy pierwszym logowaniu. */
export async function sendLoginEmail(email: string): Promise<ActionResult> {
  const supabase = await getSupabase();
  return run(() =>
    supabase.auth.signInWithOtp({ email, options: { emailRedirectTo: redirectTo(), shouldCreateUser: true } }),
  );
}

/** Logowanie kodem z e-maila (działa też w aplikacji na Androida, gdzie link otwiera przeglądarkę). */
export async function verifyLoginCode(email: string, code: string): Promise<ActionResult> {
  const supabase = await getSupabase();
  return run(() => supabase.auth.verifyOtp({ email, token: code, type: 'email' }));
}

export async function signInWithGoogle(): Promise<ActionResult> {
  const supabase = await getSupabase();
  return run(() => supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: redirectTo() } }));
}

export async function signOut(): Promise<ActionResult> {
  const supabase = await getSupabase();
  return run(() => supabase.auth.signOut());
}

/** Usuwa konto i wszystkie dane na serwerze (funkcja serwerowa delete-account), potem wylogowuje. */
export async function deleteAccount(): Promise<ActionResult> {
  const supabase = await getSupabase();
  try {
    const { error } = await supabase.functions.invoke('delete-account', { body: {} });
    if (error) return { ok: false, message: 'Nie udało się usunąć konta. Spróbuj za chwilę.' };
  } catch {
    return { ok: false, message: errorMessage({ message: 'network' }) };
  }
  // Użytkownika już nie ma na serwerze: zostaje tylko zapomnieć sesję w tej przeglądarce.
  await supabase.auth.signOut({ scope: 'local' }).catch(() => {});
  setState({ status: 'signed-out' });
  return { ok: true };
}

/** Dla testów: zapomnij stan i klienta. */
export function resetAuthForTests() {
  state = null;
  started = null;
}
