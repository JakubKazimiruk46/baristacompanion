# Barista Companion

Aplikacja PWA dla domowych baristów, którzy parzą kawę metodami alternatywnymi (kawiarka, prasa francuska, drip, cold brew…), bez ekspresu. Sednem są drinki kawowe (espresso tonic, kawa pomarańczowa, café bombón…) i ich efektowne podanie. Bez backendu i kont: treści leżą w repozytorium (`src/data`), dane użytkownika w przeglądarce.

Plan i historia kroków: [plans/2026-10-08-barista-companion-mvp.md](plans/2026-10-08-barista-companion-mvp.md), dalsze funkcje: [plans/2026-10-08-funkcje-z-analizy-konkurencji.md](plans/2026-10-08-funkcje-z-analizy-konkurencji.md), następny etap (młynek, własne przepisy, drinki, Android, backend, AI): [plans/2026-10-08-przepisy-aplikacja-natywna-backend.md](plans/2026-10-08-przepisy-aplikacja-natywna-backend.md). Publikacja: [docs/publikacja.md](docs/publikacja.md), test na telefonie: [docs/test-na-telefonie.md](docs/test-na-telefonie.md).

## Stack

Wymaga Node `^22.22 || >=24` (React Router 8, Vitest 5).

- Vite 8 + React 19 + TypeScript 7 (`strict`, `noUncheckedIndexedAccess`)
- Tailwind CSS 4: konfiguracja w CSS (`src/index.css`), nie ma `tailwind.config.js`
- React Router 8 w trybie data router. Wszystko importuj z `react-router` (pakiet `react-router-dom` już nie istnieje), tylko `RouterProvider` z `react-router/dom`
- Vitest 5 + jsdom + Testing Library (react, user-event, jest-dom); Playwright do E2E (w systemowym Edge)
- vite-plugin-pwa 2 (`generateSW`, `autoUpdate`); wdrożenie na Vercel (`vercel.json`)
- tesseract.js 7: rozpoznawanie tekstu na etykietach ziaren, w przeglądarce (bez backendu)
- Capacitor 8: aplikacja na Androida z tej samej PWA (`android/`, `capacitor.config.ts`), lokalne powiadomienia (`@capacitor/local-notifications`)

## Komendy

```sh
npm run dev         # serwer deweloperski, dostępny też w sieci lokalnej (adres „Network”)
npm run build       # typecheck + build produkcyjny do dist/
npm run preview     # podgląd builda (z service workerem), też w sieci lokalnej
npm test            # testy jednostkowe i komponentów (Vitest, tylko src/)
npm run test:watch  # jw. w trybie obserwacji
npm run test:e2e    # build + Playwright (e2e/) na npm run preview, w przeglądarce Edge
npm run typecheck   # tylko tsc
npm run android:sync  # build + kopia do projektu Androida (potem Run w Android Studio)
npm run android:open  # otwiera android/ w Android Studio
npm run android:apk   # APK do testów (wymaga Android Studio / JDK), docs/aplikacja-android.md
```

Przed zakończeniem zmian: `npm run typecheck` i `npm test` muszą przechodzić. Po zmianach w ścieżce „Mam kawę” także `npm run test:e2e`.

## Struktura

