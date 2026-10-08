# Barista Companion

Aplikacja PWA dla domowych baristów, którzy parzą kawę metodami alternatywnymi (kawiarka, prasa francuska, drip, cold brew…), bez ekspresu. Sednem są drinki kawowe (espresso tonic, kawa pomarańczowa, café bombón…) i ich efektowne podanie. Bez backendu i kont: treści leżą w repozytorium (`src/data`), dane użytkownika w przeglądarce.

Plan i historia kroków: [plans/2026-10-08-barista-companion-mvp.md](plans/2026-10-08-barista-companion-mvp.md), dalsze funkcje: [plans/2026-10-08-funkcje-z-analizy-konkurencji.md](plans/2026-10-08-funkcje-z-analizy-konkurencji.md). Publikacja: [docs/publikacja.md](docs/publikacja.md), test na telefonie: [docs/test-na-telefonie.md](docs/test-na-telefonie.md).

## Stack

Wymaga Node `^22.22 || >=24` (React Router 8, Vitest 5).

- Vite 8 + React 19 + TypeScript 7 (`strict`, `noUncheckedIndexedAccess`)
- Tailwind CSS 4: konfiguracja w CSS (`src/index.css`), nie ma `tailwind.config.js`
- React Router 8 w trybie data router. Wszystko importuj z `react-router` (pakiet `react-router-dom` już nie istnieje), tylko `RouterProvider` z `react-router/dom`
- Vitest 5 + jsdom + Testing Library (react, user-event, jest-dom); Playwright do E2E (w systemowym Edge)
- vite-plugin-pwa 2 (`generateSW`, `autoUpdate`); wdrożenie na Vercel (`vercel.json`)

## Komendy

```sh
npm run dev         # serwer deweloperski, dostępny też w sieci lokalnej (adres „Network”)
npm run build       # typecheck + build produkcyjny do dist/
npm run preview     # podgląd builda (z service workerem), też w sieci lokalnej
npm test            # testy jednostkowe i komponentów (Vitest, tylko src/)
npm run test:watch  # jw. w trybie obserwacji
npm run test:e2e    # build + Playwright (e2e/) na npm run preview, w przeglądarce Edge
npm run typecheck   # tylko tsc
```

Przed zakończeniem zmian: `npm run typecheck` i `npm test` muszą przechodzić. Po zmianach w ścieżce „Mam kawę” także `npm run test:e2e`.

## Struktura

```
src/
  main.tsx, routes.tsx    punkt wejścia i wszystkie trasy (wspólne dla aplikacji i testów)
  index.css               Tailwind, tokeny wyglądu, animacje (nalewanie, przejścia ekranów)
  data/                   treści i model danych: metody, napoje, mleko, spienianie, syropy,
                          naczynia, warianty cold brew, etykiety PL, typy; index.ts = wyszukiwanie
  components/             wspólne UI: AppLayout, BottomNav, PageHeader, Section, Sheet (dialog),
                          Chip, ChoiceChip, EmptyState, BackLink, ReviewNote, ikony
  features/
    drinks/               filtry, karty, składniki, kroki, sekcja „Jak podać”
    glass/                <DrinkGlass>: geometria naczyń (czyste funkcje) i rysunek SVG z dekoracjami
    brewing/              stoper i sesja parzenia (czyste funkcje), sygnały, ekran sesji, skala mielenia
    coldbrew/             długi timer (czas gotowości), plik .ics, zapis startu
    beans/                Moje ziarna: zapis, formularz, dopasowanie metod (czysta funkcja)
    favorites/            ulubione napoje: zapis i przycisk „Ulubiony”
    flow/                 ścieżka „Mam kawę”: kroki, wymagania, zapis wyborów
    syrups/               przepis i okno „Kup albo zrób sam”
  lib/                    format (odmiana, czas), localStore, useDialogParam, useNow, useWakeLock
  pages/                  ekrany tras
  test/                   setup, renderApp, testy kontrastu i konfiguracji wdrożenia
e2e/                      testy Playwright
docs/                     publikacja i lista kontrolna testu na telefonie
```

## Trasy

| Adres | Ekran |
| :- | :- |
| `/` | Start z przyciskiem „Mam kawę. Co z nią zrobić?” i ulubionymi napojami |
| `/mam-kawe`, `/mam-kawe/:krok` | ścieżka: ziarna → metody → metoda → napoje → parzenie → napoj → podanie |
| `/napoje` | katalog z filtrami w adresie (`?ulubione=1&temp=zimne&mleko=bez&roslinne=1&czas=10`) |
| `/napoje/:id` | napój; `?syrop=id` otwiera okno syropu |
| `/napoje/mleko`, `/napoje/spienianie`, `/napoje/syropy` | poradniki |
| `/parzenie`, `/parzenie/:id`, `/parzenie/:id/start` | metody, szczegóły, prowadzone parzenie (cold brew: długi timer, `?wariant=`) |
| `/ziarna`, `/ziarna/nowe`, `/ziarna/:id`, `/ziarna/:id/edycja` | Moje ziarna |

Dolna nawigacja: Start, Napoje, Parzenie, Moje ziarna. Zakładka jest aktywna także na podstronach; ścieżka „Mam kawę” należy do Startu.

## Dane (`src/data`)

