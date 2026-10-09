import { act, cleanup, fireEvent, screen, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { resetAuthForTests } from '../features/account/auth';
import { beansStore } from '../features/beans/store';
import { dosesStore } from '../features/brewing/doseStore';
import { favoritesStore } from '../features/favorites/store';
import { grindersStore } from '../features/grinder/store';
import { journalStore } from '../features/journal/store';
import { recipesStore } from '../features/recipes/store';
import { shoppingStore } from '../features/shelf/shopping';
import { shelfStore } from '../features/shelf/store';
import { BACKUP_FORMAT } from '../features/sync/backup';
import { resetSyncEngineForTests, syncNow } from '../features/sync/engine';
import { resetSyncTrackingForTests, syncLocalStore } from '../features/sync/local';
import { SYNC_DEBOUNCE_MS } from '../features/sync/useSync';
import { resetSupabaseForTests } from '../lib/supabase';
import { installFakeSupabase, type FakeSupabase } from '../test/fakeSupabase';
import { renderApp } from '../test/renderApp';

vi.mock('@supabase/supabase-js', () => import('../test/fakeSupabase').then((m) => m.fakeSupabaseModule));

const download = vi.hoisted(() => ({ blobs: [] as { blob: Blob; name: string }[] }));
vi.mock('../lib/download', () => ({
  downloadBlob: (blob: Blob, name: string) => download.blobs.push({ blob, name }),
}));

let fake: FakeSupabase;

const stores = [beansStore, journalStore, favoritesStore, shelfStore, shoppingStore, dosesStore, grindersStore, recipesStore];

/** Czyste urządzenie: bez danych w przeglądarce i bez sesji. Serwer (atrapa) zostaje ten sam. */
function newDevice() {
  cleanup();
  localStorage.clear();
  sessionStorage.clear();
  stores.forEach((store) => store.reset());
  resetSyncTrackingForTests();
  resetSyncEngineForTests();
  resetAuthForTests();
  resetSupabaseForTests();
}

const rows = (collection: string) => fake.table('user_data').filter((row) => row.collection === collection);
const bean = (name: string) => ({ name, profile: { roast: 'medium' as const, notes: [], kind: 'blend' as const } });

/** Zalogowane urządzenie z aplikacją na ekranie; czeka na pierwszą synchronizację. */
async function openSignedIn(path: string, email = 'ania@example.com') {
  fake.signIn(email);
  const app = renderApp(path);
  await vi.waitFor(() => expect(syncLocalStore.getSnapshot().lastSyncAt).not.toBeNull());
  return app;
}

beforeEach(() => {
  newDevice();
  fake = installFakeSupabase();
  download.blobs = [];
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.useRealTimers();
});

describe('synchronizacja między urządzeniami', () => {
  it('ziarna z jednego urządzenia pojawiają się na drugim po zalogowaniu', async () => {
    beansStore.add(bean('Etiopia Yirgacheffe'));
    await openSignedIn('/ziarna');
    expect(rows('beans')).toHaveLength(1);
    expect(rows('beans')[0]!.payload).toMatchObject({ name: 'Etiopia Yirgacheffe' });

    newDevice();
    await openSignedIn('/ziarna');
    expect(await screen.findByRole('heading', { name: 'Etiopia Yirgacheffe' })).toBeInTheDocument();
  });

  it('zmiana na drugim urządzeniu dociera po powrocie do aplikacji', async () => {
    await openSignedIn('/ziarna');
    // Inne urządzenie zapisało ziarna na koncie.
    await act(() =>
      fake.client.rpc('sync_push', {
        records: [
          {
            collection: 'beans',
            record_id: 'z-telefonu',
            payload: { id: 'z-telefonu', name: 'Kenia AA', profile: { roast: 'light', notes: [], kind: 'single-origin' }, createdAt: 1 },
            updated_at: new Date().toISOString(),
            deleted: false,
          },
        ],
      }),
    );
    expect(screen.queryByRole('heading', { name: 'Kenia AA' })).not.toBeInTheDocument();
    act(() => document.dispatchEvent(new Event('visibilitychange')));
    expect(await screen.findByRole('heading', { name: 'Kenia AA' })).toBeInTheDocument();
  });

  it('usunięcie na jednym urządzeniu usuwa rekord na drugim', async () => {
    const saved = beansStore.add(bean('Brazylia'));
    await openSignedIn('/ziarna');

    newDevice();
    await openSignedIn('/ziarna');
    expect(screen.getByRole('heading', { name: 'Brazylia' })).toBeInTheDocument();
    act(() => beansStore.remove(saved.id));
    await act(() => syncNow());
    expect(rows('beans')[0]).toMatchObject({ deleted: true, payload: null });

    // Pierwsze urządzenie dostaje usunięcie przy następnej synchronizacji.
    newDevice();
    beansStore.add(bean('Nowa kawa'));
    await openSignedIn('/ziarna');
    expect(screen.queryByRole('heading', { name: 'Brazylia' })).not.toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Nowa kawa' })).toBeInTheDocument();
  });

  it('praca offline: zmiany czekają i wysyłają się po odzyskaniu internetu', async () => {
    await openSignedIn('/ziarna');
    const online = vi.spyOn(navigator, 'onLine', 'get').mockReturnValue(false);
    act(() => {
      beansStore.add(bean('Kolumbia'));
      favoritesStore.toggle('mocha');
    });
    await act(() => syncNow());
    expect(rows('beans')).toHaveLength(0);

    online.mockReturnValue(true);
    act(() => window.dispatchEvent(new Event('online')));
    await vi.waitFor(() => expect(rows('beans')).toHaveLength(1));
    expect(rows('favorites')).toEqual([expect.objectContaining({ record_id: 'mocha', payload: true })]);
    online.mockRestore();
  });

  it('lokalna zmiana wysyła się sama chwilę później', async () => {
    await openSignedIn('/ziarna');
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });
    act(() => dosesStore.set('drip', 400));
    expect(rows('doses')).toHaveLength(0);
    await act(async () => {
      vi.advanceTimersByTime(SYNC_DEBOUNCE_MS);
    });
    vi.useRealTimers();
    await vi.waitFor(() => expect(rows('doses')).toEqual([expect.objectContaining({ record_id: 'drip', payload: 400 })]));
  });

  it('pierwsze logowanie łączy dane lokalne z kontem bez duplikatów', async () => {
    // Urządzenie A: ziarna, półka i ulubione na koncie.
    const fromA = beansStore.add(bean('Etiopia'));
    shelfStore.set({ ingredients: ['lod', 'tonik'], methods: [] });
    favoritesStore.toggle('mocha');
    await openSignedIn('/ziarna');

    // Urządzenie B bez konta: te same ziarna dodane drugi raz (inne id), wpis z nimi, inna półka.
    newDevice();
    const fromB = beansStore.add(bean('ETIOPIA'));
    journalStore.add({ methodId: 'drip', coffeeG: 15, waterMl: 250, beanId: fromB.id, beanName: fromB.name });
    shelfStore.set({ ingredients: ['lod', 'miod'], methods: ['drip'] });
    favoritesStore.toggle('mocha');
    favoritesStore.toggle('affogato');
    await openSignedIn('/ziarna');

    expect(beansStore.getSnapshot().map((b) => b.id)).toEqual([fromA.id]);
    expect(journalStore.getSnapshot()[0]).toMatchObject({ beanId: fromA.id });
    expect(shelfStore.getSnapshot()).toEqual({ ingredients: ['lod', 'miod', 'tonik'], methods: ['drip'] });
    expect([...favoritesStore.getSnapshot()].sort()).toEqual(['affogato', 'mocha']);
    expect(rows('beans')).toHaveLength(1);
    expect(rows('favorites')).toHaveLength(2);
    expect(screen.getAllByRole('heading', { name: /Etiopia/i })).toHaveLength(1);
  });

  it('młynki, przepisy, lista zakupów i dziennik też się synchronizują', async () => {
    const grinder = grindersStore.add({ modelId: 'comandante-c40', name: 'Comandante C40 MK4', unit: 'click' });
    grindersStore.setSetting(grinder.id, 'drip', 22);
    recipesStore.add({
      methodId: 'drip',
      name: 'Poranny V60',
      dose: { coffeeG: 15, waterMl: 250 },
      waterTempC: { min: 92, max: 96 },
      grind: 'medium-fine',
      steps: [{ text: 'Zalej {water} ml', action: true }],
    });
    shoppingStore.addForDrink('mocha', ['czekoladowy']);
    journalStore.add({ methodId: 'aeropress', coffeeG: 15, waterMl: 200, rating: 4 });
    await openSignedIn('/');

    newDevice();
    await openSignedIn('/');
    expect(grindersStore.getSnapshot()).toMatchObject({ activeId: grinder.id, grinders: [{ settings: { drip: 22 } }] });
    expect(recipesStore.getSnapshot()[0]).toMatchObject({ name: 'Poranny V60' });
    expect(shoppingStore.getSnapshot()).toEqual([{ id: 'czekoladowy', drinkIds: ['mocha'], bought: false }]);
    expect(journalStore.getSnapshot()[0]).toMatchObject({ methodId: 'aeropress', rating: 4 });
  });

  it('uszkodzone albo nieznane rekordy z serwera są pomijane', async () => {
    fake.table('user_data').push(
      { user_id: 'user-1', collection: 'beans', record_id: 'zly', payload: { name: 5 }, updated_at: new Date().toISOString(), deleted: false, synced_at: new Date().toISOString() },
      { user_id: 'user-1', collection: 'favorites', record_id: 'nie-ma-takiego-napoju', payload: true, updated_at: new Date().toISOString(), deleted: false, synced_at: new Date().toISOString() },
    );
    await openSignedIn('/ziarna');
    expect(beansStore.getSnapshot()).toEqual([]);
    expect(favoritesStore.getSnapshot()).toEqual([]);
  });
});

