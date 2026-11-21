-- Absensi: radius titik, jam kerja berlapis, foto milik sendiri, dan RLS.
begin;
create extension if not exists pgtap with schema extensions;
select plan(20);

insert into auth.users (id, email) values
  ('00000000-0000-4000-8000-000000000701', 'owner-absen@kis.test'),
  ('00000000-0000-4000-8000-000000000702', 'marketing-absen@kis.test'),
  ('00000000-0000-4000-8000-000000000703', 'lapangan-absen@kis.test'),
  ('00000000-0000-4000-8000-000000000704', 'keuangan-absen@kis.test'),
  ('00000000-0000-4000-8000-000000000705', 'cms-absen@kis.test');

insert into public.user_roles (user_id, role) values
  ('00000000-0000-4000-8000-000000000701', 'owner'),
  ('00000000-0000-4000-8000-000000000702', 'marketing'),
  ('00000000-0000-4000-8000-000000000703', 'site_supervisor'),
  ('00000000-0000-4000-8000-000000000704', 'finance'),
  ('00000000-0000-4000-8000-000000000705', 'cms');

-- Titik jauh dari data seed supaya titik terdekat pasti titik test ini.
insert into public.work_locations (id, name, kind, lat, lng, radius_m) values
  ('00000000-0000-4000-8000-000000000711', 'Titik uji absensi', 'kantor', -1.500000, 120.500000, 100);

insert into storage.objects (bucket_id, name) values
  ('attendance-photos', '00000000-0000-4000-8000-000000000702/2026-01-01/masuk-a.webp'),
  ('attendance-photos', '00000000-0000-4000-8000-000000000703/2026-01-01/masuk-b.webp');

-- Fungsi bantu ------------------------------------------------------------------
select ok(
  private.distance_m(-1.5, 120.5, -1.5, 120.501) between 105 and 118,
  'jarak 0,001 derajat bujur di dekat khatulistiwa sekitar 111 meter'
);
select is(
  (select location_id from private.nearest_location(-1.5003, 120.5)),
  '00000000-0000-4000-8000-000000000711'::uuid,
  'titik terdekat ditemukan'
);

insert into public.work_schedules (scope, work_location_id, start_time, end_time, workdays, late_tolerance_min)
values ('lokasi', '00000000-0000-4000-8000-000000000711', '07:00', '16:00', '{1,2,3,4,5}', 10);
select is(
  (private.effective_schedule('00000000-0000-4000-8000-000000000702', '00000000-0000-4000-8000-000000000711')).start_time,
  '07:00'::time,
  'jam titik mengalahkan jam perusahaan'
);
insert into public.work_schedules (scope, user_id, start_time, end_time, workdays, late_tolerance_min)
values ('karyawan', '00000000-0000-4000-8000-000000000702', '09:00', '18:00', '{1,2,3,4,5,6}', 0);
select is(
  (private.effective_schedule('00000000-0000-4000-8000-000000000702', '00000000-0000-4000-8000-000000000711')).start_time,
  '09:00'::time,
  'jam karyawan mengalahkan jam titik'
);

-- Marketing clock in di dalam radius ----------------------------------------------
set local role authenticated;
select set_config('request.jwt.claims', '{"sub": "00000000-0000-4000-8000-000000000702", "role": "authenticated"}', true);
select ok(private.must_attend(), 'marketing wajib absensi');
select is(
  public.attendance_clock('masuk', -1.5002, 120.5, 10, '00000000-0000-4000-8000-000000000702/2026-01-01/masuk-a.webp') ->> 'status',
  'ok',
  'clock in 22 meter dari titik diterima'
);
select throws_ok(
  $$select public.attendance_clock('masuk', -1.5002, 120.5, 10, '00000000-0000-4000-8000-000000000702/2026-01-01/masuk-a.webp')$$,
  '22023', 'Anda sudah clock in hari ini.', 'clock in kedua di hari yang sama ditolak'
);
select throws_ok(
  $$select public.attendance_clock('pulang', -1.5002, 120.5, 10, '00000000-0000-4000-8000-000000000703/2026-01-01/masuk-b.webp')$$,
  '22023', 'Foto absensi tidak ditemukan.', 'foto milik karyawan lain ditolak'
);
select throws_ok(
  $$insert into public.attendance_records (user_id, work_date, clock_in_at, clock_in_lat, clock_in_lng, clock_in_photo_path)
    values ('00000000-0000-4000-8000-000000000702', '2026-01-02', now(), 0, 0, 'x')$$,
  '42501', null, 'absensi tidak bisa ditulis langsung, hanya lewat fungsi'
);
select throws_ok(
  $$insert into public.work_schedules (scope, user_id, start_time, end_time, workdays, late_tolerance_min)
    values ('karyawan', '00000000-0000-4000-8000-000000000702', '10:00', '12:00', '{1}', 0)$$,
  '42501', null, 'karyawan tidak bisa mengatur jam kerjanya sendiri'
);
reset role;

