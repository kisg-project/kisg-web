create extension if not exists pg_cron with schema pg_catalog;

create table public.crm_settings (
  id boolean primary key default true,
  sla_minutes integer not null default 30,
  updated_at timestamptz not null default now(),
  updated_by uuid references public.profiles (id),
  constraint crm_settings_single check (id),
  constraint crm_settings_sla check (sla_minutes between 5 and 1440)
);
insert into public.crm_settings (id) values (true) on conflict (id) do nothing;

alter table public.leads add column assigned_at timestamptz;
create index leads_queue_idx on public.leads (created_at desc) where owner_id is null and deleted_at is null;
create index leads_sla_idx on public.leads (sla_due_at)
  where owner_id is not null and first_response_at is null and deleted_at is null;

create table public.lead_assignments (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid not null references public.leads (id) on delete cascade,
  from_user_id uuid references public.profiles (id),
  to_user_id uuid references public.profiles (id),
  reason public.lead_assignment_reason not null,
  actor_id uuid references public.profiles (id),
  created_at timestamptz not null default now()
);
create index lead_assignments_lead_idx on public.lead_assignments (lead_id, created_at desc);

create table public.lead_rotation (
  user_id uuid primary key references public.profiles (id) on delete cascade,
  last_assigned_at timestamptz not null default now()
);

alter table public.crm_settings enable row level security;
alter table public.lead_assignments enable row level security;
alter table public.lead_rotation enable row level security;
revoke all on public.crm_settings, public.lead_assignments, public.lead_rotation from anon, authenticated;
grant select on public.crm_settings, public.lead_assignments to authenticated;
grant all on public.crm_settings, public.lead_assignments, public.lead_rotation to service_role;

create policy "pengaturan crm: dibaca staf"
  on public.crm_settings for select to authenticated
  using (private.has_role('owner', 'admin', 'marketing_manager', 'marketing', 'finance'));

create policy "riwayat pembagian lead: mengikuti akses lead"
  on public.lead_assignments for select to authenticated
  using (exists (select 1 from public.leads l where l.id = lead_assignments.lead_id));

create policy "rotasi lead: tidak bisa diakses client"
  on public.lead_rotation for all to authenticated
  using (false) with check (false);

drop policy "lead: sesuai role" on public.leads;
drop policy "lead: diubah sesuai role" on public.leads;

create policy "lead: sesuai role"
  on public.leads for select to authenticated
  using (
    deleted_at is null
    and (
      private.has_role('owner', 'admin')
      or (
        private.has_role('marketing_manager')
        and (owner_id is null or owner_id = (select auth.uid()) or private.in_same_team(owner_id))
      )
      or (private.has_role('marketing') and owner_id = (select auth.uid()))
    )
  );

create policy "lead: diubah sesuai role"
  on public.leads for update to authenticated
  using (
    deleted_at is null
    and (
      private.has_role('owner', 'admin')
      or (
        private.has_role('marketing_manager')
        and (owner_id is null or owner_id = (select auth.uid()) or private.in_same_team(owner_id))
      )
      or (private.has_role('marketing') and owner_id = (select auth.uid()))
    )
  )
  with check (deleted_at is null);

revoke update on public.leads from authenticated;
grant update (full_name, email, project_id, unit_type_id, stage, note, lost_reason, last_activity_at)
  on public.leads to authenticated;

