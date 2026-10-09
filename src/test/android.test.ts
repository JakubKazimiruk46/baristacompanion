import { describe, expect, it } from 'vitest';
import config from '../../capacitor.config';

// Aplikacja na Androida (Capacitor): ta sama nazwa i ikony co PWA, pliki z dist/, bez service workera.
const fs: {
  readFileSync(path: string, encoding: 'utf8'): string;
  existsSync(path: string): boolean;
} = await import(/* @vite-ignore */ 'node:' + 'fs');

const res = 'android/app/src/main/res';

describe('capacitor.config.ts', () => {
  it('opakowuje zbudowaną PWA pod nazwą z manifestu', () => {
    expect(config.webDir).toBe('dist');
    expect(config.appName).toBe('Barista Companion');
    expect(fs.readFileSync('vite.config.ts', 'utf8')).toContain(`name: '${config.appName}'`);
    expect(fs.readFileSync(`${res}/values/strings.xml`, 'utf8')).toContain(
      `<string name="app_name">${config.appName}</string>`,
    );
    expect(fs.readFileSync('android/app/build.gradle', 'utf8')).toContain(`applicationId "${config.appId}"`);
  });

  it('ikona powiadomień istnieje w zasobach Androida', () => {
    const icon = (config.plugins?.LocalNotifications as { smallIcon: string }).smallIcon;
    expect(fs.existsSync(`${res}/drawable/${icon}.xml`)).toBe(true);
  });

  it('ikony aplikacji są w każdej gęstości ekranu', () => {
    for (const density of ['mdpi', 'hdpi', 'xhdpi', 'xxhdpi', 'xxxhdpi']) {
      for (const file of ['ic_launcher.png', 'ic_launcher_round.png', 'ic_launcher_foreground.png']) {
        expect(fs.existsSync(`${res}/mipmap-${density}/${file}`), `${density}/${file}`).toBe(true);
      }
    }
  });
});

describe('service worker', () => {
  it('rejestruje się tylko poza aplikacją natywną', () => {
    expect(fs.readFileSync('vite.config.ts', 'utf8')).toContain('injectRegister: false');
    const main = fs.readFileSync('src/main.tsx', 'utf8');
    expect(main).toMatch(/if \(!Capacitor\.isNativePlatform\(\)\) \{\s+void import\('virtual:pwa-register'\)/);
  });
});
