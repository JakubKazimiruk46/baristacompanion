# Barista Companion: młynek, własne przepisy, więcej drinków, aplikacja natywna i backend

Data: 2026-10-08 · Źródło: autor wybrał funkcje z listy braków po etapie [funkcje z analizy konkurencji](2026-10-08-funkcje-z-analizy-konkurencji.md). Plan jest do kontynuacji w kolejnych sesjach: każdy krok ma gotowy prompt na końcu pliku.

## Cel

Ułatwić powtarzanie dobrej kawy (młynek, własne przepisy), rozbudować sedno aplikacji (drinki), dać prawdziwe powiadomienia przy zablokowanym ekranie (aplikacja natywna) i dodać to, czego nie da się zrobić bez serwera: konta z synchronizacją, przepisy społeczności, AI i bazę ziaren.

## Stan wyjściowy

Gałąź `main` ma MVP i osiem funkcji z poprzedniego etapu. Najważniejsze miejsca w kodzie dla tego planu:

| Co | Gdzie |
| :- | :- |
| Metody, znaczniki ilości w krokach (`{coffee}`, `{water*0.6}`), granice kalkulatora | `src/data/methods.ts`, `features/brewing/dose.ts`, `doseStore.ts` |
| Prowadzone parzenie (reducer, stoper, sygnały, Wake Lock) | `features/brewing/` (`session.ts`, `timer.ts`, `useBrewSession.ts`, `signals.ts`, `BrewSession.tsx`) |
| Skala mielenia na ekranie metody | `features/brewing/GrindScale.tsx` |
| Dziennik (wpis powstaje przy „Zakończ”) | `features/journal/` |
| Cold brew (długi timer, zapis startu, .ics) | `features/coldbrew/` |
| Napoje, składniki z zamiennikami, syropy, naczynia | `src/data/drinks.ts`, `ingredients.ts`, `syrups.ts`, `vessels.ts` |
| Rysunek szklanki (kształty naczyń) | `features/glass/geometry.ts`, `DrinkGlass.tsx`, `Decorations.tsx` |
| Spójność danych | `src/data/data.test.ts` |
| Skan etykiety w przeglądarce (OCR + parser) | `features/beans/scan/` (`ocr.ts`, `parseLabel.ts`, `LabelScan.tsx`) |
| Zapis w przeglądarce | `lib/localStore.ts` (`createLocalStore`), klucze `barista-companion.*.v1` |

Zasady projektu (język, kolory, testy, dostępność, telefon najpierw) są w [CLAUDE.md](../CLAUDE.md). Obowiązują też tutaj.

## Decyzje autora

- Interesują go: ustawienie młynka, własne przepisy, szerszy katalog drinków, powiadomienia przy zablokowanym ekranie, konta z synchronizacją, przepisy społeczności, AI (etykiety i asystent drinków), zewnętrzna baza ziaren i palarni.
- Plan kontynuuje w osobnych sesjach.

## Moje założenia

Każde do potwierdzenia albo poprawy w pytaniach blokujących.

- **Kolejność:** najpierw etap A bez backendu (kroki 1–3), potem aplikacja natywna (krok 4), na końcu backend (kroki 5–10). Etap A daje korzyść od razu, a własne przepisy są potrzebne przepisom społeczności.
- **Aplikacja działa dalej bez konta i offline.** Konto jest dodatkiem: synchronizacja, publikowanie, AI. Nic, co działa dziś, nie może wymagać logowania.
- **Backend: Supabase** (Postgres, logowanie, Row Level Security, Edge Functions, region UE). Jedna usługa daje konta, bazę i funkcje serwerowe, a frontend dalej stoi na Vercelu jako statyczna strona. Alternatywa: funkcje Vercela + osobna baza (np. Neon) + biblioteka logowania. Wymaga więcej własnego kodu.
- **AI: Claude API wywoływane tylko z funkcji serwerowej.** Klucz nigdy nie trafia do przeglądarki, a każde wywołanie ma limit na użytkownika. Model i cenę sprawdź przy implementacji (skill `claude-api`).
- **Aplikacja natywna: Capacitor**, na start tylko Android. Kod React zostaje ten sam, a Capacitor opakowuje zbudowany `dist/`. iOS wymaga Maca (albo chmury z macOS) i konta Apple Developer, więc jest poza tym planem.
- **Baza ziaren:** własna baza w Supabase (palarnie i ziarna, uzupełniane przez autora i społeczność z moderacją) + wyszukiwanie po kodzie kreskowym w Open Food Facts przez nasz backend. Nie pobieramy automatycznie danych ze sklepów palarni (regulaminy, prawa do danych).
- **Prywatność:** polityka prywatności, usuwanie konta i eksport danych powstają razem z kontami (krok 5), zanim cokolwiek trafi na serwer.

## Pytania blokujące

Sesja, która zaczyna dany krok, zadaje autorowi pytania z kolumny „Przed krokiem” (AskUserQuestion), o ile odpowiedź nie jest już wpisana. Odpowiedzi wpisuj do kolumny „Odpowiedź”.

