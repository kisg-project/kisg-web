-- Persetujuan digital: keputusan hanya lewat server, wewenang owner atau manajer tim, pengaju tidak
-- memutuskan sendiri, cap permanen, dan verifikasi mendeteksi isi dokumen yang berubah.
begin;
create extension if not exists pgtap with schema extensions;
select plan(16);

insert into auth.users (id, email) values
  ('00000000-0000-4000-8000-000000001001', 'owner-acc@kis.test'),
  ('00000000-0000-4000-8000-000000001002', 'marketing-acc@kis.test'),
  ('00000000-0000-4000-8000-000000001003', 'manager-acc@kis.test'),
  ('00000000-0000-4000-8000-000000001004', 'marketing-lain-acc@kis.test');
insert into public.user_roles (user_id, role) values
  ('00000000-0000-4000-8000-000000001001', 'owner'),
  ('00000000-0000-4000-8000-000000001002', 'marketing'),
  ('00000000-0000-4000-8000-000000001003', 'marketing_manager'),
  ('00000000-0000-4000-8000-000000001004', 'marketing');
update public.profiles set full_name = 'Owner Uji' where id = '00000000-0000-4000-8000-000000001001';

insert into public.teams (id, name, kind) values
  ('00000000-0000-4000-8000-000000001011', 'Tim uji persetujuan', 'marketing');
insert into public.team_members (team_id, user_id) values
  ('00000000-0000-4000-8000-000000001011', '00000000-0000-4000-8000-000000001002'),
  ('00000000-0000-4000-8000-000000001011', '00000000-0000-4000-8000-000000001003');

insert into public.attendance_exceptions (id, user_id, work_date, kind, lat, lng, reason, photo_path) values
  ('00000000-0000-4000-8000-000000001021', '00000000-0000-4000-8000-000000001002', '2026-01-05', 'masuk', -6.2, 107.0, 'Survei lahan bersama calon pembeli.', 'a.webp'),
  ('00000000-0000-4000-8000-000000001022', '00000000-0000-4000-8000-000000001004', '2026-01-05', 'masuk', -6.2, 107.0, 'Bertemu notaris di Cikarang pagi ini.', 'b.webp'),
  ('00000000-0000-4000-8000-000000001023', '00000000-0000-4000-8000-000000001003', '2026-01-05', 'masuk', -6.2, 107.0, 'Pameran properti di mal Bekasi.', 'c.webp');

-- Karyawan tidak bisa memanggil fungsi keputusan langsung (password wajib lewat server).
set local role authenticated;
select set_config('request.jwt.claims', '{"sub": "00000000-0000-4000-8000-000000001001", "role": "authenticated"}', true);
select throws_ok(
  $$select public.decide_attendance_exception('00000000-0000-4000-8000-000000001001', '00000000-0000-4000-8000-000000001021', 'disetujui')$$,
  '42501', null, 'fungsi keputusan tidak bisa dipanggil dari client'
);
select throws_ok(
  $$insert into public.approval_stamps (doc_type, doc_id, decision, signer_id, signer_name, signer_role, content_hash, verify_code)
    values ('absen_luar_lokasi', gen_random_uuid(), 'disetujui', '00000000-0000-4000-8000-000000001001', 'x', 'owner', repeat('a', 64), repeat('b', 64))$$,
  '42501', null, 'cap tidak bisa ditulis langsung'
);
reset role;

