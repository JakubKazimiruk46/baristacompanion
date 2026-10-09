# Barista Companion: społeczność z napojami, Baribar, nowe Parzenie i Napoje, konto w aplikacji

Data: 2026-10-09 · Źródło: lista sześciu zmian od autora (konto, zakładka „Społeczność”, kafelki w „Parzeniu”, wyszukiwarka i losowanie w „Napojach”, „Baribar” zamiast „Moich ziaren”, „Chcę spróbować” i menu „Mam kawę”) + pytanie o bazę danych. Kolejność kroków wybrałem sam (autor: „kolejność nie ma znaczenia”).

## Cel

Aplikacja ma być wygodna na telefonie bez konta i z kontem. Konto otwiera społeczność: publikowanie własnych przepisów parzenia i własnych napojów (z rysunkiem podania), a wszyscy mogą je przeglądać. Główne zakładki przestają być długimi listami do przewijania.

## Stan wyjściowy

- Konto (Supabase: logowanie linkiem/kodem z e-maila i Google), synchronizacja, przepisy społeczności (tylko parzenie, na ekranie metody), moderacja i AI są w kodzie (plan [2026-10-08-przepisy-aplikacja-natywna-backend.md](2026-10-08-przepisy-aplikacja-natywna-backend.md), kroki 5–9).
- **Nie ma projektu Supabase**, więc w zbudowanej aplikacji konto pokazuje „Konto nie jest dostępne w tej wersji”. Migracje SQL nigdy nie były uruchomione (brak Dockera, brak projektu).
- Dolna nawigacja: Start, Napoje, Parzenie, Moje ziarna. Parzenie: 14 metod jako długa lista kart. Napoje: 36 napojów, filtry w pięciu zawijanych grupach nad listą (przy 360 px zajmują pół ekranu). Moje ziarna: lista bez grup i wyszukiwania. „Co mam w domu” jest pod `/napoje/co-mam`.
- W aplikacji na Androida działa tylko logowanie kodem z e-maila (link otwiera przeglądarkę, Google ukryte).

## Decyzje (moje założenia, do potwierdzenia przez autora)

| Nr | Decyzja | Dlaczego |
| :- | :- | :- |
| D1 | Dolna nawigacja: **Start, Napoje, Parzenie, Baribar, Społeczność** (5 zakładek). Konto: nagłówek zakładki Społeczność + skrót na Starcie | 5 zakładek mieści się przy 360 px (72 px na zakładkę); konto jest tam, gdzie jest potrzebne |
| D2 | Społeczność **przegląda każdy, bez konta** (tylko odczyt). Konto potrzebne do publikowania, zgłaszania i liczenia zapisów. „Zapisz u siebie” działa bez konta (kopia w telefonie) | Aplikacja ma działać bez konta; zamknięta za logowaniem zakładka to pusty ekran dla większości. RLS już pozwala `anon` czytać opublikowane |
| D3 | Podanie w napojach społeczności: **kreator z rysunkiem szklanki** (naczynie, warstwy od dołu z kolorami, dekoracje), ten sam rysunek co w katalogu. **Bez zdjęć** | Rysunek da się zrobić (model `Drink` + reguły `drinkRules` już są). Zdjęcia wymagają magazynu plików, moderacji obrazów i zmian w polityce prywatności |
| D4 | Własny napój z kreatora działa **bez konta** („Moje napoje”, `source: 'own'`), publikacja wymaga konta. Publikować można tylko własne (`own`); kopia ze społeczności ma `origin` jak kopia przepisu | Spójne z przepisami parzenia |
| D5 | **Baribar** (`/baribar`) = ziarna (grupy według palenia, wyszukiwanie, filtry) + mleka, syropy, dodatki i sprzęt (dawne „Co mam w domu”) + młynek. Szczegóły ziaren zostają pod `/ziarna/...`, `/ziarna` i `/napoje/co-mam` przekierowują | Jedno miejsce na „co mam w barku”; mniej zmian w adresach i testach |
| D6 | „Mam kawę” otwiera menu `/mam-kawe`: „Napoje do spróbowania”, „Zaskocz mnie”, „Wybiorę sam”. Dotychczasowe 7 kroków zaczyna się od `/mam-kawe/ziarna`. Wybór napoju z menu prowadzi krótszą ścieżką: metoda i mielenie → parzenie → złóż napój → podanie (4 kroki) | Napój wyznacza metodę, więc ziarna i ranking metod są zbędne |
| D7 | „Zaskocz mnie” losuje z katalogu i Moich napojów, z szybkim wyborem „na ciepło / na zimno / z tego, co mam”. „Wylosuj kawę” w Napojach losuje **spośród wyników filtrów i wyszukiwania** i mówi to wprost | Research: losowanie, które ignoruje filtry, myli |
| D8 | Parzenie: kafelki 3 w rzędzie, przełącznik „A–Z / Ostatnio parzone / Ulubione” w adresie (`?widok=`). Ulubione metody to nowy zapis z synchronizacją, „Ostatnio parzone” liczy dziennik | |
| D9 | **Baza danych: zostaje Supabase (Postgres).** To jest baza „z prawdziwego znaczenia”: schemat, RLS i funkcje są w migracjach. Brakuje tylko projektu, który zakłada autor (`docs/backend.md`). Treści katalogu zostają w repozytorium (offline, wersjonowane, testowane). Migracje sprawdzam lokalnie na **PGlite** (Postgres w WASM, bez Dockera) | Przeniesienie katalogu do bazy zepsułoby działanie offline i bez konta |
| D10 | Android: link z e-maila i Google wracają do aplikacji przez schemat `pl.baristacompanion.app://konto` (`@capacitor/app` + `@capacitor/browser`, Google w Custom Tabs) | Bez tego konto w aplikacji działa tylko kodem |
| D11 | Jedna gałąź `feature/spolecznosc-baribar` od `main`, osobny commit na każdy krok | Kroki zależą od siebie (nawigacja) |

