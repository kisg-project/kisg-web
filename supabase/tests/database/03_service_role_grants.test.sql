-- service_role punya hak penuh di tabel public (migrasi 20261121000150), anon tidak bisa menulis.
begin;
create extension if not exists pgtap with schema extensions;
select plan(4);

select ok(has_table_privilege('service_role', 'public.profiles', 'UPDATE'), 'service_role bisa mengubah profil');
select ok(has_table_privilege('service_role', 'public.user_roles', 'INSERT'), 'service_role bisa memberi role');
select ok(has_function_privilege('service_role', 'public.rate_limit_hit(text, integer, integer)', 'EXECUTE'), 'service_role memanggil rate limit');
select ok(not has_table_privilege('anon', 'public.user_roles', 'INSERT'), 'anon tetap tidak bisa menulis role');

select * from finish();
rollback;
