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

- 23 November 2026: role dilengkapi sesuai praktik developer properti, dan persetujuan berjenjang naik otomatis kalau jabatan di tengah kosong (aturan di [persetujuan-digital.md](persetujuan-digital.md)). Daftar role di bawah adalah usulan yang menunggu konfirmasi owner.

## Struktur jabatan dan role
Dua hal dipisah supaya fleksibel:
- **Jabatan** (struktur organisasi, untuk rantai persetujuan): setiap jabatan punya tingkat, departemen, dan atasan. Satu orang bisa memegang beberapa jabatan (rangkap), dan satu jabatan bisa kosong.
- **Role** (hak akses menu dan aksi): menentukan modul apa yang bisa dibuka dan aksi apa yang bisa dilakukan. Role bawaan bisa ditambah role kustom oleh owner.

Tingkat jabatan
1. Direktur Utama
2. Direktur (misal Direktur Operasional, Direktur Keuangan)
3. General Manager
4. Manajer departemen
5. Supervisor atau koordinator
6. Staf

Usulan role per departemen
| Departemen | Role |
|---|---|
| Direksi | Direktur Utama (`owner`), Direktur, General Manager |
| Marketing dan penjualan | Manajer Marketing, Supervisor Marketing (team leader), Marketing (sales), Admin Marketing, KPR Officer (relasi bank dan berkas KPR) |
| Keuangan dan akuntansi | Manajer Keuangan, Staf Akuntansi, Kasir (kas kecil), Staf Penagihan, Staf Pajak |
| Pembelian dan gudang | Staf Pembelian, Staf Gudang atau Logistik |
| Teknik dan konstruksi | Manajer Proyek, Site Manager, Pengawas Lapangan (site supervisor), Quantity Surveyor (RAB dan opname), Drafter atau Arsitek, QC |
| Legal dan perizinan | Manajer Legal, Staf Legal dan Perizinan |
| HR dan umum | Manajer HR, Staf HR, Staf GA (aset, kendaraan, kantor) |
| Layanan konsumen dan estate | Customer Service atau After-sales, Estate Manager |
| Sistem | Admin sistem, CMS (akun khusus panel CMS), Auditor internal (hanya baca) |
| Eksternal (portal sendiri) | Agen atau Broker, Konsumen, Kontraktor atau Mandor (opname dan progres) |

## Pelimpahan tugas jabatan kosong (keputusan owner, 23 November 2026)
Kalau jabatan di bawah belum terisi, tugas dan hak aksesnya dilimpahkan ke jabatan terdekat di atasnya yang sudah terisi, supaya pekerjaan tetap jalan. Ini adalah rangkap jabatan otomatis.

1. **Hak akses**: pemegang jabatan atasan otomatis mendapat menu dan aksi jabatan kosong di bawahnya. Contoh: Kasir kosong, maka Manajer Keuangan melihat menu kas kecil dan bisa mencairkan.
2. **Tugas dan antrean**: semua pekerjaan yang ditujukan ke jabatan (bukan ke orang), misalnya antrean pencairan, tagihan konsumen yang harus dikirim, opname yang harus dicek, atau lead tim, masuk ke pemegang jabatan terdekat di atasnya. Kalau seluruh rantai di atasnya kosong, pekerjaan ke Direktur Utama.
3. **Pelimpahan khusus**: owner bisa menentukan pelimpahan lain per jabatan, misalnya Kasir kosong dipegang Staf Akuntansi, bukan Manajer Keuangan. Owner juga tetap bisa mengatur rangkap jabatan manual.
4. **Terlihat jelas**: beranda dan Akun saya menampilkan "Anda juga memegang tugas Kasir (jabatan belum terisi)". Setiap aksi tercatat atas nama orangnya, lengkap dengan jabatan yang dijalankan.
5. **Pemisahan tugas tetap berlaku**: kalau pelimpahan membuat satu orang menjadi pembuat sekaligus penyetuju dokumen yang sama, langkah persetujuannya naik ke atasan, karena pengaju tidak boleh menyetujui dokumennya sendiri.
6. **Saat jabatan terisi**: pekerjaan baru langsung ke pemegang baru. Antrean yang ditujukan ke jabatan pindah otomatis. Pekerjaan yang sudah diambil orang tertentu tetap padanya sampai selesai atau dipindah manual oleh atasan.
7. **Berlaku di semua fitur**: CRM, keuangan, pembelian, gudang, konstruksi, legal, HR, after-sales, dan administrasi.

Role yang sudah ada dipetakan ke role baru: `marketing_manager` ke Manajer Marketing, `marketing` ke Marketing, `site_manager` ke Site Manager, `site_supervisor` ke Pengawas Lapangan, `finance` ke Manajer Keuangan atau Staf Akuntansi (dipilih per orang), `cms` tetap, `admin` menjadi Admin sistem.

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
- [ ] Role lengkap per departemen sesuai tabel di atas (enum Postgres dan `src/config/roles.ts` sinkron), migrasi role lama
- [ ] Jabatan, departemen, tingkat, dan atasan (struktur organisasi), rangkap jabatan, jabatan kosong
- [ ] Role kustom: hak akses per menu dan aksi diatur owner (seperti Odoo), di atas role bawaan
- [ ] Undangan memilih role dan jabatan sekaligus
- [ ] Pelimpahan tugas dan hak akses jabatan kosong ke jabatan terdekat di atasnya, pelimpahan khusus per jabatan, penanda di beranda dan Akun saya
- [ ] Antrean kerja ditujukan ke jabatan (bukan orang) di semua modul, berpindah otomatis saat jabatan terisi
- [ ] Riwayat login dan perangkat aktif di Akun saya, keluar dari semua perangkat
- [ ] Hapus dan ekspor data konsumen (UU PDP) di admin, tercatat di audit
- [ ] Halaman audit log untuk owner: siapa mengubah apa, kapan, dengan filter

## Data
`profiles`, `user_roles`, `audit_log`, bucket `avatars`.

## Test
`e2e/auth/`, pgTAP `05_multi_role`, `06_cms_role`.
