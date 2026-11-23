begin;
create extension if not exists pgtap with schema extensions;
select plan(14);

insert into auth.users (id, email) values
  ('00000000-0000-4000-8000-000000001601', 'owner-jabatan@kis.test'),
  ('00000000-0000-4000-8000-000000001602', 'manajer-keuangan@kis.test'),
  ('00000000-0000-4000-8000-000000001603', 'akuntansi@kis.test'),
  ('00000000-0000-4000-8000-000000001604', 'kasir@kis.test'),
  ('00000000-0000-4000-8000-000000001605', 'cms-jabatan@kis.test');
insert into public.user_roles (user_id, role) values
  ('00000000-0000-4000-8000-000000001601', 'owner'),
  ('00000000-0000-4000-8000-000000001602', 'finance_manager'),
  ('00000000-0000-4000-8000-000000001603', 'finance'),
  ('00000000-0000-4000-8000-000000001605', 'cms');

select is(
  (select count(*)::integer from public.positions where deleted_at is null),
  28,
  'struktur standar KIS tersedia'
);
select is(
  (select pos.code from public.position_holders h join public.positions pos on pos.id = h.position_id
   where h.user_id = '00000000-0000-4000-8000-000000001602' and h.ended_at is null),
  'manajer_keuangan',
  'role baru otomatis memasang jabatan yang sesuai'
);
select is(
  (select count(*)::integer from public.position_holders where user_id = '00000000-0000-4000-8000-000000001605'),
  0,
  'akun CMS tidak masuk struktur jabatan'
);

select ok(
  exists (
    select 1 from private.role_inheritance ri join public.positions pos on pos.id = ri.position_id
    where ri.user_id = '00000000-0000-4000-8000-000000001602' and pos.code = 'kasir' and ri.role = 'cashier'
  ),
  'kasir kosong: tugasnya dipegang manajer keuangan'
);
select ok(
  not exists (
    select 1 from private.role_inheritance ri join public.positions pos on pos.id = ri.position_id
    where ri.user_id = '00000000-0000-4000-8000-000000001603' and pos.code = 'kasir'
  ),
  'staf setingkat tidak ikut memegang tugas kasir'
);
select ok(
  exists (
    select 1 from private.role_inheritance ri join public.positions pos on pos.id = ri.position_id
    where ri.user_id = '00000000-0000-4000-8000-000000001601' and pos.code = 'general_manager'
  ),
  'general manager kosong: tugasnya naik ke Direktur Utama'
);

set local role authenticated;
select set_config('request.jwt.claims', '{"sub": "00000000-0000-4000-8000-000000001602", "role": "authenticated"}', true);
select ok('cashier' = any (private.my_roles()), 'hak akses manajer keuangan termasuk tugas kasir');
select ok(
  exists (select 1 from public.my_inherited_duties() where position_title = 'Kasir'),
  'beranda menampilkan tugas kasir yang dipegang'
);
select ok((select count(*) from public.positions) > 0, 'staf bisa membaca struktur organisasi');
select throws_ok(
  $$insert into public.position_holders (position_id, user_id) select id, '00000000-0000-4000-8000-000000001602' from public.positions where code = 'kasir'$$,
  '42501', null, 'struktur jabatan hanya diubah lewat server'
);
reset role;

update public.positions
set delegate_to_id = (select id from public.positions where code = 'staf_akuntansi')
where code = 'kasir';
select ok(
  exists (
    select 1 from private.role_inheritance ri join public.positions pos on pos.id = ri.position_id
    where ri.user_id = '00000000-0000-4000-8000-000000001603' and pos.code = 'kasir'
  )
  and not exists (
    select 1 from private.role_inheritance ri join public.positions pos on pos.id = ri.position_id
    where ri.user_id = '00000000-0000-4000-8000-000000001602' and pos.code = 'kasir'
  ),
  'pelimpahan khusus: kasir kosong dipegang staf akuntansi'
);

insert into public.user_roles (user_id, role) values ('00000000-0000-4000-8000-000000001604', 'cashier');
select ok(
  not exists (
    select 1 from private.role_inheritance ri join public.positions pos on pos.id = ri.position_id
    where pos.code = 'kasir'
  ),
  'jabatan terisi: tidak ada lagi pelimpahan'
);

delete from public.user_roles where user_id = '00000000-0000-4000-8000-000000001604' and role = 'cashier';
select isnt(
  (select ended_at from public.position_holders h join public.positions pos on pos.id = h.position_id
   where h.user_id = '00000000-0000-4000-8000-000000001604' and pos.code = 'kasir'),
  null,
  'role dicabut: jabatannya ikut dilepas'
);

update public.profiles set is_active = false where id = '00000000-0000-4000-8000-000000001603';
select ok(
  exists (
    select 1 from private.role_inheritance ri join public.positions pos on pos.id = ri.position_id
    where ri.user_id = '00000000-0000-4000-8000-000000001602' and pos.code = 'staf_akuntansi'
  ),
  'pemegang nonaktif: tugasnya naik ke atasan'
);

select * from finish();
rollback;
