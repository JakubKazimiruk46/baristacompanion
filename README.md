# Barista Companion

Kawa bez ekspresu: od ziaren przez parzenie po efektowne podanie drinków kawowych.

*A Polish-language PWA for home baristas who brew without an espresso machine: coffee drinks, guided brewing, and what you can make from what you have.*

[barista-companion-prezentacja-2026-11-03.webm](https://github.com/user-attachments/assets/80741dbc-55ff-4b74-b194-33da41c2400b)


Aplikacja jest dla osób, które parzą kawę metodami alternatywnymi (kawiarka, drip, AeroPress, prasa francuska, cold brew…) i chcą zrobić z niej coś więcej niż zwykłą czarną kawę. Działa w przeglądarce i offline, bez konta: wszystkie dane zostają na urządzeniu.

## Co potrafi

- **„Mam kawę. Co z nią zrobić?”**: prowadzi od ziaren (palenie, nuty smakowe, skan etykiety) przez dobór metody, mielenie i ilość kawy do napoju, parzenia i podania.
- **Napoje**: 36 drinków kawowych (espresso tonic, kawa pomarańczowa, café bombón, affogato…). Każdy ma rysunek szklanki z warstwami, składniki z zamiennikami, porcje, kroki i instrukcję podania. Wyszukiwanie, filtry, losowanie i karta do udostępnienia (obrazek w formacie relacji).
- **Kreator napoju**: własne napoje i „własne wersje” napojów z katalogu, z podglądem szklanki na żywo.
- **Parzenie**: 13 metod z kalkulatorem ilości, skalą mielenia, ustawieniami Twojego młynka i prowadzonym parzeniem ze stoperem. Własne przepisy parzenia i udostępnianie ich linkiem.
- **Dziennik parzeń**: każde prowadzone parzenie zapisuje się samo; ocena, notatka i „Zaparz tak samo”.
- **Baribar**: ziarna, mleka, syropy, dodatki i sprzęt, które masz w domu. Aplikacja liczy, które napoje zrobisz od razu, i układa listę zakupów.
- **Społeczność (opcjonalnie)**: konto, publikowanie własnych napojów i przepisów, synchronizacja między urządzeniami. Wymaga własnego projektu Supabase.
- **Android**: ta sama aplikacja jako aplikacja natywna (Capacitor), z powiadomieniami o końcu parzenia.

## Uruchomienie

Wymaga Node.js `^22.22` albo `>=24`.

```sh
npm install
npm run dev        # http://localhost:5173
npm test           # testy jednostkowe i komponentów (Vitest)
npm run build      # build produkcyjny do dist/
npm run preview    # podgląd builda z service workerem
npm run test:e2e   # testy E2E (Playwright, przeglądarka Edge)
```

Bez dodatkowej konfiguracji działa wszystko poza kontem i Społecznością. Żeby je włączyć, skopiuj `.env.example` do `.env.local` i wpisz dane własnego projektu Supabase ([docs/backend.md](docs/backend.md)).

Więcej:

- [docs/publikacja.md](docs/publikacja.md): wdrożenie na Vercel,
- [docs/aplikacja-android.md](docs/aplikacja-android.md): aplikacja na Androida,
- [docs/test-na-telefonie.md](docs/test-na-telefonie.md): test na telefonie w sieci lokalnej.

## Technologie

Vite, React 19, TypeScript, Tailwind CSS 4, React Router, vite-plugin-pwa, Capacitor 8, Supabase (Postgres z RLS, funkcje w Deno), tesseract.js (odczyt etykiet w przeglądarce). Testy: Vitest, Testing Library, Playwright oraz PGlite z pgTAP (migracje i reguły dostępu sprawdzane na prawdziwym Postgresie, bez Dockera).

## Licencja

[MIT](LICENSE)
