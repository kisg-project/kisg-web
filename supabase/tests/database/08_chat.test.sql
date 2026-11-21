-- Chat Jaka: pengunjung tidak punya akses, tim marketing dan owner membaca transkrip, pemakaian
-- token hanya dicatat server.
begin;
create extension if not exists pgtap with schema extensions;
select plan(8);

insert into auth.users (id, email) values
  ('00000000-0000-4000-8000-000000000801', 'owner-chat@kis.test'),
  ('00000000-0000-4000-8000-000000000802', 'marketing-chat@kis.test'),
  ('00000000-0000-4000-8000-000000000803', 'lapangan-chat@kis.test');
insert into public.user_roles (user_id, role) values
  ('00000000-0000-4000-8000-000000000801', 'owner'),
  ('00000000-0000-4000-8000-000000000802', 'marketing'),
  ('00000000-0000-4000-8000-000000000803', 'site_supervisor');

insert into public.chat_sessions (id, ip_hash) values ('00000000-0000-4000-8000-000000000811', 'hash');
insert into public.chat_messages (session_id, role, content) values
  ('00000000-0000-4000-8000-000000000811', 'user', 'Halo'),
  ('00000000-0000-4000-8000-000000000811', 'assistant', 'Halo, saya Jaka.');

select throws_ok(
  $$insert into public.chat_messages (session_id, role, content) values ('00000000-0000-4000-8000-000000000811', 'system', 'x')$$,
  '23514', null, 'peran pesan hanya user atau assistant'
);

-- Pengunjung anonim tidak bisa membaca atau menulis.
set local role anon;
select throws_ok($$select count(*) from public.chat_messages$$, '42501', null, 'anon tidak bisa membaca pesan chat');
select throws_ok(
  $$insert into public.chat_sessions (id, ip_hash) values (gen_random_uuid(), 'x')$$,
  '42501', null, 'anon tidak bisa membuat sesi chat'
);
select throws_ok($$select public.chat_record_usage(10, 10)$$, '42501', null, 'anon tidak bisa mencatat pemakaian');
reset role;

-- Marketing membaca transkrip, petugas lapangan tidak.
set local role authenticated;
select set_config('request.jwt.claims', '{"sub": "00000000-0000-4000-8000-000000000802", "role": "authenticated"}', true);
select is((select count(*)::integer from public.chat_messages), 2, 'marketing membaca transkrip');
reset role;

set local role authenticated;
select set_config('request.jwt.claims', '{"sub": "00000000-0000-4000-8000-000000000803", "role": "authenticated"}', true);
select is((select count(*)::integer from public.chat_messages), 0, 'petugas lapangan tidak membaca transkrip');
select throws_ok($$select public.chat_record_usage(10, 10)$$, '42501', null, 'karyawan tidak bisa mencatat pemakaian');
reset role;

-- Server (service role) mencatat pemakaian secara akumulatif per hari WIB.
set local role service_role;
select public.chat_record_usage(100, 20);
select public.chat_record_usage(50, 5);
reset role;
select is(
  (select row(requests, input_tokens, output_tokens)::text from public.chat_usage_daily where usage_date = private.today_wib()),
  '(2,150,25)',
  'pemakaian bertambah per hari'
);

select * from finish();
rollback;
