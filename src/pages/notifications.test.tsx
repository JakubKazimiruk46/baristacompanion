import { screen, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { dosesStore } from '../features/brewing/doseStore';
import { coldBrewStore } from '../features/coldbrew/store';
import { journalStore } from '../features/journal/store';
import { notificationsStore, resetNotificationsForTests } from '../lib/notifications';
import { renderApp } from '../test/renderApp';

// Wersja natywna (Capacitor) z podmienioną wtyczką powiadomień: w jsdom nie ma Androida.
const native = vi.hoisted(() => ({ value: true }));
vi.mock('@capacitor/core', () => ({ Capacitor: { isNativePlatform: () => native.value } }));

const plugin = vi.hoisted(() => ({
  createChannel: vi.fn(async () => {}),
  checkPermissions: vi.fn(async () => ({ display: 'granted' })),
  requestPermissions: vi.fn(async () => ({ display: 'granted' })),
  checkExactNotificationSetting: vi.fn(async () => ({ exact_alarm: 'granted' })),
  changeExactNotificationSetting: vi.fn(async () => ({ exact_alarm: 'granted' })),
  schedule: vi.fn(async () => ({ notifications: [] })),
  cancel: vi.fn(async () => {}),
  removeDeliveredNotificationsById: vi.fn(async () => {}),
}));
vi.mock('@capacitor/local-notifications', () => ({ LocalNotifications: plugin }));

type Scheduled = { id: number; title: string; body: string; isExactNotification: boolean; schedule: { at: Date } };
const scheduled = () =>
  plugin.schedule.mock.calls.map((call) => (call as unknown as [{ notifications: Scheduled[] }])[0].notifications[0]!);
const cancelledIds = () =>
  plugin.cancel.mock.calls.map((call) => (call as unknown as [{ notifications: { id: number }[] }])[0].notifications[0]!.id);

beforeEach(() => {
  localStorage.clear();
  sessionStorage.clear();
  journalStore.reset();
  dosesStore.reset();
  coldBrewStore.reset();
  notificationsStore.reset();
  resetNotificationsForTests();
  native.value = true;
  vi.clearAllMocks();
  plugin.checkPermissions.mockResolvedValue({ display: 'granted' });
  plugin.checkExactNotificationSetting.mockResolvedValue({ exact_alarm: 'granted' });
});

afterEach(() => {
  native.value = true;
});

/** Drip: krok 3 to „Zalej … i odczekaj” (40 s, stoper uruchamia się ręcznie). */
async function openDripStep3() {
  const app = renderApp('/parzenie/drip/start');
  await app.user.click(screen.getByRole('button', { name: 'Dalej' }));
  await app.user.click(screen.getByRole('button', { name: 'Dalej' }));
  expect(screen.getByRole('heading', { level: 2, name: 'Zalej 40 ml wody i odczekaj' })).toBeInTheDocument();
  return app;
}

describe('powiadomienia w parzeniu (aplikacja na Androida)', () => {
  it('start stopera planuje powiadomienie na koniec kroku, z następnym krokiem w treści', async () => {
    const { user } = await openDripStep3();
    const before = Date.now();
    await user.click(screen.getByRole('button', { name: 'Start' }));

    await vi.waitFor(() => expect(plugin.schedule).toHaveBeenCalledTimes(1));
    const notification = scheduled()[0]!;
    expect(notification).toMatchObject({
      id: 1,
      title: 'Czas minął',
      body: 'Teraz: Dolewaj powoli wodę do 150 ml',
      isExactNotification: true,
    });
    const at = notification.schedule.at.getTime();
    expect(at).toBeGreaterThanOrEqual(before + 40_000);
    expect(at).toBeLessThanOrEqual(Date.now() + 40_000);
    expect(plugin.createChannel).toHaveBeenCalledWith(expect.objectContaining({ id: 'parzenie', importance: 5 }));
  });

  it('pauza i reset odwołują powiadomienie, wznowienie planuje je od nowa', async () => {
    const { user } = await openDripStep3();
    await user.click(screen.getByRole('button', { name: 'Start' }));
    await vi.waitFor(() => expect(plugin.schedule).toHaveBeenCalledTimes(1));

    await user.click(screen.getByRole('button', { name: 'Pauza' }));
    await vi.waitFor(() => expect(cancelledIds()).toContain(1));
    const cancelsAfterPause = plugin.cancel.mock.calls.length;

    await user.click(screen.getByRole('button', { name: 'Wznów' }));
    await vi.waitFor(() => expect(plugin.schedule).toHaveBeenCalledTimes(2));

    await user.click(screen.getByRole('button', { name: 'Reset' }));
    await vi.waitFor(() => expect(plugin.cancel.mock.calls.length).toBeGreaterThan(cancelsAfterPause + 1));
    // Po resecie nic nie czeka w kolejce: ostatnia operacja to odwołanie.
    expect(plugin.schedule).toHaveBeenCalledTimes(2);
  });

  it('przejście dalej i cofnięcie odwołują powiadomienie, a krok „tylko czekasz” planuje własne', async () => {
    const { user } = await openDripStep3();
    await user.click(screen.getByRole('button', { name: 'Start' }));
    await vi.waitFor(() => expect(plugin.schedule).toHaveBeenCalledTimes(1));

    await user.click(screen.getByRole('button', { name: 'Dalej' }));
    await vi.waitFor(() => expect(cancelledIds()).toContain(1));
    // Krok 4 ma czas, ale z działaniem: stoper (i powiadomienie) czeka na „Start”.
    expect(plugin.schedule).toHaveBeenCalledTimes(1);

    await user.click(screen.getByRole('button', { name: 'Dalej' }));
    await user.click(screen.getByRole('button', { name: 'Dalej' }));
    // „Poczekaj, aż woda przepłynie” rusza sam, więc powiadomienie też.
    await vi.waitFor(() => expect(plugin.schedule).toHaveBeenCalledTimes(2));
    expect(scheduled()[1]!.body).toBe('Teraz: Zdejmij drip i zamieszaj kawę');

    const cancels = plugin.cancel.mock.calls.length;
    await user.click(screen.getByRole('button', { name: 'Wstecz' }));
    await vi.waitFor(() => expect(plugin.cancel.mock.calls.length).toBeGreaterThan(cancels));
  });

  it('wyjście z parzenia odwołuje powiadomienie', async () => {
    const { user, router } = await openDripStep3();
    await user.click(screen.getByRole('button', { name: 'Start' }));
    await vi.waitFor(() => expect(plugin.schedule).toHaveBeenCalledTimes(1));
    const cancels = plugin.cancel.mock.calls.length;

    await router.navigate('/napoje');
    await vi.waitFor(() => expect(plugin.cancel.mock.calls.length).toBeGreaterThan(cancels));
    expect(cancelledIds().at(-1)).toBe(1);
  });

  it('bez zgody na dokładny czas powiadomienie jest przybliżone (bez otwierania ustawień)', async () => {
    plugin.checkExactNotificationSetting.mockResolvedValue({ exact_alarm: 'denied' });
    notificationsStore.set({ asked: true, exactAsked: true });
    const { user } = await openDripStep3();
    await user.click(screen.getByRole('button', { name: 'Start' }));
    await vi.waitFor(() => expect(plugin.schedule).toHaveBeenCalledTimes(1));
    expect(scheduled()[0]!.isExactNotification).toBe(false);
    expect(plugin.changeExactNotificationSetting).not.toHaveBeenCalled();
  });

  it('bez zgody na powiadomienia niczego nie planuje, a parzenie działa', async () => {
    plugin.checkPermissions.mockResolvedValue({ display: 'denied' });
    const { user } = await openDripStep3();
    await user.click(screen.getByRole('button', { name: 'Start' }));
    expect(screen.getByRole('button', { name: 'Pauza' })).toBeInTheDocument();
    await vi.waitFor(() => expect(plugin.checkPermissions).toHaveBeenCalled());
    expect(plugin.schedule).not.toHaveBeenCalled();
    expect(screen.queryByRole('region', { name: 'Powiadomienie, gdy minie czas' })).not.toBeInTheDocument();
  });

  it('w przeglądarce (PWA) moduł nic nie robi', async () => {
    native.value = false;
    const { user } = await openDripStep3();
    await user.click(screen.getByRole('button', { name: 'Start' }));
    await user.click(screen.getByRole('button', { name: 'Pauza' }));
    expect(plugin.schedule).not.toHaveBeenCalled();
    expect(plugin.cancel).not.toHaveBeenCalled();
    expect(plugin.createChannel).not.toHaveBeenCalled();
  });
});

describe('zgoda na powiadomienia', () => {
  it('najpierw wyjaśnienie, potem systemowe okno i prośba o dokładny czas', async () => {
    plugin.checkPermissions.mockResolvedValue({ display: 'prompt' });
    plugin.checkExactNotificationSetting.mockResolvedValue({ exact_alarm: 'denied' });
    plugin.requestPermissions.mockImplementation(async () => {
      plugin.checkPermissions.mockResolvedValue({ display: 'granted' });
      return { display: 'granted' };
    });
    const { user } = renderApp('/parzenie/drip/start');

    const ask = await screen.findByRole('region', { name: 'Powiadomienie, gdy minie czas' });
    expect(ask).toHaveTextContent('także przy zablokowanym ekranie');
    expect(plugin.requestPermissions).not.toHaveBeenCalled();
    await user.click(within(ask).getByRole('button', { name: 'Włącz powiadomienia' }));
    expect(plugin.requestPermissions).toHaveBeenCalledTimes(1);

    const exact = await screen.findByRole('region', { name: 'Powiadomienie co do sekundy' });
    await user.click(within(exact).getByRole('button', { name: 'Otwórz ustawienia' }));
    expect(plugin.changeExactNotificationSetting).toHaveBeenCalledTimes(1);
    await vi.waitFor(() => expect(screen.queryByRole('region', { name: 'Powiadomienie co do sekundy' })).not.toBeInTheDocument());
    expect(notificationsStore.getSnapshot()).toEqual({ asked: true, exactAsked: true });
  });

  it('„Nie teraz” chowa prośbę na stałe, a parzenie działa dalej', async () => {
    plugin.checkPermissions.mockResolvedValue({ display: 'prompt' });
    const { user } = renderApp('/parzenie/drip/start');
    const ask = await screen.findByRole('region', { name: 'Powiadomienie, gdy minie czas' });
    await user.click(within(ask).getByRole('button', { name: 'Nie teraz' }));
    expect(screen.queryByRole('region', { name: 'Powiadomienie, gdy minie czas' })).not.toBeInTheDocument();
    expect(notificationsStore.getSnapshot().asked).toBe(true);
    expect(plugin.requestPermissions).not.toHaveBeenCalled();
    await user.click(screen.getByRole('button', { name: 'Dalej' }));
    expect(screen.getByText('Krok 2 z', { exact: false })).toBeInTheDocument();
  });

  it('odmowa w systemowym oknie: prośba znika, aplikacja działa jak PWA', async () => {
    plugin.checkPermissions.mockResolvedValue({ display: 'prompt' });
    plugin.requestPermissions.mockImplementation(async () => {
      plugin.checkPermissions.mockResolvedValue({ display: 'denied' });
      return { display: 'denied' };
    });
    const { user } = renderApp('/parzenie/drip/start');
    const ask = await screen.findByRole('region', { name: 'Powiadomienie, gdy minie czas' });
    await user.click(within(ask).getByRole('button', { name: 'Włącz powiadomienia' }));
    await vi.waitFor(() => expect(screen.queryByRole('region', { name: /Powiadomienie/ })).not.toBeInTheDocument());
  });
});

describe('powiadomienie o gotowym cold brew', () => {
  it('zalanie planuje powiadomienie na godzinę gotowości, przerwanie je odwołuje', async () => {
    const { user } = renderApp('/parzenie/cold-brew/start');
    await user.click(screen.getByRole('button', { name: 'Zalane, zaczynam macerację' }));

    await vi.waitFor(() => expect(scheduled().some((n) => n.id === 2)).toBe(true));
    const run = coldBrewStore.getSnapshot()!;
    const notification = scheduled().find((n) => n.id === 2)!;
    expect(notification.title).toBe('Cold brew gotowe');
    expect(notification.schedule.at.getTime()).toBe(run.startedAt + run.hours * 3_600_000);

    await user.click(screen.getByRole('button', { name: 'Przerwij' }));
    await user.click(screen.getByRole('button', { name: 'Przerwij macerację' }));
    await vi.waitFor(() => expect(cancelledIds().at(-1)).toBe(2));
  });

  it('zakończenie maceracji odwołuje powiadomienie', async () => {
    coldBrewStore.set({ startedAt: Date.now() - 1000, hours: 16, variantId: 'klasyczne' });
    const { user } = renderApp('/parzenie/cold-brew/start');
    await vi.waitFor(() => expect(scheduled().some((n) => n.id === 2)).toBe(true));
    await user.click(screen.getByRole('button', { name: 'Przecedź teraz' }));
    await user.click(screen.getByRole('button', { name: 'Zakończ' }));
    await vi.waitFor(() => expect(cancelledIds().at(-1)).toBe(2));
  });
});
