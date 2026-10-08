# Barista Companion: plan MVP

Data: 2026-10-08 · Źródło: podyktowane przemyślenia (Superwhisper, druga, poprawna transkrypcja)

## Cel

Aplikacja dla domowych baristów, którzy parzą kawę metodami alternatywnymi (bez ekspresu), lubią się nią bawić, ale nie mają czasu szukać przepisów. Zwykłą kawę ludzie umieją zrobić, więc sednem są drinki kawowe (np. espresso tonic, kawy pomarańczowe). Do tego aplikacja prowadzi przez wszystko, co je poprzedza: dobór ziaren, mielenie, parzenie z timerem, mleko i syropy domowe, aż po efektowne podanie. Docelowo ma to być aplikacja na telefon, a pierwsza wersja (MVP) będzie webowa.

## Decyzje

- **Grupa docelowa:** domowi bariści, którzy lubią metody alternatywne (nie ekspres) i lubią eksperymentować, ale nie mają czasu szukać przepisów ani ochoty iść do sklepu po syrop. Ich podejście: „mam kawę i chcę ją wypić inaczej albo efektownie podać”.
- **Główna wartość:** drinki kawowe, bo z nimi ludzie mają problem.
- **MVP:** wersja webowa, bo autor nie ma doświadczenia z aplikacjami mobilnymi. Docelowo telefon.
- **Metody parzenia:** kawiarka, prasa francuska, klasyczna zalewajka, drip, filtry i inne metody alternatywne, cold brew.
- **Ziarna:**
  - Każda metoda ma preferowane ziarna. Jasno palone są kwaśniejsze, więc gorzej pasują do kawiarki, a lepiej do metod alternatywnych.
  - Profil ziaren: palenie (jasne / średnie / ciemne), nuty (czekoladowe, kwiatowe…), pochodzenie, mieszanka. Profil można przewidzieć, zostawić użytkownikowi albo pobrać z bazy wiedzy. To jeszcze nie jest rozstrzygnięte.
- **Mielenie:** każda metoda ma swoją grubość. Do kawiarki drobniej, do prasy francuskiej grubiej.
- **Instrukcje parzenia krok po kroku.** Przykład prasy francuskiej: ciepła woda, kilka minut, zamieszać, zebrać piankę, zamieszać jeszcze raz, kolejne 5 minut.
- **Stoper** przypomina o kolejnych krokach („za 5 minut zamieszaj”).
- **Mleko:**
  - typy: krowie, owsiane (często smakowe), skondensowane,
  - zwykłe mleko można „ogarnąć” syropem smakowym,
  - spienianie ręcznie albo spieniaczem (do sprawdzenia, czy to ma znaczenie),
  - miksowanie z dodatkami: maliny (kawa malinowa), lody (shake kawowy, kawa dodana na końcu, schłodzona).
- **Kolejność warstw** ma być pokazana użytkownikowi (np. latte macchiato: mleko na dole, kawa w środku, pianka na górze).
- **Café bombón** („kawa po hiszpańsku”): espresso z mlekiem skondensowanym na dnie.
- **Espresso bez ekspresu:** w drinkach opartych na espresso (espresso tonic, café bombón, latte macchiato…) bazą jest kawa z kawiarki. To też jest coś w rodzaju espresso, a drink z kawy z kawiarki z mlekiem smakuje bardzo podobnie do wersji z espresso.
- **Podział napojów** na podawane na ciepło i na zimno.
- **Sposób podania** to ostatnia część aplikacji:
  - espresso w filiżance, drinki kawowe w przezroczystych szklankach, wyższych albo niższych,
  - wzory na szklance (np. z czekolady),
  - brzegi szklanki obtoczone np. w kakao,
  - posypka i kawałki owoców na górze.
- **Syropy domowe:** zamiast „idź kup syrop pomarańczowy” aplikacja pokazuje „kup albo zrób sam”. Kliknięcie otwiera szybki przepis.
- **Cold brew** z dodatkami do maceracji: cynamon, kardamon.