| Nr | Pytanie | Przed krokiem | Moja rekomendacja | Odpowiedź |
| :- | :- | :-: | :- | :- |
| P1 | Drinki z alkoholem (irish coffee, espresso martini) w katalogu? | 3 | Tak, z oznaczeniem „z alkoholem” i filtrem „Bez alkoholu” | |
| P2 | Dalgona i frappé po grecku wymagają kawy rozpuszczalnej. Dodać ją jako bazę? | 3 | Tak, jako „metodę” bez parzenia (tylko rozpuszczenie), z notatką, że to wyjątek | |
| P3 | Aplikacja natywna: tylko Android na start? Publikacja w Google Play (jednorazowo 25 USD) czy tylko plik APK do zainstalowania? | 4 | Android, na start APK do testów, Google Play później | |
| P4 | Backend: Supabase (plan darmowy, region UE)? Kto zakłada konto i projekt? | 5 | Supabase; konto zakłada autor, sesja prowadzi krok po kroku | |
| P5 | Logowanie: link e-mail, Google, Apple? | 5 | Link e-mail + Google. Apple wymaga konta Apple Developer | |
| P6 | Kto jest administratorem danych w polityce prywatności (autor jako osoba prywatna, firma)? | 5 | Do decyzji autora; sesja przygotuje szkic do uzupełnienia | |
| P7 | Przepisy społeczności widoczne od razu czy po akceptacji? Kto moderuje? | 7 | Od razu, a zgłoszenia ukrywają przepis do decyzji moderatora (autor) | |
| P8 | Zgoda na koszty API Claude: dzienny limit na użytkownika i miesięczny limit wydatków? AI tylko dla zalogowanych? | 8 | Tylko dla zalogowanych, np. 20 skanów i 10 propozycji drinków dziennie, limit wydatków ustawiony w konsoli Anthropic | |
| P9 | Asystent drinków: czy wolno mu proponować składniki spoza katalogu? | 9 | Nie: tylko składniki, metody i naczynia z danych, żeby rysunek i półka działały | |

## Jak pracować

- Każdy krok to jedna sesja: nowa gałąź od `main` (`feature/<krótka-nazwa>`), osobny commit (albo kilka) i merge po akceptacji autora.
- Przed końcem: `npm run typecheck`, `npm test`, a przy zmianach w ścieżce „Mam kawę”, parzeniu albo nawigacji także `npm run test:e2e`.
- Nowe ekrany i zachowania mają testy (Testing Library, `renderApp`). Usługi zewnętrzne (Supabase, Claude, Capacitor, Open Food Facts) podmieniaj w testach przez `vi.mock`.
- Aktualizuj CLAUDE.md (struktura, trasy, konwencje) i kolumnę „Stan” w tym planie.
- Nie zakładaj kont, nie publikuj i nie dodawaj sekretów do repozytorium bez zgody autora. Klucze tylko w zmiennych środowiskowych (`.env.local` jest w `.gitignore`) i w sekretach Supabase.
- Treści, których nie jesteś pewien, oznaczaj `needsReview` (dane) albo opisz w podsumowaniu sesji.

## Plan pracy

| Krok | Stan |
| :- | :- |
| 1. Ustawienie młynka | zrobione (gałąź `feature/mlynek`), czeka na akceptację autora |
| 2. Własne przepisy | do zrobienia |
| 3. Szerszy katalog drinków | do zrobienia |
| 4. Powiadomienia w aplikacji na Androida | do zrobienia |
| 5. Backend: konto i prywatność | do zrobienia |
| 6. Synchronizacja danych | do zrobienia |
| 7. Przepisy społeczności | do zrobienia |
| 8. AI: rozpoznawanie etykiet | do zrobienia |
| 9. AI: asystent drinków | do zrobienia |
| 10. Baza ziaren i palarni | do zrobienia |

### Etap A: bez backendu

1. **Ustawienie młynka.** Użytkownik dodaje swój młynek (z listy popularnych albo własny, z jednostką: kliknięcia, działki, obroty) i zapisuje ustawienie dla każdej metody. Dla znanych modeli aplikacja podpowiada zakres z tabeli. Gotowe, gdy:
   - młynek i ustawienia zapisują się w przeglądarce,
   - ekran metody i prowadzone parzenie pokazują ustawienie przy skali mielenia,
   - wpis w dzienniku zapisuje ustawienie, a „Zaparz tak samo” je pokazuje,
   - tabela podpowiedzi ma `needsReview` i testy spójności (każdy stopień mielenia z `GRIND_SIZES` ma zakres).

   Wykonanie (2026-10-09): 10 modeli w `src/data/grinders.ts` (zakresy z honestcoffeeguide.com i baristalife.co, zawężone do naszych stopni mielenia, wszystkie `needsReview`). Odstępstwa od planu: młynek, który tak drobno nie zmieli (Timemore do tygielka, Baratza, Wilfa, Fellow), ma `null` zamiast zakresu i komunikat zamiast zmyślonej podpowiedzi. Można mieć kilka młynków i wybrać używany. W prowadzonym parzeniu ustawienie widać przy pierwszym kroku (wtedy się mieli), a cold brew zapisuje je już przy zalaniu.
