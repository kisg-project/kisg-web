-- Fase 3a: data awal website (data asli dari owner, 19 November 2026).
-- Production belum punya panel admin (Fase 4), jadi data proyek yang tampil di website dimasukkan
-- lewat migrasi ini. Idempoten: ID tetap dan `on conflict do nothing`, sehingga aman dijalankan ulang
-- dan tidak menimpa perubahan dari admin nanti. Data yang belum ada (jarak, fasilitas kawasan,
-- statistik, berita, promo, lowongan) sengaja tidak diisi (docs/TODO-DATA.md).

-- Proyek ------------------------------------------------------------------
insert into public.projects (
  id, slug, name, status, content_status, address, village, district, city, province, postal_code,
  is_featured, sort_order
) values (
  '5a7e0000-0000-4000-8000-000000000001',
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
) on conflict do nothing;

insert into public.unit_types (
  id, project_id, slug, name, land_area, building_area, bedrooms, bathrooms, floors, specs,
  price_from, show_price, sort_order
) values (
  '5a7e0000-0000-4000-8000-000000000002',
  '5a7e0000-0000-4000-8000-000000000001',
  'tipe-36-60',
  'Tipe 36/60',
  60,
  36,
  2,
  1,
  1,
  jsonb_build_object(
    'features', jsonb_build_array('Carport', 'Halaman belakang', 'Smart door lock'),
    'price_includes', jsonb_build_array(
      'Biaya notaris', 'Biaya cek sertifikat di BPN', 'Biaya balik nama sertifikat di BPN',
      'Pajak penjualan (SSP)', 'IMB', 'PBB'
    ),
    'price_excludes', jsonb_build_array(
      'Administrasi bank', 'Biaya notaris bank', 'Pajak pembelian (BPHTB)', 'Asuransi'
    )
  ),
  571250000,
  true,
  1
) on conflict do nothing;

-- Galeri (foto di repo: public/images/projects/sejahtera-green-village/) ---
insert into public.project_media (id, project_id, kind, path, alt, width, height, sort_order) values
  ('5a7e0000-0000-4000-8000-000000000101', '5a7e0000-0000-4000-8000-000000000001', 'foto',
   '/images/projects/sejahtera-green-village/sgv-1.webp',
   'Deretan rumah Tipe 36/60 Sejahtera Green Village dengan carport di depan', 2048, 1337, 1),
  ('5a7e0000-0000-4000-8000-000000000102', '5a7e0000-0000-4000-8000-000000000001', 'foto',
   '/images/projects/sejahtera-green-village/sgv-2.webp',
   'Tampak depan rumah Sejahtera Green Village saat sore hari', 2048, 1337, 2),
  ('5a7e0000-0000-4000-8000-000000000103', '5a7e0000-0000-4000-8000-000000000001', 'foto',
   '/images/projects/sejahtera-green-village/sgv-3.webp',
   'Jalan lingkungan dan deretan rumah Sejahtera Green Village', 2048, 1337, 3),
  ('5a7e0000-0000-4000-8000-000000000104', '5a7e0000-0000-4000-8000-000000000001', 'foto',
   '/images/projects/sejahtera-green-village/sgv-4.webp',
   'Fasad rumah Tipe 36/60 dengan atap pelana dan aksen kayu', 1626, 2048, 4),
  ('5a7e0000-0000-4000-8000-000000000105', '5a7e0000-0000-4000-8000-000000000001', 'foto',
   '/images/projects/sejahtera-green-village/sgv-5.webp',
   'Tampak depan satu unit rumah dengan carport dan taman kecil', 1626, 2048, 5),
  ('5a7e0000-0000-4000-8000-000000000106', '5a7e0000-0000-4000-8000-000000000001', 'foto',
   '/images/projects/sejahtera-green-village/sgv-6.webp',
   'Detail fasad rumah dengan jendela atas dan pohon peneduh', 1626, 2048, 6),
  ('5a7e0000-0000-4000-8000-000000000107', '5a7e0000-0000-4000-8000-000000000001', 'foto',
   '/images/projects/sejahtera-green-village/sgv-7.webp',
   'Pemandangan deretan rumah Sejahtera Green Village dari ujung jalan', 1626, 2048, 7)
on conflict do nothing;

-- Akses sekitar (jarak dan waktu tempuh belum ada dari owner) ---------------
insert into public.nearby_places (id, project_id, name, category, sort_order) values
  ('5a7e0000-0000-4000-8000-000000000301', '5a7e0000-0000-4000-8000-000000000001',
   'Stasiun Tambun', 'transportasi', 1),
  ('5a7e0000-0000-4000-8000-000000000302', '5a7e0000-0000-4000-8000-000000000001',
   'Gerbang Tol Bekasi Timur', 'tol', 2),
  ('5a7e0000-0000-4000-8000-000000000303', '5a7e0000-0000-4000-8000-000000000001',
   'Bank Mandiri KCP Mangunjaya', 'bank', 3),
  ('5a7e0000-0000-4000-8000-000000000304', '5a7e0000-0000-4000-8000-000000000001',
   'Superindo dan area komersial Tambun', 'belanja', 4)