```
src/
  main.tsx, routes.tsx    punkt wejścia i wszystkie trasy (wspólne dla aplikacji i testów)
  index.css               Tailwind, tokeny wyglądu, animacje (nalewanie, przejścia ekranów)
  data/                   treści i model danych: metody, napoje, mleko, spienianie, syropy, składniki
                          z zamiennikami, naczynia, warianty cold brew, młynki, etykiety PL, typy;
                          index.ts = katalog składników i wyszukiwanie
  components/             wspólne UI: AppLayout, BottomNav, PageHeader, Section, Sheet (dialog),
                          Chip, ChoiceChip, Stepper (−/+), EmptyState, BackLink, ReviewNote, ikony
  features/
    drinks/               filtry, karty, składniki, kroki, sekcja „Jak podać”
    glass/                <DrinkGlass>: geometria naczyń (czyste funkcje) i rysunek SVG z dekoracjami
    brewing/              stoper i sesja parzenia (czyste funkcje), sygnały, ekran sesji, skala mielenia,
                          kalkulator ilości (dose.ts: przeliczanie kroków, doseStore: wybrana ilość), lista kroków
    recipes/              własne przepisy: model i walidacja (recipe.ts), formularz (draft.ts), oba czyste funkcje;
                          zapis, edytor kroków, sekcja „Twoje przepisy”, link z przepisem (share.ts)
    coldbrew/             długi timer (czas gotowości), plik .ics, zapis startu
    beans/                Moje ziarna: zapis, formularz, dopasowanie metod (czysta funkcja),
                          scan/: skan etykiety (OCR w przeglądarce + parser tekstu, czysta funkcja)
    grinder/              Mój młynek: zapis młynków i ustawień dla metod, formularz, okno ustawienia,
                          panel przy skali mielenia i wiersz w parzeniu, odmiana jednostek
    favorites/            ulubione napoje: zapis i przycisk „Ulubiony”
    journal/              dziennik parzeń: zapis wpisów, ocena (gwiazdki), edycja, karta wpisu
    shelf/                „Co mam w domu”: półka, dostępność napoju (czysta funkcja), lista zakupów
    share/                karta napoju do udostępnienia: układ i kolory (czyste funkcje), SVG, eksport do PNG
    flow/                 ścieżka „Mam kawę”: kroki, wymagania, zapis wyborów
    syrups/               przepis i okno „Kup albo zrób sam”
  lib/                    format (odmiana, czas), color (kontrast, HSL), download, localStore,
                          useDialogParam, useNow, useWakeLock, notifications (Capacitor, w PWA nic nie robi)
  pages/                  ekrany tras
  test/                   setup, renderApp, testy kontrastu i konfiguracji wdrożenia
e2e/                      testy Playwright
docs/                     publikacja, test na telefonie, aplikacja na Androida
android/                  projekt Androida (Capacitor): manifest, ikony, ekran startowy, ikona powiadomień
```

## Trasy

| Adres | Ekran |
| :- | :- |
| `/` | Start z przyciskiem „Mam kawę. Co z nią zrobić?” i ulubionymi napojami |
| `/mam-kawe`, `/mam-kawe/:krok` | ścieżka: ziarna → metody → metoda → napoje → parzenie → napoj → podanie |
| `/napoje` | katalog z filtrami w adresie (`?ulubione=1&mam=1&temp=zimne&mleko=bez&roslinne=1&alkohol=bez&czas=10`) |
| `/napoje/:id` | napój; `?porcje=2` mnoży ilości, `?syrop=id` otwiera okno syropu, `?karta=1` kartę do udostępnienia |
| `/napoje/mleko`, `/napoje/spienianie`, `/napoje/syropy` | poradniki |
| `/napoje/co-mam`, `/napoje/zakupy` | „Co mam w domu” (składniki i sprzęt, czego brakuje) i lista zakupów |
| `/parzenie`, `/parzenie/:id`, `/parzenie/:id/start` | metody, szczegóły, prowadzone parzenie (cold brew: długi timer, `?wariant=`; własny przepis: `?przepis=id`) |
| `/parzenie/:id/przepisy/nowy`, `/parzenie/:id/przepisy/:przepis`, `…/:przepis/edycja` | własne przepisy: nowy (kopia przepisu metody), ekran przepisu (kalkulator, mielenie, kroki, „Wyślij”, usuwanie), edycja |
| `/przepis#dane` | przepis z linku: podgląd i „Zapisz u siebie” |
| `/parzenie/dziennik`, `/parzenie/dziennik/:id` | dziennik parzeń: lista i wpis (ocena, notatka, ziarna, „Zaparz tak samo”) |
| `/ziarna`, `/ziarna/nowe`, `/ziarna/:id`, `/ziarna/:id/edycja` | Moje ziarna |
| `/ziarna/mlynek`, `/ziarna/mlynek/nowy` | Mój młynek: ustawienia dla metod, wybór używanego młynka, nowy młynek; `?mielenie=id-metody` otwiera okno ustawienia (też na ekranie metody, w „Mam kawę” i w parzeniu) |

