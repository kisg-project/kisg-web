-- Laporan harian: rencana butuh clock in, hasil butuh clock out, lampiran harus milik sendiri,
-- tulis hanya lewat fungsi, dan baca terbatas pemilik, owner, serta manajer tim.
begin;
create extension if not exists pgtap with schema extensions;
select plan(13);

insert into auth.users (id, email) values
  ('00000000-0000-4000-8000-000000000901', 'owner-lapor@kis.test'),
  ('00000000-0000-4000-8000-000000000902', 'marketing-lapor@kis.test'),
  ('00000000-0000-4000-8000-000000000903', 'lapangan-lapor@kis.test');
insert into public.user_roles (user_id, role) values
  ('00000000-0000-4000-8000-000000000901', 'owner'),
  ('00000000-0000-4000-8000-000000000902', 'marketing'),
  ('00000000-0000-4000-8000-000000000903', 'site_supervisor');

insert into storage.objects (bucket_id, name) values
  ('work-attachments', '00000000-0000-4000-8000-000000000902/2026-01-01/a.webp'),
  ('work-attachments', '00000000-0000-4000-8000-000000000903/2026-01-01/b.pdf');

-- Marketing belum clock in.
set local role authenticated;
select set_config('request.jwt.claims', '{"sub": "00000000-0000-4000-8000-000000000902", "role": "authenticated"}', true);
select throws_ok(
  $$select public.submit_work_report('rencana', 'Follow up calon pembeli.')$$,
  '22023', 'Clock in dulu sebelum mengisi rencana.', 'rencana ditolak sebelum clock in'
);
reset role;

-- Clock in hari ini (langsung sebagai superuser, jalur fungsi absensi diuji di 07).
insert into public.attendance_records (user_id, work_date, clock_in_at, clock_in_lat, clock_in_lng, clock_in_photo_path)
values
  ('00000000-0000-4000-8000-000000000902', private.today_wib(), now(), 0, 0, 'x'),
  ('00000000-0000-4000-8000-000000000903', private.today_wib(), now(), 0, 0, 'y');

set local role authenticated;
select set_config('request.jwt.claims', '{"sub": "00000000-0000-4000-8000-000000000902", "role": "authenticated"}', true);
select throws_ok(
  $$select public.submit_work_report('rencana', 'pendek')$$,
  '22023', 'Tulis minimal 10 karakter.', 'isi terlalu pendek ditolak'
);
select throws_ok(
  $$select public.submit_work_report('rencana', 'Follow up calon pembeli.',
    '[{"path": "00000000-0000-4000-8000-000000000903/2026-01-01/b.pdf", "name": "b.pdf", "type": "application/pdf", "size": 10}]')$$,
  '22023', 'Lampiran tidak ditemukan. Unggah ulang.', 'lampiran milik karyawan lain ditolak'
);
select lives_ok(
  $$select public.submit_work_report('rencana', 'Follow up calon pembeli.',
    '[{"path": "00000000-0000-4000-8000-000000000902/2026-01-01/a.webp", "name": "a.webp", "type": "image/webp", "size": 10}]')$$,
  'rencana tersimpan setelah clock in'
);
select lives_ok(
  $$select public.submit_work_report('rencana', 'Follow up 5 calon pembeli.')$$,
  'rencana bisa diperbarui di hari yang sama'
);
select is(
  (select row(content, jsonb_array_length(attachments))::text from public.work_reports where kind = 'rencana'),
  '("Follow up 5 calon pembeli.",0)',
  'satu baris rencana per hari, isi terbaru'
);
select throws_ok(
  $$select public.submit_work_report('hasil', 'Tiga calon pembeli dihubungi.')$$,
  '22023', 'Clock out dulu sebelum mengisi hasil kerja.', 'hasil ditolak sebelum clock out'
);
select throws_ok(
  $$insert into public.work_reports (user_id, work_date, kind, content)
    values ('00000000-0000-4000-8000-000000000902', '2026-01-02', 'rencana', 'Tulis langsung ke tabel.')$$,
  '42501', null, 'laporan tidak bisa ditulis langsung, hanya lewat fungsi'
);
reset role;

update public.attendance_records set clock_out_at = now(), clock_out_lat = 0, clock_out_lng = 0, clock_out_photo_path = 'z'
where user_id = '00000000-0000-4000-8000-000000000902';

set local role authenticated;
select set_config('request.jwt.claims', '{"sub": "00000000-0000-4000-8000-000000000902", "role": "authenticated"}', true);
select lives_ok(
  $$select public.submit_work_report('hasil', 'Tiga calon pembeli dihubungi.')$$,
  'hasil tersimpan setelah clock out'
);
select is((select count(*)::integer from public.work_reports), 2, 'pemilik membaca laporannya sendiri');
reset role;

-- Karyawan lain tidak membaca laporan orang lain. Owner membaca semua, tapi tidak membuat laporan.
set local role authenticated;
select set_config('request.jwt.claims', '{"sub": "00000000-0000-4000-8000-000000000903", "role": "authenticated"}', true);
select is((select count(*)::integer from public.work_reports), 0, 'karyawan lain tidak membaca laporan');
reset role;

set local role authenticated;
select set_config('request.jwt.claims', '{"sub": "00000000-0000-4000-8000-000000000901", "role": "authenticated"}', true);
select ok((select count(*) from public.work_reports) >= 2, 'owner membaca semua laporan');
select throws_ok(
  $$select public.submit_work_report('rencana', 'Owner tidak wajib laporan.')$$,
  '42501', null, 'owner tidak memakai laporan harian'
);
reset role;

select * from finish();
rollback;
