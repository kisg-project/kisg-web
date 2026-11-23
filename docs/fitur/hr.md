# HR dan karyawan

## Tujuan
Seluruh data dan siklus karyawan, dari lamaran sampai keluar, setara Mekari Talenta.

## Keputusan owner
- 22 November 2026: halaman karyawan mengikuti referensi "Employment" (tab status, cari, filter role, halaman).
- Data sensitif (rekening, NPWP, BPJS) hanya terlihat oleh keuangan, owner, dan karyawan itu sendiri.
- NIP otomatis (misal `KIS-2026-0001`) dan kartu pegawai digital.

## Cakupan
Direktori dan profil
- [x] Direktori karyawan: tab status, cari, filter role, halaman, undang, ubah role, nonaktifkan, reset sidik jari
- [ ] Profil kerja: jabatan, departemen, status (tetap, kontrak, harian, magang), tanggal masuk, atasan langsung, lokasi kerja
- [ ] Data pribadi: tanggal lahir, alamat, kontak darurat, pendidikan, keluarga (untuk BPJS dan PPh)
- [ ] Data sensitif: rekening bank, NPWP, BPJS Kesehatan dan Ketenagakerjaan
- [ ] Dokumen karyawan di bucket privat (KTP, KK, ijazah, kontrak) dengan masa berlaku
- [ ] Struktur organisasi dan bagan, tim, atasan
- [ ] NIP otomatis, kartu pegawai digital dengan QR, PDF ukuran kartu CR80, kolom UID RFID

Siklus karyawan
- [ ] Rekrutmen: lowongan dari CMS, lamaran dari website, tahap seleksi, jadwal wawancara, catatan penilaian, offering letter PDF, lalu jadi akun karyawan
- [ ] Onboarding: checklist (dokumen, akun, aset, pengenalan), offboarding: checklist, serah terima aset, exit interview
- [ ] Kontrak kerja PDF bermeterai, riwayat kontrak, pengingat kontrak habis 30 hari sebelumnya
- [ ] Mutasi, promosi, perubahan gaji dengan persetujuan dan riwayat
- [ ] Penilaian kinerja periodik (KPI dan kompetensi), dihubungkan ke [marketing-kpi.md](marketing-kpi.md)
- [ ] Surat peringatan (SP1 sampai SP3) dengan masa berlaku
- [ ] Pelatihan dan sertifikasi dengan masa berlaku
- [ ] Aset yang dipegang karyawan (laptop, HP, kendaraan), terhubung ke [administrasi.md](administrasi.md)
- [ ] Surat keterangan kerja dan surat lain dari template, bernomor
- [ ] Pengumuman perusahaan dengan tanda sudah dibaca

## Data
`profiles`, `user_roles`, `teams`, `team_members`. Tabel baru (rencana): `employee_profiles`, `employee_documents`, `employment_contracts`, `positions`, `departments`, `recruitment_*`, `performance_reviews`, `warning_letters`, `trainings`.

## Test
`e2e/owner/karyawan.spec.ts`.

## Data dari owner
- Struktur jabatan dan departemen, status kerja tiap karyawan, apakah memakai kartu RFID fisik.
