# Test na telefonie: lista kontrolna

Przejdź listę na opublikowanej wersji (adres `https://…`, patrz [publikacja.md](publikacja.md)) na dwóch telefonach: Androidzie (Chrome) i iPhonie (Safari). Zaznaczaj `[x]` w kolumnie platformy, a problemy wpisuj w uwagach.

Przez `http://` w sieci lokalnej (`npm run dev`) da się sprawdzić wygląd, ale nie instalację, pracy offline ani Wake Lock: te funkcje wymagają HTTPS.

Telefon: ______________________  System: __________  Przeglądarka: __________  Data: __________

## 1. Instalacja na ekranie głównym

| Krok | Oczekiwany wynik | Android | iPhone |
| :- | :- | :-: | :-: |
| Android: Chrome → menu ⋮ → **Zainstaluj aplikację** (albo baner „Dodaj do ekranu głównego”) | Pojawia się okno instalacji z nazwą „Barista Companion” i ikoną ziarna | [ ] | – |
| iPhone: Safari → **Udostępnij** → **Do ekranu początkowego** | Podpowiedziana nazwa „Barista”, ikona ziarna (nie zrzut strony) | – | [ ] |
| Ikona na ekranie głównym | Brązowe ziarno, ostre, bez białych rogów | [ ] | [ ] |
| Uruchomienie z ikony | Otwiera się bez paska adresu, na ekranie startowym „Mam kawę. Co z nią zrobić?” | [ ] | [ ] |
| Pasek stanu i dolna nawigacja | Nawigacja nie chowa się pod paskiem gestów (iPhone) ani pod przyciskami systemowymi | [ ] | [ ] |
| Obrót telefonu | Aplikacja zostaje w pionie | [ ] | [ ] |

## 2. Działanie offline

| Krok | Oczekiwany wynik | Android | iPhone |
| :- | :- | :-: | :-: |
| Otwórz aplikację raz z internetem, potem włącz **tryb samolotowy** | – | [ ] | [ ] |
| Zamknij aplikację i otwórz ją z ikony | Start się ładuje, bez komunikatu o braku sieci | [ ] | [ ] |
| Przejdź: Napoje → Mocha → Parzenie → Kawiarka | Wszystkie ekrany działają, rysunki szklanek są widoczne | [ ] | [ ] |
| Otwórz syrop („Kup albo zrób sam”) i poradnik spieniania | Działają offline | [ ] | [ ] |
| Wyłącz tryb samolotowy | Bez błędów, aplikacja działa dalej | [ ] | [ ] |

## 3. Prowadzone parzenie: stoper przy wygaszonym ekranie

| Krok | Oczekiwany wynik | Android | iPhone |
| :- | :- | :-: | :-: |
| Parzenie → Prasa francuska → **Zacznij parzenie** → **Start** | Odliczanie 0:30 rusza | [ ] | [ ] |
| Odłóż telefon na 1 minutę bez dotykania | Ekran **nie gaśnie** (Wake Lock) | [ ] | [ ] |
| Po końcu kroku | Dźwięk, komunikat „Czas minął! Teraz: …” | [ ] | [ ] |
| Wibracja przy końcu kroku | Android: wibruje. iPhone: brak wibracji (Safari jej nie obsługuje, to oczekiwane) | [ ] | [ ] |
| Przejdź do „Odczekaj 4 minuty”, **zablokuj telefon** na 30 s i odblokuj | Stoper pokazuje czas o 30 s mniejszy, nie „zatrzymany” | [ ] | [ ] |
| Przełącz się na inną aplikację na 30 s i wróć | Jak wyżej | [ ] | [ ] |
| Dojdź do końca parzenia | Ekran „Gotowe! Smacznej kawy” z propozycją napojów (Café au lait) | [ ] | [ ] |

Uwaga: przy zablokowanym ekranie system może wstrzymać dźwięk (zwłaszcza iOS). Ważne, żeby po odblokowaniu czas i komunikat były poprawne.

## 4. Cold brew po zamknięciu aplikacji

| Krok | Oczekiwany wynik | Android | iPhone |
| :- | :- | :-: | :-: |
| Parzenie → Cold brew → **Zacznij parzenie** → wariant „Z cynamonem”, 12 h → **Zalane, zaczynam macerację** | Ekran „Gotowe ok. … o …” z paskiem postępu | [ ] | [ ] |
| Zamknij aplikację całkowicie (usuń z listy ostatnich), otwórz ponownie | Na Starcie i w Parzeniu widać „Cold brew maceruje się, gotowe …” | [ ] | [ ] |
| Wejdź w status | Godzina gotowości bez zmian, postęp większy | [ ] | [ ] |
| **Dodaj przypomnienie do kalendarza** | Android: pobiera `cold-brew.ics` i po otwarciu proponuje dodanie wydarzenia. iPhone: Safari pokazuje wydarzenie z przyciskiem dodania | [ ] | [ ] |
| Wydarzenie w kalendarzu | Właściwa data i godzina, tytuł „Cold brew z cynamonem gotowe: przecedź”, polskie znaki poprawne | [ ] | [ ] |
| **Przerwij** → potwierdź | Status znika | [ ] | [ ] |

## 5. Moje ziarna i ścieżka „Mam kawę”

| Krok | Oczekiwany wynik | Android | iPhone |
| :- | :- | :-: | :-: |
| Dodaj ziarna (jasne, owocowe), zamknij i otwórz aplikację | Ziarna są na liście | [ ] | [ ] |
| **Jak zaparzyć?** | Ranking z drip/Chemex na górze i uzasadnieniem po polsku | [ ] | [ ] |
| Start → **Mam kawę** → zapisane ziarna → drip → Kawa mrożona z dripa → parzenie → złożenie → podanie | Wszystkie 7 kroków, bez ślepych zaułków | [ ] | [ ] |
| Systemowy gest „wstecz” (Android) / przesunięcie od lewej krawędzi (iPhone) w trakcie ścieżki | Wraca o krok, wybory zostają | [ ] | [ ] |

## 6. Wygląd i dostępność

| Krok | Oczekiwany wynik | Android | iPhone |
| :- | :- | :-: | :-: |
| Włącz w systemie **ciemny motyw** | Aplikacja przechodzi na ciemne kolory, wszystko czytelne | [ ] | [ ] |
| Włącz **ograniczenie ruchu** (Android: Usuń animacje; iPhone: Ogranicz ruch) i otwórz napój | Szklanka rysuje się od razu, bez nalewania | [ ] | [ ] |
| Powiększ tekst w ustawieniach systemu | Nic nie wychodzi poza ekran | [ ] | [ ] |
| TalkBack / VoiceOver: przejdź z Napojów do napoju | Czytnik ogłasza tytuł nowego ekranu i opis rysunku szklanki | [ ] | [ ] |

## Uwagi

| Nr | Platforma | Co się stało | Zrzut ekranu |
| :- | :- | :- | :- |
| 1 | | | |
| 2 | | | |
