# Publikacja na Vercel krok po kroku

Instrukcja dla kogoś, kto publikuje aplikację pierwszy raz. Vercel jest darmowy dla projektów prywatnych (plan Hobby), sam buduje aplikację po każdej zmianie w repozytorium i daje adres z HTTPS. HTTPS jest konieczny: bez niego nie działa service worker, więc nie da się zainstalować aplikacji na telefonie.

Całość zajmuje około 20 minut. Konfiguracja wdrożenia już jest w repozytorium (`vercel.json`), więc niczego nie trzeba ustawiać ręcznie.

## 0. Sprawdź, że build działa u Ciebie

```sh
npm run build
npm run preview
```

Otwórz adres `Local` z terminala (`http://localhost:4173`) i przeklikaj kilka ekranów. Jeśli działa tutaj, zadziała też na Vercelu.

## 1. Repozytorium na GitHubie

Vercel pobiera kod z GitHuba (albo GitLaba, Bitbucketa).

1. Załóż konto na [github.com](https://github.com), jeśli go nie masz.
2. Kliknij **New repository**. Nazwa np. `barista-companion`, widoczność **Private**. Nie zaznaczaj „Add a README” ani `.gitignore`: projekt już je ma.
3. W terminalu, w folderze projektu:

   ```sh
   git add -A
   git commit -m "Barista Companion: MVP"
   git remote add origin https://github.com/TWOJ-LOGIN/barista-companion.git
   git push -u origin main
   ```

   Przy pierwszym `git push` Windows otworzy okno logowania do GitHuba.

## 2. Konto na Vercelu

1. Wejdź na [vercel.com](https://vercel.com) i kliknij **Sign Up**.
2. Wybierz plan **Hobby** i zaloguj się przez **Continue with GitHub**. Wtedy Vercel od razu widzi Twoje repozytoria.

## 3. Import projektu

1. W panelu Vercela: **Add New… → Project**.
2. Przy repozytorium `barista-companion` kliknij **Import**. Jeśli go nie widać, kliknij **Adjust GitHub App Permissions** i daj Vercelowi dostęp do tego repozytorium.
3. Sprawdź ustawienia (Vercel odczyta je z `vercel.json`):
   - **Framework Preset:** Vite
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`
4. Kliknij **Deploy**. Po 1–2 minutach zobaczysz adres w stylu `barista-companion-abc123.vercel.app`.
5. Wersja Node.js: Vercel odczyta ją z pola `engines` w `package.json` (22.22+ albo 24+, wymaga tego React Router 8). Jeśli build mimo to zgłosi złą wersję, ustaw ją ręcznie: **Settings → Build and Deployment → Node.js Version → 24.x**.

## 4. Sprawdzenie po wdrożeniu

- Otwórz adres na komputerze i na telefonie.
- Wejdź na podstronę (np. `/napoje/mocha`) i odśwież ją. Ma się otworzyć ten sam ekran, a nie błąd 404: za to odpowiada przekierowanie w `vercel.json`.
- Przejdź listę kontrolną z [test-na-telefonie.md](test-na-telefonie.md).

## 5. Własna domena (opcjonalnie)

1. Kup domenę u dowolnego rejestratora (np. OVH, home.pl, Cloudflare).
2. W Vercelu: projekt → **Settings → Domains → Add** i wpisz domenę, np. `barista.twojadomena.pl`.
3. Vercel pokaże rekord DNS do dodania u rejestratora. Zwykle jest to:
   - dla subdomeny (`barista.twojadomena.pl`): rekord **CNAME** wskazujący na adres podany przez Vercel,
   - dla domeny głównej (`twojadomena.pl`): rekord **A** z adresem IP podanym przez Vercel.

   Przepisz dokładnie te wartości, które pokazuje Vercel.
4. Po kilku minutach (czasem do kilku godzin) Vercel sam wystawi certyfikat HTTPS.

Zmiana domeny zmienia „adres” aplikacji: zainstalowana wcześniej wersja i zapisane w niej dane (Moje ziarna, cold brew) zostają pod starym adresem. Najlepiej ustawić domenę, zanim zaczniesz używać aplikacji na co dzień.

## 6. Aktualizacje

- Każdy `git push` na gałąź `main` publikuje nową wersję automatycznie.
- Push na inną gałąź tworzy **wersję podglądową** z osobnym adresem. Można ją sprawdzić na telefonie, zanim trafi do wszystkich.
- Nieudane wdrożenie nie psuje działającej wersji: Vercel podmienia ją dopiero po udanym buildzie. Starsze wersje można przywrócić w zakładce **Deployments** (Promote to Production).

### Jak nowa wersja trafia do telefonu

Aplikacja działa offline dzięki service workerowi, który trzyma jej pliki w pamięci telefonu. Po publikacji:

1. Przy następnym otwarciu aplikacja w tle sprawdza `sw.js`. Vercel nigdy go nie cache'uje (ustawienie w `vercel.json`), więc zmiana jest widoczna od razu.
2. Nowy service worker pobiera nowe pliki i od razu przejmuje aplikację.
3. Zmiany widać po ponownym otwarciu albo odświeżeniu.

Jeśli telefon uparcie pokazuje starą wersję: zamknij aplikację (także z listy ostatnich) i otwórz ją ponownie. W ostateczności usuń dane witryny w ustawieniach przeglądarki, ale to skasuje też Moje ziarna.

## Najczęstsze problemy

| Objaw | Przyczyna i rozwiązanie |
| :- | :- |
| Build na Vercelu kończy się błędem `engines` lub nie startuje | Za stara wersja Node.js. Ustaw 24.x (krok 3, punkt 5). |
| Odświeżenie podstrony daje 404 | Brak przekierowania. Sprawdź, czy `vercel.json` jest w repozytorium. |
| Na telefonie nie ma opcji „Zainstaluj” | Adres musi być `https://`. Na iPhonie instalacja jest tylko przez Safari: Udostępnij → Do ekranu początkowego. |
| Po publikacji wciąż widać starą wersję | Zamknij i otwórz aplikację (patrz wyżej). |
