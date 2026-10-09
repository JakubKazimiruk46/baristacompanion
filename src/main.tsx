import { Capacitor } from '@capacitor/core';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { createBrowserRouter } from 'react-router';
import { RouterProvider } from 'react-router/dom';
import { routes } from './routes';
import './index.css';

const router = createBrowserRouter(routes);

// Service worker tylko w PWA. Aplikacja natywna ma pliki w paczce, a cache przeglądarki mógłby
// podać starą wersję po aktualizacji z Google Play albo z pliku APK.
if (!Capacitor.isNativePlatform()) {
  void import('virtual:pwa-register').then(({ registerSW }) => registerSW({ immediate: true }));
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>,
);
