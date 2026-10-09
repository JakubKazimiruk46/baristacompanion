# Backend: Supabase krok po kroku

Konto w aplikacji jest opcjonalne. Bez backendu (bez zmiennych `VITE_SUPABASE_*`) aplikacja działa jak dotąd, a ekran „Konto” mówi, że konto nie jest dostępne. Ta instrukcja prowadzi przez założenie projektu Supabase, wdrożenie bazy i funkcji oraz ustawienie logowania. Konto zakłada autor: niczego nie trzeba robić na cudzym koncie.

Co jest w repozytorium:

| Co | Gdzie |
| :- | :- |
| Konfiguracja Supabase CLI | `supabase/config.toml` |
| Tabele i reguły dostępu (RLS), po kolei | `supabase/migrations/*.sql` |
| Testy reguł dostępu (pgTAP) | `supabase/tests/*.test.sql` |
| Funkcje serwerowe (Deno) | `supabase/functions/*` (wspólne: `_shared/http.ts`) |
| Zmienne środowiskowe (opis) | `.env.example` |
| Klient w aplikacji (ładowany dopiero przy logowaniu albo zapisanej sesji) | `src/lib/supabase.ts`, `src/features/account/` |

## 1. Projekt Supabase

1. Załóż konto na [supabase.com](https://supabase.com) (najprościej przez GitHub).
2. **New project**: nazwa `barista-companion`, region **Central EU (Frankfurt)**, plan **Free**. Hasło do bazy wygeneruj i zapisz w menedżerze haseł: będzie potrzebne przy `supabase link`.
3. Poczekaj, aż projekt się uruchomi (ok. 2 minut).

Plan darmowy wstrzymuje projekt po tygodniu bez ruchu: wtedy w panelu kliknij **Restore**.

## 2. Klucze w aplikacji

1. **Project Settings → API**: skopiuj **Project URL** i klucz publiczny (**anon** albo **publishable**, zaczyna się od `sb_publishable_`).
2. Lokalnie: skopiuj `.env.example` do `.env.local` i wpisz obie wartości. `.env.local` nie trafia do repozytorium.
3. Vercel: **Project → Settings → Environment Variables** → dodaj `VITE_SUPABASE_URL` i `VITE_SUPABASE_ANON_KEY` dla **Production** i **Preview** → **Deployments → Redeploy** (zmienne wchodzą do builda).

Klucz publiczny trafia do przeglądarki z założenia: dane chroni Row Level Security w bazie. **Klucza `service_role` (secret) nigdy nie wpisuj do `.env.local`, Vercela ani repozytorium.** Funkcje serwerowe dostają go od Supabase same.

## 3. Baza i funkcje (Supabase CLI)

CLI uruchamiasz przez `npx`, bez instalacji. W folderze projektu:

```sh
npx supabase login                                  # otwiera przeglądarkę
npx supabase link --project-ref TWOJ_REF            # REF to część adresu: https://TWOJ_REF.supabase.co
npx supabase db push                                # tworzy tabele z supabase/migrations
npx supabase functions deploy delete-account        # usuwanie konta
```

Kolejne kroki planu dokładają migracje i funkcje: po pobraniu zmian powtórz `db push` i `functions deploy` dla nowych funkcji (lista w punkcie 8).

## 4. Logowanie: adresy powrotu

**Authentication → URL Configuration**:

- **Site URL**: adres produkcyjny, np. `https://barista-companion.vercel.app`
- **Redirect URLs** (każdy w osobnym wierszu):
  - `http://localhost:5173/konto`
  - `http://localhost:4173/konto`
  - `https://barista-companion.vercel.app/konto`
  - `https://*-TWOJ-ZESPOL.vercel.app/konto` (podglądy Vercela; nazwa zespołu jest w adresie podglądu)

## 5. Logowanie e-mailem: link i kod

Aplikacja wysyła jedną wiadomość z linkiem **i** kodem. Link działa w przeglądarce, a kod także w aplikacji na Androida (tam link otworzyłby przeglądarkę zamiast aplikacji).

**Authentication → Emails → Templates → Magic Link**: temat `Logowanie do Barista Companion`, treść:

```html
<h2>Logowanie do Barista Companion</h2>
<p><a href="{{ .ConfirmationURL }}">Zaloguj się jednym kliknięciem</a></p>
<p>Albo wpisz w aplikacji kod: <strong>{{ .Token }}</strong></p>
<p>Jeśli to nie Ty, zignoruj tę wiadomość.</p>
```

Ten sam tekst wstaw w szablonie **Confirm signup** (pierwsze logowanie zakłada konto).

Wbudowana poczta Supabase wysyła tylko kilka wiadomości na godzinę: wystarczy do testów. Przed udostępnieniem aplikacji innym ustaw własny serwer SMTP (**Authentication → Emails → SMTP Settings**, np. Resend albo poczta z domeny).

## 6. Logowanie przez Google

1. [Google Cloud Console](https://console.cloud.google.com) → nowy projekt `Barista Companion`.
2. **APIs & Services → OAuth consent screen**: typ **External**, nazwa aplikacji, e-mail kontaktowy, link do polityki prywatności (`https://…/prywatnosc`). Zakresy: tylko `email` i `profile`.
3. **Credentials → Create credentials → OAuth client ID** → typ **Web application** → **Authorized redirect URIs**: `https://TWOJ_REF.supabase.co/auth/v1/callback`.
4. Skopiuj **Client ID** i **Client secret** do Supabase: **Authentication → Sign In / Providers → Google** → włącz i wklej.

W aplikacji na Androida przycisk Google jest ukryty (Google blokuje logowanie w osadzonej przeglądarce): tam logowanie kodem z e-maila.

## 7. Sprawdzenie

1. Lokalnie: `npm run dev` → **Konto** → wpisz swój e-mail → kliknij link albo wpisz kod. Ustaw nick, pobierz dane konta.
2. Na podglądzie Vercela to samo, plus logowanie przez Google.
3. **Usuń konto** na koncie testowym: w panelu Supabase (**Authentication → Users** i **Table Editor → profiles**) użytkownik i profil znikają.
4. Reguły dostępu: `npx supabase start` i `npx supabase test db` (wymaga [Docker Desktop](https://www.docker.com/products/docker-desktop/)).

Przed udostępnieniem aplikacji uzupełnij w polityce prywatności (`src/pages/PrivacyPage.tsx`) miejsca oznaczone „do uzupełnienia”: administratora danych, kontakt, region, okresy przechowywania (pytanie P6 w planie).

## 8. Funkcje serwerowe i sekrety

| Funkcja | Co robi | Sekrety (`npx supabase secrets set …`) |
| :- | :- | :- |
| `delete-account` | usuwa użytkownika i wszystkie jego dane | brak (Supabase daje `SUPABASE_URL` i `SUPABASE_SERVICE_ROLE_KEY` sam) |
| `scan-label` | odczyt etykiety ziaren przez Claude (zdjęcie → pola formularza), dzienny limit | `ANTHROPIC_API_KEY`; opcjonalnie `AI_DAILY_LABEL_SCANS` (domyślnie 20) |

Migracje po kolei (`npx supabase db push` wgrywa brakujące):

| Migracja | Co dodaje |
| :- | :- |
| `20261009120000_profiles.sql` | profil (nick), RLS, profil zakładany z kontem |
| `20261009130000_user_data.sql` | synchronizacja: tabela `user_data` (rekord na wiersz, RLS tylko dla właściciela, limit 20 000 wierszy) i funkcja `sync_push` (zapisuje tylko nowsze wersje) |
| `20261009150000_ai_usage.sql` | dzienne liczniki AI (`ai_usage`) i funkcje `consume_ai_quota` / `release_ai_quota` (tylko dla funkcji serwerowych) |
| `20261009140000_community_recipes.sql` | przepisy społeczności: `public_recipes` (ograniczenia długości i kroków, RLS), zapisy, zgłoszenia, moderatorzy i funkcje do zapisu, zgłoszeń i moderacji |

## 9. AI: klucz Claude i limity kosztów

1. Załóż konto na [platform.claude.com](https://platform.claude.com) i utwórz klucz API (**API Keys → Create Key**). Klucza nie wpisuj do aplikacji ani do repozytorium.
2. Ustaw go jako sekret funkcji i wdroż funkcję:

   ```sh
   npx supabase secrets set ANTHROPIC_API_KEY=sk-ant-...
   npx supabase functions deploy scan-label
   ```

3. W konsoli Anthropic ustaw **miesięczny limit wydatków** (**Settings → Limits → Spend limit**). To twarda granica kosztów niezależna od limitów w aplikacji.
4. Dzienne limity na użytkownika (decyzja P8): 20 skanów etykiet (zmiana: `npx supabase secrets set AI_DAILY_LABEL_SCANS=30`). Nieudana próba (błąd, odmowa modelu) nie zjada limitu.

Model: `claude-opus-5-5` (aktualny model domyślny), odpowiedź w formacie JSON wymuszonym schematem (structured outputs), niski poziom wysiłku (`effort: "low"`), bo odczyt etykiety to prosta ekstrakcja. Szacunkowy koszt jednego skanu: zdjęcie 1600 px to ok. 2,5–3 tys. tokenów wejścia, razem z instrukcją ok. 3,5 tys. tokenów (ok. 0,014 USD przy 4 USD za milion), plus kilkaset tokenów wyjścia (ok. 0,01 USD przy 20 USD za milion): razem ok. 0,02–0,03 USD. Przy limicie 20 skanów dziennie to najwyżej ok. 0,5 USD na osobę dziennie. Sprawdź prawdziwe zużycie w logach funkcji (liczba tokenów) i w konsoli Anthropic.

## 10. Moderator przepisów społeczności

Zgłoszony przepis znika z listy do decyzji moderatora (decyzja P7). Żeby zostać moderatorem, zaloguj się raz w aplikacji, a potem w panelu Supabase: **Authentication → Users** skopiuj swoje **UID** i w **SQL Editor** uruchom:

```sql
insert into public.moderators (user_id) values ('TWOJE-UID');
```

Na ekranie konta pojawi się wtedy „Moderacja przepisów społeczności” (`/moderacja`): lista zgłoszonych i ukrytych przepisów z powodami zgłoszeń oraz przyciski „Ukryj” i „Przywróć”. Przywrócony przepis po kolejnych zgłoszeniach już nie znika, tylko wraca do kolejki.

Logi funkcji: **Edge Functions → nazwa → Logs**. Funkcje nie zapisują w logach adresów e-mail ani treści od użytkowników.
