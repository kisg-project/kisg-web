-- Absensi (keputusan owner, 20 November 2026). CLAUDE.md bagian 8 "Absensi dan laporan harian".
-- - Semua karyawan selain owner wajib clock in dan clock out: selfie (hanya kamera) dan GPS.
-- - Sah hanya dalam radius titik absensi aktif (default 100 m). Di luar radius: pengajuan di luar lokasi.
-- - Jam masuk dan pulang diatur owner: default perusahaan, bisa ditimpa per titik atau per karyawan.
-- - Waktu absen selalu dari server (now()), tanggal kerja dihitung di Asia/Jakarta.
-- - Tidak ada data biometrik: hanya foto. Deteksi wajah dan kedip berjalan di HP karyawan.

create type public.attendance_kind as enum ('masuk', 'pulang');
create type public.request_status as enum ('menunggu', 'disetujui', 'ditolak');
create type public.schedule_scope as enum ('perusahaan', 'lokasi', 'karyawan');

alter table public.work_locations alter column radius_m set default 100;

-- Jam kerja -------------------------------------------------------------------
create table public.work_schedules (
  id uuid primary key default gen_random_uuid(),
  scope public.schedule_scope not null,
  work_location_id uuid references public.work_locations (id) on delete cascade,
  user_id uuid references public.profiles (id) on delete cascade,
  start_time time not null,
  end_time time not null,
  -- Hari kerja ISO: 1 Senin sampai 7 Minggu.
  workdays smallint[] not null default '{1,2,3,4,5,6}',
  late_tolerance_min smallint not null default 15 check (late_tolerance_min between 0 and 180),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references auth.users (id),
  constraint work_schedules_target check (
    (scope = 'perusahaan' and work_location_id is null and user_id is null)
    or (scope = 'lokasi' and work_location_id is not null and user_id is null)
    or (scope = 'karyawan' and user_id is not null and work_location_id is null)
  ),
  constraint work_schedules_times check (end_time > start_time),
  constraint work_schedules_days check (workdays <@ '{1,2,3,4,5,6,7}' and cardinality(workdays) > 0)
);
create unique index work_schedules_company on public.work_schedules (scope) where scope = 'perusahaan';
create unique index work_schedules_location on public.work_schedules (work_location_id) where scope = 'lokasi';
create unique index work_schedules_user on public.work_schedules (user_id) where scope = 'karyawan';

insert into public.work_schedules (scope, start_time, end_time, workdays, late_tolerance_min)
values ('perusahaan', '08:00', '17:00', '{1,2,3,4,5,6}', 15)
on conflict do nothing;

-- Catatan absensi: satu baris per karyawan per tanggal kerja -------------------
create table public.attendance_records (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  work_date date not null,
  clock_in_at timestamptz not null,
  clock_in_location_id uuid references public.work_locations (id),
  clock_in_lat numeric(9, 6) not null,
  clock_in_lng numeric(9, 6) not null,
  clock_in_accuracy_m numeric(7, 1),
  clock_in_distance_m integer,
  clock_in_photo_path text not null,
  late_minutes integer not null default 0 check (late_minutes >= 0),
  clock_out_at timestamptz,
  clock_out_location_id uuid references public.work_locations (id),
  clock_out_lat numeric(9, 6),
  clock_out_lng numeric(9, 6),
  clock_out_accuracy_m numeric(7, 1),
  clock_out_distance_m integer,
  clock_out_photo_path text,
  early_minutes integer not null default 0 check (early_minutes >= 0),
  clock_in_exception_id uuid,
  clock_out_exception_id uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint attendance_records_one_per_day unique (user_id, work_date),
  constraint attendance_records_out_after_in check (clock_out_at is null or clock_out_at >= clock_in_at)
);
create index attendance_records_date_idx on public.attendance_records (work_date desc);

-- Pengajuan absen di luar lokasi ----------------------------------------------
create table public.attendance_exceptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  work_date date not null,
  kind public.attendance_kind not null,
  requested_at timestamptz not null default now(),
  lat numeric(9, 6) not null,
  lng numeric(9, 6) not null,
  accuracy_m numeric(7, 1),
  nearest_location_id uuid references public.work_locations (id),
  nearest_distance_m integer,
  reason text not null check (length(btrim(reason)) between 10 and 500),
  photo_path text not null,
  status public.request_status not null default 'menunggu',
  decided_by uuid references auth.users (id),
  decided_at timestamptz,
  decision_note text check (decision_note is null or length(decision_note) <= 500),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create unique index attendance_exceptions_open
  on public.attendance_exceptions (user_id, work_date, kind) where status <> 'ditolak';
