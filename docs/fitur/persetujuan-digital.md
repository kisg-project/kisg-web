# Persetujuan digital, stempel, dan e-Meterai

## Tujuan
Setiap persetujuan di semua modul sah, tercatat permanen, dan bisa diverifikasi lewat QR.

## Keputusan owner
- 20 November 2026: tombol setujui (ACC) di semua alur persetujuan (pengajuan dana, izin, absen di luar lokasi, booking, laporan) adalah tanda tangan elektronik. Penyetuju melihat ringkasan, lalu mengonfirmasi.
- Setiap persetujuan atau penolakan menyimpan cap permanen: nama, role, waktu, user agent, lokasi kalau diizinkan, dan kode verifikasi hash SHA-256 dari isi dokumen, penyetuju, dan waktu. Cap tidak bisa diubah atau dihapus.
- Cap tampil di halaman dokumen dan PDF ("Disetujui secara digital oleh ..."), dengan QR ke halaman verifikasi. Kalau isi dokumen berubah setelah disetujui, verifikasi menunjukkan tidak cocok.
- 22 November 2026: tanda tangan sidik jari (WebAuthn), satu perangkat per akun, didaftarkan di Akun saya. Hanya Direktur Utama yang bisa mereset (audit). Setiap persetujuan wajib memakai akun yang sudah mendaftarkan sidik jari. Urutan cadangan: Face ID atau PIN perangkat, QR lintas perangkat, lalu password akun (tercatat sebagai metode cadangan). Tantangan terikat ke hash isi dokumen dan keputusan.
- 22 November 2026: cap KIS hanya untuk keputusan disetujui oleh atasan (`carriesCompanyStamp`), tidak pada penolakan. Pengaju menandatangani dengan sidik jari atau QR tanpa cap.
- Stempel perusahaan bergaya tinta basah (sedikit miring) di PDF resmi yang sudah disetujui owner, hanya bersama cap persetujuan digital, tidak pernah di draf.
- Ini tanda tangan elektronik tidak tersertifikasi (UU ITE). Tanda tangan tersertifikasi (PSrE) di luar cakupan.
- 23 November 2026: e-Meterai dibangun dengan dua jalur, unggah manual dan API distributor (lihat di bawah). Keputusan distributor menunggu owner.

## Cakupan
Persetujuan
- [x] Tabel `approval_stamps` tanpa policy tulis, trigger menolak update dan delete
- [x] Fungsi keputusan hanya dari server setelah verifikasi
- [x] Halaman publik `/verifikasi/[kode]` (noindex) yang menghitung ulang hash
- [x] Sidik jari WebAuthn wajib, reset oleh Direktur Utama, dialog arahan pendaftaran
- [x] Cap KIS hanya untuk persetujuan atasan
- [ ] Mesin persetujuan generik untuk semua jenis dokumen: definisi langkah per jenis, matriks per nominal, kategori, atau proyek, delegasi saat penyetuju berhalangan, eskalasi kalau terlalu lama
- [ ] QR lintas perangkat (setujui dari HP terdaftar saat bekerja di laptop)
- [ ] Stempel tinta basah di PDF resmi yang disetujui
- [ ] Snapshot versi per tanda tangan (JSON dan hash), PDF hanya versi final

e-Meterai
- [ ] Jalur manual: PDF dibuat PWA, admin membubuhi meterai di portal distributor, unggah PDF bermeterai, PWA mencatat nomor seri, pembubuh, dan waktu
- [ ] Jalur API distributor: bubuhi meterai dengan satu tombol, saldo prabayar tampil, riwayat pemakaian, peringatan saldo menipis. Aktif dengan mengisi kredensial di env tanpa ubah kode
- [ ] Daftar jenis dokumen yang wajib meterai (UU 10/2020): surat perjanjian (SPR, PPJB, kontrak kerja, SPK kontraktor) dan dokumen yang menyebut uang di atas Rp 5 juta

## Data
`approval_stamps`, `webauthn_credentials`, `webauthn_challenges`, fungsi `document_hash`, `verify_approval`.

## Test
pgTAP `10_approvals`, `11_webauthn`. E2E `e2e/owner/sidik-jari.spec.ts`, `kehadiran.spec.ts`.

## Data dari owner
- Distributor e-Meterai yang dipilih (Peruri Digital Security, Mitra Pajakku, Mitracomm, Finnet, Pos Indonesia, atau Mekari Sign) dan apakah mau API.
- Foto atau file stempel KIS asli untuk dibuat versi digitalnya.
