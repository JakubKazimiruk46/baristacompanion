# Aplikacja na Androida: budowanie, instalacja i test powiadomień

Aplikacja na Androida to ta sama PWA (`dist/`) w opakowaniu [Capacitor](https://capacitorjs.com/) 8. Różni się jednym: koniec kroku ze stoperem i gotowe cold brew przychodzą jako **powiadomienie z dźwiękiem, także przy zablokowanym ekranie**. Wersja w przeglądarce działa jak dotąd.

Co jest w repozytorium:

| Co | Gdzie |
| :- | :- |
| Konfiguracja (identyfikator, nazwa, ikona powiadomień) | `capacitor.config.ts` |
| Projekt Androida (Gradle, manifest, ikony, ekran startowy) | `android/` |
| Planowanie i odwoływanie powiadomień | `src/lib/notifications.ts`, `features/brewing/useBrewSession.ts`, `features/coldbrew/useColdBrewNotification.ts` |
| Prośba o zgodę z wyjaśnieniem | `src/components/NotificationPrompt.tsx` |

Nie trafia do repozytorium: kopia aplikacji w `android/app/src/main/assets/public` (robi ją `npm run android:sync`), pliki `build/` i APK.

## 1. Jednorazowo: Android Studio

1. Pobierz **Android Studio** ze strony <https://developer.android.com/studio> i zainstaluj z domyślnymi ustawieniami. Zawiera wszystko, czego trzeba: Javę (JDK), Android SDK i emulator.
2. Przy pierwszym uruchomieniu kreator **Setup Wizard** pobierze SDK. Wybierz **Standard** i poczekaj na koniec (kilka GB).
3. Windows może zapytać o dostęp do sieci dla Javy i emulatora: zezwól dla sieci prywatnej.

**Java:** Android Studio (od 2026.2) ma wbudowaną Javę 25, a Gradle 8.14 z projektu działa najwyżej na Javie 24 (błąd „Unsupported class file major version 69”). Dlatego Gradle uruchamia się na Javie 21 z `android/gradle/gradle-daemon-jvm.properties` i przy pierwszej synchronizacji pobiera ją sam (ok. 200 MB, do `%USERPROFILE%\.gradle\jdks`). Jeśli mimo to sync zgłosi ten błąd: **File → Settings → Build, Execution, Deployment → Build Tools → Gradle → Gradle JDK** → wybierz Javę 21 (albo **Download JDK…** → wersja 21). Adresy pobrania odświeża `gradlew updateDaemonJvm --jvm-version=21` w folderze `android/`.

## 2. Zbudowanie i otwarcie projektu

W katalogu projektu (`F:\baristacompanion`):

```sh
npm install            # raz, po pobraniu zmian z Capacitorem
npm run android:sync   # build PWA i kopia do projektu Androida
npm run android:open   # otwiera folder android/ w Android Studio
```

W Android Studio poczekaj, aż na dole zniknie pasek **Gradle sync** (za pierwszym razem kilka minut: pobiera Gradle, Javę 21 i brakującą platformę Androida 36). Jeśli Android Studio zaproponuje aktualizację wtyczki Gradle (AGP 9, „Upgrade Assistant”) albo samego Gradle do wersji 9, odmów: Capacitor 8 działa z AGP 8. Android Studio zapisze ścieżkę do SDK w `android/local.properties` (poza repozytorium).

Po każdej zmianie w kodzie aplikacji uruchom znowu `npm run android:sync` i dopiero wtedy ▶ Run.

## 3a. Uruchomienie w emulatorze

1. Android Studio → **Device Manager** (ikona telefonu po prawej) → **+** → **Create Virtual Device**.
2. Wybierz np. **Pixel 8** → obraz systemu z najnowszym API (pobierz go strzałką) → **Finish**.
3. Na górnym pasku wybierz emulator i kliknij zielone **▶ Run 'app'**.

## 3b. Uruchomienie na telefonie przez USB

1. Telefon: **Ustawienia → Informacje o telefonie** → 7 razy dotknij **Numer kompilacji**. Pojawią się **Opcje programisty**.
2. **Ustawienia → System → Opcje programisty** → włącz **Debugowanie USB**.
3. Podłącz telefon kablem i na telefonie zaakceptuj „Zezwolić na debugowanie USB?”.
4. W Android Studio wybierz telefon na górnym pasku i kliknij **▶ Run 'app'**.

## 4. Plik APK do zainstalowania bez Android Studio

```sh
npm run android:apk
```

Plik: `android/app/build/outputs/apk/debug/app-debug.apk`. Przenieś go na telefon (kabel, Dysk Google), otwórz i zezwól na instalację z tego źródła. To wersja testowa (podpis debug): Google Play wymaga osobnego podpisu wydania, patrz punkt 8.

Jeśli `npm run android:apk` zgłasza brak Javy, uruchom go z terminala Android Studio (**View → Tool Windows → Terminal**) albo ustaw `JAVA_HOME` na `C:\Program Files\Android\Android Studio\jbr` (Java 25 wystarczy do startu, a samo budowanie i tak idzie na Javie 21). „SDK location not found”: otwórz projekt raz w Android Studio (zapisze `android/local.properties`) albo ustaw `ANDROID_HOME` na `%LOCALAPPDATA%\Android\Sdk`.

## 5. Test powiadomień (lista kontrolna)

| Krok | Oczekiwany wynik | Wynik |
| :- | :- | :-: |
| Parzenie → Drip → **Zacznij parzenie** | Karta „Powiadomienie, gdy minie czas” z wyjaśnieniem | [ ] |
| **Włącz powiadomienia** | Systemowe okno zgody Androida (13+) | [ ] |
| Po zgodzie | Karta „Powiadomienie co do sekundy”: **Otwórz ustawienia** prowadzi do „Alarmy i przypomnienia” | [ ] |
| Dojdź do kroku 3 (40 s), **Start** i zablokuj telefon przyciskiem zasilania | Po 40 s powiadomienie „Czas minął” z dźwiękiem i treścią „Teraz: Dolewaj powoli…” | [ ] |
| Odblokuj i wróć do aplikacji | Powiadomienie znika z paska, w aplikacji widać „Czas minął!” | [ ] |
| **Start**, potem **Pauza**, zablokuj telefon na dłużej niż czas kroku | Powiadomienie **nie** przychodzi | [ ] |
| **Start**, potem **Dalej** albo **Wstecz**, albo wyjście z parzenia | Powiadomienie **nie** przychodzi | [ ] |
| Krok „Poczekaj, aż woda przepłynie” (rusza sam) przy zablokowanym ekranie | Powiadomienie po 1 min 20 s | [ ] |
| Krótkie i dłuższe kroki (30 s – 5 min) w trybie uśpienia: `adb shell dumpsys deviceidle force-idle` | Powiadomienie na czas (z zgodą na dokładny czas) | [ ] |
| Cold brew → **Zalane, zaczynam macerację**, zamknij aplikację | – | [ ] |
| Przestaw zegar telefonu o 17 h do przodu (Ustawienia → System → Data i godzina, wyłącz automatyczną) | Powiadomienie „Cold brew gotowe” | [ ] |
| Cold brew → **Przerwij** albo **Zakończ** | Zaplanowane powiadomienie znika (po przestawieniu zegara nie przychodzi) | [ ] |
| Odmowa zgody (Ustawienia → Aplikacje → Barista Companion → Powiadomienia: wyłącz) | Parzenie działa, sygnał i komunikat w aplikacji jak w PWA | [ ] |

Ikona na pasku stanu to biała szklanka, a nazwa i ikona aplikacji są takie jak w PWA.

### Ograniczenia Androida

- **Dokładny czas:** od Androida 12 aplikacja potrzebuje zgody „Alarmy i przypomnienia” (`SCHEDULE_EXACT_ALARM`), od Androida 14 domyślnie wyłączonej. Bez niej powiadomienie jest przybliżone i w trybie uśpienia (Doze) może przyjść kilka minut później. Aplikacja nie otwiera tego ustawienia sama w trakcie parzenia, tylko proponuje to w karcie przed parzeniem.
- **Doze:** przybliżone powiadomienia z `allowWhileIdle` przychodzą w uśpieniu najwyżej raz na ok. 9 minut.
- Jeśli test pokaże opóźnienia także ze zgodą na dokładny czas, następnym krokiem jest usługa pierwszoplanowa z licznikiem w powiadomieniu (własna wtyczka). To osobna, opcjonalna zmiana.

## 5b. Test logowania (lista kontrolna)

Wymaga projektu Supabase (`docs/backend.md`) z adresem `pl.baristacompanion.app://konto` na liście **Redirect URLs** i zmiennymi `VITE_SUPABASE_*` w `.env.local` przed `npm run android:sync`.

1. **Konto → Wyślij link do logowania** na swój adres. Na tym samym telefonie otwórz e-mail i stuknij link: Android pyta, czym otworzyć (albo od razu otwiera) **Barista Companion**, a aplikacja pokazuje „Zalogowano jako …”.
2. To samo przy zamkniętej aplikacji (usuń ją z ostatnich): link ją uruchamia i loguje.
3. **Zaloguj przez Google**: otwiera się karta Chrome, po wyborze konta wraca do aplikacji, zalogowany.
4. Ze **Społeczności → Zaloguj się, żeby udostępniać**: po zalogowaniu (link albo Google) aplikacja wraca do Społeczności.
5. Link otwarty drugi raz (już użyty): ekran konta pokazuje komunikat, że link wygasł; kod z e-maila dalej działa.

Schemat adresu jest w `AndroidManifest.xml` (`intent-filter` z `@string/custom_url_scheme` i hostem `konto`), a obsługa w `src/features/account/nativeAuth.ts` i `useNativeAuthReturn.ts`.

## 6. Ikony i ekran startowy

Ikony w `android/app/src/main/res/mipmap-*` wygenerowano z ikon PWA (`public/pwa-512x512.png`, `public/maskable-icon-512x512.png`), tło ikony adaptacyjnej to `#3B2A20`, a ekran startowy ma tło `#faf6f1` z manifestu. Po zmianie ikon PWA wygeneruj je ponownie: Android Studio → prawy klik na `res` → **New → Image Asset**.

## 7. Service worker

W aplikacji natywnej service worker się nie rejestruje (`src/main.tsx` sprawdza `Capacitor.isNativePlatform()`): pliki są w paczce aplikacji, a cache mógłby podać starą wersję po aktualizacji.

## 8. Później: Google Play

Na start wystarczy APK do testów. Publikacja w Google Play wymaga konta dewelopera (jednorazowo 25 USD), podpisu wydania (klucz trzymany poza repozytorium) i paczki AAB (**Build → Generate Signed App Bundle**). Identyfikator `pl.baristacompanion.app` z `capacitor.config.ts` (i `android/app/build.gradle`) zmień przed pierwszą publikacją, jeśli ma być inny: potem nie da się go zmienić. Nie zakładaj konta bez decyzji autora.
