# Barista Companion

Aplikacja PWA dla domowych baristów, którzy parzą kawę metodami alternatywnymi (kawiarka, prasa francuska, drip, cold brew…), bez ekspresu. Sednem są drinki kawowe (espresso tonic, kawa pomarańczowa, café bombón…) i ich efektowne podanie. Treści leżą w repozytorium (`src/data`), dane użytkownika w przeglądarce. Konto (Supabase) jest opcjonalnym dodatkiem: bez niego wszystko działa jak dotąd.

Plan i historia kroków: [plans/2026-10-08-barista-companion-mvp.md](plans/2026-10-08-barista-companion-mvp.md), dalsze funkcje: [plans/2026-10-08-funkcje-z-analizy-konkurencji.md](plans/2026-10-08-funkcje-z-analizy-konkurencji.md), następny etap (młynek, własne przepisy, drinki, Android, backend, AI): [plans/2026-10-08-przepisy-aplikacja-natywna-backend.md](plans/2026-10-08-przepisy-aplikacja-natywna-backend.md), obecny etap (społeczność z napojami, Baribar, nowe Parzenie i Napoje, konto w aplikacji): [plans/2026-10-09-spolecznosc-baribar-nawigacja.md](plans/2026-10-09-spolecznosc-baribar-nawigacja.md), następny etap (Android Studio, poprawki dla WebView, wydanie w Google Play): [plans/2026-10-14-android-studio-google-play.md](plans/2026-10-14-android-studio-google-play.md). Publikacja: [docs/publikacja.md](docs/publikacja.md), test na telefonie: [docs/test-na-telefonie.md](docs/test-na-telefonie.md), Android: [docs/aplikacja-android.md](docs/aplikacja-android.md), backend: [docs/backend.md](docs/backend.md).

## Stack

Wymaga Node `^22.22 || >=24` (React Router 8, Vitest 5).

- Vite 8 + React 19 + TypeScript 7 (`strict`, `noUncheckedIndexedAccess`)
- Tailwind CSS 4: konfiguracja w CSS (`src/index.css`), nie ma `tailwind.config.js`
- React Router 8 w trybie data router. Wszystko importuj z `react-router` (pakiet `react-router-dom` już nie istnieje), tylko `RouterProvider` z `react-router/dom`
- Vitest 5 + jsdom + Testing Library (react, user-event, jest-dom); Playwright do E2E (w systemowym Edge)
- PGlite (Postgres w WASM) + pgTAP w testach: migracje i reguły dostępu sprawdzane na prawdziwym Postgresie, bez Dockera
- vite-plugin-pwa 2 (`generateSW`, `autoUpdate`); wdrożenie na Vercel (`vercel.json`)
- tesseract.js 7: rozpoznawanie tekstu na etykietach ziaren, w przeglądarce (bez backendu)
- Capacitor 8: aplikacja na Androida z tej samej PWA (`android/`, `capacitor.config.ts`), lokalne powiadomienia (`@capacitor/local-notifications`), powrót z logowania (`@capacitor/app`, `@capacitor/browser`)
- Supabase (`@supabase/supabase-js` 2, ładowany dynamicznie): konto, baza z RLS, funkcje serwerowe w Deno (`supabase/`)

## Komendy

```sh
npm run dev         # serwer deweloperski, dostępny też w sieci lokalnej (adres „Network”)
npm run build       # typecheck + build produkcyjny do dist/
npm run preview     # podgląd builda (z service workerem), też w sieci lokalnej
npm test            # testy jednostkowe i komponentów (Vitest, tylko src/), w tym baza: migracje + pgTAP na PGlite
npm run test:watch  # jw. w trybie obserwacji
npm run test:e2e    # build + Playwright (e2e/) na npm run preview, w przeglądarce Edge
npm run typecheck   # tylko tsc
npm run typecheck:functions  # typy funkcji serwerowych Deno (supabase/functions), bez instalowania Deno
npm run android:sync  # build + kopia do projektu Androida (potem Run w Android Studio)
npm run android:open  # otwiera android/ w Android Studio
npm run android:apk   # APK do testów (wymaga Android Studio / JDK), docs/aplikacja-android.md
```

Przed zakończeniem zmian: `npm run typecheck` i `npm test` muszą przechodzić (po zmianach w `supabase/functions` także `npm run typecheck:functions`). Po zmianach w ścieżce „Mam kawę” także `npm run test:e2e`.

