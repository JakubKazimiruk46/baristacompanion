import { screen, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { authStore, resetAuthForTests } from '../features/account/auth';
import { resetSupabaseForTests } from '../lib/supabase';
import { createClientMock, installFakeSupabase, type FakeSupabase } from '../test/fakeSupabase';
import { currentUrl, mainNav, renderApp } from '../test/renderApp';

vi.mock('@supabase/supabase-js', () => import('../test/fakeSupabase').then((m) => m.fakeSupabaseModule));

const download = vi.hoisted(() => ({ blobs: [] as { blob: Blob; name: string }[] }));
vi.mock('../lib/download', () => ({
  downloadBlob: (blob: Blob, name: string) => download.blobs.push({ blob, name }),
}));

let fake: FakeSupabase;

beforeEach(() => {
  localStorage.clear();
  sessionStorage.clear();
  resetSupabaseForTests();
  resetAuthForTests();
  createClientMock.mockClear();
  download.blobs = [];
  fake = installFakeSupabase();
});

afterEach(() => {
  vi.unstubAllEnvs();
});

async function signInWithCode(user: Awaited<ReturnType<typeof renderApp>>['user'], email = 'ania@example.com') {
  await user.type(await screen.findByLabelText('Adres e-mail'), email);
  await user.click(screen.getByRole('button', { name: 'Wyślij link do logowania' }));
  await user.type(await screen.findByLabelText('Kod z e-maila'), fake.validCode);
  await user.click(screen.getByRole('button', { name: 'Zaloguj' }));
  await screen.findByText('Zalogowano jako');
}

describe('konto: bez backendu i bez logowania', () => {
  it('bez zmiennych środowiskowych konto jest wyłączone, a aplikacja działa', () => {
    vi.unstubAllEnvs();
    renderApp('/konto');
    expect(screen.getByRole('heading', { name: 'Konto nie jest dostępne w tej wersji' })).toBeInTheDocument();
    expect(createClientMock).not.toHaveBeenCalled();
  });

  it('bez zapisanej sesji start aplikacji nie ładuje biblioteki Supabase', async () => {
    const { user } = renderApp('/');
    await user.click(screen.getByRole('link', { name: /Konto/ }));
    expect(screen.getByRole('heading', { level: 1, name: 'Konto' })).toBeInTheDocument();
    expect(within(mainNav()).getByRole('link', { name: 'Start' })).toHaveAttribute('aria-current', 'page');
    // Dopiero ekran konta ładuje klienta.
    await vi.waitFor(() => expect(createClientMock).toHaveBeenCalledTimes(1));
  });

  it('wejście na konto jest na starcie', async () => {
    const { user, router } = renderApp('/');
    expect(createClientMock).not.toHaveBeenCalled();
    await user.click(screen.getByRole('link', { name: /^Konto/ }));
    expect(currentUrl(router)).toBe('/konto');
  });
});

describe('logowanie', () => {
  it('kod z e-maila: najpierw wysyłka, zły kod daje komunikat, dobry loguje', async () => {
    const { user } = renderApp('/konto');
    await user.click(await screen.findByRole('button', { name: 'Wyślij link do logowania' }));
    expect(screen.getByLabelText('Adres e-mail')).toHaveAccessibleDescription('Wpisz adres e-mail, np. ania@example.com.');

    await user.type(screen.getByLabelText('Adres e-mail'), 'ania@example.com');
    await user.click(screen.getByRole('button', { name: 'Wyślij link do logowania' }));
    expect(fake.client.auth.signInWithOtp).toHaveBeenCalledWith({
      email: 'ania@example.com',
      options: { emailRedirectTo: `${window.location.origin}/konto`, shouldCreateUser: true },
    });
    expect(await screen.findByText(/Wysłaliśmy wiadomość na/)).toHaveTextContent('ania@example.com');

    await user.type(screen.getByLabelText('Kod z e-maila'), '000000');
    await user.click(screen.getByRole('button', { name: 'Zaloguj' }));
    expect(await screen.findByText('Kod jest nieprawidłowy albo wygasł. Wyślij nowy.')).toBeInTheDocument();

    await user.clear(screen.getByLabelText('Kod z e-maila'));
    await user.type(screen.getByLabelText('Kod z e-maila'), fake.validCode);
    await user.click(screen.getByRole('button', { name: 'Zaloguj' }));
    expect(await screen.findByText('ania@example.com')).toBeInTheDocument();
    expect(screen.getByText(/Linkiem albo kodem z e-maila · konto od/)).toBeInTheDocument();
  });

  it('za dużo prób: komunikat po polsku', async () => {
    fake.failNext('auth.signInWithOtp', { message: 'rate limit', code: 'over_email_send_rate_limit', status: 429 });
    const { user } = renderApp('/konto');
    await user.type(await screen.findByLabelText('Adres e-mail'), 'ania@example.com');
    await user.click(screen.getByRole('button', { name: 'Wyślij link do logowania' }));
    expect(await screen.findByText('Za dużo prób. Odczekaj chwilę i spróbuj ponownie.')).toBeInTheDocument();
  });

  it('Google przekierowuje z powrotem na ekran konta', async () => {
    const { user } = renderApp('/konto');
    await user.click(await screen.findByRole('button', { name: 'Zaloguj przez Google' }));
    expect(fake.client.auth.signInWithOAuth).toHaveBeenCalledWith({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/konto` },
    });
  });

  it('zapisana sesja odnawia logowanie na starcie, a powrót z linku sprząta ?code= z adresu', async () => {
    fake.signIn('ola@example.com');
    expect(authStore.getSnapshot().status).toBe('loading');
    const { router } = renderApp('/konto?code=abc');
    expect(await screen.findByText('ola@example.com')).toBeInTheDocument();
    await vi.waitFor(() => expect(currentUrl(router)).toBe('/konto'));
  });

  it('link z błędem pokazuje komunikat', async () => {
    renderApp('/konto?error=access_denied&error_description=Email+link+is+invalid');
    expect(await screen.findByRole('alert')).toHaveTextContent('link wygasł albo został już użyty');
  });

  it('bez internetu logowanie jest wyłączone z wyjaśnieniem', async () => {
    const online = vi.spyOn(navigator, 'onLine', 'get').mockReturnValue(false);
    renderApp('/konto');
    expect(await screen.findByText(/Logowanie wymaga internetu/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Wyślij link do logowania' })).toBeDisabled();
    online.mockRestore();
  });
});

describe('zalogowany użytkownik', () => {
  it('nick: walidacja, zajęty nick i zapis', async () => {
    const { user } = renderApp('/konto');
    await signInWithCode(user);
    const input = await screen.findByRole('textbox', { name: 'Nick' });

    await user.type(input, 'a');
    await user.click(screen.getByRole('button', { name: 'Zapisz nick' }));
    expect(input).toHaveAccessibleDescription(expect.stringContaining('Nick ma mieć od 2 do 30 znaków.'));

    await user.clear(input);
    await user.type(input, 'Ania <3');
    await user.click(screen.getByRole('button', { name: 'Zapisz nick' }));
    expect(input).toHaveAccessibleDescription(expect.stringContaining('Użyj liter, cyfr'));

    fake.failNext('profiles.update', { message: 'duplicate key', code: '23505' });
    await user.clear(input);
    await user.type(input, 'Barista Ania');
    await user.click(screen.getByRole('button', { name: 'Zapisz nick' }));
    expect(await screen.findByText('Ten nick jest zajęty. Wybierz inny.')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Zapisz nick' }));
    expect(await screen.findByText('Zapisano.')).toBeInTheDocument();
    expect(fake.table('profiles')[0]).toMatchObject({ nick: 'Barista Ania' });
  });

  it('eksport danych konta do pliku JSON', async () => {
    const { user } = renderApp('/konto');
    await signInWithCode(user);
    fake.table('profiles')[0]!.nick = 'Ania';
    await user.click(await screen.findByRole('button', { name: 'Pobierz dane konta' }));
    expect(download.blobs).toHaveLength(1);
    expect(download.blobs[0]!.name).toBe('barista-companion-konto.json');
    const data = JSON.parse(await download.blobs[0]!.blob.text());
    expect(data).toMatchObject({
      format: 'barista-companion.account',
      version: 1,
      account: { email: 'ania@example.com', signIn: 'email' },
      profile: { createdAt: '2026-10-09T10:00:00.000Z' },
    });
  });

  it('wylogowanie', async () => {
    const { user } = renderApp('/konto');
    await signInWithCode(user);
    await user.click(screen.getByRole('button', { name: 'Wyloguj' }));
    expect(await screen.findByLabelText('Adres e-mail')).toBeInTheDocument();
  });

  it('usunięcie konta z potwierdzeniem: funkcja serwerowa, potem wylogowanie', async () => {
    const deleted: string[] = [];
    fake.onFunction('delete-account', (_body, user) => {
      deleted.push(user!.id);
      return { deleted: true };
    });
    const { user } = renderApp('/konto');
    await signInWithCode(user);
    await user.click(screen.getByRole('button', { name: 'Usuń konto' }));
    const dialog = screen.getByRole('dialog', { name: 'Usunąć konto?' });
    expect(dialog).toHaveTextContent('Dane w tej przeglądarce zostaną');
    await user.click(within(dialog).getByRole('button', { name: 'Usuń konto' }));

    expect(await screen.findByText('Konto zostało usunięte razem z danymi na serwerze.')).toBeInTheDocument();
    expect(deleted).toHaveLength(1);
    expect(fake.client.auth.signOut).toHaveBeenCalledWith({ scope: 'local' });
    expect(screen.getByLabelText('Adres e-mail')).toBeInTheDocument();
  });

  it('błąd usuwania konta: komunikat, konto zostaje', async () => {
    const { user } = renderApp('/konto');
    await signInWithCode(user);
    await user.click(screen.getByRole('button', { name: 'Usuń konto' }));
    await user.click(within(screen.getByRole('dialog', { name: 'Usunąć konto?' })).getByRole('button', { name: 'Usuń konto' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Nie udało się usunąć konta');
    expect(screen.getByText('Zalogowano jako')).toBeInTheDocument();
  });
});

describe('polityka prywatności', () => {
  it('ma wszystkie części i miejsca do uzupełnienia, a ekran konta do niej prowadzi', async () => {
    const { user } = renderApp('/konto');
    await user.click(screen.getAllByRole('link', { name: /polityka prywatności/i })[0]!);
    expect(screen.getByRole('heading', { level: 1, name: 'Polityka prywatności' })).toBeInTheDocument();
    for (const title of [
      'Kto odpowiada za dane',
      'Bez konta',
      'Z kontem: co zbieramy i po co',
      'Gdzie są dane',
      'Jak długo',
      'Twoje prawa',
    ]) {
      expect(screen.getByRole('region', { name: title })).toBeInTheDocument();
    }
    expect(screen.getByRole('region', { name: 'Kto odpowiada za dane' })).toHaveTextContent('[do uzupełnienia:');
  });
});
