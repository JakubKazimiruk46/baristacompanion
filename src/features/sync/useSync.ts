import { useEffect } from 'react';
import { useAuth } from '../account/auth';
import { syncNow } from './engine';
import { onLocalChange, startTracking } from './local';

/** Po lokalnej zmianie czekamy chwilę: kilka szybkich zmian wysyła się razem. */
export const SYNC_DEBOUNCE_MS = 2000;

/**
 * Śledzenie zmian i synchronizacja w tle (AppLayout). Dla zalogowanego: po zalogowaniu i starcie,
 * po powrocie do aplikacji, po odzyskaniu internetu i chwilę po każdej zmianie.
 */
export function useSync() {
  const auth = useAuth();
  const userId = auth.status === 'signed-in' ? auth.user.id : null;

  useEffect(() => {
    startTracking();
  }, []);

  useEffect(() => {
    if (!userId) return;
    void syncNow();
    let timer: ReturnType<typeof setTimeout> | undefined;
    const later = () => {
      clearTimeout(timer);
      timer = setTimeout(() => void syncNow(), SYNC_DEBOUNCE_MS);
    };
    const onVisible = () => {
      if (document.visibilityState === 'visible') void syncNow();
    };
    const onOnline = () => void syncNow();
    const stopListening = onLocalChange(later);
    document.addEventListener('visibilitychange', onVisible);
    window.addEventListener('online', onOnline);
    return () => {
      clearTimeout(timer);
      stopListening();
      document.removeEventListener('visibilitychange', onVisible);
      window.removeEventListener('online', onOnline);
    };
  }, [userId]);
}
