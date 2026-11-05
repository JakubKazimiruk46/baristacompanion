import { defineConfig, devices } from '@playwright/test';

// Testy E2E na zbudowanej aplikacji (npm run preview), w przeglądarce Edge zainstalowanej
// w Windowsie, więc nie trzeba pobierać osobnej przeglądarki Playwrighta.
// Na komputerze bez Edge: `npx playwright install chromium` i usuń `channel` poniżej.
export default defineConfig({
  testDir: 'e2e',
  fullyParallel: true,
  // Na runnerze GitHuba przejście między ekranami potrafi się zawiesić (stary obraz zasłania stronę).
  retries: process.env.CI ? 1 : 0,
  reporter: 'list',
  use: {
    ...devices['Pixel 7'],
    channel: 'msedge',
    baseURL: 'http://localhost:4173',
    locale: 'pl-PL',
    // Service worker z cache mógłby podać starą wersję po przebudowaniu.
    serviceWorkers: 'block',
    trace: 'retain-on-failure',
  },
  webServer: {
    command: 'npm run preview -- --port 4173 --strictPort',
    url: 'http://localhost:4173',
    reuseExistingServer: true,
  },
});
