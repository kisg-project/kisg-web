-- Tanda tangan sidik jari (WebAuthn, keputusan owner 22 November 2026): satu kunci perangkat aktif
-- per akun, didaftarkan sekali dan hanya bisa direset Direktur Utama. Data sidik jari tidak pernah
-- meninggalkan perangkat; server hanya menyimpan kunci publik. Cap persetujuan mencatat metodenya.

create type public.signature_method as enum ('password', 'biometrik', 'cadangan');

create table public.webauthn_credentials (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  credential_id text not null unique,
  public_key text not null,
  counter bigint not null default 0 check (counter >= 0),
  transports text[] not null default '{}',
  device_label text check (device_label is null or length(device_label) <= 120),
  created_at timestamptz not null default now(),
  last_used_at timestamptz,
  revoked_at timestamptz,
  revoked_by uuid references public.profiles (id)
);
create unique index webauthn_credentials_one_active on public.webauthn_credentials (user_id)
  where revoked_at is null;
create trigger audit after insert or update or delete on public.webauthn_credentials
  for each row execute function private.audit_row();

-- Tantangan sekali pakai (berlaku 5 menit). Untuk tanda tangan, isinya mengikat hash dokumen.
create table public.webauthn_challenges (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  purpose text not null check (purpose in ('daftar', 'tanda_tangan')),
  challenge text not null unique,
  payload jsonb not null default '{}'::jsonb,
  expires_at timestamptz not null,
  used_at timestamptz,
  created_at timestamptz not null default now()
);
create index webauthn_challenges_user on public.webauthn_challenges (user_id, purpose, created_at desc);

alter table public.webauthn_credentials enable row level security;
alter table public.webauthn_challenges enable row level security;
revoke all on public.webauthn_credentials, public.webauthn_challenges from anon, authenticated;
grant select on public.webauthn_credentials to authenticated;
grant all on public.webauthn_credentials, public.webauthn_challenges to service_role;

-- Ditulis hanya oleh server (service role). Dibaca pemilik dan Direktur Utama.
create policy "kunci sidik jari: dibaca pemilik dan owner"
  on public.webauthn_credentials for select to authenticated
  using (user_id = (select auth.uid()) or private.has_role('owner', 'admin'));
create policy "tantangan: tidak bisa diakses client"
  on public.webauthn_challenges for all to authenticated
  using (false) with check (false);

-- Cap mencatat metode tanda tangan dan kunci perangkat yang dipakai.
alter table public.approval_stamps
  add column method public.signature_method not null default 'password',
  add column credential_id text;

/** Hash isi dokumen saat ini (untuk tantangan sidik jari). Khusus server. */
create or replace function public.document_hash(p_doc_type public.approval_doc_type, p_doc_id uuid)
returns text
language sql
stable
security definer
set search_path = ''
as $$
  select private.sha256_hex(private.document_content(p_doc_type, p_doc_id))
$$;
revoke all on function public.document_hash(public.approval_doc_type, uuid) from public, anon, authenticated;
grant execute on function public.document_hash(public.approval_doc_type, uuid) to service_role;

-- Fungsi keputusan mendapat parameter metode. Parameter baru punya default, jadi pemanggil lama
-- tetap jalan selama deploy.
drop function public.decide_attendance_exception(uuid, uuid, public.approval_decision, text, text, numeric, numeric);

create function public.decide_attendance_exception(
  p_actor uuid,
  p_id uuid,
  p_decision public.approval_decision,
  p_note text default null,
  p_user_agent text default null,
  p_lat numeric default null,
  p_lng numeric default null,
  p_method public.signature_method default 'password',
  p_credential_id text default null
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
  perform set_config('request.jwt.claim.sub', p_actor::text, true);

  if p_method = 'biometrik' and not exists (
    select 1 from public.webauthn_credentials
    where user_id = p_actor and credential_id = p_credential_id and revoked_at is null
  ) then
    raise exception 'Sidik jari tidak terdaftar untuk akun ini.' using errcode = '42501';
  end if;

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
    user_agent, lat, lng, note, content_hash, verify_code, method, credential_id
  ) values (
    'absen_luar_lokasi', p_id, v_exception.user_id, p_decision, p_actor,
    coalesce(nullif(btrim(v_name), ''), 'Tanpa nama'), v_role, v_now, left(p_user_agent, 500),
    round(p_lat, 6), round(p_lng, 6), v_note, v_hash, v_code, p_method,
    case when p_method = 'biometrik' then p_credential_id end
  );
  if p_method = 'biometrik' then
    update public.webauthn_credentials set last_used_at = v_now
    where credential_id = p_credential_id;
  end if;
  return jsonb_build_object('verify_code', v_code, 'signed_at', v_now);
end;
$$;

revoke all on function public.decide_attendance_exception(uuid, uuid, public.approval_decision, text, text, numeric, numeric, public.signature_method, text) from public, anon, authenticated;
grant execute on function public.decide_attendance_exception(uuid, uuid, public.approval_decision, text, text, numeric, numeric, public.signature_method, text) to service_role;

-- Verifikasi publik ikut menampilkan metode tanda tangan.
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
    'method', v_stamp.method,
    'matches', coalesce(
      private.sha256_hex(private.document_content(v_stamp.doc_type, v_stamp.doc_id)) = v_stamp.content_hash,
      false
    )
  );
end;
$$;
