import { Capacitor } from '@capacitor/core';
import { createLocalStore, useLocalStore } from './localStore';

/**
 * Lokalne powiadomienia w aplikacji na Androida (Capacitor). Przychodzą też przy zablokowanym
 * ekranie. W przeglądarce (PWA) wszystko tu nic nie robi: zostają sygnały w aplikacji i Wake Lock.
 * Wtyczka ładuje się dynamicznie, dopiero w wersji natywnej.
 */

/** Stałe id: naraz trwa najwyżej jeden krok parzenia i jedno cold brew. */
export const NOTIFICATION_IDS = { brewStep: 1, coldBrew: 2 } as const;
export const CHANNEL_ID = 'parzenie';

export const isNativeApp = () => Capacitor.isNativePlatform();

type Plugin = (typeof import('@capacitor/local-notifications'))['LocalNotifications'];

let plugin: Promise<Plugin> | null = null;

function load(): Promise<Plugin> {
  plugin ??= import('@capacitor/local-notifications').then(async ({ LocalNotifications }) => {
    // Kanał z dźwiękiem i wysoką ważnością: powiadomienie wyskakuje na ekranie i dzwoni.
    await LocalNotifications.createChannel({
      id: CHANNEL_ID,
      name: 'Parzenie',
      description: 'Koniec kroku ze stoperem i gotowe cold brew',
      importance: 5,
      visibility: 1,
      vibration: true,
    }).catch(() => {});
    return LocalNotifications;
  });
  return plugin;
}

// Operacje po kolei: „odwołaj” zaraz po „zaplanuj” nie może wyprzedzić planowania.
let queue: Promise<unknown> = Promise.resolve();
function enqueue<T>(operation: () => Promise<T>, fallback: T): Promise<T> {
  const result = queue.then(operation).catch(() => fallback);
  queue = result;
  return result;
}

export type NotificationPermission = 'granted' | 'denied' | 'prompt' | 'unsupported';

export async function notificationPermission(): Promise<NotificationPermission> {
  if (!isNativeApp()) return 'unsupported';
  try {
    const { display } = await (await load()).checkPermissions();
    return display === 'granted' ? 'granted' : display === 'denied' ? 'denied' : 'prompt';
  } catch {
    return 'unsupported';
  }
}

/** Systemowe okno zgody (Android 13+). true: zgoda jest. */
export async function requestNotificationPermission(): Promise<boolean> {
  if (!isNativeApp()) return false;
  try {
    const { display } = await (await load()).requestPermissions();
    markAsked('asked');
    return display === 'granted';
  } catch {
    return false;
  }
}

/** Czy Android pozwala na dokładny czas (Android 12+: „Alarmy i przypomnienia”). */
export async function exactAlarmsAllowed(): Promise<boolean> {
  if (!isNativeApp()) return false;
  try {
    return (await (await load()).checkExactNotificationSetting()).exact_alarm === 'granted';
  } catch {
    return false;
  }
}

/** Otwiera ustawienie „Alarmy i przypomnienia” dla aplikacji. */
export async function openExactAlarmSettings(): Promise<boolean> {
  if (!isNativeApp()) return false;
  try {
    const { exact_alarm } = await (await load()).changeExactNotificationSetting();
    markAsked('exactAsked');
    return exact_alarm === 'granted';
  } catch {
    return false;
  }
}

export interface PlannedNotification {
  id: number;
  /** Kiedy (ms od epoki). */
  at: number;
  title: string;
  body: string;
}

/**
 * Planuje powiadomienie i zastępuje poprzednie o tym samym id. false: nie da się (przeglądarka,
 * brak zgody, czas już minął). Bez zgody na dokładny czas powiadomienie jest przybliżone:
 * wtyczka nie otwiera wtedy ustawień w trakcie parzenia.
 */
export function scheduleNotification(notification: PlannedNotification): Promise<boolean> {
  if (!isNativeApp() || notification.at <= Date.now()) return Promise.resolve(false);
  return enqueue(async () => {
    const notifications = await load();
    if ((await notifications.checkPermissions()).display !== 'granted') return false;
    const exact = (await notifications.checkExactNotificationSetting()).exact_alarm === 'granted';
    await notifications.cancel({ notifications: [{ id: notification.id }] });
    await notifications.schedule({
      notifications: [
        {
          id: notification.id,
          title: notification.title,
          body: notification.body,
          channelId: CHANNEL_ID,
          isExactNotification: exact,
          schedule: { at: new Date(notification.at), allowWhileIdle: true },
        },
      ],
    });
    return true;
  }, false);
}

/**
 * Odwołuje zaplanowane powiadomienie. Takie, które już przyszło, zdejmuje z ekranu tylko wtedy,
 * gdy aplikacja jest na wierzchu: w tle (zablokowany ekran) ma zostać, aż użytkownik je zobaczy.
 */
export function cancelNotification(id: number): Promise<void> {
  if (!isNativeApp()) return Promise.resolve();
  const visible = document.visibilityState === 'visible';
  return enqueue(async () => {
    const notifications = await load();
    await notifications.cancel({ notifications: [{ id }] });
    if (visible) await notifications.removeDeliveredNotificationsById({ ids: [id] });
  }, undefined);
}

/** Zdejmuje z ekranu powiadomienie, które już przyszło (np. po powrocie do aplikacji). */
export function removeDeliveredNotification(id: number): Promise<void> {
  if (!isNativeApp()) return Promise.resolve();
  return enqueue(async () => {
    await (await load()).removeDeliveredNotificationsById({ ids: [id] });
  }, undefined);
}

/** O co aplikacja już pytała (albo użytkownik odpowiedział „Nie teraz”). */
export interface NotificationsState {
  /** Zgoda na powiadomienia. */
  asked: boolean;
  /** Zgoda na dokładny czas („Alarmy i przypomnienia”). */
  exactAsked: boolean;
}

export const NOTIFICATIONS_KEY = 'barista-companion.notifications.v1';

const flag = (value: unknown, key: keyof NotificationsState) =>
  typeof value === 'object' && value !== null && (value as Record<string, unknown>)[key] === true;

export const notificationsStore = createLocalStore<NotificationsState>(
  NOTIFICATIONS_KEY,
  (value) => ({ asked: flag(value, 'asked'), exactAsked: flag(value, 'exactAsked') }),
  { asked: false, exactAsked: false },
);

export function markAsked(key: keyof NotificationsState) {
  notificationsStore.set({ ...notificationsStore.getSnapshot(), [key]: true });
}

export function useNotificationsState(): NotificationsState {
  return useLocalStore(notificationsStore);
}

/** Dla testów: zapomnij załadowaną wtyczkę. */
export function resetNotificationsForTests() {
  plugin = null;
  queue = Promise.resolve();
}
