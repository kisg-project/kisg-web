-- Seed khusus development dan CI (supabase db reset). Tidak pernah dijalankan ke production.
-- Data proyek di bawah adalah data asli dari owner (19 November 2026). User contoh per role dibuat
-- oleh global setup E2E lewat admin API (Fase 2b), bukan di sini.

insert into public.projects (
  slug, name, status, content_status, address, village, district, city, province, postal_code,
  is_featured, sort_order
) values (
  'sejahtera-green-village',
  'Sejahtera Green Village',
  'tersedia',
  'terbit',
  'Jl. Garuda 3 No. NK-34, Blok H-21, RT 9/RW 14',
  'Mangunjaya',
  'Kec. Tambun Selatan',
  'Kab. Bekasi',
  'Jawa Barat',
  '17510',
  true,
  1
);

insert into public.unit_types (
  project_id, slug, name, land_area, building_area, bedrooms, bathrooms, price_from, show_price, sort_order
)
select id, 'tipe-36-60', 'Tipe 36/60', 60, 36, 2, 1, 571250000, true, 1
from public.projects where slug = 'sejahtera-green-village';

-- Proyek draft untuk menguji bahwa konten yang belum terbit tidak terlihat publik.
insert into public.projects (slug, name, status, content_status)
values ('proyek-draft-dummy', 'Proyek draft (dummy)', 'segera', 'draft');

insert into public.site_settings (key, value, is_public) values
  ('contact.whatsapp', '"+6289673296881"', true),
  ('contact.instagram', '"@kreatifsejahteraproject"', true),
  ('internal.note', '"Pengaturan internal (dummy)"', false);
