# Portal konsumen

## Tujuan
Pembeli memantau rumahnya sendiri tanpa harus menanyakan ke marketing.

## Cakupan
- [ ] Akun konsumen lewat undangan setelah booking (login OTP email atau nomor HP), terpisah dari akun karyawan
- [ ] Progres pembangunan rumahnya dengan foto (dari laporan lapangan yang disetujui)
- [ ] Jadwal pembayaran, tagihan, unggah bukti transfer, kuitansi
- [ ] Status KPR dan berkas yang masih kurang
- [ ] Dokumen: SPR, PPJB, BAST, sertifikat (status), garansi
- [ ] Komplain dan klaim garansi dengan foto, pantau statusnya (lihat [after-sales-estate.md](after-sales-estate.md))
- [ ] Tagihan IPL setelah serah terima
- [ ] Pengumuman perumahan dan notifikasi
- [ ] Program referral dengan kode milik konsumen (lihat [agen-broker.md](agen-broker.md))

## Aturan
- RLS: konsumen hanya melihat data unit dan transaksinya sendiri.
- Patuh UU PDP: persetujuan, ekspor, dan hapus data konsumen.

## Data
Tabel baru (rencana): `customers`, `customer_accounts`, relasi ke `deals`, `invoices`, `unit_progress`, `tickets`.
