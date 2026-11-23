# Penggajian dan slip gaji

## Tujuan
Gaji dihitung otomatis dari data absensi, kasbon, dan komisi, disetujui owner, dan slip terkirim ke setiap karyawan.

## Keputusan owner (20 November 2026)
- Hanya keuangan yang membuat draf gaji per periode. Karyawan tidak bisa mengajukan gaji. Jenis pengajuan dana diatur per role.
- Draf terisi otomatis: karyawan aktif, komponen gaji tetap, data absensi (hadir, alpa, terlambat, lembur disetujui), kasbon yang sudah dicairkan, komisi, BPJS dan PPh 21 metode TER. BPJS dan PPh 21 terisi secara default tapi bisa dikosongkan atau dikoreksi per baris dan dimatikan di pengaturan perusahaan atau per karyawan.
- Alur: keuangan mengajukan, owner menyetujui dengan persetujuan digital (periode terkunci, koreksi lewat revisi), keuangan menandai sudah dibayar dengan bukti, lalu klik "Kirim slip gaji".
- Slip terkirim sebagai notifikasi push, email berisi ringkasan dan lampiran PDF slip berkop (berpassword, default tanggal lahir), dan menu "Slip gaji saya". Status kirim per karyawan dan tombol kirim ulang.
- Data gaji hanya terlihat oleh keuangan, owner, dan karyawan pemilik slip. Semua aksi tercatat di `audit_log`.
- 23 November 2026: pembayaran lewat transfer manual dengan unggah bukti (tanpa payment gateway).

## Cakupan
- [ ] Komponen gaji per karyawan: gaji pokok, tunjangan tetap dan tidak tetap, potongan tetap
- [ ] Pengaturan tarif BPJS (Kesehatan, JHT, JP, JKK, JKM) dan PPh 21 TER (PMK 168/2023) di tabel, bisa diubah tanpa deploy
- [ ] Draf periode bulanan terisi otomatis, edit per baris dengan catatan
- [ ] Persetujuan owner, periode terkunci, revisi dengan persetujuan ulang
- [ ] File transfer bank (Excel) dan unggah bukti bayar
- [ ] Slip gaji PDF berpassword, push, email, menu Slip gaji saya dengan QR verifikasi, status kirim dan kirim ulang
- [ ] THR (prorata), bonus, dan pesangon atau uang pisah sesuai aturan ketenagakerjaan
- [ ] Bukti potong PPh 21 tahunan (1721-A1)
- [ ] Rekap gaji per bulan, rekap BPJS dan PPh, laporan biaya gaji per proyek atau departemen, ekspor PDF dan Excel
- [ ] Jurnal otomatis ke akuntansi (lihat [keuangan-akuntansi.md](keuangan-akuntansi.md))

## Test
Perhitungan BPJS, PPh 21, dan potongan absensi diuji unit test dengan contoh angka dari aturan resmi. pgTAP: slip hanya terlihat oleh pemiliknya, keuangan, dan owner.

## Data dari owner
- Struktur gaji, apakah KIS memakai BPJS dan memotong PPh 21, tanggal gajian.
