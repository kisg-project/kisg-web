-- Fase 2a: tabel inti akses dan properti (docs/data-model.md bagian 3, 4, 8, 10, 12).
-- Tabel fitur lain (CRM, CMS, lapangan, chat, KPI) dibuat di fase fiturnya (keputusan owner, Fase 2).

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text not null default '',
  email text not null default '',
  phone text,
  avatar_path text,
  is_active boolean not null default true,
  last_seen_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references auth.users (id),
  deleted_at timestamptz,
  constraint profiles_phone_e164 check (phone is null or phone ~ '^\+62[0-9]{8,12}$')
);

create table public.user_roles (
  user_id uuid primary key references public.profiles (id) on delete cascade,
  role public.app_role not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references auth.users (id)
);

create table public.teams (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  kind public.team_kind not null,
  leader_id uuid references public.profiles (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references auth.users (id),
  deleted_at timestamptz
);
create unique index teams_name_unique on public.teams (name) where deleted_at is null;

create table public.team_members (
  team_id uuid not null references public.teams (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  receives_leads boolean not null default true,
  created_at timestamptz not null default now(),
  created_by uuid references auth.users (id),
  primary key (team_id, user_id)
);
-- Satu tim per user.
create unique index team_members_one_team on public.team_members (user_id);

create table public.projects (
  id uuid primary key default gen_random_uuid(),
  slug text not null,
  name text not null,
  status public.project_status not null default 'tersedia',
  content_status public.content_status not null default 'draft',
  tagline text,
  description text,
  address text,
  village text,
  district text,
  city text,
  province text,
  postal_code text,
  lat numeric(9, 6),
  lng numeric(9, 6),
  siteplan_svg_path text,
  legal_summary jsonb not null default '{}'::jsonb,
  launched_on date,
  sold_out_on date,
  is_featured boolean not null default false,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references auth.users (id),
  deleted_at timestamptz
);
create unique index projects_slug_unique on public.projects (slug) where deleted_at is null;
create index projects_status_idx on public.projects (status) where deleted_at is null;

create table public.project_assignments (
  project_id uuid not null references public.projects (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  role_on_project public.project_role not null,
  created_at timestamptz not null default now(),
  created_by uuid references auth.users (id),
  primary key (project_id, user_id)
);
create index project_assignments_user_idx on public.project_assignments (user_id);

create table public.work_locations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  kind public.work_location_kind not null,
  project_id uuid references public.projects (id) on delete cascade,
  lat numeric(9, 6) not null,
  lng numeric(9, 6) not null,
  radius_m integer not null check (radius_m between 10 and 5000),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references auth.users (id),
  deleted_at timestamptz,
  constraint work_locations_project_kind check ((kind = 'proyek') = (project_id is not null))
);

create table public.unit_types (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects (id) on delete cascade,
  slug text not null,
  name text not null,
  land_area numeric(8, 2) not null check (land_area > 0),
  building_area numeric(8, 2) not null check (building_area > 0),
  bedrooms smallint not null check (bedrooms >= 0),
  bathrooms smallint not null check (bathrooms >= 0),
  floors smallint not null default 1 check (floors >= 1),
  specs jsonb not null default '{}'::jsonb,
  price_from bigint check (price_from is null or price_from > 0),
  show_price boolean not null default true,
  floor_plan_path text,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references auth.users (id),
  deleted_at timestamptz
);
create unique index unit_types_slug_unique on public.unit_types (project_id, slug) where deleted_at is null;

create table public.units (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects (id) on delete cascade,
  unit_type_id uuid references public.unit_types (id),
  block text not null,
  number text not null,
  code text not null,
  land_area numeric(8, 2),
  building_area numeric(8, 2),
  price bigint check (price is null or price > 0),
  status public.unit_status not null default 'tersedia',
  hold_expires_at timestamptz,
  held_by uuid references public.profiles (id),
  siteplan_shape_id text,
  is_corner boolean not null default false,
  facing text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references auth.users (id),
  deleted_at timestamptz,
  constraint units_hold_consistent check ((status = 'hold') = (hold_expires_at is not null))
);
create unique index units_code_unique on public.units (project_id, code) where deleted_at is null;
create index units_project_status_idx on public.units (project_id, status) where deleted_at is null;

create table public.site_settings (
  key text primary key,
  value jsonb not null,
  is_public boolean not null default false,
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users (id)
);

create table public.audit_log (
  id bigint generated always as identity primary key,
  table_name text not null,
  row_id text not null,
  action public.audit_action not null,
  actor_id uuid,
  old_data jsonb,
  new_data jsonb,
  at timestamptz not null default now()
);
create index audit_log_row_idx on public.audit_log (table_name, row_id);
create index audit_log_actor_idx on public.audit_log (actor_id, at desc);

-- Penghitung rate limit (form publik, login, webhook). Unlogged: cepat, boleh hilang saat restart.
create unlogged table public.rate_limits (
  key text not null,
  window_start timestamptz not null,
  count integer not null default 0,
  primary key (key, window_start)
);