set local role service_role;
-- Pengaju tidak bisa memutuskan pengajuannya sendiri.
select throws_ok(
  $$select public.decide_attendance_exception('00000000-0000-4000-8000-000000001003', '00000000-0000-4000-8000-000000001023', 'disetujui')$$,
  '42501', 'Pengajuan sendiri tidak bisa diputuskan sendiri.', 'pengaju tidak memutuskan sendiri'
);
-- Marketing biasa tidak berwenang. Manajer tidak berwenang untuk karyawan di luar timnya.
select throws_ok(
  $$select public.decide_attendance_exception('00000000-0000-4000-8000-000000001004', '00000000-0000-4000-8000-000000001021', 'disetujui')$$,
  '42501', 'Anda tidak berwenang memutuskan pengajuan ini.', 'marketing biasa tidak berwenang'
);
select throws_ok(
  $$select public.decide_attendance_exception('00000000-0000-4000-8000-000000001003', '00000000-0000-4000-8000-000000001022', 'disetujui')$$,
  '42501', 'Anda tidak berwenang memutuskan pengajuan ini.', 'manajer tidak berwenang di luar timnya'
);
select throws_ok(
  $$select public.decide_attendance_exception('00000000-0000-4000-8000-000000001001', '00000000-0000-4000-8000-000000001022', 'ditolak')$$,
  '22023', 'Tulis alasan penolakan minimal 5 karakter.', 'penolakan wajib alasan'
);
-- Manajer tim menyetujui anggota timnya: absen tercatat dengan waktu pengajuan.
select lives_ok(
  $$select public.decide_attendance_exception('00000000-0000-4000-8000-000000001003', '00000000-0000-4000-8000-000000001021', 'disetujui', null, 'Uji', -6.2, 107.0)$$,
  'manajer tim menyetujui anggota timnya'
);
select throws_ok(
  $$select public.decide_attendance_exception('00000000-0000-4000-8000-000000001001', '00000000-0000-4000-8000-000000001021', 'ditolak', 'Berubah pikiran.')$$,
  '22023', 'Pengajuan ini sudah diputuskan.', 'keputusan tidak bisa diulang'
);
-- Owner menolak dengan alasan.
select lives_ok(
  $$select public.decide_attendance_exception('00000000-0000-4000-8000-000000001001', '00000000-0000-4000-8000-000000001022', 'ditolak', 'Tidak ada jadwal.')$$,
  'owner menolak dengan alasan'
);
reset role;

select is(
  (select clock_in_exception_id from public.attendance_records where user_id = '00000000-0000-4000-8000-000000001002'),
  '00000000-0000-4000-8000-000000001021'::uuid,
  'absen tercatat dari pengajuan yang disetujui'
);
select is(
  (select count(*)::integer from public.attendance_records where user_id = '00000000-0000-4000-8000-000000001004'),
  0,
  'pengajuan yang ditolak tidak mencatat absen'
);
select is(
  (select row(signer_role, decision)::text from public.approval_stamps where doc_id = '00000000-0000-4000-8000-000000001021'),
  '(marketing_manager,disetujui)',
  'cap mencatat role penyetuju dan keputusan'
);

-- Cap permanen, bahkan untuk superuser.
select throws_ok(
  $$update public.approval_stamps set signer_name = 'Palsu' where doc_id = '00000000-0000-4000-8000-000000001021'$$,
  '42501', 'Cap persetujuan tidak bisa diubah atau dihapus.', 'cap tidak bisa diubah'
);
select throws_ok(
  $$delete from public.approval_stamps where doc_id = '00000000-0000-4000-8000-000000001022'$$,
  '42501', 'Cap persetujuan tidak bisa diubah atau dihapus.', 'cap tidak bisa dihapus'
);

-- Verifikasi publik (anon): cocok, lalu tidak cocok setelah isi dokumen diubah.
create temporary table kode_uji on commit drop as
  select verify_code from public.approval_stamps where doc_id = '00000000-0000-4000-8000-000000001021';
grant select on kode_uji to anon;
set local role anon;
select is(
  public.verify_approval((select verify_code from kode_uji)) ->> 'matches',
  'true',
  'verifikasi cocok untuk dokumen yang tidak berubah'
);
reset role;
update public.attendance_exceptions set reason = 'Alasan diubah setelah disetujui.'
where id = '00000000-0000-4000-8000-000000001021';
set local role anon;
select is(
  public.verify_approval((select verify_code from kode_uji)) ->> 'matches',
  'false',
  'verifikasi tidak cocok setelah isi dokumen berubah'
);
reset role;

select * from finish();
rollback;
