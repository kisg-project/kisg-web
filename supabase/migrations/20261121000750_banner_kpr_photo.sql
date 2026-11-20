-- Banner "Hitung cicilan sebelum survei" memakai foto yang langsung terbaca sebagai menghitung cicilan
-- rumah: maket rumah dan kalkulator (keputusan owner, 21 November 2026). Foto stok Unsplash, kredit di
-- docs/brand.md. Foto lama (dua orang di depan laptop) tidak dipakai lagi.
update public.banners
set image_path = '/images/banners/hitung-cicilan-desktop.webp',
    mobile_image_path = '/images/banners/hitung-cicilan-mobile.webp',
    alt = 'Foto ilustrasi maket rumah di tangan dan kalkulator di meja'
where id = '5a7e0000-0000-4000-8000-000000000403';
