import { useEffect } from 'react';
import { useNavigate } from 'react-router';
import { isNativeApp } from '../../lib/notifications';
import { backendEnabled } from '../../lib/supabase';
import { authNoticeStore, completeNativeSignIn } from './auth';
import { listenForAuthReturn } from './nativeAuth';
import { returnStore } from './returnTo';

/**
 * Aplikacja na Androida: powrót z logowania (link z e-maila, Google) otwiera aplikację pod
 * pl.baristacompanion.app://konto?code=…. Kod zamienia się na sesję, a potem wracamy tam, skąd
 * ktoś poszedł się zalogować (albo na ekran konta). W PWA nic nie robi.
 */
export function useNativeAuthReturn() {
  const navigate = useNavigate();
  useEffect(() => {
    if (!isNativeApp() || !backendEnabled()) return;
    void listenForAuthReturn(async (result) => {
      if ('error' in result) {
        authNoticeStore.set('Logowanie się nie udało: link wygasł, został już użyty albo przerwano logowanie. Spróbuj ponownie.');
        navigate('/konto');
        return;
      }
      // Adres powrotu przejmujemy przed logowaniem: inaczej ekran konta (jeśli jest otwarty)
      // zobaczy zalogowanie pierwszy i też by nawigował.
      const target = returnStore.getSnapshot();
      returnStore.set(null);
      const outcome = await completeNativeSignIn(result.code);
      if (!outcome.ok) {
        returnStore.set(target);
        authNoticeStore.set(outcome.message);
        navigate('/konto');
        return;
      }
      navigate(target ?? '/konto', { replace: true });
    });
    // Nasłuch raz na uruchomienie (listenForAuthReturn sam pilnuje, żeby nie dublować).
  }, [navigate]);
}
