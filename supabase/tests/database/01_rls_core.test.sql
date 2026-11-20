-- Test RLS tabel inti (Fase 2a). Dijalankan di CI: supabase test db (db.yml).
-- Setiap blok menyamar sebagai role tertentu lewat request.jwt.claims, lalu mengembalikan role ke postgres.

begin;
create extension if not exists pgtap with schema extensions;
select plan(24);

-- Data uji -----------------------------------------------------------------
insert into auth.users (id, email) values
  ('00000000-0000-4000-8000-000000000001', 'owner@kis.test'),
  ('00000000-0000-4000-8000-000000000002', 'admin@kis.test'),
  ('00000000-0000-4000-8000-000000000003', 'manajer@kis.test'),
  ('00000000-0000-4000-8000-000000000004', 'marketing-a@kis.test'),
  ('00000000-0000-4000-8000-000000000005', 'marketing-b@kis.test'),
  ('00000000-0000-4000-8000-000000000006', 'site-manager@kis.test'),
  ('00000000-0000-4000-8000-000000000007', 'pengawas@kis.test'),
  ('00000000-0000-4000-8000-000000000008', 'nonaktif@kis.test');

insert into public.user_roles (user_id, role) values
  ('00000000-0000-4000-8000-000000000001', 'owner'),
  ('00000000-0000-4000-8000-000000000002', 'admin'),
  ('00000000-0000-4000-8000-000000000003', 'marketing_manager'),
  ('00000000-0000-4000-8000-000000000004', 'marketing'),
  ('00000000-0000-4000-8000-000000000005', 'marketing'),
  ('00000000-0000-4000-8000-000000000006', 'site_manager'),
  ('00000000-0000-4000-8000-000000000007', 'site_supervisor'),
  ('00000000-0000-4000-8000-000000000008', 'marketing');

update public.profiles set is_active = false where id = '00000000-0000-4000-8000-000000000008';

insert into public.teams (id, name, kind) values
  ('10000000-0000-4000-8000-000000000001', 'Tim marketing A (uji)', 'marketing'),
  ('10000000-0000-4000-8000-000000000002', 'Tim marketing B (uji)', 'marketing');
insert into public.team_members (team_id, user_id) values
  ('10000000-0000-4000-8000-000000000001', '00000000-0000-4000-8000-000000000003'),
  ('10000000-0000-4000-8000-000000000001', '00000000-0000-4000-8000-000000000004'),
  ('10000000-0000-4000-8000-000000000002', '00000000-0000-4000-8000-000000000005');

insert into public.project_assignments (project_id, user_id, role_on_project)
select id, '00000000-0000-4000-8000-000000000007', 'supervisor'
from public.projects where slug = 'sejahtera-green-village';

-- Fungsi murni ------------------------------------------------------------
select is(public.normalize_phone_id('0896-7329-6881'), '+6289673296881', 'nomor HP lokal menjadi E.164');
select is(public.normalize_phone_id('+1 415 555 0100'), null, 'nomor luar negeri ditolak');

select is(
  (public.custom_access_token_hook(
    '{"user_id": "00000000-0000-4000-8000-000000000003", "claims": {"role": "authenticated"}}'::jsonb
  ) -> 'claims' ->> 'app_role'),
  'marketing_manager',
  'hook JWT mengisi app_role'
);
select is(
  (public.custom_access_token_hook(
    '{"user_id": "00000000-0000-4000-8000-000000000003", "claims": {}}'::jsonb
  ) -> 'claims' ->> 'team_id'),
  '10000000-0000-4000-8000-000000000001',
  'hook JWT mengisi team_id'
);
select is(
  (public.custom_access_token_hook(
    '{"user_id": "00000000-0000-4000-8000-000000000008", "claims": {}}'::jsonb
  ) -> 'claims' ->> 'is_active'),
  'false',
  'hook JWT menandai akun nonaktif'
);

-- Pengunjung (anon) -------------------------------------------------------
set local role anon;
select set_config('request.jwt.claims', '{"role": "anon"}', true);
select is((select count(*)::int from public.projects), 4, 'anon hanya melihat proyek terbit (SGV dan 3 proyek sold out)');
select is((select count(*)::int from public.unit_types), 1, 'anon melihat tipe unit proyek terbit');
select is((select count(*)::int from public.site_settings), 3, 'anon hanya melihat pengaturan publik');
select throws_ok('select count(*) from public.profiles', '42501', null, 'anon tidak bisa membaca profil');
select throws_ok($$select public.rate_limit_hit('uji', 60, 5)$$, '42501', null, 'anon tidak bisa memanggil rate limit');
reset role;

-- Marketing A -------------------------------------------------------------
set local role authenticated;
select set_config('request.jwt.claims', '{"sub": "00000000-0000-4000-8000-000000000004", "role": "authenticated"}', true);
select is((select count(*)::int from public.profiles), 1, 'marketing hanya melihat profilnya sendiri');
select is((select count(*)::int from public.projects), 5, 'staf aktif melihat proyek draft juga');
select throws_ok(
  $$insert into public.projects (slug, name) values ('uji-marketing', 'Uji')$$,
  '42501', null, 'marketing tidak bisa membuat proyek'
);
select throws_ok(
  $$select public.set_user_role('00000000-0000-4000-8000-000000000005', 'owner')$$,
  '42501', null, 'marketing tidak bisa mengubah role'
);
select throws_ok(
  $$update public.profiles set is_active = false where id = '00000000-0000-4000-8000-000000000004'$$,
  '42501', null, 'kolom is_active tidak bisa diubah sendiri'
);
select is((select count(*)::int from public.audit_log), 0, 'marketing tidak bisa membaca audit log');
reset role;

-- Manajer marketing --------------------------------------------------------
set local role authenticated;
select set_config('request.jwt.claims', '{"sub": "00000000-0000-4000-8000-000000000003", "role": "authenticated"}', true);
select is((select count(*)::int from public.profiles), 2, 'manajer melihat profil anggota timnya saja');
reset role;

-- Pengawas lapangan --------------------------------------------------------
set local role authenticated;
select set_config('request.jwt.claims', '{"sub": "00000000-0000-4000-8000-000000000007", "role": "authenticated"}', true);
select is((select count(*)::int from public.project_assignments), 1, 'pengawas melihat penugasannya sendiri');
reset role;

-- Akun nonaktif ------------------------------------------------------------
set local role authenticated;
select set_config('request.jwt.claims', '{"sub": "00000000-0000-4000-8000-000000000008", "role": "authenticated"}', true);
select is((select count(*)::int from public.projects), 4, 'akun nonaktif kehilangan akses staf');
reset role;

-- Admin ------------------------------------------------------------------
set local role authenticated;
select set_config('request.jwt.claims', '{"sub": "00000000-0000-4000-8000-000000000002", "role": "authenticated"}', true);
select is((select count(*)::int from public.profiles), 8, 'admin melihat semua profil');
select lives_ok(
  $$insert into public.projects (slug, name) values ('uji-admin', 'Uji admin')$$,
  'admin bisa membuat proyek'
);
select lives_ok(
  $$select public.set_user_role('00000000-0000-4000-8000-000000000001', 'owner')$$,
  'admin bisa menetapkan role owner (undangan owner)'
);
select throws_ok(
  $$select public.set_user_active('00000000-0000-4000-8000-000000000002', false)$$,
  '42501', null, 'admin tidak bisa menonaktifkan akunnya sendiri'
);
select ok((select count(*) from public.audit_log) > 0, 'admin bisa membaca audit log');
reset role;

select * from finish();
rollback;