## Struktura

```
src/
  main.tsx, routes.tsx    punkt wejścia i wszystkie trasy (wspólne dla aplikacji i testów)
  index.css               Tailwind, tokeny wyglądu, animacje (nalewanie, przejścia ekranów)
  data/                   treści i model danych: metody, napoje, mleko, spienianie, syropy, składniki
                          z zamiennikami, naczynia, warianty cold brew, młynki, etykiety PL, typy;
                          index.ts = katalog składników i wyszukiwanie; validate.ts = reguły spójności napoju
  components/             wspólne UI: AppLayout, BottomNav, PageHeader, Section, Sheet (dialog),
                          Chip, ChoiceChip, Segmented (przełącznik widoków), Stepper (−/+), EmptyState, BackLink, ReviewNote, ikony
  features/
    drinks/               filtry i wyszukiwanie, losowanie (random.ts), kafelki i karty, okno filtrów i losowania,
                          składniki, kroki, sekcja „Jak podać”, treść ekranu napoju (DrinkBody)
    assistant/            asystent drinków (AI): zapytanie i sprawdzenie propozycji (api.ts), „Moje napoje” (zapis ze źródłem
                          ai/own/community, useDrink, useAllDrinks, findDrink), oznaczenie „Przepis od AI”
    drinkEditor/          kreator napoju: formularz jako czyste funkcje (draft.ts: napój ↔ formularz, błędy, podgląd,
                          podpowiedź warstw) i edytor z podglądem szklanki na żywo
    glass/                <DrinkGlass>: geometria naczyń (czyste funkcje) i rysunek SVG z dekoracjami
    brewing/              stoper i sesja parzenia (czyste funkcje), sygnały, ekran sesji, skala mielenia, widoki listy metod (methodList.ts),
                          kalkulator ilości (dose.ts: przeliczanie kroków, doseStore: wybrana ilość), lista kroków
    recipes/              własne przepisy: model i walidacja (recipe.ts), formularz (draft.ts), oba czyste funkcje;
                          zapis, edytor kroków, sekcja „Twoje przepisy”, link z przepisem (share.ts)
    coldbrew/             długi timer (czas gotowości), plik .ics, zapis startu
    beans/                Moje ziarna: zapis, formularz, dopasowanie metod (czysta funkcja),
                          scan/: skan etykiety (AI przez scan-label albo OCR w przeglądarce + parser tekstu,
                          zgoda na AI, przygotowanie zdjęcia)
    account/              konto: stan logowania (auth.ts), logowanie w aplikacji natywnej (nativeAuth.ts, useNativeAuthReturn),
                          powrót po zalogowaniu (returnTo.ts), profil i nick, eksport danych konta
    community/            społeczność: przepisy (api.ts, walidacja jak własny przepis) i napoje (drinks.ts, walidacja jak
                          katalog), sekcja na ekranie metody, publikowanie przepisu i napoju, zgłoszenie, listy stronami
    sync/                 synchronizacja i kopia zapasowa: format rekordów, scalanie (czyste funkcje), adaptery
                          magazynów, śledzenie zmian (metadane), wysyłka i pobieranie, plik JSON
    grinder/              Mój młynek: zapis młynków i ustawień dla metod, formularz, okno ustawienia,
                          panel przy skali mielenia i wiersz w parzeniu, odmiana jednostek
    favorites/            ulubione napoje i ulubione metody: zapis i przyciski „Ulubiony”/„Ulubiona”
    wishlist/             „Chcę spróbować”: lista napojów do spróbowania (zapis i przycisk)
    journal/              dziennik parzeń: zapis wpisów, ocena (gwiazdki), edycja, karta wpisu
    bar/                  Baribar: sekcje, filtry i grupy ziaren, ile napojów używa składnika (bar.ts, czyste funkcje),
                          sekcja ziaren, sekcje półki (mleka, syropy, dodatki, sprzęt, „brakuje jednej rzeczy”)
    shelf/                półka (co jest w barku), dostępność napoju (czysta funkcja), lista zakupów
    share/                karta napoju do udostępnienia: układ i kolory (czyste funkcje), SVG, eksport do PNG
    flow/                 ścieżka „Mam kawę”: kroki (od ziaren albo od napoju), wymagania, zapis wyborów
    syrups/               przepis i okno „Kup albo zrób sam”
  lib/                    format (odmiana, czas), color (kontrast, HSL), download, localStore,
                          useDialogParam, useNow, useOnline, useWakeLock, notifications (Capacitor, w PWA nic nie robi),
                          supabase (klient ładowany dynamicznie, wyłączony bez zmiennych VITE_SUPABASE_*)
  pages/                  ekrany tras
  test/                   setup, renderApp, fakeSupabase (Supabase w pamięci), testy kontrastu i konfiguracji, baza (PGlite + pgTAP)
e2e/                      testy Playwright
docs/                     publikacja, test na telefonie, aplikacja na Androida
android/                  projekt Androida (Capacitor): manifest, ikony, ekran startowy, ikona powiadomień
supabase/                 migracje SQL (RLS), testy pgTAP, funkcje serwerowe (Deno), config.toml
```