## Moje założenia

Każdy punkt to moje założenie. Popraw, jeśli coś się nie zgadza.

- **Kolejność pracy:** najpierw napoje i sposób podania, potem parzenie. Mówisz, że to drinki są luką na rynku, więc warto je mieć najwcześniej do pokazania i przetestowania. Przepływ w gotowej aplikacji zostaje taki, jak go opisałeś: ziarna → parzenie → napój → podanie.
- **Nazwa robocza:** Barista Companion (od nazwy folderu).
- **PWA:** strona, którą można zainstalować na telefonie z przeglądarki. To „prawie aplikacja” bez nauki programowania mobilnego. Później można ją opakować w aplikację natywną (Capacitor) albo przepisać (React Native / Expo).
- **Technologia:** Vite + React + TypeScript + Tailwind CSS + React Router, testy w Vitest. W MVP bez backendu.
- **Treści** (metody, napoje, syropy, sposoby podania) leżą jako pliki danych w repozytorium. Pierwszą wersję piszę ja, a ty sprawdzasz ją jako znawca kawy.
- **Profil ziaren wpisuje użytkownik** (wybór z list), a metody dobierają proste reguły. Zewnętrzną bazę ziaren odkładam na po MVP.
- **Bez kont i logowania.** „Moje ziarna” zapisują się w przeglądarce.
- **Język:** interfejs i treści po polsku.
- **Timer** działa w aplikacji: dźwięk, wibracja (tylko Android, iPhone jej nie obsługuje), wygaszanie ekranu wyłączone na czas parzenia. Przy cold brew (12–24 h) aplikacja pozwoli dodać przypomnienie do kalendarza.
- **Poprawki transkrypcji:**

  | Z nagrania | Odczytałem jako |
  | :- | :- |
  | „bogactw”, „peristów” | baristów |
  | „kawiarnia” | kawiarka |
  | „druga panna” | drip |
  | „metody ważenia” | metody parzenia |
  | „światła” | ziarna |
  | „Lata Amerykana” | latte macchiato |
  | „bombilla / bombala” | café bombón |
  | „SPS w feedlinkach” | espresso w filiżankach |
  | „dźwięki kawowe” | drinki kawowe |
  | „obsmagowywać brzegi” | obtaczać brzegi |
  | „na głowę” | na górę |
  | „kaktamon” | kardamon |
  | „spekulatny” | spektakularny |
  | „schudzona” | schłodzona |
  | „sygopy” | syropy |

## Pytania blokujące

Brak. Wszystkie pytania są rozstrzygnięte.

## Plan pracy

Każdy krok mieści się w jednej sesji z Claude Code.

### Faza 0: fundament

1. **Szkielet projektu.** Gotowe, gdy:
   - `npm run dev` działa,
   - aplikacja otwiera się na telefonie w tej samej sieci Wi-Fi,
   - ma dolną nawigację (Napoje, Parzenie, Moje ziarna),
   - da się ją zainstalować jako PWA.
2. **Model danych i treści startowe.** Gotowe, gdy:
   - są typy i dane dla ~7 metod, ~12 napojów (z warstwami i sposobem podania), typów mleka i ~5 syropów,
   - testy sprawdzają spójność odwołań i przechodzą.

### Faza 1: napoje, czyli sedno aplikacji

3. **Katalog napojów.** Gotowe, gdy: filtry (ciepłe/zimne, mleko, roślinne, czas) działają razem, a każdy napój ma ekran.
4. **Wizualizacja napoju w szklance.** Gotowe, gdy: latte macchiato, café bombón i espresso tonic rysują się poprawnie, każdy we właściwej szklance.
5. **Mleko, spienianie, syropy domowe i dodatki.** Gotowe, gdy: z ekranu napoju do przepisu na syrop i do poradnika spieniania prowadzą najwyżej 2 tapnięcia.
6. **Sposób podania.** Gotowe, gdy:
   - każdy napój ma sekcję podania,
   - wzory z czekolady, obtoczony brzeg i dekoracje na górze są widoczne na rysunku szklanki.