create index attendance_exceptions_status_idx on public.attendance_exceptions (status, requested_at desc);

alter table public.attendance_records
  add constraint attendance_records_in_exception
    foreign key (clock_in_exception_id) references public.attendance_exceptions (id),
  add constraint attendance_records_out_exception
    foreign key (clock_out_exception_id) references public.attendance_exceptions (id);

create trigger set_updated_at before update on public.work_schedules for each row execute function private.set_updated_at();
create trigger set_updated_at before update on public.attendance_records for each row execute function private.set_updated_at();
create trigger set_updated_at before update on public.attendance_exceptions for each row execute function private.set_updated_at();
create trigger audit after insert or update or delete on public.work_schedules for each row execute function private.audit_row();
create trigger audit after insert or update or delete on public.attendance_records for each row execute function private.audit_row();
create trigger audit after insert or update or delete on public.attendance_exceptions for each row execute function private.audit_row();
create trigger audit after insert or update or delete on public.work_locations for each row execute function private.audit_row();

-- Fungsi bantu ------------------------------------------------------------------
create or replace function private.today_wib()
returns date
language sql
stable
set search_path = ''
as $$
  select (now() at time zone 'Asia/Jakarta')::date
$$;

-- Jarak dua titik (meter), rumus haversine.
create or replace function private.distance_m(lat1 numeric, lng1 numeric, lat2 numeric, lng2 numeric)
returns double precision
language sql
immutable
set search_path = ''
as $$
  select 2 * 6371000 * asin(sqrt(
    power(sin(radians((lat2 - lat1)::double precision) / 2), 2)
    + cos(radians(lat1::double precision)) * cos(radians(lat2::double precision))
      * power(sin(radians((lng2 - lng1)::double precision) / 2), 2)
  ))
$$;

-- Jam kerja yang berlaku: karyawan, lalu titik absensi, lalu perusahaan.
create or replace function private.effective_schedule(p_user uuid, p_location uuid)
returns public.work_schedules
language sql
stable
security definer
set search_path = ''
as $$
  select s.*
  from public.work_schedules s
  where (s.scope = 'karyawan' and s.user_id = p_user)
     or (s.scope = 'lokasi' and s.work_location_id = p_location)
     or s.scope = 'perusahaan'
  order by case s.scope when 'karyawan' then 1 when 'lokasi' then 2 else 3 end
  limit 1
$$;

-- Titik absensi aktif terdekat dari koordinat.
create or replace function private.nearest_location(p_lat numeric, p_lng numeric)
returns table (location_id uuid, distance_m integer, radius_m integer)
language sql
stable
security definer
set search_path = ''
as $$
  select l.id, round(private.distance_m(p_lat, p_lng, l.lat, l.lng))::integer, l.radius_m
  from public.work_locations l
  where l.is_active and l.deleted_at is null
  order by private.distance_m(p_lat, p_lng, l.lat, l.lng)
  limit 1
$$;

-- Wajib absen: akun aktif dengan role karyawan, kecuali owner (juga kalau owner rangkap jabatan).
-- Akun khusus CMS tidak memakai absensi.
create or replace function private.must_attend()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select private.has_role('admin', 'marketing_manager', 'marketing', 'site_manager', 'site_supervisor', 'finance')
    and not private.has_role('owner')
$$;