## Trasy

| Adres | Ekran |
| :- | :- |
| `/` | Start z przyciskiem „Mam kawę. Co z nią zrobić?” i ulubionymi napojami |
| `/mam-kawe` | menu: „Napoje do spróbowania”, „Zaskocz mnie”, „Wybiorę sam” |
| `/mam-kawe/do-sprobowania`, `/mam-kawe/zaskocz` | lista „Chcę spróbować” i losowy napój (`?napoj=id&temp=&mam=1`); wybór zaczyna ścieżkę od napoju |
| `/mam-kawe/:krok` | ścieżka „Wybiorę sam”: ziarna → metody → metoda → napoje → parzenie → napoj → podanie; od napoju: metoda → parzenie → napoj → podanie |
| `/napoje` | katalog (siatka kafelków) z „Moimi napojami” na początku, wyszukiwaniem `?q=` i filtrami w adresie (`?ulubione=1&sprobuj=1&moje=1&mam=1&temp=zimne&mleko=bez&roslinne=1&alkohol=bez&czas=10`); szybkie filtry w rzędzie, reszta w oknie `?filtry=1`, „Wylosuj kawę” `?los=id` losuje spośród wyników |
| `/napoje/:id` | napój z katalogu albo z „Moich napojów” (id `moj-…`); `?porcje=2` mnoży ilości, `?syrop=id` otwiera okno syropu, `?karta=1` kartę do udostępnienia, `?opublikuj=1` okno „Napój zapisany” (ostatni krok kreatora: publikacja albo aktualizacja w Społeczności) |
| `/napoje/nowy`, `/napoje/nowy?z=id`, `/napoje/:id/edycja` | kreator napoju: od zera, „Własna wersja” innego napoju, edycja „Mojego napoju” |
| `/napoje/mleko`, `/napoje/spienianie`, `/napoje/syropy` | poradniki |
| `/napoje/zakupy` | lista zakupów (`/napoje/co-mam` przekierowuje do Baribaru) |
| `/napoje/asystent` | asystent drinków (AI, z kontem): propozycja napoju z katalogu i półki, „Zapisz w Moich napojach” |
| `/parzenie`, `/parzenie/:id`, `/parzenie/:id/start` | metody jako kafelki (`?widok=ostatnie\|ulubione`, domyślnie A–Z), szczegóły z „Ulubiona”, prowadzone parzenie (cold brew: długi timer, `?wariant=`; własny przepis: `?przepis=id`) |
| `/parzenie/:id/przepisy/nowy`, `/parzenie/:id/przepisy/:przepis`, `…/:przepis/edycja` | własne przepisy: nowy (kopia przepisu metody), ekran przepisu (kalkulator, mielenie, kroki, „Wyślij”, usuwanie), edycja |
| `/przepis#dane` | przepis z linku: podgląd i „Zapisz u siebie” |
| `/parzenie/:id/spolecznosc/:przepis`, `/spolecznosc/przepisy/:przepis` | przepis społeczności (z ekranu metody albo z zakładki): „Parz według tego przepisu”, „Zapisz u siebie”, „Zgłoś” |
| `/spolecznosc` | Społeczność: pasek konta, `?sekcja=napoje\|przepisy\|moje` (napoje: siatka z rysunkiem; przepisy: lista; moje: opublikowane i do opublikowania); wyszukiwanie i filtry w adresie: `?q=&metoda=id&kolejnosc=popularne`, w napojach też `&temp=zimne&mleko=bez&alkohol=bez` |
| `/spolecznosc/napoje/:id` | napój społeczności: „Zapisz u siebie” (kopia w „Moich napojach” z `origin`), karta, „Wyślij link”, „Zgłoś” |
| `/moderacja` | kolejka moderatora: zgłoszone i ukryte przepisy i napoje, „Ukryj” i „Przywróć” |
| `/parzenie/dziennik`, `/parzenie/dziennik/:id` | dziennik parzeń: lista i wpis (ocena, notatka, ziarna, „Zaparz tak samo”) |
| `/baribar` | Baribar: `?sekcja=ziarna\|mleka\|syropy\|dodatki\|sprzet`, ziarna z `?q=&palenie=jasne&rodzaj=single`; podsumowanie „zrobisz teraz” |
| `/ziarna/nowe`, `/ziarna/:id`, `/ziarna/:id/edycja` | ziarna (część Baribaru; `/ziarna` przekierowuje na `/baribar`) |
| `/konto`, `/prywatnosc` | konto (logowanie linkiem albo kodem z e-maila i przez Google, nick, eksport, usunięcie; `?wroc=/adres` wraca tam po zalogowaniu) i polityka prywatności |
| `/ziarna/mlynek`, `/ziarna/mlynek/nowy` | Mój młynek: ustawienia dla metod, wybór używanego młynka, nowy młynek; `?mielenie=id-metody` otwiera okno ustawienia (też na ekranie metody, w „Mam kawę” i w parzeniu) |

