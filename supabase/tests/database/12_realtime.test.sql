begin;
select plan(9);

select ok(
  exists (select 1 from pg_publication where pubname = 'supabase_realtime'),
  'publikasi supabase_realtime ada'
);

select ok(
  exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = t
  ),
  format('%s disiarkan realtime', t)
)
from unnest(array[
  'attendance_records',
  'attendance_exceptions',
  'work_reports',
  'work_locations',
  'work_schedules',
  'profiles',
  'user_roles',
  'approval_stamps'
]) as t;

select * from finish();
rollback;
