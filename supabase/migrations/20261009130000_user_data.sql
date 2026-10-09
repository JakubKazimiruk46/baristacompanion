-- Dane użytkownika do synchronizacji między urządzeniami: jeden wiersz na rekord kolekcji
-- (ziarna, dziennik, ulubione, półka, lista zakupów, ilości, młynki, własne przepisy).
-- Dla każdego rekordu wygrywa nowsza zmiana (updated_at), a usunięcie to wiersz z deleted = true.
-- Tylko właściciel widzi i zmienia swoje wiersze (RLS); usunięcie konta usuwa wszystko.

create table public.user_data (
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  collection text not null,
  record_id text not null,
  payload jsonb,
  -- Czas zmiany z urządzenia: według niego wygrywa nowsza wersja.
  updated_at timestamptz not null,
  deleted boolean not null default false,
  -- Czas zapisu na serwerze: według niego urządzenia pobierają zmiany od ostatniej synchronizacji.
  synced_at timestamptz not null default clock_timestamp(),
  primary key (user_id, collection, record_id),
  constraint user_data_collection check (
    collection in ('beans', 'journal', 'favorites', 'shelf', 'shopping', 'doses', 'grinders', 'recipes', 'drinks')
  ),
  constraint user_data_record_id check (char_length(record_id) between 1 and 100),
  constraint user_data_payload check ((deleted and payload is null) or (not deleted and payload is not null)),
  constraint user_data_payload_size check (payload is null or octet_length(payload::text) <= 65536)
);

comment on table public.user_data is 'Synchronizowane dane z aplikacji. Wyłącznie właściciela (RLS).';

create index user_data_synced on public.user_data (user_id, synced_at);

alter table public.user_data enable row level security;

create policy "Własne dane: odczyt"
  on public.user_data for select
  to authenticated
  using ((select auth.uid()) = user_id);

create policy "Własne dane: dodanie"
  on public.user_data for insert
  to authenticated
  with check ((select auth.uid()) = user_id);

create policy "Własne dane: zmiana"
  on public.user_data for update
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "Własne dane: usunięcie"
  on public.user_data for delete
  to authenticated
  using ((select auth.uid()) = user_id);

-- synced_at ustawia baza przy każdym zapisie: urządzenie nie może go podać.
create function public.user_data_touch()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.synced_at := clock_timestamp();
  return new;
end;
$$;

create trigger user_data_touch
  before insert or update on public.user_data
  for each row execute function public.user_data_touch();

-- Limit na użytkownika: zapis nie rośnie bez końca.
create function public.user_data_limit()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if (select count(*) from public.user_data where user_id = new.user_id) >= 20000 then
    raise exception 'Za dużo danych na koncie' using errcode = '54000';
  end if;
  return new;
end;
$$;

create trigger user_data_limit
  before insert on public.user_data
  for each row execute function public.user_data_limit();

-- Wysyłka zmian z urządzenia: zapisuje rekord tylko wtedy, gdy jest nowszy (albo równy) od
-- wersji w bazie. Działa z uprawnieniami użytkownika (security invoker), więc obowiązuje RLS.
create function public.sync_push(records jsonb)
returns setof public.user_data
language sql
security invoker
set search_path = ''
as $$
  insert into public.user_data as current (user_id, collection, record_id, payload, updated_at, deleted)
  select (select auth.uid()), r.collection, r.record_id, case when r.deleted then null else r.payload end, r.updated_at, r.deleted
  from jsonb_to_recordset(records) as r(collection text, record_id text, payload jsonb, updated_at timestamptz, deleted boolean)
  on conflict (user_id, collection, record_id) do update
    set payload = excluded.payload,
        updated_at = excluded.updated_at,
        deleted = excluded.deleted
    where excluded.updated_at >= current.updated_at
  returning *;
$$;

revoke execute on function public.sync_push(jsonb) from public, anon;
grant execute on function public.sync_push(jsonb) to authenticated;