Dolna nawigacja: Start, Napoje, Parzenie, Baribar, Społeczność. Zakładka jest aktywna także na podstronach; ścieżka „Mam kawę” należy do Startu, przepis z linku (`/przepis`) do Parzenia, ziarna i młynek (`/ziarna/...`) do Baribaru, a konto, polityka prywatności i moderacja do Społeczności.

## Dane (`src/data`)

- Wszystkie treści po polsku, id jako slugi (`kawa-pomaranczowa`), bo trafiają do adresów.
- Napój: baza kawowa (`methodId` + alternatywy albo `anyMethod: true` = każda metoda, wtedy bez alternatyw; listę metod bierz z `baseMethodIds()`), mleko (opcje, pierwsza polecana), dodatki (`syrupId` dla syropów, `dairy` dla nabiału bez zamiennika), warstwy **od dołu** (`liquid`/`foam`/`solid`, kolor, ml), kroki, podanie (naczynie + dekoracje z instrukcją i `look`).
- Ilość dodatku: `{ value, max?, unit }` mnoży się z porcjami i odmienia (`formatAmount`, jednostki: ml, g, kostka, gałka, łyżeczka, sztuka). Tekst („pełna szklanka”) zostaje bez zmian.
- Alkohol: napój jest „z alkoholem”, gdy ma dodatek `kind: 'alcohol'` (składnik z grupy `alcohol`), `hasAlcohol()`. Ma oznaczenie „z alkoholem 18+” (lista, ekran, karta), ostrzeżenie na ekranie napoju i filtr `?alkohol=bez`. Lód tylko do shakera to `kind: 'other'`, żeby nie rysował się w kieliszku.
- Składniki: katalog `ingredients` (index.ts) składa się z mlek, syropów i `extraIngredients` (`ingredients.ts`). Każdy dodatek napoju ma `ingredientId`, a nazwę w napoju osobno (`name`). Zamiennik to `{ id, note }`: inny składnik z katalogu i co się zmieni. Zamienniki syropów są w `syrups.ts`. `staple` = na półce od początku (lód, cukier), `always` = zawsze jest (woda).
- Metoda: `dose` to przepis, a `scaling` to granice kalkulatora (osoba w ml, zakres sprzętu, krok, w kawiarce rozmiary). W krokach ilości zapisuj jako znaczniki `{coffee}`, `{water}`, `{water*0.6}`. Ekrany pokazują metodę przeliczoną przez `scaleMethod()` (`features/brewing/dose`) na ilość z `useWaterMl()`. Nigdy nie wyświetlaj surowych kroków.
- Własny przepis (`features/recipes`, zapis `barista-companion.recipes.v1`): metoda + własna nazwa, dawka, temperatura, mielenie, ustawienie młynka i kroki w formacie `BrewStep` (te same znaczniki). Ekrany zamieniają go na metodę (`recipeToMethod`) i przeliczają jak metodę, a ilość z kalkulatora trzymają pod `recipeDoseKey(id)`. Przepis z zapisu i z linku przechodzi przez tę samą walidację (`parseRecipeInput`). Link: `/przepis#1.<base64url z JSON>` (wersja formatu przed kropką), bez ustawienia młynka.
- Espresso nie ma: bazą drinków „na espresso” jest kawiarka.
- Kawa rozpuszczalna to jedyna metoda bez mielenia (`instant: true`, baza dalgony i frappé po grecku). Nie ma jej w rankingu metod dla ziaren ani w ustawieniach młynka (`beanMethods`), a ekran metody i parzenie nie pokazują mielenia.
- Młynek (`grinders.ts`): jednostka (`click`/`mark`/`turn`), skala, krok i zakres dla każdego stopnia z `GRIND_SIZES`; `null` = tak drobno nie zmieli (tylko na drobnym końcu skali). Liczby odmieniaj przez `formatSetting()` (`features/grinder/format`), także ułamki („2,5 obrotu”).
- Wszystko, czego nie jesteś pewien, oznaczaj `needsReview: true` + `reviewNote`. `<ReviewNote>` pokazuje to tylko w trybie deweloperskim, żeby autor mógł sprawdzić treść.
- Reguły spójności napoju (odwołania, objętości, kolory, ilości, długości tekstów, id) są w czystym module `supabase/functions/_shared/drinkRules.ts` z katalogiem w parametrze; aplikacja woła je przez `validateDrink()` (`src/data/validate.ts`). Te same reguły sprawdzają katalog (`data.test.ts`), „Moje napoje” i propozycje asystenta, więc nową regułę napoju dopisuj tam, nie do testu. Nowy adres pod `/napoje/` dopisz do `DRINK_PAGES`.
- „Moje napoje” (`features/assistant/myDrinks.ts`, zapis `barista-companion.my-drinks.v1`, kolekcja synchronizacji `drinks`): propozycje asystenta (`source: 'ai'`), napoje z kreatora (`'own'`) i kopie ze społeczności (`'community'` z `origin`), id z przedrostkiem `moj-`. Poprawiona w kreatorze propozycja AI staje się `own`. Kreator (`features/drinkEditor`) kończy zapis `validateDrink`, a pętla „napój → formularz → napój” jest bezstratna dla całego katalogu (test). Napój po id bierz przez `useDrink()`/`drinkName()`, a listę przez `useAllDrinks()`, nie z samego `getDrink()`/`drinks`, gdy ekran ma działać też dla nich. Nie mają „Ulubionego” (ulubione to tylko katalog), za to mają „Usuń”.
- `data.test.ts` pilnuje spójności (odwołania, objętości, czasy, kolory). Nowy napój albo metoda muszą przez nie przejść.