Dolna nawigacja: Start, Napoje, Parzenie, Moje ziarna. Zakładka jest aktywna także na podstronach; ścieżka „Mam kawę” należy do Startu, a przepis z linku (`/przepis`) do Parzenia.

## Dane (`src/data`)

- Wszystkie treści po polsku, id jako slugi (`kawa-pomaranczowa`), bo trafiają do adresów.
- Napój: baza kawowa (`methodId` + alternatywy), mleko (opcje, pierwsza polecana), dodatki (`syrupId` dla syropów, `dairy` dla nabiału bez zamiennika), warstwy **od dołu** (`liquid`/`foam`/`solid`, kolor, ml), kroki, podanie (naczynie + dekoracje z instrukcją i `look`).
- Ilość dodatku: `{ value, max?, unit }` mnoży się z porcjami i odmienia (`formatAmount`, jednostki: ml, g, kostka, gałka, łyżeczka, sztuka). Tekst („pełna szklanka”) zostaje bez zmian.
- Alkohol: napój jest „z alkoholem”, gdy ma dodatek `kind: 'alcohol'` (składnik z grupy `alcohol`), `hasAlcohol()`. Ma oznaczenie „z alkoholem 18+” (lista, ekran, karta), ostrzeżenie na ekranie napoju i filtr `?alkohol=bez`. Lód tylko do shakera to `kind: 'other'`, żeby nie rysował się w kieliszku.
- Składniki: katalog `ingredients` (index.ts) składa się z mlek, syropów i `extraIngredients` (`ingredients.ts`). Każdy dodatek napoju ma `ingredientId`, a nazwę w napoju osobno (`name`). Zamiennik to `{ id, note }`: inny składnik z katalogu i co się zmieni. Zamienniki syropów są w `syrups.ts`. `staple` = na półce od początku (lód, cukier), `always` = zawsze jest (woda).
- Metoda: `dose` to przepis, a `scaling` to granice kalkulatora (osoba w ml, zakres sprzętu, krok, w kawiarce rozmiary). W krokach ilości zapisuj jako znaczniki `{coffee}`, `{water}`, `{water*0.6}`. Ekrany pokazują metodę przeliczoną przez `scaleMethod()` (`features/brewing/dose`) na ilość z `useWaterMl()`. Nigdy nie wyświetlaj surowych kroków.
- Własny przepis (`features/recipes`, zapis `barista-companion.recipes.v1`): metoda + własna nazwa, dawka, temperatura, mielenie, ustawienie młynka i kroki w formacie `BrewStep` (te same znaczniki). Ekrany zamieniają go na metodę (`recipeToMethod`) i przeliczają jak metodę, a ilość z kalkulatora trzymają pod `recipeDoseKey(id)`. Przepis z zapisu i z linku przechodzi przez tę samą walidację (`parseRecipeInput`). Link: `/przepis#1.<base64url z JSON>` (wersja formatu przed kropką), bez ustawienia młynka.
- Espresso nie ma: bazą drinków „na espresso” jest kawiarka.
- Kawa rozpuszczalna to jedyna metoda bez mielenia (`instant: true`, baza dalgony i frappé po grecku). Nie ma jej w rankingu metod dla ziaren ani w ustawieniach młynka (`beanMethods`), a ekran metody i parzenie nie pokazują mielenia.
- Młynek (`grinders.ts`): jednostka (`click`/`mark`/`turn`), skala, krok i zakres dla każdego stopnia z `GRIND_SIZES`; `null` = tak drobno nie zmieli (tylko na drobnym końcu skali). Liczby odmieniaj przez `formatSetting()` (`features/grinder/format`), także ułamki („2,5 obrotu”).
- Wszystko, czego nie jesteś pewien, oznaczaj `needsReview: true` + `reviewNote`. `<ReviewNote>` pokazuje to tylko w trybie deweloperskim, żeby autor mógł sprawdzić treść.
- `data.test.ts` pilnuje spójności (odwołania, objętości, czasy, kolory). Nowy napój albo metoda muszą przez nie przejść.

