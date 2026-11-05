# Android Studio i Google Play: przygotowanie aplikacji

Data: 2026-10-14 · Źródło: prośba autora („niedługo pobiorę Android Studio, zaplanuj poprawki, żeby bezproblemowo przerzucić tam aplikację”) i porównanie z konkurencją (pierwszy krok: Google Play).

## Cel

Po instalacji Android Studio projekt ma się otworzyć, zbudować i uruchomić na telefonie bez szukania błędów, a wszystko, co działa w PWA, ma działać też w aplikacji natywnej. Na końcu: podpisana paczka AAB gotowa do Google Play.

## Stan wyjściowy

- Projekt `android/` (Capacitor 8.5.2: AGP 8.13.0, Gradle 8.14.3, Java 21, `compileSdk`/`targetSdk` 36, `minSdk` 24) **nigdy nie był zbudowany**: na komputerze autora nie ma Javy ani Android SDK.
- Gotowe i opisane w [docs/aplikacja-android.md](../docs/aplikacja-android.md): powiadomienia (stoper, cold brew), powrót z logowania (`pl.baristacompanion.app://konto`), ikony, ekran startowy, wyłączony service worker.
- Kod aplikacji w kilku miejscach zakłada przeglądarkę, a WebView Androida działa inaczej:

| Miejsce | Co się stanie w aplikacji natywnej | Dlaczego |
| :- | :- | :- |
| Android Studio Rabbit (2026.2) | Gradle sync kończy się błędem o niezgodnej Javie | Android Studio ma wbudowaną Javę (JBR) 25, a Gradle 8.14 działa najwyżej na Javie 24. Javę 25 obsługuje dopiero Gradle 9.1, który oznacza przejście na AGP 9, czego Capacitor 8 nie obsługuje |
| „Zapisz obrazek” (karta napoju), kopia zapasowa, eksport konta, „Dodaj przypomnienie do kalendarza” | nic się nie dzieje | `downloadBlob` (`lib/download.ts`) to link `download` z adresem `blob:`, a WebView nie obsługuje pobierania plików |
| „Udostępnij”: karta napoju, przepis, napój społeczności, lista zakupów | przycisk znika albo zostaje samo kopiowanie do schowka | WebView Androida nie ma Web Share API (`navigator.share`) |
| „Wyślij link”: przepis, napój społeczności | odbiorca dostaje martwy link `https://localhost/...` | adres z `window.location.origin`, a aplikacja natywna działa pod `https://localhost` |
| Prowadzone parzenie | ekran może zgasnąć | `useWakeLock` korzysta z Wake Lock API, którego WebView może nie mieć; pewna jest dopiero natywna flaga `FLAG_KEEP_SCREEN_ON` |
| Sygnał końca kroku | bez wibracji | WebView wibruje tylko z uprawnieniem `VIBRATE` w manifeście |
| Telefon z nieaktualną WebView | rozjechany wygląd | Tailwind 4 wymaga silnika Chrome 111+, a Capacitor domyślnie przyjmuje WebView od wersji 60 |
| Ekran startowy w trybie ciemnym | jasny błysk | `splash.png` i tło `#faf6f1` nie mają wersji nocnej |
| Wydanie | brak podpisu, `versionCode 1` na stałe | Google Play wymaga podpisanej paczki AAB i rosnącego `versionCode` |

## Decyzje

