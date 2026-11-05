import { useEffect, useRef } from 'react';
import { Outlet, ScrollRestoration, useLocation } from 'react-router';
import { useNativeAuthReturn } from '../features/account/useNativeAuthReturn';
import { useColdBrewNotification } from '../features/coldbrew/useColdBrewNotification';
import { useSync } from '../features/sync/useSync';
import { BottomNav } from './BottomNav';

export function AppLayout() {
  const { pathname } = useLocation();
  const firstRender = useRef(true);
  // Gotowe cold brew przypomina się samo (aplikacja na Androida), na każdym ekranie.
  useColdBrewNotification();
  // Aplikacja na Androida: powrót z logowania (link z e-maila, Google) pod własnym adresem aplikacji.
  useNativeAuthReturn();
  // Śledzenie zmian zawsze, a synchronizacja z kontem, gdy ktoś jest zalogowany.
  useSync();

  // Po zmianie ekranu fokus trafia na nagłówek: czytnik ekranu odczyta, gdzie jesteśmy,
  // a nawigacja klawiaturą zaczyna od góry nowego ekranu. Przy pierwszym wejściu nie ruszamy.
  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    document.querySelector<HTMLElement>('main h1')?.focus({ preventScroll: true });
  }, [pathname]);

  return (
    <>
      {/* Dolny odstęp = wysokość nawigacji (4rem) + zapas + bezpieczny obszar iPhone'a. */}
      <main className="mx-auto w-full max-w-md px-4 pt-[max(1.5rem,env(safe-area-inset-top))] pb-[calc(6rem+env(safe-area-inset-bottom))]">
        <Outlet />
      </main>
      <BottomNav />
      <ScrollRestoration />
    </>
  );
}
