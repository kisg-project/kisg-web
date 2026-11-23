# Akun dan keamanan

## Tujuan
Hanya karyawan undangan yang bisa masuk, dengan akun yang aman dan mudah dikelola owner.

## Keputusan owner
- Fase 2: portal tanpa captcha, akun hanya lewat undangan, rate limit per IP dan per akun, penguncian sementara, pesan error tidak membocorkan akun.
- 20 November 2026: tanpa verifikasi dua langkah. Akun utama adalah akun owner (akses CMS dan PWA penuh, bisa mengundang semua role). Akun admin bootstrap dinonaktifkan setelah owner berhasil login.
- 20 November 2026: role `admin` tidak dipakai lagi dan tidak bisa dipilih di undangan. Nilai enum tetap ada.
- 20 November 2026: multi role. Satu akun bisa beberapa role, salah satunya role utama (`is_primary`). Hak akses gabungan, role utama menentukan beranda. Akun yang memegang `owner` tidak wajib absensi.
- 21 November 2026: password memakai kode OTP 6 digit lewat email, untuk lupa password dan ganti password di Akun saya (tanpa password lama).
- Foto profil wajib untuk semua akun. Akun tanpa foto diarahkan ke aktivasi.
- Undangan: owner mengisi nama, email, role. Email undangan (Brevo, dari `notifikasi@`) berisi tautan aktivasi sekali pakai yang kedaluwarsa. Aktivasi: password (minimal 10 karakter, huruf besar, kecil, angka, indikator kekuatan), foto profil, nomor HP.
- Owner tampil sebagai "Direktur Utama" (label saja).

## Cakupan
- [x] Login email dan password dengan rate limit dan penguncian
- [x] Undangan lewat email, kirim ulang, batalkan, tautan cadangan untuk disalin
- [x] Aktivasi akun: password, foto profil (kamera atau galeri, potong persegi, kompres), nomor HP
- [x] Multi role dan role utama, JWT hook `app_roles`
- [x] Akun saya: foto, nama, nomor HP, ganti password dengan OTP
- [x] Lupa password dengan OTP
- [x] Role `cms` terpisah dari portal
- [x] Nonaktifkan akun mencabut sesi
- [ ] Penonaktifan akun admin bootstrap (menunggu konfirmasi owner bahwa login owner sudah lancar)
- [ ] Role kustom: hak akses per menu dan aksi diatur owner (seperti Odoo), di atas role dasar
- [ ] Riwayat login dan perangkat aktif di Akun saya, keluar dari semua perangkat
- [ ] Hapus dan ekspor data konsumen (UU PDP) di admin, tercatat di audit
- [ ] Halaman audit log untuk owner: siapa mengubah apa, kapan, dengan filter

## Data
`profiles`, `user_roles`, `audit_log`, bucket `avatars`.

## Test
`e2e/auth/`, pgTAP `05_multi_role`, `06_cms_role`.
