-- Test reguł dostępu do profili (pgTAP). Uruchomienie lokalne: `npx supabase start`, potem
-- `npx supabase test db` (wymaga Docker Desktop). Wszystko w transakcji: baza zostaje czysta.
begin;
select plan(7);

insert into auth.users (id, email)
values
  ('11111111-1111-1111-1111-111111111111', 'ania@example.com'),
  ('22222222-2222-2222-2222-222222222222', 'ola@example.com');

select is((select count(*)::int from public.profiles), 2, 'konto dostaje profil od razu (trigger)');

-- Ania zalogowana.
set local role authenticated;
set local request.jwt.claims = '{"sub": "11111111-1111-1111-1111-111111111111", "role": "authenticated"}';

select is((select count(*)::int from public.profiles), 1, 'widać tylko własny profil');
select is(
  (select id from public.profiles),
  '11111111-1111-1111-1111-111111111111'::uuid,
  'tym profilem jest profil Ani'
);

update public.profiles set nick = 'Ania' where id = '11111111-1111-1111-1111-111111111111';
update public.profiles set nick = 'Przejęte' where id = '22222222-2222-2222-2222-222222222222';
select throws_ok(
  $$ update public.profiles set created_at = now() - interval '1 year' $$,
  '42501',
  null,
  'dat nie da się zmienić z aplikacji (tylko nick)'
);

-- Niezalogowany nie widzi nic.
set local role anon;
set local request.jwt.claims = '{"role": "anon"}';
select is((select count(*)::int from public.profiles), 0, 'niezalogowany nie widzi profili');

reset role;
select is(
  (select nick from public.profiles where id = '22222222-2222-2222-2222-222222222222'),
  null,
  'cudzego profilu nie da się zmienić'
);

delete from auth.users where id = '11111111-1111-1111-1111-111111111111';
select is(
  (select count(*)::int from public.profiles where id = '11111111-1111-1111-1111-111111111111'),
  0,
  'usunięcie konta usuwa profil'
);

select * from finish();
rollback;
