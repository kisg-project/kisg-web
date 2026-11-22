begin;
create extension if not exists pgtap with schema extensions;
select plan(12);

insert into auth.users (id, email) values
  ('00000000-0000-4000-8000-000000001401', 'owner-notif@kis.test'),
  ('00000000-0000-4000-8000-000000001402', 'manager-notif@kis.test'),
  ('00000000-0000-4000-8000-000000001403', 'marketing-notif@kis.test'),
  ('00000000-0000-4000-8000-000000001404', 'manager-lain-notif@kis.test');
insert into public.user_roles (user_id, role) values
  ('00000000-0000-4000-8000-000000001401', 'owner'),
  ('00000000-0000-4000-8000-000000001402', 'marketing_manager'),
  ('00000000-0000-4000-8000-000000001403', 'marketing'),
  ('00000000-0000-4000-8000-000000001404', 'marketing_manager');
insert into public.teams (id, name, kind) values
  ('00000000-0000-4000-8000-000000001411', 'Tim uji notifikasi', 'marketing'),
  ('00000000-0000-4000-8000-000000001412', 'Tim uji notifikasi lain', 'marketing');
insert into public.team_members (team_id, user_id) values
  ('00000000-0000-4000-8000-000000001411', '00000000-0000-4000-8000-000000001402'),
  ('00000000-0000-4000-8000-000000001411', '00000000-0000-4000-8000-000000001403'),
  ('00000000-0000-4000-8000-000000001412', '00000000-0000-4000-8000-000000001404');

insert into public.notifications (user_id, kind, title, href, dedupe_key) values
  ('00000000-0000-4000-8000-000000001403', 'absen_luar_lokasi_diputuskan', 'Absen disetujui', '/portal/absensi', 'uji-1'),
  ('00000000-0000-4000-8000-000000001401', 'absen_luar_lokasi_diajukan', 'Pengajuan baru', '/portal/owner', 'uji-2');
insert into public.push_subscriptions (user_id, endpoint, p256dh, auth) values
  ('00000000-0000-4000-8000-000000001403', 'https://push.example.test/a', 'kunci', 'rahasia'),
  ('00000000-0000-4000-8000-000000001401', 'https://push.example.test/b', 'kunci', 'rahasia');

select throws_ok(
  $$insert into public.notifications (user_id, kind, title, dedupe_key)
    values ('00000000-0000-4000-8000-000000001403', 'sidik_jari_direset', 'Ulang', 'uji-1')$$,
  '23505', null, 'notifikasi yang sama tidak tercatat dua kali'
);
select throws_ok(
  $$insert into public.notifications (user_id, kind, title, href, dedupe_key)
    values ('00000000-0000-4000-8000-000000001403', 'sidik_jari_direset', 'Luar', 'https://contoh.test', 'uji-3')$$,
  '23514', null, 'tautan notifikasi hanya ke halaman portal'
);

set local role authenticated;
select set_config('request.jwt.claims', '{"sub": "00000000-0000-4000-8000-000000001403", "role": "authenticated"}', true);
select is((select count(*)::integer from public.notifications), 1, 'karyawan hanya melihat notifikasinya sendiri');
select throws_ok(
  $$insert into public.notifications (user_id, kind, title, dedupe_key)
    values ('00000000-0000-4000-8000-000000001403', 'sidik_jari_direset', 'Palsu', 'uji-4')$$,
  '42501', null, 'notifikasi tidak bisa dibuat dari client'
);
select lives_ok(
  $$update public.notifications set read_at = now() where dedupe_key = 'uji-1'$$,
  'pemilik menandai notifikasi dibaca'
);
select throws_ok(
  $$update public.notifications set title = 'Diubah' where dedupe_key = 'uji-1'$$,
  '42501', null, 'isi notifikasi tidak bisa diubah'
);
update public.notifications set read_at = now() where dedupe_key = 'uji-2';
select is((select count(*)::integer from public.push_subscriptions), 1, 'langganan push hanya milik sendiri');
select throws_ok(
  $$insert into public.push_subscriptions (user_id, endpoint, p256dh, auth)
    values ('00000000-0000-4000-8000-000000001403', 'https://push.example.test/c', 'k', 'r')$$,
  '42501', null, 'langganan push disimpan lewat server'
);
select throws_ok(
  $$select public.notification_approvers('00000000-0000-4000-8000-000000001403')$$,
  '42501', null, 'daftar penyetuju hanya untuk server'
);
reset role;

select is(
  (select read_at from public.notifications where dedupe_key = 'uji-2'),
  null,
  'notifikasi orang lain tidak bisa ditandai dibaca'
);

select set_eq(
  $$select public.notification_approvers('00000000-0000-4000-8000-000000001403')$$,
  $$values ('00000000-0000-4000-8000-000000001401'::uuid), ('00000000-0000-4000-8000-000000001402'::uuid)$$,
  'penyetuju: owner dan manajer timnya, bukan manajer tim lain'
);

select ok(
  exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'notifications'
  ),
  'notifikasi disiarkan realtime'
);

select * from finish();
rollback;
