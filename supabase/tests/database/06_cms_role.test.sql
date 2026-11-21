-- Role cms: menulis konten website, tidak bisa digabung dengan role karyawan.
begin;
create extension if not exists pgtap with schema extensions;
select plan(6);

insert into auth.users (id, email) values
  ('00000000-0000-4000-8000-000000000601', 'cms@kis.test'),
  ('00000000-0000-4000-8000-000000000602', 'marketing-cms@kis.test');

insert into public.user_roles (user_id, role) values
  ('00000000-0000-4000-8000-000000000601', 'cms'),
  ('00000000-0000-4000-8000-000000000602', 'marketing');

-- Akun CMS menulis konten ----------------------------------------------------
set local role authenticated;
select set_config('request.jwt.claims', '{"sub": "00000000-0000-4000-8000-000000000601", "role": "authenticated"}', true);
select lives_ok(
  $$insert into public.posts (slug, title, excerpt) values ('uji-cms', 'Uji CMS', 'Ringkasan uji')$$,
  'akun cms bisa menulis berita'
);
select lives_ok(
  $$insert into public.careers (slug, title, level) values ('uji-cms-karir', 'Uji karir', 'magang')$$,
  'akun cms bisa menulis lowongan'
);
select is((select count(*)::int from public.leads), 0, 'akun cms tidak melihat lead');
reset role;

-- Karyawan tidak menulis konten ---------------------------------------------
set local role authenticated;
select set_config('request.jwt.claims', '{"sub": "00000000-0000-4000-8000-000000000602", "role": "authenticated"}', true);
select throws_ok(
  $$insert into public.posts (slug, title) values ('uji-marketing', 'Uji marketing')$$,
  '42501', null, 'marketing tidak bisa menulis berita'
);
reset role;

-- Role cms berdiri sendiri ---------------------------------------------------
select throws_ok(
  $$insert into public.user_roles (user_id, role, is_primary) values ('00000000-0000-4000-8000-000000000601', 'marketing', false)$$,
  '22023', null, 'role cms tidak bisa digabung role lain'
);
select throws_ok(
  $$insert into public.user_roles (user_id, role, is_primary) values ('00000000-0000-4000-8000-000000000602', 'cms', false)$$,
  '22023', null, 'akun karyawan tidak bisa diberi role cms'
);

select * from finish();
rollback;
