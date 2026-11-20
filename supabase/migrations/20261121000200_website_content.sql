-- Fase 3a: konten website dan penangkapan lead (docs/data-model.md bagian 4, 5, 6, 10).
-- Hanya bagian yang dipakai website publik. Kolom CRM lanjutan (sumber, varian LP, chat) ditambah
-- di fase masing-masing lewat migrasi baru.

-- Enum ---------------------------------------------------------------------
create type public.media_kind as enum ('foto', 'video', 'siteplan', 'denah', 'brosur');
create type public.lead_stage as enum (
  'baru', 'dihubungi', 'prospek', 'jadwal_survei', 'sudah_survei', 'negosiasi',
  'booking_fee', 'proses_berkas', 'akad', 'batal'
);
create type public.lead_source_kind as enum (
  'website', 'landing_page', 'meta_lead_ads', 'chat', 'manual', 'walk_in', 'instagram',
  'whatsapp', 'referral'
);
create type public.lead_activity_type as enum (
  'telepon', 'whatsapp', 'email', 'survei', 'pertemuan', 'catatan', 'perubahan_tahap',
  'dokumen', 'sistem'
);
create type public.form_kind as enum ('minat', 'kontak', 'brosur', 'landing_page', 'karir', 'chat');
create type public.submission_status as enum (
  'diterima', 'ditolak_validasi', 'ditolak_honeypot', 'ditolak_rate_limit', 'ditolak_turnstile'
);
create type public.application_status as enum ('baru', 'diproses', 'wawancara', 'diterima', 'ditolak');

-- Properti -----------------------------------------------------------------
create table public.project_media (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects (id) on delete cascade,
  kind public.media_kind not null default 'foto',
  path text not null,
  alt text not null check (length(btrim(alt)) > 0),
  caption text,
  width integer check (width is null or width > 0),
  height integer check (height is null or height > 0),
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references auth.users (id),
  deleted_at timestamptz
);
create index project_media_project_idx on public.project_media (project_id, sort_order)
  where deleted_at is null;

create table public.facilities (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects (id) on delete cascade,
  name text not null,
  icon text,
  description text,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references auth.users (id),
  deleted_at timestamptz
);
create index facilities_project_idx on public.facilities (project_id, sort_order) where deleted_at is null;

create table public.nearby_places (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects (id) on delete cascade,
  name text not null,
  category text not null,
  distance_km numeric(6, 2) check (distance_km is null or distance_km >= 0),
  travel_minutes integer check (travel_minutes is null or travel_minutes >= 0),
  travel_mode text,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references auth.users (id),
  deleted_at timestamptz
);
create index nearby_places_project_idx on public.nearby_places (project_id, sort_order)
  where deleted_at is null;

create table public.construction_updates (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects (id) on delete cascade,
  title text not null,
  body text,
  cover_path text,
  cover_alt text,
  photo_ids uuid[] not null default '{}',
  source_report_id uuid,
  content_status public.content_status not null default 'draft',
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references auth.users (id),
  deleted_at timestamptz,
  constraint construction_updates_published check (content_status <> 'terbit' or published_at is not null),
  constraint construction_updates_cover_alt check (cover_path is null or length(btrim(coalesce(cover_alt, ''))) > 0)
);
create index construction_updates_project_idx on public.construction_updates (project_id, published_at desc)
  where deleted_at is null;

