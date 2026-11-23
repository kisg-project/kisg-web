begin;
create extension if not exists pgtap with schema extensions;
select plan(22);

insert into auth.users (id, email) values
  ('00000000-0000-4000-8000-000000000101', 'owner-3a@kis.test'),
  ('00000000-0000-4000-8000-000000000102', 'manajer-3a@kis.test'),
  ('00000000-0000-4000-8000-000000000103', 'marketing-a-3a@kis.test'),
  ('00000000-0000-4000-8000-000000000104', 'marketing-b-3a@kis.test'),
  ('00000000-0000-4000-8000-000000000105', 'pengawas-3a@kis.test');
insert into public.user_roles (user_id, role) values
  ('00000000-0000-4000-8000-000000000101', 'owner'),
  ('00000000-0000-4000-8000-000000000102', 'marketing_manager'),
  ('00000000-0000-4000-8000-000000000103', 'marketing'),
  ('00000000-0000-4000-8000-000000000104', 'marketing'),
  ('00000000-0000-4000-8000-000000000105', 'site_supervisor');
insert into public.teams (id, name, kind) values
  ('10000000-0000-4000-8000-000000000101', 'Tim A (uji 3a)', 'marketing'),
  ('10000000-0000-4000-8000-000000000102', 'Tim B (uji 3a)', 'marketing');
insert into public.team_members (team_id, user_id) values
  ('10000000-0000-4000-8000-000000000101', '00000000-0000-4000-8000-000000000102'),
  ('10000000-0000-4000-8000-000000000101', '00000000-0000-4000-8000-000000000103'),
  ('10000000-0000-4000-8000-000000000102', '00000000-0000-4000-8000-000000000104');

select is(
  (select is_new from public.upsert_lead('Budi', '0812-3456-7890', 'budi@contoh.id',
    '5a7e0000-0000-4000-8000-000000000001', null, 'website', 'form minat', 'Minta info', 'v1')),
  true,
  'lead baru dibuat'
);
select is((select phone from public.leads where full_name = 'Budi'), '+6281234567890', 'nomor HP lead dinormalisasi');
select is(
  (select is_new from public.upsert_lead('Budi S', '+6281234567890', null,
    '5a7e0000-0000-4000-8000-000000000001', null, 'website', 'form brosur', null, 'v1')),
  false,
  'nomor yang sama tidak membuat lead baru'
);
select is(
  (select count(*)::int from public.lead_activities a join public.leads l on l.id = a.lead_id where l.phone = '+6281234567890'),
  1,
  'lead masuk lagi dicatat sebagai aktivitas'
);
select throws_ok(
  $$select public.upsert_lead('X', '12345', null, null, null, 'website', null, null, 'v1')$$,
  '22023', null, 'nomor HP tidak valid ditolak'
);
select throws_ok(
  $$select public.upsert_lead('X', '081234567891', null, null, null, 'website', null, null, '')$$,
  '22023', null, 'tanpa persetujuan PDP ditolak'
);

select public.upsert_lead('Citra', '081211112222', null, null, null, 'website', null, null, 'v1');
select public.upsert_lead('Dodi', '081233334444', null, null, null, 'website', null, null, 'v1');
update public.leads set owner_id = '00000000-0000-4000-8000-000000000103' where full_name = 'Citra';
update public.leads set owner_id = '00000000-0000-4000-8000-000000000104' where full_name = 'Dodi';

set local role anon;
select set_config('request.jwt.claims', '{"role": "anon"}', true);
select is((select count(*)::int from public.project_media), 10, 'anon melihat galeri proyek terbit');
select is((select count(*)::int from public.nearby_places), 4, 'anon melihat akses sekitar');
select is((select count(*)::int from public.banners), 3, 'anon melihat banner terbit');
select is((select count(*)::int from public.faqs), 6, 'anon melihat FAQ terbit');
select is((select count(*)::int from public.posts), 10, 'anon hanya melihat berita terbit, berita draft tidak');
select is((select count(*)::int from public.promos), 0, 'promo kedaluwarsa tidak terlihat');
select is((select count(*)::int from public.careers), 0, 'lowongan draft tidak terlihat');
select throws_ok('select count(*) from public.leads', '42501', null, 'anon tidak bisa membaca lead');
select throws_ok(
  $$insert into public.posts (slug, title) values ('uji-anon', 'Uji')$$,
  '42501', null, 'anon tidak bisa menulis berita'
);
select throws_ok(
  $$select public.upsert_lead('X', '081299990000', null, null, null, 'website', null, null, 'v1')$$,
  '42501', null, 'anon tidak bisa memanggil upsert_lead langsung'
);
reset role;

set local role authenticated;
select set_config('request.jwt.claims', '{"sub": "00000000-0000-4000-8000-000000000103", "role": "authenticated"}', true);
select is((select count(*)::int from public.leads), 1, 'marketing hanya melihat lead miliknya');
select is((select count(*)::int from public.posts), 11, 'staf melihat berita draft');
reset role;

set local role authenticated;
select set_config('request.jwt.claims', '{"sub": "00000000-0000-4000-8000-000000000102", "role": "authenticated"}', true);
select is((select count(*)::int from public.leads), 2, 'manajer melihat lead timnya dan antrean, bukan lead tim lain');
reset role;

set local role authenticated;
select set_config('request.jwt.claims', '{"sub": "00000000-0000-4000-8000-000000000105", "role": "authenticated"}', true);
select is((select count(*)::int from public.leads), 0, 'pengawas lapangan tidak melihat lead');
reset role;

set local role authenticated;
select set_config('request.jwt.claims', '{"sub": "00000000-0000-4000-8000-000000000101", "role": "authenticated"}', true);
select is((select count(*)::int from public.leads), 3, 'owner melihat semua lead');
select lives_ok(
  $$insert into public.posts (slug, title) values ('uji-owner', 'Uji owner')$$,
  'owner bisa membuat berita'
);
reset role;

select * from finish();
rollback;
