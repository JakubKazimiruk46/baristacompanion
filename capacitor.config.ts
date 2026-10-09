import type { CapacitorConfig } from '@capacitor/cli';

// Aplikacja na Androida opakowuje zbudowaną PWA (dist/). Instrukcja: docs/aplikacja-android.md.
const config: CapacitorConfig = {
  // Identyfikator w Google Play: po pierwszej publikacji nie da się go zmienić.
  appId: 'pl.baristacompanion.app',
  appName: 'Barista Companion',
  webDir: 'dist',
  plugins: {
    // index.html ma viewport-fit=cover, więc treść sięga pod paski systemowe, a odstępy
    // daje env(safe-area-inset-*), tak jak w PWA na telefonie.
    SystemBars: { insetsHandling: 'native', initialViewportFitValueHint: 'cover' },
    LocalNotifications: {
      // Ikona na pasku stanu: biała sylwetka szklanki (res/drawable/ic_stat_coffee.xml).
      smallIcon: 'ic_stat_coffee',
      iconColor: '#884e1e',
    },
  },
};

export default config;
