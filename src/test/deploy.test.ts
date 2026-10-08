import { describe, expect, it } from 'vitest';

// Konfiguracja wdrożenia (vercel.json): odświeżenie podstrony nie może dać 404,
// a service worker nie może utknąć w cache przeglądarki.
const fs: { readFileSync(path: string, encoding: 'utf8'): string } = await import(/* @vite-ignore */ 'node:' + 'fs');

type Header = { key: string; value: string };
type Config = {
  outputDirectory: string;
  rewrites: { source: string; destination: string }[];
  headers: { source: string; headers: Header[] }[];
};
const config = JSON.parse(fs.readFileSync('vercel.json', 'utf8')) as Config;

/** Nagłówki dla ścieżki (źródło w stylu Vercela: /(a|b) albo /assets/(.*)). */
function headersFor(path: string): Header[] {
  return config.headers
    .filter(({ source }) => new RegExp(`^${source.replace(/\./g, '\\.').replace(/\\\.\*/g, '.*')}$`).test(path))
    .flatMap(({ headers }) => headers);
}

const cacheControl = (path: string) => headersFor(path).find((h) => h.key === 'Cache-Control')?.value;

describe('vercel.json', () => {
  it('build trafia do dist, a każda ścieżka aplikacji do index.html', () => {
    expect(config.outputDirectory).toBe('dist');
    expect(config.rewrites).toEqual([{ source: '/(.*)', destination: '/index.html' }]);
  });

  it.each(['/sw.js', '/registerSW.js', '/manifest.webmanifest', '/index.html'])(
    '%s zawsze sprawdzany na serwerze (nowa wersja dociera do użytkowników)',
    (path) => {
      expect(cacheControl(path)).toBe('public, max-age=0, must-revalidate');
    },
  );

  it('pliki z hashem w nazwie są cache’owane na rok', () => {
    expect(cacheControl('/assets/index-CPXdj2c-.js')).toBe('public, max-age=31536000, immutable');
  });

  it('manifest ma właściwy typ', () => {
    expect(headersFor('/manifest.webmanifest')).toContainEqual({
      key: 'Content-Type',
      value: 'application/manifest+json',
    });
  });
});
