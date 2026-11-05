-- Napoje społeczności: własne napoje z kreatora (warstwy, naczynie, dekoracje) opublikowane przez
-- użytkowników. Zasady jak przy przepisach (P7): widoczne od razu, zgłoszenie ukrywa do decyzji
-- moderatora, a przywrócony przez moderatora już nie znika. Napój jest dokumentem jsonb w schemacie
-- Drink z aplikacji; pełne reguły (odwołania do katalogu, objętości, kolory) sprawdza aplikacja przy
-- publikacji i jeszcze raz przy wyświetlaniu, a baza pilnuje kształtu, rozmiaru i długości tekstów.

-- ── Kształt napoju ───────────────────────────────────────────────────────
create function public.valid_drink_document(drink jsonb)
returns boolean
language sql
immutable
set search_path = ''
as $$
  select jsonb_typeof(drink) = 'object'
    and octet_length(drink::text) <= 20000
    and jsonb_typeof(drink -> 'name') = 'string' and char_length(drink ->> 'name') between 1 and 60
    and jsonb_typeof(drink -> 'tagline') = 'string' and char_length(drink ->> 'tagline') between 1 and 120
    and drink ->> 'temperature' in ('hot', 'cold')
    and jsonb_typeof(drink -> 'base') = 'object'
    and jsonb_typeof(drink -> 'extras') = 'array' and jsonb_array_length(drink -> 'extras') <= 12
    and jsonb_typeof(drink -> 'layers') = 'array' and jsonb_array_length(drink -> 'layers') between 1 and 6
    and jsonb_typeof(drink -> 'steps') = 'array' and jsonb_array_length(drink -> 'steps') between 1 and 12
    and jsonb_typeof(drink -> 'serving') = 'object'
    and jsonb_typeof(drink -> 'serving' -> 'decorations') = 'array'
    and jsonb_array_length(drink -> 'serving' -> 'decorations') <= 4;
$$;

-- ── Napoje ───────────────────────────────────────────────────────────────
create table public.public_drinks (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  author_nick text not null,
  -- Id „Mojego napoju” na urządzeniu autora: ponowna publikacja aktualizuje ten sam wiersz.
  source_id text not null,
  drink jsonb not null,
  -- Z dokumentu (ustawia trigger): do listy i filtrów bez czytania całego napoju.
  name text not null,
  temperature text not null,
  status text not null default 'published',
  approved boolean not null default false,
  saves_count integer not null default 0,
  reports_count integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (author_id, source_id),
  constraint public_drinks_status check (status in ('published', 'reported', 'hidden')),
  constraint public_drinks_source check (char_length(source_id) between 1 and 100),
  constraint public_drinks_document check (public.valid_drink_document(drink)),
  constraint public_drinks_name check (char_length(name) between 1 and 60),
  constraint public_drinks_temperature check (temperature in ('hot', 'cold'))
);

comment on table public.public_drinks is 'Napoje opublikowane przez użytkowników. Teksty zawsze jako tekst, nigdy HTML.';

create index public_drinks_new on public.public_drinks (created_at desc) where status = 'published';
create index public_drinks_popular on public.public_drinks (saves_count desc) where status = 'published';

alter table public.public_drinks enable row level security;

create policy "Napoje: odczyt opublikowanych, własnych i dla moderatora"
  on public.public_drinks for select
  to anon, authenticated
  using (status = 'published' or author_id = (select auth.uid()) or (select public.is_moderator()));

create policy "Napoje: publikacja własnych"
  on public.public_drinks for insert
  to authenticated
  with check (author_id = (select auth.uid()));

create policy "Napoje: zmiana własnych"
  on public.public_drinks for update
  to authenticated
  using (author_id = (select auth.uid()))
  with check (author_id = (select auth.uid()));

create policy "Napoje: wycofanie własnych"
  on public.public_drinks for delete
  to authenticated
  using (author_id = (select auth.uid()));

-- Autor zmienia tylko dokument napoju; nazwę, stan, liczniki i nick ustawia baza.
revoke insert, update on public.public_drinks from anon, authenticated;
grant insert (author_id, source_id, drink) on public.public_drinks to authenticated;
grant update (drink) on public.public_drinks to authenticated;

create function public.public_drinks_before_write()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  new.name := new.drink ->> 'name';
  new.temperature := new.drink ->> 'temperature';
  if tg_op = 'INSERT' then
    new.author_nick := (select nick from public.profiles where id = new.author_id);
    if new.author_nick is null then
      raise exception 'Ustaw nick, zanim opublikujesz napój' using errcode = 'P0001';
    end if;
    return new;
  end if;
  new.author_nick := coalesce((select nick from public.profiles where id = new.author_id), old.author_nick);
  if new.drink is distinct from old.drink then
    new.updated_at := now();
  end if;
  return new;
end;
$$;

create trigger public_drinks_before_write
  before insert or update on public.public_drinks
  for each row execute function public.public_drinks_before_write();

-- Limit: najwyżej 100 opublikowanych napojów na osobę.
create function public.public_drinks_limit()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if (select count(*) from public.public_drinks where author_id = new.author_id) >= 100 then
    raise exception 'Za dużo opublikowanych napojów' using errcode = '54000';
  end if;
  return new;
end;
$$;

create trigger public_drinks_limit
  before insert on public.public_drinks
  for each row execute function public.public_drinks_limit();

