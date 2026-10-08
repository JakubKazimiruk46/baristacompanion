# Funkcje z analizy konkurencji

Data: 2026-10-08 · Źródło: porównanie z Filtru, Brew Timer, Timer.Coffee, Beanconqueror, Mixel, Highball i Bar Assistant. Autor wybrał osiem funkcji.

**Stan:** wszystkie kroki zrobione 2026-10-08 na gałęzi `feature/post-mvp` (jeden commit na krok). Do sprawdzenia przez autora: treści z `needsReview` w nowych metodach i napojach oraz sekcja 7 listy [test-na-telefonie.md](../docs/test-na-telefonie.md) (udostępnianie, aparat).

## Cel

Uzupełnić MVP o to, co konkurencja ma, a nam brakuje, bez backendu i kont. Kolejność: najpierw rzeczy, z których korzystają kolejne kroki (kalkulator przed dziennikiem, katalog składników przed półką).

## Decyzje

- **Bez backendu.** Wszystko działa w przeglądarce, a zapis idzie przez `createLocalStore`.
- **Ulubione** to napoje: najczęściej się do nich wraca. Metod jest kilkanaście i nie potrzebują ulubionych.
- **Kalkulator ilości** liczy z proporcji metody. Kroki mają w tekście znaczniki `{coffee}`, `{water}` i `{water*0.6}`, więc prowadzone parzenie pokazuje przeliczone gramy i mililitry. Kawiarka ma stałe rozmiary (na 1, 2, 3, 4, 6 i 9 filiżanek), bo sitko zawsze napełnia się do pełna. Napoje mają porcje, a ilości dodatków są zapisane w strukturze (liczba, zakres, jednostka), żeby dało się je mnożyć i poprawnie odmieniać.
- **Dziennik:** wpis tworzy się sam po „Zakończ” w prowadzonym parzeniu i po zakończeniu cold brew. Ocenę (1–5), notatkę i ziarna dopisuje się na ekranie końcowym albo później w dzienniku.
- **Nowe metody:** tygielek, phin, Clever Dripper, syfon i Kalita Wave, czyli 12 metod zamiast 7. Do tego dwa napoje na nowych metodach: kawa po turecku i kawa po wietnamsku.
- **Składniki i zamienniki:** wspólny katalog (`data/ingredients.ts`). Mleka i syropy są w nim pod swoimi id, a dodatki napojów odwołują się do składników przez `ingredientId`. Zamiennik to inny składnik z katalogu z notatką, co się zmieni.
- **Półka „Co mam w domu”:** składniki i sprzęt do parzenia. Napój jest „do zrobienia”, gdy masz wszystkie niezbędne składniki albo ich zamienniki. Brakujące składniki trafiają na listę zakupów. Odhaczenie zakupu dokłada składnik na półkę. Woda jest zawsze; lód i cukier są na półce od początku.
- **Karta do udostępnienia:** obrazek 1080×1920 w stylu karty ze Spotify. Tło ma kolor napoju, w środku rysunek szklanki z warstwami, nazwa, hasło, najważniejsze informacje i logo aplikacji. PNG powstaje z SVG na kanwie, a udostępnia się go przez Web Share API (albo zapisuje jako plik).
- **Skan etykiety:** rozpoznawanie tekstu w przeglądarce (tesseract.js, ładowany dopiero przy pierwszym skanie). Zdjęcie nie opuszcza telefonu. Pierwszy skan pobiera modele językowe (pol + eng) z CDN, a potem działa z pamięci podręcznej. Rozpoznany tekst zamienia na podpowiedzi do formularza (palenie, nuty, pochodzenie, rodzaj, nazwa), które użytkownik sprawdza. Rozpoznawanie przez AI byłoby dokładniejsze, ale wymaga backendu i klucza API, więc odkładamy je na później.

## Kroki

1. **Ulubione.** Gotowe, gdy:
   - serce na ekranie napoju działa i zapis przetrwa odświeżenie,
   - katalog ma filtr „Ulubione” (`?ulubione=1`),
   - start pokazuje ulubione napoje.
2. **Kalkulator ilości.** Gotowe, gdy:
   - na ekranie metody da się wybrać liczbę osób albo mililitry (w kawiarce rozmiar),
   - prowadzone parzenie pokazuje przeliczone ilości w krokach,
   - na ekranie napoju da się wybrać liczbę porcji, a ilości składników się mnożą i dobrze odmieniają.
3. **Dziennik parzeń.** Gotowe, gdy:
   - po „Zakończ” wpis jest w dzienniku sam, z oceną i notatką do uzupełnienia,
   - dziennik ma listę i edycję wpisu,
   - ekran metody pokazuje ostatnie parzenie tą metodą.
4. **Więcej metod.** Gotowe, gdy:
   - 12 metod ma ikony, kalkulator i kroki ze stoperem,
   - dwa nowe napoje przechodzą testy spójności danych.
5. **Składniki i zamienniki.** Gotowe, gdy:
   - każdy dodatek napoju wskazuje składnik z katalogu,
   - ekran napoju pokazuje zamienniki z opisem, co się zmieni.
6. **Co mam w domu i lista zakupów.** Gotowe, gdy:
   - półka zapisuje składniki i sprzęt,
   - katalog ma filtr „Mogę zrobić” (`?mam=1`),
   - ekran napoju pokazuje, czego brakuje, i dodaje braki do listy zakupów,
   - odhaczenie zakupu dokłada składnik na półkę.
7. **Karta do udostępnienia.** Gotowe, gdy:
   - z ekranu napoju otwiera się podgląd karty,
   - obrazek PNG można udostępnić albo zapisać,
   - kolor tła ma kontrast z białym tekstem ≥ 4,5:1 dla każdego napoju.
8. **Skan etykiety.** Gotowe, gdy:
   - w formularzu ziaren i w pierwszym kroku „Mam kawę” da się zrobić zdjęcie etykiety,
   - rozpoznane dane wypełniają formularz,
   - parser ma testy na polskich i angielskich etykietach.

Po każdym kroku: `npm run typecheck`, `npm test`, osobny commit. Na koniec `npm run test:e2e`.

## Poza zakresem

- rozpoznawanie etykiet przez AI (wymaga backendu),
- synchronizacja ulubionych, dziennika i półki między urządzeniami,