describe('stan synchronizacji na ekranie konta', () => {
  it('pokazuje ostatnią synchronizację i błąd z ponowieniem', async () => {
    const { user } = await openSignedIn('/konto');
    const section = await screen.findByRole('region', { name: 'Synchronizacja' });
    expect(within(section).getByRole('status')).toHaveTextContent(/Ostatnia synchronizacja: dziś o/);

    fake.failNext('user_data.select', { message: 'boom' });
    await user.click(within(section).getByRole('button', { name: 'Synchronizuj teraz' }));
    expect(await within(section).findByRole('alert')).toHaveTextContent('Nie udało się zsynchronizować');

    await user.click(within(section).getByRole('button', { name: 'Synchronizuj teraz' }));
    await vi.waitFor(() => expect(within(section).queryByRole('alert')).not.toBeInTheDocument());
  });
});

describe('kopia zapasowa (bez konta)', () => {
  it('zapis i wczytanie kopii przywraca dane, a nowsza wersja na urządzeniu zostaje', async () => {
    vi.unstubAllEnvs();
    beansStore.add(bean('Etiopia'));
    favoritesStore.toggle('mocha');
    const { user } = renderApp('/konto');
    expect(screen.getByRole('heading', { name: 'Konto nie jest dostępne w tej wersji' })).toBeInTheDocument();
    const section = screen.getByRole('region', { name: 'Kopia zapasowa' });
    await user.click(within(section).getByRole('button', { name: 'Zapisz kopię' }));
    expect(download.blobs[0]!.name).toMatch(/^barista-companion-kopia-\d{4}-\d{2}-\d{2}\.json$/);
    const text = await download.blobs[0]!.blob.text();
    expect(JSON.parse(text)).toMatchObject({ format: BACKUP_FORMAT, version: 2 });

    // Nowe urządzenie: kopia wraca.
    newDevice();
    vi.unstubAllEnvs();
    renderApp('/konto');
    const input = screen.getByLabelText('Wczytaj kopię');
    fireEvent.change(input, { target: { files: [new File([text], 'kopia.json', { type: 'application/json' })] } });
    expect(await screen.findByText('Wczytano kopię: 2 nowe rekordy, 0 zaktualizowanych.')).toBeInTheDocument();
    expect(beansStore.getSnapshot()[0]).toMatchObject({ name: 'Etiopia' });
    expect(favoritesStore.getSnapshot()).toEqual(['mocha']);
  });

  it('uszkodzony plik daje komunikat i niczego nie zmienia', async () => {
    vi.unstubAllEnvs();
    beansStore.add(bean('Etiopia'));
    renderApp('/konto');
    const input = screen.getByLabelText('Wczytaj kopię');
    fireEvent.change(input, { target: { files: [new File(['{"format":"inny"}'], 'x.json')] } });
    expect(await screen.findByRole('alert')).toHaveTextContent('To nie jest kopia Barista Companion');
    fireEvent.change(input, { target: { files: [new File(['nie json'], 'x.json')] } });
    expect(await screen.findByRole('alert')).toHaveTextContent('plik jest uszkodzony');
    expect(beansStore.getSnapshot()).toHaveLength(1);
  });
});
