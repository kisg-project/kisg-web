-- Fase 2a: bucket storage (docs/data-model.md bagian 14). Batas ukuran adalah batas keras server,
-- target kompresi browser lebih kecil (CLAUDE.md bagian 8). Bucket fitur lain dibuat di fasenya.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('public-assets', 'public-assets', true, 2097152, array['image/webp', 'image/jpeg', 'image/png', 'image/svg+xml']),
  ('avatars', 'avatars', false, 262144, array['image/webp', 'image/jpeg', 'image/png'])
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

-- public-assets: semua orang membaca (bucket publik), hanya owner/admin yang menulis.
create policy "aset publik: dikelola admin/owner (insert)"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'public-assets' and private.has_role('owner', 'admin'));
create policy "aset publik: dikelola admin/owner (update)"
  on storage.objects for update to authenticated
  using (bucket_id = 'public-assets' and private.has_role('owner', 'admin'));
create policy "aset publik: dikelola admin/owner (delete)"
  on storage.objects for delete to authenticated
  using (bucket_id = 'public-assets' and private.has_role('owner', 'admin'));

-- avatars: dibaca staf aktif, ditulis pemilik di folder user_id-nya sendiri.
create policy "avatar: dibaca staf aktif"
  on storage.objects for select to authenticated
  using (bucket_id = 'avatars' and private.is_staff());
create policy "avatar: ditulis pemilik (insert)"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'avatars'
    and private.is_staff()
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );
create policy "avatar: ditulis pemilik (update)"
  on storage.objects for update to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy "avatar: dihapus pemilik"
  on storage.objects for delete to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = (select auth.uid())::text);
