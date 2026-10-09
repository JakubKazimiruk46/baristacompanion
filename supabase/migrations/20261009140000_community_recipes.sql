-- Przepisy społeczności: opublikowane własne przepisy, zapisy u siebie i zgłoszenia.
-- Decyzja P7: przepis jest widoczny od razu, a zgłoszenie ukrywa go do decyzji moderatora.
-- Przepis przywrócony przez moderatora (approved) zgłoszenia już nie ukrywają, tylko trafiają do kolejki.

-- ── Moderatorzy ──────────────────────────────────────────────────────────
-- Dodaje się ich w panelu Supabase (SQL Editor): insert into public.moderators (user_id) values ('…');
create table public.moderators (
  user_id uuid primary key references auth.users (id) on delete cascade,
  created_at timestamptz not null default now()
);
-- Bez reguł RLS: tabelę czytają tylko funkcje security definer.
alter table public.moderators enable row level security;

create function public.is_moderator()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (select 1 from public.moderators where user_id = (select auth.uid()));
$$;

revoke execute on function public.is_moderator() from public, anon;
grant execute on function public.is_moderator() to authenticated;

-- ── Kroki przepisu: te same granice co w aplikacji (RECIPE_LIMITS) ─────────
create function public.valid_recipe_steps(steps jsonb)
returns boolean
language sql
immutable
set search_path = ''
as $$
  select jsonb_typeof(steps) = 'array'
    and jsonb_array_length(steps) between 1 and 20
    and not exists (
      select 1
      from jsonb_array_elements(steps) as step
      where jsonb_typeof(step) <> 'object'
        or jsonb_typeof(step -> 'text') is distinct from 'string'
        or char_length(step ->> 'text') not between 1 and 120
        or (step ? 'detail' and (jsonb_typeof(step -> 'detail') <> 'string' or char_length(step ->> 'detail') > 400))
        or (step ? 'durationSec' and (
          jsonb_typeof(step -> 'durationSec') <> 'number'
          or (step ->> 'durationSec')::numeric not between 1 and 86400
          or (step ->> 'durationSec')::numeric <> floor((step ->> 'durationSec')::numeric)
        ))
        or jsonb_typeof(step -> 'action') is distinct from 'boolean'
    );
$$;

-- ── Przepisy ─────────────────────────────────────────────────────────────
create table public.public_recipes (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  -- Nick autora w chwili publikacji (aktualizuje go zmiana nicku w profilu).
  author_nick text not null,
  -- Id przepisu na urządzeniu autora: ponowna publikacja aktualizuje ten sam wiersz.
  source_id text not null,
  method_id text not null,
  name text not null,
  description text,
  dose jsonb not null,
  water_temp jsonb not null,
  grind text not null,
  steps jsonb not null,
  status text not null default 'published',
  approved boolean not null default false,
  saves_count integer not null default 0,
  reports_count integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (author_id, source_id),
  constraint public_recipes_status check (status in ('published', 'reported', 'hidden')),
  constraint public_recipes_source check (char_length(source_id) between 1 and 100),
  constraint public_recipes_method check (method_id ~ '^[a-z0-9]+(-[a-z0-9]+)*$' and char_length(method_id) <= 40),
  constraint public_recipes_name check (char_length(name) between 1 and 60),
  constraint public_recipes_description check (description is null or char_length(description) between 1 and 500),
  constraint public_recipes_grind check (grind in ('extra-fine', 'fine', 'medium-fine', 'medium', 'medium-coarse', 'coarse')),
  constraint public_recipes_steps check (public.valid_recipe_steps(steps)),
  constraint public_recipes_dose check (
    jsonb_typeof(dose -> 'coffeeG') = 'number' and jsonb_typeof(dose -> 'waterMl') = 'number'
    and (dose ->> 'coffeeG')::numeric between 1 and 250
    and (dose ->> 'waterMl')::numeric between 10 and 5000
  ),
  constraint public_recipes_water_temp check (
    jsonb_typeof(water_temp -> 'min') = 'number' and jsonb_typeof(water_temp -> 'max') = 'number'
    and (water_temp ->> 'min')::numeric between 0 and 100
    and (water_temp ->> 'max')::numeric between 0 and 100
    and (water_temp ->> 'min')::numeric <= (water_temp ->> 'max')::numeric
  )
);

