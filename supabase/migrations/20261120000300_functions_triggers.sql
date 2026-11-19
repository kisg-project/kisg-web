-- Fase 2a: fungsi, trigger, helper RLS, dan Custom Access Token Hook.

-- updated_at otomatis
create or replace function private.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

-- Nomor HP Indonesia ke E.164. Aturan sama dengan src/lib/format/phone.ts (normalizePhoneID).
create or replace function public.normalize_phone_id(input text)
returns text
language plpgsql
immutable
set search_path = ''
as $$
declare
  t text := btrim(coalesce(input, ''));
  d text;
begin
  if t = '' then
    return null;
  end if;
  if t ~ '[^0-9[:space:]()+.-]' then
    return null;
  end if;
  if position('+' in t) > 1 then
    return null;
  end if;
  d := regexp_replace(t, '[^0-9]', '', 'g');
  if left(t, 1) = '+' then
    if left(d, 2) <> '62' then
      return null;
    end if;
    d := substr(d, 3);
  elsif left(d, 2) = '62' then
    d := substr(d, 3);
  elsif left(d, 1) = '0' then
    d := substr(d, 2);
  end if;
  if left(d, 1) = '0' or length(d) < 8 or length(d) > 12 then
    return null;
  end if;
  return '+62' || d;
end;
$$;

create or replace function private.normalize_profile_phone()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.phone is not null and btrim(new.phone) <> '' then
    new.phone := public.normalize_phone_id(new.phone);
    if new.phone is null then
      raise exception 'Nomor HP tidak valid.' using errcode = '22023';
    end if;
  else
    new.phone := null;
  end if;
  return new;
end;
$$;

-- Audit log untuk tabel penting (CLAUDE.md bagian 8).
create or replace function private.audit_row()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_new jsonb := case when tg_op in ('INSERT', 'UPDATE') then to_jsonb(new) end;
  v_old jsonb := case when tg_op in ('UPDATE', 'DELETE') then to_jsonb(old) end;
  v_row jsonb := coalesce(v_new, v_old);
  v_action public.audit_action;
begin
  v_action := case
    when tg_op = 'INSERT' then 'insert'
    when tg_op = 'DELETE' then 'delete'
    when (v_new ->> 'deleted_at') is not null and (v_old ->> 'deleted_at') is null then 'soft_delete'
    else 'update'
  end;
  insert into public.audit_log (table_name, row_id, action, actor_id, old_data, new_data)
  values (
    tg_table_name,
    coalesce(v_row ->> 'id', v_row ->> 'user_id', v_row ->> 'key', ''),
    v_action,
    auth.uid(),
    v_old,
    v_new
  );
  return coalesce(new, old);
end;
$$;

-- Profil dibuat otomatis saat user dibuat (undangan dari admin).
create or replace function private.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, email, full_name)
  values (new.id, coalesce(new.email, ''), coalesce(new.raw_user_meta_data ->> 'full_name', ''))
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function private.handle_new_user();

-- Helper RLS. Role dan status aktif dibaca dari tabel (bukan klaim JWT) supaya perubahan role
-- atau penonaktifan berlaku seketika, tidak menunggu token berikutnya.
create or replace function private.my_role()
returns public.app_role
language sql
stable
security definer
set search_path = ''
as $$
  select ur.role
  from public.user_roles ur
  join public.profiles p on p.id = ur.user_id
  where ur.user_id = (select auth.uid())
    and p.is_active
    and p.deleted_at is null
$$;

create or replace function private.has_role(variadic roles public.app_role[])
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(private.my_role() = any (roles), false)
$$;

create or replace function private.is_staff()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select private.my_role() is not null
$$;

create or replace function private.is_assigned_to_project(p_project uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.project_assignments pa
    where pa.project_id = p_project and pa.user_id = (select auth.uid())
  )
$$;

create or replace function private.in_same_team(p_user uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.team_members a
    join public.team_members b on b.team_id = a.team_id
    where a.user_id = (select auth.uid()) and b.user_id = p_user
  )
$$;

revoke all on all functions in schema private from public;
grant execute on function
  private.my_role(),
  private.has_role(public.app_role[]),
  private.is_staff(),
  private.is_assigned_to_project(uuid),
  private.in_same_team(uuid)
to authenticated, anon;

-- Custom Access Token Hook: app_role, team_id, is_active di JWT (untuk proxy.ts dan tampilan).
create or replace function public.custom_access_token_hook(event jsonb)
returns jsonb
language plpgsql
stable
set search_path = ''
as $$
declare
  v_user uuid := (event ->> 'user_id')::uuid;
  v_role public.app_role;
  v_active boolean;
  v_team uuid;
  claims jsonb := coalesce(event -> 'claims', '{}'::jsonb);