## Nawigacja i trasy po zmianach

| Zakładka | Korzeń | Nowe i zmienione adresy |
| :- | :- | :- |
| Start | `/` | `/mam-kawe` (menu), `/mam-kawe/do-sprobowania`, `/mam-kawe/zaskocz`, `/mam-kawe/ziarna` … `/mam-kawe/podanie` |
| Napoje | `/napoje` | `?q=` (szukaj), `?los=` (okno losowania), `?sprobuj=1`; `/napoje/nowy`, `/napoje/:id/edycja` (kreator) |
| Parzenie | `/parzenie` | `?widok=az\|ostatnie\|ulubione` |
| Baribar | `/baribar` | `?sekcja=ziarna\|mleka\|syropy\|dodatki\|sprzet`, `?q=`, `?palenie=`; `/ziarna` → `/baribar`, `/napoje/co-mam` → `/baribar?sekcja=mleka` |
| Społeczność | `/spolecznosc` | `?sekcja=napoje\|przepisy\|moje`, `/spolecznosc/napoje/:id`, `/spolecznosc/przepisy/:id`; konto `/konto` należy do tej zakładki |

## Plan pracy

| Krok | Stan |
| :- | :- |
| 1. „Chcę spróbować” i menu „Mam kawę” | zrobione |
| 2. Napoje: wyszukiwarka, losowanie, filtry w oknie | do zrobienia |
| 3. Parzenie: kafelki, widoki, ulubione metody | do zrobienia |
| 4. Baribar | do zrobienia |
| 5. Kreator napoju (własne napoje bez konta) | do zrobienia |
| 6. Społeczność: zakładka, napoje społeczności, konto | do zrobienia |
| 7. Konto w aplikacji na Androida | do zrobienia |
| 8. Baza: migracje i RLS sprawdzane na PGlite | do zrobienia |