create or replace function private.pick_marketing(p_project uuid)
returns uuid
language sql
stable
security definer
set search_path = ''
as $$
  with restricted as (
    select exists (
      select 1 from public.project_assignments pa
      where pa.project_id = p_project and pa.role_on_project = 'marketing'
    ) as active
  ),
  pool as (
    select distinct r.user_id
    from public.user_roles r
    join public.profiles p on p.id = r.user_id and p.is_active and p.deleted_at is null
    cross join restricted
    where r.role = 'marketing'
      and not exists (
        select 1 from public.team_members t where t.user_id = r.user_id and not t.receives_leads
      )
      and (
        not restricted.active
        or exists (
          select 1 from public.project_assignments pa
          where pa.project_id = p_project and pa.user_id = r.user_id and pa.role_on_project = 'marketing'
        )
      )
  ),
  on_duty as (
    select pool.user_id
    from pool
    join public.attendance_records a
      on a.user_id = pool.user_id
      and a.work_date = (now() at time zone 'Asia/Jakarta')::date
      and a.clock_out_at is null
    cross join lateral private.effective_schedule(pool.user_id, a.clock_in_location_id) s
    where extract(isodow from now() at time zone 'Asia/Jakarta')::integer = any (s.workdays)
      and (now() at time zone 'Asia/Jakarta')::time between s.start_time and s.end_time
  )
  select d.user_id
  from on_duty d
  left join public.lead_rotation lr on lr.user_id = d.user_id
  order by lr.last_assigned_at asc nulls first, d.user_id
  limit 1;
$$;

create or replace function private.assign_new_lead()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user uuid;
  v_team uuid;
  v_sla integer;
begin
  if new.owner_id is not null then
    insert into public.lead_assignments (lead_id, to_user_id, reason, actor_id)
    values (new.id, new.owner_id, 'dibuat_sendiri', new.owner_id);
    return null;
  end if;

  perform pg_advisory_xact_lock(hashtextextended('lead-rotation', 0));
  v_user := private.pick_marketing(new.project_id);
  if v_user is null then
    insert into public.lead_assignments (lead_id, reason) values (new.id, 'tanpa_marketing');
    return null;
  end if;

  select sla_minutes into v_sla from public.crm_settings where id;
  select team_id into v_team from public.team_members where user_id = v_user;
  update public.leads
  set owner_id = v_user,
      team_id = coalesce(v_team, team_id),
      assigned_at = now(),
      sla_due_at = now() + make_interval(mins => coalesce(v_sla, 30))
  where id = new.id;
  insert into public.lead_assignments (lead_id, to_user_id, reason) values (new.id, v_user, 'giliran');
  insert into public.lead_rotation (user_id, last_assigned_at) values (v_user, now())
  on conflict (user_id) do update set last_assigned_at = excluded.last_assigned_at;
  return null;
end;
$$;

create trigger assign_new_lead after insert on public.leads
  for each row execute function private.assign_new_lead();

create or replace function private.lead_first_response()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.stage is distinct from old.stage
     and new.first_response_at is null
     and new.owner_id is not null
     and new.owner_id = (select auth.uid()) then
    new.first_response_at := now();
    new.sla_due_at := null;
  end if;
  return new;
end;
$$;

create trigger lead_first_response before update of stage on public.leads
  for each row execute function private.lead_first_response();

create or replace function private.activity_first_response()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.leads
  set first_response_at = coalesce(first_response_at, new.occurred_at),
      sla_due_at = case when first_response_at is null then null else sla_due_at end,
      last_activity_at = greatest(last_activity_at, new.occurred_at)
  where id = new.lead_id and owner_id = new.actor_id;
  return null;
end;
$$;

create trigger activity_first_response after insert on public.lead_activities
  for each row when (new.actor_id is not null and new.type <> 'sistem')
  execute function private.activity_first_response();

create or replace function public.reassign_lead(p_lead uuid, p_to uuid default null)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor uuid := (select auth.uid());
  v_lead public.leads;
  v_team uuid;
  v_sla integer;