2. **Własne przepisy.** „Zrób własną wersję” na ekranie metody kopiuje jej przepis do edytora: nazwa, dawka, temperatura, mielenie, kroki (tekst, szczegóły, czas, działanie czy czekanie). Kroki dodaje się, usuwa i przesuwa przyciskami. Gotowe, gdy:
   - przepisy zapisują się i są na liście „Twoje przepisy” na ekranie metody,
   - prowadzone parzenie i kalkulator działają z własnym przepisem,
   - dziennik zapisuje, z którego przepisu było parzenie,
   - przepis da się wysłać linkiem (dane w adresie, bez serwera) i zapisać u siebie z linku.
3. **Szerszy katalog drinków.** Co najmniej 35 napojów (dziś 21): m.in. frappé (zmiksowana mrożona kawa), smoothie kawowe z bananem, shake z masłem orzechowym, mazagran (kawa z cytryną i lodem), kawa z miodem i cynamonem, latte piernikowa, latte dyniowa, latte lawendowa, biała mocha, kawa po wietnamsku z jajkiem (phin). Do tego, zależnie od P1 i P2: irish coffee, espresso martini z kawiarki, dalgona, frappé po grecku. Gotowe, gdy:
   - nowe napoje przechodzą `data.test.ts`,
   - nowe syropy (np. piernikowy, dyniowy, lawendowy) mają przepisy i zamienniki,
   - nowe naczynia (np. szklanka do irish coffee, kieliszek do martini) rysują się poprawnie i mają testy geometrii,
   - karta do udostępnienia mieści każdy nowy napój (`card.test.ts`),
   - jeśli są drinki z alkoholem: oznaczenie i filtr „Bez alkoholu”.

### Etap B: aplikacja natywna

4. **Powiadomienia w aplikacji na Androida.** Capacitor opakowuje aplikację. Koniec kroku ze stoperem i gotowe cold brew planują lokalne powiadomienie, które przychodzi też przy zablokowanym ekranie. PWA działa jak dotąd. Gotowe, gdy:
   - projekt Androida jest w repozytorium, a instrukcja budowania APK w `docs/aplikacja-android.md`,
   - na telefonie albo w emulatorze przy zablokowanym ekranie przychodzi powiadomienie z dźwiękiem na końcu kroku i na koniec maceracji cold brew,
   - pauza, reset, przejście dalej i wyjście z parzenia odwołują zaplanowane powiadomienie,
   - aplikacja prosi o zgodę na powiadomienia z wyjaśnieniem i działa po odmowie,
   - service worker jest wyłączony w wersji natywnej,
   - testy jednostkowe pokrywają planowanie i odwoływanie (moduł powiadomień podmieniony).

   Ograniczenie Androida: w trybie uśpienia (Doze) powiadomienia z `allowWhileIdle` przychodzą najwyżej raz na 9 minut, a dokładny czas wymaga uprawnienia `SCHEDULE_EXACT_ALARM` (Android 12+). Jeśli testy na telefonie pokażą opóźnienia, dodaj usługę pierwszoplanową z licznikiem w powiadomieniu (własna wtyczka). To osobny, opcjonalny commit.

### Etap C: backend

5. **Backend: konto i prywatność.** Projekt Supabase (UE), migracje SQL w `supabase/migrations`, klient ładowany dynamicznie dopiero przy logowaniu albo synchronizacji. Ekrany `/konto` (logowanie, wylogowanie, nick, usunięcie konta, eksport danych) i `/prywatnosc` (polityka prywatności). Gotowe, gdy:
   - logowanie działa lokalnie i na podglądzie Vercela,
   - usunięcie konta usuwa użytkownika i wszystkie jego dane (funkcja serwerowa),
   - bez logowania aplikacja działa jak dotąd (wszystkie testy i E2E),
   - w repozytorium nie ma sekretów; `.env.example` opisuje zmienne.
6. **Synchronizacja danych.** Ziarna, dziennik, ulubione, półka, lista zakupów, ilości z kalkulatora, młynki i własne przepisy synchronizują się między urządzeniami. Rekordy dostają `updatedAt` i znacznik usunięcia. Zapis w przeglądarce dalej jest źródłem prawdy offline, a konflikty rozstrzyga zasada „wygrywa nowsza zmiana” dla każdego rekordu osobno. Po drodze powstaje wersjonowany format danych, więc eksport i import JSON (kopia zapasowa bez konta) wychodzi przy okazji. Gotowe, gdy:
   - zmiana na jednym urządzeniu pojawia się na drugim po odświeżeniu i po powrocie do aplikacji,
   - praca offline i późniejsza synchronizacja nie gubią zmian,
   - pierwsze logowanie łączy dane lokalne z kontem bez duplikatów,
   - logika scalania jest czystą funkcją z testami (konflikty, usunięcia, stare zapisy `.v1`),
   - Row Level Security nie pozwala czytać cudzych danych (test na bazie albo skrypt SQL).