-- Petugas lapangan di luar radius ----------------------------------------------------
set local role authenticated;
select set_config('request.jwt.claims', '{"sub": "00000000-0000-4000-8000-000000000703", "role": "authenticated"}', true);
select is(
  public.attendance_clock('masuk', -1.51, 120.5, 10, '00000000-0000-4000-8000-000000000703/2026-01-01/masuk-b.webp') ->> 'status',
  'di_luar_radius',
  'clock in sekitar 1,1 km dari titik ditolak'
);
select is(
  (select count(*)::integer from public.attendance_records),
  0,
  'petugas lapangan tidak melihat absensi karyawan lain dan absennya sendiri tidak tercatat'
);
select lives_ok(
  $$select public.request_attendance_exception('masuk', -1.51, 120.5, 10,
    '00000000-0000-4000-8000-000000000703/2026-01-01/masuk-b.webp', 'Survei lahan bersama calon pembeli.')$$,
  'pengajuan absen di luar lokasi diterima'
);
select throws_ok(
  $$select public.request_attendance_exception('masuk', -1.51, 120.5, 10,
    '00000000-0000-4000-8000-000000000703/2026-01-01/masuk-b.webp', 'Survei lahan bersama calon pembeli.')$$,
  '22023', 'Pengajuan untuk absen ini sudah dikirim dan menunggu keputusan.', 'pengajuan ganda ditolak'
);
select throws_ok(
  $$select public.request_attendance_exception('pulang', -1.51, 120.5, 10,
    '00000000-0000-4000-8000-000000000703/2026-01-01/masuk-b.webp', 'Survei lahan bersama calon pembeli.')$$,
  '22023', 'Clock in dulu sebelum mengajukan clock out.', 'pengajuan clock out tanpa clock in ditolak'
);
reset role;

-- Owner dan akun CMS tidak memakai absensi -------------------------------------------
set local role authenticated;
select set_config('request.jwt.claims', '{"sub": "00000000-0000-4000-8000-000000000701", "role": "authenticated"}', true);
select throws_ok(
  $$select public.attendance_clock('masuk', -1.5, 120.5, 10, '00000000-0000-4000-8000-000000000701/2026-01-01/masuk.webp')$$,
  '42501', null, 'owner tidak wajib absensi'
);
select is(
  (select count(*)::integer from public.attendance_exceptions where user_id = '00000000-0000-4000-8000-000000000703'),
  1,
  'owner melihat pengajuan di luar lokasi'
);
reset role;

set local role authenticated;
select set_config('request.jwt.claims', '{"sub": "00000000-0000-4000-8000-000000000705", "role": "authenticated"}', true);
select throws_ok(
  $$select public.attendance_clock('masuk', -1.5, 120.5, 10, '00000000-0000-4000-8000-000000000705/2026-01-01/masuk.webp')$$,
  '42501', null, 'akun CMS tidak memakai absensi'
);
reset role;

-- Keuangan membaca absensi untuk penggajian, tapi tidak pengajuan di luar lokasi -------
set local role authenticated;
select set_config('request.jwt.claims', '{"sub": "00000000-0000-4000-8000-000000000704", "role": "authenticated"}', true);
select is(
  (select count(*)::integer from public.attendance_records where user_id = '00000000-0000-4000-8000-000000000702'),
  1,
  'keuangan melihat absensi karyawan'
);
select is(
  (select count(*)::integer from public.attendance_exceptions),
  0,
  'keuangan tidak melihat pengajuan di luar lokasi'
);
reset role;

select * from finish();
rollback;