-- Foto harus milik pengguna dan sudah ada di bucket selfie.
create or replace function private.own_attendance_photo(p_path text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select split_part(p_path, '/', 1) = (select auth.uid())::text
    and exists (select 1 from storage.objects o where o.bucket_id = 'attendance-photos' and o.name = p_path)
$$;

/**
 * Clock in atau clock out. Dipanggil server action dengan sesi karyawan. Waktu dari server.
 * Hasil: status 'ok', atau 'di_luar_radius' dengan titik terdekat (tidak menyimpan apa pun).
 */
create or replace function public.attendance_clock(
  p_kind public.attendance_kind,
  p_lat numeric,
  p_lng numeric,
  p_accuracy numeric,
  p_photo_path text
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user uuid := auth.uid();
  v_today date := private.today_wib();
  v_now timestamptz := now();
  v_near record;
  v_schedule public.work_schedules;
  v_record public.attendance_records;
  v_minutes integer;
begin
  if v_user is null or not private.must_attend() then
    raise exception 'Akun ini tidak memakai absensi.' using errcode = '42501';
  end if;
  if p_lat is null or p_lng is null or p_lat not between -90 and 90 or p_lng not between -180 and 180 then
    raise exception 'Lokasi tidak valid.' using errcode = '22023';
  end if;
  if not private.own_attendance_photo(p_photo_path) then
    raise exception 'Foto absensi tidak ditemukan.' using errcode = '22023';
  end if;

  select * into v_near from private.nearest_location(p_lat, p_lng);
  if v_near.location_id is null then
    raise exception 'Belum ada titik absensi aktif. Hubungi owner.' using errcode = '22023';
  end if;
  if v_near.distance_m > v_near.radius_m then
    return jsonb_build_object(
      'status', 'di_luar_radius',
      'nearest_location_id', v_near.location_id,
      'distance_m', v_near.distance_m,
      'radius_m', v_near.radius_m
    );
  end if;

  select * into v_record from public.attendance_records
  where user_id = v_user and work_date = v_today;
  v_schedule := private.effective_schedule(v_user, v_near.location_id);

  if p_kind = 'masuk' then
    if v_record.id is not null then
      raise exception 'Anda sudah clock in hari ini.' using errcode = '22023';
    end if;
    v_minutes := greatest(0, floor(extract(epoch from (
      (v_now at time zone 'Asia/Jakarta')::time - v_schedule.start_time
    )) / 60)::integer - v_schedule.late_tolerance_min);
    insert into public.attendance_records (
      user_id, work_date, clock_in_at, clock_in_location_id, clock_in_lat, clock_in_lng,
      clock_in_accuracy_m, clock_in_distance_m, clock_in_photo_path, late_minutes
    ) values (
      v_user, v_today, v_now, v_near.location_id, p_lat, p_lng, p_accuracy, v_near.distance_m,
      p_photo_path, v_minutes
    ) returning * into v_record;
  else
    if v_record.id is null then
      raise exception 'Clock in dulu sebelum clock out.' using errcode = '22023';
    end if;
    if v_record.clock_out_at is not null then
      raise exception 'Anda sudah clock out hari ini.' using errcode = '22023';
    end if;
    v_minutes := greatest(0, floor(extract(epoch from (
      v_schedule.end_time - (v_now at time zone 'Asia/Jakarta')::time
    )) / 60)::integer);
    update public.attendance_records
    set clock_out_at = v_now, clock_out_location_id = v_near.location_id, clock_out_lat = p_lat,
        clock_out_lng = p_lng, clock_out_accuracy_m = p_accuracy, clock_out_distance_m = v_near.distance_m,
        clock_out_photo_path = p_photo_path, early_minutes = v_minutes
    where id = v_record.id
    returning * into v_record;
  end if;

  return jsonb_build_object(
    'status', 'ok',
    'record_id', v_record.id,
    'location_id', v_near.location_id,
    'distance_m', v_near.distance_m,
    'late_minutes', v_record.late_minutes,
    'early_minutes', v_record.early_minutes
  );
end;
$$;

/** Pengajuan absen di luar lokasi (alasan wajib). Disetujui owner atau manajer tim (PR berikutnya). */
create or replace function public.request_attendance_exception(
  p_kind public.attendance_kind,
  p_lat numeric,
  p_lng numeric,
  p_accuracy numeric,
  p_photo_path text,
  p_reason text
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user uuid := auth.uid();
  v_today date := private.today_wib();
  v_near record;
  v_id uuid;
begin
  if v_user is null or not private.must_attend() then
    raise exception 'Akun ini tidak memakai absensi.' using errcode = '42501';
  end if;
  if not private.own_attendance_photo(p_photo_path) then
    raise exception 'Foto absensi tidak ditemukan.' using errcode = '22023';
  end if;
  if p_kind = 'pulang' and not exists (
    select 1 from public.attendance_records where user_id = v_user and work_date = v_today
  ) then
    raise exception 'Clock in dulu sebelum mengajukan clock out.' using errcode = '22023';
  end if;
  select * into v_near from private.nearest_location(p_lat, p_lng);
  insert into public.attendance_exceptions (
    user_id, work_date, kind, lat, lng, accuracy_m, nearest_location_id, nearest_distance_m,
    reason, photo_path
  ) values (
    v_user, v_today, p_kind, p_lat, p_lng, p_accuracy, v_near.location_id, v_near.distance_m,
    btrim(p_reason), p_photo_path
  ) returning id into v_id;
  return v_id;
exception
  when unique_violation then
    raise exception 'Pengajuan untuk absen ini sudah dikirim dan menunggu keputusan.' using errcode = '22023';
end;
$$;

revoke execute on function public.attendance_clock(public.attendance_kind, numeric, numeric, numeric, text) from public, anon;
revoke execute on function public.request_attendance_exception(public.attendance_kind, numeric, numeric, numeric, text, text) from public, anon;
grant execute on function public.attendance_clock(public.attendance_kind, numeric, numeric, numeric, text) to authenticated;
grant execute on function public.request_attendance_exception(public.attendance_kind, numeric, numeric, numeric, text, text) to authenticated;
revoke all on function private.today_wib(), private.distance_m(numeric, numeric, numeric, numeric),
  private.effective_schedule(uuid, uuid), private.nearest_location(numeric, numeric),
  private.own_attendance_photo(text), private.must_attend() from public;
grant execute on function private.today_wib(), private.distance_m(numeric, numeric, numeric, numeric),
  private.effective_schedule(uuid, uuid), private.nearest_location(numeric, numeric),
  private.own_attendance_photo(text), private.must_attend() to authenticated;

-- Storage: selfie absensi (privat, kecil) ------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('attendance-photos', 'attendance-photos', false, 204800, array['image/webp', 'image/jpeg'])
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

create policy "selfie absensi: diunggah pemilik"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'attendance-photos'
    and private.must_attend()
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );
create policy "selfie absensi: dibaca pemilik, owner, dan manajer"
  on storage.objects for select to authenticated
  using (
    bucket_id = 'attendance-photos'
    and (
      (storage.foldername(name))[1] = (select auth.uid())::text
      or private.has_role('owner', 'admin')
      or (
        private.has_role('marketing_manager', 'site_manager')
        and private.in_same_team(((storage.foldername(name))[1])::uuid)
      )
    )
  );

-- RLS ---------------------------------------------------------------------------
alter table public.work_schedules enable row level security;
alter table public.attendance_records enable row level security;
alter table public.attendance_exceptions enable row level security;

revoke all on public.work_schedules, public.attendance_records, public.attendance_exceptions from anon, authenticated;
grant select on public.work_schedules, public.attendance_records, public.attendance_exceptions to authenticated;
grant insert, update, delete on public.work_schedules to authenticated;
grant all on public.work_schedules, public.attendance_records, public.attendance_exceptions to service_role;

create policy "jam kerja: dibaca staf aktif"
  on public.work_schedules for select to authenticated using (private.is_staff());
create policy "jam kerja: diatur owner"
  on public.work_schedules for all to authenticated
  using (private.has_role('owner', 'admin')) with check (private.has_role('owner', 'admin'));

-- Absensi ditulis hanya lewat fungsi. Dibaca pemilik, owner, manajer timnya, dan keuangan (gaji).
create policy "absensi: dibaca pemilik, owner, manajer tim, keuangan"
  on public.attendance_records for select to authenticated
  using (
    user_id = (select auth.uid())
    or private.has_role('owner', 'admin', 'finance')
    or (private.has_role('marketing_manager', 'site_manager') and private.in_same_team(user_id))
  );
create policy "pengajuan di luar lokasi: dibaca pemilik, owner, manajer tim"
  on public.attendance_exceptions for select to authenticated
  using (
    user_id = (select auth.uid())
    or private.has_role('owner', 'admin')
    or (private.has_role('marketing_manager', 'site_manager') and private.in_same_team(user_id))
  );
