import { isNativeApp } from '../../lib/notifications';

/**
 * Logowanie w aplikacji na Androida. Link z e-maila i powrót z Google trafiają pod własny schemat
 * adresu aplikacji (pl.baristacompanion.app://konto?code=…), a Android otwiera wtedy aplikację, nie
 * przeglądarkę. Kod wymienia się na sesję w aplikacji (auth.ts): weryfikator PKCE został w jej
 * pamięci przy rozpoczęciu logowania. Google otwiera się w karcie systemowej (Custom Tabs), bo
 * w osadzonym WebView Google logowania nie pozwala. Wtyczki ładują się dynamicznie i tylko
 * w aplikacji natywnej.
 */
export const NATIVE_AUTH_REDIRECT = 'pl.baristacompanion.app://konto';

/** Dokąd Supabase odsyła po logowaniu: w aplikacji natywnej do niej, w PWA na ekran konta. */
export const authRedirect = () => (isNativeApp() ? NATIVE_AUTH_REDIRECT : `${window.location.origin}/konto`);

export type AuthReturn = { code: string } | { error: string };

/** Kod z adresu powrotu albo błąd (link wygasł, odmowa w Google). null: to nie adres logowania. */
export function parseAuthReturn(url: string): AuthReturn | null {
  if (!url.startsWith(NATIVE_AUTH_REDIRECT)) return null;
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return null;
  }
  // Supabase daje kod w zapytaniu, a błąd bywa też we fragmencie (#error_description=…).
  const query = new URLSearchParams(parsed.search);
  const hash = new URLSearchParams(parsed.hash.replace(/^#/, ''));
  const code = query.get('code');
  if (code) return { code };
  const error = query.get('error_description') ?? hash.get('error_description') ?? query.get('error') ?? hash.get('error');
  return error ? { error } : null;
}

let listening = false;

/**
 * W aplikacji natywnej: słucha otwarcia aplikacji z adresu powrotu, także wtedy, gdy link ją
 * uruchomił (getLaunchUrl). Zamyka kartę z Google i przekazuje wynik dalej. Raz na uruchomienie.
 */
export async function listenForAuthReturn(onReturn: (result: AuthReturn) => void): Promise<void> {
  if (!isNativeApp() || listening) return;
  listening = true;
  const [{ App }, { Browser }] = await Promise.all([import('@capacitor/app'), import('@capacitor/browser')]);
  const handle = (url: string | undefined) => {
    const result = url ? parseAuthReturn(url) : null;
    if (!result) return;
    // Karta z Google zostaje nad aplikacją, dopóki jej nie zamkniemy (może już jej nie być).
    void Browser.close().catch(() => {});
    onReturn(result);
  };
  await App.addListener('appUrlOpen', ({ url }) => handle(url));
  const launch = await App.getLaunchUrl().catch(() => undefined);
  handle(launch?.url);
}

/** Google w aplikacji natywnej: adres logowania od Supabase otwiera karta systemowa. */
export async function openNativeOAuth(url: string): Promise<void> {
  const { Browser } = await import('@capacitor/browser');
  await Browser.open({ url, toolbarColor: '#884e1e' });
}

/** Dla testów: zapomnij, że nasłuch już działa. */
export function resetNativeAuthForTests() {
  listening = false;
}