### Faza 2: parzenie

7. **Metody parzenia: lista i szczegóły.** Gotowe, gdy:
   - każda metoda ma ekran z mieleniem na skali, proporcją, temperaturą i krokami,
   - linki z napojów prowadzą do właściwej metody.
8. **Prowadzone parzenie z timerem.** Gotowe, gdy:
   - prasę francuską da się przejść od początku do końca z sygnałami między krokami,
   - czas jest poprawny po powrocie z innej karty.
9. **Moje ziarna i dopasowanie metod.** Gotowe, gdy:
   - ziarna zapisują się po odświeżeniu,
   - ranking metod ma uzasadnienie,
   - reguły mają testy.
10. **Cold brew z przyprawami.** Gotowe, gdy:
    - rozpoczęte cold brew przetrwa zamknięcie aplikacji,
    - przypomnienie da się dodać do kalendarza.

### Faza 3: całość i publikacja

11. **Główna ścieżka „Mam kawę”.** Gotowe, gdy: od ekranu startowego przez parzenie do podania dochodzi się bez ślepych zaułków, co potwierdza test E2E.
12. **Dopracowanie wyglądu i dostępności.** Gotowe, gdy: Lighthouse pokazuje ≥ 90 (Accessibility, Performance) na telefonie.
13. **Publikacja i test na telefonie.** Gotowe, gdy:
    - konfiguracja wdrożenia jest w repozytorium,
    - jest instrukcja publikacji krok po kroku,
    - jest lista kontrolna testów na Androidzie i iPhonie.

### Po MVP (nie teraz)

- konta i synchronizacja między urządzeniami,
- zewnętrzna baza ziaren,
- aplikacja natywna (Capacitor lub Expo),
- przepisy od społeczności.

## Prompty

Każdy prompt wklejasz do nowej sesji Claude Code otwartej w `F:\baristacompanion`.

### 1. Szkielet projektu

```text
Kontekst: budujemy Barista Companion, aplikację PWA dla domowych baristów, którzy parzą kawę metodami alternatywnymi (bez ekspresu). Sednem są drinki kawowe (np. espresso tonic, kawa pomarańczowa) i ich efektowne podanie. Stack: Vite + React + TypeScript + Tailwind CSS + React Router, testy Vitest, bez backendu. Projekt jest w F:\baristacompanion (na razie pusty, poza folderem plans/). Pełny plan: plans/2026-10-08-barista-companion-mvp.md. Interfejs i treści po polsku, projektujemy najpierw pod telefon.

Cel: postaw szkielet projektu.

Zrób:
- git init, projekt Vite + React + TypeScript, Tailwind, React Router, Vitest + Testing Library, vite-plugin-pwa (manifest, tymczasowa ikona, service worker).
- Układ pod telefon: dolna nawigacja z trzema zakładkami: Napoje (domyślna), Parzenie, Moje ziarna (na razie puste ekrany).
- Podstawowe tokeny wyglądu (kawowa paleta kolorów, typografia), jasny i ciemny motyw.
- Skrypty: dev (z --host, żeby otworzyć aplikację na telefonie w tej samej sieci), build, preview, test, typecheck.
- CLAUDE.md z opisem projektu, stacku, komend i konwencji.

Ograniczenia: bez backendu i bez ciężkich bibliotek UI. Instaluj tylko to, co potrzebne.

Gotowe, gdy: dev server działa, build i typecheck przechodzą, nawigacja działa przy szerokości 375 px, a manifest i service worker są poprawne (aplikację da się zainstalować).
```

### 2. Model danych i treści startowe

