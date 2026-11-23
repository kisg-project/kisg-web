# Expense dan pembelian

## Tujuan
Semua pengeluaran perusahaan tercatat, disetujui, dan dialokasikan ke proyek, setara Mekari Expense dan modul Expense, Purchase, dan Accounting Odoo yang relevan untuk developer properti.

## Keputusan owner
20 November 2026 (pengajuan dana)
- Semua role bisa membuat pengajuan (dana operasional, pembelian material, reimburse, kasbon, lainnya; jenis bisa diatur): nominal rupiah, rincian, lampiran foto (dikompres) atau file.
- Alur wajib: pengaju, lalu keuangan memeriksa (lanjutkan ke owner, kembalikan untuk diperbaiki, atau tolak, dengan catatan), lalu owner menyetujui atau menolak, lalu keuangan menandai dicairkan dengan bukti. Tidak ada langkah yang bisa dilewati.
- Setiap perpindahan status tercatat (siapa, kapan, catatan) dan memicu notifikasi ke pihak berikutnya. Owner bisa melihat semua pengajuan di semua status dan rekap per bulan.
- Setiap pengajuan punya PDF berkop KIS: nomor, pengaju, rincian dan nominal, daftar lampiran, riwayat status, cap persetujuan digital dengan QR verifikasi. Bisa dilihat dan diunduh. Saat selesai (dicairkan atau ditolak), PDF final disimpan di bucket privat sebagai arsip yang tidak berubah.
- Pengaju tidak bisa memeriksa atau menyetujui pengajuannya sendiri. Kalau satu orang memegang role keuangan dan owner, tiap langkah tetap dicatat terpisah dengan cap masing-masing.
- Gaji tidak pernah menjadi jenis pengajuan karyawan.

23 November 2026 (cakupan lengkap, tanpa tahap)
- Modul dibangun selengkap Mekari dan Odoo. Semua bagian di bawah termasuk rilis pertama.
- Matriks persetujuan bisa diatur, tapi bawaannya tetap alur di atas (semua lewat keuangan lalu owner).
- Tanpa payment gateway: pencairan dan pembayaran lewat transfer manual dengan unggah bukti.
- Pindai nota memakai Gemini paket gratis.

## Cakupan
Pengajuan
- [ ] Reimburse dengan banyak baris per pengajuan
- [ ] Uang muka (cash advance) dengan laporan realisasi: sisa dikembalikan, kekurangan diganti, uang muka yang belum dipertanggungjawabkan menahan pengajuan baru
- [ ] Kasbon yang otomatis jadi potongan gaji (lihat [penggajian.md](penggajian.md))
- [ ] Dana operasional dan pembelian kecil
- [ ] Kategori dengan kebijakan per role: batas per transaksi dan per bulan, nota wajib di atas nominal tertentu, role yang boleh memakai
- [ ] Alokasi ke proyek, unit, atau kantor (pusat biaya)
- [ ] Lampiran nota dari kamera atau galeri (dikompres), cek duplikat (hash file, nominal, tanggal)
- [ ] Pindai nota dengan Gemini: nominal, tanggal, dan toko terisi otomatis, karyawan tetap memeriksa
- [ ] Alur persetujuan dengan matriks, delegasi saat penyetuju berhalangan, eskalasi kalau terlalu lama
- [ ] Pencairan per batch dengan rekening karyawan dan bukti transfer
- [ ] PDF arsip, notifikasi setiap langkah, pengingat uang muka belum dipertanggungjawabkan
- [ ] Draf offline di HP

Kas dan anggaran
- [ ] Buku kas dan bank: kas masuk dan keluar, tercatat otomatis saat pencairan
- [ ] Kas kecil per lokasi: pemegang, saldo tetap, pengeluaran dengan nota, isi ulang sebesar pemakaian, rekonsiliasi
- [ ] Anggaran atau RAB per proyek dan kategori (impor dari Excel), peringatan atau blokir saat melewati anggaran
- [ ] Pengeluaran rutin (listrik, internet, sewa ruko) dengan pengingat

Pembelian
- [ ] Data supplier: kontak, rekening, NPWP, termin pembayaran, riwayat harga
- [ ] Permintaan barang dari lapangan atau kantor dengan persetujuan
- [ ] Permintaan penawaran ke beberapa supplier dan perbandingan harga
- [ ] PO PDF ke supplier
- [ ] Penerimaan barang di lokasi dengan foto dan jumlah diterima, penerimaan sebagian
- [ ] Tagihan supplier dengan pencocokan tiga arah (PO, penerimaan, tagihan)
- [ ] PPN masukan dan PPh 23 atas jasa
- [ ] Pembayaran supplier dengan jadwal jatuh tempo dan bukti transfer
- [ ] Stok material per gudang atau lokasi: masuk, keluar ke unit, mutasi antar lokasi, opname stok

Laporan
- [ ] Pengeluaran per proyek, kategori, karyawan, dan periode
- [ ] Umur uang muka, hutang supplier dan umurnya
- [ ] Anggaran dibanding realisasi, biaya per proyek dan per unit
- [ ] Ekspor PDF dan Excel

## Aturan umum
Semua rupiah `bigint`, semua aksi tercatat di `audit_log`, persetujuan memakai tanda tangan digital (sidik jari), ekspor mengikuti `CLAUDE.md` bagian 6.

## Data
Tabel baru (rencana): `expense_requests`, `expense_lines`, `expense_categories`, `expense_policies`, `cash_advances`, `advance_settlements`, `cash_accounts`, `cash_transactions`, `petty_cash_funds`, `budgets`, `suppliers`, `purchase_requests`, `purchase_orders`, `goods_receipts`, `supplier_bills`, `inventory_items`, `stock_moves`.

## Data dari owner
- Kategori pengeluaran yang dipakai, batas nominal per role, apakah ada kas kecil di lokasi proyek (pemegang dan saldo), RAB per proyek dalam Excel, daftar supplier.