| Nr | Decyzja | Dlaczego |
| :- | :- | :- |
| D1 | Zostajemy na Capacitor 8 + AGP 8.13 + Gradle 8.14.3, a Gradle dostaje **Javę 21** z pliku `gradle/gradle-daemon-jvm.properties` (z adresami do automatycznego pobrania). Propozycję Android Studio „Upgrade AGP to 9” odrzucamy | Capacitor 8 jest testowany z AGP 8.13. AGP 9 wymaga Gradle 9 i psuje wtyczki (np. `proguard-android.txt`), a Capacitor 9 jest w wersji alpha. Przejście na Capacitor 9 to osobny etap po jego stabilnym wydaniu |
| D2 | Pliki i udostępnianie w aplikacji natywnej przez oficjalne wtyczki `@capacitor/filesystem` i `@capacitor/share`: plik trafia do pamięci podręcznej aplikacji i otwiera się systemowe okno „Udostępnij” (stamtąd też „Zapisz na Dysku”, „Pliki”). Jedno miejsce w kodzie: `lib/download.ts` (`saveFile`) i nowy `lib/share.ts` (`shareContent`). PWA bez zmian | Ekrany nie muszą wiedzieć, gdzie działają; testy podmieniają wtyczki jak w `pages/notifications.test.tsx` |
| D3 | Linki do wysłania biorą publiczny adres ze zmiennej `VITE_PUBLIC_URL` (wersja na Vercelu) przez `publicOrigin()`; w PWA dalej `location.origin`. Bez tej zmiennej aplikacja natywna nie pokazuje przycisków z linkiem | Link `https://localhost` nie działa u nikogo |
| D4 | Ekran nie gaśnie dzięki `@capacitor-community/keep-awake` (wersja 8, natywna flaga, bez uprawnień); w PWA Wake Lock jak dotąd | Mała wtyczka zamiast własnego kodu w Javie |
| D5 | Przypomnienie w kalendarzu (`.ics`) tylko w PWA. W aplikacji natywnej to samo robi powiadomienie „Cold brew gotowe” | Kalendarze na Androidzie słabo przyjmują `.ics` z okna „Udostępnij” |
| D6 | Minimalna WebView: 111 (`android.minWebViewVersion`), a dla starszej `server.errorPath` pokazuje stronę z prośbą o aktualizację „Android System WebView”. `minSdk` 24 zostaje | Lepszy czytelny komunikat niż rozjechany ekran |
| D7 | `versionName` = `version` z `package.json`, `versionCode` liczony z niego (1.2.3 → 10203). Przed wydaniem podbijamy wersję w `package.json` | Jedno źródło wersji dla PWA i Androida |
| D8 | Klucz przesyłania (upload key) leży poza repozytorium, a ścieżka i hasła w `android/keystore.properties` (w `.gitignore`). Klucz aplikacji trzyma Google Play App Signing | Zgubiony klucz przesyłania da się wymienić przez Google, ale zgubiony klucz aplikacji już nie |
| D9 | Identyfikator `pl.baristacompanion.app` zostaje | Po pierwszej publikacji nie da się go zmienić |

## Do decyzji autora

| Nr | Pytanie | Moja propozycja |
| :- | :- | :- |
| A1 | Konto w pierwszej wersji ze sklepu. Wbudowana poczta Supabase wysyła tylko do członków zespołu (ok. 2 e-maile na godzinę), więc testerzy nie zalogują się linkiem | Przed testami zamkniętymi własny SMTP (darmowy plan np. Resend albo Brevo) i logowanie przez Google. Testy i tak trwają 14 dni. Inna możliwość: pierwsza wersja bez konta (build bez `VITE_SUPABASE_*`), wtedy Społeczność pokazuje tylko ekran „bez serwera” |
| A2 | Wersja w sieci (Vercel) z publicznym adresem: własna domena czy `*.vercel.app`? | Potrzebna przed Google Play: adres polityki prywatności w karcie sklepu, strona do usunięcia konta (wymóg Google Play dla aplikacji z kontami) i linki z D3 |
| A3 | Ostateczna ikona (obecne są tymczasowe) | Google Play potrzebuje ikony 512×512 i grafiki 1024×500; ikonę adaptacyjną i monochromatyczną zrobię z tej samej grafiki |
| A4 | Konto dewelopera Google Play (25 USD jednorazowo, weryfikacja tożsamości) | Nie zakładam bez decyzji autora |

## Plan pracy

Kroki 1–6 da się zrobić przed instalacją Android Studio. Sprawdzą je testy (Vitest z podmienionymi wtyczkami), ale działanie na telefonie potwierdzi dopiero krok 7.

