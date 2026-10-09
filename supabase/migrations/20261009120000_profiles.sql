-- Profil użytkownika: nick (widoczny przy przepisach społeczności) i data założenia konta.
-- Każdy widzi i zmienia tylko swój profil (Row Level Security). Usunięcie użytkownika
-- z auth.users usuwa profil (on delete cascade), tak jak wszystkie przyszłe tabele z danymi.

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  nick text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  -- Dokładniejsze reguły (litery, cyfry, spacja, . _ -) sprawdza aplikacja; baza pilnuje granic.
  constraint profiles_nick_format check (
    nick is null or (char_length(nick) between 2 and 30 and nick = btrim(nick) and nick !~ '[[:cntrl:]]')
  )
);

comment on table public.profiles is 'Profil konta: nick i daty. Dane wyłącznie właściciela (RLS).';

-- Nick jest unikalny bez względu na wielkość liter.
create unique index profiles_nick_unique on public.profiles (lower(nick)) where nick is not null;

alter table public.profiles enable row level security;

create policy "Własny profil: odczyt"
  on public.profiles for select
  to authenticated
  using ((select auth.uid()) = id);

create policy "Własny profil: zmiana"
  on public.profiles for update
  to authenticated
  using ((select auth.uid()) = id)
  with check ((select auth.uid()) = id);

create policy "Własny profil: utworzenie"
  on public.profiles for insert
  to authenticated
  with check ((select auth.uid()) = id);

-- Kolumny, które użytkownik może zmieniać sam (bez id i dat).
revoke update on public.profiles from authenticated;
grant update (nick) on public.profiles to authenticated;

-- updated_at ustawia baza, nie klient.
create function public.touch_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create trigger profiles_touch_updated_at
  before update on public.profiles
  for each row execute function public.touch_updated_at();

-- Profil powstaje razem z kontem.
create function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id) values (new.id);
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