comment on table public.public_recipes is 'Przepisy opublikowane przez użytkowników. Teksty zawsze jako tekst, nigdy HTML.';

create index public_recipes_method_new on public.public_recipes (method_id, created_at desc) where status = 'published';
create index public_recipes_method_popular on public.public_recipes (method_id, saves_count desc) where status = 'published';

alter table public.public_recipes enable row level security;

create policy "Przepisy: odczyt opublikowanych, własnych i dla moderatora"
  on public.public_recipes for select
  to anon, authenticated
  using (status = 'published' or author_id = (select auth.uid()) or (select public.is_moderator()));

create policy "Przepisy: publikacja własnych"
  on public.public_recipes for insert
  to authenticated
  with check (author_id = (select auth.uid()));

create policy "Przepisy: zmiana własnych"
  on public.public_recipes for update
  to authenticated
  using (author_id = (select auth.uid()))
  with check (author_id = (select auth.uid()));

create policy "Przepisy: wycofanie własnych"
  on public.public_recipes for delete
  to authenticated
  using (author_id = (select auth.uid()));

-- Autor zmienia tylko treść; stan, liczniki i nick ustawia baza.
revoke insert, update on public.public_recipes from anon, authenticated;
grant insert (author_id, source_id, method_id, name, description, dose, water_temp, grind, steps)
  on public.public_recipes to authenticated;
grant update (method_id, name, description, dose, water_temp, grind, steps) on public.public_recipes to authenticated;

-- Nick z profilu (bez nicku nie da się publikować) i data zmiany treści.
create function public.public_recipes_before_write()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if tg_op = 'INSERT' then
    new.author_nick := (select nick from public.profiles where id = new.author_id);
    if new.author_nick is null then
      raise exception 'Ustaw nick, zanim opublikujesz przepis' using errcode = 'P0001';
    end if;
    return new;
  end if;
  new.author_nick := coalesce((select nick from public.profiles where id = new.author_id), old.author_nick);
  if (new.method_id, new.name, new.description, new.dose, new.water_temp, new.grind, new.steps)
    is distinct from (old.method_id, old.name, old.description, old.dose, old.water_temp, old.grind, old.steps) then
    new.updated_at := now();
  end if;
  return new;
end;
$$;

create trigger public_recipes_before_write
  before insert or update on public.public_recipes
  for each row execute function public.public_recipes_before_write();

-- Limit: najwyżej 100 opublikowanych przepisów na osobę.
create function public.public_recipes_limit()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if (select count(*) from public.public_recipes where author_id = new.author_id) >= 100 then
    raise exception 'Za dużo opublikowanych przepisów' using errcode = '54000';
  end if;
  return new;
end;
$$;

create trigger public_recipes_limit
  before insert on public.public_recipes
  for each row execute function public.public_recipes_limit();

-- Zmiana nicku zmienia go przy opublikowanych przepisach.
create function public.profiles_sync_nick()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.nick is not null and new.nick is distinct from old.nick then
    update public.public_recipes set author_nick = new.nick where author_id = new.id;
  end if;
  return new;
end;
$$;

create trigger profiles_sync_nick
  after update of nick on public.profiles
  for each row execute function public.profiles_sync_nick();