## Konwencje

- **Język:** interfejs, treści i komentarze po polsku; nazwy w kodzie po angielsku. Polska odmiana liczebników: `count()`/`plural()` z `lib/format`.
- **Najpierw telefon:** 360–430 px, bez poziomego przewijania, cele dotyku ≥ 44 px (przyciski `h-10`–`h-14`), bezpieczne obszary (`env(safe-area-inset-*)`).
- **Kolory:** tylko tokeny semantyczne (`bg-canvas`, `bg-surface`, `bg-surface-muted`, `border-line`, `text-ink`, `text-ink-muted`, `text-accent`, `bg-accent`, `bg-accent-soft`, `text-on-accent`). Same przełączają motyw, nie dopisuj `dark:`. Paleta `coffee-*`/`caramel-*` tylko dla kolorów stałych. `src/test/contrast.test.ts` sprawdza WCAG AA par tekst/tło w obu motywach. Nowa para tokenów musi do niego trafić. Wyjątek: karta do udostępnienia ma stałe kolory liczone z napoju (obrazek wychodzi poza aplikację), a ich kontrast sprawdza `features/share/card.test.ts`.
- **Typografia:** `font-display` (szeryfowy) na nagłówki, `font-sans` na resztę; liczniki i liczby w `font-sans tabular-nums` (szeryfowa ma cyfry nautyczne). Fonty systemowe.
- **Ekrany:** każdy zaczyna się od `<PageHeader>` (tytuł karty, h1 przyjmujący fokus po zmianie ekranu, opcjonalnie powrót i ikona). Sekcje przez `<Section>` (region z nagłówkiem h2). Puste stany przez `<EmptyState>`.
- **Nawigacja:** główne linki mają `viewTransition` (płynne przejście; wyłączone przy ograniczeniu ruchu). Link z listy przekazuje `state={{ from }}`, a `<BackLink>` wtedy cofa w historii (zachowuje filtry i przewinięcie).
- **Okna:** `<Sheet>` (natywny `<dialog>`). Stan okna w adresie przez `useDialogParam`, żeby gest „wstecz” je zamykał.
- **Zapis w przeglądarce:** zawsze przez `createLocalStore` (`lib/localStore`): odporny na brak localStorage, wspólny stan przez `useSyncExternalStore`. Klucze z prefiksem `barista-companion.` i wersją (`.v1`). Parser odrzuca uszkodzone wpisy i odwołania do nieistniejących danych, zamiast tracić cały zapis.
- **Dziennik:** prowadzone parzenie tworzy wpis samo przy „Zakończ” (`BrewSession`), cold brew przy zakończeniu maceracji. Nie twórz wpisów w innych miejscach. Wpis zapisuje ustawienie używanego młynka (`grindRecordFor`, cold brew już przy zalaniu), a „Zaparz tak samo” przywraca je razem z ilością (`grindersStore.restore`). Parzenie według własnego przepisu zapisuje `recipeId` i `recipeName`, a ustawienie młynka bierze z przepisu.
- **Czas:** stopery liczą z `Date.now()` od znacznika startu (czyste funkcje w `features/brewing/timer.ts`, `features/coldbrew/time.ts`), nigdy przez sumowanie interwałów.
- **Ikony:** inline SVG (`components/icons.tsx`, `MethodIcon.tsx`), bez bibliotek ikon. **Zależności:** bez backendu i ciężkich bibliotek UI. Jedyna duża biblioteka, tesseract.js (skan etykiety), ładuje się dynamicznie (`import()`) dopiero przy pierwszym skanie; nie importuj jej statycznie.

