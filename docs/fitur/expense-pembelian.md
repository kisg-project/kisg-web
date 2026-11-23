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

23 November 2026 (jenis dokumen pengajuan KIS)

| Kode | Nama | Dipakai untuk | Contoh dokumen |
|---|---|---|---|
| PRA | Purchase Request Approval | Pengajuan pembelian barang atau jasa senilai Rp 1 juta ke atas | Dikirim owner |
| PR | Payment Request | Pengajuan pembayaran di bawah Rp 1 juta | Dikirim owner |
| RMBS | Reimbursement | Klaim biaya yang sudah dibayar karyawan dengan uang pribadi | Dikirim owner |
| ADV | Advance Dana | Uang muka sebelum kegiatan | Rancangan best practice di bawah |
| SETT | Settlement (LPJ Advance) | Pertanggungjawaban penggunaan ADV | Rancangan best practice di bawah |

Batas Rp 1 juta antara PR dan PRA disimpan sebagai pengaturan, bukan angka di kode. Tata letak PRA, PR, dan RMBS mengikuti contoh dokumen owner setelah diterima.

## Rancangan ADV (Advance Dana)
Isi formulir
- Nomor otomatis `ADV/KIS/2026/11/0001`, tanggal pengajuan.
- Pemohon: nama, NIP, jabatan, departemen, atasan langsung (terisi dari data HR).
- Proyek atau pusat biaya, tujuan kegiatan, periode kegiatan (mulai dan selesai), tanggal dana dibutuhkan.
- Rincian rencana penggunaan per baris: kategori, uraian, jumlah, satuan, harga satuan, subtotal. Total dihitung otomatis.
- Metode pencairan: transfer ke rekening pemohon (bawaan, dari data HR) atau tunai dari kas kecil.
- Batas waktu SETT: otomatis 7 hari setelah kegiatan selesai (bisa diatur, maksimal 14 hari).
- Lampiran pendukung: rincian kegiatan, undangan, penawaran harga.
- Pernyataan pemohon: bersedia mempertanggungjawabkan sebelum batas waktu, dan bersedia dipotong gaji kalau tidak.

Aturan
- Plafon per jabatan dan per kategori.
- Pemohon dengan ADV yang lewat batas waktu SETT tidak bisa membuat ADV baru. Jumlah ADV terbuka per orang dibatasi (bawaan 1, bisa diatur).
- Persetujuan mengikuti matriks: atasan langsung, keuangan memeriksa, owner menyetujui dengan sidik jari.
- Pencairan dengan bukti transfer, lalu status berubah menjadi "Menunggu LPJ".
- Pengingat ke pemohon 2 hari sebelum batas waktu dan pada hari batas waktu. Setelah lewat, pengingat ke atasan dan keuangan.
- ADV yang lewat 30 hari tanpa SETT bisa dijadikan kasbon potong gaji oleh keuangan, dengan persetujuan owner dan pemberitahuan ke pemohon.

Status: draf, diajukan, diperiksa atasan, diperiksa keuangan, disetujui, dicairkan, menunggu LPJ, LPJ diajukan, selesai, lewat batas waktu, ditolak, dibatalkan.

## Rancangan SETT (Settlement atau LPJ Advance)
Isi formulir
- Nomor otomatis `SETT/KIS/2026/11/0001`, referensi ADV (wajib, satu SETT untuk satu ADV).
- Data pemohon, proyek, dan periode kegiatan terisi dari ADV.
- Ringkasan: dana ADV diterima, total realisasi, selisih.
- Rincian realisasi per baris: tanggal transaksi, kategori, uraian, toko atau vendor, jumlah, harga, subtotal, nomor nota, foto nota wajib. Pajak kalau ada.
- Perbandingan dengan rencana ADV per baris. Selisih di atas 10% wajib diberi penjelasan.
- Nota hilang: surat pernyataan pengganti nota, dibatasi nominalnya, dan wajib disetujui atasan.
- Laporan kegiatan singkat dan foto kegiatan (wajib untuk kategori tertentu, misal pameran atau survei).

Penyelesaian selisih
- Realisasi kurang dari ADV: pemohon mengembalikan sisa dengan bukti transfer ke rekening perusahaan, dicek keuangan.
- Realisasi lebih dari ADV: kekurangan dibayar perusahaan sebagai reimburse otomatis setelah disetujui.
- Pas: langsung ditutup.

Verifikasi dan persetujuan
- Keuangan memeriksa per baris: diterima, ditolak, atau dikoreksi dengan catatan. Baris yang ditolak menjadi tanggungan pemohon.
- Persetujuan: atasan langsung, keuangan, lalu owner kalau kekurangan yang harus dibayar perusahaan di atas batas yang diatur.
- Setelah selesai: ADV ditutup, jurnal dan kas tercatat otomatis, PDF LPJ berkop dengan semua foto nota digabung dan cap persetujuan disimpan sebagai arsip.

Status: draf, diajukan, diperiksa keuangan, dikembalikan untuk diperbaiki, menunggu pengembalian sisa, menunggu pembayaran kekurangan, selesai, ditolak.

## Cakupan
Pengajuan
- [ ] PRA (Rp 1 juta ke atas) sesuai contoh dokumen owner, lanjut ke alur pembelian dan PO
- [ ] PR (di bawah Rp 1 juta) sesuai contoh dokumen owner
- [ ] RMBS sesuai contoh dokumen owner
- [ ] ADV sesuai rancangan di atas
- [ ] SETT sesuai rancangan di atas, termasuk pengembalian sisa dan pembayaran kekurangan
- [ ] Banyak baris per pengajuan di semua jenis dokumen
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
- Contoh dokumen PRA, PR, dan RMBS yang dipakai sekarang.
- Siapa penyetuju tiap jenis (misal PR cukup sampai keuangan atau tetap ke owner).
- Kategori pengeluaran yang dipakai, batas nominal per role, apakah ada kas kecil di lokasi proyek (pemegang dan saldo), RAB per proyek dalam Excel, daftar supplier.