-- ── Zapisy u siebie ──────────────────────────────────────────────────────
create table public.recipe_saves (
  recipe_id uuid not null references public.public_recipes (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (recipe_id, user_id)
);

alter table public.recipe_saves enable row level security;

create policy "Zapisy: odczyt własnych"
  on public.recipe_saves for select
  to authenticated
  using (user_id = (select auth.uid()));

-- ── Zgłoszenia ───────────────────────────────────────────────────────────
create table public.recipe_reports (
  id bigint generated always as identity primary key,
  recipe_id uuid not null references public.public_recipes (id) on delete cascade,
  reporter_id uuid not null references auth.users (id) on delete cascade,
  reason text not null,
  comment text,
  resolved boolean not null default false,
  created_at timestamptz not null default now(),
  unique (recipe_id, reporter_id),
  constraint recipe_reports_reason check (reason in ('spam', 'offensive', 'dangerous', 'other')),
  constraint recipe_reports_comment check (comment is null or char_length(comment) between 1 and 300)
);

alter table public.recipe_reports enable row level security;

create policy "Zgłoszenia: odczyt dla moderatora"
  on public.recipe_reports for select
  to authenticated
  using ((select public.is_moderator()));

-- ── Funkcje dla aplikacji ────────────────────────────────────────────────

-- „Zapisz u siebie”: liczy zapis raz na osobę i zwraca liczbę zapisów.
create function public.save_public_recipe(p_recipe_id uuid)
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
  insert into public.recipe_saves (recipe_id, user_id)
  select id, (select auth.uid()) from public.public_recipes where id = p_recipe_id and status = 'published'
  on conflict do nothing;
  if found then
    update public.public_recipes set saves_count = saves_count + 1 where id = p_recipe_id;
  end if;
  select saves_count into saved from public.public_recipes where id = p_recipe_id;
  return saved;
end;
$$;

-- „Zgłoś”: raz na osobę. Przepis, którego moderator jeszcze nie przywrócił, znika do decyzji.
create function public.report_public_recipe(p_recipe_id uuid, p_reason text, p_comment text default null)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if (select auth.uid()) is null then
    raise exception 'Zaloguj się' using errcode = '42501';
  end if;
  insert into public.recipe_reports (recipe_id, reporter_id, reason, comment)
  values (p_recipe_id, (select auth.uid()), p_reason, nullif(btrim(p_comment), ''))
  on conflict do nothing;
  if found then
    update public.public_recipes
      set reports_count = reports_count + 1,
          status = case when approved or status = 'hidden' then status else 'reported' end
      where id = p_recipe_id;
  end if;
end;
$$;

-- Kolejka moderatora: przepisy ukryte i te z nierozpatrzonymi zgłoszeniami.
create function public.moderation_queue()
returns table (
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
  select r.id, r.method_id, r.name, r.author_nick, r.status, r.approved, r.created_at,
    coalesce(
      (select jsonb_agg(jsonb_build_object('reason', rr.reason, 'comment', rr.comment, 'createdAt', rr.created_at) order by rr.created_at)
        from public.recipe_reports rr where rr.recipe_id = r.id and not rr.resolved),
      '[]'::jsonb
    )
  from public.public_recipes r
  where (select public.is_moderator())
    and (r.status <> 'published' or exists (select 1 from public.recipe_reports rr where rr.recipe_id = r.id and not rr.resolved))
  order by r.created_at;
$$;

-- Decyzja moderatora: ukryj albo przywróć (przywrócony nie znika już po zgłoszeniu).
create function public.moderate_public_recipe(p_recipe_id uuid, p_decision text)
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
    update public.public_recipes set status = 'hidden' where id = p_recipe_id;
  elsif p_decision = 'restore' then
    update public.public_recipes set status = 'published', approved = true where id = p_recipe_id;
  else
    raise exception 'Nieznana decyzja' using errcode = '22023';
  end if;
  update public.recipe_reports set resolved = true where recipe_id = p_recipe_id;
end;
$$;

revoke execute on function public.save_public_recipe(uuid) from public, anon;
revoke execute on function public.report_public_recipe(uuid, text, text) from public, anon;
revoke execute on function public.moderation_queue() from public, anon;
revoke execute on function public.moderate_public_recipe(uuid, text) from public, anon;
grant execute on function public.save_public_recipe(uuid) to authenticated;
grant execute on function public.report_public_recipe(uuid, text, text) to authenticated;
grant execute on function public.moderation_queue() to authenticated;
grant execute on function public.moderate_public_recipe(uuid, text) to authenticated;