```text
Kontekst: Barista Companion, aplikacja PWA dla domowych baristów (metody alternatywne, bez ekspresu). Sednem są drinki kawowe i ich efektowne podanie. Stack: Vite + React + TypeScript + Tailwind + React Router, Vitest, bez backendu. Projekt: F:\baristacompanion, zasady w CLAUDE.md, plan w plans/2026-10-08-barista-companion-mvp.md. Treści po polsku.

Cel: zdefiniuj model danych i napisz treści startowe w src/data.

Typy:
- BrewMethod: id, nazwa, opis, sprzęt, grubość mielenia (skala od bardzo drobnego do grubego; np. kawiarka drobno, prasa francuska grubo), proporcja kawa:woda, temperatura wody, łączny czas, poziom trudności, do jakich paleń i nut pasuje i dlaczego, kroki (tekst, opcjonalny czas w sekundach, czy krok wymaga działania użytkownika).
- BeanProfile: palenie (jasne / średnie / ciemne), nuty (czekoladowe, orzechowe, karmelowe, owocowe, kwiatowe, cytrusowe…), pochodzenie (opcjonalnie), single origin czy mieszanka.
- Milk: typ (krowie, owsiane, inne roślinne, skondensowane), czy smakowe, jak się pieni.
- FrothingMethod: ręcznie (prasa francuska, słoik), spieniacz ręczny, spieniacz elektryczny.
- Syrup: nazwa, czy łatwo go kupić, szybki przepis domowy.
- Serving: typ naczynia (filiżanka, niska szklanka, wysoka szklanka…, przezroczyste lub nie), dekoracje: wzory na ściankach (np. czekolada), obtoczony brzeg (np. kakao, cukier), posypka na górze, kawałki owoców. Każda dekoracja ma krótką instrukcję.
- Drink: nazwa, ciepły czy zimny, czas przygotowania, baza kawowa (odwołanie do metody), mleko, spienianie, warstwy od dołu (nazwa, objętość w ml, kolor), dodatki (syrop, owoce, lody, przyprawy, lód), kroki, sposób podania (Serving).

Treści:
- Metody: kawiarka, prasa francuska, zalewajka, drip/V60, Chemex, AeroPress, cold brew.
- Napoje (min. 12): espresso tonic, kawa pomarańczowa, latte macchiato, café bombón, kawa malinowa (mleko zmiksowane z malinami), shake kawowy (mleko z lodami, schłodzona kawa na końcu), latte z syropem, mocha z czekoladowymi wzorami na szklance, cold brew z cynamonem, cold brew z kardamonem i kilka klasyków.
- Syropy: m.in. pomarańczowy, waniliowy, karmelowy, cynamonowy, malinowy.
- Użytkownicy nie mają ekspresu. Tam, gdzie przepis wymaga espresso, bazą jest kawa z kawiarki: to też jest coś w rodzaju espresso, a drink z niej z mlekiem smakuje bardzo podobnie. W danych napoju baza wskazuje wtedy metodę „kawiarka”.
- Wszystko, czego nie jesteś pewien, oznacz w danych needsReview: true. Sprawdzi to autor. Przykład do sprawdzenia: kawiarka z zimną czy z gorącą wodą.

Gotowe, gdy: typecheck przechodzi, a testy Vitest sprawdzają, że:
- każde odwołanie (metoda, mleko, syrop) wskazuje istniejący rekord,
- każdy krok z czasem ma czas > 0,
- warstwy napoju mają dodatnie objętości,
- każdy napój ma sposób podania.
Wszystkie testy przechodzą.
```

### 3. Katalog napojów

```text
Kontekst: Barista Companion, aplikacja PWA dla domowych baristów (metody alternatywne, bez ekspresu). Sednem są drinki kawowe i ich efektowne podanie. Stack: Vite + React + TypeScript + Tailwind + React Router, Vitest + Testing Library. Projekt: F:\baristacompanion, zasady w CLAUDE.md, plan w plans/2026-10-08-barista-companion-mvp.md. Dane napojów, mleka, syropów i metod są w src/data. Zakładka Napoje jest na razie pusta.

Cel: zbuduj zakładkę Napoje.

Zrób:
- Lista napojów z filtrami, które działają razem: ciepłe/zimne, z mlekiem/bez, wersja roślinna, czas przygotowania.
- Ekran napoju: składniki, sprzęt, baza kawowa z linkiem do /parzenie/:id (ekrany metod powstaną później, na razie link może prowadzić do zaślepki), kroki.
- Zostaw dwa oznaczone miejsca na kolejne kroki: wizualizację w szklance (krok 4) i sposób podania (krok 6).

Ograniczenia: dane bierz z src/data, nie kopiuj ich. Projektuj najpierw pod telefon.

Gotowe, gdy: filtry łączą się poprawnie (np. zimne + roślinne), każdy napój z danych ma ekran, a testy przechodzą.
```

