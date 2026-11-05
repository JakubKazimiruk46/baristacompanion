-- Test kolekcji synchronizacji (pgTAP): nowe kolekcje przechodzą, nieznane odrzuca baza.
-- Uruchomienie: `npx supabase test db` (albo lokalnie na PGlite: `npm test`).
begin;
select plan(3);

insert into auth.users (id, email) values ('11111111-1111-1111-1111-111111111111', 'ania@example.com');

set local role authenticated;
set local request.jwt.claims = '{"sub": "11111111-1111-1111-1111-111111111111", "role": "authenticated"}';

select lives_ok(
  $$ select public.sync_push('[{"collection": "wishlist", "record_id": "mocha", "payload": true,
       "updated_at": "2026-10-10T10:00:00Z", "deleted": false}]'::jsonb) $$,
  'lista „Do spróbowania” synchronizuje się'
);
select lives_ok(
  $$ select public.sync_push('[{"collection": "method-favorites", "record_id": "chemex", "payload": true,
       "updated_at": "2026-10-10T10:00:00Z", "deleted": false}]'::jsonb) $$,
  'ulubione metody synchronizują się'
);
select throws_ok(
  $$ select public.sync_push('[{"collection": "nieznana", "record_id": "x", "payload": true,
       "updated_at": "2026-10-10T10:00:00Z", "deleted": false}]'::jsonb) $$,
  '23514', null, 'nieznanej kolekcji baza nie przyjmuje'
);

select * from finish();
rollback;
