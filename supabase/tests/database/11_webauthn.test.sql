-- Sidik jari: satu kunci aktif per akun, hanya server yang menulis, tantangan tertutup untuk client,
-- dan cap persetujuan mencatat metode serta kunci yang dipakai.
begin;
create extension if not exists pgtap with schema extensions;
select plan(10);

insert into auth.users (id, email) values
  ('00000000-0000-4000-8000-000000001101', 'owner-jari@kis.test'),
  ('00000000-0000-4000-8000-000000001102', 'marketing-jari@kis.test'),
  ('00000000-0000-4000-8000-000000001103', 'keuangan-jari@kis.test');
insert into public.user_roles (user_id, role) values
  ('00000000-0000-4000-8000-000000001101', 'owner'),
  ('00000000-0000-4000-8000-000000001102', 'marketing'),
  ('00000000-0000-4000-8000-000000001103', 'finance');

insert into public.webauthn_credentials (user_id, credential_id, public_key) values
  ('00000000-0000-4000-8000-000000001101', 'kunci-owner', 'cHVibGlr'),
  ('00000000-0000-4000-8000-000000001102', 'kunci-marketing', 'cHVibGlr');

select throws_ok(
  $$insert into public.webauthn_credentials (user_id, credential_id, public_key)
    values ('00000000-0000-4000-8000-000000001101', 'kunci-kedua', 'eA')$$,
  '23505', null, 'hanya satu kunci aktif per akun'
);
update public.webauthn_credentials set revoked_at = now() where credential_id = 'kunci-marketing';
select lives_ok(
  $$insert into public.webauthn_credentials (user_id, credential_id, public_key)
    values ('00000000-0000-4000-8000-000000001102', 'kunci-marketing-baru', 'eA')$$,
  'setelah direset, kunci baru bisa didaftarkan'
);

-- Client tidak bisa menulis kunci, dan hanya melihat miliknya sendiri. Owner melihat semua.
set local role authenticated;
select set_config('request.jwt.claims', '{"sub": "00000000-0000-4000-8000-000000001102", "role": "authenticated"}', true);
select throws_ok(
  $$insert into public.webauthn_credentials (user_id, credential_id, public_key)
    values ('00000000-0000-4000-8000-000000001102', 'kunci-palsu', 'eA')$$,
  '42501', null, 'kunci tidak bisa ditulis dari client'
);
select is(
  (select count(*)::integer from public.webauthn_credentials),
  2,
  'marketing hanya melihat kuncinya sendiri (lama dan baru)'
);
select throws_ok($$select count(*) from public.webauthn_challenges$$, '42501', null, 'tantangan tidak bisa dibaca client');
reset role;

set local role authenticated;
select set_config('request.jwt.claims', '{"sub": "00000000-0000-4000-8000-000000001101", "role": "authenticated"}', true);
select ok((select count(*) from public.webauthn_credentials) >= 3, 'owner melihat semua kunci');
reset role;

-- Keputusan dengan sidik jari: kunci harus milik penyetuju dan masih aktif.
insert into public.attendance_exceptions (id, user_id, work_date, kind, lat, lng, reason, photo_path) values
  ('00000000-0000-4000-8000-000000001121', '00000000-0000-4000-8000-000000001103', '2026-01-06', 'masuk', -6.2, 107.0, 'Kunjungan ke bank untuk akad konsumen.', 'a.webp');

set local role service_role;
select throws_ok(
  $$select public.decide_attendance_exception('00000000-0000-4000-8000-000000001101', '00000000-0000-4000-8000-000000001121', 'disetujui', null, null, null, null, 'biometrik', 'kunci-marketing-baru')$$,
  '42501', 'Sidik jari tidak terdaftar untuk akun ini.', 'kunci milik orang lain ditolak'
);
select lives_ok(
  $$select public.decide_attendance_exception('00000000-0000-4000-8000-000000001101', '00000000-0000-4000-8000-000000001121', 'disetujui', null, null, null, null, 'biometrik', 'kunci-owner')$$,
  'owner menyetujui dengan sidik jari terdaftar'
);
reset role;

select is(
  (select row(method, credential_id)::text from public.approval_stamps where doc_id = '00000000-0000-4000-8000-000000001121'),
  '(biometrik,kunci-owner)',
  'cap mencatat metode sidik jari dan kunci yang dipakai'
);
select isnt(
  (select last_used_at from public.webauthn_credentials where credential_id = 'kunci-owner'),
  null,
  'waktu pakai terakhir kunci diperbarui'
);

select * from finish();
rollback;