### 4. Wizualizacja napoju w szklance

```text
Kontekst: Barista Companion, aplikacja PWA dla domowych baristów (metody alternatywne, bez ekspresu). Sednem są drinki kawowe i ich efektowne podanie. Stack: Vite + React + TypeScript + Tailwind, Vitest. Projekt: F:\baristacompanion, zasady w CLAUDE.md, plan w plans/2026-10-08-barista-companion-mvp.md. Każdy napój w src/data ma warstwy od dołu (nazwa, objętość w ml, kolor), dodatki i sposób podania z typem naczynia. Ekran napoju ma zaślepkę na wizualizację.

Cel: zbuduj komponent <DrinkGlass>, który rysuje napój w SVG. To ma być wizytówka aplikacji.

Zrób:
- Naczynie zgodne z danymi: filiżanka, niska szklanka, wysoka szklanka itd. Szklanki przezroczyste, żeby warstwy było widać.
- Warstwy od dołu w proporcjach z danych, z kolorami i podpisami. Lód i pianka jako osobne elementy.
- Delikatna animacja nalewania warstw po kolei. Gdy użytkownik ma włączone ograniczenie animacji (prefers-reduced-motion), animację wyłącz.
- Zostaw w API komponentu miejsce na dekoracje (wzory na ściankach, obtoczony brzeg, posypka, owoce). Wypełni je krok 6.
- Działa w jasnym i ciemnym motywie. Zastąp zaślepkę na ekranie napoju.

Gotowe, gdy poprawnie wyglądają, każdy we właściwym naczyniu:
- latte macchiato (mleko, kawa, pianka),
- café bombón (mleko skondensowane, kawa),
- espresso tonic (lód z tonikiem, kawa).
```

### 5. Mleko, spienianie, syropy domowe i dodatki

```text
Kontekst: Barista Companion, aplikacja PWA dla domowych baristów (metody alternatywne, bez ekspresu). Sednem są drinki kawowe i ich efektowne podanie. Użytkownikom często nie chce się iść do sklepu po syrop, więc aplikacja ma podpowiadać szybkie przepisy domowe. Stack: Vite + React + TypeScript + Tailwind + React Router, Vitest. Projekt: F:\baristacompanion, zasady w CLAUDE.md, plan w plans/2026-10-08-barista-companion-mvp.md. Dane mleka, metod spieniania, syropów i napojów są w src/data. Katalog napojów i ekrany napojów już istnieją.

Cel: dodaj wiedzę o mleku, spienianiu, syropach i dodatkach.

Zrób:
- Sekcja mleka: które typy dobrze się pienią, które są smakowe. Podpowiedź: zwykłe mleko z syropem zamiast mleka smakowego.
- Poradnik spieniania: ręcznie (prasa francuska, słoik), spieniaczem ręcznym, spieniaczem elektrycznym. Kroki, temperatura i czy metoda zmienia efekt.
- Na ekranie napoju tapnięcie syropu otwiera okno „Kup albo zrób sam” z szybkim przepisem domowym.
- Dodatki miksowane (maliny, lody): kroki w przepisie, w tym „schłodź kawę przed dodaniem”.

Gotowe, gdy: z ekranu kawy malinowej, kawy pomarańczowej i latte z syropem dochodzisz do przepisu na syrop i do poradnika spieniania w najwyżej 2 tapnięciach, a testy przechodzą.
```

### 6. Sposób podania

