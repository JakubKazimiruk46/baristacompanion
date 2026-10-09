-- Dzienne limity funkcji AI na użytkownika (decyzja P8): licznik na dzień (czas polski) i rodzaj.
-- Liczniki zmieniają tylko funkcje serwerowe (klucz service_role); użytkownik może swoje odczytać.

create table public.ai_usage (
  user_id uuid not null references auth.users (id) on delete cascade,
  day date not null,
  kind text not null,
  count integer not null default 0,
  primary key (user_id, day, kind),
  constraint ai_usage_kind check (kind in ('label_scan', 'drink_assistant')),
  constraint ai_usage_count check (count >= 0)
);

comment on table public.ai_usage is 'Ile razy dziś użyto funkcji AI (limit dzienny).';

alter table public.ai_usage enable row level security;

create policy "Własne liczniki AI: odczyt"
  on public.ai_usage for select
  to authenticated
  using (user_id = (select auth.uid()));

-- Zużywa jedno użycie, jeśli limit na dziś jeszcze pozwala. Zwraca, ile zostało (-1: limit wyczerpany).
create function public.consume_ai_quota(p_user uuid, p_kind text, p_limit integer)
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  today date := (now() at time zone 'Europe/Warsaw')::date;
  used integer;
begin
  insert into public.ai_usage (user_id, day, kind, count)
  values (p_user, today, p_kind, 1)
  on conflict (user_id, day, kind) do update
    set count = public.ai_usage.count + 1
    where public.ai_usage.count < p_limit
  returning count into used;
  if used is null then
    return -1;
  end if;
  return p_limit - used;
end;
$$;

-- Oddaje użycie, gdy AI nie odpowiedziało (błąd, odmowa): nieudana próba nie zjada limitu.
create function public.release_ai_quota(p_user uuid, p_kind text)
returns void
language sql
security definer
set search_path = ''
as $$
  update public.ai_usage
    set count = greatest(count - 1, 0)
    where user_id = p_user and day = (now() at time zone 'Europe/Warsaw')::date and kind = p_kind;
$$;

revoke execute on function public.consume_ai_quota(uuid, text, integer) from public, anon, authenticated;
revoke execute on function public.release_ai_quota(uuid, text) from public, anon, authenticated;
grant execute on function public.consume_ai_quota(uuid, text, integer) to service_role;
grant execute on function public.release_ai_quota(uuid, text) to service_role;
