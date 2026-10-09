import { screen, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { resetAuthForTests } from '../features/account/auth';
import { aiConsentStore } from '../features/beans/scan/aiScan';
import { readLabel } from '../features/beans/scan/ocr';
import { prepareImage } from '../features/beans/scan/prepareImage';
import { beansStore } from '../features/beans/store';
import { resetSyncEngineForTests } from '../features/sync/engine';
import { resetSyncTrackingForTests } from '../features/sync/local';
import { resetSupabaseForTests } from '../lib/supabase';
import { FakeFunctionError, installFakeSupabase, type FakeSupabase } from '../test/fakeSupabase';
import { renderApp } from '../test/renderApp';

vi.mock('@supabase/supabase-js', () => import('../test/fakeSupabase').then((m) => m.fakeSupabaseModule));
// jsdom nie ma kanwy ani rozpoznawania tekstu.
vi.mock('../features/beans/scan/ocr', () => ({ readLabel: vi.fn() }));
vi.mock('../features/beans/scan/prepareImage', () => ({ prepareImage: vi.fn() }));
const read = vi.mocked(readLabel);
const prepare = vi.mocked(prepareImage);

let fake: FakeSupabase;
const sent: unknown[] = [];

const photo = () => new File(['jpeg'], 'etykieta.jpg', { type: 'image/jpeg' });

const AI_GUESS = {
  name: 'Kolumbia Huila',
  roaster: 'Palarnia AI',
  roast: 'medium',
  notes: ['chocolate', 'caramel'],
  origin: 'Kolumbia',
  kind: 'single-origin',
  roastDate: '2026-10-01',
};

beforeEach(() => {
  localStorage.clear();
  sessionStorage.clear();
  beansStore.reset();
  aiConsentStore.reset();
  resetSyncTrackingForTests();
  resetSyncEngineForTests();
  resetAuthForTests();
  resetSupabaseForTests();
  fake = installFakeSupabase();
  vi.stubEnv('VITE_AI_ENABLED', 'true');
  sent.length = 0;
  prepare.mockResolvedValue({ image: 'QUJD', mediaType: 'image/jpeg' });
  read.mockResolvedValue('ETIOPIA GUJI\njasno palona\nnuty: jaśmin');
  fake.onFunction('scan-label', (body) => {
    sent.push(body);
    return { guess: AI_GUESS, remaining: 19 };
  });
});

afterEach(() => {
  vi.unstubAllEnvs();
  read.mockReset();
  prepare.mockReset();
});

const consentDialog = () => screen.getByRole('dialog', { name: 'Odczyt etykiety przez AI' });

describe('skan etykiety: AI dla zalogowanych', () => {
  it('AI wyłączone w tej wersji (bez VITE_AI_ENABLED): telefon, bez pytania o zgodę', async () => {
    vi.stubEnv('VITE_AI_ENABLED', '');
    fake.signIn('ania@example.com');
    const { user } = renderApp('/ziarna/nowe');
    await user.upload(await screen.findByLabelText('Zeskanuj etykietę'), photo());

    expect(await screen.findByText(/Odczytał telefon\./)).toBeInTheDocument();
    expect(screen.queryByRole('dialog', { name: 'Odczyt etykiety przez AI' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Odczytuj przez AI' })).not.toBeInTheDocument();
    expect(screen.getByText(/Zdjęcie zostaje w telefonie/)).toBeInTheDocument();
    expect(sent).toHaveLength(0);
  });

  it('przed pierwszym zdjęciem zgoda z informacją, dokąd trafia; potem AI wypełnia formularz', async () => {
    fake.signIn('ania@example.com');
    const { user } = renderApp('/ziarna/nowe');
    await vi.waitFor(() => expect(screen.getByText(/Odczyta ją AI/)).toBeInTheDocument());

    await user.upload(screen.getByLabelText('Zeskanuj etykietę'), photo());
    const dialog = consentDialog();
    expect(dialog).toHaveTextContent('Anthropic');
    expect(dialog).toHaveTextContent('Nie zapisujemy zdjęcia');
    expect(sent).toHaveLength(0);
    await user.click(within(dialog).getByRole('button', { name: 'Zgadzam się, odczytaj przez AI' }));

    expect(await screen.findByText(/Odczytało AI\./)).toBeInTheDocument();
    expect(sent).toEqual([{ image: 'QUJD', mediaType: 'image/jpeg' }]);
    expect(read).not.toHaveBeenCalled();
    expect(screen.getByLabelText('Nazwa')).toHaveValue('Kolumbia Huila');
    expect(screen.getByLabelText(/Palarnia/)).toHaveValue('Palarnia AI');
    expect(screen.getByLabelText(/Data palenia/)).toHaveValue('2026-10-01');
    expect(screen.getByLabelText('średnie')).toBeChecked();
    expect(screen.getByLabelText('czekoladowe')).toBeChecked();
    expect(aiConsentStore.getSnapshot()).toEqual({ labelScan: true });

    // Kolejny skan nie pyta drugi raz.
    await user.upload(screen.getByLabelText('Zeskanuj etykietę'), photo());
    await vi.waitFor(() => expect(sent).toHaveLength(2));
    expect(screen.queryByRole('dialog', { name: 'Odczyt etykiety przez AI' })).not.toBeInTheDocument();
  });

  it('bez zgody: rozpoznawanie w telefonie, a zdjęcie nie wychodzi', async () => {
    fake.signIn('ania@example.com');
    const { user } = renderApp('/ziarna/nowe');
    await vi.waitFor(() => expect(screen.getByText(/Odczyta ją AI/)).toBeInTheDocument());
    await user.upload(screen.getByLabelText('Zeskanuj etykietę'), photo());
    await user.click(within(consentDialog()).getByRole('button', { name: 'Odczytaj w telefonie' }));

    expect(await screen.findByText(/Odczytał telefon\./)).toBeInTheDocument();
    expect(sent).toHaveLength(0);
    expect(screen.getByLabelText('Nazwa')).toHaveValue('Etiopia Guji');
    expect(screen.getByText(/Zdjęcie zostaje w telefonie/)).toBeInTheDocument();
    // Zdanie można zmienić.
    await user.click(screen.getByRole('button', { name: 'Odczytuj przez AI' }));
    await user.click(within(consentDialog()).getByRole('button', { name: 'Zgadzam się, odczytaj przez AI' }));
    expect(aiConsentStore.getSnapshot()).toEqual({ labelScan: true });
  });

  it('po wyczerpaniu limitu dziennego: powrót do rozpoznawania w telefonie z wyjaśnieniem', async () => {
    aiConsentStore.set({ labelScan: true });
    fake.onFunction('scan-label', () => {
      throw new FakeFunctionError(429, { error: { code: 'limit', message: 'limit' } });
    });
    fake.signIn('ania@example.com');
    const { user } = renderApp('/ziarna/nowe');
    await vi.waitFor(() => expect(screen.getByText(/Odczyta ją AI/)).toBeInTheDocument());
    await user.upload(screen.getByLabelText('Zeskanuj etykietę'), photo());

    expect(await screen.findByText(/limit rozpoznawania przez AI się wyczerpał/)).toBeInTheDocument();
    expect(screen.getByText(/Odczytał telefon\./)).toBeInTheDocument();
    expect(read).toHaveBeenCalledTimes(1);
    expect(screen.getByLabelText('Nazwa')).toHaveValue('Etiopia Guji');
  });

  it('błąd AI albo odpowiedź spoza schematu: powrót do telefonu', async () => {
    aiConsentStore.set({ labelScan: true });
    fake.onFunction('scan-label', () => ({ guess: { notes: ['umami'], roast: 'blonde' } }));
    fake.signIn('ania@example.com');
    const { user } = renderApp('/ziarna/nowe');
    await vi.waitFor(() => expect(screen.getByText(/Odczyta ją AI/)).toBeInTheDocument());
    await user.upload(screen.getByLabelText('Zeskanuj etykietę'), photo());
    expect(await screen.findByText(/AI nie odczytało tej etykiety, więc spróbował telefon/)).toBeInTheDocument();

    fake.onFunction('scan-label', () => {
      throw new Error('network');
    });
    await user.upload(screen.getByLabelText('Zeskanuj etykietę'), photo());
    expect(await screen.findByText(/AI nie odpowiedziało, więc etykietę odczytał telefon/)).toBeInTheDocument();
    expect(read).toHaveBeenCalledTimes(2);
  });

  it('bez logowania i bez internetu: tylko telefon, bez pytania o zgodę', async () => {
    const { user } = renderApp('/ziarna/nowe');
    await user.upload(screen.getByLabelText('Zeskanuj etykietę'), photo());
    expect(await screen.findByText(/Odczytał telefon\./)).toBeInTheDocument();
    expect(sent).toHaveLength(0);

    fake.signIn('ania@example.com');
    aiConsentStore.set({ labelScan: true });
    const online = vi.spyOn(navigator, 'onLine', 'get').mockReturnValue(false);
    await user.upload(screen.getByLabelText('Zeskanuj etykietę'), photo());
    await vi.waitFor(() => expect(read).toHaveBeenCalledTimes(2));
    expect(sent).toHaveLength(0);
    online.mockRestore();
  });
});
