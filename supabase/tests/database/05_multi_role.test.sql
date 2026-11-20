-- Multi role (rangkap jabatan): akses gabungan, satu role utama, dan aturan role owner.
begin;
create extension if not exists pgtap with schema extensions;
select plan(14);

insert into auth.users (id, email) values
  ('00000000-0000-4000-8000-000000000501', 'owner-mr@kis.test'),
  ('00000000-0000-4000-8000-000000000502', 'admin-mr@kis.test'),
  ('00000000-0000-4000-8000-000000000503', 'rangkap@kis.test');

insert into public.user_roles (user_id, role) values
  ('00000000-0000-4000-8000-000000000501', 'owner'),
  ('00000000-0000-4000-8000-000000000502', 'admin'),
  ('00000000-0000-4000-8000-000000000503', 'marketing');

-- Owner memberi dua role: keuangan (utama) dan marketing --------------------
set local role authenticated;
select set_config('request.jwt.claims', '{"sub": "00000000-0000-4000-8000-000000000501", "role": "authenticated"}', true);
select lives_ok(
  $$select public.set_user_roles('00000000-0000-4000-8000-000000000503', array['finance', 'marketing']::public.app_role[], 'finance')$$,
  'owner bisa memberi dua role sekaligus'
);
select throws_ok(
  $$select public.set_user_roles('00000000-0000-4000-8000-000000000503', array['marketing']::public.app_role[], 'finance')$$,
  '22023', null, 'role utama harus termasuk role yang dipilih'
);
select throws_ok(
  $$select public.set_user_roles('00000000-0000-4000-8000-000000000503', array[]::public.app_role[], 'finance')$$,
  '22023', null, 'minimal satu role'
);
select throws_ok(
  $$select public.set_user_roles('00000000-0000-4000-8000-000000000501', array['finance']::public.app_role[], 'finance')$$,
  '42501', null, 'owner tidak bisa mencabut role owner miliknya sendiri'
);
reset role;

select is(
  (select array_agg(role order by role)::text from public.user_roles where user_id = '00000000-0000-4000-8000-000000000503'),
  '{marketing,finance}',
  'akun rangkap punya dua baris role'
);
select is(
  (select role::text from public.user_roles where user_id = '00000000-0000-4000-8000-000000000503' and is_primary),
  'finance',
  'tepat satu role utama'
);
select throws_ok(
  $$insert into public.user_roles (user_id, role, is_primary) values ('00000000-0000-4000-8000-000000000503', 'site_manager', true)$$,
  '23505', null, 'tidak boleh dua role utama'
);
select is(
  (public.custom_access_token_hook(
    '{"user_id": "00000000-0000-4000-8000-000000000503", "claims": {}}'::jsonb
  ) -> 'claims' -> 'app_roles'),
  '["finance", "marketing"]'::jsonb,
  'JWT memuat semua role, role utama lebih dulu'
);
select is(
  (public.custom_access_token_hook(
    '{"user_id": "00000000-0000-4000-8000-000000000503", "claims": {}}'::jsonb
  ) -> 'claims' ->> 'app_role'),
  'finance',
  'app_role di JWT adalah role utama'
);

-- Akun rangkap mendapat hak gabungan -----------------------------------------
set local role authenticated;
select set_config('request.jwt.claims', '{"sub": "00000000-0000-4000-8000-000000000503", "role": "authenticated"}', true);
select ok(private.has_role('marketing'), 'hak role marketing berlaku');
select ok(private.has_role('finance'), 'hak role keuangan berlaku');
select ok(not private.has_role('owner', 'admin'), 'tidak mendapat hak owner atau admin');
reset role;

-- Admin tidak bisa menyentuh role owner -------------------------------------
set local role authenticated;
select set_config('request.jwt.claims', '{"sub": "00000000-0000-4000-8000-000000000502", "role": "authenticated"}', true);
select throws_ok(
  $$select public.set_user_roles('00000000-0000-4000-8000-000000000503', array['owner']::public.app_role[], 'owner')$$,
  '42501', null, 'admin tidak bisa memberi role owner'
);
select lives_ok(
  $$select public.set_user_roles('00000000-0000-4000-8000-000000000503', array['marketing']::public.app_role[], 'marketing')$$,
  'admin bisa mengatur role selain owner'
);
reset role;

select * from finish();
rollback;
