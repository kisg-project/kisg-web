# Izin, cuti, dan lembur

## Tujuan
Pengajuan ketidakhadiran dan lembur yang otomatis memengaruhi absensi dan gaji.

## Keputusan owner
- Persetujuan memakai tanda tangan digital (sidik jari). Hasilnya otomatis masuk ke absensi dan penggajian.

## Cakupan
- [ ] Jenis izin dan cuti yang bisa diatur: cuti tahunan, sakit (lampiran surat dokter), izin, cuti melahirkan, cuti penting, dinas luar, tanpa upah
- [ ] Saldo cuti per karyawan: hak tahunan, prorata karyawan baru, sisa tahun lalu dan kedaluwarsanya
- [ ] Pengajuan dari PWA dengan lampiran, persetujuan atasan lalu HR atau owner sesuai aturan
- [ ] Kalender tim: siapa izin atau cuti hari ini dan minggu ini
- [ ] Lembur: pengajuan sebelum lembur, realisasi jam dari absensi, persetujuan, perhitungan upah lembur sesuai aturan ketenagakerjaan
- [ ] Batal dan ubah pengajuan sebelum disetujui
- [ ] Hari yang disetujui tidak dihitung alpa di absensi
- [ ] Laporan izin, cuti, lembur per periode, ekspor PDF dan Excel
- [ ] Notifikasi setiap langkah ke penyetuju dan pengaju

## Data
Tabel baru (rencana): `leave_types`, `leave_balances`, `leave_requests`, `overtime_requests`.
