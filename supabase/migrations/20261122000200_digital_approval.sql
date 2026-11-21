-- Persetujuan digital (CLAUDE.md bagian 8) dan keputusan absen di luar lokasi (Absensi D3).
-- Cap persetujuan permanen: tanpa policy update/delete dan trigger yang menolak perubahan. Fungsi
-- keputusan hanya bisa dipanggil server (service role) setelah password penyetuju diperiksa.

create type public.approval_decision as enum ('disetujui', 'ditolak');
create type public.approval_doc_type as enum ('absen_luar_lokasi');

create table public.approval_stamps (
  id uuid primary key default gen_random_uuid(),
  doc_type public.approval_doc_type not null,
  doc_id uuid not null,
  -- Karyawan pemilik dokumen (boleh melihat siapa yang memutuskan).
  subject_user_id uuid references public.profiles (id),
  decision public.approval_decision not null,
  signer_id uuid not null references public.profiles (id),
  signer_name text not null,
  signer_role public.app_role not null,
  signed_at timestamptz not null default now(),
  user_agent text check (user_agent is null or length(user_agent) <= 500),
  lat numeric(9, 6),
  lng numeric(9, 6),
  note text check (note is null or length(note) <= 500),
  -- SHA-256 (hex) isi dokumen saat diputuskan, dan kode verifikasi dari isi, penyetuju, dan waktu.
  content_hash text not null check (content_hash ~ '^[0-9a-f]{64}$'),
  verify_code text not null unique check (verify_code ~ '^[0-9a-f]{64}$'),
  created_at timestamptz not null default now()
);
create index approval_stamps_doc on public.approval_stamps (doc_type, doc_id);

create or replace function private.reject_stamp_change()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  raise exception 'Cap persetujuan tidak bisa diubah atau dihapus.' using errcode = '42501';
end;
$$;

create trigger immutable before update or delete on public.approval_stamps
  for each row execute function private.reject_stamp_change();
create trigger audit after insert on public.approval_stamps
  for each row execute function private.audit_row();

create or replace function private.sha256_hex(p_value text)
returns text
language sql
immutable
set search_path = ''
as $$
  select encode(extensions.digest(convert_to(p_value, 'UTF8'), 'sha256'), 'hex')
$$;

/**
 * Isi dokumen yang ditandatangani, dalam bentuk teks kanonik (jsonb, urutan kunci tetap). Dipakai saat
 * memutuskan dan saat verifikasi. Jenis dokumen baru menambah cabang di sini lewat migrasi berikutnya.
 */
