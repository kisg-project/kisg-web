# Produk, kavling, dan price list

## Tujuan
Satu sumber data untuk setiap unit yang dijual: lokasi kavling, tipe, status, dan harga.

## Keputusan owner
- Status unit: tersedia, hold, booking, terjual (`src/config/units.ts`, enum `unit_status`).
- 22 November 2026: harga ringkas di website, harga lengkap di detail unit.

## Cakupan
- [x] Tabel `projects`, `unit_types`, `units` dan status unit
- [x] Sorotan tipe unit di halaman proyek website
- [ ] Struktur proyek, cluster, blok, kavling: luas tanah dan bangunan, hadap, posisi (hook, standar, depan taman), kelebihan tanah
- [ ] Spesifikasi teknis per tipe dan denah
- [ ] Price list berversi per tipe dan per kavling (tambahan hook, kelebihan tanah), kenaikan harga terjadwal dengan persetujuan owner, riwayat harga
- [ ] Siteplan interaktif SVG: warna per status, klik kavling untuk detail, dipakai di portal dan website
- [ ] Hold unit dengan batas waktu dan pelepasan otomatis
- [ ] Stok unit per proyek dan per tipe, laporan unit terjual, sisa, dan nilai persediaan
- [ ] Kelola dari portal (owner, manajer marketing) dan CMS (konten publik)

## Data
`projects`, `unit_types`, `units`. Tabel baru (rencana): `clusters`, `blocks`, `price_lists`, `price_list_items`, `unit_holds`.

## Risiko teknis
- Siteplan perlu digambar ulang jadi SVG kalau owner hanya punya PDF atau gambar.
- Booking bersamaan: penguncian baris di fungsi `book_unit()`, diuji dengan dua browser paralel.

## Data dari owner
- Siteplan, daftar kavling dengan luas dan hadap, price list resmi.