7. **Przepisy społeczności.** Własny przepis da się opublikować. Ekran metody ma „Przepisy społeczności” (najnowsze i najczęściej zapisywane), a każdy przepis można zapisać u siebie i zgłosić. Gotowe, gdy:
   - publikowanie, przeglądanie, zapisywanie i zgłaszanie działają,
   - zgłoszony przepis znika zgodnie z P7, a moderator może go ukryć albo przywrócić,
   - baza pilnuje limitów (długość tekstów, liczba kroków) i uprawnień (RLS),
   - przepisy bez internetu są niedostępne, ale reszta aplikacji działa.
8. **AI: rozpoznawanie etykiet.** Funkcja serwerowa przyjmuje zmniejszone zdjęcie, wysyła je do Claude z opisem wymaganej odpowiedzi (JSON zgodny z `LabelGuess`, przez tool use), sprawdza wynik i zwraca go. Zalogowany użytkownik online dostaje AI, a pozostali dotychczasowe rozpoznawanie w przeglądarce. Gotowe, gdy:
   - przed pierwszym wysłaniem zdjęcia jest zgoda z informacją, dokąd trafia zdjęcie,
   - limit dzienny z P8 działa, a po jego przekroczeniu jest powrót do OCR w przeglądarce,
   - odpowiedź jest walidowana (nieznane nuty i palenia odrzucone),
   - testy pokrywają ścieżkę AI, limit i powrót do OCR (fetch podmieniony).
9. **AI: asystent drinków.** Ekran `/napoje/asystent`: użytkownik opisuje, na co ma ochotę (domyślnie z tym, co ma na półce). Funkcja serwerowa prosi Claude o napój w schemacie `Drink`, ograniczony do składników, metod, naczyń i dekoracji z danych (P9). Wynik przechodzi te same reguły co `data.test.ts` (wydziel je do `src/data/validate.ts`) i rysuje się jak każdy napój. Gotowe, gdy:
   - propozycja wyświetla się z rysunkiem szklanki, krokami i podaniem, z oznaczeniem „Przepis od AI, sprawdź proporcje”,
   - niepoprawna odpowiedź AI nie psuje ekranu (walidacja, ponowienie albo komunikat),
   - napój da się zapisać w „Moich napojach” (zapis lokalny + synchronizacja z kroku 6), z kartą do udostępnienia i półką,
   - `data.test.ts` korzysta ze wspólnego `validate.ts`.
10. **Baza ziaren i palarni.** Tabele palarni i ziaren w Supabase. W formularzu ziaren jest „Szukaj w bazie” (podpowiedzi przy wpisywaniu) i „Kod kreskowy”. Kod idzie przez naszą funkcję do Open Food Facts (wymagany własny User-Agent, limit 15 zapytań na minutę, licencja ODbL z podaniem źródła). Użytkownik może zgłosić swoje ziarna do bazy, a autor je zatwierdza. Gotowe, gdy:
    - wyszukiwanie wypełnia formularz ziaren,
    - kod kreskowy da się zeskanować aparatem (`BarcodeDetector`, a gdzie go nie ma, biblioteka ładowana dynamicznie) albo wpisać ręcznie,
    - wynik z Open Food Facts ma podane źródło,
    - zgłoszenia czekają na zatwierdzenie (moderacja jak w kroku 7),
    - jeśli skan kodu używa podglądu z kamery (`getUserMedia`), `vercel.json` ma `camera=(self)` zamiast `camera=()` w `Permissions-Policy`.

## Prompty

Każdy prompt wklejasz do nowej sesji Claude Code otwartej w `F:\baristacompanion`, na aktualnym `main`.

### 1. Ustawienie młynka

```text
Kontekst: Barista Companion (F:\baristacompanion), aplikacja PWA dla domowych baristów. Najpierw przeczytaj CLAUDE.md i plans/2026-10-08-przepisy-aplikacja-natywna-backend.md (sekcje „Stan wyjściowy”, „Jak pracować” i krok 1).

Cel: użytkownik zapisuje swój młynek i ustawienie mielenia dla każdej metody, żeby powtórzyć dobrą kawę.

Zrób:
- Dane: src/data/grinders.ts z popularnymi młynkami (np. Comandante C40, Timemore C2/C3, 1Zpresso JX i K-Ultra, Hario Slim i Skerton, Baratza Encore, Wilfa Svart, Fellow Ode). Każdy ma jednostkę (kliknięcia, działki, obroty) i zakres ustawień dla każdego stopnia z GRIND_SIZES. Wszystko needsReview, test spójności w data.test.ts.
- Zapis (createLocalStore, klucz barista-companion.grinders.v1): młynki użytkownika (model z listy albo własny: nazwa i jednostka) i ustawienie dla każdej metody.
- Ekran zarządzania młynkiem w „Moich ziarnach” (np. /ziarna/mlynek). Przy skali mielenia na ekranie metody i w prowadzonym parzeniu: „Twój młynek: Comandante C40 · 24 kliknięcia”, edycja, a dla znanego modelu podpowiedź zakresu.
- Wpis w dzienniku zapisuje ustawienie młynka (JournalEntry), widać je w dzienniku. „Zaparz tak samo” je pokazuje.

Ograniczenia: bez nowych zależności. Działa bez młynka (wszystko opcjonalne).

Gotowe, gdy: spełnione są kryteria kroku 1 w planie, typecheck, testy i E2E przechodzą, CLAUDE.md i plan zaktualizowane, zmiany zacommitowane na gałęzi feature/mlynek.
```

