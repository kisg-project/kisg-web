begin;
create extension if not exists pgtap with schema extensions;
select plan(9);

insert into auth.users (id, email) values
  ('00000000-0000-4000-8000-000000001301', 'marketing-jadwal@kis.test'),
  ('00000000-0000-4000-8000-000000001302', 'keuangan-jadwal@kis.test'),
  ('00000000-0000-4000-8000-000000001303', 'rangkap-jadwal@kis.test'),
  ('00000000-0000-4000-8000-000000001304', 'khusus-jadwal@kis.test');

insert into public.user_roles (user_id, role, is_primary) values
  ('00000000-0000-4000-8000-000000001301', 'marketing', true),
  ('00000000-0000-4000-8000-000000001302', 'finance', true),
  ('00000000-0000-4000-8000-000000001303', 'finance', true),
  ('00000000-0000-4000-8000-000000001303', 'marketing', false),
  ('00000000-0000-4000-8000-000000001304', 'marketing', true);

select is(
  (select start_time from public.work_schedules where scope = 'perusahaan'),
  '09:00'::time,
  'jam masuk perusahaan 09.00'
);

select is(
  (select workdays from public.work_schedules where scope = 'role' and role = 'marketing'),
  '{1,2,3,4,5,6,7}'::smallint[],
  'marketing bekerja sampai hari Minggu'
);

select is(
  (private.effective_schedule('00000000-0000-4000-8000-000000001301', null)).scope,
  'role'::public.schedule_scope,
  'marketing memakai jadwal role'
);

select is(
  (private.effective_schedule('00000000-0000-4000-8000-000000001302', null)).scope,
  'perusahaan'::public.schedule_scope,
  'keuangan tanpa jadwal role memakai jadwal perusahaan'
);

select is(
  (private.effective_schedule('00000000-0000-4000-8000-000000001303', null)).role,
  'marketing'::public.app_role,
  'rangkap jabatan tetap memakai jadwal role yang ada'
);

insert into public.work_schedules (scope, user_id, start_time, end_time, workdays, late_tolerance_min)
values ('karyawan', '00000000-0000-4000-8000-000000001304', '10:00', '18:00', '{1,2,3}', 5);

select is(
  (private.effective_schedule('00000000-0000-4000-8000-000000001304', null)).scope,
  'karyawan'::public.schedule_scope,
  'jadwal per karyawan mengalahkan jadwal role'
);

insert into public.work_locations (id, name, kind, lat, lng, radius_m) values
  ('00000000-0000-4000-8000-000000001311', 'Titik uji jadwal role', 'kantor', -2.5, 121.5, 100);
insert into public.work_schedules (scope, work_location_id, start_time, end_time, workdays, late_tolerance_min)
values ('lokasi', '00000000-0000-4000-8000-000000001311', '07:00', '16:00', '{1,2,3,4,5,6}', 10);

select is(
  (private.effective_schedule('00000000-0000-4000-8000-000000001301', '00000000-0000-4000-8000-000000001311')).scope,
  'lokasi'::public.schedule_scope,
  'jadwal titik absensi mengalahkan jadwal role'
);

select throws_ok(
  $$insert into public.work_schedules (scope, start_time, end_time) values ('role', '09:00', '17:00')$$,
  '23514',
  null,
  'jadwal role wajib menyebut role'
);

select throws_ok(
  $$insert into public.work_schedules (scope, role, start_time, end_time) values ('role', 'marketing', '09:00', '17:00')$$,
  '23505',
  null,
  'satu jadwal per role'
);

select * from finish();
rollback;
