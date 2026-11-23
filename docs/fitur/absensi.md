# Absensi dan laporan harian

## Tujuan
Kehadiran sah dengan wajah dan lokasi, plus rencana dan hasil kerja harian setiap karyawan.

## Keputusan owner (20 November 2026 kecuali disebut lain)
- Jam masuk dan pulang diatur owner: default perusahaan, bisa berbeda per titik absensi, per karyawan, dan per role (23 November 2026), termasuk hari kerja dan toleransi terlambat. Prioritas: karyawan, titik absensi, role (role utama didahulukan), perusahaan. Jam kantor 09.00 sampai 17.00, marketing masuk juga hari Minggu.
- Semua karyawan selain `owner` wajib clock in dan clock out dengan selfie dan GPS. Sah hanya dalam radius 100 meter dari titik absensi aktif (`work_locations`).
- Setelah clock in wajib mengisi rencana kegiatan sebelum memakai modul lain. Setelah clock out wajib mengisi hasil kerja.
- Formulir menerima lampiran foto (dikompres otomatis) dan file (dibatasi ukuran dan jenis).
- Foto hanya dari kamera saat itu. Harus terdeteksi tepat satu wajah cukup besar, karyawan diminta berkedip dulu. Deteksi di HP, tanpa pencocokan wajah dan tanpa data biometrik disimpan.
- Titik absensi diatur owner, termasuk tombol "pakai lokasi saya sekarang".
- Clock in dan clock out boleh di titik berbeda. Laporan owner memberi penanda "pindah lokasi".
- Di luar radius: ditolak, tetapi bisa mengajukan "absen di luar lokasi" (alasan wajib, foto, lokasi), disetujui owner atau manajer karyawan itu, tercatat di audit.
- Owner melihat semua absensi, rencana, hasil kerja, dan laporan.

## Cakupan
- [x] Clock in dan clock out dengan deteksi wajah dan kedip (MediaPipe, file model dari domain sendiri)
- [x] Validasi radius, penanda terlambat dan pulang awal
- [x] Pengajuan absen di luar lokasi, persetujuan dengan sidik jari, notifikasi ke owner dan karyawan
- [x] Rencana kerja dan hasil kerja dengan lampiran
- [x] Titik absensi, jam kerja perusahaan, per titik, per karyawan, per role
- [x] Rekap kehadiran owner, grafik kotak pastel, laporan harian lengkap
- [ ] Laporan bulanan per karyawan dan per tim (hadir, alpa, terlambat, pulang awal, lembur, pindah lokasi), ekspor PDF dan Excel
- [ ] Kalender hari libur nasional dan cuti bersama yang memengaruhi hari kerja
- [ ] Jadwal shift (untuk satpam, tim lapangan, marketing pameran)
- [ ] Koreksi absensi lewat pengajuan (lupa clock out) dengan persetujuan atasan
- [ ] Kunjungan lapangan marketing: check-in di lokasi konsumen atau pameran dengan foto dan GPS, terhubung ke aktivitas lead
- [ ] Integrasi izin, cuti, dan lembur (lihat [izin-cuti-lembur.md](izin-cuti-lembur.md))
- [ ] Data absensi ke penggajian (lihat [penggajian.md](penggajian.md))

## Data
`work_locations`, `work_schedules`, `attendance_records`, `attendance_exceptions`, `work_reports`, bucket `attendance-photos`, `work-attachments`.

## Test
pgTAP `07_attendance`, `09_work_reports`, `13_role_schedules`. E2E `e2e/absensi/`, `e2e/owner/kehadiran.spec.ts`, `jam-kerja.spec.ts`.

## Risiko teknis
- Akurasi GPS di lapangan bisa 50 sampai 100 m. Geofence memperhitungkan `accuracy_m`, dan di luar radius bisa diajukan.
- Kuota Storage 1 GB. Selfie dikompres ke 150 KB. Batas foto laporan lapangan masih terbuka (usulan: 150 KB per foto, maksimal 6 foto, foto yang tidak dipakai website dihapus 3 bulan setelah laporan disetujui).