-- Zmiana nicku zmienia go przy opublikowanych przepisach i napojach.
create or replace function public.profiles_sync_nick()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.nick is not null and new.nick is distinct from old.nick then
    update public.public_recipes set author_nick = new.nick where author_id = new.id;
    update public.public_drinks set author_nick = new.nick where author_id = new.id;
  end if;
  return new;
end;
$$;

-- ── Zapisy u siebie i zgłoszenia ─────────────────────────────────────────
create table public.drink_saves (
  drink_id uuid not null references public.public_drinks (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (drink_id, user_id)
);

alter table public.drink_saves enable row level security;

create policy "Zapisy napojów: odczyt własnych"
  on public.drink_saves for select
  to authenticated
  using (user_id = (select auth.uid()));

create table public.drink_reports (
  id bigint generated always as identity primary key,
  drink_id uuid not null references public.public_drinks (id) on delete cascade,
  reporter_id uuid not null references auth.users (id) on delete cascade,
  reason text not null,
  comment text,
  resolved boolean not null default false,
  created_at timestamptz not null default now(),
  unique (drink_id, reporter_id),
  constraint drink_reports_reason check (reason in ('spam', 'offensive', 'dangerous', 'other')),
  constraint drink_reports_comment check (comment is null or char_length(comment) between 1 and 300)
);

alter table public.drink_reports enable row level security;

create policy "Zgłoszenia napojów: odczyt dla moderatora"
  on public.drink_reports for select
  to authenticated
  using ((select public.is_moderator()));

-- ── Funkcje dla aplikacji ────────────────────────────────────────────────

create function public.save_public_drink(p_drink_id uuid)
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  saved integer;
begin
  if (select auth.uid()) is null then
    raise exception 'Zaloguj się' using errcode = '42501';
  end if;
  insert into public.drink_saves (drink_id, user_id)
  select id, (select auth.uid()) from public.public_drinks where id = p_drink_id and status = 'published'
  on conflict do nothing;
  if found then
    update public.public_drinks set saves_count = saves_count + 1 where id = p_drink_id;
  end if;
  select saves_count into saved from public.public_drinks where id = p_drink_id;
  return saved;
end;
$$;

create function public.report_public_drink(p_drink_id uuid, p_reason text, p_comment text default null)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if (select auth.uid()) is null then
    raise exception 'Zaloguj się' using errcode = '42501';
  end if;
  insert into public.drink_reports (drink_id, reporter_id, reason, comment)
  values (p_drink_id, (select auth.uid()), p_reason, nullif(btrim(p_comment), ''))
  on conflict do nothing;
  if found then
    update public.public_drinks
      set reports_count = reports_count + 1,
          status = case when approved or status = 'hidden' then status else 'reported' end
      where id = p_drink_id;
  end if;
end;
$$;

create function public.moderate_public_drink(p_drink_id uuid, p_decision text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not (select public.is_moderator()) then
    raise exception 'Tylko dla moderatora' using errcode = '42501';
  end if;
  if p_decision = 'hide' then
    update public.public_drinks set status = 'hidden' where id = p_drink_id;
  elsif p_decision = 'restore' then
    update public.public_drinks set status = 'published', approved = true where id = p_drink_id;
  else
    raise exception 'Nieznana decyzja' using errcode = '22023';
  end if;
  update public.drink_reports set resolved = true where drink_id = p_drink_id;
end;
$$;

-- Kolejka moderatora: przepisy i napoje ukryte albo z nierozpatrzonymi zgłoszeniami.
drop function public.moderation_queue();

create function public.moderation_queue()
returns table (
  kind text,
  id uuid,
  method_id text,
  name text,
  author_nick text,
  status text,
  approved boolean,
  created_at timestamptz,
  reports jsonb
)
language sql
stable
security definer
set search_path = ''
as $$
  select 'recipe', r.id, r.method_id, r.name, r.author_nick, r.status, r.approved, r.created_at,
    coalesce(
      (select jsonb_agg(jsonb_build_object('reason', rr.reason, 'comment', rr.comment, 'createdAt', rr.created_at) order by rr.created_at)
        from public.recipe_reports rr where rr.recipe_id = r.id and not rr.resolved),
      '[]'::jsonb
    )
  from public.public_recipes r
  where (select public.is_moderator())
    and (r.status <> 'published' or exists (select 1 from public.recipe_reports rr where rr.recipe_id = r.id and not rr.resolved))
  union all
  select 'drink', d.id, null, d.name, d.author_nick, d.status, d.approved, d.created_at,
    coalesce(
      (select jsonb_agg(jsonb_build_object('reason', dr.reason, 'comment', dr.comment, 'createdAt', dr.created_at) order by dr.created_at)
        from public.drink_reports dr where dr.drink_id = d.id and not dr.resolved),
      '[]'::jsonb
    )
  from public.public_drinks d
  where (select public.is_moderator())
    and (d.status <> 'published' or exists (select 1 from public.drink_reports dr where dr.drink_id = d.id and not dr.resolved))
  order by created_at;
$$;

revoke execute on function public.save_public_drink(uuid) from public, anon;
revoke execute on function public.report_public_drink(uuid, text, text) from public, anon;
revoke execute on function public.moderate_public_drink(uuid, text) from public, anon;
revoke execute on function public.moderation_queue() from public, anon;
grant execute on function public.save_public_drink(uuid) to authenticated;
grant execute on function public.report_public_drink(uuid, text, text) to authenticated;
grant execute on function public.moderate_public_drink(uuid, text) to authenticated;
grant execute on function public.moderation_queue() to authenticated;