### 2. Własne przepisy

```text
Kontekst: Barista Companion (F:\baristacompanion). Najpierw przeczytaj CLAUDE.md i plans/2026-10-08-przepisy-aplikacja-natywna-backend.md (sekcje „Stan wyjściowy”, „Jak pracować” i krok 2). Metody mają kroki ze znacznikami ilości ({coffee}, {water}, {water*0.6}) przeliczane przez scaleMethod() w features/brewing/dose.ts.

Cel: użytkownik tworzy własne wersje przepisów i parzy według nich ze stoperem.

Zrób:
- Model UserRecipe: id, methodId, nazwa, dawka (g/ml), temperatura, mielenie (i ustawienie młynka z kroku 1, jeśli jest), kroki w formacie BrewStep, notatka, daty. Zapis createLocalStore (barista-companion.recipes.v1), parser odrzuca błędne przepisy.
- „Zrób własną wersję” na ekranie metody: edytor z kopią przepisu metody. Kroki: dodaj, usuń, przesuń w górę i w dół (przyciski, bez przeciągania), czas w sekundach, działanie czy czekanie, przycisk „wstaw ilość kawy” i „wstaw ilość wody” (znaczniki), walidacja z komunikatami.
- Lista „Twoje przepisy” na ekranie metody, edycja i usuwanie (z potwierdzeniem w Sheet).
- Parzenie: /parzenie/:methodId/start?przepis=:id. Kalkulator ilości przelicza znaczniki jak w metodzie. Wpis w dzienniku zapisuje id i nazwę przepisu.
- Udostępnianie linkiem: przepis zakodowany w adresie (np. /przepis#dane w base64url, z wersją formatu), ekran podglądu z „Zapisz u siebie”. Link nie może wywrócić aplikacji (walidacja).

Ograniczenia: bez nowych zależności i bez backendu. Edytor ma działać przy 360 px i z czytnikiem ekranu.

Gotowe, gdy: spełnione są kryteria kroku 2 w planie, typecheck, testy i E2E przechodzą, CLAUDE.md i plan zaktualizowane, zmiany zacommitowane na gałęzi feature/wlasne-przepisy.
```

### 3. Szerszy katalog drinków

```text
Kontekst: Barista Companion (F:\baristacompanion). Najpierw przeczytaj CLAUDE.md i plans/2026-10-08-przepisy-aplikacja-natywna-backend.md (sekcje „Stan wyjściowy”, „Jak pracować”, „Pytania blokujące” i krok 3). Jeśli P1 i P2 nie mają odpowiedzi, zadaj je autorowi (AskUserQuestion) i wpisz odpowiedzi do planu.

Cel: co najmniej 35 napojów w katalogu (dziś 21), dalej bez ekspresu (baza „na espresso” to kawiarka).

Zrób:
- Nowe napoje z listy w kroku 3 planu: pełne dane jak istniejące (warstwy od dołu z kolorami, dodatki z ingredientId i ilościami {value, unit}, kroki, podanie z naczyniem i dekoracjami). Niepewne proporcje: needsReview.
- Nowe składniki (np. banan, masło orzechowe, cytryna, jajko, przyprawy do piernika) z grupami i zamiennikami w src/data/ingredients.ts. Nowe syropy z przepisem domowym i zamiennikami.
- Nowe naczynia, jeśli potrzebne (VesselId, vessels.ts, VESSEL_SHAPES w features/glass/geometry.ts, testy geometrii i DrinkGlass).
- Zależnie od P1: pole w modelu napoju dla alkoholu, oznaczenie na karcie i ekranie napoju, filtr „Bez alkoholu” w adresie katalogu. Zależnie od P2: kawa rozpuszczalna jako metoda bez parzenia.
- Sprawdź, że karta do udostępnienia (features/share) mieści każdy nowy napój i że półka „Co mam w domu” liczy nowe składniki.

Ograniczenia: treści po polsku, id jako slugi, nie zajmuj adresów innych ekranów (test w data.test.ts).

Gotowe, gdy: spełnione są kryteria kroku 3 w planie, typecheck i testy przechodzą, obejrzyj kilka nowych napojów w przeglądarce (npm run build + npm run preview), CLAUDE.md i plan zaktualizowane, zmiany zacommitowane na gałęzi feature/katalog-drinkow.
```

### 4. Powiadomienia w aplikacji na Androida

