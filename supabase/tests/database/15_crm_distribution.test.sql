begin;
create extension if not exists pgtap with schema extensions;
select plan(20);

insert into auth.users (id, email) values
  ('00000000-0000-4000-8000-000000001501', 'marketing-a@kis.test'),
  ('00000000-0000-4000-8000-000000001502', 'marketing-b@kis.test'),
  ('00000000-0000-4000-8000-000000001503', 'marketing-c@kis.test'),
  ('00000000-0000-4000-8000-000000001504', 'manajer@kis.test'),
  ('00000000-0000-4000-8000-000000001505', 'owner-crm@kis.test');
insert into public.user_roles (user_id, role) values
  ('00000000-0000-4000-8000-000000001501', 'marketing'),
  ('00000000-0000-4000-8000-000000001502', 'marketing'),
  ('00000000-0000-4000-8000-000000001503', 'marketing'),
  ('00000000-0000-4000-8000-000000001504', 'marketing_manager'),
  ('00000000-0000-4000-8000-000000001505', 'owner');
insert into public.teams (id, name, kind) values
  ('00000000-0000-4000-8000-000000001511', 'Tim uji CRM', 'marketing');
insert into public.team_members (team_id, user_id) values
  ('00000000-0000-4000-8000-000000001511', '00000000-0000-4000-8000-000000001501'),
  ('00000000-0000-4000-8000-000000001511', '00000000-0000-4000-8000-000000001504');

insert into public.work_schedules (scope, user_id, start_time, end_time, workdays, late_tolerance_min)
select 'karyawan', u, '00:00', '23:59:59', '{1,2,3,4,5,6,7}', 0
from unnest(array[
  '00000000-0000-4000-8000-000000001501'::uuid,
  '00000000-0000-4000-8000-000000001502'::uuid,
  '00000000-0000-4000-8000-000000001503'::uuid
]) as u;

insert into public.attendance_records (user_id, work_date, clock_in_at, clock_in_lat, clock_in_lng, clock_in_photo_path)
select u, (now() at time zone 'Asia/Jakarta')::date, now(), -6.2, 107.0, 'uji.webp'
from unnest(array[
  '00000000-0000-4000-8000-000000001501'::uuid,
  '00000000-0000-4000-8000-000000001502'::uuid
]) as u;

insert into public.projects (id, slug, name) values
  ('00000000-0000-4000-8000-000000001521', 'uji-crm-b', 'Proyek uji B'),
  ('00000000-0000-4000-8000-000000001522', 'uji-crm-c', 'Proyek uji C');
insert into public.project_assignments (project_id, user_id, role_on_project) values
  ('00000000-0000-4000-8000-000000001521', '00000000-0000-4000-8000-000000001502', 'marketing'),
  ('00000000-0000-4000-8000-000000001522', '00000000-0000-4000-8000-000000001503', 'marketing');

insert into public.leads (id, full_name, phone, source_kind) values
  ('00000000-0000-4000-8000-000000001531', 'Lead satu', '+6281200001531', 'website');
insert into public.leads (id, full_name, phone, source_kind) values
  ('00000000-0000-4000-8000-000000001532', 'Lead dua', '+6281200001532', 'website');
insert into public.leads (id, full_name, phone, source_kind, project_id) values
  ('00000000-0000-4000-8000-000000001533', 'Lead proyek B', '+6281200001533', 'website', '00000000-0000-4000-8000-000000001521');
insert into public.leads (id, full_name, phone, source_kind, project_id) values
  ('00000000-0000-4000-8000-000000001534', 'Lead proyek C', '+6281200001534', 'website', '00000000-0000-4000-8000-000000001522');
insert into public.leads (id, full_name, phone, source_kind, owner_id) values
  ('00000000-0000-4000-8000-000000001535', 'Lead input sendiri', '+6281200001535', 'walk_in', '00000000-0000-4000-8000-000000001503');