| Krok | Kto | Stan |
| :- | :- | :- |
| 1. Budowanie: Java 21 dla Gradle, drobne poprawki projektu | Claude | zrobione (2026-10-14) |
| 2. Pliki i udostępnianie w aplikacji natywnej | Claude | do zrobienia |
| 3. Publiczny adres w linkach | Claude | do zrobienia |
| 4. Ekran, wibracja, stara WebView, tryb ciemny, ikona tematyczna | Claude | do zrobienia |
| 5. Wersja, podpis wydania, paczka AAB | Claude | do zrobienia |
| 6. Instrukcja i listy kontrolne | Claude | do zrobienia |
| 7. Pierwsze uruchomienie w Android Studio i test na telefonie | autor | do zrobienia (Android Studio jest) |
| 8. Google Play: konto, karta sklepu, testy zamknięte | autor (teksty i formularze przygotuje Claude) | czeka na A1–A4 |

1. **Budowanie.**
   - `android/gradle/gradle-daemon-jvm.properties` z `toolchainVersion=21` i adresami pobrania JDK 21 (zadanie `updateDaemonJvm` z wtyczką `org.gradle.toolchains.foojay-resolver-convention` w `settings.gradle`). Android Studio z Javą 25 użyje wtedy zainstalowanej Javy 21 albo sam ją pobierze. W zapasie instrukcja ręczna: Settings → Build, Execution, Deployment → Build Tools → Gradle → Gradle JDK → Download JDK → 21.
   - `proguard-android.txt` → `proguard-android-optimize.txt` w `app/build.gradle`. Działanie się nie zmienia (`minifyEnabled false`), a przyszłe przejście na AGP 9 będzie łatwiejsze.
   - `task clean`: `rootProject.buildDir` → `rootProject.layout.buildDirectory` (ostrzeżenie Gradle).
   - Capacitor 8.5.2 → 8.5.3 (poprawki), `npx cap sync android`.
   - Opcjonalnie, za zgodą autora: próbne zbudowanie APK na tym komputerze jeszcze przed Android Studio. W osobnym folderze przenośny JDK 25 (jak w Android Studio) i Android SDK (command-line tools, platforma 36, ok. 1–2 GB). Sprawdzi D1 i wyłapie błędy Gradle wcześniej, niż zobaczy je autor.

   Gotowe, gdy: `npm run android:apk` buduje APK (przy próbnym budowaniu albo w kroku 7), a `src/test/android.test.ts` sprawdza Javę 21 dla Gradle i brak `proguard-android.txt`.

   **Zrobione 2026-10-14** (Android Studio 2026.2.1 z Javą 25.0.3 już zainstalowane, więc bez przenośnego JDK i SDK):
   - Potwierdzony błąd z D1: `gradlew help` na Javie 25 kończy się „Unsupported class file major version 69”.
   - `settings.gradle`: wtyczka `foojay-resolver-convention` 1.0.0; `gradle-daemon-jvm.properties` wygenerowany przez `updateDaemonJvm --jvm-version=21` (Temurin 21 dla wszystkich systemów). Gradle uruchomiony z Javą 25 sam pobiera Javę 21 do `~/.gradle/jdks`.
   - Capacitor 8.5.3 (`@capacitor/app` 8.1.2, `@capacitor/browser` 8.0.5), `proguard-android-optimize.txt`, `layout.buildDirectory`.
   - `gradlew assembleDebug` z SDK Android Studio przechodzi bez ostrzeżeń Gradle (brakującą platformę 36 i build-tools 35 Gradle pobrał sam).
   - Emulator (Medium Phone, API 37, WebView 145): aplikacja startuje, paski systemowe i odstępy w porządku. W logach błąd **„LocalNotifications.then() is not implemented on android”**: `load()` w `lib/notifications.ts` zwracał wtyczkę (Proxy z każdą metodą, także `then`) z obietnicy, więc każde wywołanie kończyło się w `catch` i powiadomienia w ogóle by nie działały. Poprawka: wtyczka w obiekcie; atrapa w `notifications.test.tsx` jest teraz takim Proxy (bez poprawki 11 testów czerwonych). Po poprawce: karta „Powiadomienie, gdy minie czas” i systemowe okno zgody działają.
