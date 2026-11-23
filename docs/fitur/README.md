# Katalog fitur KIS Group Platform

Satu file per fitur. Setiap file memakai format yang sama:

1. Tujuan
2. Keputusan owner (bertanggal, satu-satunya sumber kebenaran untuk aturan fitur itu)
3. Cakupan lengkap (checklist: `[x]` sudah tayang, `[ ]` belum)
4. Aturan bisnis dan alur status
5. Data (tabel, fungsi, bucket)
6. Test (pgTAP, unit, E2E)
7. Risiko teknis
8. Data yang dibutuhkan dari owner

Aturan kerja:
- Sebelum mengerjakan sebuah fitur, baca file fiturnya dan file yang ditautkan.
- Tanpa MVP dan tanpa versi bertahap (keputusan owner, 23 November 2026). Fitur dianggap selesai saat semua checklist di filenya tercentang dan CI hijau.
- Setiap PR yang menyelesaikan butir checklist wajib mencentangnya di file fitur yang sama, di PR yang sama.
- Keputusan owner baru ditulis di file fitur yang bersangkutan, lengkap dengan tanggalnya. Aturan lintas fitur ditulis di `CLAUDE.md`.
- Referensi lintas fitur: [`../data-model.md`](../data-model.md), [`../e2e-coverage.md`](../e2e-coverage.md), [`../brand.md`](../brand.md), [`../architecture.md`](../architecture.md), [`../ci-cd.md`](../ci-cd.md), [`../TODO-DATA.md`](../TODO-DATA.md).

## Daftar fitur

| No | Fitur | File | Status |
|---|---|---|---|
| 1 | Website publik | [website.md](website.md) | Sebagian tayang |
| 2 | Landing page iklan | [landing-page.md](landing-page.md) | Belum |
| 3 | Integrasi Meta | [meta.md](meta.md) | Belum |
| 4 | Chat Jaka | [chat-jaka.md](chat-jaka.md) | Tahap dasar tayang |
| 5 | Panel CMS | [cms.md](cms.md) | Sebagian tayang |
| 6 | Akun dan keamanan | [akun-keamanan.md](akun-keamanan.md) | Sebagian tayang |
| 7 | Platform PWA (navigasi, realtime, notifikasi, offline, ekspor) | [platform-pwa.md](platform-pwa.md) | Sebagian tayang |
| 8 | Persetujuan digital, stempel, e-Meterai | [persetujuan-digital.md](persetujuan-digital.md) | Sebagian tayang |
| 9 | Absensi dan laporan harian | [absensi.md](absensi.md) | Sebagian tayang |
| 10 | Dashboard Direktur Utama | [dashboard-owner.md](dashboard-owner.md) | Sebagian tayang |
| 11 | HR dan karyawan | [hr.md](hr.md) | Sebagian tayang |
| 12 | Izin, cuti, lembur | [izin-cuti-lembur.md](izin-cuti-lembur.md) | Belum |
| 13 | Penggajian | [penggajian.md](penggajian.md) | Belum |
| 14 | Pra-proyek dan lahan | [pra-proyek.md](pra-proyek.md) | Belum |
| 15 | Produk, kavling, price list | [produk-kavling.md](produk-kavling.md) | Belum |
| 16 | CRM dan penjualan | [crm-penjualan.md](crm-penjualan.md) | Distribusi lead dalam proses |
| 17 | Agen dan broker | [agen-broker.md](agen-broker.md) | Belum |
| 18 | Marketing dan KPI | [marketing-kpi.md](marketing-kpi.md) | Belum |
| 19 | Konstruksi dan lapangan | [konstruksi.md](konstruksi.md) | Belum |
| 20 | Legal dan sertifikat | [legal-sertifikat.md](legal-sertifikat.md) | Belum |
| 21 | Expense dan pembelian | [expense-pembelian.md](expense-pembelian.md) | Belum |
| 22 | Keuangan dan akuntansi | [keuangan-akuntansi.md](keuangan-akuntansi.md) | Belum |
| 23 | Portal konsumen | [portal-konsumen.md](portal-konsumen.md) | Belum |
| 24 | After-sales dan estate | [after-sales-estate.md](after-sales-estate.md) | Belum |
| 25 | Administrasi kantor | [administrasi.md](administrasi.md) | Belum |
| 26 | Integrasi eksternal | [integrasi-eksternal.md](integrasi-eksternal.md) | Sebagian |
| 27 | Infrastruktur dan rilis | [infrastruktur.md](infrastruktur.md) | Berjalan |

## Urutan kerja

Urutan mengikuti ketergantungan data. Fitur di urutan atas dipakai fitur di bawahnya.

1. CRM dan penjualan: distribusi lead (PR #46), lalu sisa cakupan CRM.
2. Produk, kavling, price list (dibutuhkan booking).
3. Agen dan broker.
4. HR dan karyawan, izin, cuti, lembur, penggajian.
5. Expense dan pembelian, keuangan dan akuntansi.
6. Konstruksi dan lapangan, legal dan sertifikat.
7. Pra-proyek dan lahan.
8. Portal konsumen, after-sales dan estate.
9. Administrasi kantor.
10. Landing page, integrasi Meta, Chat Jaka lanjutan, CMS lengkap.
11. Dashboard Direktur Utama lengkap (menggabungkan semua modul), infrastruktur rilis.

Owner bisa memajukan fitur mana pun. Ubah urutan ini kalau owner meminta.
