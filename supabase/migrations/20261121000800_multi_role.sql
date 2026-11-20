-- Multi role untuk rangkap jabatan (keputusan owner, 20 November 2026).
-- Satu baris user_roles per role. Tepat satu role utama per akun (is_primary) untuk beranda dan label.
-- Hak akses = gabungan semua role: private.has_role memeriksa irisan dengan private.my_roles().
-- Pola expand: set_user_role(user, role) lama tetap ada dan sekarang berarti "satu role saja".

alter table public.user_roles add column is_primary boolean not null default true;
alter table public.user_roles drop constraint user_roles_pkey;
alter table public.user_roles add primary key (user_id, role);
create unique index user_roles_one_primary on public.user_roles (user_id) where is_primary;
create index user_roles_role_idx on public.user_roles (role);

-- Semua role milik akun aktif yang sedang login, role utama lebih dulu.
create or replace function private.my_roles()
returns public.app_role[]
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(array_agg(ur.role order by ur.is_primary desc, ur.role), '{}')
  from public.user_roles ur
  join public.profiles p on p.id = ur.user_id
  where ur.user_id = (select auth.uid())
    and p.is_active
    and p.deleted_at is null
$$;

-- Role utama (dipakai kode lama dan tampilan).
create or replace function private.my_role()
returns public.app_role
language sql
stable
security definer
set search_path = ''
as $$
  select (private.my_roles())[1]
$$;

create or replace function private.has_role(variadic roles public.app_role[])
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(private.my_roles() && roles, false)
$$;

revoke all on function private.my_roles() from public;
grant execute on function private.my_roles() to authenticated, anon;

-- JWT: app_role (role utama, untuk kompatibilitas) dan app_roles (semua role).
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

  select coalesce(array_agg(ur.role order by ur.is_primary desc, ur.role), '{}') into v_roles
  from public.user_roles ur
  where ur.user_id = v_user;

  select tm.team_id into v_team from public.team_members tm where tm.user_id = v_user limit 1;

  claims := jsonb_set(claims, '{app_role}', coalesce(to_jsonb(v_roles[1]), 'null'::jsonb));
  claims := jsonb_set(claims, '{app_roles}', to_jsonb(v_roles));
  claims := jsonb_set(claims, '{team_id}', coalesce(to_jsonb(v_team), 'null'::jsonb));
  claims := jsonb_set(claims, '{is_active}', to_jsonb(coalesce(v_active, false)));
  return jsonb_set(event, '{claims}', claims);
end;
$$;

-- Menetapkan semua role akun sekaligus. Hanya owner atau admin. Role owner hanya bisa diberikan,
-- dicabut, atau diubah oleh owner. Tercatat di audit_log lewat trigger user_roles.
create or replace function public.set_user_roles(
  p_user uuid,
  p_roles public.app_role[],
  p_primary public.app_role
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_target_is_owner boolean;
begin
  if not private.has_role('owner', 'admin') then
    raise exception 'Hanya owner atau admin yang bisa mengubah role.' using errcode = '42501';
  end if;
  if p_roles is null or cardinality(p_roles) = 0 then
    raise exception 'Pilih minimal satu role.' using errcode = '22023';
  end if;
  if not (p_primary = any (p_roles)) then
    raise exception 'Role utama harus termasuk role yang dipilih.' using errcode = '22023';
  end if;

  select exists (
    select 1 from public.user_roles where user_id = p_user and role = 'owner'
  ) into v_target_is_owner;
  if (v_target_is_owner or 'owner' = any (p_roles)) and not private.has_role('owner') then
    raise exception 'Role owner hanya bisa diatur oleh owner.' using errcode = '42501';
  end if;
  if p_user = auth.uid() and v_target_is_owner and not ('owner' = any (p_roles)) then
    raise exception 'Owner tidak bisa mencabut role owner miliknya sendiri.' using errcode = '42501';
  end if;

  delete from public.user_roles where user_id = p_user and not (role = any (p_roles));
  update public.user_roles set is_primary = false where user_id = p_user and is_primary;
  insert into public.user_roles (user_id, role, is_primary, created_by)
  select p_user, r, r = p_primary, auth.uid()
  from (select distinct unnest(p_roles) as r) roles
  on conflict (user_id, role) do update set is_primary = excluded.is_primary, updated_at = now();
end;
$$;

-- Fungsi lama: satu role saja (dipakai skrip dan kode sebelum multi role).
create or replace function public.set_user_role(p_user uuid, p_role public.app_role)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform public.set_user_roles(p_user, array[p_role], p_role);
end;
$$;

revoke execute on function public.set_user_roles(uuid, public.app_role[], public.app_role) from public, anon;
grant execute on function public.set_user_roles(uuid, public.app_role[], public.app_role) to authenticated;