2. **Pliki i udostępnianie** (D2, D5).
   - Zależności `@capacitor/filesystem` i `@capacitor/share`.
   - `lib/download.ts`: `saveFile(blob, name)`. W PWA link `download` jak dziś; natywnie zapis do `Directory.Cache` (base64) i `Share.share({ files: [uri] })`.
   - `lib/share.ts`: `canShareContent()` i `shareContent({ title, text, url, files })`. Natywnie wtyczka `Share`, w PWA `navigator.share`, a bez obu schowek.
   - Ekrany: karta napoju (`ShareSheet`, natywnie jeden przycisk „Udostępnij albo zapisz”), kopia zapasowa (`sync/backup.ts`), eksport konta (`account/profile.ts`), przepis (`ShareRecipeSheet`), napój społeczności (`CommunityDrinkPage`), lista zakupów (`ShoppingListPage`).
   - Cold brew: przycisk „Dodaj przypomnienie do kalendarza” tylko w PWA.
   - Wczytanie kopii (`<input type="file">`) i zdjęcie etykiety (`capture`) obsługuje już WebView Capacitora: tylko test w kroku 7.

   Gotowe, gdy: testy z podmienionymi wtyczkami pokazują, że natywnie idą przez `Filesystem`/`Share`, a w PWA jak dotąd; poza `lib/` nie ma `navigator.share` ani `downloadBlob`.
3. **Publiczny adres w linkach** (D3). `VITE_PUBLIC_URL` w `.env.example`, `.env.local` i Vercelu; `publicOrigin()` w `lib/` (natywnie zmienna, w PWA `location.origin`); użycie w `shareUrl` (przepis) i w linku napoju społeczności. Testy nie czytają `.env.local` (`test.env` w `vite.config.ts`), więc test włącza zmienną sam przez `vi.stubEnv`.

   Gotowe, gdy: test pokazuje, że natywny link zaczyna się od `VITE_PUBLIC_URL`, a bez zmiennej przycisku nie ma.
4. **Ekran, wibracja, stara WebView, tryb ciemny** (D4, D6).
   - `@capacitor-community/keep-awake` w `useWakeLock`: natywnie `keepAwake()`/`allowSleep()`, w PWA bez zmian.
   - `<uses-permission android:name="android.permission.VIBRATE" />` w `AndroidManifest.xml` (uprawnienie bez pytania użytkownika).
   - `android.minWebViewVersion: 111` i `server.errorPath` ze statyczną stroną po polsku w `public/` (bez Reacta, bo stara WebView go nie uruchomi).
   - `res/values-night`: ciemne tło ekranu startowego (kolor tokenu `canvas` z ciemnego motywu). Kolor ikon paska stanu ma pasować do motywu (`SystemBars.style`, jeśli domyślny nie wystarczy; sprawdzenie w kroku 7).
   - Ikona tematyczna Androida 13+: `<monochrome>` w `mipmap-anydpi-v26/ic_launcher.xml`, z sylwetki szklanki z `ic_stat_coffee`.

   Gotowe, gdy: test `useWakeLock` (natywnie woła wtyczkę) i test konfiguracji (VIBRATE w manifeście, `minWebViewVersion`, plik `errorPath` jest w `public/`).
5. **Wersja, podpis, AAB** (D7, D8).
   - `app/build.gradle`: `versionName` i `versionCode` z `../../package.json` (JsonSlurper). `signingConfigs.release` z `keystore.properties`, jeśli plik istnieje; bez niego build debug działa jak dziś.
   - `android/.gitignore`: `*.jks`, `*.keystore`, `keystore.properties`.
   - Skrypt `npm run android:bundle` (`build` + `cap sync` + `gradlew bundleRelease`).

   Gotowe, gdy: test konfiguracji sprawdza, że wersja pochodzi z `package.json`, a pliki klucza są w `.gitignore`; AAB powstaje w kroku 7.