```text
Kontekst: Barista Companion (F:\baristacompanion), PWA (Vite + React). Najpierw przeczytaj CLAUDE.md i plans/2026-10-08-przepisy-aplikacja-natywna-backend.md (sekcje „Stan wyjściowy”, „Jak pracować”, „Pytania blokujące” i krok 4). Jeśli P3 nie ma odpowiedzi, zadaj je autorowi. Autor pracuje na Windowsie i nie ma doświadczenia z aplikacjami mobilnymi: prowadź go krok po kroku (Android Studio, emulator albo telefon przez USB).

Cel: koniec kroku parzenia i gotowe cold brew dają powiadomienie z dźwiękiem także przy zablokowanym ekranie, w aplikacji na Androida zbudowanej z tego samego kodu.

Zrób:
- Capacitor (aktualna wersja, sprawdź w dokumentacji), platforma Android, webDir: dist. W wersji natywnej nie rejestruj service workera (Capacitor.isNativePlatform()).
- Moduł lib/notifications.ts: zaplanuj i odwołaj powiadomienie. W wersji natywnej @capacitor/local-notifications, w przeglądarce nic nie robi (PWA zostaje przy obecnych sygnałach i Wake Lock).
- Prowadzone parzenie (features/brewing): start stopera planuje powiadomienie na koniec kroku („Czas minął. Teraz: …”), a pauza, reset, przejście dalej, cofnięcie i wyjście z ekranu je odwołują. Cold brew (features/coldbrew): powiadomienie na godzinę gotowości, odwołane przy przerwaniu i zakończeniu.
- Uprawnienia: POST_NOTIFICATIONS (Android 13+) z wyjaśnieniem przed prośbą, SCHEDULE_EXACT_ALARM (Android 12+, sprawdź checkExactNotificationSetting). Po odmowie aplikacja działa jak PWA.
- Uwaga: z allowWhileIdle powiadomienia w trybie uśpienia przychodzą najwyżej raz na 9 minut. Sprawdź na urządzeniu krótkie kroki (30 s – 5 min) przy zablokowanym ekranie. Jeśli przychodzą z opóźnieniem, zaproponuj autorowi usługę pierwszoplanową z licznikiem (osobny commit).
- docs/aplikacja-android.md: jak zbudować i zainstalować APK krok po kroku. Ikona i nazwa jak w manifeście PWA.

Ograniczenia: nie zakładaj konta w Google Play bez zgody autora. iOS poza zakresem.

Gotowe, gdy: spełnione są kryteria kroku 4 w planie, typecheck, testy i E2E (wersja web) przechodzą, autor potwierdził powiadomienie na telefonie albo w emulatorze, zmiany zacommitowane na gałęzi feature/android.
```

### 5. Backend: konto i prywatność

```text
Kontekst: Barista Companion (F:\baristacompanion), PWA na Vercelu, dziś bez backendu. Najpierw przeczytaj CLAUDE.md i plans/2026-10-08-przepisy-aplikacja-natywna-backend.md (sekcje „Moje założenia”, „Pytania blokujące”, „Jak pracować” i krok 5). Zadaj autorowi P4, P5 i P6, jeśli nie mają odpowiedzi. Autor nie zakładał jeszcze projektu w Supabase: prowadź go krok po kroku i nie rób nic na jego koncie bez zgody.

Cel: opcjonalne konto użytkownika, polityka prywatności i fundament pod kolejne kroki backendu.

Zrób:
- Projekt Supabase w regionie UE, Supabase CLI, migracje SQL w supabase/migrations (tabela profiles: nick, utworzenie; RLS: każdy widzi i zmienia tylko swój profil).
- Zmienne VITE_SUPABASE_URL i VITE_SUPABASE_ANON_KEY w .env.local i w ustawieniach Vercela, .env.example w repozytorium. Klucz service_role tylko w sekretach funkcji.
- lib/supabase.ts: klient ładowany dynamicznie (import()), żeby nie obciążać startu.
- Logowanie zgodnie z P5 (adresy przekierowania: localhost, podgląd i produkcja Vercela). Ekran /konto: zaloguj, wyloguj, nick, usuń konto (funkcja serwerowa usuwa użytkownika i wszystkie jego dane), eksport danych. Wejście na konto ze Startu i z „Moich ziaren”.
- /prywatnosc: szkic polityki prywatności po polsku (co zbieramy, po co, gdzie, jak długo, prawa użytkownika), z miejscami do uzupełnienia przez autora (P6).
- Testy ekranów z podmienionym klientem Supabase.

Ograniczenia: bez logowania aplikacja działa jak dziś. Żadnych sekretów w repozytorium.

Gotowe, gdy: spełnione są kryteria kroku 5 w planie, typecheck, testy i E2E przechodzą, autor zalogował się na podglądzie Vercela, CLAUDE.md (nowa sekcja o backendzie) i plan zaktualizowane, zmiany zacommitowane na gałęzi feature/konto.
```

### 6. Synchronizacja danych