## Konwencje

- **Język:** interfejs, treści i komentarze po polsku; nazwy w kodzie po angielsku. Polska odmiana liczebników: `count()`/`plural()` z `lib/format`.
- **Najpierw telefon:** 360–430 px, bez poziomego przewijania, cele dotyku ≥ 44 px (przyciski `h-10`–`h-14`), bezpieczne obszary (`env(safe-area-inset-*)`).
- **Kolory:** tylko tokeny semantyczne (`bg-canvas`, `bg-surface`, `bg-surface-muted`, `border-line`, `text-ink`, `text-ink-muted`, `text-accent`, `bg-accent`, `bg-accent-soft`, `text-on-accent`). Same przełączają motyw, nie dopisuj `dark:`. Paleta `coffee-*`/`caramel-*` tylko dla kolorów stałych. `src/test/contrast.test.ts` sprawdza WCAG AA par tekst/tło w obu motywach. Nowa para tokenów musi do niego trafić. Wyjątek: karta do udostępnienia ma stałe kolory liczone z napoju (obrazek wychodzi poza aplikację), a ich kontrast sprawdza `features/share/card.test.ts`.
- **Typografia:** `font-display` (szeryfowy) na nagłówki, `font-sans` na resztę; liczniki i liczby w `font-sans tabular-nums` (szeryfowa ma cyfry nautyczne). Fonty systemowe.
- **Ekrany:** każdy zaczyna się od `<PageHeader>` (tytuł karty, h1 przyjmujący fokus po zmianie ekranu, opcjonalnie powrót i ikona). Sekcje przez `<Section>` (region z nagłówkiem h2). Puste stany przez `<EmptyState>`.
- **Nawigacja:** główne linki mają `viewTransition` (płynne przejście; wyłączone przy ograniczeniu ruchu). Link z listy przekazuje `state={{ from }}`, a `<BackLink>` wtedy cofa w historii (zachowuje filtry i przewinięcie).
- **Okna:** `<Sheet>` (natywny `<dialog>`). Stan okna w adresie przez `useDialogParam`, żeby gest „wstecz” je zamykał.
- **Przewijane w bok rzędy pigułek** (`overflow-x-auto`): `<fieldset>` dostaje `min-w-0` (domyślnie rozpycha się do treści), a etykieta z ukrytym polem `sr-only` jest `relative` (inaczej pole „ucieka” z rzędu i robi poziome przewijanie strony; `ChoiceChip` i `Segmented` już to mają).
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
- Wersję natywną testuj z podmienionymi `@capacitor/core` (`isNativePlatform`) i `@capacitor/local-notifications` (`vi.mock`, patrz `pages/notifications.test.tsx`). Wtyczkę między testami zapominaj przez `resetNotificationsForTests()`. Wtyczka Capacitora to Proxy, które ma każdą metodę, także `then`: nie zwracaj jej z obietnicy ani z funkcji `async` (inaczej „LocalNotifications.then() is not implemented”, a testy na zwykłym obiekcie tego nie widzą), tylko w obiekcie jak `load()` w `lib/notifications`; atrapa w `notifications.test.tsx` jest takim Proxy.

