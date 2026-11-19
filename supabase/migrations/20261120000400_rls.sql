-- Fase 2a: RLS untuk semua tabel inti (docs/data-model.md bagian 13).
-- Penulisan sensitif (role, status aktif) lewat fungsi security definer, bukan policy tulis langsung.

alter table public.profiles enable row level security;
alter table public.user_roles enable row level security;
alter table public.teams enable row level security;
alter table public.team_members enable row level security;
alter table public.projects enable row level security;
alter table public.project_assignments enable row level security;
alter table public.work_locations enable row level security;
alter table public.unit_types enable row level security;
alter table public.units enable row level security;
alter table public.site_settings enable row level security;
alter table public.audit_log enable row level security;
alter table public.rate_limits enable row level security;

-- Hak dasar: anon tidak menulis apa pun. Kolom profil yang boleh diubah sendiri dibatasi.
revoke all on public.profiles, public.user_roles, public.teams, public.team_members,
  public.projects, public.project_assignments, public.work_locations, public.unit_types,
  public.units, public.site_settings, public.audit_log, public.rate_limits from anon, authenticated;

grant select on public.projects, public.unit_types, public.units, public.site_settings to anon;
grant select on public.profiles, public.user_roles, public.teams, public.team_members,
  public.projects, public.project_assignments, public.work_locations, public.unit_types,
  public.units, public.site_settings, public.audit_log to authenticated;
grant insert, update, delete on public.teams, public.team_members, public.projects,
  public.project_assignments, public.work_locations, public.unit_types, public.units,
  public.site_settings to authenticated;
grant update (full_name, phone, avatar_path) on public.profiles to authenticated;

-- profiles
create policy "profil: baca diri sendiri, admin/owner, atau satu tim"
  on public.profiles for select to authenticated
  using (
    id = (select auth.uid())
    or private.has_role('owner', 'admin')
    or (private.has_role('marketing_manager', 'site_manager') and private.in_same_team(id))
  );
create policy "profil: ubah diri sendiri, admin/owner"
  on public.profiles for update to authenticated
  using (id = (select auth.uid()) or private.has_role('owner', 'admin'))
  with check (id = (select auth.uid()) or private.has_role('owner', 'admin'));
create policy "profil: dibaca hook auth"
  on public.profiles for select to supabase_auth_admin using (true);

-- user_roles (tulis hanya lewat public.set_user_role)
create policy "role: baca diri sendiri atau admin/owner"
  on public.user_roles for select to authenticated
  using (user_id = (select auth.uid()) or private.has_role('owner', 'admin'));
create policy "role: dibaca hook auth"
  on public.user_roles for select to supabase_auth_admin using (true);

-- teams dan team_members
create policy "tim: dibaca staf aktif"
  on public.teams for select to authenticated using (private.is_staff());
create policy "tim: dikelola admin/owner"
  on public.teams for all to authenticated
  using (private.has_role('owner', 'admin')) with check (private.has_role('owner', 'admin'));
create policy "anggota tim: dibaca staf aktif"
  on public.team_members for select to authenticated using (private.is_staff());
create policy "anggota tim: dikelola admin/owner"
  on public.team_members for all to authenticated
  using (private.has_role('owner', 'admin')) with check (private.has_role('owner', 'admin'));
create policy "anggota tim: dibaca hook auth"
  on public.team_members for select to supabase_auth_admin using (true);

-- projects: publik hanya yang terbit, staf semua, tulis admin/owner
create policy "proyek: publik yang terbit"
  on public.projects for select to anon, authenticated
  using (content_status = 'terbit' and deleted_at is null);
create policy "proyek: staf melihat semua"
  on public.projects for select to authenticated using (private.is_staff());
create policy "proyek: dikelola admin/owner"
  on public.projects for all to authenticated
  using (private.has_role('owner', 'admin')) with check (private.has_role('owner', 'admin'));

-- unit_types dan units: publik mengikuti proyek terbit
create policy "tipe unit: publik dari proyek terbit"
  on public.unit_types for select to anon, authenticated
  using (
    deleted_at is null
    and exists (
      select 1 from public.projects p
      where p.id = unit_types.project_id and p.content_status = 'terbit' and p.deleted_at is null
    )
  );
create policy "tipe unit: staf melihat semua"
  on public.unit_types for select to authenticated using (private.is_staff());
create policy "tipe unit: dikelola admin/owner"
  on public.unit_types for all to authenticated
  using (private.has_role('owner', 'admin')) with check (private.has_role('owner', 'admin'));

create policy "unit: publik dari proyek terbit"
  on public.units for select to anon, authenticated
  using (
    deleted_at is null
    and exists (
      select 1 from public.projects p
      where p.id = units.project_id and p.content_status = 'terbit' and p.deleted_at is null
    )
  );
create policy "unit: staf melihat semua"
  on public.units for select to authenticated using (private.is_staff());
create policy "unit: dikelola admin/owner"
  on public.units for all to authenticated
  using (private.has_role('owner', 'admin')) with check (private.has_role('owner', 'admin'));

-- project_assignments
create policy "penugasan: diri sendiri, admin/owner, site manager proyeknya"
  on public.project_assignments for select to authenticated
  using (
    user_id = (select auth.uid())
    or private.has_role('owner', 'admin')
    or (private.has_role('site_manager') and private.is_assigned_to_project(project_id))
  );
create policy "penugasan: dikelola admin/owner"
  on public.project_assignments for all to authenticated
  using (private.has_role('owner', 'admin')) with check (private.has_role('owner', 'admin'));

-- work_locations
create policy "lokasi kerja: dibaca staf aktif"
  on public.work_locations for select to authenticated using (private.is_staff());
create policy "lokasi kerja: dikelola admin/owner"
  on public.work_locations for all to authenticated
  using (private.has_role('owner', 'admin')) with check (private.has_role('owner', 'admin'));

-- site_settings
create policy "pengaturan: publik yang is_public"
  on public.site_settings for select to anon, authenticated using (is_public);
create policy "pengaturan: staf melihat semua"
  on public.site_settings for select to authenticated using (private.is_staff());
create policy "pengaturan: dikelola admin/owner"
  on public.site_settings for all to authenticated
  using (private.has_role('owner', 'admin')) with check (private.has_role('owner', 'admin'));

-- audit_log: baca owner/admin, tulis hanya lewat trigger
create policy "audit: dibaca owner/admin"
  on public.audit_log for select to authenticated using (private.has_role('owner', 'admin'));

-- rate_limits: tanpa policy untuk anon/authenticated (akses hanya lewat public.rate_limit_hit)
create policy "rate limit: tanpa akses langsung"
  on public.rate_limits for select to authenticated using (false);
