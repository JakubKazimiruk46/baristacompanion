-- Test synchronizowanych danych (pgTAP): RLS nie pozwala czytać ani zmieniać cudzych danych,
-- a sync_push zapisuje tylko nowsze wersje. Uruchomienie: `npx supabase test db`.
begin;
select plan(9);

insert into auth.users (id, email)
values
  ('11111111-1111-1111-1111-111111111111', 'ania@example.com'),
  ('22222222-2222-2222-2222-222222222222', 'ola@example.com');

-- Ola ma swoje ziarna.
set local role authenticated;
set local request.jwt.claims = '{"sub": "22222222-2222-2222-2222-222222222222", "role": "authenticated"}';
select lives_ok(
  $$ select public.sync_push('[{"collection":"beans","record_id":"b-ola","payload":{"name":"Kenia"},"updated_at":"2026-10-09T10:00:00Z","deleted":false}]') $$,
  'Ola zapisuje swoje ziarna'
);

-- Ania zalogowana.
set local request.jwt.claims = '{"sub": "11111111-1111-1111-1111-111111111111", "role": "authenticated"}';
select is((select count(*)::int from public.user_data), 0, 'Ania nie widzi danych Oli');

select lives_ok(
  $$ select public.sync_push('[{"collection":"beans","record_id":"b-1","payload":{"name":"Etiopia"},"updated_at":"2026-10-09T10:00:00Z","deleted":false}]') $$,
  'Ania zapisuje swoje ziarna'
);
select is((select count(*)::int from public.user_data), 1, 'Ania widzi tylko swój wiersz');

-- Starsza wersja nie nadpisuje nowszej, nowsza tak (także usunięcie).
select public.sync_push('[{"collection":"beans","record_id":"b-1","payload":{"name":"STARE"},"updated_at":"2026-10-09T09:00:00Z","deleted":false}]');
select is((select payload->>'name' from public.user_data where record_id = 'b-1'), 'Etiopia', 'starsza zmiana przegrywa');
select public.sync_push('[{"collection":"beans","record_id":"b-1","payload":null,"updated_at":"2026-10-09T11:00:00Z","deleted":true}]');
select is((select deleted from public.user_data where record_id = 'b-1'), true, 'nowsze usunięcie wygrywa');

-- Nie da się dopisać danych na cudze konto ani zmienić cudzego wiersza.
select throws_ok(
  $$ insert into public.user_data (user_id, collection, record_id, payload, updated_at) values ('22222222-2222-2222-2222-222222222222', 'beans', 'x', '{}', now()) $$,
  '42501',
  null,
  'nie można zapisać danych na cudze konto'
);
update public.user_data set payload = '{"name":"przejęte"}' where record_id = 'b-ola';

reset role;
select is((select payload->>'name' from public.user_data where record_id = 'b-ola'), 'Kenia', 'cudzego wiersza nie da się zmienić');

delete from auth.users where id = '22222222-2222-2222-2222-222222222222';
select is((select count(*)::int from public.user_data where user_id = '22222222-2222-2222-2222-222222222222'), 0, 'usunięcie konta usuwa dane');

select * from finish();
rollback;
