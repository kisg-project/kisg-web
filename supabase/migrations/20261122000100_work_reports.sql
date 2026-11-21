-- Absensi D2 (CLAUDE.md bagian 8): rencana kegiatan wajib setelah clock in, hasil kerja wajib setelah
-- clock out. Lampiran foto (dikompres di HP) dan file di bucket privat work-attachments.

create type public.work_report_kind as enum ('rencana', 'hasil');

create table public.work_reports (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  work_date date not null,
  kind public.work_report_kind not null,
  content text not null check (length(btrim(content)) between 10 and 4000),
  -- Daftar lampiran: [{ "path": "...", "name": "...", "type": "...", "size": 123 }]
  attachments jsonb not null default '[]'::jsonb check (jsonb_typeof(attachments) = 'array' and jsonb_array_length(attachments) <= 10),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, work_date, kind)
);
create index work_reports_date on public.work_reports (work_date desc);

create trigger set_updated_at before update on public.work_reports for each row execute function private.set_updated_at();
create trigger audit after insert or update or delete on public.work_reports for each row execute function private.audit_row();

-- Lampiran milik sendiri: folder pertama = id user, dan file benar-benar ada di bucket.
create or replace function private.own_work_attachment(p_path text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select split_part(p_path, '/', 1) = (select auth.uid())::text
    and exists (select 1 from storage.objects o where o.bucket_id = 'work-attachments' and o.name = p_path)
$$;

/**
 * Simpan rencana atau hasil kerja hari ini (WIB). Rencana butuh clock in hari ini, hasil butuh clock
 * out hari ini. Boleh diperbarui di hari yang sama. Pesan errcode 22023 ditujukan untuk karyawan.
 */
create or replace function public.submit_work_report(
  p_kind public.work_report_kind,
  p_content text,
  p_attachments jsonb default '[]'::jsonb
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user uuid := auth.uid();
  v_today date := private.today_wib();
  v_record public.attendance_records;
  v_item jsonb;
  v_id uuid;
begin
  if v_user is null or not private.must_attend() then
    raise exception 'Akun ini tidak memakai laporan harian.' using errcode = '42501';
  end if;
  select * into v_record from public.attendance_records where user_id = v_user and work_date = v_today;
  if v_record.id is null then
    raise exception 'Clock in dulu sebelum mengisi rencana.' using errcode = '22023';
  end if;
  if p_kind = 'hasil' and v_record.clock_out_at is null then
    raise exception 'Clock out dulu sebelum mengisi hasil kerja.' using errcode = '22023';
  end if;
  if length(btrim(coalesce(p_content, ''))) < 10 then
    raise exception 'Tulis minimal 10 karakter.' using errcode = '22023';
  end if;
  if jsonb_typeof(coalesce(p_attachments, '[]'::jsonb)) <> 'array' or jsonb_array_length(coalesce(p_attachments, '[]'::jsonb)) > 10 then
    raise exception 'Lampiran maksimal 10 file.' using errcode = '22023';
  end if;
  for v_item in select * from jsonb_array_elements(coalesce(p_attachments, '[]'::jsonb)) loop
    if not private.own_work_attachment(v_item ->> 'path') then
      raise exception 'Lampiran tidak ditemukan. Unggah ulang.' using errcode = '22023';
    end if;
  end loop;

  insert into public.work_reports (user_id, work_date, kind, content, attachments)
  values (v_user, v_today, p_kind, btrim(p_content), coalesce(p_attachments, '[]'::jsonb))
  on conflict (user_id, work_date, kind) do update
    set content = excluded.content, attachments = excluded.attachments
  returning id into v_id;
  return v_id;
end;
$$;

revoke execute on function public.submit_work_report(public.work_report_kind, text, jsonb) from public, anon;
grant execute on function public.submit_work_report(public.work_report_kind, text, jsonb) to authenticated;
revoke all on function private.own_work_attachment(text) from public;
grant execute on function private.own_work_attachment(text) to authenticated;

-- Storage: lampiran laporan harian (privat).
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'work-attachments', 'work-attachments', false, 2097152,
  array[
    'image/webp', 'image/jpeg', 'application/pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  ]
)
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

create policy "lampiran laporan: diunggah pemilik"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'work-attachments'
    and private.must_attend()
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );
create policy "lampiran laporan: dibaca pemilik, owner, dan manajer"
  on storage.objects for select to authenticated
  using (
    bucket_id = 'work-attachments'
    and (
      (storage.foldername(name))[1] = (select auth.uid())::text
      or private.has_role('owner', 'admin')
      or (
        private.has_role('marketing_manager', 'site_manager')
        and private.in_same_team(((storage.foldername(name))[1])::uuid)
      )
    )
  );

alter table public.work_reports enable row level security;
revoke all on public.work_reports from anon, authenticated;
grant select on public.work_reports to authenticated;
grant all on public.work_reports to service_role;

create policy "laporan harian: dibaca pemilik, owner, manajer tim"
  on public.work_reports for select to authenticated
  using (
    user_id = (select auth.uid())
    or private.has_role('owner', 'admin')
    or (private.has_role('marketing_manager', 'site_manager') and private.in_same_team(user_id))
  );