```text
Kontekst: Barista Companion (F:\baristacompanion). Najpierw przeczytaj CLAUDE.md i plans/2026-10-08-przepisy-aplikacja-natywna-backend.md (sekcje „Jak pracować” i krok 6). Konto i Supabase są gotowe (krok 5). Dane użytkownika żyją w przeglądarce w createLocalStore (lib/localStore.ts), klucze barista-companion.*.v1.

Cel: dane zalogowanego użytkownika są takie same na wszystkich urządzeniach, a aplikacja dalej działa offline.

Zrób:
- Wersjonowany format danych: każdy rekord ma updatedAt i opcjonalny deletedAt (znacznik usunięcia). Migracja zapisów .v1 do .v2 w parserach, bez utraty danych.
- Eksport i import JSON w tym formacie na ekranie /konto (działa też bez logowania, jako kopia zapasowa).
- Tabela w Supabase na dane użytkownika (np. user_data: user_id, collection, record_id, payload jsonb, updated_at, deleted) z RLS tylko dla właściciela.
- lib/sync: czysta funkcja scalania (dla każdego rekordu wygrywa nowsza zmiana, usunięcie też jest zmianą) i warstwa, która wysyła lokalne zmiany i pobiera zdalne: po zalogowaniu, po powrocie do aplikacji, po zmianie (z opóźnieniem) i po odzyskaniu sieci.
- Pierwsze logowanie: połączenie danych lokalnych z kontem bez duplikatów.
- Kolekcje: ziarna, dziennik, ulubione, półka, lista zakupów, ilości z kalkulatora, młynki, własne przepisy (i „Moje napoje”, jeśli już są).
- Stan synchronizacji na ekranie konta (ostatnia synchronizacja, błąd).

Ograniczenia: localStore zostaje źródłem prawdy offline. Bez bibliotek do synchronizacji, chyba że autor się zgodzi.

Gotowe, gdy: spełnione są kryteria kroku 6 w planie, autor sprawdził na dwóch urządzeniach, typecheck, testy i E2E przechodzą, plan zaktualizowany, zmiany zacommitowane na gałęzi feature/synchronizacja.
```

### 7. Przepisy społeczności

```text
Kontekst: Barista Companion (F:\baristacompanion). Najpierw przeczytaj CLAUDE.md i plans/2026-10-08-przepisy-aplikacja-natywna-backend.md (sekcje „Pytania blokujące”, „Jak pracować” i krok 7). Własne przepisy (krok 2) i konto (krok 5) są gotowe. Zadaj P7, jeśli nie ma odpowiedzi.

Cel: użytkownicy publikują swoje przepisy, a inni je przeglądają i zapisują u siebie.

Zrób:
- Tabele: public_recipes (autor, nick, metoda, nazwa, opis, dawka, kroki jsonb, mielenie, stan: opublikowany/ukryty, daty, liczba zapisów), recipe_saves, recipe_reports. RLS: autor zmienia swoje, wszyscy czytają opublikowane, zgłaszać mogą zalogowani. Ograniczenia w bazie: długości tekstów, liczba kroków, czasy kroków.
- „Opublikuj” przy własnym przepisie (wymaga konta i nicku), „Wycofaj”.
- Na ekranie metody: „Przepisy społeczności” (najnowsze, najczęściej zapisywane), ekran przepisu, „Zapisz u siebie” (kopia do własnych przepisów), „Parz według tego przepisu”, „Zgłoś”.
- Moderacja zgodnie z P7: rola moderatora, lista zgłoszeń, ukryj i przywróć.
- Bez internetu: komunikat w sekcji społeczności, reszta działa.

Ograniczenia: bez zdjęć w przepisach (na później). Teksty od użytkowników zawsze jako tekst, nigdy jako HTML.

Gotowe, gdy: spełnione są kryteria kroku 7 w planie, typecheck, testy i E2E przechodzą, CLAUDE.md i plan zaktualizowane, zmiany zacommitowane na gałęzi feature/spolecznosc.
```

### 8. AI: rozpoznawanie etykiet

```text
Kontekst: Barista Companion (F:\baristacompanion). Najpierw przeczytaj CLAUDE.md i plans/2026-10-08-przepisy-aplikacja-natywna-backend.md (sekcje „Moje założenia”, „Pytania blokujące”, „Jak pracować” i krok 8). Dziś skan etykiety działa w przeglądarce: features/beans/scan (ocr.ts z tesseract.js, parseLabel.ts zwraca LabelGuess, LabelScan.tsx). Konto i Supabase są gotowe. Zadaj P8, jeśli nie ma odpowiedzi. Przed pisaniem kodu wywołującego Claude użyj skilla claude-api (aktualne modele, ceny, tool use, obrazy).

Cel: dokładniejsze rozpoznawanie etykiet przez Claude dla zalogowanych, z powrotem do OCR w przeglądarce.

Zrób:
- Funkcja serwerowa (Supabase Edge Function) scan-label: wymaga zalogowania, przyjmuje zmniejszone zdjęcie (JPEG, najdłuższy bok ok. 1600 px), sprawdza dzienny limit (tabela z licznikiem), wywołuje Claude z obrazem i narzędziem o schemacie odpowiedzi zgodnym z LabelGuess (nazwa, palarnia, palenie, nuty z FLAVOR_NOTES, pochodzenie, rodzaj, opcjonalnie data palenia), waliduje wynik i go zwraca. Klucz API w sekretach Supabase.
- LabelScan: zalogowany i online → AI (z informacją i zgodą przy pierwszym użyciu: zdjęcie trafia do serwera i do Anthropic), w przeciwnym razie albo po błędzie lub limicie → obecny OCR. Pokaż, która ścieżka zadziałała.
- Testy: walidacja odpowiedzi, wybór ścieżki, limit, powrót do OCR (fetch i ocr.ts podmienione).

Ograniczenia: zdjęcie nie jest zapisywane na serwerze. Logi bez treści zdjęć.

Gotowe, gdy: spełnione są kryteria kroku 8 w planie, autor sprawdził na prawdziwych opakowaniach, typecheck i testy przechodzą, plan zaktualizowany, zmiany zacommitowane na gałęzi feature/ai-etykiety.
```