1. **„Chcę spróbować” i menu „Mam kawę”** (pkt 6). Zapis `barista-companion.to-try.v1` (id napojów z katalogu i Moich napojów, kolekcja synchronizacji `to-try`, migracja dopuszcza nową kolekcję). Przełącznik „Chcę spróbować” na ekranie napoju obok „Ulubiony”, znacznik na karcie, filtr `?sprobuj=1`. Menu `/mam-kawe` z trzema wyborami; „Do spróbowania” (lista, pusty stan z linkiem do Napojów), „Zaskocz mnie” (losowy napój z „Losuj jeszcze raz” i „Robię ten napój”), „Wybiorę sam” (7 kroków). Ścieżka od napoju: 4 kroki, metoda bazy z alternatywami. Na podaniu: „Spróbowane, usuń z listy”. Gotowe, gdy: testy menu, ścieżki od napoju i zapisu, E2E przechodzi (z nowym menu), a stara ścieżka działa jak dotąd.

   Wykonanie: `features/wishlist` (zapis, przycisk), `features/drinks/random.ts` (`pickRandom` bez powtórki tego, co na ekranie), `flow.ts` z `start: 'wishlist' | 'surprise'` (`flowSteps`, `flowRedirect`, `flowEntryPath`), ekrany `FlowMenuPage.tsx` (menu i lista) i `SurprisePage.tsx`. Ścieżka od napoju działa też dla „Moich napojów” (`findDrink`). „Zacznij od nowa” wraca do menu i nie czyści stanu (każda droga z menu ustawia go sama). Migracja `20261010090000_user_data_collections.sql` dopuszcza kolekcje `wishlist` i `method-favorites`.
2. **Napoje** (pkt 4). Wyszukiwarka na górze (nazwa i hasło, bez polskich znaków i wielkości liter, `?q=`), jeden przewijany w bok rząd szybkich filtrów (Mogę zrobić, Ulubione, Do spróbowania, Na ciepło, Na zimno) + „Filtry” z liczbą aktywnych otwiera okno z resztą (mleko, roślinne, alkohol, czas) i przyciskiem „Pokaż N napojów”. Aktywne filtry jako usuwalne pigułki nad wynikami. „Wylosuj kawę” losuje spośród wyników i pokazuje okno z rysunkiem, „Zobacz przepis” i „Losuj jeszcze raz”. Lista jako siatka 2 kolumn z dużym rysunkiem szklanki. Poradniki i asystent pod spodem. Gotowe, gdy: filtry i wyszukiwanie w adresie, losowanie zgodne z filtrami (czysta funkcja z testem), testy ekranu.
3. **Parzenie** (pkt 3). Kafelki kwadratowe 3 w rzędzie (ikona metody + nazwa), przełącznik widoku A–Z / Ostatnio parzone / Ulubione, serce „Ulubiona” na ekranie metody, zapis `barista-companion.method-favorites.v1` (synchronizacja). Dziennik i trwające cold brew nad kafelkami. Gotowe, gdy: sortowanie jako czysta funkcja z testem, testy ekranu, E2E.
4. **Baribar** (pkt 5). Zakładka i ekran `/baribar` z sekcjami: Ziarna (wyszukiwanie po nazwie, palarni i pochodzeniu, filtr palenia i rodzaju, grupy „Jasne/Średnie/Ciemne palenie”), Mleka, Syropy (z „zrób sam”), Dodatki, Sprzęt (metody i młynek). Podsumowanie „zrobisz N napojów” i lista zakupów. Przekierowania starych adresów. Gotowe, gdy: testy ekranu i filtrów (czyste funkcje), stare testy półki przeniesione.
5. **Kreator napoju** (pkt 2). `/napoje/nowy` i „Zrób własną wersję” na ekranie napoju z katalogu, edycja `/napoje/:id/edycja`. Pola: nazwa, hasło, opis, temperatura, czas, baza (metoda, ml), mleko (rodzaje, ml, przygotowanie), dodatki (syropy i składniki z katalogu z ilością), naczynie, warstwy od dołu (rodzaj, kolor z palety albo dowolny, ml, przesuwanie), „Podpowiedz warstwy” ze składników, dekoracje (rodzaj, wygląd, kolor, instrukcja), kroki. Podgląd szklanki na żywo i licznik objętości. Formularz jako czyste funkcje (`draft.ts`: napój ↔ formularz, błędy po polsku), na końcu `validateDrink`. Zapis w „Moich napojach” z `source`. Gotowe, gdy: testy draftu i ekranu, napój z kreatora ma kartę, półkę, „Chcę spróbować”.
6. **Społeczność** (pkt 1 i 2). Migracja: `public_drinks` (napój jako jsonb z limitem rozmiaru, nazwa, temperatura, stan, liczniki), `drink_saves`, `drink_reports`, funkcje zapisu, zgłoszenia i moderacji, kolejka moderatora z rodzajem pozycji, nick przy napojach. Zakładka `/spolecznosc`: pasek konta (nick albo „Zaloguj się, żeby publikować”), sekcje Napoje (najnowsze/popularne, siatka z rysunkiem), Przepisy (wszystkie metody, filtr metody), Moje (opublikowane z liczbą zapisów i stanem). Ekran napoju społeczności (rysunek, składniki, kroki, podanie, autor, „Zapisz u siebie”, „Udostępnij”: karta PNG i link, „Zgłoś”). „Opublikuj” przy własnym napoju. Napój z serwera przechodzi `normalizeDrink` + `validateDrink`, zanim się narysuje. Logowanie z zakładki wraca na miejsce (`?wroc=`). Gotowe, gdy: testy na atrapie Supabase (przeglądanie bez konta, publikacja, zapis, zgłoszenie, moderacja), test pgTAP, polityka prywatności uzupełniona.
7. **Konto w aplikacji na Androida** (pkt 1). `@capacitor/app` i `@capacitor/browser`, schemat `pl.baristacompanion.app` w manifeście, w wersji natywnej `redirectTo` na ten schemat, Google przez Custom Tabs, wymiana kodu po powrocie (`exchangeCodeForSession`). Dokumentacja (adres powrotu w Supabase). Gotowe, gdy: testy z podmienionymi wtyczkami; sprawdzenie na telefonie czeka na autora.
8. **Baza na PGlite** (PS autora). `npm run test:db`: PGlite z atrapą schematu `auth` i ról Supabase, wszystkie migracje po kolei, testy reguł dostępu (właściciel, inny użytkownik, anon) dla nowych tabel. Gotowe, gdy: migracje wchodzą bez błędów, testy RLS przechodzą.

