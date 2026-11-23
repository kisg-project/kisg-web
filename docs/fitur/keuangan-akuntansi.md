# Keuangan dan akuntansi

## Tujuan
Pembukuan lengkap satu PT dengan laporan per proyek, tanpa input ulang dari modul lain.

## Keputusan owner
- 23 November 2026: satu PT untuk semua proyek. Laporan per proyek memakai pusat biaya, bukan perusahaan terpisah.
- 23 November 2026: tanpa payment gateway. Pembayaran konsumen lewat transfer manual, konsumen atau marketing mengunggah bukti, keuangan memeriksa dan menandai diterima.

## Cakupan
Piutang konsumen
- [ ] Tagihan dari jadwal pembayaran (booking fee, DP bertahap, cicilan inhouse, pelunasan, pencairan KPR)
- [ ] Unggah bukti transfer, verifikasi keuangan, kuitansi PDF bermeterai kalau di atas Rp 5 juta
- [ ] Umur piutang, denda keterlambatan sesuai perjanjian, pengingat jatuh tempo (email dan notifikasi, WhatsApp setelah WAHA)
- [ ] Pencairan KPR dari bank: bertahap dan retensi
- [ ] Pengembalian dana pembatalan dengan persetujuan

Hutang
- [ ] Hutang supplier dan kontraktor (dari [expense-pembelian.md](expense-pembelian.md)), jadwal bayar dan umur hutang

Akuntansi
- [ ] Bagan akun (chart of accounts) untuk developer properti
- [ ] Jurnal otomatis dari penjualan, penerimaan, pengeluaran, pembelian, gaji, dan aset. Jurnal manual dengan persetujuan
- [ ] Buku besar, neraca saldo, tutup buku per periode
- [ ] Rekonsiliasi bank (impor mutasi Excel)
- [ ] Persediaan unit dan HPP per unit (lahan, pematangan, konstruksi, perizinan, biaya pinjaman)
- [ ] Pengakuan pendapatan sesuai PSAK 72
- [ ] Aset tetap dan penyusutan (lihat [administrasi.md](administrasi.md))

Pajak
- [ ] PPh final 2,5% atas pengalihan tanah dan bangunan
- [ ] PPN keluaran (termasuk PPN DTP sesuai aturan yang berlaku) dan PPN masukan
- [ ] PPh 21 (dari penggajian), PPh 23, PBB
- [ ] Rekap pajak per masa untuk pelaporan

Laporan
- [ ] Laba rugi, neraca, arus kas: perusahaan dan per proyek
- [ ] Proyeksi arus kas per proyek
- [ ] Anggaran dibanding realisasi
- [ ] Ekspor PDF dan Excel

## Data
Tabel baru (rencana): `invoices`, `payments`, `receipts`, `refunds`, `chart_of_accounts`, `journal_entries`, `journal_lines`, `bank_statements`, `tax_records`, `fiscal_periods`.

## Data dari owner
- Bagan akun yang dipakai akuntan sekarang, saldo awal, rekening bank perusahaan, aturan denda keterlambatan.
