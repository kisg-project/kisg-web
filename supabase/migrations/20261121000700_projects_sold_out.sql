-- Tiga proyek KIS sebelumnya tampil di website dengan tanda Sold out (keputusan owner, 20 November
-- 2026, menggantikan keputusan Fase 1 yang hanya menampilkan Sejahtera Green Village).
-- Sumber data: Company Profile PT KISG 2024 (halaman Our Product), termasuk gambar proyeknya.
-- Tanggal mulai hanya diketahui tahunnya, jadi ditulis di deskripsi dan launched_on dibiarkan kosong.

insert into public.projects (
  id, slug, name, status, content_status, village, district, city, province,
  is_featured, sort_order, description
) values
  ('5a7e0000-0000-4000-8000-000000000011', 'sejahtera-residence-mangunjaya',
   'Sejahtera Residence Mangunjaya', 'sold_out', 'terbit',
   'Mangunjaya', 'Kec. Tambun Selatan', 'Kab. Bekasi', 'Jawa Barat', false, 2,
   'Proyek ketiga KIS Group di Kelurahan Mangunjaya, Kecamatan Tambun Selatan. Pembangunan dimulai tahun 2023. Terdiri dari 10 unit tipe 36/60.'),
  ('5a7e0000-0000-4000-8000-000000000012', 'sejahtera-residence-tapos',
   'Sejahtera Residence Tapos', 'sold_out', 'terbit',
   'Sukamaju Baru', 'Kec. Tapos', 'Kota Depok', 'Jawa Barat', false, 3,
   'Proyek kedua KIS Group di Kelurahan Sukamaju Baru, Kecamatan Tapos. Pembangunan dimulai tahun 2023. Terdiri dari 5 unit dengan tipe 66/48, 66/57, 66/61, 66/66, dan 66/68.'),
  ('5a7e0000-0000-4000-8000-000000000013', 'sejahtera-residence-sumberjaya',
   'Sejahtera Residence Sumberjaya', 'sold_out', 'terbit',
   'Sumberjaya', 'Kec. Tambun Selatan', 'Kab. Bekasi', 'Jawa Barat', false, 4,
   'Proyek pertama KIS Group di Kelurahan Sumberjaya, Kecamatan Tambun Selatan. Pembangunan dimulai tahun 2022. Terdiri dari 14 unit dengan tipe 45/60, 36/66, dan 36/60.')
on conflict do nothing;

insert into public.project_media (id, project_id, kind, path, alt, width, height, sort_order) values
  ('5a7e0000-0000-4000-8000-000000000111', '5a7e0000-0000-4000-8000-000000000011', 'foto',
   '/images/projects/sejahtera-residence-mangunjaya/mangunjaya-1.webp',
   'Gambar tampak depan rumah satu lantai Sejahtera Residence Mangunjaya dengan fasad abu dan putih',
   410, 328, 1),
  ('5a7e0000-0000-4000-8000-000000000112', '5a7e0000-0000-4000-8000-000000000012', 'foto',
   '/images/projects/sejahtera-residence-tapos/tapos-1.webp',
   'Gambar deretan rumah dua lantai Sejahtera Residence Tapos dengan fasad putih',
   576, 324, 1),
  ('5a7e0000-0000-4000-8000-000000000113', '5a7e0000-0000-4000-8000-000000000013', 'foto',
   '/images/projects/sejahtera-residence-sumberjaya/sumberjaya-1.webp',
   'Gambar deretan rumah Sejahtera Residence Sumberjaya dengan dinding kuning dan atap merah',
   576, 324, 1)
on conflict do nothing;