```text
Kontekst: Barista Companion, aplikacja PWA dla domowych baristów (metody alternatywne, bez ekspresu). Sednem są drinki kawowe i ich efektowne podanie. Użytkownik myśli: „mam kawę i chcę ją wypić inaczej albo podać w spektakularny sposób”. Stack: Vite + React + TypeScript + Tailwind + React Router, Vitest. Projekt: F:\baristacompanion, zasady w CLAUDE.md, plan w plans/2026-10-08-barista-companion-mvp.md. Każdy napój w src/data ma sposób podania (naczynie i dekoracje z instrukcjami). Komponent <DrinkGlass> rysuje naczynie i warstwy i ma przygotowane miejsce na dekoracje. Ekran napoju ma zaślepkę na sekcję podania.

Cel: zbuduj sekcję „Jak podać” i dorysuj dekoracje w <DrinkGlass>.

Zrób:
- Sekcja „Jak podać” na ekranie napoju:
  - w czym podać i dlaczego (espresso w filiżance; drinki w przezroczystych szklankach, wyższych albo niższych),
  - dekoracje krok po kroku: wzory z czekolady na ściankach, brzeg obtoczony w kakao lub cukrze, posypka na górze, kawałki owoców.
- <DrinkGlass> rysuje dekoracje z danych: smugi czekolady na ściankach, obtoczony brzeg, posypkę i owoce na górze.
- Kolejność na ekranie napoju zgodna z przepływem: składniki → przygotowanie → podanie.

Gotowe, gdy:
- każdy napój ma sekcję podania,
- poprawnie rysują się: mocha z czekoladowymi wzorami, kawa pomarańczowa z plastrem pomarańczy i obtoczonym brzegiem, latte z posypką z kakao,
- testy przechodzą.
```

### 7. Metody parzenia: lista i szczegóły

```text
Kontekst: Barista Companion, aplikacja PWA dla domowych baristów (metody alternatywne, bez ekspresu). Sednem są drinki kawowe; zakładka Napoje już działa i linkuje do metod przez /parzenie/:id (obecnie zaślepka). Stack: Vite + React + TypeScript + Tailwind + React Router, Vitest + Testing Library. Projekt: F:\baristacompanion, zasady w CLAUDE.md, plan w plans/2026-10-08-barista-companion-mvp.md. Dane metod są w src/data.

Cel: zbuduj zakładkę Parzenie.

Zrób:
- Lista metod: karta z nazwą, łącznym czasem, poziomem trudności i potrzebnym sprzętem.
- Ekran szczegółów na /parzenie/:id:
  - sprzęt,
  - grubość mielenia na wizualnej skali (kawiarka drobno, prasa francuska grubo itd.),
  - proporcja i temperatura,
  - do jakich ziaren pasuje i dlaczego (np. jasne palenie jest kwaśniejsze, więc lepiej do przelewu niż do kawiarki),
  - lista kroków,
  - napoje, które można zrobić na bazie tej metody.
- Przycisk „Zacznij parzenie” prowadzi do /parzenie/:id/start (na razie zaślepka).

Ograniczenia: dane bierz z src/data, nie kopiuj ich.

Gotowe, gdy: każda metoda z danych ma działający ekran, linki z ekranów napojów trafiają we właściwą metodę, skala mielenia jest czytelna przy 375 px, a testy komponentów przechodzą.
```

### 8. Prowadzone parzenie z timerem

