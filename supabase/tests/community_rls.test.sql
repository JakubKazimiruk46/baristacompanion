-- Test przepisów społeczności (pgTAP): widoczność, uprawnienia, zgłoszenia i moderacja.
-- Uruchomienie: `npx supabase test db`.
begin;
select plan(16);

insert into auth.users (id, email)
values
  ('11111111-1111-1111-1111-111111111111', 'ania@example.com'),
  ('22222222-2222-2222-2222-222222222222', 'ola@example.com'),
  ('33333333-3333-3333-3333-333333333333', 'moderator@example.com');
update public.profiles set nick = 'Ania' where id = '11111111-1111-1111-1111-111111111111';
insert into public.moderators (user_id) values ('33333333-3333-3333-3333-333333333333');

-- Ania publikuje przepis.
set local role authenticated;
set local request.jwt.claims = '{"sub": "11111111-1111-1111-1111-111111111111", "role": "authenticated"}';
insert into public.public_recipes (author_id, source_id, method_id, name, dose, water_temp, grind, steps)
values (
  '11111111-1111-1111-1111-111111111111', 'lokalny-1', 'drip', 'Poranny V60',
  '{"coffeeG": 15, "waterMl": 250}', '{"min": 92, "max": 96}', 'medium-fine',
  '[{"text": "Zalej {water} ml", "durationSec": 30, "action": true}]'
);
select is((select author_nick from public.public_recipes), 'Ania', 'nick autora z profilu');

select throws_ok(
  $$ update public.public_recipes set saves_count = 1000 $$,
  '42501', null, 'liczników nie zmienia autor'
);
select throws_ok(
  $$ insert into public.public_recipes (author_id, source_id, method_id, name, dose, water_temp, grind, steps)
     values ('11111111-1111-1111-1111-111111111111', 'zly', 'drip', 'Zły', '{"coffeeG": 15, "waterMl": 250}',
             '{"min": 92, "max": 96}', 'medium-fine', '[]') $$,
  '23514', null, 'przepis bez kroków odrzuca baza'
);

-- Ponowna publikacja: aplikacja robi insert, a przy duplikacie (23505) zmienia samą treść. Upsert z PostgREST
-- (ON CONFLICT DO UPDATE SET author_id, source_id, …) baza odrzuca, bo autor zmienia tylko treść.
select throws_ok(
  $$ insert into public.public_recipes (author_id, source_id, method_id, name, dose, water_temp, grind, steps)
     select author_id, source_id, method_id, name, dose, water_temp, grind, steps from public.public_recipes
     on conflict (author_id, source_id) do update
       set author_id = excluded.author_id, source_id = excluded.source_id, name = excluded.name $$,
  '42501', null, 'upsert odrzuca baza (dlatego aplikacja go nie używa)'
);
select throws_ok(
  $$ insert into public.public_recipes (author_id, source_id, method_id, name, dose, water_temp, grind, steps)
     select author_id, source_id, method_id, name, dose, water_temp, grind, steps from public.public_recipes $$,
  '23505', null, 'ponowna publikacja tego samego przepisu to duplikat'
);
update public.public_recipes set description = 'Na jasne ziarna';
select is((select description from public.public_recipes), 'Na jasne ziarna', 'autor aktualizuje treść');

-- Ola (bez nicku) widzi przepis, nie może go zmienić ani opublikować własnego.
set local request.jwt.claims = '{"sub": "22222222-2222-2222-2222-222222222222", "role": "authenticated"}';
select is((select count(*)::int from public.public_recipes), 1, 'opublikowany przepis widzi każdy zalogowany');
update public.public_recipes set name = 'Przejęte';
select throws_ok(
  $$ insert into public.public_recipes (author_id, source_id, method_id, name, dose, water_temp, grind, steps)
     values ('22222222-2222-2222-2222-222222222222', 'x', 'drip', 'Bez nicku', '{"coffeeG": 15, "waterMl": 250}',
             '{"min": 92, "max": 96}', 'medium-fine', '[{"text": "Zalej", "action": true}]') $$,
  'P0001', null, 'bez nicku nie da się publikować'
);

-- Zapis liczy się raz na osobę.
select is(public.save_public_recipe((select id from public.public_recipes)), 1, 'zapis u siebie liczy się');
select is(public.save_public_recipe((select id from public.public_recipes)), 1, 'drugi zapis tej samej osoby się nie liczy');

-- Zgłoszenie ukrywa przepis do decyzji moderatora.
select public.report_public_recipe((select id from public.public_recipes where name = 'Poranny V60'), 'spam', null);
select is((select count(*)::int from public.public_recipes), 0, 'zgłoszony przepis znika z listy');
select is((select count(*)::int from public.recipe_reports), 0, 'zgłoszenia widzi tylko moderator');

-- Niezalogowany widzi tylko opublikowane.
set local role anon;
set local request.jwt.claims = '{"role": "anon"}';
select is((select count(*)::int from public.public_recipes), 0, 'niezalogowany nie widzi ukrytego');

-- Moderator przywraca: przepis wraca i kolejne zgłoszenia już go nie ukrywają.
set local role authenticated;
set local request.jwt.claims = '{"sub": "33333333-3333-3333-3333-333333333333", "role": "authenticated"}';
select is((select count(*)::int from public.moderation_queue()), 1, 'zgłoszony przepis jest w kolejce moderatora');
select public.moderate_public_recipe((select id from public.public_recipes), 'restore');
select public.report_public_recipe((select id from public.public_recipes), 'other', 'drugi raz');
select is((select status from public.public_recipes), 'published', 'przywrócony nie znika po kolejnym zgłoszeniu');

reset role;
select is((select name from public.public_recipes), 'Poranny V60', 'cudzego przepisu nie da się zmienić');

select * from finish();
rollback;