begin
  if v_actor is null or not private.has_role('owner', 'admin', 'marketing_manager') then
    raise exception 'Hanya manajer marketing atau Direktur Utama yang bisa memindahkan lead.'
      using errcode = '42501';
  end if;
  select * into v_lead from public.leads where id = p_lead and deleted_at is null for update;
  if v_lead.id is null then
    raise exception 'Lead tidak ditemukan.' using errcode = '22023';
  end if;
  if not private.has_role('owner', 'admin')
     and not (
       v_lead.owner_id is null or v_lead.owner_id = v_actor or private.in_same_team(v_lead.owner_id)
     ) then
    raise exception 'Lead ini bukan milik tim Anda.' using errcode = '42501';
  end if;
  if p_to is not null and not exists (
    select 1
    from public.user_roles r
    join public.profiles p on p.id = r.user_id and p.is_active and p.deleted_at is null
    where r.user_id = p_to and r.role in ('marketing', 'marketing_manager')
  ) then
    raise exception 'Pilih marketing yang masih aktif.' using errcode = '22023';
  end if;
  if p_to is not distinct from v_lead.owner_id then
    return;
  end if;

  select team_id into v_team from public.team_members where user_id = p_to;
  select sla_minutes into v_sla from public.crm_settings where id;
  update public.leads
  set owner_id = p_to,
      team_id = case when p_to is null then null else v_team end,
      assigned_at = case when p_to is null then null else now() end,
      sla_due_at = case
        when p_to is null or first_response_at is not null then null
        else now() + make_interval(mins => coalesce(v_sla, 30))
      end
  where id = p_lead;
  insert into public.lead_assignments (lead_id, from_user_id, to_user_id, reason, actor_id)
  values (p_lead, v_lead.owner_id, p_to, 'manual', v_actor);
end;
$$;

revoke all on function public.reassign_lead(uuid, uuid) from public, anon;
grant execute on function public.reassign_lead(uuid, uuid) to authenticated, service_role;

create or replace function public.crm_sla_sweep()
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_lead record;
  v_count integer := 0;
begin
  for v_lead in
    select l.id, l.owner_id, l.full_name
    from public.leads l
    where l.deleted_at is null
      and l.owner_id is not null
      and l.first_response_at is null
      and l.sla_due_at is not null
      and l.sla_due_at < now()
    for update skip locked
  loop
    update public.leads
    set owner_id = null, team_id = null, assigned_at = null, sla_due_at = null
    where id = v_lead.id;
    insert into public.lead_assignments (lead_id, from_user_id, reason)
    values (v_lead.id, v_lead.owner_id, 'sla_lewat');
    insert into public.notifications (user_id, kind, title, body, href, dedupe_key)
    select target.user_id,
           'lead_sla_lewat',
           left('Lead belum direspons: ' || v_lead.full_name, 120),
           'Lead kembali ke antrean manajer.',
           '/portal/crm/' || v_lead.id::text,
           'lead-sla:' || v_lead.id::text || ':' || floor(extract(epoch from now()))::bigint::text
    from (
      select r.user_id
      from public.user_roles r
      join public.profiles p on p.id = r.user_id and p.is_active and p.deleted_at is null
      where r.role in ('owner', 'marketing_manager')
      union
      select v_lead.owner_id
    ) target
    on conflict (user_id, dedupe_key) do nothing;
    v_count := v_count + 1;
  end loop;
  return v_count;
end;
$$;

revoke all on function public.crm_sla_sweep() from public, anon, authenticated;
grant execute on function public.crm_sla_sweep() to service_role;

create or replace function public.crm_managers()
returns setof uuid
language sql
stable
security definer
set search_path = ''
as $$
  select distinct r.user_id
  from public.user_roles r
  join public.profiles p on p.id = r.user_id and p.is_active and p.deleted_at is null
  where r.role in ('owner', 'marketing_manager');
$$;

revoke all on function public.crm_managers() from public, anon, authenticated;
grant execute on function public.crm_managers() to service_role;

create trigger audit after insert or update or delete on public.crm_settings
  for each row execute function private.audit_row();

do $$
declare
  target text;
begin
  foreach target in array array['leads', 'lead_activities', 'lead_assignments', 'crm_settings']
  loop
    if not exists (
      select 1 from pg_publication_tables
      where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = target
    ) then
      execute format('alter publication supabase_realtime add table public.%I', target);
    end if;
  end loop;
end
$$;

select cron.schedule('crm-sla-sweep', '* * * * *', 'select public.crm_sla_sweep()');