```text
Kontekst: Barista Companion, aplikacja PWA dla domowych baristów (metody alternatywne, bez ekspresu). Stack: Vite + React + TypeScript + Tailwind + React Router, Vitest. Projekt: F:\baristacompanion, zasady w CLAUDE.md, plan w plans/2026-10-08-barista-companion-mvp.md. Metody i ich kroki (z czasami w sekundach) są w src/data. Ekran /parzenie/:id/start jest na razie zaślepką.

Cel: zbuduj tryb prowadzonego parzenia na /parzenie/:id/start.

Zrób:
- Jeden krok na ekran, duży czytelny tekst, przyciski dalej i wstecz, pauza i reset.
- Krok z czasem ma odliczanie. Gdy czas minie: dźwięk, wibracja tam, gdzie działa (iPhone jej nie obsługuje), i wyraźny komunikat, co teraz zrobić (np. „Zamieszaj i zbierz piankę”).
- Licz czas od znacznika startu (Date.now()), a nie przez dodawanie kolejnych interwałów. Dzięki temu czas zgadza się po przełączeniu karty albo zablokowaniu ekranu.
- Użyj Wake Lock API, żeby ekran nie gasł w trakcie parzenia. Jeśli API nie jest dostępne, aplikacja ma działać bez niego.
- Logikę timera trzymaj w osobnym module, niezależnym od Reacta.
- Na końcu parzenia zaproponuj napoje na bazie tej metody.

Gotowe, gdy:
- prasę francuską da się przejść od początku do końca,
- testy logiki timera (z fałszywym zegarem) przechodzą,
- po przełączeniu karty na 30 sekund timer pokazuje poprawny czas.
```

### 9. Moje ziarna i dopasowanie metod

```text
Kontekst: Barista Companion, aplikacja PWA dla domowych baristów (metody alternatywne, bez ekspresu). Stack: Vite + React + TypeScript + Tailwind + React Router, Vitest. Projekt: F:\baristacompanion, zasady w CLAUDE.md, plan w plans/2026-10-08-barista-companion-mvp.md. Typy BeanProfile i BrewMethod oraz dane metod są w src/data. Brak backendu i kont.

Cel: zbuduj zakładkę Moje ziarna i dopasowanie metod do ziaren.

Zrób:
- Formularz dodawania ziaren: nazwa, palarnia (opcjonalnie), palenie, nuty, pochodzenie, single origin czy mieszanka.
- Lista zapisanych ziaren, z edycją i usuwaniem. Zapis w localStorage. Gdy localStorage jest niedostępny, aplikacja nie może się wysypać.
- Czysta funkcja dopasowania w osobnym module. Dla profilu ziaren zwraca ranking metod z krótkim uzasadnieniem po polsku, np. „Jasne palenie jest kwaśniejsze: w przelewie wydobędziesz owocowość, w kawiarce może wyjść kwaśno”.
- Na ekranie ziaren przycisk „Jak zaparzyć?” pokazuje ranking z linkami do metod.

Gotowe, gdy: testy reguł przechodzą (co najmniej każde palenie w kilku zestawieniach nut), a dodane ziarna zostają po odświeżeniu strony.
```

### 10. Cold brew z przyprawami

```text
Kontekst: Barista Companion, aplikacja PWA dla domowych baristów (metody alternatywne, bez ekspresu). Stack: Vite + React + TypeScript + Tailwind + React Router, Vitest. Projekt: F:\baristacompanion, zasady w CLAUDE.md, plan w plans/2026-10-08-barista-companion-mvp.md. Prowadzone parzenie z timerem już działa dla krótkich metod. Cold brew i napoje na jego bazie są w src/data.

Cel: obsłuż cold brew, które maceruje się 12–24 godziny.

Zrób:
- Przepis: proporcja, mielenie, czas maceracji, filtrowanie, rozcieńczanie. Warianty z cynamonem i z kardamonem dodanymi do maceracji: ile przypraw i kiedy je dodać.
- Długi timer: zapisz czas startu w localStorage. Pokazuj „gotowe ok. jutro o 8:30” i postęp także po ponownym otwarciu aplikacji.
- Przycisk „Dodaj przypomnienie do kalendarza”, który tworzy plik .ics.
- Połącz napoje na bazie cold brew z tym przepisem.

Gotowe, gdy:
- rozpoczęte cold brew zostaje po zamknięciu i ponownym otwarciu aplikacji,
- plik .ics importuje się do kalendarza w telefonie,
- testy liczenia godziny gotowości (w tym przejście przez północ) przechodzą.
```

### 11. Główna ścieżka „Mam kawę”