-- Konten website -----------------------------------------------------------
create table public.posts (
  id uuid primary key default gen_random_uuid(),
  slug text not null check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  title text not null,
  excerpt text,
  body jsonb not null default '[]'::jsonb,
  cover_path text,
  cover_alt text,
  content_status public.content_status not null default 'draft',
  scheduled_at timestamptz,
  published_at timestamptz,
  author_id uuid references public.profiles (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references auth.users (id),
  deleted_at timestamptz,
  constraint posts_published check (content_status <> 'terbit' or published_at is not null),
  constraint posts_cover_alt check (cover_path is null or length(btrim(coalesce(cover_alt, ''))) > 0)
);
create unique index posts_slug_unique on public.posts (slug) where deleted_at is null;
create index posts_published_idx on public.posts (content_status, published_at desc) where deleted_at is null;

create table public.promos (
  id uuid primary key default gen_random_uuid(),
  slug text not null check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  title text not null,
  summary text,
  body jsonb not null default '[]'::jsonb,
  terms text,
  project_id uuid references public.projects (id) on delete set null,
  cover_path text,
  cover_alt text,
  starts_at timestamptz,
  ends_at timestamptz,
  content_status public.content_status not null default 'draft',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references auth.users (id),
  deleted_at timestamptz,
  constraint promos_period check (starts_at is null or ends_at is null or ends_at > starts_at),
  constraint promos_cover_alt check (cover_path is null or length(btrim(coalesce(cover_alt, ''))) > 0)
);
create unique index promos_slug_unique on public.promos (slug) where deleted_at is null;
create index promos_ends_idx on public.promos (ends_at) where deleted_at is null;

create table public.banners (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  subtitle text,
  image_path text not null,
  mobile_image_path text,
  alt text not null check (length(btrim(alt)) > 0),
  cta_label text,
  cta_href text check (cta_href is null or cta_href ~ '^(/|https://)'),
  starts_at timestamptz,
  ends_at timestamptz,
  sort_order integer not null default 0,
  content_status public.content_status not null default 'draft',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references auth.users (id),
  deleted_at timestamptz,
  constraint banners_period check (starts_at is null or ends_at is null or ends_at > starts_at),
  constraint banners_cta check ((cta_label is null) = (cta_href is null))
);
create index banners_sort_idx on public.banners (sort_order) where deleted_at is null;

create table public.faqs (
  id uuid primary key default gen_random_uuid(),
  question text not null,
  answer text not null,
  category text,
  project_id uuid references public.projects (id) on delete cascade,
  sort_order integer not null default 0,
  content_status public.content_status not null default 'draft',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references auth.users (id),
  deleted_at timestamptz
);
create index faqs_project_idx on public.faqs (project_id, sort_order) where deleted_at is null;

create table public.careers (
  id uuid primary key default gen_random_uuid(),
  slug text not null check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  title text not null,
  department text,
  location text,
  employment_type text,
  description jsonb not null default '[]'::jsonb,
  requirements jsonb not null default '[]'::jsonb,
  closes_on date,
  content_status public.content_status not null default 'draft',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references auth.users (id),
  deleted_at timestamptz
);
create unique index careers_slug_unique on public.careers (slug) where deleted_at is null;

create table public.job_applications (
  id uuid primary key default gen_random_uuid(),
  career_id uuid not null references public.careers (id),
  full_name text not null,
  phone text not null,
  email text not null,
  cv_path text not null,
  cover_note text,
  status public.application_status not null default 'baru',
  consent_pdp_at timestamptz not null,
  consent_text_version text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references auth.users (id),
  deleted_at timestamptz,
  constraint job_applications_phone_e164 check (phone ~ '^\+62[0-9]{8,12}$')
);
create index job_applications_career_idx on public.job_applications (career_id, status)
  where deleted_at is null;

-- Lead ---------------------------------------------------------------------
create table public.leads (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  phone text not null,
  email text,
  project_id uuid references public.projects (id),
  unit_type_id uuid references public.unit_types (id),
  source_kind public.lead_source_kind not null,
  source_detail text,
  stage public.lead_stage not null default 'baru',
  owner_id uuid references public.profiles (id),
  team_id uuid references public.teams (id),
  meta_lead_id text,
  note text,
  consent_pdp_at timestamptz,
  consent_text_version text,
  fbp text,
  fbc text,
  first_response_at timestamptz,
  sla_due_at timestamptz,
  last_activity_at timestamptz not null default now(),
  lost_reason text,
  merged_into_id uuid references public.leads (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references auth.users (id),
  deleted_at timestamptz,
  constraint leads_phone_e164 check (phone ~ '^\+62[0-9]{8,12}$')
);
create unique index leads_phone_unique on public.leads (phone)
  where deleted_at is null and merged_into_id is null;
create unique index leads_meta_lead_id_unique on public.leads (meta_lead_id) where meta_lead_id is not null;
create index leads_owner_stage_idx on public.leads (owner_id, stage) where deleted_at is null;
create index leads_team_stage_idx on public.leads (team_id, stage) where deleted_at is null;
create index leads_project_created_idx on public.leads (project_id, created_at) where deleted_at is null;

create table public.lead_activities (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid not null references public.leads (id) on delete cascade,
  actor_id uuid references public.profiles (id),
  type public.lead_activity_type not null,
  body text,
  occurred_at timestamptz not null default now(),
  meta jsonb not null default '{}'::jsonb,
  client_id uuid unique,
  created_at timestamptz not null default now(),
  created_by uuid references auth.users (id)
);
create index lead_activities_lead_idx on public.lead_activities (lead_id, occurred_at desc);

create table public.form_submissions (
  id uuid primary key default gen_random_uuid(),
  form_kind public.form_kind not null,
  page_path text,
  lead_id uuid references public.leads (id) on delete set null,
  job_application_id uuid references public.job_applications (id) on delete set null,
  status public.submission_status not null,
  ip_hash text,
  user_agent text,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create index form_submissions_kind_idx on public.form_submissions (form_kind, created_at desc);

create table public.utm_touchpoints (
  id uuid primary key default gen_random_uuid(),
  visitor_id text,
  lead_id uuid references public.leads (id) on delete cascade,
  utm_source text,
  utm_medium text,
  utm_campaign text,
  utm_content text,
  utm_term text,
  fbclid text,
  fbp text,
  fbc text,
  referrer text,
  landing_path text,
  occurred_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);
create index utm_touchpoints_visitor_idx on public.utm_touchpoints (visitor_id);
create index utm_touchpoints_lead_idx on public.utm_touchpoints (lead_id);

-- Fungsi -------------------------------------------------------------------

-- Lead dari form publik. Dipanggil server (service role) saja. Kalau nomor sudah ada, lead lama
-- diperbarui dan dicatat sebagai aktivitas "lead masuk lagi" (docs/data-model.md bagian 5).
create or replace function public.upsert_lead(
  p_full_name text,
  p_phone text,
  p_email text,
  p_project_id uuid,
  p_unit_type_id uuid,
  p_source_kind public.lead_source_kind,
  p_source_detail text,
  p_note text,
  p_consent_text_version text,
  p_fbp text default null,
  p_fbc text default null
)
returns table (lead_id uuid, is_new boolean)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_phone text := public.normalize_phone_id(p_phone);
  v_id uuid;
begin
  if v_phone is null then
    raise exception 'Nomor HP tidak valid.' using errcode = '22023';
  end if;
  if p_consent_text_version is null or btrim(p_consent_text_version) = '' then
    raise exception 'Persetujuan PDP wajib.' using errcode = '22023';
  end if;

  perform pg_advisory_xact_lock(hashtextextended('lead:' || v_phone, 0));

  select l.id into v_id
  from public.leads l
  where l.phone = v_phone and l.deleted_at is null and l.merged_into_id is null;

  if v_id is null then
    insert into public.leads (
      full_name, phone, email, project_id, unit_type_id, source_kind, source_detail, note,
      consent_pdp_at, consent_text_version, fbp, fbc
    ) values (
      btrim(p_full_name), v_phone, nullif(btrim(coalesce(p_email, '')), ''), p_project_id,
      p_unit_type_id, p_source_kind, p_source_detail, nullif(btrim(coalesce(p_note, '')), ''),
      now(), p_consent_text_version, p_fbp, p_fbc
    )
    returning id into v_id;
    return query select v_id, true;
    return;
  end if;

  update public.leads l
  set email = coalesce(l.email, nullif(btrim(coalesce(p_email, '')), '')),
      project_id = coalesce(l.project_id, p_project_id),
      unit_type_id = coalesce(l.unit_type_id, p_unit_type_id),
      consent_pdp_at = now(),
      consent_text_version = p_consent_text_version,
      fbp = coalesce(p_fbp, l.fbp),
      fbc = coalesce(p_fbc, l.fbc),
      last_activity_at = now()
  where l.id = v_id;

  insert into public.lead_activities (lead_id, type, body, meta)
  values (
    v_id,
    'sistem',
    'Lead masuk lagi.',
    jsonb_build_object(
      'source_kind', p_source_kind,
      'source_detail', p_source_detail,
      'note', nullif(btrim(coalesce(p_note, '')), '')
    )
  );
  return query select v_id, false;
end;
$$;

revoke execute on function public.upsert_lead(text, text, text, uuid, uuid, public.lead_source_kind, text, text, text, text, text)
  from public, anon, authenticated;
grant execute on function public.upsert_lead(text, text, text, uuid, uuid, public.lead_source_kind, text, text, text, text, text)
  to service_role;

-- Trigger ------------------------------------------------------------------
create trigger set_updated_at before update on public.project_media for each row execute function private.set_updated_at();
create trigger set_updated_at before update on public.facilities for each row execute function private.set_updated_at();
create trigger set_updated_at before update on public.nearby_places for each row execute function private.set_updated_at();
create trigger set_updated_at before update on public.construction_updates for each row execute function private.set_updated_at();
create trigger set_updated_at before update on public.posts for each row execute function private.set_updated_at();
create trigger set_updated_at before update on public.promos for each row execute function private.set_updated_at();
create trigger set_updated_at before update on public.banners for each row execute function private.set_updated_at();
create trigger set_updated_at before update on public.faqs for each row execute function private.set_updated_at();
create trigger set_updated_at before update on public.careers for each row execute function private.set_updated_at();
create trigger set_updated_at before update on public.job_applications for each row execute function private.set_updated_at();
create trigger set_updated_at before update on public.leads for each row execute function private.set_updated_at();

create trigger normalize_phone before insert or update of phone on public.leads
  for each row execute function private.normalize_profile_phone();
create trigger normalize_phone before insert or update of phone on public.job_applications
  for each row execute function private.normalize_profile_phone();

create trigger audit after insert or update or delete on public.project_media for each row execute function private.audit_row();
create trigger audit after insert or update or delete on public.construction_updates for each row execute function private.audit_row();
create trigger audit after insert or update or delete on public.posts for each row execute function private.audit_row();
create trigger audit after insert or update or delete on public.promos for each row execute function private.audit_row();
create trigger audit after insert or update or delete on public.banners for each row execute function private.audit_row();
create trigger audit after insert or update or delete on public.faqs for each row execute function private.audit_row();
create trigger audit after insert or update or delete on public.careers for each row execute function private.audit_row();
create trigger audit after insert or update or delete on public.job_applications for each row execute function private.audit_row();
create trigger audit after insert or update or delete on public.leads for each row execute function private.audit_row();

-- RLS ----------------------------------------------------------------------
alter table public.project_media enable row level security;
alter table public.facilities enable row level security;
alter table public.nearby_places enable row level security;
alter table public.construction_updates enable row level security;
alter table public.posts enable row level security;
alter table public.promos enable row level security;
alter table public.banners enable row level security;
alter table public.faqs enable row level security;
alter table public.careers enable row level security;
alter table public.job_applications enable row level security;
alter table public.leads enable row level security;
alter table public.lead_activities enable row level security;
alter table public.form_submissions enable row level security;
alter table public.utm_touchpoints enable row level security;

revoke all on public.project_media, public.facilities, public.nearby_places,
  public.construction_updates, public.posts, public.promos, public.banners, public.faqs,
  public.careers, public.job_applications, public.leads, public.lead_activities,
  public.form_submissions, public.utm_touchpoints from anon, authenticated;

grant select on public.project_media, public.facilities, public.nearby_places,
  public.construction_updates, public.posts, public.promos, public.banners, public.faqs,
  public.careers to anon, authenticated;
grant insert, update, delete on public.project_media, public.facilities, public.nearby_places,
  public.construction_updates, public.posts, public.promos, public.banners, public.faqs,
  public.careers to authenticated;
grant select on public.job_applications, public.leads, public.lead_activities,
  public.form_submissions, public.utm_touchpoints to authenticated;
grant update on public.job_applications, public.leads to authenticated;

-- Konten proyek: publik mengikuti proyek terbit, staf melihat semua, ditulis owner/admin.
create policy "media proyek: publik dari proyek terbit"
  on public.project_media for select to anon, authenticated
  using (
    deleted_at is null
    and exists (
      select 1 from public.projects p
      where p.id = project_media.project_id and p.content_status = 'terbit' and p.deleted_at is null
    )
  );
create policy "media proyek: staf melihat semua"
  on public.project_media for select to authenticated using (private.is_staff());
create policy "media proyek: dikelola admin/owner"
  on public.project_media for all to authenticated
  using (private.has_role('owner', 'admin')) with check (private.has_role('owner', 'admin'));

create policy "fasilitas: publik dari proyek terbit"
  on public.facilities for select to anon, authenticated
  using (
    deleted_at is null
    and exists (
      select 1 from public.projects p
      where p.id = facilities.project_id and p.content_status = 'terbit' and p.deleted_at is null
    )
  );
create policy "fasilitas: staf melihat semua"
  on public.facilities for select to authenticated using (private.is_staff());
create policy "fasilitas: dikelola admin/owner"
  on public.facilities for all to authenticated
  using (private.has_role('owner', 'admin')) with check (private.has_role('owner', 'admin'));

create policy "tempat sekitar: publik dari proyek terbit"
  on public.nearby_places for select to anon, authenticated
  using (
    deleted_at is null
    and exists (
      select 1 from public.projects p
      where p.id = nearby_places.project_id and p.content_status = 'terbit' and p.deleted_at is null
    )
  );
create policy "tempat sekitar: staf melihat semua"
  on public.nearby_places for select to authenticated using (private.is_staff());
create policy "tempat sekitar: dikelola admin/owner"
  on public.nearby_places for all to authenticated
  using (private.has_role('owner', 'admin')) with check (private.has_role('owner', 'admin'));

create policy "progres: publik yang terbit"
  on public.construction_updates for select to anon, authenticated
  using (
    deleted_at is null
    and content_status = 'terbit'
    and published_at <= now()
    and exists (
      select 1 from public.projects p
      where p.id = construction_updates.project_id and p.content_status = 'terbit' and p.deleted_at is null
    )
  );
create policy "progres: staf melihat semua"
  on public.construction_updates for select to authenticated using (private.is_staff());
create policy "progres: dikelola admin/owner"
  on public.construction_updates for all to authenticated
  using (private.has_role('owner', 'admin')) with check (private.has_role('owner', 'admin'));

-- Konten CMS: publik hanya yang terbit dan masih berlaku.
create policy "berita: publik yang terbit"
  on public.posts for select to anon, authenticated
  using (deleted_at is null and content_status = 'terbit' and published_at <= now());
create policy "berita: staf melihat semua"
  on public.posts for select to authenticated using (private.is_staff());
create policy "berita: dikelola admin/owner"
  on public.posts for all to authenticated
  using (private.has_role('owner', 'admin')) with check (private.has_role('owner', 'admin'));

create policy "promo: publik yang terbit dan berlaku"
  on public.promos for select to anon, authenticated
  using (
    deleted_at is null
    and content_status = 'terbit'
    and (starts_at is null or starts_at <= now())
    and (ends_at is null or ends_at > now())
  );
create policy "promo: staf melihat semua"
  on public.promos for select to authenticated using (private.is_staff());
create policy "promo: dikelola admin/owner"
  on public.promos for all to authenticated
  using (private.has_role('owner', 'admin')) with check (private.has_role('owner', 'admin'));

create policy "banner: publik yang terbit dan berlaku"
  on public.banners for select to anon, authenticated
  using (
    deleted_at is null
    and content_status = 'terbit'
    and (starts_at is null or starts_at <= now())
    and (ends_at is null or ends_at > now())
  );
create policy "banner: staf melihat semua"
  on public.banners for select to authenticated using (private.is_staff());
create policy "banner: dikelola admin/owner"
  on public.banners for all to authenticated
  using (private.has_role('owner', 'admin')) with check (private.has_role('owner', 'admin'));

create policy "faq: publik yang terbit"
  on public.faqs for select to anon, authenticated
  using (deleted_at is null and content_status = 'terbit');
create policy "faq: staf melihat semua"
  on public.faqs for select to authenticated using (private.is_staff());
create policy "faq: dikelola admin/owner"
  on public.faqs for all to authenticated
  using (private.has_role('owner', 'admin')) with check (private.has_role('owner', 'admin'));

create policy "karir: publik yang terbit dan belum tutup"
  on public.careers for select to anon, authenticated
  using (
    deleted_at is null
    and content_status = 'terbit'
    and (closes_on is null or closes_on >= (now() at time zone 'Asia/Jakarta')::date)
  );
create policy "karir: staf melihat semua"
  on public.careers for select to authenticated using (private.is_staff());
create policy "karir: dikelola admin/owner"
  on public.careers for all to authenticated
  using (private.has_role('owner', 'admin')) with check (private.has_role('owner', 'admin'));

-- Lamaran kerja: masuk lewat server (service role), dibaca dan diproses owner/admin.
create policy "lamaran: dibaca owner/admin"
  on public.job_applications for select to authenticated using (private.has_role('owner', 'admin'));
create policy "lamaran: diproses owner/admin"
  on public.job_applications for update to authenticated
  using (private.has_role('owner', 'admin')) with check (private.has_role('owner', 'admin'));

-- Lead: owner/admin semua, manajer marketing timnya, marketing miliknya sendiri.
-- Lead baru masuk lewat public.upsert_lead (service role). Pembagian lead dan aturan finance di Fase 6.
create policy "lead: sesuai role"
  on public.leads for select to authenticated
  using (
    deleted_at is null
    and (
      private.has_role('owner', 'admin')
      or (private.has_role('marketing_manager') and (owner_id = (select auth.uid()) or private.in_same_team(owner_id)))
      or (private.has_role('marketing') and owner_id = (select auth.uid()))
    )
  );
create policy "lead: diubah sesuai role"
  on public.leads for update to authenticated
  using (
    private.has_role('owner', 'admin')
    or (private.has_role('marketing_manager') and (owner_id = (select auth.uid()) or private.in_same_team(owner_id)))
    or (private.has_role('marketing') and owner_id = (select auth.uid()))
  )
  with check (
    private.has_role('owner', 'admin')
    or (private.has_role('marketing_manager') and (owner_id = (select auth.uid()) or private.in_same_team(owner_id)))
    or (private.has_role('marketing') and owner_id = (select auth.uid()))
  );

create policy "aktivitas lead: mengikuti akses lead"
  on public.lead_activities for select to authenticated
  using (exists (select 1 from public.leads l where l.id = lead_activities.lead_id));

create policy "kiriman form: dibaca owner/admin"
  on public.form_submissions for select to authenticated using (private.has_role('owner', 'admin'));
create policy "jejak utm: dibaca owner/admin"
  on public.utm_touchpoints for select to authenticated using (private.has_role('owner', 'admin'));

-- Storage: CV pelamar (privat, ditulis server, dibaca owner/admin) -----------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('job-applications', 'job-applications', false, 2097152, array['application/pdf'])
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

create policy "cv pelamar: dibaca owner/admin"
  on storage.objects for select to authenticated
  using (bucket_id = 'job-applications' and private.has_role('owner', 'admin'));
