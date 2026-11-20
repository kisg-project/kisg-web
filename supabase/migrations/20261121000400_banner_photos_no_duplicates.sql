-- Beranda tidak boleh menampilkan foto yang sama dua kali (keputusan owner, 20 November 2026).
-- - Banner 1 memakai file galeri yang memang sama isinya (sgv-1 untuk desktop, sgv-4 untuk HP),
--   supaya beranda bisa menyaring foto banner dari cuplikan galeri berdasarkan path.
-- - Banner 2 dan 3 memakai foto stok berlisensi Unsplash (orang, bukan rumah). Sumber dan
--   fotografer dicatat di docs/brand.md.
-- - sgv-2 (render sore dari sudut yang sama dengan sgv-1) dipindah ke urutan terakhir galeri.

update public.banners
set image_path = '/images/projects/sejahtera-green-village/sgv-1.webp',
    mobile_image_path = '/images/projects/sejahtera-green-village/sgv-4.webp'
where id = '5a7e0000-0000-4000-8000-000000000401';

update public.banners
set title = 'Konsultasi langsung dengan marketing',
    subtitle = 'Tanya unit, harga, dan jadwal survei. Marketing membalas lewat WhatsApp.',
    image_path = '/images/banners/konsultasi-desktop.webp',
    mobile_image_path = '/images/banners/konsultasi-mobile.webp',
    alt = 'Foto ilustrasi diskusi di ruang rapat kantor',
    cta_label = 'Kunjungi kantor',
    cta_href = '/kontak'
where id = '5a7e0000-0000-4000-8000-000000000402';

update public.banners
set image_path = '/images/banners/kerja-laptop-desktop.webp',
    mobile_image_path = '/images/banners/kerja-laptop-mobile.webp',
    alt = 'Foto ilustrasi dua orang menghitung di laptop'
where id = '5a7e0000-0000-4000-8000-000000000403';

update public.project_media
set sort_order = 8
where id = '5a7e0000-0000-4000-8000-000000000102';
