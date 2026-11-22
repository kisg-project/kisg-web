-- Data dari brosur resmi Sejahtera Green Village dan keputusan owner (22 November 2026):
-- harga tipe 36/60 menjadi Rp 570.000.000, gratis notaris jual beli dan BPHTB, spesifikasi bangunan,
-- tipe 36/73 (harga belum ada, tampil "Hubungi marketing"), dan fasilitas lingkungan.

update public.unit_types
set price_from = 570000000,
    specs = specs || jsonb_build_object(
      'price_includes', jsonb_build_array(
        'Biaya notaris jual beli', 'Biaya cek sertifikat di BPN', 'Biaya balik nama sertifikat di BPN',
        'Pajak penjualan (SSP)', 'Pajak pembelian (BPHTB)', 'IMB', 'PBB'
      ),
      'price_excludes', jsonb_build_array('Administrasi bank', 'Biaya notaris bank', 'Asuransi'),
      'materials', jsonb_build_array(
        jsonb_build_object('label', 'Pondasi', 'value', 'Cakar ayam'),
        jsonb_build_object('label', 'Dinding', 'value', 'Hebel, double dinding'),
        jsonb_build_object('label', 'Lantai', 'value', 'Granit 60 x 60 cm'),
        jsonb_build_object('label', 'Plafon', 'value', 'Gypsum'),
        jsonb_build_object('label', 'Kusen', 'value', 'Aluminium'),
        jsonb_build_object('label', 'Genteng', 'value', 'Beton'),
        jsonb_build_object('label', 'Rangka atap', 'value', 'Baja ringan'),
        jsonb_build_object('label', 'Listrik', 'value', '1.300 watt'),
        jsonb_build_object('label', 'Air', 'value', 'Jet pump'),
        jsonb_build_object('label', 'Kloset', 'value', 'Duduk')
      )
    )
where id = '5a7e0000-0000-4000-8000-000000000002';

insert into public.unit_types (
  id, project_id, slug, name, land_area, building_area, bedrooms, bathrooms, floors, specs,
  price_from, show_price, sort_order
)
select
  '5a7e0000-0000-4000-8000-000000000003',
  project_id,
  'tipe-36-73',
  'Tipe 36/73',
  73,
  36,
  2,
  1,
  1,
  specs,
  null,
  false,
  2
from public.unit_types
where id = '5a7e0000-0000-4000-8000-000000000002'
on conflict do nothing;

insert into public.facilities (id, project_id, name, icon, description, sort_order) values
  ('5a7e0000-0000-4000-8000-000000000601', '5a7e0000-0000-4000-8000-000000000001',
   'One gate system', 'shield', 'Satu pintu masuk dan keluar kawasan.', 1),
  ('5a7e0000-0000-4000-8000-000000000602', '5a7e0000-0000-4000-8000-000000000001',
   'Keamanan 24 jam', 'clock', 'Petugas keamanan berjaga siang dan malam.', 2)
on conflict do nothing;

-- FAQ harga mengikuti harga dan rincian biaya baru.
update public.faqs
set answer = 'Rp 570.000.000. Rincian biaya yang sudah dan belum termasuk ada di bagian tipe unit.'
where id = '5a7e0000-0000-4000-8000-000000000501';
update public.faqs
set answer = 'Biaya notaris jual beli, cek sertifikat di BPN, balik nama sertifikat di BPN, pajak penjualan (SSP), pajak pembelian (BPHTB), IMB, dan PBB.'
where id = '5a7e0000-0000-4000-8000-000000000502';
update public.faqs
set answer = 'Administrasi bank, biaya notaris bank, dan asuransi. Biaya ini muncul kalau membeli dengan KPR.'
where id = '5a7e0000-0000-4000-8000-000000000503';
