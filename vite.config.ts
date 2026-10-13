import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      // Nowa wersja service workera przejmuje aplikację od razu, bez pytania użytkownika.
      registerType: 'autoUpdate',
      // Rejestracja w main.tsx: w aplikacji natywnej (Capacitor) service workera nie ma.
      injectRegister: false,
      // Precache: domyślnie js/css/html + ikony z manifestu + pliki poniżej.
      includeAssets: ['favicon.svg', 'apple-touch-icon-180x180.png'],
      workbox: {
        runtimeCaching: [
          {
            // Skan etykiety: worker, rdzeń WASM i modele językowe tesseract.js z CDN. Po pierwszym
            // skanie działają też bez internetu.
            urlPattern: /^https:\/\/cdn\.jsdelivr\.net\/npm\/(tesseract\.js|tesseract\.js-core|@tesseract\.js-data)[@/]/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'ocr',
              expiration: { maxEntries: 20, maxAgeSeconds: 60 * 60 * 24 * 180 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
        ],
      },
      manifest: {
        id: '/',
        name: 'Barista Companion',
        short_name: 'Barista',
        description:
          'Drinki kawowe, parzenie metodami alternatywnymi i efektowne podanie. W domu, bez ekspresu.',
        lang: 'pl',
        dir: 'ltr',
        start_url: '/',
        scope: '/',
        display: 'standalone',
        orientation: 'portrait',
        background_color: '#faf6f1',
        theme_color: '#faf6f1',
        categories: ['food', 'lifestyle'],
        icons: [
          { src: 'pwa-64x64.png', sizes: '64x64', type: 'image/png' },
          { src: 'pwa-192x192.png', sizes: '192x192', type: 'image/png' },
          { src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png' },
          {
            src: 'maskable-icon-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
    }),
  ],
  test: {
    // Testy E2E (Playwright) leżą w e2e/ i uruchamia je `npm run test:e2e`.
    include: ['src/**/*.test.{ts,tsx}'],
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    // Testy nie czytają backendu z .env.local autora: domyślnie bez konta i bez AI,
    // a testy z backendem włączają go same (vi.stubEnv).
    env: { VITE_SUPABASE_URL: '', VITE_SUPABASE_ANON_KEY: '', VITE_AI_ENABLED: '' },
  },
});
