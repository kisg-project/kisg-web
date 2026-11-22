do $$
declare
  target text;
begin
  foreach target in array array[
    'attendance_records',
    'attendance_exceptions',
    'work_reports',
    'work_locations',
    'work_schedules',
    'profiles',
    'user_roles',
    'approval_stamps'
  ]
  loop
    if not exists (
      select 1
      from pg_publication_tables
      where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = target
    ) then
      execute format('alter publication supabase_realtime add table public.%I', target);
    end if;
  end loop;
end
$$;
