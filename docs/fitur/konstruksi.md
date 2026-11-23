# Konstruksi dan lapangan

## Tujuan
Pembangunan setiap unit terpantau dari RAB sampai serah terima, dengan biaya dan progres yang nyata.

## Cakupan
Perencanaan
- [ ] RAB per tipe (pekerjaan, volume, harga satuan, material), diturunkan ke RAB per unit
- [ ] WBS dan jadwal proyek: Gantt, kurva S rencana dan realisasi
- [ ] Prasarana dan fasum: jalan, drainase, listrik, air, taman, dengan RAB sendiri

Pelaksanaan
- [ ] SPK mandor atau kontraktor per unit atau paket pekerjaan, PDF bermeterai
- [ ] Laporan harian lapangan: cuaca, tenaga kerja, alat, pekerjaan selesai, foto (dikompres), kendala
- [ ] Progres per unit per tahap pekerjaan dengan foto, disetujui site manager
- [ ] Opname progres, lalu termin pembayaran kontraktor dengan retensi (lihat [expense-pembelian.md](expense-pembelian.md))
- [ ] Permintaan material dari lapangan, penerimaan di lokasi dengan foto, pemakaian material per unit
- [ ] Checklist QC per tahap pekerjaan dengan foto bukti
- [ ] Kendala dan perubahan pekerjaan (addendum) dengan persetujuan dan dampak biaya
- [ ] K3: insiden, inspeksi, APD

Serah terima
- [ ] Daftar cacat (defect list) sebelum serah terima kunci, perbaikan dengan foto sebelum dan sesudah
- [ ] Siap serah terima ke konsumen (terhubung ke BAST di [crm-penjualan.md](crm-penjualan.md))
- [ ] Serah terima PSU (fasos dan fasum) ke pemda

Laporan dan website
- [ ] Laporan progres per proyek dan unit, unit terlambat, biaya RAB dibanding realisasi
- [ ] Progres yang disetujui bisa terbit ke website (`construction_updates`) dan portal konsumen

## Data
`construction_updates` (konten website). Tabel baru (rencana): `rab_items`, `work_packages`, `contracts_spk`, `daily_site_reports`, `unit_progress`, `opname`, `qc_checklists`, `defects`, `site_issues`.

## Risiko teknis
- Kuota Storage 1 GB: foto lapangan dikompres ke 300 KB (usulan 150 KB, maksimal 6 foto per laporan, foto yang tidak terbit dihapus 3 bulan setelah disetujui).

## Data dari owner
- RAB per tipe (Excel), daftar mandor atau kontraktor, struktur tahap pekerjaan.