on conflict do nothing;

-- Banner beranda -----------------------------------------------------------
insert into public.banners (
  id, title, subtitle, image_path, mobile_image_path, alt, cta_label, cta_href, sort_order, content_status
) values
  ('5a7e0000-0000-4000-8000-000000000401', 'Sejahtera Green Village',
   'Rumah Tipe 36/60 di Tambun Selatan, Kabupaten Bekasi.',
   '/images/hero/sgv-hero-desktop.webp', '/images/hero/sgv-hero-mobile.webp',
   'Deretan rumah Sejahtera Green Village dengan carport', 'Lihat proyek',
   '/proyek/sejahtera-green-village', 1, 'terbit'),
  ('5a7e0000-0000-4000-8000-000000000402', '2 kamar tidur, carport, smart door lock',
   'Satu tipe rumah dengan halaman belakang di setiap unit.',
   '/images/projects/sejahtera-green-village/sgv-3.webp',
   '/images/projects/sejahtera-green-village/sgv-5.webp',
   'Jalan lingkungan dan deretan rumah Sejahtera Green Village', 'Lihat tipe unit',
   '/proyek/sejahtera-green-village#tipe-unit', 2, 'terbit'),
  ('5a7e0000-0000-4000-8000-000000000403', 'Hitung cicilan sebelum survei',
   'Simulasi KPR konvensional dan syariah dari bank rekanan.',
   '/images/projects/sejahtera-green-village/sgv-2.webp',
   '/images/projects/sejahtera-green-village/sgv-7.webp',
   'Tampak depan rumah Sejahtera Green Village saat sore hari', 'Buka simulasi KPR',
   '/simulasi-kpr', 3, 'terbit')
on conflict do nothing;

-- FAQ: hanya fakta yang sudah diberikan owner -------------------------------
insert into public.faqs (id, question, answer, category, project_id, sort_order, content_status) values
  ('5a7e0000-0000-4000-8000-000000000501', 'Berapa harga rumah Tipe 36/60?',
   'Rp 571.250.000. Rincian biaya yang sudah dan belum termasuk ada di bagian tipe unit.',
   'harga', '5a7e0000-0000-4000-8000-000000000001', 1, 'terbit'),
  ('5a7e0000-0000-4000-8000-000000000502', 'Biaya apa saja yang sudah termasuk harga?',
   'Biaya notaris, cek sertifikat di BPN, balik nama sertifikat di BPN, pajak penjualan (SSP), IMB, dan PBB.',
   'harga', '5a7e0000-0000-4000-8000-000000000001', 2, 'terbit'),
  ('5a7e0000-0000-4000-8000-000000000503', 'Biaya apa saja yang belum termasuk?',
   'Administrasi bank, biaya notaris bank, pajak pembelian (BPHTB), dan asuransi. Biaya ini muncul kalau membeli dengan KPR.',
   'harga', '5a7e0000-0000-4000-8000-000000000001', 3, 'terbit'),
  ('5a7e0000-0000-4000-8000-000000000504', 'Di mana lokasi Sejahtera Green Village?',
   'Jl. Garuda 3 No. NK-34, Blok H-21, RT 9/RW 14, Mangunjaya, Kec. Tambun Selatan, Kab. Bekasi, Jawa Barat 17510.',
   'lokasi', '5a7e0000-0000-4000-8000-000000000001', 4, 'terbit'),
  ('5a7e0000-0000-4000-8000-000000000505', 'Apa saja isi rumah Tipe 36/60?',
   'Luas bangunan 36 m2 di tanah 60 m2, 2 kamar tidur, 1 kamar mandi, carport, halaman belakang, dan smart door lock.',
   'unit', '5a7e0000-0000-4000-8000-000000000001', 5, 'terbit'),
  ('5a7e0000-0000-4000-8000-000000000506', 'Bagaimana cara jadwal survei lokasi?',
   'Hubungi marketing lewat WhatsApp atau isi form minat. Marketing menghubungi Anda untuk mengatur jadwal.',
   'survei', '5a7e0000-0000-4000-8000-000000000001', 6, 'terbit')
on conflict do nothing;

-- Pengaturan publik --------------------------------------------------------
insert into public.site_settings (key, value, is_public) values
  ('contact.whatsapp', '"+6289673296881"', true),
  ('contact.instagram', '"@kreatifsejahteraproject"', true)
on conflict (key) do nothing;