## Backend (Supabase)

- **Bez konta działa wszystko, co działało.** Funkcje z serwerem są dodatkiem i chowają się bez internetu (`useOnline`) albo bez zmiennych `VITE_SUPABASE_URL`/`VITE_SUPABASE_ANON_KEY` (`backendEnabled()`).
- Klienta bierz tylko z `getSupabase()` (`lib/supabase`): ładuje bibliotekę dynamicznie. Start aplikacji jej nie ładuje, chyba że w przeglądarce jest zapisana sesja (`barista-companion.auth`). Stan konta: `useAuth()` (`features/account/auth`).
- Każda tabela: `enable row level security`, reguły tylko dla właściciela (`(select auth.uid()) = …`), klucz obcy do `auth.users` z `on delete cascade` (usunięcie konta usuwa wszystko). Nowa tabela to nowa migracja w `supabase/migrations` (nazwa z datą) i test pgTAP w `supabase/tests`.
- **Baza w testach:** `src/test/database.test.ts` stawia świeży PGlite z atrapą Supabase (role `anon`/`authenticated`/`service_role`, schemat `auth`, `auth.uid()` z `request.jwt.claims`, domyślne uprawnienia), wgrywa wszystkie migracje po kolei i uruchamia każdy plik `supabase/tests/*.test.sql` (pgTAP). Sprawdza też, że każda tabela w `public` ma RLS. Funkcja wołana w regule RLS musi mieć `execute` dla każdej roli z tej reguły (także `anon`), inaczej odczyt kończy się „permission denied”. Wgranej migracji nie zmieniaj: poprawka to nowa migracja.
- Sekrety (klucz `service_role`, klucz Claude) tylko w sekretach funkcji (`npx supabase secrets set`), nigdy w repozytorium ani w `VITE_*`. Funkcje serwerowe w Deno korzystają z `supabase/functions/_shared/http.ts` (CORS, zalogowany użytkownik, błędy po polsku) i nie logują treści od użytkowników.
- Teksty od użytkowników zawsze jako tekst (React), nigdy jako HTML.
- Testy nie czytają `VITE_*` z `.env.local` (`test.env` w `vite.config.ts`): domyślnie bez backendu i bez AI, a test z backendem włącza go sam.
- W testach podmieniaj `@supabase/supabase-js` atrapą z `src/test/fakeSupabase.ts` (`installFakeSupabase()`, w `beforeEach` też `resetSupabaseForTests()` i `resetAuthForTests()`, w `afterEach` `vi.unstubAllEnvs()`).
- **Synchronizacja** (`features/sync`): magazyny w przeglądarce zostają źródłem prawdy offline. Śledzenie zmian (`local.ts`) zapisuje dla każdego rekordu czas zmiany, znacznik usunięcia i czy czeka na wysłanie (`barista-companion.sync.v1`), a `mergeRecords` scala według zasady „wygrywa nowsza zmiana” dla każdego rekordu osobno (usunięcie też jest zmianą). Serwer: tabela `user_data` i RPC `sync_push`. Nowy magazyn z danymi użytkownika dostaje adapter w `sync/collections.ts` (rekordy, kolejność, parser, ewentualnie klucz duplikatu i podmiana odwołań) i `replaceAll` w swoim magazynie. Zmian nie zapisuj z pominięciem magazynu: śledzenie widzi tylko `store.set`.
- **Społeczność** (zakładka `/spolecznosc`): przegląda każdy, bez konta; konto jest potrzebne do publikowania, zgłaszania i liczenia zapisów („Zapisz u siebie” działa bez konta). Zachęta do logowania prowadzi na `/konto?wroc=…` (powrót po zalogowaniu, `features/account/returnTo.ts`).
- **Napoje społeczności** (`features/community/drinks.ts`, tabele `public_drinks`, `drink_saves`, `drink_reports`): napój jest dokumentem jsonb w schemacie `Drink`; baza pilnuje kształtu i rozmiaru (`valid_drink_document`), a nazwę i temperaturę bierze z dokumentu. Napój z serwera przechodzi `normalizeDrink` + `validateDrink`, zanim się narysuje (inaczej jest pomijany), i dostaje id `spolecznosc-…`. Publikować można tylko „Moje napoje” ze źródłem `own` (bez `origin`); kopia u siebie ma `source: 'community'` i `origin`.
- **Przepisy społeczności** (`features/community`, tabele `public_recipes`, `recipe_saves`, `recipe_reports`): przepis z serwera przechodzi `parseRecipeInput` jak własny, zanim się narysuje. Liczniki, stan i nick ustawia baza (funkcje `save_public_recipe`, `report_public_recipe`, `moderate_public_recipe`, `moderation_queue`), a autor zmienia tylko treść. Zgłoszenie ukrywa przepis do decyzji moderatora (P7), a przywrócony już nie znika po kolejnych zgłoszeniach. Kopia u siebie ma `origin` (od kogo); takiej kopii nie da się opublikować. Lista ładuje się, gdy sekcja pojawi się na ekranie.
- **Wyszukiwanie i filtry w Społeczności** liczy serwer (lista wczytuje się stronami): trigger ustawia z treści `search_text` (`search_fold` w SQL = `foldText`), `method_ids` (z „*” dla każdej metody), `has_milk`, `has_alcohol` (jak `hasMilk`/`hasAlcohol`). Zmiana tych reguł w aplikacji wymaga nowej migracji. Słowa zapytania: `searchWords()` (`features/community/filters.ts`), każde przez `ilike`. Atrapy w testach (`searchColumns` w `communityTab.test.tsx`) odwzorowują trigger.
- **Autor nie zapisuje swojego** napoju ani przepisu: ekran pokazuje oryginał (po `source_id`), a `save_public_drink`/`save_public_recipe` nie liczą zapisu autora.
- **Publikacja bez `upsert`:** autor ma `grant update` tylko na treść, a `upsert` z PostgREST ustawia też `author_id` i `source_id`, więc baza odrzuca go (42501, w aplikacji „Zaloguj się ponownie”). Publikacja to `insert`, a przy duplikacie (23505) `update` samej treści. Atrapa w testach odrzuca `upsert` na tabelach społeczności tak jak baza.
- **AI** (Claude tylko z funkcji serwerowych, klucz w sekretach Supabase) jest wyłączone, dopóki build nie ma `VITE_AI_ENABLED=true` (`aiEnabled()` z `lib/supabase`; dziś autor nie ma klucza API). Każde wejście w AI sprawdza `aiEnabled()`, nie samo `backendEnabled()`, a testy AI włączają je przez `vi.stubEnv`. Funkcje: skan etykiety `scan-label` i asystent drinków `drink-assistant` (P9: tylko id z katalogu, które wysyła aplikacja; wynik przechodzi reguły napoju na serwerze i jeszcze raz w aplikacji, przy błędach jedna prośba o poprawkę). Logikę, którą musi znać i serwer, i aplikacja (schemat odpowiedzi, prompt, walidacja wyniku), trzymaj w czystych modułach bez importów w `supabase/functions/_shared/` (np. `labelScan.ts`, `drinkAssistant.ts`, `drinkRules.ts`); aplikacja importuje je przez ścieżkę względną, a Vitest je testuje. Model `claude-opus-5-5`, JSON przez structured outputs (`output_config.format`; wymuszony `tool_choice` daje na tym modelu 400), `fallbacks: "default"` na odmowę. Każda funkcja AI: dzienny limit (`ai_usage`, `_shared/quota.ts`, P8), zgoda przed pierwszym wysłaniem danych, powrót do wersji bez AI po błędzie, limicie albo bez logowania. Funkcje Deno sprawdzaj `npm run typecheck:functions` (`supabase/functions/tsconfig.json` mapuje importy `npm:`/`jsr:` na `node_modules`; wersja w imporcie i w `devDependencies` musi być ta sama).
- Kopia zapasowa (`sync/backup.ts`, ekran konta, działa bez konta): format `barista-companion.backup` w wersji 2, wczytanie scala z danymi na urządzeniu.
- Nowa funkcja z serwerem dopisuje do polityki prywatności (`pages/PrivacyPage.tsx`), co zbiera, po co i gdzie. Instrukcja wdrożenia: [docs/backend.md](docs/backend.md).

