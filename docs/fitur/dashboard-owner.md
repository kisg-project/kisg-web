# Dashboard Direktur Utama

## Tujuan
Satu layar untuk memantau seluruh perusahaan: orang, penjualan, uang, dan pembangunan.

## Keputusan owner
- 22 November 2026: tata letak mengikuti referensi owner (jam kerja, persetujuan, tabel kehadiran, jadwal), warna pastel.

## Cakupan
- [x] Widget jam kerja hari ini, persetujuan menunggu, tabel kehadiran dengan pencarian, jadwal
- [x] Grafik kehadiran kotak pastel dan laporan harian (cincin persen, petak per hari)
- [x] Shortcut fitur di HP
- [ ] Penjualan: unit terjual per bulan, kecepatan terjual, absorption rate, stok unit per status, nilai booking, funnel lead
- [ ] Marketing: lead per sumber, CPL, respons rata-rata, peringkat marketing
- [ ] Keuangan: saldo kas dan bank, piutang konsumen dan umurnya, hutang supplier, arus kas proyeksi, anggaran dibanding realisasi per proyek
- [ ] Konstruksi: progres per proyek dan per unit (kurva S), unit terlambat, kendala terbuka
- [ ] SDM: kehadiran, izin dan cuti hari ini, kontrak akan habis
- [ ] Inbox persetujuan semua modul
- [ ] Peringatan otomatis: anggaran lewat, SLA lead lewat, tagihan jatuh tempo, izin usaha kedaluwarsa
- [ ] Filter periode dan proyek, drill-down sampai data mentah, ekspor PDF dan Excel

## Test
`e2e/owner/dashboard.spec.ts`.