```text
Kontekst: Barista Companion, aplikacja PWA dla domowych baristów (metody alternatywne, bez ekspresu). Sednem są drinki kawowe i ich efektowne podanie. Stack: Vite + React + TypeScript + Tailwind + React Router, Vitest. Projekt: F:\baristacompanion, zasady w CLAUDE.md, plan w plans/2026-10-08-barista-companion-mvp.md. Osobno działają już: napoje z wizualizacją i sposobem podania, mleko i syropy domowe, metody z prowadzonym parzeniem, Moje ziarna z dopasowaniem metod, cold brew.

Cel: połącz wszystko w jedną główną ścieżkę na ekranie startowym.

Zrób:
- Ekran startowy z jednym głównym przyciskiem: „Mam kawę. Co z nią zrobić?”.
- Kolejne kroki ścieżki:
  1. wybór zapisanych ziaren albo opis nowych,
  2. polecane metody,
  3. wybór metody i mielenie,
  4. polecane napoje do tej metody, podzielone na ciepłe i zimne,
  5. prowadzone parzenie,
  6. złożenie napoju (mleko, spienianie, syropy, dodatki, warstwy),
  7. sposób podania.
- Na każdym etapie można cofnąć się bez utraty dokonanych wyborów.
- Dodaj Playwright i jeden test E2E dla tej ścieżki.

Gotowe, gdy: od ekranu startowego do sposobu podania dochodzi się bez ślepych zaułków, a test E2E przechodzi ścieżkę: jasne ziarna → drip → zimny napój → podanie.
```

### 12. Dopracowanie wyglądu i dostępności

```text
Kontekst: Barista Companion, aplikacja PWA dla domowych baristów (metody alternatywne, bez ekspresu). Sednem są drinki kawowe i ich efektowne podanie. Stack: Vite + React + TypeScript + Tailwind + React Router. Projekt: F:\baristacompanion, zasady w CLAUDE.md, plan w plans/2026-10-08-barista-companion-mvp.md. Wszystkie funkcje MVP działają. Autorowi zależy, żeby aplikacja wyglądała „super ładnie”, bo chodzi w niej o spektakularne podanie kawy.

Cel: dopracuj wygląd i dostępność.

Zrób:
- Spójne kolory, typografia i odstępy, ikony lub ilustracje metod, puste stany, płynne przejścia między ekranami, dopracowany ciemny motyw.
- Kontrast na poziomie WCAG AA, poprawne etykiety dla czytników ekranu, obsługa z klawiatury.
- Sprawdzenie na szerokościach od 360 do 430 px.

Gotowe, gdy: Lighthouse na telefonie pokazuje ≥ 90 w Accessibility i Performance, nigdzie nie ma poziomego przewijania, a każdy ekran ma sensowny pusty stan.
```

### 13. Publikacja i test na telefonie

```text
Kontekst: Barista Companion, aplikacja PWA dla domowych baristów (metody alternatywne, bez ekspresu). Stack: Vite + React + TypeScript + Tailwind + React Router, vite-plugin-pwa. Projekt: F:\baristacompanion, zasady w CLAUDE.md, plan w plans/2026-10-08-barista-companion-mvp.md. MVP jest gotowe i dopracowane.

Cel: przygotuj publikację na Vercel i test na prawdziwym telefonie.

Zrób:
- Konfiguracja wdrożenia: przekierowanie wszystkich ścieżek na index.html, poprawne cache'owanie service workera, żeby nowa wersja docierała do użytkowników.
- Instrukcja w docs/publikacja.md, krok po kroku dla osoby, która robi to pierwszy raz (konto, podpięcie repozytorium, domena).
- Lista kontrolna w docs/test-na-telefonie.md: instalacja na ekranie głównym (Android i iPhone), działanie offline, timer przy wygaszonym ekranie, cold brew po ponownym otwarciu.

Ograniczenia: nie zakładaj kont i nie publikuj niczego bez mojej zgody.

Gotowe, gdy: build produkcyjny działa lokalnie (npm run preview), a konfiguracja, instrukcja i lista kontrolna są w repozytorium.
```
