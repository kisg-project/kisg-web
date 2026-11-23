create table public.departments (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  name text not null,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references auth.users (id),
  deleted_at timestamptz
);

create table public.positions (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  title text not null,
  department_id uuid not null references public.departments (id),
  level smallint not null,
  parent_id uuid references public.positions (id),
  default_role public.app_role not null,
  delegate_to_id uuid references public.positions (id),
  sort_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references auth.users (id),
  deleted_at timestamptz,
  constraint positions_level check (level between 1 and 6),
  constraint positions_parent_not_self check (parent_id is distinct from id),
  constraint positions_delegate_not_self check (delegate_to_id is distinct from id),
  constraint positions_root check ((parent_id is null) = (code = 'direktur_utama')),
  constraint positions_role_portal check (default_role <> 'cms')
);
create index positions_parent_idx on public.positions (parent_id);

create table public.position_holders (
  id uuid primary key default gen_random_uuid(),
  position_id uuid not null references public.positions (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  started_at date not null default ((now() at time zone 'Asia/Jakarta')::date),
  ended_at date,
  created_at timestamptz not null default now(),
  created_by uuid references auth.users (id),
  constraint position_holders_dates check (ended_at is null or ended_at >= started_at)
);
create unique index position_holders_active on public.position_holders (position_id, user_id)
  where ended_at is null;
create index position_holders_user_idx on public.position_holders (user_id) where ended_at is null;

create table private.role_inheritance (
  user_id uuid not null references public.profiles (id) on delete cascade,
  role public.app_role not null,
  position_id uuid not null references public.positions (id) on delete cascade,
  primary key (user_id, role, position_id)
);

alter table public.departments enable row level security;
alter table public.positions enable row level security;
alter table public.position_holders enable row level security;
revoke all on public.departments, public.positions, public.position_holders from anon, authenticated;
grant select on public.departments, public.positions, public.position_holders to authenticated;
grant all on public.departments, public.positions, public.position_holders to service_role;

create or replace function private.is_staff()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.user_roles r
    join public.profiles p on p.id = r.user_id and p.is_active and p.deleted_at is null
    where r.user_id = (select auth.uid()) and r.role <> 'cms'
  )
$$;

create policy "departemen: dibaca staf" on public.departments for select to authenticated
  using (deleted_at is null and private.is_staff());
create policy "jabatan: dibaca staf" on public.positions for select to authenticated
  using (deleted_at is null and private.is_staff());
create policy "pemegang jabatan: dibaca staf" on public.position_holders for select to authenticated
  using (private.is_staff());

create or replace function private.today_wib()
returns date
language sql
stable
set search_path = ''
as $$
  select (now() at time zone 'Asia/Jakarta')::date
$$;

create or replace function private.resolve_position(p_position uuid)
returns setof uuid
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_current uuid := p_position;
  v_seen uuid[] := '{}';
  v_parent uuid;
  v_delegate uuid;
begin
  while v_current is not null and not (v_current = any (v_seen)) loop
    v_seen := v_seen || v_current;
    return query
      select h.user_id
      from public.position_holders h
      join public.profiles p on p.id = h.user_id and p.is_active and p.deleted_at is null
      where h.position_id = v_current
        and h.ended_at is null
        and h.started_at <= private.today_wib();
    if found then
      return;
    end if;
    select pos.parent_id, pos.delegate_to_id into v_parent, v_delegate
    from public.positions pos
    where pos.id = v_current;
    v_current := coalesce(v_delegate, v_parent);
  end loop;
  return query
    select distinct r.user_id
    from public.user_roles r
    join public.profiles p on p.id = r.user_id and p.is_active and p.deleted_at is null
    where r.role = 'owner';
end;
$$;