6. **Instrukcja.** [docs/aplikacja-android.md](../docs/aplikacja-android.md): Android Studio Rabbit i Java 25 (co zrobić, gdy sync zgłosi Javę), „nie aktualizuj AGP do 9”, lista kontrolna z kroku 7, sekcja „Wydanie” (klucz, `keystore.properties`, AAB), sekcja „Google Play” z kroku 8. CLAUDE.md: pliki i udostępnianie tylko przez `lib/download` i `lib/share`, adres w linkach z `publicOrigin()`, `VITE_PUBLIC_URL` w opisie zmiennych.
7. **Pierwsze uruchomienie (autor).** Android Studio → `npm run android:sync` → `npm run android:open` → Gradle sync → ▶ Run w emulatorze → telefon przez USB. Listy kontrolne z dokumentacji: powiadomienia (5) i logowanie (5b). Do tego nowa lista:
   - gest i przycisk „wstecz”: zamyka okno (`Sheet`), cofa ekran, na Starcie zamyka aplikację; animacja przewidywanego cofania z Androida 16 nie psuje nawigacji,
   - klawiatura nie zasłania pól (kreator napoju, formularz ziaren, kod z e-maila),
   - treść nie wchodzi pod paski systemowe, a ikony paska stanu są widoczne w jasnym i ciemnym motywie,
   - zdjęcie etykiety aparatem i z galerii,
   - karta napoju: „Udostępnij” otwiera okno systemowe, obrazek da się zapisać,
   - kopia zapasowa: zapis i wczytanie,
   - parzenie: ekran nie gaśnie, telefon wibruje na koniec kroku,
   - tryb samolotowy: katalog i parzenie działają, Społeczność i konto się chowają,
   - największa czcionka systemowa: układ się nie rozjeżdża,
   - obrót ekranu w trakcie parzenia nie gubi stopera,
   - wersja wydania: `npm run android:bundle` tworzy AAB.

   Gotowe, gdy: wszystkie listy są odhaczone. Znalezione błędy to kolejne kroki (7a, 7b…).
8. **Google Play (autor, po decyzjach A1–A4).**
   - Konto dewelopera (osobiste).
   - Aplikacja: nazwa „Barista Companion”, język domyślny polski, kategoria „Jedzenie i napoje”, bezpłatna.
   - Karta sklepu: krótki opis (do 80 znaków), pełny opis (do 4000), ikona 512×512, grafika 1024×500, co najmniej 2 zrzuty ekranu telefonu (proponuję 4–6: Start, napój z rysunkiem, parzenie, Baribar, Społeczność).
   - Formularze: polityka prywatności (adres na Vercelu); bezpieczeństwo danych (bez konta nic nie wysyłamy; z kontem e-mail, nick, opublikowane treści i zgłoszenia; zdjęcie etykiety tylko przy włączonym AI); usuwanie konta (w aplikacji i adres w sieci); klasyfikacja treści (napoje z alkoholem); grupa docelowa 18+ (napoje z alkoholem, a do tego bez wymogów polityki dla rodzin); bez reklam i bez identyfikatora reklamowego.
   - Testy wewnętrzne (od razu, do 100 osób, nie liczą się do wymogu) → testy zamknięte: **co najmniej 12 testerów zapisanych bez przerwy przez 14 dni** (wymóg dla kont osobistych założonych po 13.11.2023) → wniosek o dostęp do wersji produkcyjnej. Od pierwszego AAB licz co najmniej 3 tygodnie.
   - Już spełnione: `targetSdk` 36 (obowiązkowy dla nowych aplikacji od 31.08.2026). Projekt nie ma własnych bibliotek natywnych, więc wymóg stron pamięci 16 KB nie powinien nas dotyczyć (sprawdzi to Play Console przy pierwszym AAB).

Po każdym kroku 1–6: `npm run typecheck`, `npm test`, osobny commit na gałęzi od `main`.

## Poza zakresem

- iOS (wymaga Maca i konta Apple za 99 USD rocznie),
- licznik parzenia w powiadomieniu i widżety na ekranie głównym (z porównania z konkurencją; osobny etap po wydaniu),
- linki otwierające aplikację (Android App Links): `assetlinks.json` na Vercelu potrzebuje odcisku klucza z Play App Signing, więc dopiero po pierwszej publikacji,
- Capacitor 9 i AGP 9.
