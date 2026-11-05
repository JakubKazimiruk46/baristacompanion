import { act, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { resetAuthForTests } from '../features/account/auth';
import { NATIVE_AUTH_REDIRECT, parseAuthReturn, resetNativeAuthForTests } from '../features/account/nativeAuth';
import { returnStore } from '../features/account/returnTo';
import { resetSyncEngineForTests } from '../features/sync/engine';
import { resetSyncTrackingForTests } from '../features/sync/local';
import { resetSupabaseForTests } from '../lib/supabase';
import { installFakeSupabase, type FakeSupabase } from '../test/fakeSupabase';
import { currentUrl, renderApp } from '../test/renderApp';

vi.mock('@supabase/supabase-js', () => import('../test/fakeSupabase').then((m) => m.fakeSupabaseModule));

// Wersja natywna (Capacitor) z podmienionymi wtyczkami App i Browser.
const native = vi.hoisted(() => ({ value: true }));
vi.mock('@capacitor/core', () => ({ Capacitor: { isNativePlatform: () => native.value } }));

const app = vi.hoisted(() => ({
  listener: null as ((event: { url: string }) => void) | null,
  launchUrl: undefined as string | undefined,
}));
vi.mock('@capacitor/app', () => ({
  App: {
    addListener: vi.fn(async (_event: string, listener: (event: { url: string }) => void) => {
      app.listener = listener;
      return { remove: async () => {} };
    }),
    getLaunchUrl: vi.fn(async () => (app.launchUrl ? { url: app.launchUrl } : undefined)),
  },
}));
const browser = vi.hoisted(() => ({ open: vi.fn(async () => {}), close: vi.fn(async () => {}) }));
vi.mock('@capacitor/browser', () => ({ Browser: browser }));
// Aplikacja natywna sprawdza też powiadomienia (cold brew): wtyczka bez zaplanowanych.
vi.mock('@capacitor/local-notifications', () => ({
  LocalNotifications: {
    createChannel: vi.fn(async () => {}),
    checkPermissions: vi.fn(async () => ({ display: 'prompt' })),
    requestPermissions: vi.fn(async () => ({ display: 'denied' })),
    checkExactNotificationSetting: vi.fn(async () => ({ exact_alarm: 'granted' })),
    changeExactNotificationSetting: vi.fn(async () => ({ exact_alarm: 'granted' })),
    schedule: vi.fn(async () => ({ notifications: [] })),
    cancel: vi.fn(async () => {}),
    removeDeliveredNotificationsById: vi.fn(async () => {}),
  },
}));

let fake: FakeSupabase;

beforeEach(() => {
  localStorage.clear();
  native.value = true;
  app.listener = null;
  app.launchUrl = undefined;
  browser.open.mockClear();
  browser.close.mockClear();
  returnStore.reset();
  resetNativeAuthForTests();
  resetSyncTrackingForTests();
  resetSyncEngineForTests();
  resetAuthForTests();
  resetSupabaseForTests();
  fake = installFakeSupabase();
});

afterEach(() => {
  vi.unstubAllEnvs();
});

/** Android otwiera aplikację adresem powrotu (link z e-maila albo Google). */
async function openApp(url: string) {
  await vi.waitFor(() => expect(app.listener).not.toBeNull());
  await act(async () => app.listener!({ url }));
}

describe('adres powrotu z logowania', () => {
  it('kod albo błąd z adresu aplikacji, inne adresy pomija', () => {
    expect(parseAuthReturn(`${NATIVE_AUTH_REDIRECT}?code=abc`)).toEqual({ code: 'abc' });
    expect(parseAuthReturn(`${NATIVE_AUTH_REDIRECT}#error=access_denied&error_description=Odmowa`)).toEqual({ error: 'Odmowa' });
    expect(parseAuthReturn('https://example.com/konto?code=abc')).toBeNull();
    expect(parseAuthReturn(NATIVE_AUTH_REDIRECT)).toBeNull();
  });
});

describe('logowanie w aplikacji na Androida', () => {
  it('link z e-maila wraca do aplikacji: kod zamienia się na sesję, a aplikacja wraca na miejsce', async () => {
    const { user, router } = renderApp('/konto?wroc=%2Fspolecznosc');
    await user.type(await screen.findByLabelText('Adres e-mail'), 'ania@example.com');
    await user.click(screen.getByRole('button', { name: 'Wyślij link do logowania' }));
    expect(fake.client.auth.signInWithOtp).toHaveBeenCalledWith({
      email: 'ania@example.com',
      options: { emailRedirectTo: NATIVE_AUTH_REDIRECT, shouldCreateUser: true },
    });
    expect(screen.getByText(/Link otworzy tę aplikację/)).toBeInTheDocument();

    await openApp(`${NATIVE_AUTH_REDIRECT}?code=${fake.validAuthCode}`);
    await vi.waitFor(() => expect(currentUrl(router)).toBe('/spolecznosc'));
    expect(fake.client.auth.exchangeCodeForSession).toHaveBeenCalledWith(fake.validAuthCode);
    expect(fake.session?.user.email).toBe('ania@example.com');
  });

  it('link uruchamia zamkniętą aplikację: logowanie z adresu startowego', async () => {
    app.launchUrl = `${NATIVE_AUTH_REDIRECT}?code=${fake.validAuthCode}`;
    const { router } = renderApp('/');
    await vi.waitFor(() => expect(currentUrl(router)).toBe('/konto'));
    expect(await screen.findByText('Zalogowano jako')).toBeInTheDocument();
  });

  it('Google w karcie systemowej, potem powrót do aplikacji', async () => {
    const { user, router } = renderApp('/konto');
    await user.click(await screen.findByRole('button', { name: 'Zaloguj przez Google' }));
    expect(fake.client.auth.signInWithOAuth).toHaveBeenCalledWith({
      provider: 'google',
      options: { redirectTo: NATIVE_AUTH_REDIRECT, skipBrowserRedirect: true },
    });
    expect(browser.open).toHaveBeenCalledWith(expect.objectContaining({ url: expect.stringContaining('provider=google') }));

    await openApp(`${NATIVE_AUTH_REDIRECT}?code=${fake.validAuthCode}`);
    expect(browser.close).toHaveBeenCalled();
    expect(await screen.findByText('Zalogowano jako')).toBeInTheDocument();
    expect(currentUrl(router)).toBe('/konto');
  });

  it('wygasły link: komunikat na ekranie konta', async () => {
    const { router } = renderApp('/');
    await openApp(`${NATIVE_AUTH_REDIRECT}?code=stary`);
    await vi.waitFor(() => expect(currentUrl(router)).toBe('/konto'));
    expect(await screen.findByRole('alert')).toHaveTextContent('link wygasł');
    expect(fake.session).toBeNull();
  });

  it('w PWA nasłuchu nie ma, a powrót z linku prowadzi na stronę konta', async () => {
    native.value = false;
    const { user } = renderApp('/konto');
    await user.type(await screen.findByLabelText('Adres e-mail'), 'ania@example.com');
    await user.click(screen.getByRole('button', { name: 'Wyślij link do logowania' }));
    expect(fake.client.auth.signInWithOtp).toHaveBeenCalledWith({
      email: 'ania@example.com',
      options: { emailRedirectTo: `${window.location.origin}/konto`, shouldCreateUser: true },
    });
    expect(app.listener).toBeNull();
  });
});