begin
  select ur.role, (p.is_active and p.deleted_at is null)
    into v_role, v_active
  from public.profiles p
  left join public.user_roles ur on ur.user_id = p.id
  where p.id = v_user;

  select tm.team_id into v_team from public.team_members tm where tm.user_id = v_user limit 1;

  claims := jsonb_set(claims, '{app_role}', coalesce(to_jsonb(v_role), 'null'::jsonb));
  claims := jsonb_set(claims, '{team_id}', coalesce(to_jsonb(v_team), 'null'::jsonb));
  claims := jsonb_set(claims, '{is_active}', to_jsonb(coalesce(v_active, false)));
  return jsonb_set(event, '{claims}', claims);
end;
$$;

grant usage on schema public to supabase_auth_admin;
grant execute on function public.custom_access_token_hook(jsonb) to supabase_auth_admin;
revoke execute on function public.custom_access_token_hook(jsonb) from authenticated, anon, public;
grant select on public.user_roles, public.profiles, public.team_members to supabase_auth_admin;

-- Ubah role dan status aktif hanya lewat fungsi ini (owner atau admin). Dipakai server action Fase 2b.
create or replace function public.set_user_role(p_user uuid, p_role public.app_role)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not private.has_role('owner', 'admin') then
    raise exception 'Hanya owner atau admin yang bisa mengubah role.' using errcode = '42501';
  end if;
  insert into public.user_roles (user_id, role, created_by)
  values (p_user, p_role, auth.uid())
  on conflict (user_id) do update set role = excluded.role, updated_at = now();
end;
$$;

create or replace function public.set_user_active(p_user uuid, p_active boolean)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not private.has_role('owner', 'admin') then
    raise exception 'Hanya owner atau admin yang bisa menonaktifkan akun.' using errcode = '42501';
  end if;
  if p_user = auth.uid() and not p_active then
    raise exception 'Akun sendiri tidak bisa dinonaktifkan.' using errcode = '42501';
  end if;
  update public.profiles set is_active = p_active where id = p_user;
end;
$$;

revoke execute on function public.set_user_role(uuid, public.app_role) from public, anon;
revoke execute on function public.set_user_active(uuid, boolean) from public, anon;
grant execute on function public.set_user_role(uuid, public.app_role) to authenticated;
grant execute on function public.set_user_active(uuid, boolean) to authenticated;

-- Rate limit: true kalau masih di bawah batas. Hanya server (service role) yang boleh memanggil,
-- supaya pengunjung tidak bisa mengisi kunci milik orang lain.
create or replace function public.rate_limit_hit(p_key text, p_window_seconds integer, p_max integer)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_window timestamptz := to_timestamp(floor(extract(epoch from now()) / p_window_seconds) * p_window_seconds);
  v_count integer;
begin
  insert into public.rate_limits (key, window_start, count)
  values (p_key, v_window, 1)
  on conflict (key, window_start) do update set count = public.rate_limits.count + 1
  returning count into v_count;
  return v_count <= p_max;
end;
$$;

revoke execute on function public.rate_limit_hit(text, integer, integer) from public, anon, authenticated;
grant execute on function public.rate_limit_hit(text, integer, integer) to service_role;

-- Trigger updated_at
create trigger set_updated_at before update on public.profiles for each row execute function private.set_updated_at();
create trigger set_updated_at before update on public.user_roles for each row execute function private.set_updated_at();
create trigger set_updated_at before update on public.teams for each row execute function private.set_updated_at();
create trigger set_updated_at before update on public.projects for each row execute function private.set_updated_at();
create trigger set_updated_at before update on public.work_locations for each row execute function private.set_updated_at();
create trigger set_updated_at before update on public.unit_types for each row execute function private.set_updated_at();
create trigger set_updated_at before update on public.units for each row execute function private.set_updated_at();
create trigger set_updated_at before update on public.site_settings for each row execute function private.set_updated_at();

-- Normalisasi nomor HP
create trigger normalize_phone before insert or update of phone on public.profiles
  for each row execute function private.normalize_profile_phone();

-- Audit (CLAUDE.md bagian 8: user_roles, units, konten, dan tabel penting lain)
create trigger audit after insert or update or delete on public.profiles for each row execute function private.audit_row();
create trigger audit after insert or update or delete on public.user_roles for each row execute function private.audit_row();
create trigger audit after insert or update or delete on public.teams for each row execute function private.audit_row();
create trigger audit after insert or update or delete on public.team_members for each row execute function private.audit_row();
create trigger audit after insert or update or delete on public.project_assignments for each row execute function private.audit_row();
create trigger audit after insert or update or delete on public.projects for each row execute function private.audit_row();
create trigger audit after insert or update or delete on public.unit_types for each row execute function private.audit_row();
create trigger audit after insert or update or delete on public.units for each row execute function private.audit_row();
create trigger audit after insert or update or delete on public.work_locations for each row execute function private.audit_row();
create trigger audit after insert or update or delete on public.site_settings for each row execute function private.audit_row();