create or replace function private.document_content(p_doc_type public.approval_doc_type, p_doc_id uuid)
returns text
language sql
stable
security definer
set search_path = ''
as $$
  select case p_doc_type
    when 'absen_luar_lokasi' then (
      select jsonb_build_object(
        'id', e.id, 'user_id', e.user_id, 'work_date', e.work_date, 'kind', e.kind,
        'requested_at', to_char(e.requested_at at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.US"Z"'),
        'lat', e.lat, 'lng', e.lng, 'nearest_location_id', e.nearest_location_id,
        'nearest_distance_m', e.nearest_distance_m, 'reason', e.reason, 'photo_path', e.photo_path
      )::text
      from public.attendance_exceptions e where e.id = p_doc_id
    )
  end
$$;

/**
 * Keputusan pengajuan absen di luar lokasi oleh owner/admin, atau manajer tim karyawan itu. Disetujui:
 * absen tercatat dengan waktu pengajuan (titik di luar radius, jarak ke titik terdekat). Penolakan wajib
 * catatan. Pengaju tidak bisa memutuskan pengajuannya sendiri. Mengembalikan kode verifikasi.
 */
create or replace function public.decide_attendance_exception(
  p_actor uuid,
  p_id uuid,
  p_decision public.approval_decision,
  p_note text default null,
  p_user_agent text default null,
  p_lat numeric default null,
  p_lng numeric default null
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_exception public.attendance_exceptions;
  v_record public.attendance_records;
  v_roles public.app_role[];
  v_role public.app_role;
  v_name text;
  v_note text := nullif(btrim(coalesce(p_note, '')), '');
  v_now timestamptz := now();
  v_hash text;
  v_code text;
  v_schedule public.work_schedules;
  v_minutes integer;
begin
  -- Audit mencatat penyetuju sebagai pelaku.
  perform set_config('request.jwt.claim.sub', p_actor::text, true);

  select * into v_exception from public.attendance_exceptions where id = p_id for update;
  if v_exception.id is null then
    raise exception 'Pengajuan tidak ditemukan.' using errcode = '22023';
  end if;
  if v_exception.status <> 'menunggu' then
    raise exception 'Pengajuan ini sudah diputuskan.' using errcode = '22023';
  end if;
  if v_exception.user_id = p_actor then
    raise exception 'Pengajuan sendiri tidak bisa diputuskan sendiri.' using errcode = '42501';
  end if;

  select array_agg(r.role), max(p.full_name) into v_roles, v_name
  from public.user_roles r
  join public.profiles p on p.id = r.user_id and p.is_active and p.deleted_at is null
  where r.user_id = p_actor;
  v_role := case
    when 'owner' = any (v_roles) then 'owner'::public.app_role
    when 'admin' = any (v_roles) then 'admin'::public.app_role
    when 'marketing_manager' = any (v_roles) and exists (
      select 1 from public.team_members a join public.team_members b on b.team_id = a.team_id
      where a.user_id = p_actor and b.user_id = v_exception.user_id
    ) then 'marketing_manager'::public.app_role
    when 'site_manager' = any (v_roles) and exists (
      select 1 from public.team_members a join public.team_members b on b.team_id = a.team_id
      where a.user_id = p_actor and b.user_id = v_exception.user_id
    ) then 'site_manager'::public.app_role
  end;
  if v_role is null then
    raise exception 'Anda tidak berwenang memutuskan pengajuan ini.' using errcode = '42501';
  end if;
  if p_decision = 'ditolak' and (v_note is null or length(v_note) < 5) then
    raise exception 'Tulis alasan penolakan minimal 5 karakter.' using errcode = '22023';
  end if;
  if length(coalesce(v_note, '')) > 500 then
    raise exception 'Catatan maksimal 500 karakter.' using errcode = '22023';
  end if;

  if p_decision = 'disetujui' then
    select * into v_record from public.attendance_records
    where user_id = v_exception.user_id and work_date = v_exception.work_date for update;
    v_schedule := private.effective_schedule(v_exception.user_id, v_exception.nearest_location_id);
    if v_exception.kind = 'masuk' then
      if v_record.id is not null then
        raise exception 'Karyawan sudah clock in di tanggal itu. Tolak pengajuan ini.' using errcode = '22023';
      end if;
      v_minutes := greatest(0, floor(extract(epoch from (
        (v_exception.requested_at at time zone 'Asia/Jakarta')::time - v_schedule.start_time
      )) / 60)::integer - v_schedule.late_tolerance_min);
      insert into public.attendance_records (
        user_id, work_date, clock_in_at, clock_in_lat, clock_in_lng, clock_in_accuracy_m,
        clock_in_distance_m, clock_in_photo_path, late_minutes, clock_in_exception_id
      ) values (
        v_exception.user_id, v_exception.work_date, v_exception.requested_at, v_exception.lat,
        v_exception.lng, v_exception.accuracy_m, v_exception.nearest_distance_m,
        v_exception.photo_path, v_minutes, v_exception.id
      );
    else
      if v_record.id is null then
        raise exception 'Karyawan belum clock in di tanggal itu.' using errcode = '22023';
      end if;
      if v_record.clock_out_at is not null then
        raise exception 'Karyawan sudah clock out di tanggal itu. Tolak pengajuan ini.' using errcode = '22023';
      end if;
      v_minutes := greatest(0, floor(extract(epoch from (
        v_schedule.end_time - (v_exception.requested_at at time zone 'Asia/Jakarta')::time
      )) / 60)::integer);
      update public.attendance_records
      set clock_out_at = greatest(v_exception.requested_at, v_record.clock_in_at),
          clock_out_lat = v_exception.lat, clock_out_lng = v_exception.lng,
          clock_out_accuracy_m = v_exception.accuracy_m,
          clock_out_distance_m = v_exception.nearest_distance_m,
          clock_out_photo_path = v_exception.photo_path, early_minutes = v_minutes,
          clock_out_exception_id = v_exception.id
      where id = v_record.id;
    end if;
  end if;

  update public.attendance_exceptions
  set status = p_decision::text::public.request_status, decided_by = p_actor, decided_at = v_now,
      decision_note = v_note
  where id = p_id;

  v_hash := private.sha256_hex(private.document_content('absen_luar_lokasi', p_id));
  v_code := private.sha256_hex(
    v_hash || '|' || p_actor::text || '|'
      || to_char(v_now at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.US"Z"')
  );
  insert into public.approval_stamps (
    doc_type, doc_id, subject_user_id, decision, signer_id, signer_name, signer_role, signed_at,
    user_agent, lat, lng, note, content_hash, verify_code
  ) values (
    'absen_luar_lokasi', p_id, v_exception.user_id, p_decision, p_actor,
    coalesce(nullif(btrim(v_name), ''), 'Tanpa nama'), v_role, v_now, left(p_user_agent, 500),
    round(p_lat, 6), round(p_lng, 6), v_note, v_hash, v_code
  );
  return jsonb_build_object('verify_code', v_code, 'signed_at', v_now);
end;
$$;

/**
 * Verifikasi cap dari kode QR (halaman publik). Isi dokumen dihitung ulang: kalau berubah setelah
 * diputuskan, hasilnya tidak cocok. Hanya data ringkas yang dikembalikan.
 */
create or replace function public.verify_approval(p_code text)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_stamp public.approval_stamps;
  v_subject text;
  v_label text;
begin
  if p_code is null or p_code !~ '^[0-9a-f]{64}$' then
    return null;
  end if;
  select * into v_stamp from public.approval_stamps where verify_code = p_code;
  if v_stamp.id is null then
    return null;
  end if;
  select full_name into v_subject from public.profiles where id = v_stamp.subject_user_id;
  if v_stamp.doc_type = 'absen_luar_lokasi' then
    select case e.kind when 'masuk' then 'Clock in' else 'Clock out' end
      || ' di luar lokasi, ' || to_char(e.work_date, 'DD-MM-YYYY')
    into v_label
    from public.attendance_exceptions e where e.id = v_stamp.doc_id;
  end if;
  return jsonb_build_object(
    'doc_type', v_stamp.doc_type,
    'document', coalesce(v_label, 'Dokumen tidak ditemukan'),
    'subject', v_subject,
    'decision', v_stamp.decision,
    'signer_name', v_stamp.signer_name,
    'signer_role', v_stamp.signer_role,
    'signed_at', v_stamp.signed_at,
    'matches', coalesce(
      private.sha256_hex(private.document_content(v_stamp.doc_type, v_stamp.doc_id)) = v_stamp.content_hash,
      false
    )
  );
end;
$$;

revoke all on function public.decide_attendance_exception(uuid, uuid, public.approval_decision, text, text, numeric, numeric) from public, anon, authenticated;
grant execute on function public.decide_attendance_exception(uuid, uuid, public.approval_decision, text, text, numeric, numeric) to service_role;
revoke all on function public.verify_approval(text) from public;
grant execute on function public.verify_approval(text) to anon, authenticated, service_role;
revoke all on function private.document_content(public.approval_doc_type, uuid), private.sha256_hex(text), private.reject_stamp_change() from public;

alter table public.approval_stamps enable row level security;
revoke all on public.approval_stamps from anon, authenticated;
grant select on public.approval_stamps to authenticated;
grant select, insert on public.approval_stamps to service_role;

create policy "cap persetujuan: dibaca owner, penyetuju, dan pemilik dokumen"
  on public.approval_stamps for select to authenticated
  using (
    private.has_role('owner', 'admin')
    or signer_id = (select auth.uid())
    or subject_user_id = (select auth.uid())
  );
