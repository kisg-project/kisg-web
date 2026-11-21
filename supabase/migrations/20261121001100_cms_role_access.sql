-- Hak tulis konten website untuk role cms (keputusan owner, 21 November 2026). Owner dan akun admin
-- lama tetap punya hak di database (kompatibel), tetapi panel CMS hanya bisa dibuka akun cms dan
-- portal tidak bisa dibuka akun cms (dipaksa di aplikasi). Role cms tidak boleh digabung role lain.

alter policy "berita: dikelola admin/owner" on public.posts
  using (private.has_role('owner', 'admin', 'cms'))
  with check (private.has_role('owner', 'admin', 'cms'));

alter policy "promo: dikelola admin/owner" on public.promos
  using (private.has_role('owner', 'admin', 'cms'))
  with check (private.has_role('owner', 'admin', 'cms'));

alter policy "banner: dikelola admin/owner" on public.banners
  using (private.has_role('owner', 'admin', 'cms'))
  with check (private.has_role('owner', 'admin', 'cms'));

alter policy "faq: dikelola admin/owner" on public.faqs
  using (private.has_role('owner', 'admin', 'cms'))
  with check (private.has_role('owner', 'admin', 'cms'));

alter policy "karir: dikelola admin/owner" on public.careers
  using (private.has_role('owner', 'admin', 'cms'))
  with check (private.has_role('owner', 'admin', 'cms'));

alter policy "media proyek: dikelola admin/owner" on public.project_media
  using (private.has_role('owner', 'admin', 'cms'))
  with check (private.has_role('owner', 'admin', 'cms'));

alter policy "fasilitas: dikelola admin/owner" on public.facilities
  using (private.has_role('owner', 'admin', 'cms'))
  with check (private.has_role('owner', 'admin', 'cms'));

alter policy "tempat sekitar: dikelola admin/owner" on public.nearby_places
  using (private.has_role('owner', 'admin', 'cms'))
  with check (private.has_role('owner', 'admin', 'cms'));

alter policy "progres: dikelola admin/owner" on public.construction_updates
  using (private.has_role('owner', 'admin', 'cms'))
  with check (private.has_role('owner', 'admin', 'cms'));

alter policy "proyek: dikelola admin/owner" on public.projects
  using (private.has_role('owner', 'admin', 'cms'))
  with check (private.has_role('owner', 'admin', 'cms'));

alter policy "tipe unit: dikelola admin/owner" on public.unit_types
  using (private.has_role('owner', 'admin', 'cms'))
  with check (private.has_role('owner', 'admin', 'cms'));

alter policy "unit: dikelola admin/owner" on public.units
  using (private.has_role('owner', 'admin', 'cms'))
  with check (private.has_role('owner', 'admin', 'cms'));

alter policy "pengaturan: dikelola admin/owner" on public.site_settings
  using (private.has_role('owner', 'admin', 'cms'))
  with check (private.has_role('owner', 'admin', 'cms'));

alter policy "aset publik: dikelola admin/owner (insert)" on storage.objects
  with check (bucket_id = 'public-assets' and private.has_role('owner', 'admin', 'cms'));

alter policy "aset publik: dikelola admin/owner (update)" on storage.objects
  using (bucket_id = 'public-assets' and private.has_role('owner', 'admin', 'cms'));

alter policy "aset publik: dikelola admin/owner (delete)" on storage.objects
  using (bucket_id = 'public-assets' and private.has_role('owner', 'admin', 'cms'));

-- Role cms harus berdiri sendiri: akun CMS bukan akun karyawan.
create or replace function private.check_cms_exclusive()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if exists (
    select 1 from public.user_roles
    where user_id = new.user_id
      and ((new.role = 'cms' and role <> 'cms') or (new.role <> 'cms' and role = 'cms'))
  ) then
    raise exception 'Role Pengelola CMS tidak bisa digabung dengan role lain.' using errcode = '22023';
  end if;
  return new;
end;
$$;

create trigger cms_exclusive
  after insert or update on public.user_roles
  for each row execute function private.check_cms_exclusive();
