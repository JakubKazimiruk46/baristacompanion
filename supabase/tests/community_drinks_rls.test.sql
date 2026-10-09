-- Test napojów społeczności (pgTAP): widoczność, uprawnienia, kształt dokumentu, zapisy, zgłoszenia
-- i wspólna kolejka moderatora. Uruchomienie: `npx supabase test db`.
begin;
select plan(13);

insert into auth.users (id, email)
values
  ('11111111-1111-1111-1111-111111111111', 'ania@example.com'),
  ('22222222-2222-2222-2222-222222222222', 'ola@example.com'),
  ('33333333-3333-3333-3333-333333333333', 'moderator@example.com');
update public.profiles set nick = 'Ania' where id = '11111111-1111-1111-1111-111111111111';
insert into public.moderators (user_id) values ('33333333-3333-3333-3333-333333333333');

-- Ania publikuje napój. Nazwę i temperaturę baza bierze z dokumentu.
set local role authenticated;
set local request.jwt.claims = '{"sub": "11111111-1111-1111-1111-111111111111", "role": "authenticated"}';
insert into public.public_drinks (author_id, source_id, drink)
values (
  '11111111-1111-1111-1111-111111111111', 'moj-kawa-abcd',
  '{"id": "moj-kawa-abcd", "name": "Kawa z miodem", "tagline": "Słodko", "description": "Słodko", "temperature": "hot",
    "prepTimeMin": 8, "base": {"methodId": "kawiarka", "amountMl": 50}, "extras": [], "equipment": [],
    "layers": [{"name": "kawa", "volumeMl": 50, "color": "#2b1a10", "kind": "liquid"}],
    "steps": ["Zaparz kawę."], "serving": {"vessel": "cup", "why": "Na ciepło.", "decorations": []}}'
);
select is((select author_nick || ' / ' || name || ' / ' || temperature from public.public_drinks), 'Ania / Kawa z miodem / hot', 'nick, nazwa i temperatura z bazy');

select throws_ok(
  $$ update public.public_drinks set saves_count = 1000 $$,
  '42501', null, 'liczników nie zmienia autor'
);
select throws_ok(
  $$ update public.public_drinks set name = 'Inna' $$,
  '42501', null, 'nazwy nie zmienia się poza dokumentem'
);
select throws_ok(
  $$ insert into public.public_drinks (author_id, source_id, drink)
     values ('11111111-1111-1111-1111-111111111111', 'zly', '{"name": "Bez warstw", "tagline": "x", "temperature": "hot",
       "base": {}, "extras": [], "layers": [], "steps": ["x"], "serving": {"decorations": []}}') $$,
  '23514', null, 'napój bez warstw odrzuca baza'
);

-- Ola (bez nicku) widzi napój, nie zmieni go i nie opublikuje własnego.
set local request.jwt.claims = '{"sub": "22222222-2222-2222-2222-222222222222", "role": "authenticated"}';
select is((select count(*)::int from public.public_drinks), 1, 'opublikowany napój widzi każdy zalogowany');
update public.public_drinks set drink = jsonb_set(drink, '{name}', '"Przejęta"');
select throws_ok(
  $$ insert into public.public_drinks (author_id, source_id, drink)
     select '22222222-2222-2222-2222-222222222222', 'x', drink from public.public_drinks $$,
  'P0001', null, 'bez nicku nie da się publikować'
);

select is(public.save_public_drink((select id from public.public_drinks)), 1, 'zapis u siebie liczy się');
select is(public.save_public_drink((select id from public.public_drinks)), 1, 'drugi zapis tej samej osoby się nie liczy');

-- Niezalogowany widzi opublikowany napój, ale nie może zgłaszać.
set local role anon;
set local request.jwt.claims = '{"role": "anon"}';
select is((select count(*)::int from public.public_drinks), 1, 'niezalogowany przegląda napoje');
select throws_ok(
  $$ select public.report_public_drink((select id from public.public_drinks), 'spam', null) $$,
  '42501', null, 'niezalogowany nie zgłasza'
);

-- Zgłoszenie ukrywa napój; moderator widzi go w kolejce i przywraca.
set local role authenticated;
set local request.jwt.claims = '{"sub": "22222222-2222-2222-2222-222222222222", "role": "authenticated"}';
select public.report_public_drink((select id from public.public_drinks), 'offensive', 'brzydka nazwa');
select is((select count(*)::int from public.public_drinks), 0, 'zgłoszony napój znika z listy');

set local request.jwt.claims = '{"sub": "33333333-3333-3333-3333-333333333333", "role": "authenticated"}';
select is((select kind from public.moderation_queue()), 'drink', 'zgłoszony napój jest w kolejce moderatora');
select public.moderate_public_drink((select id from public.public_drinks), 'restore');

reset role;
select is((select status || ' / ' || name from public.public_drinks), 'published / Kawa z miodem', 'przywrócony; cudzego napoju nie da się zmienić');

select * from finish();
rollback;
