-- Test wyszukiwania i filtrów Społeczności (pgTAP): kolumny liczone z treści, zapytania aplikacji
-- i zapis u siebie, który nie liczy się autorowi. Uruchomienie: `npx supabase test db`.
begin;
select plan(14);

insert into auth.users (id, email)
values
  ('11111111-1111-1111-1111-111111111111', 'ania@example.com'),
  ('22222222-2222-2222-2222-222222222222', 'ola@example.com');
update public.profiles set nick = 'Ania Łódź' where id = '11111111-1111-1111-1111-111111111111';

select is(public.search_fold('Kawa POMARAŃCZOWA, Łódź, café'), 'kawa pomaranczowa, lodz, cafe', 'tekst bez polskich znaków i akcentów, jak foldText');

set local role authenticated;
set local request.jwt.claims = '{"sub": "11111111-1111-1111-1111-111111111111", "role": "authenticated"}';
insert into public.public_drinks (author_id, source_id, drink)
values (
  '11111111-1111-1111-1111-111111111111', 'moj-kawa-abcd',
  '{"id": "moj-kawa-abcd", "name": "Kawa z miodem", "tagline": "Słodko i korzennie", "description": "Na zimowe wieczory",
    "temperature": "hot", "prepTimeMin": 8,
    "base": {"methodId": "kawiarka", "amountMl": 50, "alternativeMethodIds": ["aeropress"]},
    "extras": [{"kind": "sweetener", "ingredientId": "miod", "name": "miód", "amount": {"value": 1, "unit": "tsp"}},
               {"kind": "syrup", "syrupId": "karmelowy", "amountMl": 10}],
    "equipment": [], "layers": [{"name": "kawa", "volumeMl": 50, "color": "#2b1a10", "kind": "liquid"}],
    "steps": ["Zaparz kawę."], "serving": {"vessel": "cup", "why": "Na ciepło.", "decorations": []}}'
);

select ok((select search_text like '%kawa z miodem%slodko i korzennie%' from public.public_drinks), 'nazwa i hasło w tekście wyszukiwania');
select ok((select search_text like '%ania lodz%' and search_text like '%miod%' and search_text like '%karmelowy%' from public.public_drinks),
  'autor i składniki (nazwy i id) w tekście wyszukiwania');
select is((select method_ids from public.public_drinks), array['kawiarka', 'aeropress'], 'metody bazy: główna i alternatywne');
select is((select has_milk::text || ' / ' || has_alcohol::text from public.public_drinks), 'false / false', 'bez mleka i bez alkoholu');

-- Zapytania aplikacji: każde słowo osobno (ilike), metoda przez && z „*”.
select is((select count(*)::int from public.public_drinks where search_text ilike '%miod%' and search_text ilike '%zimowe%'), 1, 'wyszukiwanie po słowach kluczowych');
select is((select count(*)::int from public.public_drinks where method_ids && array['aeropress', '*']), 1, 'filtr metody: alternatywna');
select is((select count(*)::int from public.public_drinks where method_ids && array['chemex', '*']), 0, 'filtr metody: innej nie ma');

-- Zmiana dokumentu przelicza kolumny: każda metoda, mleko, alkohol.
update public.public_drinks set drink = drink
  || '{"base": {"methodId": "drip", "amountMl": 50, "anyMethod": true}, "milk": {"options": ["owsiane"], "amountMl": 100, "prep": "froth"}}'
  || jsonb_build_object('extras', (drink -> 'extras') || '[{"kind": "alcohol", "ingredientId": "amaretto", "name": "amaretto", "amount": {"value": 20, "unit": "ml"}}]'::jsonb);
select is((select method_ids from public.public_drinks), array['drip', '*'], 'każda metoda: gwiazdka');
select is((select count(*)::int from public.public_drinks where method_ids && array['chemex', '*']), 1, 'filtr metody: każda pasuje');
select is((select has_milk::text || ' / ' || has_alcohol::text || ' / ' || (search_text like '%owsiane%')::text from public.public_drinks),
  'true / true / true', 'mleko, alkohol i mleko w tekście wyszukiwania');

-- Przepis: nazwa, opis, autor i metoda.
insert into public.public_recipes (author_id, source_id, method_id, name, description, dose, water_temp, grind, steps)
values (
  '11111111-1111-1111-1111-111111111111', 'lokalny-1', 'prasa-francuska', 'Poranna prasa', 'Na jasne ziarna',
  '{"coffeeG": 15, "waterMl": 250}', '{"min": 92, "max": 96}', 'coarse',
  '[{"text": "Zalej {water} ml", "durationSec": 240, "action": true}]'
);
select ok((select search_text = 'poranna prasa na jasne ziarna ania lodz prasa-francuska' from public.public_recipes), 'tekst wyszukiwania przepisu');

-- Zapis u siebie: autorowi się nie liczy, innym tak.
select is(public.save_public_drink((select id from public.public_drinks)), 0, 'autor zapisuje swój napój: bez liczenia');
set local request.jwt.claims = '{"sub": "22222222-2222-2222-2222-222222222222", "role": "authenticated"}';
select is(public.save_public_drink((select id from public.public_drinks)) || ' / ' || public.save_public_recipe((select id from public.public_recipes)),
  '1 / 1', 'zapis innej osoby się liczy');

select * from finish();
rollback;