## PWA, telefon i publikacja

- Service worker działa tylko w buildzie (`npm run build` + `npm run preview`); w `npm run dev` jest wyłączony, a w aplikacji natywnej się nie rejestruje (`main.tsx`, `injectRegister: false`).
- **Logowanie w aplikacji na Androida:** link z e-maila i Google wracają adresem `pl.baristacompanion.app://konto?code=…` (intent-filter w manifeście, na liście Redirect URLs w Supabase). `useNativeAuthReturn` w `AppLayout` słucha `appUrlOpen` i `getLaunchUrl` (bez ładowania Supabase, dopóki nie przyjdzie kod), wymienia kod (`exchangeCodeForSession`) i wraca pod adres z `returnTo`. Google w Custom Tabs (`skipBrowserRedirect` + `Browser.open`). Adres powrotu bierz z `authRedirect()`, nie składaj go ręcznie. W testach podmieniaj `@capacitor/app`, `@capacitor/browser` i `@capacitor/local-notifications` (patrz `pages/nativeAuth.test.tsx`).
- **Aplikacja na Androida:** powiadomienia planuj tylko przez `lib/notifications` (stałe id z `NOTIFICATION_IDS`, jeden kanał `parzenie`). Krok ze stoperem planuje powiadomienie w `useBrewSession`, a pauza, reset, zmiana kroku i wyjście je odwołują; cold brew planuje `useColdBrewNotification` w `AppLayout`. O zgodę pyta `<NotificationPrompt>` z wyjaśnieniem przed oknem systemu; bez zgody aplikacja działa jak PWA. Gradle 8.14 uruchamia się na Javie 21 z `android/gradle/gradle-daemon-jvm.properties` (Android Studio ma Javę 25, której Gradle 8 nie obsługuje); nie aktualizuj AGP ani Gradle do 9, dopóki jest Capacitor 8 (`src/test/android.test.ts`). Instrukcja i lista kontrolna: [docs/aplikacja-android.md](docs/aplikacja-android.md).
- Precache: js/css/html, ikony z manifestu i `includeAssets` w `vite.config.ts`. Nowy plik z `public/` potrzebny offline dopisz do `includeAssets`.
- Skan etykiety pobiera przy pierwszym użyciu worker, rdzeń WASM i modele `pol`+`eng` z cdn.jsdelivr.net (kilka MB). Service worker trzyma je w pamięci podręcznej `ocr` (`workbox.runtimeCaching`), a modele zostają też w IndexedDB. W testach `ocr.ts` podmieniaj przez `vi.mock`.
- Ikony w `public/` są tymczasowe (PNG wygenerowane z `favicon.svg`).
- Telefon w tej samej sieci otwiera adres „Network” z `npm run dev`, ale przez `http://` nie działa service worker, instalacja ani Wake Lock. Pełny test: wersja na Vercelu (HTTPS) albo Android przez USB z przekierowaniem portu w `chrome://inspect`.
- Windows przy pierwszym uruchomieniu może zapytać o dostęp Node.js do sieci: zezwól dla sieci prywatnej.
- Vercel: `vercel.json` przekierowuje wszystkie ścieżki na `index.html` i nie cache'uje `sw.js`; `src/test/deploy.test.ts` tego pilnuje. Nie publikuj i nie zakładaj kont bez zgody autora.
