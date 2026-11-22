alter table public.work_schedules add column if not exists role public.app_role;

alter table public.work_schedules drop constraint work_schedules_target;
alter table public.work_schedules add constraint work_schedules_target check (
  (scope = 'perusahaan' and work_location_id is null and user_id is null and role is null)
  or (scope = 'lokasi' and work_location_id is not null and user_id is null and role is null)
  or (scope = 'karyawan' and user_id is not null and work_location_id is null and role is null)
  or (scope = 'role' and role is not null and work_location_id is null and user_id is null)
);

create unique index if not exists work_schedules_role on public.work_schedules (role)
  where scope = 'role';

create or replace function private.effective_schedule(p_user uuid, p_location uuid)
returns public.work_schedules
language sql
stable
security definer
set search_path = ''
as $$
  select s.*
  from public.work_schedules s
  left join public.user_roles r on r.user_id = p_user and r.role = s.role
  where (s.scope = 'karyawan' and s.user_id = p_user)
     or (s.scope = 'role' and r.user_id is not null)
     or (s.scope = 'lokasi' and s.work_location_id = p_location)
     or s.scope = 'perusahaan'
  order by
    case s.scope when 'karyawan' then 1 when 'lokasi' then 2 when 'role' then 3 else 4 end,
    r.is_primary desc nulls last
  limit 1
$$;

update public.work_schedules
set start_time = '09:00', end_time = '17:00'
where scope = 'perusahaan';

insert into public.work_schedules (scope, role, start_time, end_time, workdays, late_tolerance_min)
values ('role', 'marketing', '09:00', '17:00', '{1,2,3,4,5,6,7}', 15)
on conflict do nothing;