- Wszystkie treści po polsku, id jako slugi (`kawa-pomaranczowa`), bo trafiają do adresów.
- Napój: baza kawowa (`methodId` + alternatywy), mleko (opcje, pierwsza polecana), dodatki (`syrupId` dla syropów, `dairy` dla nabiału bez zamiennika), warstwy **od dołu** (`liquid`/`foam`/`solid`, kolor, ml), kroki, podanie (naczynie + dekoracje z instrukcją i `look`).
- Espresso nie ma: bazą drinków „na espresso” jest kawiarka.
- Wszystko, czego nie jesteś pewien, oznaczaj `needsReview: true` + `reviewNote`. `<ReviewNote>` pokazuje to tylko w trybie deweloperskim, żeby autor mógł sprawdzić treść.
- `data.test.ts` pilnuje spójności (odwołania, objętości, czasy, kolory). Nowy napój albo metoda muszą przez nie przejść.

## Konwencje

- **Język:** interfejs, treści i komentarze po polsku; nazwy w kodzie po angielsku. Polska odmiana liczebników: `count()`/`plural()` z `lib/format`.
- **Najpierw telefon:** 360–430 px, bez poziomego przewijania, cele dotyku ≥ 44 px (przyciski `h-10`–`h-14`), bezpieczne obszary (`env(safe-area-inset-*)`).
- **Kolory:** tylko tokeny semantyczne (`bg-canvas`, `bg-surface`, `bg-surface-muted`, `border-line`, `text-ink`, `text-ink-muted`, `text-accent`, `bg-accent`, `bg-accent-soft`, `text-on-accent`). Same przełączają motyw, nie dopisuj `dark:`. Paleta `coffee-*`/`caramel-*` tylko dla kolorów stałych. `src/test/contrast.test.ts` sprawdza WCAG AA par tekst/tło w obu motywach. Nowa para tokenów musi do niego trafić.
- **Typografia:** `font-display` (szeryfowy) na nagłówki, `font-sans` na resztę; liczniki i liczby w `font-sans tabular-nums` (szeryfowa ma cyfry nautyczne). Fonty systemowe.
- **Ekrany:** każdy zaczyna się od `<PageHeader>` (tytuł karty, h1 przyjmujący fokus po zmianie ekranu, opcjonalnie powrót i ikona). Sekcje przez `<Section>` (region z nagłówkiem h2). Puste stany przez `<EmptyState>`.
- **Nawigacja:** główne linki mają `viewTransition` (płynne przejście; wyłączone przy ograniczeniu ruchu). Link z listy przekazuje `state={{ from }}`, a `<BackLink>` wtedy cofa w historii (zachowuje filtry i przewinięcie).
- **Okna:** `<Sheet>` (natywny `<dialog>`). Stan okna w adresie przez `useDialogParam`, żeby gest „wstecz” je zamykał.
- **Zapis w przeglądarce:** zawsze przez `createLocalStore` (`lib/localStore`): odporny na brak localStorage, wspólny stan przez `useSyncExternalStore`. Klucze z prefiksem `barista-companion.` i wersją (`.v1`).
- **Czas:** stopery liczą z `Date.now()` od znacznika startu (czyste funkcje w `features/brewing/timer.ts`, `features/coldbrew/time.ts`), nigdy przez sumowanie interwałów.
- **Ikony:** inline SVG (`components/icons.tsx`, `MethodIcon.tsx`), bez bibliotek ikon. **Zależności:** bez backendu i ciężkich bibliotek UI.

## Testy

- Pliki `*.test.ts(x)` obok kodu, bez `globals` (importuj z `vitest`). Szukaj po rolach i nazwach dostępnych.
- Ekrany testuj przez `renderApp(adres)` z `src/test/renderApp.tsx` (cała aplikacja na `createMemoryRouter`).
- Stan zapisany w przeglądarce czyść w `beforeEach`: `localStorage.clear()`/`sessionStorage.clear()` i `…Store.reset()`.
- **Fałszywe timery:** user-event z `vi.useFakeTimers()` zawiesza test (Testing Library czeka na `setTimeout(0)`). Albo fałszuj tylko `Date` (`toFake: ['Date']`), albo używaj `fireEvent`. Powrót na kartę symuluje `document.dispatchEvent(new Event('visibilitychange'))`.
- jsdom nie ma `showModal()`, `scrollTo()` ani `URL.createObjectURL`: pierwsze dwa uzupełnia `src/test/setup.ts`, trzecie podmieniaj w teście.
- Vitest podmienia importy CSS na pusty tekst: plik CSS w teście czytaj przez `fs` (patrz `contrast.test.ts`).

## PWA, telefon i publikacja

- Service worker działa tylko w buildzie (`npm run build` + `npm run preview`); w `npm run dev` jest wyłączony.
- Precache: js/css/html, ikony z manifestu i `includeAssets` w `vite.config.ts`. Nowy plik z `public/` potrzebny offline dopisz do `includeAssets`.
- Ikony w `public/` są tymczasowe (PNG wygenerowane z `favicon.svg`).
- Telefon w tej samej sieci otwiera adres „Network” z `npm run dev`, ale przez `http://` nie działa service worker, instalacja ani Wake Lock. Pełny test: wersja na Vercelu (HTTPS) albo Android przez USB z przekierowaniem portu w `chrome://inspect`.
- Windows przy pierwszym uruchomieniu może zapytać o dostęp Node.js do sieci: zezwól dla sieci prywatnej.
- Vercel: `vercel.json` przekierowuje wszystkie ścieżki na `index.html` i nie cache'uje `sw.js`; `src/test/deploy.test.ts` tego pilnuje. Nie publikuj i nie zakładaj kont bez zgody autora.