select is(
  (select owner_id from public.leads where id = '00000000-0000-4000-8000-000000001531'),
  '00000000-0000-4000-8000-000000001501'::uuid,
  'lead pertama ke marketing yang bertugas'
);
select is(
  (select owner_id from public.leads where id = '00000000-0000-4000-8000-000000001532'),
  '00000000-0000-4000-8000-000000001502'::uuid,
  'lead berikutnya bergiliran ke marketing lain'
);
select is(
  (select owner_id from public.leads where id = '00000000-0000-4000-8000-000000001533'),
  '00000000-0000-4000-8000-000000001502'::uuid,
  'lead proyek hanya ke marketing proyek itu'
);
select is(
  (select owner_id from public.leads where id = '00000000-0000-4000-8000-000000001534'),
  null,
  'marketing proyek belum clock in: lead masuk antrean manajer'
);
select is(
  (select reason from public.lead_assignments where lead_id = '00000000-0000-4000-8000-000000001534'),
  'tanpa_marketing'::public.lead_assignment_reason,
  'riwayat mencatat alasan antrean'
);
select ok(
  (select sla_due_at between now() + interval '29 minutes' and now() + interval '31 minutes'
   from public.leads where id = '00000000-0000-4000-8000-000000001531'),
  'batas respons 30 menit dari pembagian'
);
select is(
  (select row(owner_id, reason)::text from public.leads l
   join public.lead_assignments a on a.lead_id = l.id
   where l.id = '00000000-0000-4000-8000-000000001535'),
  '(00000000-0000-4000-8000-000000001503,dibuat_sendiri)',
  'lead input marketing tetap miliknya'
);

set local role authenticated;
select set_config('request.jwt.claims', '{"sub": "00000000-0000-4000-8000-000000001501", "role": "authenticated"}', true);
select is(
  (select array_agg(full_name order by full_name) from public.leads),
  array['Lead satu'],
  'marketing hanya melihat lead miliknya'
);
select throws_ok(
  $$update public.leads set owner_id = '00000000-0000-4000-8000-000000001502' where id = '00000000-0000-4000-8000-000000001531'$$,
  '42501', null, 'marketing tidak bisa memindahkan lead sendiri'
);
select lives_ok(
  $$update public.leads set stage = 'dihubungi' where id = '00000000-0000-4000-8000-000000001531'$$,
  'marketing mengubah tahap lead miliknya'
);
select throws_ok(
  $$select public.reassign_lead('00000000-0000-4000-8000-000000001531', '00000000-0000-4000-8000-000000001502')$$,
  '42501', null, 'marketing tidak bisa memakai pemindahan lead'
);
reset role;

select ok(
  (select first_response_at is not null and sla_due_at is null
   from public.leads where id = '00000000-0000-4000-8000-000000001531'),
  'perubahan tahap oleh pemilik dihitung sebagai respons pertama'
);

set local role authenticated;
select set_config('request.jwt.claims', '{"sub": "00000000-0000-4000-8000-000000001504", "role": "authenticated"}', true);
select is(
  (select array_agg(full_name order by full_name) from public.leads),
  array['Lead proyek C', 'Lead satu'],
  'manajer melihat antrean dan lead timnya, bukan lead tim lain'
);
select lives_ok(
  $$select public.reassign_lead('00000000-0000-4000-8000-000000001534', '00000000-0000-4000-8000-000000001501')$$,
  'manajer membagikan lead dari antrean'
);
select throws_ok(
  $$select public.reassign_lead('00000000-0000-4000-8000-000000001532', '00000000-0000-4000-8000-000000001501')$$,
  '42501', null, 'manajer tidak bisa mengambil lead tim lain'
);
select throws_ok(
  $$select public.crm_sla_sweep()$$,
  '42501', null, 'pemeriksaan batas respons hanya dari server'
);
reset role;

select is(
  (select row(owner_id, reason, actor_id)::text from public.leads l
   join public.lead_assignments a on a.lead_id = l.id and a.reason = 'manual'
   where l.id = '00000000-0000-4000-8000-000000001534'),
  '(00000000-0000-4000-8000-000000001501,manual,00000000-0000-4000-8000-000000001504)',
  'pemindahan tercatat dengan pelakunya'
);

update public.leads set sla_due_at = now() - interval '1 minute'
where id = '00000000-0000-4000-8000-000000001532';
select is(public.crm_sla_sweep(), 1, 'satu lead lewat batas respons');
select ok(
  (select owner_id is null from public.leads where id = '00000000-0000-4000-8000-000000001532')
  and exists (
    select 1 from public.notifications
    where user_id = '00000000-0000-4000-8000-000000001504' and kind = 'lead_sla_lewat'
  ),
  'lead kembali ke antrean dan manajer diberi tahu'
);

select is(
  (select count(*)::integer from cron.job where jobname = 'crm-sla-sweep'),
  1,
  'pemeriksaan batas respons terjadwal tiap menit'
);

select * from finish();
rollback;