create or replace function private.position_vacant(p_position uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select not exists (
    select 1
    from public.position_holders h
    join public.profiles p on p.id = h.user_id and p.is_active and p.deleted_at is null
    where h.position_id = p_position and h.ended_at is null and h.started_at <= private.today_wib()
  )
$$;

create or replace function private.refresh_role_inheritance()
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  delete from private.role_inheritance;
  insert into private.role_inheritance (user_id, role, position_id)
  select distinct r.user_id, pos.default_role, pos.id
  from public.positions pos
  cross join lateral private.resolve_position(coalesce(pos.delegate_to_id, pos.parent_id)) as r(user_id)
  where pos.deleted_at is null
    and pos.is_active
    and pos.parent_id is not null
    and private.position_vacant(pos.id)
  on conflict do nothing;
end;
$$;

create or replace function private.refresh_role_inheritance_trigger()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform private.refresh_role_inheritance();
  return null;
end;
$$;

create trigger refresh_role_inheritance after insert or update or delete on public.positions
  for each statement execute function private.refresh_role_inheritance_trigger();
create trigger refresh_role_inheritance after insert or update or delete on public.position_holders
  for each statement execute function private.refresh_role_inheritance_trigger();
create trigger refresh_role_inheritance after insert or update or delete on public.user_roles
  for each statement execute function private.refresh_role_inheritance_trigger();
create trigger refresh_role_inheritance after update of is_active, deleted_at on public.profiles
  for each statement execute function private.refresh_role_inheritance_trigger();

create or replace function private.holder_from_role()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_position uuid;
begin
  if tg_op = 'INSERT' then
    if new.role in ('cms', 'admin') then
      return null;
    end if;
    if exists (
      select 1
      from public.position_holders h
      join public.positions pos on pos.id = h.position_id
      where h.user_id = new.user_id and h.ended_at is null and pos.default_role = new.role
    ) then
      return null;
    end if;
    select pos.id into v_position
    from public.positions pos
    where pos.default_role = new.role and pos.deleted_at is null and pos.is_active
    order by pos.level, pos.sort_order
    limit 1;
    if v_position is not null then
      insert into public.position_holders (position_id, user_id, created_by)
      values (v_position, new.user_id, new.created_by);
    end if;
    return null;
  end if;
  update public.position_holders h
  set ended_at = greatest(h.started_at, private.today_wib())
  from public.positions pos
  where pos.id = h.position_id
    and h.user_id = old.user_id
    and h.ended_at is null
    and pos.default_role = old.role;
  return null;
end;
$$;

create trigger holder_from_role after insert or delete on public.user_roles
  for each row execute function private.holder_from_role();

create or replace function private.my_roles()
returns public.app_role[]
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(array_agg(t.role order by t.priority, t.role), '{}')
  from (
    select distinct on (x.role) x.role, x.priority
    from (
      select ur.role, case when ur.is_primary then 0 else 1 end as priority
      from public.user_roles ur
      where ur.user_id = (select auth.uid())
      union all
      select ri.role, 2
      from private.role_inheritance ri
      where ri.user_id = (select auth.uid())
    ) x
    order by x.role, x.priority
  ) t
  where exists (
    select 1 from public.profiles p
    where p.id = (select auth.uid()) and p.is_active and p.deleted_at is null
  )
$$;

create or replace function public.my_inherited_duties()
returns table (role public.app_role, position_title text)
language sql
stable
security definer
set search_path = ''
as $$
  select distinct ri.role, pos.title
  from private.role_inheritance ri
  join public.positions pos on pos.id = ri.position_id
  where ri.user_id = (select auth.uid())
    and ri.role <> 'owner'
    and not exists (
      select 1 from public.user_roles ur where ur.user_id = ri.user_id and ur.role = ri.role
    )
  order by pos.title
$$;

revoke all on function public.my_inherited_duties() from public, anon;
grant execute on function public.my_inherited_duties() to authenticated;

create or replace function public.custom_access_token_hook(event jsonb)
returns jsonb
language plpgsql
stable
set search_path = ''
as $$
declare
  v_user uuid := (event ->> 'user_id')::uuid;
  v_roles public.app_role[];
  v_active boolean;
  v_team uuid;
  claims jsonb := coalesce(event -> 'claims', '{}'::jsonb);
begin
  select (p.is_active and p.deleted_at is null) into v_active
  from public.profiles p
  where p.id = v_user;

  select coalesce(array_agg(t.role order by t.priority, t.role), '{}') into v_roles
  from (
    select distinct on (x.role) x.role, x.priority
    from (
      select ur.role, case when ur.is_primary then 0 else 1 end as priority
      from public.user_roles ur
      where ur.user_id = v_user
      union all
      select ri.role, 2
      from private.role_inheritance ri
      where ri.user_id = v_user
    ) x
    order by x.role, x.priority
  ) t;

  select tm.team_id into v_team from public.team_members tm where tm.user_id = v_user limit 1;

  claims := jsonb_set(claims, '{app_role}', coalesce(to_jsonb(v_roles[1]), 'null'::jsonb));
  claims := jsonb_set(claims, '{app_roles}', to_jsonb(v_roles));
  claims := jsonb_set(claims, '{team_id}', coalesce(to_jsonb(v_team), 'null'::jsonb));
  claims := jsonb_set(claims, '{is_active}', to_jsonb(coalesce(v_active, false)));
  return jsonb_set(event, '{claims}', claims);
end;
$$;

grant select on private.role_inheritance to supabase_auth_admin;
grant usage on schema private to supabase_auth_admin;

create or replace function private.must_attend()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select private.has_role('admin', 'marketing_manager', 'marketing', 'site_manager', 'site_supervisor', 'finance', 'direktur', 'general_manager', 'marketing_supervisor', 'marketing_admin', 'kpr_officer', 'finance_manager', 'cashier', 'collection_staff', 'tax_staff', 'purchasing_staff', 'warehouse_staff', 'project_manager', 'quantity_surveyor', 'drafter', 'qc_staff', 'legal_manager', 'legal_staff', 'hr_manager', 'hr_staff', 'ga_staff', 'customer_service', 'estate_manager', 'auditor')
    and not private.has_role('owner')
$$;

drop policy "lead: sesuai role" on public.leads;
drop policy "lead: diubah sesuai role" on public.leads;

create policy "lead: sesuai role"
  on public.leads for select to authenticated
  using (
    deleted_at is null
    and (
      private.has_role('owner', 'admin', 'direktur', 'general_manager')
      or (
        private.has_role('marketing_manager', 'marketing_supervisor', 'marketing_admin', 'kpr_officer')
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
      private.has_role('owner', 'admin', 'direktur', 'general_manager')
      or (
        private.has_role('marketing_manager', 'marketing_supervisor', 'marketing_admin', 'kpr_officer')
        and (owner_id is null or owner_id = (select auth.uid()) or private.in_same_team(owner_id))
      )
      or (private.has_role('marketing') and owner_id = (select auth.uid()))
    )
  )
  with check (deleted_at is null);

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
  if v_actor is null
     or not private.has_role('owner', 'admin', 'direktur', 'general_manager', 'marketing_manager', 'marketing_supervisor') then
    raise exception 'Hanya manajer marketing atau Direktur Utama yang bisa memindahkan lead.'
      using errcode = '42501';
  end if;
  select * into v_lead from public.leads where id = p_lead and deleted_at is null for update;
  if v_lead.id is null then
    raise exception 'Lead tidak ditemukan.' using errcode = '22023';
  end if;
  if not private.has_role('owner', 'admin', 'direktur', 'general_manager')
     and not (
       v_lead.owner_id is null or v_lead.owner_id = v_actor or private.in_same_team(v_lead.owner_id)
     ) then
    raise exception 'Lead ini bukan milik tim Anda.' using errcode = '42501';
  end if;
  if p_to is not null and not exists (
    select 1
    from public.user_roles r
    join public.profiles p on p.id = r.user_id and p.is_active and p.deleted_at is null
    where r.user_id = p_to and r.role in ('marketing', 'marketing_supervisor', 'marketing_manager')
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
  where r.role in ('owner', 'general_manager', 'marketing_manager', 'marketing_supervisor');
$$;

insert into public.departments (code, name, sort_order) values
  ('direksi', 'Direksi', 1),
  ('marketing', 'Marketing dan penjualan', 2),
  ('keuangan', 'Keuangan dan akuntansi', 3),
  ('pembelian', 'Pembelian dan gudang', 4),
  ('teknik', 'Teknik dan konstruksi', 5),
  ('legal', 'Legal dan perizinan', 6),
  ('hr', 'HR dan umum', 7),
  ('layanan', 'Layanan konsumen dan estate', 8),
  ('sistem', 'Sistem dan audit', 9);

create temporary table seed_positions (
  code text, title text, department text, level smallint, parent text, role public.app_role, sort integer
) on commit drop;
insert into seed_positions values
  ('direktur_utama', 'Direktur Utama', 'direksi', 1, null, 'owner', 1),
  ('general_manager', 'General Manager', 'direksi', 3, 'direktur_utama', 'general_manager', 2),
  ('auditor_internal', 'Auditor Internal', 'sistem', 5, 'direktur_utama', 'auditor', 3),
  ('manajer_marketing', 'Manajer Marketing', 'marketing', 4, 'general_manager', 'marketing_manager', 10),
  ('supervisor_marketing', 'Supervisor Marketing', 'marketing', 5, 'manajer_marketing', 'marketing_supervisor', 11),
  ('marketing', 'Marketing', 'marketing', 6, 'supervisor_marketing', 'marketing', 12),
  ('admin_marketing', 'Admin Marketing', 'marketing', 6, 'manajer_marketing', 'marketing_admin', 13),
  ('kpr_officer', 'KPR Officer', 'marketing', 6, 'manajer_marketing', 'kpr_officer', 14),
  ('manajer_keuangan', 'Manajer Keuangan', 'keuangan', 4, 'general_manager', 'finance_manager', 20),
  ('staf_akuntansi', 'Staf Akuntansi', 'keuangan', 6, 'manajer_keuangan', 'finance', 21),
  ('kasir', 'Kasir', 'keuangan', 6, 'manajer_keuangan', 'cashier', 22),
  ('staf_penagihan', 'Staf Penagihan', 'keuangan', 6, 'manajer_keuangan', 'collection_staff', 23),
  ('staf_pajak', 'Staf Pajak', 'keuangan', 6, 'manajer_keuangan', 'tax_staff', 24),
  ('staf_pembelian', 'Staf Pembelian', 'pembelian', 6, 'manajer_keuangan', 'purchasing_staff', 30),
  ('manajer_proyek', 'Manajer Proyek', 'teknik', 4, 'general_manager', 'project_manager', 40),
  ('site_manager', 'Site Manager', 'teknik', 5, 'manajer_proyek', 'site_manager', 41),
  ('pengawas_lapangan', 'Pengawas Lapangan', 'teknik', 6, 'site_manager', 'site_supervisor', 42),
  ('staf_qc', 'Staf QC', 'teknik', 6, 'site_manager', 'qc_staff', 43),
  ('staf_gudang', 'Staf Gudang', 'pembelian', 6, 'site_manager', 'warehouse_staff', 31),
  ('quantity_surveyor', 'Quantity Surveyor', 'teknik', 6, 'manajer_proyek', 'quantity_surveyor', 44),
  ('drafter', 'Drafter atau Arsitek', 'teknik', 6, 'manajer_proyek', 'drafter', 45),
  ('manajer_legal', 'Manajer Legal', 'legal', 4, 'general_manager', 'legal_manager', 50),
  ('staf_legal', 'Staf Legal dan Perizinan', 'legal', 6, 'manajer_legal', 'legal_staff', 51),
  ('manajer_hr', 'Manajer HR', 'hr', 4, 'general_manager', 'hr_manager', 60),
  ('staf_hr', 'Staf HR', 'hr', 6, 'manajer_hr', 'hr_staff', 61),
  ('staf_ga', 'Staf GA', 'hr', 6, 'manajer_hr', 'ga_staff', 62),
  ('estate_manager', 'Estate Manager', 'layanan', 4, 'general_manager', 'estate_manager', 70),
  ('customer_service', 'Customer Service', 'layanan', 6, 'estate_manager', 'customer_service', 71);

insert into public.positions (code, title, department_id, level, default_role, sort_order)
select s.code, s.title, d.id, s.level, s.role, s.sort
from seed_positions s
join public.departments d on d.code = s.department
where s.parent is null;

insert into public.positions (code, title, department_id, level, default_role, sort_order, parent_id)
select s.code, s.title, d.id, s.level, s.role, s.sort, root.id
from seed_positions s
join public.departments d on d.code = s.department
cross join public.positions root
where root.code = 'direktur_utama' and s.parent is not null;

update public.positions child
set parent_id = parent.id
from seed_positions s
join public.positions parent on parent.code = s.parent
where child.code = s.code and s.parent is not null;

insert into public.position_holders (position_id, user_id, started_at)
select distinct on (r.user_id, pos.id) pos.id, r.user_id, private.today_wib()
from public.user_roles r
join public.positions pos on pos.code = case r.role
  when 'owner' then 'direktur_utama'
  when 'marketing_manager' then 'manajer_marketing'
  when 'marketing' then 'marketing'
  when 'site_manager' then 'site_manager'
  when 'site_supervisor' then 'pengawas_lapangan'
  when 'finance' then 'staf_akuntansi'
end
join public.profiles p on p.id = r.user_id and p.deleted_at is null;

select private.refresh_role_inheritance();

create trigger set_updated_at before update on public.departments
  for each row execute function private.set_updated_at();
create trigger set_updated_at before update on public.positions
  for each row execute function private.set_updated_at();
create trigger audit after insert or update or delete on public.positions
  for each row execute function private.audit_row();
create trigger audit after insert or update or delete on public.position_holders
  for each row execute function private.audit_row();

do $$
declare
  target text;
begin
  foreach target in array array['departments', 'positions', 'position_holders']
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

select cron.schedule('refresh-role-inheritance', '5 17 * * *', 'select private.refresh_role_inheritance()');