### 9. AI: asystent drinków

```text
Kontekst: Barista Companion (F:\baristacompanion). Najpierw przeczytaj CLAUDE.md i plans/2026-10-08-przepisy-aplikacja-natywna-backend.md (sekcje „Pytania blokujące”, „Jak pracować” i krok 9). Napoje mają schemat Drink (src/data/types.ts), a ich spójność sprawdza src/data/data.test.ts. Konto, synchronizacja i funkcje serwerowe są gotowe. Zadaj P9, jeśli nie ma odpowiedzi. Przed pisaniem kodu wywołującego Claude użyj skilla claude-api.

Cel: asystent proponuje nowy drink kawowy na podstawie tego, co użytkownik ma i na co ma ochotę.

Zrób:
- Wydziel reguły spójności napoju z data.test.ts do src/data/validate.ts (validateDrink zwraca listę błędów po polsku). data.test.ts ma z niego korzystać.
- Funkcja serwerowa drink-assistant: limit z P8, prompt z katalogiem dozwolonych id (metody, mleka, składniki, syropy, naczynia, rodzaje i wygląd dekoracji), odpowiedź przez narzędzie ze schematem Drink, walidacja validateDrink, przy błędach jedna próba naprawy.
- Ekran /napoje/asystent: na ciepło czy na zimno, z mlekiem czy bez, opis ochoty, domyślnie składniki z „Co mam w domu”. Wynik jak ekran napoju (rysunek, składniki, kroki, podanie) z oznaczeniem „Przepis od AI, sprawdź proporcje”.
- „Moje napoje”: zapis lokalny i synchronizacja, lista w katalogu (filtr), karta do udostępnienia, półka i lista zakupów działają też dla nich.

Ograniczenia: alkohol zgodnie z P1. Asystent nie daje porad zdrowotnych.

Gotowe, gdy: spełnione są kryteria kroku 9 w planie, typecheck, testy i E2E przechodzą, CLAUDE.md i plan zaktualizowane, zmiany zacommitowane na gałęzi feature/ai-asystent.
```

### 10. Baza ziaren i palarni

```text
Kontekst: Barista Companion (F:\baristacompanion). Najpierw przeczytaj CLAUDE.md i plans/2026-10-08-przepisy-aplikacja-natywna-backend.md (sekcje „Moje założenia”, „Jak pracować” i krok 10). Formularz ziaren: features/beans/BeanForm.tsx (ma już skan etykiety). Konto, moderacja (krok 7) i funkcje serwerowe są gotowe.

Cel: ziarna da się znaleźć w bazie albo po kodzie kreskowym, zamiast wpisywać je ręcznie.

Zrób:
- Tabele roasters (nazwa, miasto, strona) i beans_catalog (palarnia, nazwa, pochodzenie, proces, palenie, nuty, rodzaj, link, zatwierdzone). RLS: wszyscy czytają zatwierdzone, zalogowani zgłaszają, moderator zatwierdza.
- Seed: lista polskich palarni specialty wpisana przez autora (zapytaj go o listę). Bez automatycznego pobierania danych ze sklepów.
- „Szukaj w bazie” w formularzu ziaren (podpowiedzi przy wpisywaniu, wybór wypełnia formularz).
- „Kod kreskowy”: BarcodeDetector, a gdzie go nie ma, biblioteka ładowana dynamicznie, albo wpisanie cyfr. Funkcja serwerowa off-lookup pyta Open Food Facts (/api/v2/product/{kod}.json, własny User-Agent, pamięć podręczna wyników, limit 15 zapytań na minutę) i zwraca dane do formularza z podaniem źródła (ODbL).
- „Zgłoś do bazy” przy własnych ziarnach (zgoda użytkownika), kolejka do zatwierdzenia u moderatora.
- Jeśli skan kodu używa podglądu z kamery, zmień Permissions-Policy w vercel.json na camera=(self) i zaktualizuj test deploy.test.ts.

Ograniczenia: dane z Open Food Facts zawsze z informacją o źródle. Wyszukiwanie działa tylko online, reszta formularza też offline.

Gotowe, gdy: spełnione są kryteria kroku 10 w planie, typecheck, testy i E2E przechodzą, CLAUDE.md i plan zaktualizowane, zmiany zacommitowane na gałęzi feature/baza-ziaren.
```

## Poza zakresem

- aplikacja na iOS (Mac albo chmura z macOS, konto Apple Developer), Live Activities i Dynamic Island,
- płatności i subskrypcje,
- zdjęcia w przepisach społeczności,
- wagi Bluetooth, cupping SCA, profile wody, inne języki.
