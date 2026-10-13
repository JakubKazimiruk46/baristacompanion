-- Społeczność: wyszukiwanie i filtry na serwerze (lista wczytuje się stronami, więc filtr w przeglądarce
-- gubiłby wyniki z dalszych stron) oraz zapis u siebie, który nie liczy się autorowi.
-- Kolumny wyszukiwania ustawia trigger z treści; autor ich nie zmienia (brak grant na te kolumny).

-- Tekst do wyszukiwania jak foldText w aplikacji (src/lib/format.ts): małe litery, bez polskich znaków
-- i akcentów. Ł nie rozkłada się w NFD, więc idzie przez translate; lower na końcu działa na ASCII
-- przy każdej kolacji.
create function public.search_fold(value text)
returns text
language sql
immutable
set search_path = ''
as $$
  select lower(regexp_replace(normalize(translate(coalesce(value, ''), 'Łł', 'Ll'), NFD), '[̀-ͯ]', '', 'g'));
$$;

-- ── Napoje ───────────────────────────────────────────────────────────────

alter table public.public_drinks
  add column search_text text not null default '',
  -- Metody bazy: główna i alternatywne; „*” = każda metoda (base.anyMethod). Filtr: method_ids && {metoda,*}.
  add column method_ids text[] not null default '{}',
  -- Jak hasMilk() w aplikacji: mleko albo śmietanka czy lody w dodatkach.
  add column has_milk boolean not null default false,
  -- Jak hasAlcohol() w aplikacji: dodatek kind „alcohol”.
  add column has_alcohol boolean not null default false;

-- Lista dodatków z dokumentu (pusta, gdy dokument jej nie ma).
create function public.drink_extras(drink jsonb)
returns setof jsonb
language sql
immutable
set search_path = ''
as $$
  select value from jsonb_array_elements(case when jsonb_typeof(drink -> 'extras') = 'array' then drink -> 'extras' else '[]'::jsonb end);
$$;

create or replace function public.public_drinks_before_write()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  base jsonb := new.drink -> 'base';
begin
  new.name := new.drink ->> 'name';
  new.temperature := new.drink ->> 'temperature';
  if tg_op = 'INSERT' then
    new.author_nick := (select nick from public.profiles where id = new.author_id);
    if new.author_nick is null then
      raise exception 'Ustaw nick, zanim opublikujesz napój' using errcode = 'P0001';
    end if;
  else
    new.author_nick := coalesce((select nick from public.profiles where id = new.author_id), old.author_nick);
    if new.drink is distinct from old.drink then
      new.updated_at := now();
    end if;
  end if;

  -- Nazwa, hasło, opis, autor, składniki (nazwy i id) i mleka (id).
  new.search_text := public.search_fold(concat_ws(' ',
    new.name,
    new.drink ->> 'tagline',
    new.drink ->> 'description',
    new.author_nick,
    (select string_agg(concat_ws(' ', extra ->> 'name', extra ->> 'ingredientId', extra ->> 'syrupId'), ' ')
       from public.drink_extras(new.drink) as extra),
    (select string_agg(value, ' ') from jsonb_array_elements_text(
       case when jsonb_typeof(new.drink -> 'milk' -> 'options') = 'array' then new.drink -> 'milk' -> 'options' else '[]'::jsonb end))
  ));
  new.method_ids := array_remove(
    array[base ->> 'methodId']
      || case when base ->> 'anyMethod' = 'true' then array['*']
              else coalesce((select array_agg(value) from jsonb_array_elements_text(
                     case when jsonb_typeof(base -> 'alternativeMethodIds') = 'array' then base -> 'alternativeMethodIds' else '[]'::jsonb end)), '{}')
         end,
    null);
  new.has_milk := coalesce(jsonb_typeof(new.drink -> 'milk') = 'object', false)
    or exists (select 1 from public.drink_extras(new.drink) as extra where extra ->> 'kind' in ('cream', 'ice-cream'));
  new.has_alcohol := exists (select 1 from public.drink_extras(new.drink) as extra where extra ->> 'kind' = 'alcohol');
  return new;
end;
$$;

-- Już opublikowane napoje: przeliczenie przez trigger (dokument się nie zmienia, więc updated_at też nie).
update public.public_drinks set drink = drink;

-- ── Przepisy ─────────────────────────────────────────────────────────────

alter table public.public_recipes add column search_text text not null default '';

create or replace function public.public_recipes_before_write()
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
  else
    new.author_nick := coalesce((select nick from public.profiles where id = new.author_id), old.author_nick);
    if (new.method_id, new.name, new.description, new.dose, new.water_temp, new.grind, new.steps)
      is distinct from (old.method_id, old.name, old.description, old.dose, old.water_temp, old.grind, old.steps) then
      new.updated_at := now();
    end if;
  end if;
  -- Nazwa, opis, autor i metoda (id).
  new.search_text := public.search_fold(concat_ws(' ', new.name, new.description, new.author_nick, new.method_id));
  return new;
end;
$$;

update public.public_recipes set name = name;

-- ── Zapis u siebie: autorowi się nie liczy ───────────────────────────────

create or replace function public.save_public_drink(p_drink_id uuid)
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
  select id, (select auth.uid()) from public.public_drinks
  where id = p_drink_id and status = 'published' and author_id <> (select auth.uid())
  on conflict do nothing;
  if found then
    update public.public_drinks set saves_count = saves_count + 1 where id = p_drink_id;
  end if;
  select saves_count into saved from public.public_drinks where id = p_drink_id;
  return saved;
end;
$$;

create or replace function public.save_public_recipe(p_recipe_id uuid)
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
  select id, (select auth.uid()) from public.public_recipes
  where id = p_recipe_id and status = 'published' and author_id <> (select auth.uid())
  on conflict do nothing;
  if found then
    update public.public_recipes set saves_count = saves_count + 1 where id = p_recipe_id;
  end if;
  select saves_count into saved from public.public_recipes where id = p_recipe_id;
  return saved;
end;
$$;

-- Zapisy autorów sprzed tej migracji: usunięte, a liczniki policzone od nowa z tabel zapisów.
delete from public.drink_saves s using public.public_drinks d where s.drink_id = d.id and s.user_id = d.author_id;
update public.public_drinks d set saves_count = (select count(*) from public.drink_saves s where s.drink_id = d.id);
delete from public.recipe_saves s using public.public_recipes r where s.recipe_id = r.id and s.user_id = r.author_id;
update public.public_recipes r set saves_count = (select count(*) from public.recipe_saves s where s.recipe_id = r.id);