## Testy

- Pliki `*.test.ts(x)` obok kodu, bez `globals` (importuj z `vitest`). Szukaj po rolach i nazwach dostępnych.
- Ekrany testuj przez `renderApp(adres)` z `src/test/renderApp.tsx` (cała aplikacja na `createMemoryRouter`).
- Stan zapisany w przeglądarce czyść w `beforeEach`: `localStorage.clear()`/`sessionStorage.clear()` i `…Store.reset()`.
- **Fałszywe timery:** user-event z `vi.useFakeTimers()` zawiesza test (Testing Library czeka na `setTimeout(0)`). Albo fałszuj tylko `Date` (`toFake: ['Date']`), albo używaj `fireEvent`. Powrót na kartę symuluje `document.dispatchEvent(new Event('visibilitychange'))`.
- jsdom nie ma `showModal()`, `scrollTo()` ani `URL.createObjectURL`: pierwsze dwa uzupełnia `src/test/setup.ts`, trzecie podmieniaj w teście. Nie rysuje też na kanwie: eksport karty (`share/exportCard`) i OCR podmieniaj przez `vi.mock`.
- Vitest podmienia importy CSS na pusty tekst: plik CSS w teście czytaj przez `fs` (patrz `contrast.test.ts`).
- Wersję natywną testuj z podmienionymi `@capacitor/core` (`isNativePlatform`) i `@capacitor/local-notifications` (`vi.mock`, patrz `pages/notifications.test.tsx`). Wtyczkę między testami zapominaj przez `resetNotificationsForTests()`.

## PWA, telefon i publikacja

- Service worker działa tylko w buildzie (`npm run build` + `npm run preview`); w `npm run dev` jest wyłączony, a w aplikacji natywnej się nie rejestruje (`main.tsx`, `injectRegister: false`).
- **Aplikacja na Androida:** powiadomienia planuj tylko przez `lib/notifications` (stałe id z `NOTIFICATION_IDS`, jeden kanał `parzenie`). Krok ze stoperem planuje powiadomienie w `useBrewSession`, a pauza, reset, zmiana kroku i wyjście je odwołują; cold brew planuje `useColdBrewNotification` w `AppLayout`. O zgodę pyta `<NotificationPrompt>` z wyjaśnieniem przed oknem systemu; bez zgody aplikacja działa jak PWA. Instrukcja i lista kontrolna: [docs/aplikacja-android.md](docs/aplikacja-android.md).
- Precache: js/css/html, ikony z manifestu i `includeAssets` w `vite.config.ts`. Nowy plik z `public/` potrzebny offline dopisz do `includeAssets`.
- Skan etykiety pobiera przy pierwszym użyciu worker, rdzeń WASM i modele `pol`+`eng` z cdn.jsdelivr.net (kilka MB). Service worker trzyma je w pamięci podręcznej `ocr` (`workbox.runtimeCaching`), a modele zostają też w IndexedDB. W testach `ocr.ts` podmieniaj przez `vi.mock`.
- Ikony w `public/` są tymczasowe (PNG wygenerowane z `favicon.svg`).
- Telefon w tej samej sieci otwiera adres „Network” z `npm run dev`, ale przez `http://` nie działa service worker, instalacja ani Wake Lock. Pełny test: wersja na Vercelu (HTTPS) albo Android przez USB z przekierowaniem portu w `chrome://inspect`.
- Windows przy pierwszym uruchomieniu może zapytać o dostęp Node.js do sieci: zezwól dla sieci prywatnej.
- Vercel: `vercel.json` przekierowuje wszystkie ścieżki na `index.html` i nie cache'uje `sw.js`; `src/test/deploy.test.ts` tego pilnuje. Nie publikuj i nie zakładaj kont bez zgody autora.