## Jak pracować

- Zasady z [CLAUDE.md](../CLAUDE.md). Przed commitem: `npm run typecheck`, `npm test`; przy zmianach w ścieżce „Mam kawę”, parzeniu i nawigacji także `npm run test:e2e`.
- CLAUDE.md (trasy, struktura, nawigacja) i kolumna „Stan” aktualizowane po każdym kroku.
- Nie zakładam kont (Supabase, Google) i niczego nie publikuję.

## Research UX: katalog napojów (krok 2)

- Mixel: najpierw to, co masz w barku (filtr „mogę zrobić”), wyszukiwarka i filtry na górze ([designrush](https://www.designrush.com/best-designs/apps/mixel), [windracer](https://www.windracer.net/blog/2019/03/making-cocktails-with-mixel/)).
- Highball: przepisy jako karty z dużą ilustracją, prośby użytkowników o sortowanie ([fueled](https://fueled.com/blog/cocktail-library-highball-app/)).
- Losowanie jako widoczne wejście („surprise yourself”), a nie ukryty gest; losowanie ignorujące filtry myli użytkowników ([cocktailApp](https://cran.rstudio.com/web/packages/cocktailApp/refman/cocktailApp.html)).
- Filtry: najczęstsze jako pigułki w jednym rzędzie, reszta w oknie od dołu, liczba wyników na przycisku, aktywne filtry widoczne i łatwe do zdjęcia ([uxpin](https://uxpin.com/studio/blog/filter-ui-and-ux), [algolia](https://www.algolia.com/de/blog/ux/search-filter-ux-best-practices), [devexpress](https://community.devexpress.com/blogs/mobile/archive/2023/10/12/net-maui-mobile-collection-filtering-best-practices.aspx)).

## Poza zakresem

Zdjęcia w przepisach i napojach, komentarze i oceny gwiazdkami w społeczności, obserwowanie autorów, iOS, baza ziaren i palarni (krok 10 poprzedniego planu, odłożony).
