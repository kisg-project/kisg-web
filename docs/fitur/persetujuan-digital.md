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

- 23 November 2026: persetujuan berjenjang mengikuti struktur jabatan. Kalau jabatan di tengah rantai belum terisi, dokumen langsung naik ke jabatan di atasnya. Persetujuan tidak boleh berhenti di jabatan yang kosong.

## Aturan rantai persetujuan
Setiap jenis dokumen punya daftar langkah, misalnya PRA: atasan langsung, manajer departemen, keuangan (verifikasi), Direktur Utama. Saat dokumen diajukan dan setiap kali satu langkah selesai, sistem mencari penyetuju langkah berikutnya:

1. Cari pemegang aktif jabatan itu di departemen atau proyek pengaju.
2. Langkah dilewati otomatis kalau:
   - jabatannya kosong;
   - pemegangnya nonaktif;
   - pemegangnya adalah pengaju sendiri;
   - pemegangnya sudah menandatangani langkah sebelumnya untuk dokumen yang sama.
3. Kalau pemegang sedang cuti atau izin dan punya delegasi, dokumen ke delegasinya. Tanpa delegasi, langkah naik ke atasannya.
4. Kalau semua langkah di atasnya juga kosong, dokumen berakhir di Direktur Utama, yang selalu ada.
5. Setiap langkah yang dilewati tercatat di riwayat dan di PDF, misalnya "Manajer Marketing dilewati: jabatan belum terisi".
6. Kalau penyetuju tidak bertindak dalam batas waktu per jenis dokumen, sistem mengirim pengingat. Setelah batas kedua, dokumen naik ke atasannya (eskalasi), juga tercatat.
7. Saat jabatan yang tadinya kosong terisi, dokumen yang sudah melewati jabatan itu tidak ditarik kembali. Aturan baru hanya berlaku untuk langkah yang belum berjalan.
8. Pengaju tidak pernah menyetujui dokumennya sendiri, dan setiap tanda tangan tetap memakai sidik jari.

Aturan ini berlaku untuk semua alur persetujuan: pengajuan dana (PRA, PR, RMBS, ADV, SETT), izin, cuti, lembur, absen di luar lokasi, booking dan diskon, Analisa Konsumen, gaji, kontrak, SPK, opname, PO, dan dokumen lain.

## Cakupan
Persetujuan
- [ ] Rantai persetujuan per jenis dokumen yang diatur owner, dengan langkah jabatan dan langkah fungsi (keuangan, HR)
- [ ] Lewati otomatis jabatan kosong, nonaktif, atau pengaju sendiri, naik ke atasan, berakhir di Direktur Utama
- [ ] Delegasi saat cuti dan eskalasi saat lewat batas waktu
- [ ] Riwayat langkah yang dilewati di halaman dokumen dan PDF
- [x] Tabel `approval_stamps` tanpa policy tulis, trigger menolak update dan delete
- [x] Fungsi keputusan hanya dari server setelah verifikasi
- [x] Halaman publik `/verifikasi/[kode]` (noindex) yang menghitung ulang hash
- [x] Sidik jari WebAuthn wajib, reset oleh Direktur Utama, dialog arahan pendaftaran
- [x] Cap KIS hanya untuk persetujuan atasan
- [ ] Matriks per nominal, kategori, atau proyek di atas rantai jabatan (misal PR cukup sampai keuangan)
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
