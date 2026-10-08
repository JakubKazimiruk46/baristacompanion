import { useEffect } from 'react';

/**
 * Nie pozwala wygasić ekranu, póki active = true. Przeglądarka zwalnia blokadę, gdy karta
 * jest w tle, więc po powrocie prosimy o nią jeszcze raz. Bez Wake Lock API nic nie robi.
 */
export function useWakeLock(active: boolean): void {
  useEffect(() => {
    if (!active || !('wakeLock' in navigator)) return;
    let sentinel: WakeLockSentinel | null = null;
    let cancelled = false;

    const request = async () => {
      try {
        const lock = await navigator.wakeLock.request('screen');
        if (cancelled) void lock.release();
        else sentinel = lock;
      } catch {
        // Np. tryb oszczędzania baterii. Parzenie działa dalej, tylko ekran może zgasnąć.
      }
    };
    const onVisibility = () => {
      if (document.visibilityState === 'visible') void request();
    };

    void request();
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      cancelled = true;
      document.removeEventListener('visibilitychange', onVisibility);
      sentinel?.release().catch(() => {});
    };
  }, [active]);
}
