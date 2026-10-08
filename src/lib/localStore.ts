import { useSyncExternalStore } from 'react';

/**
 * Wartość zapisana w localStorage (albo sessionStorage), wspólna dla wszystkich komponentów
 * (useSyncExternalStore). Magazyn bywa niedostępny (tryb prywatny, zablokowane dane witryny):
 * wtedy wartość żyje tylko w pamięci, a isPersistent() zwraca false. Aplikacja nie może się
 * przez to wysypać.
 */
export function createLocalStore<T>(
  key: string,
  parse: (value: unknown) => T,
  fallback: T,
  storage: () => Storage = () => localStorage,
) {
  let cache: { value: T } | null = null;
  let persistent = true;
  const listeners = new Set<() => void>();

  function load(): T {
    let raw: string | null;
    try {
      raw = storage().getItem(key);
    } catch {
      persistent = false;
      return fallback;
    }
    persistent = true;
    if (raw === null) return fallback;
    try {
      return parse(JSON.parse(raw));
    } catch {
      return fallback;
    }
  }

  function read(): T {
    cache ??= { value: load() };
    return cache.value;
  }

  const notify = () => listeners.forEach((listener) => listener());

  function onStorage(event: StorageEvent) {
    // Zmiana w innej karcie: wczytaj na nowo.
    if (event.key === key) {
      cache = null;
      notify();
    }
  }

  return {
    subscribe(listener: () => void) {
      if (listeners.size === 0) window.addEventListener('storage', onStorage);
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
        if (listeners.size === 0) window.removeEventListener('storage', onStorage);
      };
    },
    getSnapshot: read,
    set(value: T) {
      cache = { value };
      try {
        storage().setItem(key, JSON.stringify(value));
        persistent = true;
      } catch {
        persistent = false;
      }
      notify();
    },
    isPersistent() {
      read();
      return persistent;
    },
    /** Dla testów: zapomnij stan w pamięci (jak po przeładowaniu strony). */
    reset() {
      cache = null;
      persistent = true;
    },
  };
}

export type LocalStore<T> = ReturnType<typeof createLocalStore<T>>;

export function useLocalStore<T>(store: LocalStore<T>): T {
  return useSyncExternalStore(store.subscribe, store.getSnapshot);
}
